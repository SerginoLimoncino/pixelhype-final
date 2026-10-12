import Link from "next/link";
import Legale from "../components/Legale";
import { TITOLARE, AGGIORNATO, AGGIORNATO_EN, dato } from "../../lib/legale";
import { traduttore } from "../../lib/lingua";

export const metadata = { title: "Privacy policy · PixelHype" };

export default async function Privacy() {
  const { en } = await traduttore();
  if (en) return <English />;
  return (
    <Legale titolo="Privacy policy" aggiornato={AGGIORNATO}>
      <p>
        Questa pagina spiega quali dati personali raccoglie PixelHype, perché e per quanto tempo, come previsto dal Regolamento
        europeo 2016/679 (&quot;GDPR&quot;) e dal Codice Privacy italiano.
      </p>

      <h2>1. Titolare del trattamento</h2>
      <p>
        {dato(TITOLARE.nome)}, {dato(TITOLARE.indirizzo)}{TITOLARE.piva ? `, partita IVA / codice fiscale ${TITOLARE.piva}` : ""}. Per qualsiasi richiesta sui tuoi dati
        scrivi a <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>.
      </p>

      <h2>2. Quali dati raccogliamo</h2>
      <ul>
        <li><b>Dati dello spazio</b>: nome del brand, link e immagine. Questi dati sono pubblici: chiunque visita il sito li vede nel mosaico.</li>
        <li><b>Email</b>: per la ricevuta, per comunicazioni sull&apos;ordine o sull&apos;asta e per contattarti se lo spazio ha un problema.</li>
        <li><b>Dati di pagamento</b>: li gestisce Stripe. Noi riceviamo solo l&apos;esito del pagamento, un codice cliente e, per le aste, un riferimento al metodo di pagamento salvato. Non vediamo il numero della carta.</li>
        <li><b>Offerte alle aste</b>: importo, data e dati dello spazio che vorresti pubblicare.</li>
        <li><b>Prenotazioni</b>: email, misura scelta e, se li dai, nome del brand, link e immagine. Li usiamo solo per avvisarti quando si apre la vendita e per preparare il tuo spazio. Per bloccare gli abusi teniamo anche un breve codice ricavato dal tuo indirizzo IP (non l&apos;indirizzo stesso).</li>
        <li><b>Dati tecnici</b>: indirizzo IP e informazioni sul browser registrati automaticamente dai server per sicurezza e funzionamento.</li>
      </ul>

      <h2>3. Perché li usiamo (basi giuridiche)</h2>
      <ul>
        <li>Per vendere e pubblicare lo spazio e gestire le aste: esecuzione del contratto (art. 6.1.b GDPR).</li>
        <li>Per avvisarti quando si apre la vendita, se hai prenotato: il tuo consenso (art. 6.1.a GDPR), che puoi ritirare quando vuoi scrivendoci.</li>
        <li>Per gli obblighi fiscali e contabili: obbligo di legge (art. 6.1.c GDPR).</li>
        <li>Per controllare che immagini e link siano sicuri e leciti e per proteggere il sito da abusi: legittimo interesse (art. 6.1.f GDPR).</li>
      </ul>
      <p>Non usiamo i tuoi dati per pubblicità, non li vendiamo e non facciamo profilazione.</p>

      <h2>4. Con chi li condividiamo</h2>
      <p>I dati sono trattati da fornitori che ci aiutano a far funzionare il sito, nominati responsabili del trattamento:</p>
      <ul>
        <li><b>Vercel Inc.</b> (USA): ospita il sito.</li>
        <li><b>Supabase</b>: database e archivio immagini, su server a Francoforte (UE).</li>
        <li><b>Stripe</b> (Irlanda e USA): pagamenti, compreso PayPal se scelto.</li>
        <li><b>Sightengine</b> (Francia) e, se attivo, <b>OpenAI</b> (USA): controllo automatico delle immagini prima della pubblicazione.</li>
        <li><b>abuse.ch URLhaus</b> (Svizzera) e, se attivo, <b>Google Safe Browsing</b>: controllo di sicurezza dei link (ricevono solo il link).</li>
        <li><b>ImprovMX</b> e <b>Google</b> (Gmail): ricezione delle email inviate a {TITOLARE.email}.</li>
        <li><b>Resend</b> (USA, server in Irlanda): invio delle email del sito, come la conferma della prenotazione (riceve email, nome del brand e misura).</li>
      </ul>
      <p>
        Alcuni fornitori si trovano fuori dall&apos;Unione Europea. In questi casi il trasferimento avviene con le garanzie previste dal
        GDPR (decisione di adeguatezza UE-USA &quot;Data Privacy Framework&quot; o clausole contrattuali standard della Commissione Europea).
        I dati possono essere comunicati alle autorità quando la legge lo richiede.
      </p>

      <h2>5. Per quanto tempo</h2>
      <ul>
        <li>Nome, link e immagine dello spazio: finché lo spazio resta nel mosaico.</li>
        <li>Dati degli ordini e dei pagamenti: 10 anni, come richiesto dalle norme fiscali.</li>
        <li>Prenotazioni: fino all&apos;apertura della vendita e al massimo 12 mesi, poi le cancelliamo.</li>
        <li>Offerte alle aste non vincenti: fino a 12 mesi dalla fine dell&apos;asta.</li>
        <li>Ordini mai pagati: cancellati automaticamente.</li>
        <li>Registri tecnici dei server: per il tempo previsto dai fornitori, di norma pochi giorni o settimane.</li>
      </ul>

      <h2>6. I tuoi diritti</h2>
      <p>
        Puoi chiederci in qualsiasi momento di accedere ai tuoi dati, correggerli, cancellarli, limitarne l&apos;uso, riceverli in un formato
        leggibile o opporti al trattamento basato sul legittimo interesse (artt. 15-22 GDPR), scrivendo a <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>.
        La cancellazione di uno spazio già pagato comporta la sua rimozione dal mosaico, mentre i dati fiscali vanno conservati per legge.
        Se pensi che i tuoi dati siano trattati in modo scorretto puoi presentare reclamo al Garante per la protezione dei dati personali
        (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>).
      </p>

      <h2>7. Dati obbligatori</h2>
      <p>Nome, immagine ed email sono necessari per acquistare uno spazio o fare un&apos;offerta: senza questi dati non possiamo fornire il servizio. Il link è facoltativo. Per prenotare basta l&apos;email.</p>

      <h2>8. Minori</h2>
      <p>Il servizio è rivolto a persone maggiorenni e ad aziende. Non raccogliamo consapevolmente dati di minori di 18 anni.</p>

      <h2>9. Cookie</h2>
      <p>Le informazioni sui cookie sono nella <Link href="/cookie">Cookie policy</Link>.</p>
    </Legale>
  );
}

function English() {
  return (
    <Legale titolo="Privacy policy" aggiornato={AGGIORNATO_EN}>
      <p>
        This page explains which personal data PixelHype collects, why and for how long, as required by the European Regulation
        2016/679 (&quot;GDPR&quot;) and the Italian Privacy Code.
      </p>

      <h2>1. Data controller</h2>
      <p>
        {dato(TITOLARE.nome, true)}, {dato(TITOLARE.indirizzo, true)}{TITOLARE.piva ? `, VAT number / tax code ${TITOLARE.piva}` : ""}. For any request about your data
        write to <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>.
      </p>

      <h2>2. What data we collect</h2>
      <ul>
        <li><b>Space data</b>: brand name, link and image. These data are public: anyone visiting the site sees them in the mosaic.</li>
        <li><b>Email</b>: for the receipt, for messages about your order or auction and to contact you if the space has a problem.</li>
        <li><b>Payment data</b>: handled by Stripe. We only receive the payment result, a customer code and, for auctions, a reference to the saved payment method. We never see the card number.</li>
        <li><b>Auction bids</b>: amount, date and the details of the space you would like to publish.</li>
        <li><b>Bookings</b>: email, chosen size and, if you give them, brand name, link and image. We only use them to tell you when sales open and to prepare your space. To stop abuse we also keep a short code derived from your IP address (not the address itself).</li>
        <li><b>Technical data</b>: IP address and browser information recorded automatically by the servers for security and operation.</li>
      </ul>

      <h2>3. Why we use them (legal bases)</h2>
      <ul>
        <li>To sell and publish the space and run the auctions: performance of the contract (art. 6.1.b GDPR).</li>
        <li>To tell you when sales open, if you booked: your consent (art. 6.1.a GDPR), which you can withdraw at any time by writing to us.</li>
        <li>For tax and accounting obligations: legal obligation (art. 6.1.c GDPR).</li>
        <li>To check that images and links are safe and lawful and to protect the site from abuse: legitimate interest (art. 6.1.f GDPR).</li>
      </ul>
      <p>We do not use your data for advertising, we do not sell it and we do not do profiling.</p>

      <h2>4. Who we share them with</h2>
      <p>The data are processed by providers that help us run the site, appointed as data processors:</p>
      <ul>
        <li><b>Vercel Inc.</b> (USA): hosts the site.</li>
        <li><b>Supabase</b>: database and image storage, on servers in Frankfurt (EU).</li>
        <li><b>Stripe</b> (Ireland and USA): payments, including PayPal if chosen.</li>
        <li><b>Sightengine</b> (France) and, if active, <b>OpenAI</b> (USA): automatic check of images before publication.</li>
        <li><b>abuse.ch URLhaus</b> (Switzerland) and, if active, <b>Google Safe Browsing</b>: security check of links (they only receive the link).</li>
        <li><b>ImprovMX</b> and <b>Google</b> (Gmail): receiving the emails sent to {TITOLARE.email}.</li>
        <li><b>Resend</b> (USA, servers in Ireland): sending the site&apos;s emails, such as the booking confirmation (it receives the email, brand name and size).</li>
      </ul>
      <p>
        Some providers are outside the European Union. In these cases the transfer takes place with the safeguards provided by the
        GDPR (EU-US &quot;Data Privacy Framework&quot; adequacy decision or the European Commission&apos;s standard contractual clauses).
        Data may be disclosed to the authorities when the law requires it.
      </p>

      <h2>5. For how long</h2>
      <ul>
        <li>Name, link and image of the space: as long as the space stays in the mosaic.</li>
        <li>Order and payment data: 10 years, as required by tax rules.</li>
        <li>Bookings: until sales open and for 12 months at most, then we delete them.</li>
        <li>Losing auction bids: up to 12 months after the end of the auction.</li>
        <li>Orders never paid: deleted automatically.</li>
        <li>Server technical logs: for the time set by the providers, usually a few days or weeks.</li>
      </ul>

      <h2>6. Your rights</h2>
      <p>
        You can ask us at any time to access your data, correct it, delete it, restrict its use, receive it in a readable format or
        object to processing based on legitimate interest (arts. 15-22 GDPR), by writing to <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>.
        Deleting a space that has already been paid for means removing it from the mosaic, while tax data must be kept by law.
        If you think your data are processed unfairly you can lodge a complaint with the Italian Data Protection Authority
        (<a href="https://www.garanteprivacy.it" target="_blank" rel="noopener noreferrer">garanteprivacy.it</a>) or with the authority of your country.
      </p>

      <h2>7. Required data</h2>
      <p>Name, image and email are needed to buy a space or place a bid: without these data we cannot provide the service. The link is optional. To book, the email is enough.</p>

      <h2>8. Minors</h2>
      <p>The service is for adults and businesses. We do not knowingly collect data from people under 18.</p>

      <h2>9. Cookies</h2>
      <p>Information about cookies is in the <Link href="/cookie">Cookie policy</Link>.</p>
      <p className="muted">This is a translation for convenience: the Italian version prevails.</p>
    </Legale>
  );
}
