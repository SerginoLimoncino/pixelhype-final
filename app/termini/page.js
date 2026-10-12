import Link from "next/link";
import Legale from "../components/Legale";
import { TITOLARE, AGGIORNATO, AGGIORNATO_EN, dato } from "../../lib/legale";
import { traduttore } from "../../lib/lingua";

export async function generateMetadata() {
  const { T } = await traduttore();
  return { title: T("Termini e condizioni · PixelHype", "Terms and conditions · PixelHype") };
}

export default async function Termini() {
  const { en } = await traduttore();
  if (en) return <English />;
  return (
    <Legale titolo="Termini e condizioni" aggiornato={AGGIORNATO}>
      <h2>1. Chi siamo</h2>
      <p>
        Il sito getpixelhype.com (&quot;PixelHype&quot;) è gestito da {dato(TITOLARE.nome)}, con sede in {dato(TITOLARE.indirizzo)}
        {TITOLARE.piva ? `, partita IVA / codice fiscale ${TITOLARE.piva}` : ""}{TITOLARE.pec ? `, PEC ${TITOLARE.pec}` : ""}. Contatti: <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>.
      </p>

      <h2>2. Cosa vende PixelHype</h2>
      <p>
        PixelHype è un mosaico digitale di 10.000 pixel. Chi acquista ottiene il diritto di mostrare nel mosaico un&apos;immagine con un
        nome e un collegamento al proprio sito, in uno spazio della misura scelta (da 1 a 100 pixel, oppure lo spazio vinto all&apos;asta).
        Si tratta di un servizio digitale di visibilità pubblicitaria: non si acquista la proprietà di nessuna parte del sito, del dominio
        o del software.
      </p>

      <h2>3. Posizione e durata</h2>
      <ul>
        <li>La posizione nel mosaico viene assegnata a caso dal sistema al momento dell&apos;acquisto e non può essere scelta né spostata. Per gli spazi all&apos;asta la posizione è quella indicata nella pagina dell&apos;asta.</li>
        <li>Lo spazio resta nel mosaico per tutta la vita del sito PixelHype. &quot;Per sempre&quot; significa per tutto il tempo in cui il sito resterà online.</li>
        <li>Se il sito dovesse chiudere per cause che non dipendono da noi (per esempio la chiusura dei fornitori tecnici o un obbligo di legge), non è previsto un rimborso.</li>
      </ul>

      <h2>4. Prezzi e pagamento</h2>
      <ul>
        <li>I prezzi sono indicati nel sito al momento dell&apos;ordine e cambiano automaticamente in base ai pixel venduti. Il prezzo che paghi è quello mostrato nel riepilogo prima del pagamento.</li>
        <li>Il pagamento avviene tramite Stripe (carta o altri metodi disponibili, come PayPal). PixelHype non vede né conserva i dati della tua carta.</li>
        <li>Il contratto è concluso quando il pagamento viene confermato: lo vedi nella pagina finale e ricevi la ricevuta di pagamento per email.</li>
      </ul>

      <h2>5. Aste</h2>
      <ul>
        <li>Alcuni spazi sono venduti all&apos;asta. Ogni asta ha una base di partenza e una data di fine indicate nella sua pagina. Se arriva un&apos;offerta negli ultimi 5 minuti, l&apos;asta si allunga di 5 minuti.</li>
        <li>Per fare un&apos;offerta salvi un metodo di pagamento tramite Stripe. Non paghi nulla subito.</li>
        <li>Un&apos;offerta è vincolante: se alla fine è la più alta, l&apos;importo viene addebitato automaticamente sul metodo di pagamento salvato e lo spazio viene assegnato.</li>
        <li>Se l&apos;addebito non riesce, lo spazio passa all&apos;offerta successiva più alta. Se nessuno offre, l&apos;asta può ripartire più avanti con una base diversa.</li>
      </ul>

      <h2>6. Cosa puoi pubblicare</h2>
      <p>Pubblicando un&apos;immagine, un nome e un link dichiari di averne il diritto e ti assumi la responsabilità del loro contenuto. Non sono ammessi:</p>
      <ul>
        <li>contenuti per adulti, violenti, offensivi, discriminatori o illegali;</li>
        <li>immagini, marchi o nomi di altri senza autorizzazione;</li>
        <li>link a siti pericolosi, truffe, virus, download automatici o contenuti per adulti;</li>
        <li>pubblicità di attività vietate dalla legge.</li>
      </ul>
      <p>
        Immagini e link vengono controllati automaticamente prima della pubblicazione. Possiamo rifiutare, nascondere o rimuovere in
        qualsiasi momento uno spazio che viola queste regole, anche se il link cambia contenuto dopo l&apos;acquisto. In questi casi non è
        previsto un rimborso. Puoi chiederci di cambiare immagine o link scrivendo a <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>; la
        modifica viene controllata come la prima pubblicazione.
      </p>

      <h2>7. Diritto di recesso</h2>
      <p>
        Se acquisti come consumatore (persona fisica che agisce per scopi estranei alla propria attività), la legge prevede di norma
        14 giorni per recedere. Trattandosi di un servizio digitale che viene pubblicato subito, al momento dell&apos;acquisto ti chiediamo di
        accettare espressamente che il servizio inizi subito e di riconoscere che, una volta pubblicato lo spazio, perdi il diritto di
        recesso (art. 59, comma 1, lettere a) e o) del Codice del Consumo). Fino alla pubblicazione puoi scriverci per annullare l&apos;ordine.
        Se acquisti per la tua attività (azienda o professionista), il recesso non è previsto.
      </p>

      <h2>8. Garanzie e responsabilità</h2>
      <ul>
        <li>Facciamo il possibile perché il sito sia sempre raggiungibile, ma possono esserci interruzioni per manutenzione o problemi dei fornitori tecnici.</li>
        <li>PixelHype non garantisce un numero di visite o di clic verso il tuo sito.</li>
        <li>Restano salvi i diritti che la legge riconosce ai consumatori, compresa la garanzia di conformità dei servizi digitali (artt. 135-octies e seguenti del Codice del Consumo).</li>
      </ul>

      <h2>9. Rivendita</h2>
      <p>
        Uno spazio non può essere venduto o ceduto fuori da PixelHype. Un mese dopo il completamento del mosaico verrà attivata la
        rivendita tramite il sito: chi possiede uno spazio potrà metterlo in vendita a un prezzo non inferiore alla metà di quanto lo
        ha pagato. Su ogni rivendita PixelHype trattiene una commissione del 7% del prezzo di vendita. Gli spazi non sono un
        investimento: nessuno garantisce che uno spazio venga rivenduto, né a quale prezzo, e non danno diritto a guadagni.
      </p>

      <h2>10. Dati personali</h2>
      <p>Il trattamento dei dati è descritto nella <Link href="/privacy">Privacy policy</Link> e nella <Link href="/cookie">Cookie policy</Link>.</p>

      <h2>11. Modifiche</h2>
      <p>Possiamo aggiornare questi termini. Agli acquisti già fatti si applicano i termini in vigore al momento dell&apos;acquisto.</p>

      <h2>12. Legge applicabile e controversie</h2>
      <p>
        Questi termini sono regolati dalla legge italiana. Restano salve le norme inderogabili a tutela dei consumatori del Paese in cui
        risiedono. Per i consumatori è competente il giudice del luogo in cui il consumatore
        risiede. Se qualcosa non va, scrivici prima a <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>: proveremo a risolvere subito.
      </p>
    </Legale>
  );
}

function English() {
  return (
    <Legale titolo="Terms and conditions" aggiornato={AGGIORNATO_EN}>
      <h2>1. Who we are</h2>
      <p>
        The website getpixelhype.com (&quot;PixelHype&quot;) is run by {dato(TITOLARE.nome, true)}, based in {dato(TITOLARE.indirizzo, true)}
        {TITOLARE.piva ? `, VAT number / tax code ${TITOLARE.piva}` : ""}{TITOLARE.pec ? `, PEC ${TITOLARE.pec}` : ""}. Contact: <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>.
      </p>

      <h2>2. What PixelHype sells</h2>
      <p>
        PixelHype is a digital mosaic of 10,000 pixels. A buyer gets the right to show in the mosaic an image with a name and a link to
        their own website, in a space of the chosen size (from 1 to 100 pixels, or the space won at auction). It is a digital advertising
        visibility service: you do not buy ownership of any part of the site, the domain or the software.
      </p>

      <h2>3. Position and duration</h2>
      <ul>
        <li>The position in the mosaic is assigned at random by the system at the time of purchase and cannot be chosen or moved. For auction spaces the position is the one shown on the auction page.</li>
        <li>The space stays in the mosaic for the whole life of the PixelHype site. &quot;Forever&quot; means for as long as the site stays online.</li>
        <li>If the site has to close for reasons beyond our control (for example technical providers shutting down or a legal obligation), no refund is due.</li>
      </ul>

      <h2>4. Prices and payment</h2>
      <ul>
        <li>Prices are shown on the site at the time of the order and change automatically with the number of pixels sold. The price you pay is the one shown in the summary before payment.</li>
        <li>Payment goes through Stripe (card or other available methods, such as PayPal). PixelHype never sees or stores your card details.</li>
        <li>The contract is concluded when the payment is confirmed: you see it on the final page and receive the payment receipt by email.</li>
      </ul>

      <h2>5. Auctions</h2>
      <ul>
        <li>Some spaces are sold at auction. Each auction has a starting price and an end date shown on its page. If a bid arrives in the last 5 minutes, the auction is extended by 5 minutes.</li>
        <li>To bid you save a payment method through Stripe. You pay nothing right away.</li>
        <li>A bid is binding: if it is the highest at the end, the amount is charged automatically to the saved payment method and the space is assigned.</li>
        <li>If the charge fails, the space goes to the next highest bid. If nobody bids, the auction may restart later with a different starting price.</li>
      </ul>

      <h2>6. What you can publish</h2>
      <p>By publishing an image, a name and a link you declare that you have the right to do so and you take responsibility for their content. The following are not allowed:</p>
      <ul>
        <li>adult, violent, offensive, discriminatory or illegal content;</li>
        <li>other people&apos;s images, trademarks or names without permission;</li>
        <li>links to dangerous sites, scams, viruses, automatic downloads or adult content;</li>
        <li>advertising of activities forbidden by law.</li>
      </ul>
      <p>
        Images and links are checked automatically before publication. We may refuse, hide or remove at any time a space that breaks
        these rules, even if the link changes content after the purchase. In these cases no refund is due. You can ask us to change
        the image or link by writing to <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>; the change is checked like the first publication.
      </p>

      <h2>7. Right of withdrawal</h2>
      <p>
        If you buy as a consumer (a private person acting for purposes outside their business), the law usually gives 14 days to
        withdraw. Since this is a digital service published right away, at the time of purchase we ask you to expressly agree that the
        service starts immediately and to acknowledge that, once the space is published, you lose the right of withdrawal (art. 59,
        paragraph 1, letters a) and o) of the Italian Consumer Code, art. 16 of Directive 2011/83/EU). Until publication you can write
        to us to cancel the order. If you buy for your business (company or professional), withdrawal does not apply.
      </p>

      <h2>8. Guarantees and liability</h2>
      <ul>
        <li>We do our best to keep the site always reachable, but there may be interruptions for maintenance or problems with technical providers.</li>
        <li>PixelHype does not guarantee any number of visits or clicks to your website.</li>
        <li>The rights the law gives consumers remain unaffected, including the legal guarantee of conformity for digital services.</li>
      </ul>

      <h2>9. Resale</h2>
      <p>
        A space cannot be sold or transferred outside PixelHype. One month after the mosaic is complete, resale through the site will be
        switched on: the owner of a space will be able to put it up for sale at a price no lower than half of what they paid for it.
        On every resale PixelHype keeps a 7% fee on the sale price. Spaces are not an investment: nobody guarantees that a space will
        be resold, or at what price, and they give no right to any profit.
      </p>

      <h2>10. Personal data</h2>
      <p>How we handle data is described in the <Link href="/privacy">Privacy policy</Link> and the <Link href="/cookie">Cookie policy</Link>.</p>

      <h2>11. Changes</h2>
      <p>We may update these terms. Purchases already made are governed by the terms in force at the time of purchase.</p>

      <h2>12. Applicable law and disputes</h2>
      <p>
        These terms are governed by Italian law. Consumers keep the protection of the mandatory rules of the country where they live,
        and the competent court is the one where the consumer lives. If something goes wrong, write to us first at <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>: we will try to sort it out right away.
      </p>
      <p className="muted">This is a translation for convenience: the Italian version prevails.</p>
    </Legale>
  );
}
