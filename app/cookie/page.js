import Link from "next/link";
import Legale from "../components/Legale";
import { TITOLARE, AGGIORNATO, AGGIORNATO_EN } from "../../lib/legale";
import { traduttore } from "../../lib/lingua";

export const metadata = { title: "Cookie policy · PixelHype" };

export default async function Cookie() {
  const { en } = await traduttore();
  if (en) return <English />;
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

function English() {
  return (
    <Legale titolo="Cookie policy" aggiornato={AGGIORNATO_EN}>
      <h2>1. Cookies used by PixelHype</h2>
      <p>
        PixelHype does not use profiling, advertising or statistics cookies, and does not place third-party cookies on its pages.
        The site fonts are served from our own servers, with no connection to external services. For this reason we do not ask for
        your consent with a banner: the law only requires it for non-technical cookies (art. 122 of the Italian Privacy Code and the
        Italian Data Protection Authority guidelines of 10 June 2021).
      </p>

      <h2>2. Payments</h2>
      <p>
        When you pay or save a payment method you are taken to Stripe&apos;s pages (checkout.stripe.com). Stripe uses technical and
        anti-fraud cookies needed to complete the payment safely, according to its own{" "}
        <a href="https://stripe.com/legal/cookies-policy" target="_blank" rel="noopener noreferrer">cookie policy</a>.
      </p>

      <h2>3. How to manage cookies</h2>
      <p>You can always delete or block cookies in your browser settings. Blocking Stripe&apos;s technical cookies may prevent the payment.</p>

      <h2>4. Changes</h2>
      <p>
        If in the future we add tools that use non-technical cookies, we will update this page and ask for your consent before using
        them. For questions write to <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>. See also the <Link href="/privacy">Privacy policy</Link>.
      </p>
      <p className="muted">This is a translation for convenience: the Italian version prevails.</p>
    </Legale>
  );
}
