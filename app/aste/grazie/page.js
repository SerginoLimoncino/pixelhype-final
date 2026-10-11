import Link from "next/link";
import Stripe from "stripe";
import { confermaOfferta } from "../../../lib/aste";
import { eur } from "../../../lib/prezzi";
import { traduttore } from "../../../lib/lingua";
import { inglese } from "../../../lib/messaggi";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { T } = await traduttore();
  return { title: T("Offerta · PixelHype", "Bid · PixelHype") };
}

// Stripe sends the bidder here after saving the card. We check with Stripe, then the bid becomes valid.
export default async function Grazie({ searchParams }) {
  const sp = await searchParams;
  const { en, T } = await traduttore();
  let esito = { ok: false, motivo: T("Non risulta nessun metodo di pagamento salvato. L'offerta non è stata registrata.", "No saved payment method was found. The bid was not saved.") };
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
            <span className="step-n">{T("Offerta registrata", "Bid saved")} · {eur(esito.o.importo)}</span>
            <p className="ok-big">{T("Sei in gara.", "You are in the race.")}</p>
            <p className="muted">{en ? `If your bid is the highest at the end, we charge you ${eur(esito.o.importo)} + VAT and your space goes online by itself. If someone bids more, you pay nothing. Come back to the auction page to see how it goes.` : `Se alla fine la tua offerta è la più alta, ti addebitiamo ${eur(esito.o.importo)} + IVA e il tuo spazio va online da solo. Se qualcuno offre di più, non paghi nulla. Torna sulla pagina dell'asta per vedere come va.`}</p>
          </>
        ) : (
          <>
            <span className="step-n">{T("Offerta non registrata", "Bid not saved")}</span>
            <p className="muted">{inglese(esito.motivo, en)}</p>
          </>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {esito.asta && <Link href={`/aste/${esito.asta}`} className="cta">{T("Torna all'asta", "Back to the auction")}</Link>}
          <Link href="/aste" className="ghost">{T("Tutte le aste", "All auctions")}</Link>
        </div>
      </div>
    </section>
  );
}
