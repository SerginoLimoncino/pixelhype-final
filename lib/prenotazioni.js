import { sql, prepara } from "./db";

// Bookings made while PRENOTAZIONI is on: who wants which size, to write to them when sales open.
let pronta = null;
const tabella = () => (pronta ||= (async () => {
  await prepara();
  await sql()`create table if not exists prenotazioni (id serial primary key, email text not null, pack int not null, nome text, lingua text, creata timestamptz not null default now())`;
  await sql()`alter table prenotazioni add column if not exists link text, add column if not exists img text`;
})());

export async function nuovaPrenotazione({ email, pack, nome, lingua, link, img }) {
  await tabella();
  const [{ n }] = await sql()`select count(*)::int as n from prenotazioni where lower(email) = lower(${email}) and pack = ${pack}`;
  if (n) {
    // Booking again with the same email and size updates name, link and image.
    await sql()`update prenotazioni set nome = coalesce(${nome || null}, nome), link = coalesce(${link || null}, link), img = coalesce(${img || null}, img) where lower(email) = lower(${email}) and pack = ${pack}`;
    return { gia: true };
  }
  await sql()`insert into prenotazioni (email, pack, nome, lingua, link, img) values (${email}, ${pack}, ${nome || null}, ${lingua}, ${link || null}, ${img || null})`;
  return { ok: true };
}

export async function cancellaPrenotazione(id) {
  await tabella();
  await sql()`delete from prenotazioni where id = ${id}`;
}

export async function listaPrenotazioni() {
  await tabella();
  return sql()`select id, email, pack, nome, lingua, link, img, creata from prenotazioni order by creata desc limit 2000`;
}
