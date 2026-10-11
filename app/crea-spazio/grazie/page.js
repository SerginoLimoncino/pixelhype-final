import Link from "next/link";
import { after } from "next/server";
import Stripe from "stripe";
import { PACCHETTI, nomePack, misura, eur } from "../../../lib/prezzi";
import { traduttore } from "../../../lib/lingua";
import { dbAttivo, assegnaPosizione } from "../../../lib/db";

export async function generateMetadata() {
  const { T } = await traduttore();
  return { title: T("Grazie · PixelHype", "Thank you · PixelHype") };
}

// Stripe sends the buyer here after paying. We check with Stripe that the payment really went through,
// then the space gets its random position and goes online (or waits for Sergio if the image was doubtful).
export default async function Grazie({ searchParams }) {
  const sp = await searchParams;
  const { en, T } = await traduttore();
  let s = null;
  if (process.env.STRIPE_SECRET_KEY && sp?.session_id) {
    s = await new Stripe(process.env.STRIPE_SECRET_KEY).checkout.sessions.retrieve(sp.session_id).catch(() => null);
  }
  const pagato = s?.payment_status === "paid";
  const p = pagato ? PACCHETTI[s.metadata?.pack] : null;
  const dubbio = s?.metadata?.da_controllare === "si";

  let spazio = null;
  if (pagato && dbAttivo() && s.metadata?.ordine) {
    // Never keep the buyer waiting: after 8 seconds the page shows anyway, and the space is placed within minutes
    // by the next visit to the mosaic (lib/aste.js, sistemaOrdini).
    const attesa = new Promise((ok) => setTimeout(() => ok(null), 8000));
    spazio = await Promise.race([assegnaPosizione(Number(s.metadata.ordine), dubbio ? "da_controllare" : "online").catch(() => null), attesa]);
    // Not placed in time: keep trying in the background once the page has been sent (up to 3 tries).
    if (!spazio) after(async () => {
      for (let i = 0; i < 3; i++) {
        if (await assegnaPosizione(Number(s.metadata.ordine), dubbio ? "da_controllare" : "online").catch(() => null)) return;
        await new Promise((ok) => setTimeout(ok, 5000));
      }
    });
  }

  return (
    <section className="wrap buy" style={{ gridTemplateColumns: "1fr", maxWidth: 720 }}>
      <div className="card" style={{ display: "grid", gap: 16 }}>
        {pagato ? (
          <>
            <span className="step-n">{T("Pagamento riuscito", "Payment successful")} · {eur(s.amount_total / 100)}</span>
            <p className="ok-big">{T("Sei nell'opera. Per sempre.", "You are in the artwork. Forever.")}</p>
            {en ? (
              spazio?.x != null ? (
                <p className="muted">
                  Your space {p ? `"${nomePack(p.n, true)}" (${misura(p.n, true)})` : ""} for <b>{s.metadata?.nome}</b> is at <b>row {spazio.y + 1}, column {spazio.x + 1}</b> of the mosaic.{" "}
                  {spazio.stato === "online" ? "It is already online." : "It will go online as soon as the image is checked."} The receipt is on its way to {s.customer_details?.email}.
                </p>
              ) : (
                <p className="muted">Done. Your space {p ? `"${nomePack(p.n, true)}" (${misura(p.n, true)})` : ""} for <b>{s.metadata?.nome}</b> will appear in the mosaic within 10 minutes, at a random position. The receipt is on its way to {s.customer_details?.email}.</p>
              )
            ) : spazio?.x != null ? (
              <p className="muted">
                Il tuo spazio {p ? `"${p.nome}" (${p.titolo})` : ""} per <b>{s.metadata?.nome}</b> è alla <b>riga {spazio.y + 1}, colonna {spazio.x + 1}</b> del mosaico.{" "}
                {spazio.stato === "online" ? "È già online." : "Andrà online appena controllata l'immagine."} La ricevuta arriva a {s.customer_details?.email}.
              </p>
            ) : (
              <p className="muted">Operazione conclusa. Il tuo spazio {p ? `"${p.nome}" (${p.titolo})` : ""} per <b>{s.metadata?.nome}</b> comparirà nel mosaico entro 10 minuti, in una posizione scelta a caso. La ricevuta arriva a {s.customer_details?.email}.</p>
            )}
          </>
        ) : (
          <>
            <span className="step-n">{T("Pagamento non trovato", "Payment not found")}</span>
            <p className="muted">{T("Non risulta un pagamento completato. Se pensi sia un errore, scrivici e controlliamo subito.", "We cannot find a completed payment. If you think this is a mistake, write to us and we will check right away.")}</p>
          </>
        )}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Link href="/#galleria" className="cta">{T("Torna al mosaico", "Back to the mosaic")}</Link>
          <Link href="/compra" className="ghost">{T("Prendi un altro spazio", "Get another space")}</Link>
        </div>
      </div>
    </section>
  );
}
