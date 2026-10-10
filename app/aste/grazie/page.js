import Link from "next/link";
import Stripe from "stripe";
import { confermaOfferta } from "../../../lib/aste";
import { eur } from "../../../lib/prezzi";

export const dynamic = "force-dynamic";
export const metadata = { title: "Offerta · PixelHype" };

// Stripe sends the bidder here after saving the card. We check with Stripe, then the bid becomes valid.
export default async function Grazie({ searchParams }) {
  const sp = await searchParams;
  let esito = { ok: false, motivo: "Non risulta nessuna carta salvata. L'offerta non è stata registrata." };
  if (process.env.STRIPE_SECRET_KEY && sp?.session_id) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const s = await stripe.checkout.sessions.retrieve(sp.session_id, { expand: ["setup_intent"] }).catch(() => null);
    const si = s?.setup_intent;
    if (si?.status === "succeeded" && s.metadata?.offerta) {
      esito = await confermaOfferta(Number(s.metadata.offerta), { carta: typeof si.payment_method === "string" ? si.payment_method : si.payment_method?.id, cliente: s.customer }).catch(() => esito);
    }
  }
  return (
    <section className="wrap buy" style={{ gridTemplateColumns: "1fr", maxWidth: 720 }}>
      <div className="card" style={{ display: "grid", gap: 16 }}>
        {esito.ok ? (
          <>
            <span className="step-n">Offerta registrata · {eur(esito.o.importo)}</span>
            <p className="ok-big">Sei in gara.</p>
            <p className="muted">Se alla fine la tua offerta è la più alta, ti addebitiamo {eur(esito.o.importo)} + IVA e il tuo spazio va online da solo. Se qualcuno offre di più, non paghi nulla. Torna sulla pagina dell'asta per vedere come va.</p>
          </>
        ) : (
          <>
            <span className="step-n">Offerta non registrata</span>
            <p className="muted">{esito.motivo}</p>
          </>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {esito.asta && <Link href={`/aste/${esito.asta}`} className="cta">Torna all'asta</Link>}
          <Link href="/aste" className="ghost">Tutte le aste</Link>
        </div>
      </div>
    </section>
  );
}
