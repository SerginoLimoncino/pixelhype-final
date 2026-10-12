import { PACCHETTI } from "../../../lib/prezzi";
import { dbAttivo, salvaImmagine } from "../../../lib/db";
import { controllaLink } from "../../../lib/controlloLink";
import { PRENOTAZIONI } from "../../../lib/modo";
import { nuovaPrenotazione, troppePrenotazioni } from "../../../lib/prenotazioni";
import { emailPrenotazione, avvisoNuovaPrenotazione } from "../../../lib/email";
import { after } from "next/server";
import { lingua } from "../../../lib/lingua";
import { inglese } from "../../../lib/messaggi";

// The free email plan (Resend) sends at most 100 emails a day: confirmations to the people come first,
// so the "new booking" alert to Sergio stops after the first 20 bookings of the day (the panel has them all).
const AVVISI_AL_GIORNO = 20;

// Saves a booking: email, size and (optional) brand name. No payment.
export async function POST(req) {
  const en = (await lingua()) === "en"; // the visitor's choice, or the browser language (same rule as the pages)
  const T = (it, eng) => (en ? eng : it);
  if (!PRENOTAZIONI || !dbAttivo()) return Response.json({ errore: T("Le prenotazioni sono chiuse.", "Bookings are closed.") }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  const email = String(b.email || "").trim().slice(0, 120);
  const p = Object.hasOwn(PACCHETTI, String(b.pack)) ? PACCHETTI[b.pack] : null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !p || p.soloAsta || !b.ok) return Response.json({ errore: T("Dati mancanti.", "Missing details.") }, { status: 400 });
  const l = await controllaLink(b.link); // optional, checked again here
  if (!l.ok) return Response.json({ errore: inglese(l.motivo, en) }, { status: 400 });
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  if (await troppePrenotazioni(ip)) return Response.json({ errore: T("Troppe prenotazioni da questa connessione. Riprova tra un'ora.", "Too many bookings from this connection. Please try again in an hour.") }, { status: 429 });
  let img = null;
  if (typeof b.immagine === "string" && /^data:image\/(webp|jpeg);base64,/.test(b.immagine) && b.immagine.length < 8e6) {
    img = await salvaImmagine(`prenotazione-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${b.immagine.startsWith("data:image/webp") ? "webp" : "jpg"}`, b.immagine).catch(() => null);
  }
  const r = await nuovaPrenotazione({ email, pack: p.n, nome: String(b.nome || "").trim().slice(0, 40), lingua: en ? "en" : "it", link: l.link, img, ip });
  if (!r.gia) {
    // Confirmation to the person and alert to Sergio, sent after the answer so the page never waits.
    const nome = String(b.nome || "").trim().slice(0, 40);
    after(async () => {
      await emailPrenotazione({ email, pack: p.n, nome, en }).catch(() => {});
      if (r.oggi <= AVVISI_AL_GIORNO) await avvisoNuovaPrenotazione({ email, pack: p.n, nome, link: l.link }).catch(() => {});
    });
  }
  return Response.json({ ok: true, gia: !!r.gia });
}
