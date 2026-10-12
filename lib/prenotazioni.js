import { createHash } from "crypto";
import { sql, prepara } from "./db";

// Bookings made while PRENOTAZIONI is on: who wants which size, to write to them when sales open.
let pronta = null;
const tabella = () => (pronta ||= (async () => {
  await prepara();
  await sql()`create table if not exists prenotazioni (id serial primary key, email text not null, pack int not null, nome text, lingua text, creata timestamptz not null default now())`;
  await sql()`alter table prenotazioni add column if not exists link text, add column if not exists img text, add column if not exists ip text`;
})().catch((e) => { pronta = null; throw e; })); // a failed start is retried on the next booking

// Anti-abuse (2026-10-11): at most 5 new bookings an hour from the same connection. Only a short code made from
// the IP address is kept, never the address itself.
const MAX_ORA = 5;
const codiceIp = (ip) => (ip ? createHash("sha256").update("pixelhype:" + ip).digest("hex").slice(0, 16) : null);

// True when this connection already made MAX_ORA new bookings in the last hour (checked before saving any image).
export async function troppePrenotazioni(ip) {
  const codice = codiceIp(ip);
  if (!codice) return false;
  await tabella();
  const [{ m }] = await sql()`select count(*)::int as m from prenotazioni where ip = ${codice} and creata > now() - interval '1 hour'`;
  return m >= MAX_ORA;
}

// One booking at a time (a database lock), so two clicks or two requests sent together never create two rows.
export async function nuovaPrenotazione({ email, pack, nome, lingua, link, img, ip }) {
  await tabella();
  const codice = codiceIp(ip);
  return sql().begin(async (t) => {
    await t`select pg_advisory_xact_lock(4245)`;
    const [{ n }] = await t`select count(*)::int as n from prenotazioni where lower(email) = lower(${email}) and pack = ${pack}`;
    if (n) {
      // Booking again with the same email and size updates name, link and image.
      await t`update prenotazioni set nome = coalesce(${nome || null}, nome), link = coalesce(${link || null}, link), img = coalesce(${img || null}, img) where lower(email) = lower(${email}) and pack = ${pack}`;
      return { gia: true };
    }
    if (codice) {
      const [{ m }] = await t`select count(*)::int as m from prenotazioni where ip = ${codice} and creata > now() - interval '1 hour'`;
      if (m >= MAX_ORA) return { troppe: true };
    }
    await t`insert into prenotazioni (email, pack, nome, lingua, link, img, ip) values (${email}, ${pack}, ${nome || null}, ${lingua}, ${link || null}, ${img || null}, ${codice})`;
    const [{ oggi }] = await t`select count(*)::int as oggi from prenotazioni where creata > now() - interval '1 day'`;
    return { ok: true, oggi };
  });
}

// For the public counter under the mosaic.
export async function contaPrenotazioni() {
  await tabella();
  const [r] = await sql()`select count(*)::int as spazi, coalesce(sum(pack), 0)::int as pixel from prenotazioni`;
  return r;
}

export async function cancellaPrenotazione(id) {
  await tabella();
  await sql()`delete from prenotazioni where id = ${id}`;
}

export async function listaPrenotazioni() {
  await tabella();
  return sql()`select id, email, pack, nome, lingua, link, img, creata from prenotazioni order by creata desc limit 2000`;
}
