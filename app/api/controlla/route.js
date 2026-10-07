import { controllaLink } from "../../../lib/controlloLink";

// Checks link and image before payment.
// - Link: see lib/controlloLink.js (adult, not opening, downloads, virus/scam lists).
// - Image: with OPENAI_API_KEY (on Vercel) an automatic check refuses nudity, violence, hate and illegal content.
// Without those keys the extra checks are skipped and the order goes through.
const CATEGORIE_IMMAGINE = ["sexual", "sexual/minors", "violence/graphic", "hate", "hate/threatening", "illicit", "illicit/violent", "self-harm", "self-harm/instructions"];

const SOGLIA_NO = 0.7; // sopra: rifiutata subito
const SOGLIA_DUBBIO = 0.3; // tra le due: accettata, ma la controlla Sergio prima che vada online

export async function POST(req) {
  const { link, immagine } = await req.json().catch(() => ({}));

  const l = await controllaLink(link);
  if (!l.ok) return Response.json({ ok: false, campo: "link", motivo: l.motivo });
  const href = l.link;

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
