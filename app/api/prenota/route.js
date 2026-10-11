import { PACCHETTI } from "../../../lib/prezzi";
import { dbAttivo } from "../../../lib/db";
import { PRENOTAZIONI } from "../../../lib/modo";
import { nuovaPrenotazione } from "../../../lib/prenotazioni";

// Saves a booking: email, size and (optional) brand name. No payment.
export async function POST(req) {
  const en = req.headers.get("cookie")?.includes("lingua=en");
  const T = (it, eng) => (en ? eng : it);
  if (!PRENOTAZIONI || !dbAttivo()) return Response.json({ errore: T("Le prenotazioni sono chiuse.", "Bookings are closed.") }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim().slice(0, 120);
  const p = PACCHETTI[b.pack];
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !p || p.soloAsta || !b.ok) return Response.json({ errore: T("Dati mancanti.", "Missing details.") }, { status: 400 });
  const r = await nuovaPrenotazione({ email, pack: p.n, nome: String(b.nome || "").trim().slice(0, 40), lingua: en ? "en" : "it" });
  return Response.json({ ok: true, gia: !!r.gia });
}
