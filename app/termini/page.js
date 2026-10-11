import Link from "next/link";
import Legale from "../components/Legale";
import { TITOLARE, AGGIORNATO, dato } from "../../lib/legale";

export const metadata = { title: "Termini e condizioni · PixelHype" };

export default function Termini() {
  return (
    <Legale titolo="Termini e condizioni" aggiornato={AGGIORNATO}>
      <h2>1. Chi siamo</h2>
      <p>
        Il sito getpixelhype.com (&quot;PixelHype&quot;) è gestito da {dato(TITOLARE.nome)}, con sede in {dato(TITOLARE.indirizzo)},
        partita IVA / codice fiscale {dato(TITOLARE.piva)}{TITOLARE.pec ? `, PEC ${TITOLARE.pec}` : ""}. Contatti: <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>.
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
        Uno spazio non può essere venduto o ceduto fuori da PixelHype. Quando il mosaico sarà completo potrà essere attivata una
        funzione di rivendita tramite il sito, con regole che verranno pubblicate in quel momento. Gli spazi non sono un investimento
        e non danno diritto a guadagni.
      </p>

      <h2>10. Dati personali</h2>
      <p>Il trattamento dei dati è descritto nella <Link href="/privacy">Privacy policy</Link> e nella <Link href="/cookie">Cookie policy</Link>.</p>

      <h2>11. Modifiche</h2>
      <p>Possiamo aggiornare questi termini. Agli acquisti già fatti si applicano i termini in vigore al momento dell&apos;acquisto.</p>

      <h2>12. Legge applicabile e controversie</h2>
      <p>
        Questi termini sono regolati dalla legge italiana. Per i consumatori è competente il giudice del luogo in cui il consumatore
        risiede. Se qualcosa non va, scrivici prima a <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>: proveremo a risolvere subito.
      </p>
    </Legale>
  );
}
