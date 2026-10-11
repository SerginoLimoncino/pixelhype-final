// English versions of the messages the server sends back (link and image check, payment, bids).
// The server writes them in Italian; inglese() swaps them when the visitor reads the site in English.
const FISSI = {
  "Questo link non sembra un indirizzo web. Esempio: www.iltuosito.it": "This link does not look like a web address. Example: www.yoursite.com",
  "Questo link non è accettato.": "This link is not accepted.",
  "Usa l'indirizzo del sito (es. www.iltuosito.it), non un numero.": "Use the website address (e.g. www.yoursite.com), not a number.",
  "Non accettiamo link a siti per adulti.": "We do not accept links to adult websites.",
  "Il link deve portare a un sito, non a un file da scaricare.": "The link must lead to a website, not to a file to download.",
  "Questo sito non si apre. Controlla che il link sia giusto e che il sito sia online.": "This website does not open. Check that the link is right and that the site is online.",
  "Questo link rimanda troppe volte ad altri indirizzi.": "This link redirects too many times to other addresses.",
  "Questo sito non si apre (pagina non trovata o errore). Controlla il link.": "This website does not open (page not found or error). Check the link.",
  "Questo link risulta pericoloso (virus o truffa) e non può essere accettato.": "This link is flagged as dangerous (virus or scam) and cannot be accepted.",
  "Questa immagine non può essere accettata: contiene nudità, violenza o altri contenuti non ammessi. Scegline un'altra.": "This image cannot be accepted: it contains nudity, violence or other content that is not allowed. Choose another one.",
  "Dati mancanti.": "Some details are missing.",
  "Immagine mancante.": "The image is missing.",
  "Le aste non sono ancora aperte.": "The auctions are not open yet.",
  "Questa asta è chiusa.": "This auction is closed.",
  "Offerta non trovata.": "Bid not found.",
  "L'asta si è chiusa prima che la tua offerta arrivasse. Non ti verrà addebitato nulla.": "The auction closed before your bid arrived. You will not be charged anything.",
  "Nel frattempo qualcuno ha offerto di più. Non ti verrà addebitato nulla: puoi rilanciare.": "Meanwhile someone bid more. You will not be charged anything: you can raise your bid.",
  "Il pagamento non è partito. Riprova tra poco.": "The payment did not start. Please try again shortly.",
};
const VARI = [
  [/^Non ci sono più spazi da (\d+) pixel nel Cuore\.$/, (n) => `There are no more ${n}-pixel spaces in the Heart.`],
  [/^Gli spazi da (\d+) pixel sono esauriti\.$/, (n) => `The ${n}-pixel spaces are sold out.`],
  [/^L'offerta minima ora è ([\d.]+) €\.$/, (n) => `The minimum bid is now ${n} €.`],
];

export function inglese(msg, en) {
  if (!en || !msg) return msg;
  if (FISSI[msg]) return FISSI[msg];
  for (const [re, f] of VARI) { const m = re.exec(msg); if (m) return f(...m.slice(1)); }
  return msg;
}

// Wraps an API route so its "errore" / "motivo" texts come back in the visitor's language.
export function traduciRisposte(handler) {
  return async (req) => {
    const r = await handler(req);
    const { lingua } = await import("./lingua");
    if ((await lingua()) !== "en") return r;
    const d = await r.clone().json().catch(() => null);
    if (!d || (!d.errore && !d.motivo)) return r;
    return Response.json({ ...d, ...(d.errore && { errore: inglese(d.errore, true) }), ...(d.motivo && { motivo: inglese(d.motivo, true) }) }, { status: r.status });
  };
}
