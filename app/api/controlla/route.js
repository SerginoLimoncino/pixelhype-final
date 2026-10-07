import { normalizzaLink, linkVietato } from "../../../lib/controllo";

// Checks link and image before payment.
// - Link: adult sites are refused always; with GOOGLE_SAFE_BROWSING_KEY (on Vercel) scam and virus sites too.
// - Image: with OPENAI_API_KEY (on Vercel) an automatic check refuses nudity, violence, hate and illegal content.
// Without those keys the extra checks are skipped and the order goes through.
const CATEGORIE_IMMAGINE = ["sexual", "sexual/minors", "violence/graphic", "hate", "hate/threatening", "illicit", "illicit/violent", "self-harm", "self-harm/instructions"];

const SOGLIA_NO = 0.7; // sopra: rifiutata subito
const SOGLIA_DUBBIO = 0.3; // tra le due: accettata, ma la controlla Sergio prima che vada online

export async function POST(req) {
  const { link, immagine } = await req.json().catch(() => ({}));

  const href = normalizzaLink(link);
  if (!href) return Response.json({ ok: false, campo: "link", motivo: "Questo link non sembra un indirizzo web. Esempio: www.iltuosito.it" });
  if (linkVietato(href)) return Response.json({ ok: false, campo: "link", motivo: "Non accettiamo link a siti per adulti." });

  if (process.env.GOOGLE_SAFE_BROWSING_KEY) {
    const r = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${process.env.GOOGLE_SAFE_BROWSING_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "pixelhype", clientVersion: "1" },
        threatInfo: { threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE"], platformTypes: ["ANY_PLATFORM"], threatEntryTypes: ["URL"], threatEntries: [{ url: href }] },
      }),
    }).then((x) => x.json()).catch(() => ({}));
    if (r.matches?.length) return Response.json({ ok: false, campo: "link", motivo: "Questo link risulta pericoloso (truffa o virus) e non può essere accettato." });
  }

  if (process.env.OPENAI_API_KEY && typeof immagine === "string" && immagine.startsWith("data:image/")) {
    const r = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: "omni-moderation-latest", input: [{ type: "image_url", image_url: { url: immagine } }] }),
    }).then((x) => x.json()).catch(() => null);
    // Clear cases are refused; borderline ones go through but are marked for Sergio to check.
    const sc = r?.results?.[0]?.category_scores || {};
    const max = Math.max(0, ...CATEGORIE_IMMAGINE.map((k) => sc[k] || 0));
    if (max >= SOGLIA_NO) return Response.json({ ok: false, campo: "immagine", motivo: "Questa immagine non può essere accettata: contiene nudità, violenza o altri contenuti non ammessi. Scegline un'altra." });
    if (max >= SOGLIA_DUBBIO) return Response.json({ ok: true, link: href, dubbio: true });
  }

  return Response.json({ ok: true, link: href, dubbio: false });
}
