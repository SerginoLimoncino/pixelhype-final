import { PACCHETTI } from "../../../lib/prezzi";
import { dbAttivo, salvaImmagine } from "../../../lib/db";
import { controllaLink } from "../../../lib/controlloLink";
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
  const l = await controllaLink(b.link); // optional, checked again here
  if (!l.ok) return Response.json({ errore: l.motivo }, { status: 400 });
  let img = null;
  if (typeof b.immagine === "string" && /^data:image\/(webp|jpeg);base64,/.test(b.immagine) && b.immagine.length < 8e6) {
    img = await salvaImmagine(`prenotazione-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${b.immagine.startsWith("data:image/webp") ? "webp" : "jpg"}`, b.immagine).catch(() => null);
  }
  const r = await nuovaPrenotazione({ email, pack: p.n, nome: String(b.nome || "").trim().slice(0, 40), lingua: en ? "en" : "it", link: l.link, img });
  return Response.json({ ok: true, gia: !!r.gia });
}
