import Link from "next/link";
import Stripe from "stripe";
import { PACCHETTI, eur } from "../../../lib/prezzi";

export const metadata = { title: "Grazie · PixelHype" };

// Stripe sends the buyer here after paying. We check with Stripe that the payment really went through.
export default async function Grazie({ searchParams }) {
  const sp = await searchParams;
  let s = null;
  if (process.env.STRIPE_SECRET_KEY && sp?.session_id) {
    s = await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(sp.session_id).catch(() => null);
  }
  const pagato = s?.payment_status === "paid";
  const p = pagato ? PACCHETTI[s.metadata?.pack] : null;

  return (
    <section className="wrap buy" style={{ gridTemplateColumns: "1fr", maxWidth: 720 }}>
      <div className="card" style={{ display: "grid", gap: 16 }}>
        {pagato ? (
          <>
            <span className="step-n">Pagamento riuscito · {eur(s.amount_total / 100)}</span>
            <p className="ok-big">Sei nell'opera. Per sempre.</p>
            <p className="muted">Il tuo spazio {p ? `"${p.nome}" (${p.titolo})` : ""} per <b>{s.metadata?.nome}</b> verrà messo nel mosaico in una posizione scelta a caso, dopo il controllo dell'immagine. La ricevuta arriva a {s.customer_details?.email}.</p>
          </>
        ) : (
          <>
            <span className="step-n">Pagamento non trovato</span>
            <p className="muted">Non risulta un pagamento completato. Se pensi sia un errore, scrivici e controlliamo subito.</p>
          </>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/#galleria" className="cta">Torna al mosaico</Link>
          <Link href="/compra" className="ghost">Prendi un altro spazio</Link>
        </div>
      </div>
    </section>
  );
}
