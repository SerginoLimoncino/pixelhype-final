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
  const oggetto = en ? "Your PixelHype booking is confirmed" : "Prenotazione PixelHype confermata";
  const corpo = en
    ? `We have booked a space of <b>${pack} pixel${pack > 1 ? "s" : ""}</b> for you${n ? ` (${n})` : ""}.<br><br>You pay nothing now. When sales open we will write to you before anyone else, and you will choose then whether to buy it.<br><br>If you did not make this booking, just ignore this email.`
    : `Ti abbiamo prenotato uno spazio da <b>${pack} pixel</b>${n ? ` (${n})` : ""}.<br><br>Ora non paghi nulla. Quando si apre la vendita ti scriviamo prima che a tutti gli altri e deciderai allora se comprarlo.<br><br>Se non hai fatto tu questa prenotazione, ignora questa email.`;
  const testo = en
    ? `We have booked a space of ${pack} pixels for you. You pay nothing now: when sales open we will write to you first. getpixelhype.com`
    : `Ti abbiamo prenotato uno spazio da ${pack} pixel. Ora non paghi nulla: quando si apre la vendita ti scriviamo per primi. getpixelhype.com`;
  return invia({ a: email, oggetto, html: pagina(en ? "You are on the list." : "Sei in lista.", corpo, { href: "https://www.getpixelhype.com", testo: en ? "See the mosaic" : "Guarda il mosaico" }), testo });
}

export async function avvisoNuovaPrenotazione({ email, pack, nome, link }) {
  const riga = `${pack} pixel · ${nome || "senza nome"} · ${email}${link ? ` · ${link}` : ""}`;
  return invia({ a: AVVISI, oggetto: `Nuova prenotazione: ${pack} pixel`, html: pagina("Nuova prenotazione", esc(riga) + "<br><br>La trovi nel pannello, riquadro Prenotazioni."), testo: riga });
}
