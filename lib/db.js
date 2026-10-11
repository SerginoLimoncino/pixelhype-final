import postgres from "postgres";
import { PACCHETTI, limitePack, inVenditaOra, fase, puoScendere } from "./prezzi";
import { mappaCuore, RISERVA_FINALE, ULTIMO_PEZZO } from "./mappa";

// Database (Supabase, connected from Vercel). Without it the site works in demo mode.
// Vercel may add a prefix to the names (e.g. STORAGE_POSTGRES_URL): accept any.
const env = (nome) => process.env[nome] || process.env[Object.keys(process.env).find((k) => k.endsWith("_" + nome)) || ""];
const URL_DB = env("POSTGRES_URL") || process.env.DATABASE_URL;
const SUPA_URL = env("SUPABASE_URL");
const SUPA_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
const BUCKET = "spazi";

export const dbAttivo = () => !!(URL_DB && SUPA_URL && SUPA_KEY);

let _sql = null;
// The address from Vercel ends with extra options (?sslmode=...&supa=...): keep only the address itself.
const senzaOpzioni = (u) => u.split("?")[0];
const base = () => (_sql ||= postgres(senzaOpzioni(URL_DB), { ssl: /localhost|127\.0\.0\.1/.test(URL_DB) ? false : "require", prepare: false, max: 1, connect_timeout: 10, idle_timeout: 20 }));
// Two queries sent together on the one connection hang behind the Supabase pooler (the layout and the page
// both ask the database at the same moment). So every query and transaction waits for the previous one.
let coda = Promise.resolve();
// A stuck query frees the line after 15 seconds, so one problem never blocks the whole site.
const inFila = (fn) => { const p = coda.then(fn, fn); coda = Promise.race([p.catch(() => {}), new Promise((ok) => setTimeout(ok, 15000))]); return p; };
const fila = (s, ...v) => (Array.isArray(s) && s.raw ? inFila(() => base()(s, ...v)) : base()(s, ...v));
fila.begin = (cb) => inFila(() => base().begin(cb));
export const sql = () => fila;

// Creates table and image folder the first time. Safe to call every time.
let pronto = null;
export function prepara() {
  return (pronto ||= (async () => {
    await sql()`create table if not exists spazi (
      id serial primary key,
      creato timestamptz not null default now(),
      stato text not null default 'in_attesa',
      pack int not null, w int not null, h int not null, x int, y int,
      nome text not null, link text not null, email text, img text,
      prezzo int not null default 0, omaggio boolean not null default false,
      stripe_session text unique
    )`;
    await sql()`alter table spazi add column if not exists cuore boolean not null default false`;
    // One row: the current phase, how many weekly price drops in it, and when the last change happened.
    await sql()`create table if not exists listino (id int primary key, fase int not null, calo int not null default 0, dal timestamptz not null default now())`;
    await fetch(`${SUPA_URL}/storage/v1/bucket`, {
      method: "POST",
      headers: { Authorization: `Bearer ${SUPA_KEY}`, apikey: SUPA_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true }),
      signal: AbortSignal.timeout(5000),
    }).catch(() => {});
  })().catch((e) => { pronto = null; throw e; }));
}

// Saves an image (data URL) and returns its public address.
export async function salvaImmagine(nomeFile, dataUrl) {
  const m = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl || "");
  if (!m) throw new Error("immagine non valida");
  const r = await fetch(`${SUPA_URL}/storage/v1/object/${BUCKET}/${nomeFile}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${SUPA_KEY}`, apikey: SUPA_KEY, "Content-Type": m[1], "x-upsert": "true" },
    body: Buffer.from(m[2], "base64"),
  });
  if (!r.ok) throw new Error("salvataggio immagine non riuscito");
  return `${SUPA_URL}/storage/v1/object/public/${BUCKET}/${nomeFile}`;
}

// For pages: never wait more than 5 seconds for the database (a stuck connection would block the build).
export const pixelVendutiPresto = () => Promise.race([pixelVenduti(), new Promise((ok) => setTimeout(() => ok(0), 5000))]).catch(() => 0);

// How many weekly price drops apply now (0 when the phase has changed since the last drop).
export async function caloPrezzo(venduti) {
  if (!dbAttivo()) return 0;
  await prepara();
  const [r] = await sql()`select fase, calo from listino where id = 1`;
  return r && r.fase === fase(venduti) ? r.calo : 0;
}
export const caloPresto = (venduti) => Promise.race([caloPrezzo(venduti), new Promise((ok) => setTimeout(() => ok(0), 5000))]).catch(() => 0);

// Called every day (cron): one more drop when nothing has sold for 7 days since the last sale or the last drop.
// A sale stops the drop (the price stays where it is); a new phase starts again from its full price.
export async function aggiornaRibasso() {
  if (!dbAttivo()) return;
  await prepara();
  const v = await pixelVenduti(), f = fase(v);
  const [r] = await sql()`select fase, calo, dal from listino where id = 1`;
  if (!r || r.fase !== f) {
    await sql()`insert into listino (id, fase, calo, dal) values (1, ${f}, 0, now()) on conflict (id) do update set fase = excluded.fase, calo = 0, dal = now()`;
    return;
  }
  const [u] = await sql()`select max(creato) as t from spazi where x is not null and not omaggio and prezzo > 0`;
  // Before the first real sale (site not launched yet, or tests deleted) the price stays full.
  if (!u.t) { if (r.calo) await sql()`update listino set calo = 0, dal = now() where id = 1`; return; }
  if (!puoScendere(v, r.calo)) return;
  const da = Math.max(new Date(r.dal).getTime(), u.t ? new Date(u.t).getTime() : 0);
  if (Date.now() - da >= 7 * 24 * 3600 * 1000) await sql()`update listino set calo = calo + 1, dal = now() where id = 1 and calo = ${r.calo}`;
}

// Pixel already taken (paid and free gifts), used for prices and counter.
export async function pixelVenduti() {
  if (!dbAttivo()) return 0;
  await prepara();
  // The Cuore (won at auction) doesn't count: phases and prices follow the normal grid only.
  const [r] = await sql()`select coalesce(sum(w*h),0)::int as n from spazi where x is not null and not (x >= 35 and x < 65 and y >= 35 and y < 65)`;
  return r.n;
}

// For each size: can it still be bought? Yes while there is a free place for it in the grid
// (the Cuore excluded); the 100-pixel blocks also stop at their limit for the current phase (limitePack).
export async function disponibili() {
  const tutti = Object.fromEntries(Object.values(PACCHETTI).map((p) => [p.n, inVenditaOra(p, 0)]));
  if (!dbAttivo()) return { ok: tutti, presi: {}, limite: Object.fromEntries(Object.values(PACCHETTI).map((p) => [p.n, limitePack(p, 0)])) };
  await prepara();
  const presi = await sql()`select x, y, w, h, pack from spazi where x is not null`;
  const occ = occupazione(presi);
  const conta = {};
  let venduti = 0;
  presi.forEach((b) => { if (!nelCuore(b.x, b.y, b.w, b.h)) { conta[b.pack] = (conta[b.pack] || 0) + 1; venduti += b.w * b.h; } });
  const ok = {}, limite = {};
  for (const p of Object.values(PACCHETTI).filter((p) => !p.soloAsta)) {
    limite[p.n] = limitePack(p, venduti);
    ok[p.n] = inVenditaOra(p, venduti) && (limite[p.n] == null || (conta[p.n] || 0) < limite[p.n]) && !!primoPosto(occ, p.w, p.h);
  }
  return { ok, presi: conta, limite, venduti };
}
export const disponibiliPresto = () => Promise.race([disponibili(), new Promise((ok) => setTimeout(() => ok(null), 5000))]).catch(() => null);

export async function spaziOnline() {
  if (!dbAttivo()) return [];
  await prepara();
  return sql()`select id, x, y, w, h, nome, link, img from spazi where stato = 'online' and x is not null order by id`;
}

export async function tuttiGliSpazi() {
  await prepara();
  return sql()`select * from spazi order by id desc`;
}

export async function nuovoOrdine({ pack, nome, link, email, prezzo, omaggio = false, cuore = false }) {
  await prepara();
  const p = PACCHETTI[pack];
  const [r] = await sql()`insert into spazi (pack, w, h, nome, link, email, prezzo, omaggio, cuore)
    values (${p.n}, ${p.w}, ${p.h}, ${nome}, ${link}, ${email || null}, ${prezzo}, ${omaggio}, ${cuore}) returning id`;
  return r.id;
}

export async function aggiorna(id, campi) {
  await prepara();
  await sql()`update spazi set ${sql()(campi)} where id = ${id}`;
}

export async function cancella(id) {
  await prepara();
  await sql()`delete from spazi where id = ${id}`;
}

// Gives the order a random free position, once. Stato becomes "online" or "da_controllare".
const N = 100;
// In the grand finale the Cuore spaces that are not in an auction are sold at a fixed price (Cuore map in lib/mappa.js).
export const PACK_CUORE_FISSO = [1, 2, 4, 10, 25];
// Free Cuore spaces of one size: not taken and not in an auction (waiting, open or closing).
async function piccoliCuoreLiberi(t, pack) {
  const occ = occupazione(await t`select x, y, w, h from spazi where x is not null`);
  const [{ c }] = await t`select to_regclass('aste') is not null as c`;
  const inAsta = new Set(c ? (await t`select x, y from aste where zona = 'cuore' and stato in ('attesa', 'aperta', 'chiusura', 'rinviata')`).map((r) => r.x + "," + r.y) : []);
  const { w, h } = PACCHETTI[pack];
  return mappaCuore().filter((l) => l.pack === pack && !inAsta.has(l.x + "," + l.y) && libereCelle(occ, l.x, l.y, w, h));
}
export async function cuoreLiberi() {
  const r = Object.fromEntries(PACK_CUORE_FISSO.map((n) => [n, 0]));
  if (!dbAttivo()) return r;
  await prepara();
  for (const n of PACK_CUORE_FISSO) r[n] = (await piccoliCuoreLiberi(sql(), n)).length;
  return r;
}

const nelCuore = (x, y, w, h) => x + w > 35 && x < 65 && y + h > 35 && y < 65;
const PRIMI_VICINO_AL_CUORE = 150; // quanti spazi vanno intorno al Cuore all'inizio
const ZONA_VISTA = [26, 74]; // righe e colonne visibili all'apertura della Home

function occupazione(presi) {
  const occ = new Uint8Array(N * N);
  presi.forEach((b) => { for (let j = b.y; j < b.y + b.h; j++) for (let i = b.x; i < b.x + b.w; i++) occ[j * N + i] = 1; });
  return occ;
}
const libereCelle = (occ, x, y, w, h) => {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (occ[j * N + i]) return false;
  return true;
};
// The places kept for the grand finale outside the Cuore (lib/mappa.js): never sold before.
const RISERVA = occupazione([...RISERVA_FINALE, ULTIMO_PEZZO].map((l) => ({ x: l.x, y: l.y, w: PACCHETTI[l.pack].w, h: PACCHETTI[l.pack].h })));
const libero = (occ, x, y, w, h) => !nelCuore(x, y, w, h) && libereCelle(RISERVA, x, y, w, h) && libereCelle(occ, x, y, w, h);
// First free place for a w x h block, looking at every position (used when the grid is almost full).
function primoPosto(occ, w, h) {
  for (let y = 0; y + h <= N; y++) for (let x = 0; x + w <= N; x++) if (libero(occ, x, y, w, h)) return { x, y };
  return null;
}
// Taken places: the spaces, plus the places kept for auctions outside the Cuore that are still running
// (so nobody else gets the spot shown on the auction page).
async function occupati(t) {
  const presi = await t`select x, y, w, h from spazi where x is not null`;
  const [{ c }] = await t`select to_regclass('aste') is not null as c`;
  if (c) for (const a of await t`select x, y, pack from aste where zona = 'fuori' and x is not null and stato in ('aperta', 'chiusura')`)
    presi.push({ x: a.x, y: a.y, w: PACCHETTI[a.pack].w, h: PACCHETTI[a.pack].h, riservato: true });
  return presi;
}
export async function postoLibero(w, h) {
  await prepara();
  return !!primoPosto(occupazione(await occupati(sql())), w, h);
}
// Every taken place, for the small map on the auction pages.
export async function posizioni() {
  await prepara();
  return sql()`select x, y, w, h from spazi where x is not null`;
}

// Random free place for a w x h block (null if none), same rules as for normal purchases.
function cercaPosto(presi, w, h) {
  const occ = occupazione(presi);
  const grandi = presi.filter((b) => b.w * b.h >= 25);
  // The first spaces go around Il Cuore, in the area visible as soon as the Home opens,
  // so the mosaic looks alive from the start. Later (or if that ring is full) anywhere.
  const vicino = presi.filter((b) => !b.riservato).length < PRIMI_VICINO_AL_CUORE;
  let pos = null;
  for (let k = 0; k < 20000 && !pos; k++) {
    const [a, b] = vicino && k < 8000 ? [ZONA_VISTA[0], ZONA_VISTA[1]] : [0, N];
    const x = a + Math.floor(Math.random() * (Math.min(b, N) - a - w + 1)), y = a + Math.floor(Math.random() * (Math.min(b, N) - a - h + 1));
    if (!libero(occ, x, y, w, h)) continue;
    if (w * h >= 25 && k < 15000 && grandi.some((b) => Math.abs(b.x + b.w / 2 - (x + w / 2)) < 14 && Math.abs(b.y + b.h / 2 - (y + h / 2)) < 14)) continue;
    pos = { x, y };
  }
  // Almost full grid: random tries may miss the last holes, so look at every position.
  return pos || primoPosto(occ, w, h);
}

// When an auction outside the Cuore opens, its place is chosen and kept: the auction page shows it.
export async function riservaPosto(astaId, pack) {
  await prepara();
  return sql().begin(async (t) => {
    await t`select pg_advisory_xact_lock(4242)`;
    const pos = cercaPosto(await occupati(t), PACCHETTI[pack].w, PACCHETTI[pack].h);
    if (pos) await t`update aste set x = ${pos.x}, y = ${pos.y} where id = ${astaId}`;
    return pos;
  });
}

export async function assegnaPosizione(id, stato) {
  await prepara();
  return sql().begin(async (t) => {
    await t`select pg_advisory_xact_lock(4242)`;
    const [o] = await t`select * from spazi where id = ${id}`;
    if (!o) return null;
    if (o.x !== null) return o;
    if (o.cuore) {
      const [l] = (await piccoliCuoreLiberi(t, o.pack)).sort(() => Math.random() - 0.5);
      if (!l) throw new Error("nessuno spazio libero nel Cuore");
      const [r] = await t`update spazi set x = ${l.x}, y = ${l.y}, stato = ${stato} where id = ${id} returning *`;
      return r;
    }
    const pos = cercaPosto(await occupati(t), o.w, o.h);
    if (!pos) throw new Error("nessuno spazio libero di questa misura");
    const [r] = await t`update spazi set x = ${pos.x}, y = ${pos.y}, stato = ${stato} where id = ${id} returning *`;
    return r;
  });
}
