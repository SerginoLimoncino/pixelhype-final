import Link from "next/link";
import Legale from "../components/Legale";
import { TITOLARE, AGGIORNATO, dato } from "../../lib/legale";

export const metadata = { title: "Privacy policy · PixelHype" };

export default function Privacy() {
  return (
    <Legale titolo="Privacy policy" aggiornato={AGGIORNATO}>
      <p>
        Questa pagina spiega quali dati personali raccoglie PixelHype, perché e per quanto tempo, come previsto dal Regolamento
        europeo 2016/679 (&quot;GDPR&quot;) e dal Codice Privacy italiano.
      </p>

      <h2>1. Titolare del trattamento</h2>
      <p>
        {dato(TITOLARE.nome)}, {dato(TITOLARE.indirizzo)}, partita IVA / codice fiscale {dato(TITOLARE.piva)}. Per qualsiasi richiesta sui tuoi dati
        scrivi a <a href={`mailto:${TITOLARE.email}`}>{TITOLARE.email}</a>.
      </p>

      <h2>2. Quali dati raccogliamo</h2>
      <ul>
        <li><b>Dati dello spazio</b>: nome del brand, link e immagine. Questi dati sono pubblici: chiunque visita il sito li vede nel mosaico.</li>
        <li><b>Email</b>: per la ricevuta, per comunicazioni sull&apos;ordine o sull&apos;asta e per contattarti se lo spazio ha un problema.</li>
        <li><b>Dati di pagamento</b>: li gestisce Stripe. Noi riceviamo solo l&apos;esito del pagamento, un codice cliente e, per le aste, un riferimento al metodo di pagamento salvato. Non vediamo il numero della carta.</li>
        <li><b>Offerte alle aste</b>: importo, data e dati dello spazio che vorresti pubblicare.</li>
        <li><b>Dati tecnici</b>: indirizzo IP e informazioni sul browser registrati automaticamente dai server per sicurezza e funzionamento.</li>
      </ul>

      <h2>3. Perché li usiamo (basi giuridiche)</h2>
      <ul>
        <li>Per vendere e pubblicare lo spazio e gestire le aste: esecuzione del contratto (art. 6.1.b GDPR).</li>
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
      <p>Nome, link, immagine ed email sono necessari per acquistare uno spazio o fare un&apos;offerta: senza questi dati non possiamo fornire il servizio.</p>

      <h2>8. Minori</h2>
      <p>Il servizio è rivolto a persone maggiorenni e ad aziende. Non raccogliamo consapevolmente dati di minori di 18 anni.</p>

      <h2>9. Cookie</h2>
      <p>Le informazioni sui cookie sono nella <Link href="/cookie">Cookie policy</Link>.</p>
    </Legale>
  );
}
