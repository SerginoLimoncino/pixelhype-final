import { PRENOTAZIONI } from "./modo";
import Stripe from "stripe";
import { sql, prepara, pixelVenduti, caloPrezzo, assegnaPosizione, postoLibero, riservaPosto } from "./db";
import { PACCHETTI, SOGLIA_ASTE, CUORE_ASTE, FINALE, prezzoPacchetto, charm } from "./prezzi";
import { mappaCuore, RISERVA_FINALE, ULTIMO_PEZZO } from "./mappa";

// Automatic auctions (Sergio's rules, 2026-10-10). Nobody has to do anything by hand:
// - from the start (0-1,000 sold) 4 small auctions outside the Cuore;
// - every 1,000 pixel sold (1,000 ... 8,000) auctions in the Cuore (2 at 1,000, then 3), each with a "twin" of the
//   same size outside the Cuore (base 40% lower); one pair opens per week, each lasts 7 days;
// - at 9,000 the grand finale: the last 12 pieces open together, 6 in the Cuore and 6 outside (in the places
//   kept free over the mosaic, lib/mappa.js), base 30% (Cuore) or 40% (outside) below the normal price; the other Cuore spaces are then
//   sold at a fixed price (see prezzoCuore), so the mosaic closes;
// - an auction shows where its space will go: Cuore and finale places are fixed, a twin gets its place when it opens;
// - base = normal price of that size at that moment, 30% lower in the Cuore, 40% lower outside (grand finale too);
// - bidders save their card with Stripe; at the end the highest bid is charged, if it fails the next one;
// - no bids during the stages: the Cuore space comes back at the finale (auction or fixed price); in the grand finale auctions last 3 days
//   and restart with the base 10% lower until someone bids.
// Everything moves forward when someone opens the site (and once a day from Vercel).

const GIORNO = 24 * 3600 * 1000;
const DURATA = 7 * GIORNO;
const DURATA_FINALE = 3 * GIORNO; // grand finale auctions last 3 days
const RIBASSO = 0.1; // grand finale: every round without bids the base drops 10%
const OGNI = 7 * GIORNO; // a new Cuore auction (with its twin) every week
const SCONTO_FUORI = 0.4; // every auction outside the Cuore: 40% below, or people just buy directly
const SCONTO_CUORE = 0.3; // every Cuore auction starts 30% below the normal price, finale included (Sergio, 2026-10-11)
const ULTIMI_MINUTI = 5 * 60 * 1000; // a bid in the last 5 minutes extends the auction by 5 minutes
const APERTE_FINALE = 6; // grand finale (Sergio, 2026-10-11): 6 in the Cuore and 6 outside, all open together

// Which Cuore spaces a stage unlocks (Sergio, 2026-10-11: many small auctions, few big ones far apart; 50 and 100
// pixel only from 5,000 sold). Each one has its twin outside. Stage 0 has only the 4 auctions outside.
// Grand finale (6 + 6): the last big pieces of the Cuore, 100, 50, 25, two of 10 and one of 4 pixel.
const PRIME_FUORI = [1, 2, 4, 10];
const STELLA = { 1: [1, 2], 2: [1, 2, 4], 3: [2, 4, 10], 4: [4, 10, 25], 5: [4, 10, 50], 6: [10, 25, 100], 7: [2, 4, 25], 8: [1, 4, 10] };
const FINALE_CUORE = [[100, 1], [50, 1], [25, 1], [10, 2], [4, 1]];
function gruppo(t, presi) {
  const resto = {};
  mappaCuore().filter((s) => !presi.has(s.x + "," + s.y)).sort(() => Math.random() - 0.5).forEach((s) => (resto[s.pack] ||= []).push(s));
  const prendi = (n, q) => (resto[n] || []).splice(0, q);
  if (t < 9) return STELLA[t].flatMap((n) => prendi(n, 1));
  const scelti = FINALE_CUORE.flatMap(([n, q]) => prendi(n, q));
  // If a size has run out, the next biggest spaces left take its turn: always 6 in the finale.
  const altri = Object.values(resto).flat().filter((s) => s.pack >= 4).sort((a, b) => b.pack - a.pack);
  return [...scelti, ...altri.slice(0, Math.max(0, APERTE_FINALE - scelti.length))].sort((a, b) => b.pack - a.pack);
}

let tabelle = null;
export function preparaAste() {
  return (tabelle ||= (async () => {
    await prepara();
    await sql()`create table if not exists aste (
      id serial primary key, zona text not null, pack int not null, x int, y int, tappa int not null,
      inizio timestamptz not null, fine timestamptz, base int, stato text not null default 'attesa', spazio int
    )`;
    await sql()`create table if not exists offerte (
      id serial primary key, asta int not null, creato timestamptz not null default now(), stato text not null default 'in_attesa',
      nome text not null, link text not null, email text not null, img text, dubbio boolean not null default false,
      importo int not null, cliente text, carta text, stripe_session text
    )`;
    await sql()`alter table aste add column if not exists ribassi int not null default 0`;
    await sql()`alter table offerte add column if not exists chiave text`;
  })().catch((e) => { tabelle = null; throw e; }));
}

export const asteAperte = (venduti) => !PRENOTAZIONI && venduti >= SOGLIA_ASTE;

// Smallest valid bid: the base, or the best bid + about 5% (at least 10 €).
export const minimo = (a, migliore) => (migliore ? migliore + Math.max(10, Math.ceil((migliore * 0.05) / 10) * 10) : a.base);

// Moves everything forward: unlocks stages, opens and closes auctions. Safe to call any time.
export async function aggiornaAste() {
  await sistemaOrdini().catch(() => {});
  const venduti = await pixelVenduti();
  if (!asteAperte(venduti)) return;
  await preparaAste();
  const tappa = venduti >= FINALE ? 9 : Math.min(8, Math.floor(venduti / 1000));

  await sql().begin(async (t) => {
    await t`select pg_advisory_xact_lock(4243)`;
    const [{ fatta }] = await t`select coalesce(max(tappa), -1)::int as fatta from aste`;
    if (fatta >= tappa) return;
    const [{ ultimo }] = await t`select max(inizio) as ultimo from aste where tappa < 9`;
    let quando = Math.max(Date.now(), ultimo ? new Date(ultimo).getTime() + OGNI : 0);
    // Stage auctions that ended without bids: at the finale their Cuore space is free again (auction or fixed price).
    if (tappa >= 9) await t`update aste set stato = 'annullata' where stato = 'rinviata'`;
    const presi = new Set((await t`select x, y from aste where zona = 'cuore' and stato <> 'annullata'`).map((r) => r.x + "," + r.y));
    for (const s of await t`select x, y from spazi where x >= 35 and x < 65 and y >= 35 and y < 65`) presi.add(s.x + "," + s.y);
    for (let k = fatta + 1; k <= tappa; k++) {
      if (k === 0) for (const n of PRIME_FUORI) {
        await t`insert into aste (zona, pack, tappa, inizio) values ('fuori', ${n}, 0, ${new Date(quando)})`;
        quando += OGNI;
      }
      if (k === 0) continue;
      for (const s of gruppo(k, presi)) {
        presi.add(s.x + "," + s.y);
        const inizio = new Date(quando);
        await t`insert into aste (zona, pack, x, y, tappa, inizio) values ('cuore', ${s.pack}, ${s.x}, ${s.y}, ${k}, ${inizio})`;
        if (k < 9) await t`insert into aste (zona, pack, tappa, inizio) values ('fuori', ${s.pack}, ${k}, ${inizio})`;
        if (k < 9) quando += OGNI; // the grand finale has no dates: all 12 open together, without twins
      }
      // Grand finale outside the Cuore: the 10 places kept around it from the start.
      if (k === 9) for (const s of RISERVA_FINALE) {
        await t`insert into aste (zona, pack, x, y, tappa, inizio) values ('fuori', ${s.pack}, ${s.x}, ${s.y}, 9, ${new Date(quando)})`;
      }
    }
  });

  // L'Ultimo Pezzo: when every grand finale auction is over, the last auction of the mosaic appears.
  if (venduti >= FINALE) await sql().begin(async (t) => {
    await t`select pg_advisory_xact_lock(4243)`;
    const [r] = await t`select count(*) filter (where tappa = 9)::int as fin, count(*) filter (where tappa = 9 and stato not in ('chiusa', 'annullata'))::int as aperte,
      count(*) filter (where tappa = 10)::int as ultimo from aste`;
    if (r.fin > 0 && r.aperte === 0 && r.ultimo === 0)
      await t`insert into aste (zona, pack, x, y, tappa, inizio) values ('ultimo', 150, ${ULTIMO_PEZZO.x}, ${ULTIMO_PEZZO.y}, 10, now())`;
  });

  // Open the auctions whose day has come, with the price of today. Grand finale: at most 10 open per zone.
  const finale = venduti >= FINALE;
  const aperte = { cuore: 0, fuori: 0, ultimo: 0 };
  for (const r of await sql()`select zona, count(*)::int as n from aste where stato in ('aperta', 'chiusura') group by zona`) aperte[r.zona] = r.n;
  for (const a of await sql()`select * from aste where stato = 'attesa' and inizio <= now() order by inizio, id`) {
    if (finale && aperte[a.zona] >= APERTE_FINALE) continue;
    aperte[a.zona]++;
    if (a.zona === "fuori" && a.x === null) await riservaPosto(a.id, a.pack);
    const normale = prezzoPacchetto(a.pack, venduti, await caloPrezzo(venduti));
    const sconto = a.zona === "fuori" ? SCONTO_FUORI : SCONTO_CUORE;
    const base = charm(normale * (1 - sconto) * (1 - RIBASSO) ** a.ribassi);
    await sql()`update aste set stato = 'aperta', base = ${base}, fine = ${new Date(Date.now() + (finale && a.zona !== "ultimo" ? DURATA_FINALE : DURATA))} where id = ${a.id} and stato = 'attesa'`;
  }

  // Close the finished ones (each one claimed once, even if two visitors arrive together).
  for (const a of await sql()`select id from aste where stato = 'aperta' and fine <= now()`) {
    const [presa] = await sql()`update aste set stato = 'chiusura' where id = ${a.id} and stato = 'aperta' returning *`;
    if (presa) await chiudi(presa).catch(async () => { await sql()`update aste set stato = 'aperta' where id = ${a.id}`; });
  }
}

// The highest bid pays; if the card is refused, the next one; nobody: the auction comes back later.
async function chiudi(a) {
  const chiave = process.env.STRIPE_SECRET_KEY;
  const stripe = chiave ? new Stripe(chiave) : null;
  const offerte = await sql()`select * from offerte where asta = ${a.id} and stato = 'valida' order by importo desc, id`;
  // Outside the Cuore the winner needs a free place: if the grid is full, nobody is charged.
  if (a.zona === "fuori" && a.x === null && !(await postoLibero(PACCHETTI[a.pack].w, PACCHETTI[a.pack].h))) {
    await sql()`update aste set stato = 'annullata' where id = ${a.id}`;
    return;
  }
  const fuori = new Set();
  for (const o of offerte) {
    if (fuori.has(o.chiave) || fuori.has(o.email.toLowerCase())) continue;
    let pagata = !stripe; // without Stripe (test mode) the winner counts as paid
    if (stripe && o.cliente && o.carta) {
      const pi = await stripe.paymentIntents.create({
        amount: o.importo * 100, currency: "eur", customer: o.cliente, payment_method: o.carta,
        off_session: true, confirm: true, description: `PixelHype · asta ${a.id} · ${PACCHETTI[a.pack].titolo}`,
        metadata: { asta: String(a.id), offerta: String(o.id) },
      }, { idempotencyKey: `asta-${a.id}-offerta-${o.id}` }).catch(() => null);
      pagata = pi?.status === "succeeded";
    }
    if (!pagata) {
      // The card did not work: all of this bidder's bids are out, so nobody can win with a fake high bid
      // and then fall back on their own lower one.
      await sql()`update offerte set stato = 'rifiutata' where asta = ${a.id} and stato = 'valida' and (id = ${o.id} or chiave = ${o.chiave} or lower(email) = lower(${o.email}))`;
      if (o.chiave) fuori.add(o.chiave);
      fuori.add(o.email.toLowerCase());
      continue;
    }
    const p = PACCHETTI[a.pack];
    const stato = "online"; // doubtful images go online too; Sergio hides them from the panel if needed (2026-10-11)
    const [s] = await sql()`insert into spazi (pack, w, h, x, y, stato, nome, link, email, img, prezzo)
      values (${p.n}, ${p.w}, ${p.h}, ${a.x}, ${a.y}, ${a.x !== null ? stato : "in_attesa"}, ${o.nome}, ${o.link}, ${o.email}, ${o.img}, ${o.importo}) returning id`;
    if (a.zona === "fuori" && a.x === null) await assegnaPosizione(s.id, stato);
    await sql()`update offerte set stato = 'pagata' where id = ${o.id}`;
    await sql()`update aste set stato = 'chiusa', spazio = ${s.id} where id = ${a.id}`;
    return;
  }
  // No bids (or no card worked). During the stages the space is kept aside for the grand finale;
  // in the grand finale it starts again right away, with the base 10% lower each time.
  if ((await pixelVenduti()) < FINALE) {
    await sql()`update aste set stato = 'rinviata', fine = null, base = null, x = case when zona = 'fuori' then null else x end where id = ${a.id}`;
  } else {
    await sql()`update aste set stato = 'attesa', inizio = now(), fine = null, base = null, ribassi = ribassi + 1, x = case when zona = 'fuori' and tappa < 9 then null else x end where id = ${a.id}`;
  }
}

// Orders whose buyer paid but closed the page before coming back get their place anyway;
// orders never paid (Stripe page abandoned) are deleted after a day, so the panel stays clean.
export async function sistemaOrdini() {
  const chiave = process.env.STRIPE_SECRET_KEY;
  if (!chiave) return;
  const stripe = new Stripe(chiave);
  const ordini = await sql()`select id, stripe_session from spazi where stato = 'in_attesa' and x is null and stripe_session is not null and creato < now() - interval '3 minutes' order by id limit 20`;
  for (const o of ordini) {
    const s = await stripe.checkout.sessions.retrieve(o.stripe_session).catch(() => null);
    if (!s) continue;
    if (s.payment_status === "paid") await assegnaPosizione(o.id, "online").catch(() => {});
    else if (s.status === "expired") await sql()`delete from spazi where id = ${o.id} and x is null`;
  }
}

// Never let the auctions slow down a page: at most 8 seconds, then the page goes on.
export const aggiornaAstePresto = () => Promise.race([aggiornaAste(), new Promise((ok) => setTimeout(ok, 8000))]).catch(() => {});

export async function listaAste() {
  await preparaAste();
  const aperte = await sql()`select a.*, (select max(importo) from offerte o where o.asta = a.id and o.stato = 'valida')::int as migliore,
    (select count(*) from offerte o where o.asta = a.id and o.stato = 'valida')::int as offerte
    from aste a where a.stato in ('aperta', 'chiusura') order by a.fine, a.id`;
  const [{ prossime }] = await sql()`select count(*)::int as prossime from aste where stato = 'attesa'`;
  const [{ chiuse }] = await sql()`select count(*)::int as chiuse from aste where stato = 'chiusa'`;
  const finite = await sql()`select a.*, (select max(importo) from offerte o where o.asta = a.id and o.stato = 'pagata')::int as vinta
    from aste a where a.stato = 'chiusa' order by a.fine desc limit 6`;
  return { aperte, prossime, chiuse, finite };
}

export async function unaAsta(id) {
  await preparaAste();
  const [a] = await sql()`select a.*, (select max(importo) from offerte o where o.asta = a.id and o.stato = 'valida')::int as migliore,
    (select count(*) from offerte o where o.asta = a.id and o.stato = 'valida')::int as offerte from aste a where a.id = ${id}`;
  return a || null;
}

// Each bidder gets a secret key (kept in their browser): with it they can raise or withdraw with one click.
export async function nuovaOfferta(o) {
  await preparaAste();
  const chiave = crypto.randomUUID();
  const [r] = await sql()`insert into offerte (asta, nome, link, email, img, dubbio, importo, chiave)
    values (${o.asta}, ${o.nome}, ${o.link}, ${o.email}, ${o.img}, ${o.dubbio}, ${o.importo}, ${chiave}) returning id`;
  return r.id;
}

// The bidder's situation in an auction, found by their key.
export async function laMiaOfferta(asta, chiave) {
  await preparaAste();
  if (!chiave) return null;
  const [m] = await sql()`select * from offerte where asta = ${asta} and chiave = ${chiave} and stato = 'valida' order by importo desc limit 1`;
  if (!m) return null;
  const a = await unaAsta(asta);
  return { nome: m.nome, link: m.link, img: m.img, importo: m.importo, inTesta: a.migliore === m.importo, migliore: a.migliore, min: minimo(a, a.migliore), aperta: a.stato === "aperta" && new Date(a.fine) > new Date() };
}

// One-click raise: a new bid with the same brand, image and saved card.
export async function rilancia(asta, chiave, importo) {
  await preparaAste();
  const [m] = chiave ? await sql()`select * from offerte where asta = ${asta} and chiave = ${chiave} and stato = 'valida' order by importo desc limit 1` : [];
  if (!m) return { ok: false, motivo: "Offerta non trovata." };
  const [r] = await sql()`insert into offerte (asta, nome, link, email, img, dubbio, importo, cliente, carta, chiave)
    values (${asta}, ${m.nome}, ${m.link}, ${m.email}, ${m.img}, ${m.dubbio}, ${importo}, ${m.cliente}, ${m.carta}, ${chiave}) returning id`;
  return confermaOfferta(r.id, {});
}

// Withdraw: allowed only when someone else is ahead (the first bid must stay, or prices could be faked).
export async function ritirati(asta, chiave) {
  const mia = await laMiaOfferta(asta, chiave);
  if (!mia) return { ok: false, motivo: "Offerta non trovata." };
  if (mia.inTesta) return { ok: false, motivo: "Sei in testa: chi ha l'offerta più alta non può ritirarsi. Potrai farlo se qualcuno offre di più." };
  await sql()`update offerte set stato = 'ritirata' where asta = ${asta} and chiave = ${chiave} and stato = 'valida'`;
  return { ok: true };
}

// Card saved: the bid becomes valid, if it is still high enough and the auction is still open.
// A bid in the last minutes extends the auction, so nobody wins by sniping at the last second.
export async function confermaOfferta(id, campi) {
  await preparaAste();
  return sql().begin(async (t) => {
    await t`select pg_advisory_xact_lock(4244)`;
    const [o] = await t`select * from offerte where id = ${id}`;
    if (!o) return { ok: false, motivo: "Offerta non trovata." };
    if (o.stato === "valida" || o.stato === "pagata") return { ok: true, o, asta: o.asta };
    // Already settled (outbid, refused, withdrawn...): reloading the page must never change it.
    if (o.stato !== "in_attesa") return { ok: false, motivo: "Offerta non trovata.", asta: o.asta };
    const [a] = await t`select * from aste where id = ${o.asta}`;
    const [{ migliore }] = await t`select max(importo)::int as migliore from offerte where asta = ${o.asta} and stato = 'valida'`;
    if (!a || a.stato !== "aperta" || new Date(a.fine) <= new Date()) {
      await t`update offerte set stato = 'scaduta' where id = ${id}`;
      return { ok: false, motivo: "L'asta si è chiusa prima che la tua offerta arrivasse. Non ti verrà addebitato nulla." };
    }
    if (o.importo < minimo(a, migliore)) {
      await t`update offerte set stato = 'superata' where id = ${id}`;
      return { ok: false, motivo: "Nel frattempo qualcuno ha offerto di più. Non ti verrà addebitato nulla: puoi rilanciare.", asta: a.id };
    }
    await t`update offerte set ${t({ ...campi, stato: "valida" })} where id = ${id}`;
    if (new Date(a.fine).getTime() - Date.now() < ULTIMI_MINUTI) await t`update aste set fine = ${new Date(Date.now() + ULTIMI_MINUTI)} where id = ${a.id}`;
    return { ok: true, o, asta: a.id };
  });
}

export async function offerta(id) {
  await preparaAste();
  const [o] = await sql()`select * from offerte where id = ${id}`;
  return o || null;
}
