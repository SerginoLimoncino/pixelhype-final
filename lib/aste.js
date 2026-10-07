import Stripe from "stripe";
import { sql, prepara, pixelVenduti, assegnaPosizione, postoLibero } from "./db";
import { PACCHETTI, SOGLIA_ASTE, prezzoPacchetto, charm } from "./prezzi";

// Automatic auctions (Sergio's rules, 2026-10-07). Nobody has to do anything by hand:
// - nothing until SOGLIA_ASTE (1,000) pixel are sold;
// - every 1,000 pixel sold (1,000 ... 8,000) a group of Cuore spaces unlocks, always the same mix;
//   at 9,000 the last spaces and the two 100-pixel blocks (the grand finale);
// - the auctions of a group open one at a time, one a day, and last 7 days;
// - base = normal price of that size at that moment; each Cuore auction has a "twin" of the same size
//   outside the Cuore, base 30% lower;
// - bidders save their card with Stripe; at the end the highest bid is charged, if it fails the next one;
// - no bids: the auction comes back later.
// Everything moves forward when someone opens the site (and once a day from Vercel).

const GIORNO = 24 * 3600 * 1000;
const DURATA = 7 * GIORNO;
const OGNI = GIORNO; // a new Cuore auction every day
const SCONTO_FUORI = 0.3;
const ULTIMI_MINUTI = 5 * 60 * 1000; // a bid in the last 5 minutes extends the auction by 5 minutes

// Fixed map of the Cuore (30 x 30 pixel, from row/column 35): every space has its place.
function mappaCuore() {
  const L = [], add = (n, x, y) => L.push({ pack: n, x: 35 + x, y: 35 + y });
  add(100, 0, 0); add(100, 20, 0);
  for (const y of [0, 5]) for (const x of [10, 15]) add(25, x, y);
  for (const y of [10, 15]) for (const x of [0, 5]) add(25, x, y);
  for (let y = 10; y < 20; y += 2) for (let x = 10; x < 30; x += 5) add(10, x, y);
  for (let y = 20; y < 30; y += 2) for (let x = 0; x < 10; x += 2) add(4, x, y);
  for (let y = 20; y < 30; y++) for (let x = 10; x < 20; x += 2) add(2, x, y);
  for (let y = 20; y < 30; y++) for (let x = 20; x < 30; x++) add(1, x, y);
  return L;
}

// Which Cuore spaces a stage unlocks (Sergio's choice, 2026-10-07): at each stage 2 "star" auctions of a size
// that grows stage by stage (1, 2, 4, 10, 10, 25, 25, 25 pixel), plus about ten small ones (6 of 1 pixel, 4 of 2)
// so the Cuore lights up little by little. Stage 9 (9,000 sold): everything left, the two 100-pixel blocks last.
const STELLA = { 1: 1, 2: 2, 3: 4, 4: 10, 5: 10, 6: 25, 7: 25, 8: 25 };
function gruppo(t, presi) {
  const resto = {};
  mappaCuore().filter((s) => !presi.has(s.x + "," + s.y)).sort(() => Math.random() - 0.5).forEach((s) => (resto[s.pack] ||= []).push(s));
  const prendi = (n, q) => (resto[n] || []).splice(0, q);
  if (t >= 9) return Object.values(resto).flat().sort((a, b) => a.pack - b.pack);
  const stelle = prendi(STELLA[t], 2);
  const piccoli = [...prendi(1, 6), ...prendi(2, 4)].sort(() => Math.random() - 0.5);
  return [stelle[0], ...piccoli, stelle[1]].filter(Boolean); // one star opens the stage, the other closes it
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
  })().catch((e) => { tabelle = null; throw e; }));
}

export const asteAperte = (venduti) => venduti >= SOGLIA_ASTE;

// Smallest valid bid: the base, or the best bid + about 5% (at least 10 €).
export const minimo = (a, migliore) => (migliore ? migliore + Math.max(10, Math.ceil((migliore * 0.05) / 10) * 10) : a.base);

// Moves everything forward: unlocks stages, opens and closes auctions. Safe to call any time.
export async function aggiornaAste() {
  await sistemaOrdini().catch(() => {});
  const venduti = await pixelVenduti();
  if (!asteAperte(venduti)) return;
  await preparaAste();
  const tappa = Math.min(9, Math.floor(venduti / 1000));

  await sql().begin(async (t) => {
    await t`select pg_advisory_xact_lock(4243)`;
    const [{ fatta }] = await t`select coalesce(max(tappa), 0)::int as fatta from aste`;
    if (fatta >= tappa) return;
    const [{ ultimo }] = await t`select max(inizio) as ultimo from aste where zona = 'cuore'`;
    let quando = Math.max(Date.now(), ultimo ? new Date(ultimo).getTime() + OGNI : 0);
    const presi = new Set((await t`select x, y from aste where zona = 'cuore'`).map((r) => r.x + "," + r.y));
    for (let k = fatta + 1; k <= tappa; k++) {
      for (const s of gruppo(k, presi)) {
        presi.add(s.x + "," + s.y);
        const inizio = new Date(quando);
        await t`insert into aste (zona, pack, x, y, tappa, inizio) values ('cuore', ${s.pack}, ${s.x}, ${s.y}, ${k}, ${inizio})`;
        await t`insert into aste (zona, pack, tappa, inizio) values ('fuori', ${s.pack}, ${k}, ${inizio})`;
        quando += k >= 9 ? OGNI / 3 : OGNI; // the grand finale opens 3 a day
      }
    }
  });

  // Open the auctions whose day has come, with the price of today.
  for (const a of await sql()`select * from aste where stato = 'attesa' and inizio <= now() order by id`) {
    const normale = prezzoPacchetto(a.pack, venduti);
    const base = a.zona === "cuore" ? normale : charm(normale * (1 - SCONTO_FUORI));
    await sql()`update aste set stato = 'aperta', base = ${base}, fine = ${new Date(Date.now() + DURATA)} where id = ${a.id} and stato = 'attesa'`;
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
  if (a.zona === "fuori" && !(await postoLibero(PACCHETTI[a.pack].w, PACCHETTI[a.pack].h))) {
    await sql()`update aste set stato = 'annullata' where id = ${a.id}`;
    return;
  }
  for (const o of offerte) {
    let pagata = !stripe; // without Stripe (test mode) the winner counts as paid
    if (stripe && o.cliente && o.carta) {
      const pi = await stripe.paymentIntents.create({
        amount: o.importo * 100, currency: "eur", customer: o.cliente, payment_method: o.carta,
        off_session: true, confirm: true, description: `PixelHype · asta ${a.id} · ${PACCHETTI[a.pack].titolo}`,
        metadata: { asta: String(a.id), offerta: String(o.id) },
      }, { idempotencyKey: `asta-${a.id}-offerta-${o.id}` }).catch(() => null);
      pagata = pi?.status === "succeeded";
    }
    if (!pagata) { await sql()`update offerte set stato = 'rifiutata' where id = ${o.id}`; continue; }
    const p = PACCHETTI[a.pack];
    const stato = o.dubbio ? "da_controllare" : "online";
    const [s] = await sql()`insert into spazi (pack, w, h, x, y, stato, nome, link, email, img, prezzo)
      values (${p.n}, ${p.w}, ${p.h}, ${a.x}, ${a.y}, ${a.zona === "cuore" ? stato : "in_attesa"}, ${o.nome}, ${o.link}, ${o.email}, ${o.img}, ${o.importo}) returning id`;
    if (a.zona === "fuori") await assegnaPosizione(s.id, stato);
    await sql()`update offerte set stato = 'pagata' where id = ${o.id}`;
    await sql()`update aste set stato = 'chiusa', spazio = ${s.id} where id = ${a.id}`;
    return;
  }
  // No bids (or no card worked): the same space goes back in the queue.
  const [{ ultimo }] = await sql()`select max(inizio) as ultimo from aste where zona = ${a.zona}`;
  const inizio = new Date(Math.max(Date.now(), new Date(ultimo).getTime()) + OGNI);
  await sql()`update aste set stato = 'attesa', inizio = ${inizio}, fine = null, base = null where id = ${a.id}`;
}

// Orders whose buyer paid but closed the page before coming back get their place anyway;
// orders never paid (Stripe page abandoned) are deleted after a day, so the panel stays clean.
async function sistemaOrdini() {
  const chiave = process.env.STRIPE_SECRET_KEY;
  if (!chiave) return;
  const stripe = new Stripe(chiave);
  const ordini = await sql()`select id, stripe_session from spazi where stato = 'in_attesa' and x is null and stripe_session is not null and creato < now() - interval '10 minutes' order by id limit 20`;
  for (const o of ordini) {
    const s = await stripe.checkout.sessions.retrieve(o.stripe_session).catch(() => null);
    if (!s) continue;
    if (s.payment_status === "paid") await assegnaPosizione(o.id, s.metadata?.da_controllare === "si" ? "da_controllare" : "online").catch(() => {});
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
  return { aperte, prossime, chiuse };
}

export async function unaAsta(id) {
  await preparaAste();
  const [a] = await sql()`select a.*, (select max(importo) from offerte o where o.asta = a.id and o.stato = 'valida')::int as migliore,
    (select count(*) from offerte o where o.asta = a.id and o.stato = 'valida')::int as offerte from aste a where a.id = ${id}`;
  return a || null;
}

export async function nuovaOfferta(o) {
  await preparaAste();
  const [r] = await sql()`insert into offerte (asta, nome, link, email, img, dubbio, importo)
    values (${o.asta}, ${o.nome}, ${o.link}, ${o.email}, ${o.img}, ${o.dubbio}, ${o.importo}) returning id`;
  return r.id;
}

// Card saved: the bid becomes valid, if it is still high enough and the auction is still open.
// A bid in the last minutes extends the auction, so nobody wins by sniping at the last second.
export async function confermaOfferta(id, campi) {
  await preparaAste();
  return sql().begin(async (t) => {
    await t`select pg_advisory_xact_lock(4244)`;
    const [o] = await t`select * from offerte where id = ${id}`;
    if (!o) return { ok: false, motivo: "Offerta non trovata." };
    if (o.stato === "valida") return { ok: true, o };
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
