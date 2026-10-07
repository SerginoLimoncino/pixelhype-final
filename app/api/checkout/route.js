import Stripe from "stripe";
import { PACCHETTI, prezzoPacchetto } from "../../../lib/prezzi";
import { controllaLink } from "../../../lib/controlloLink";
import { dbAttivo, pixelVenduti, nuovoOrdine, salvaImmagine, aggiorna } from "../../../lib/db";

// Creates the Stripe payment page for a pack. The price is always computed here,
// never taken from the browser. Without STRIPE_SECRET_KEY (set on Vercel) the site stays in test mode.
// With the database, the order and its image are saved first, waiting for payment.
export async function POST(req) {
  const chiave = process.env.STRIPE_SECRET_KEY;
  if (!chiave) return Response.json({ prova: true });

  const { pack, nome, link, email, dubbio, immagine } = await req.json().catch(() => ({}));
  const p = PACCHETTI[pack];
  if (!p || !nome || !link || !email) return Response.json({ errore: "Dati mancanti." }, { status: 400 });
  const l = await controllaLink(link); // checked again here so nobody can skip the check
  if (!l.ok) return Response.json({ errore: l.motivo }, { status: 400 });
  const href = l.link;

  const prezzo = prezzoPacchetto(p.n, await pixelVenduti());
  let ordine = null;
  if (dbAttivo()) {
    if (!immagine) return Response.json({ errore: "Immagine mancante." }, { status: 400 });
    ordine = await nuovoOrdine({ pack: p.n, nome: String(nome).slice(0, 80), link: href, email, prezzo });
    const est = immagine.startsWith("data:image/webp") ? "webp" : "jpg";
    const img = await salvaImmagine(`${ordine}-${Date.now()}.${est}`, immagine);
    await aggiorna(ordine, { img });
  }

  const stripe = new Stripe(chiave);
  const sito = new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: prezzo * 100,
        product_data: { name: `PixelHype · ${p.nome} (${p.titolo})`, description: `Spazio per ${nome}` },
      },
    }],
    metadata: { pack: String(p.n), nome: String(nome).slice(0, 200), link: href.slice(0, 400), da_controllare: dubbio ? "si" : "no", ordine: ordine ? String(ordine) : "" },
    success_url: `${sito}/crea-spazio/grazie?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${sito}/crea-spazio?pack=${p.n}`,
  });
  if (ordine) await aggiorna(ordine, { stripe_session: session.id });
  return Response.json({ url: session.url });
}
