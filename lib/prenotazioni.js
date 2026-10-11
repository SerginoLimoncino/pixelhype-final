import { sql, prepara } from "./db";

// Bookings made while PRENOTAZIONI is on: who wants which size, to write to them when sales open.
let pronta = null;
const tabella = () => (pronta ||= (async () => {
  await prepara();
  await sql()`create table if not exists prenotazioni (id serial primary key, email text not null, pack int not null, nome text, lingua text, creata timestamptz not null default now())`;
})());

export async function nuovaPrenotazione({ email, pack, nome, lingua }) {
  await tabella();
  const [{ n }] = await sql()`select count(*)::int as n from prenotazioni where lower(email) = lower(${email}) and pack = ${pack}`;
  if (n) return { gia: true };
  await sql()`insert into prenotazioni (email, pack, nome, lingua) values (${email}, ${pack}, ${nome || null}, ${lingua})`;
  return { ok: true };
}

export async function listaPrenotazioni() {
  await tabella();
  return sql()`select id, email, pack, nome, lingua, creata from prenotazioni order by creata desc limit 2000`;
}
