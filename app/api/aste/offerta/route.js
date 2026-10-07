import Stripe from "stripe";
import { controllaLink } from "../../../../lib/controlloLink";
import { dbAttivo, pixelVenduti, salvaImmagine, sql } from "../../../../lib/db";
import { asteAperte, unaAsta, minimo, nuovaOfferta, confermaOfferta } from "../../../../lib/aste";
import { PACCHETTI } from "../../../../lib/prezzi";

export const dynamic = "force-dynamic";

// A new bid. Nothing is charged now: the bidder only saves the card with Stripe,
// and is charged at the end only if they win.
export async function POST(req) {
  if (!dbAttivo() || !asteAperte(await pixelVenduti())) return Response.json({ errore: "Le aste non sono ancora aperte." }, { status: 400 });
  const { asta, importo, nome, link, email, dubbio, immagine } = await req.json().catch(() => ({}));
  const a = await unaAsta(Number(asta));
  if (!a || a.stato !== "aperta" || new Date(a.fine) <= new Date()) return Response.json({ errore: "Questa asta è chiusa." }, { status: 400 });
  const euro = Math.floor(Number(importo));
  if (!(euro >= minimo(a, a.migliore))) return Response.json({ errore: `L'offerta minima ora è ${minimo(a, a.migliore)} €.` }, { status: 400 });
  if (!nome || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !immagine) return Response.json({ errore: "Dati mancanti." }, { status: 400 });
  const l = await controllaLink(link);
  if (!l.ok) return Response.json({ errore: l.motivo }, { status: 400 });

  const id = await nuovaOfferta({ asta: a.id, importo: euro, nome: String(nome).slice(0, 80), link: l.link, email, dubbio: !!dubbio, img: null });
  const img = await salvaImmagine(`asta-${a.id}-${id}-${Date.now()}.${immagine.startsWith("data:image/webp") ? "webp" : "jpg"}`, immagine);
  await sql()`update offerte set img = ${img} where id = ${id}`;

  const chiave = process.env.STRIPE_SECRET_KEY;
  if (!chiave) { const r = await confermaOfferta(id, {}); return Response.json(r.ok ? { prova: true } : { errore: r.motivo }); }

  const stripe = new Stripe(chiave);
  const cliente = await stripe.customers.create({ email, name: String(nome).slice(0, 80) });
  const sito = new URL(req.url).origin;
  const s = await stripe.checkout.sessions.create({
    mode: "setup",
    currency: "eur",
    customer: cliente.id,
    payment_method_types: ["card"],
    setup_intent_data: { description: `Offerta di ${euro} € per l'asta PixelHype (${PACCHETTI[a.pack].titolo}). Addebito solo se vinci.` },
    metadata: { offerta: String(id), asta: String(a.id) },
    success_url: `${sito}/aste/grazie?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${sito}/aste/${a.id}`,
  });
  await sql()`update offerte set stripe_session = ${s.id}, cliente = ${cliente.id} where id = ${id}`;
  return Response.json({ url: s.url });
}
