import Stripe from "stripe";
import { PACCHETTI, prezzoPacchetto } from "../../../lib/prezzi";

// Creates the Stripe payment page for a pack. The price is always computed here,
// never taken from the browser. Without STRIPE_SECRET_KEY (set on Vercel) the site stays in test mode.
export async function POST(req) {
  const chiave = process.env.STRIPE_SECRET_KEY;
  if (!chiave) return Response.json({ prova: true });

  const { pack, nome, link, email } = await req.json().catch(() => ({}));
  const p = PACCHETTI[pack];
  if (!p || !nome || !link || !email) return Response.json({ errore: "Dati mancanti." }, { status: 400 });

  const stripe = new Stripe(chiave);
  const sito = new URL(req.url).origin;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "eur",
        unit_amount: prezzoPacchetto(p.n) * 100,
        product_data: { name: `PixelHype · ${p.nome} (${p.titolo})`, description: `Spazio per ${nome}` },
      },
    }],
    metadata: { pack: String(p.n), nome: String(nome).slice(0, 200), link: String(link).slice(0, 400) },
    success_url: `${sito}/crea-spazio/grazie?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${sito}/crea-spazio?pack=${p.n}`,
  });
  return Response.json({ url: session.url });
}
