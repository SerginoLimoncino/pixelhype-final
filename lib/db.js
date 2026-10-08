import postgres from "postgres";
import { PACCHETTI, limitePack } from "./prezzi";

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
export const sql = () => (_sql ||= postgres(senzaOpzioni(URL_DB), { ssl: /localhost|127\.0\.0\.1/.test(URL_DB) ? false : "require", prepare: false, max: 1, connect_timeout: 10, idle_timeout: 20 }));

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
  const tutti = Object.fromEntries(Object.keys(PACCHETTI).map((n) => [n, true]));
  if (!dbAttivo()) return { ok: tutti, presi: {}, limite: Object.fromEntries(Object.values(PACCHETTI).map((p) => [p.n, limitePack(p, 0)])) };
  await prepara();
  const presi = await sql()`select x, y, w, h, pack from spazi where x is not null`;
  const occ = occupazione(presi);
  const conta = {};
  let venduti = 0;
  presi.forEach((b) => { if (!nelCuore(b.x, b.y, b.w, b.h)) { conta[b.pack] = (conta[b.pack] || 0) + 1; venduti += b.w * b.h; } });
  const ok = {}, limite = {};
  for (const p of Object.values(PACCHETTI)) {
    limite[p.n] = limitePack(p, venduti);
    ok[p.n] = (!limite[p.n] || (conta[p.n] || 0) < limite[p.n]) && !!primoPosto(occ, p.w, p.h);
  }
  return { ok, presi: conta, limite };
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

export async function nuovoOrdine({ pack, nome, link, email, prezzo, omaggio = false }) {
  await prepara();
  const p = PACCHETTI[pack];
  const [r] = await sql()`insert into spazi (pack, w, h, nome, link, email, prezzo, omaggio)
    values (${p.n}, ${p.w}, ${p.h}, ${nome}, ${link}, ${email || null}, ${prezzo}, ${omaggio}) returning id`;
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
const nelCuore = (x, y, w, h) => x + w > 35 && x < 65 && y + h > 35 && y < 65;
const PRIMI_VICINO_AL_CUORE = 150; // quanti spazi vanno intorno al Cuore all'inizio
const ZONA_VISTA = [26, 74]; // righe e colonne visibili all'apertura della Home

function occupazione(presi) {
  const occ = new Uint8Array(N * N);
  presi.forEach((b) => { for (let j = b.y; j < b.y + b.h; j++) for (let i = b.x; i < b.x + b.w; i++) occ[j * N + i] = 1; });
  return occ;
}
const libero = (occ, x, y, w, h) => {
  if (nelCuore(x, y, w, h)) return false;
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) if (occ[j * N + i]) return false;
  return true;
};
// First free place for a w x h block, looking at every position (used when the grid is almost full).
function primoPosto(occ, w, h) {
  for (let y = 0; y + h <= N; y++) for (let x = 0; x + w <= N; x++) if (libero(occ, x, y, w, h)) return { x, y };
  return null;
}
export async function postoLibero(w, h) {
  await prepara();
  return !!primoPosto(occupazione(await sql()`select x, y, w, h from spazi where x is not null`), w, h);
}

export async function assegnaPosizione(id, stato) {
  await prepara();
  return sql().begin(async (t) => {
    await t`select pg_advisory_xact_lock(4242)`;
    const [o] = await t`select * from spazi where id = ${id}`;
    if (!o) return null;
    if (o.x !== null) return o;
    const presi = await t`select x, y, w, h from spazi where x is not null`;
    const occ = occupazione(presi);
    const grandi = presi.filter((b) => b.w * b.h >= 25);
    // The first spaces go around Il Cuore, in the area visible as soon as the Home opens,
    // so the mosaic looks alive from the start. Later (or if that ring is full) anywhere.
    const vicino = presi.length < PRIMI_VICINO_AL_CUORE;
    let pos = null;
    for (let k = 0; k < 20000 && !pos; k++) {
      const [a, b] = vicino && k < 8000 ? [ZONA_VISTA[0], ZONA_VISTA[1]] : [0, N];
      const x = a + Math.floor(Math.random() * (Math.min(b, N) - a - o.w + 1)), y = a + Math.floor(Math.random() * (Math.min(b, N) - a - o.h + 1));
      if (!libero(occ, x, y, o.w, o.h)) continue;
      if (o.w * o.h >= 25 && k < 15000 && grandi.some((b) => Math.abs(b.x + b.w / 2 - (x + o.w / 2)) < 14 && Math.abs(b.y + b.h / 2 - (y + o.h / 2)) < 14)) continue;
      pos = { x, y };
    }
    // Almost full grid: random tries may miss the last holes, so look at every position.
    pos ||= primoPosto(occ, o.w, o.h);
    if (!pos) throw new Error("nessuno spazio libero di questa misura");
    const [r] = await t`update spazi set x = ${pos.x}, y = ${pos.y}, stato = ${stato} where id = ${id} returning *`;
    return r;
  });
}
