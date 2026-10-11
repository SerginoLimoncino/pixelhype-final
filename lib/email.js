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
    ? p(`Thank you${n ? `, <b>${n}</b>` : ""}. You have just booked a space of <b>${px}</b> in PixelHype, and you are one of the very first.`) +
      p("PixelHype is a living work of art: a mosaic of 10,000 pixels where brands, shops and dreamers each get their own place. Once it is placed, your space never moves again. It stays in the artwork forever.") +
      p("Sales open as soon as enough people have joined the list. On that day we will write to you <b>before anyone else</b>, so you can choose your space first.") +
      p("Remember: whoever arrives first pays less. The price per pixel goes up with every phase, and there are only 10,000 pixels: when they are gone, there will be no more.") +
      p("You pay nothing now. Get your image ready: soon your brand will be part of the mosaic.") +
      `<p style="margin:0;color:#8d877a;font-size:13px">If you did not make this booking, just ignore this email.</p>`
    : p(`Grazie${n ? `, <b>${n}</b>` : ""}. Hai appena prenotato uno spazio da <b>${px}</b> in PixelHype e sei tra i primissimi.`) +
      p("PixelHype è un'opera d'arte vivente: un mosaico di 10.000 pixel in cui brand, negozi e sognatori hanno ognuno il proprio posto. Una volta messo, il tuo spazio non si sposta più. Resta nell'opera per sempre.") +
      p("La vendita si apre appena saremo abbastanza in lista. Quel giorno ti scriviamo <b>prima di tutti gli altri</b>, così scegli il tuo spazio per primo.") +
      p("Ricorda: chi arriva prima paga meno. Il prezzo a pixel sale a ogni fase e i pixel sono solo 10.000: quando finiscono, non ce ne saranno altri.") +
      p("Ora non paghi nulla. Prepara la tua immagine: presto il tuo brand farà parte del mosaico.") +
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
