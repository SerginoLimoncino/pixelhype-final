import Link from "next/link";
import Legale from "../components/Legale";
import { TITOLARE, AGGIORNATO } from "../../lib/legale";

export const metadata = { title: "Cookie policy · PixelHype" };

export default function Cookie() {
  return (
    <Legale titolo="Cookie policy" aggiornato={AGGIORNATO}>
      <h2>1. Cookie usati da PixelHype</h2>
      <p>
        PixelHype non usa cookie di profilazione, di pubblicità o di statistica, e non installa cookie di terze parti sulle sue pagine.
        I caratteri del sito sono caricati dai nostri server, senza collegamenti a servizi esterni. Per questo non ti chiediamo il
        consenso con un banner: la legge lo richiede solo per i cookie non tecnici (art. 122 del Codice Privacy e Linee guida del
        Garante del 10 giugno 2021).
      </p>

      <h2>2. Pagamenti</h2>
      <p>
        Quando paghi o salvi un metodo di pagamento vieni portato sulle pagine di Stripe (checkout.stripe.com). Stripe usa cookie
        tecnici e antifrode necessari per completare il pagamento in sicurezza, secondo la propria{" "}
        <a href="https://stripe.com/it/legal/cookies-policy" target="_blank" rel="noopener noreferrer">cookie policy</a>.
      </p>

      <h2>3. Come gestire i cookie</h2>
      <p>Puoi sempre cancellare o bloccare i cookie dalle impostazioni del tuo browser. Bloccare i cookie tecnici di Stripe può impedire il pagamento.</p>

      <h2>4. Modifiche</h2>
      <p>
        Se in futuro aggiungeremo strumenti che usano cookie non tecnici, aggiorneremo questa pagina e chiederemo il tuo consenso prima
        di usarli. Per domande scrivi a <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>. Vedi anche la <Link href="/privacy">Privacy policy</Link>.
      </p>
    </Legale>
  );
}
