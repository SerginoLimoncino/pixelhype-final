import Stripe from "stripe";
import { PACCHETTI, prezzoPacchetto } from "../../../lib/prezzi";
import { normalizzaLink, linkVietato } from "../../../lib/controllo";

// Creates the Stripe payment page for a pack. The price is always computed here,
// never taken from the browser. Without STRIPE_SECRET_KEY (set on Vercel) the site stays in test mode.
export async function POST(req) {
  const chiave = process.env.STRIPE_SECRET_KEY;
  if (!chiave) return Response.json({ prova: true });

  const { pack, nome, link, email, dubbio } = await req.json().catch(() => ({}));
  const p = PACCHETTI[pack];
  const href = normalizzaLink(link);
  if (!p || !nome || !href || !email) return Response.json({ errore: "Dati mancanti." }, { status: 400 });
  if (linkVietato(href)) return Response.json({ errore: "Link non accettato." }, { status: 400 });

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
    metadata: { pack: String(p.n), nome: String(nome).slice(0, 200), link: href.slice(0, 400), da_controllare: dubbio ? "si" : "no" },
    success_url: `${sito}/crea-spazio/grazie?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${sito}/crea-spazio?pack=${p.n}`,
  });
  return Response.json({ url: session.url });
}
