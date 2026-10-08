import Stripe from "stripe";
import { PACCHETTI, prezzoPacchetto, prezzoCuore, FINALE } from "../../../lib/prezzi";
import { controllaLink } from "../../../lib/controlloLink";
import { dbAttivo, pixelVenduti, disponibili, cuoreLiberi, nuovoOrdine, salvaImmagine, aggiorna } from "../../../lib/db";

// Creates the Stripe payment page for a pack. The price is always computed here,
// never taken from the browser. Without STRIPE_SECRET_KEY (set on Vercel) the site stays in test mode.
// With the database, the order and its image are saved first, waiting for payment.
export async function POST(req) {
  const chiave = process.env.STRIPE_SECRET_KEY;
  if (!chiave) return Response.json({ prova: true });

  const { pack, nome, link, email, dubbio, immagine, cuore: nelCuore } = await req.json().catch(() => ({}));
  const p = PACCHETTI[pack];
  if (!p || !nome || !link || !email) return Response.json({ errore: "Dati mancanti." }, { status: 400 });
  const l = await controllaLink(link); // checked again here so nobody can skip the check
  if (!l.ok) return Response.json({ errore: l.motivo }, { status: 400 });
  const href = l.link;

  // A size can be bought while there is a free place for it (100-pixel blocks: also up to their maximum).
  // Grand finale: the last 1 and 2-pixel spaces of the Cuore, at a fixed price.
  const cuore = !!nelCuore && (p.n === 1 || p.n === 2);
  const venduti = await pixelVenduti();
  if (cuore) {
    if (!dbAttivo() || venduti < FINALE || !(await cuoreLiberi())[p.n]) return Response.json({ errore: `Non ci sono più spazi da ${p.titolo} nel Cuore.` }, { status: 400 });
  } else if (dbAttivo() && !(await disponibili()).ok[p.n]) return Response.json({ errore: `Gli spazi da ${p.titolo} sono esauriti.` }, { status: 400 });
  const prezzo = cuore ? prezzoCuore(p.n, venduti) : prezzoPacchetto(p.n, venduti);
  let ordine = null;
  if (dbAttivo()) {
    if (!immagine) return Response.json({ errore: "Immagine mancante." }, { status: 400 });
    ordine = await nuovoOrdine({ pack: p.n, nome: String(nome).slice(0, 80), link: href, email, prezzo, cuore });
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
        product_data: { name: `PixelHype · ${p.nome} (${p.titolo})${cuore ? " nel Cuore" : ""}`, description: `Spazio per ${nome}` },
      },
    }],
    metadata: { pack: String(p.n), nome: String(nome).slice(0, 200), link: href.slice(0, 400), da_controllare: dubbio ? "si" : "no", ordine: ordine ? String(ordine) : "" },
    success_url: `${sito}/crea-spazio/grazie?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${sito}/crea-spazio?pack=${p.n}${cuore ? "&cuore=1" : ""}`,
  });
  if (ordine) await aggiorna(ordine, { stripe_session: session.id });
  return Response.json({ url: session.url });
}
