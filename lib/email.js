// Emails through Resend (free plan, RESEND_API_KEY on Vercel). Without the key nothing is sent and the site works the same.
const MITTENTE = "PixelHype <info@getpixelhype.com>";
const AVVISI = "pixelhype.info@gmail.com"; // where Sergio gets the new-booking alerts

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

async function invia({ a, oggetto, html, testo }) {
  const chiave = process.env.RESEND_API_KEY;
  if (!chiave) return false;
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${chiave}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: MITTENTE, to: [a], reply_to: "info@getpixelhype.com", subject: oggetto, html, text: testo }),
    signal: AbortSignal.timeout(10000),
  }).catch(() => null);
  return !!r?.ok;
}

// Gallery look: ivory card, gold line, dark green button.
const pagina = (titolo, corpo, bottone) => `<!doctype html><html><body style="margin:0;background:#efede7;font-family:Georgia,serif;color:#1b1a17">
<div style="max-width:520px;margin:0 auto;padding:32px 16px">
<div style="background:#faf8f4;border:1px solid #d8cfb8;padding:32px">
<div style="font:600 12px/1 Arial,sans-serif;letter-spacing:3px;color:#8a6a2f;text-transform:uppercase">PixelHype</div>
<div style="height:1px;background:#b8955a;margin:16px 0 24px"></div>
<h1 style="font-weight:400;font-size:28px;margin:0 0 16px">${titolo}</h1>
<div style="font:15px/1.6 Arial,sans-serif;color:#3a372f">${corpo}</div>
${bottone ? `<p style="margin:28px 0 0"><a href="${bottone.href}" style="background:#143c2e;color:#faf8f4;text-decoration:none;font:600 15px Arial,sans-serif;padding:12px 24px;border-radius:999px;display:inline-block">${bottone.testo}</a></p>` : ""}
</div>
<p style="font:12px Arial,sans-serif;color:#8d877a;text-align:center;margin-top:16px">getpixelhype.com · info@getpixelhype.com</p>
</div></body></html>`;

export async function emailPrenotazione({ email, pack, nome, en }) {
  const n = esc(nome);
  const px = en ? `${pack} pixel${pack > 1 ? "s" : ""}` : `${pack} pixel`;
  const oggetto = en ? "You're in: your place in PixelHype is booked" : "Ci sei: il tuo posto in PixelHype è prenotato";
  const p = (t) => `<p style="margin:0 0 14px">${t}</p>`;
  const corpo = en
    ? p(`Thank you${n ? `, ${n}` : ""}, for believing in PixelHype from the very beginning. You have just booked a space of <b>${px}</b>, and that makes you one of the very first people to take part in this adventure.`) +
      p("PixelHype was born from a simple idea: to create, together, a living work of art. A mosaic of 10,000 pixels where big brands, small shops and dreamers sit side by side, each in their own place. And once your space is in the mosaic, it never moves again: it stays there, forever.") +
      p("Sales will open as soon as enough of us are on the list, and on that day we will write to you before anyone else, so you can be among the first to choose. Whoever arrives early pays less, because the price goes up with every phase, and once the 10,000 pixels are gone there will be no more.") +
      p("For now you pay nothing. Just get your image ready and imagine it in the mosaic: we can't wait to see it there.") +
      p("See you very soon,<br>PixelHype") +
      `<p style="margin:0;color:#8d877a;font-size:13px">If you did not make this booking, just ignore this email.</p>`
    : p(`Grazie${n ? `, ${n}` : ""}, per aver creduto in PixelHype fin dall'inizio. Hai appena prenotato uno spazio da <b>${px}</b> e sei tra le primissime persone a far parte di questa avventura.`) +
      p("PixelHype nasce da un'idea semplice: creare insieme un'opera d'arte vivente. Un mosaico di 10.000 pixel dove grandi marchi, piccoli negozi e sognatori stanno uno accanto all'altro, ognuno nel suo posto. E quando il tuo spazio entra nel mosaico non si sposta più: resta lì, per sempre.") +
      p("La vendita si aprirà appena saremo abbastanza in lista, e quel giorno ti scriveremo prima di chiunque altro, così potrai scegliere prima degli altri. Chi arriva presto paga meno, perché il prezzo sale a ogni fase, e quando i 10.000 pixel saranno finiti non ce ne saranno altri.") +
      p("Per ora non paghi nulla. Prepara la tua immagine e immaginala già nel mosaico: noi non vediamo l'ora di vederla lì.") +
      p("A prestissimo,<br>PixelHype") +
      `<p style="margin:0;color:#8d877a;font-size:13px">Se non hai fatto tu questa prenotazione, ignora questa email.</p>`;
  const testo = en
    ? `Thank you! You booked a space of ${px} in PixelHype, a mosaic of 10,000 pixels where your space stays forever. When sales open we write to you before anyone else. Whoever arrives first pays less. You pay nothing now. getpixelhype.com`
    : `Grazie! Hai prenotato uno spazio da ${px} in PixelHype, un mosaico di 10.000 pixel dove il tuo spazio resta per sempre. Quando si apre la vendita ti scriviamo prima di tutti. Chi arriva prima paga meno. Ora non paghi nulla. getpixelhype.com`;
  return invia({ a: email, oggetto, html: pagina(en ? "You're in. Forever starts here." : "Ci sei. Il tuo per sempre inizia qui.", corpo, { href: "https://www.getpixelhype.com", testo: en ? "See the mosaic" : "Guarda il mosaico" }), testo });
}

export async function avvisoNuovaPrenotazione({ email, pack, nome, link }) {
  const riga = `${pack} pixel · ${nome || "senza nome"} · ${email}${link ? ` · ${link}` : ""}`;
  return invia({ a: AVVISI, oggetto: `Nuova prenotazione: ${pack} pixel`, html: pagina("Nuova prenotazione", esc(riga) + "<br><br>La trovi nel pannello, riquadro Prenotazioni."), testo: riga });
}
