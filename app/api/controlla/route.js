import { controllaLink } from "../../../lib/controlloLink";

// Checks link and image before payment.
// - Link: see lib/controlloLink.js (adult, not opening, downloads, virus/scam lists).
// - Image: with SIGHTENGINE_USER + SIGHTENGINE_SECRET (free) or OPENAI_API_KEY on Vercel, nudity, gore and hate symbols are refused.
// Without those keys the extra checks are skipped and the order goes through.
const CATEGORIE_IMMAGINE = ["sexual", "sexual/minors", "violence/graphic", "hate", "hate/threatening", "illicit", "illicit/violent", "self-harm", "self-harm/instructions"];

const SOGLIA_NO = 0.7; // sopra: rifiutata subito
const SOGLIA_DUBBIO = 0.3; // tra le due: accettata, ma la controlla Sergio prima che vada online

export async function POST(req) {
  const { link, immagine } = await req.json().catch(() => ({}));

  const l = await controllaLink(link);
  if (!l.ok) return Response.json({ ok: false, campo: "link", motivo: l.motivo });
  const href = l.link;

  const max = typeof immagine === "string" && immagine.startsWith("data:image/") ? await rischioImmagine(immagine) : 0;
  // Clear cases are refused; borderline ones go through but are marked "da controllare".
  if (max >= SOGLIA_NO) return Response.json({ ok: false, campo: "immagine", motivo: "Questa immagine non può essere accettata: contiene nudità, violenza o altri contenuti non ammessi. Scegline un'altra." });
  if (max >= SOGLIA_DUBBIO) return Response.json({ ok: true, link: href, dubbio: true });

  return Response.json({ ok: true, link: href, dubbio: false });
}

// Risk score 0-1 of the image. Sightengine (free plan, SIGHTENGINE_USER + SIGHTENGINE_SECRET on Vercel)
// or OpenAI (OPENAI_API_KEY). Without keys, or if the service doesn't answer, the image passes.
async function rischioImmagine(dataUrl) {
  const { SIGHTENGINE_USER: user, SIGHTENGINE_SECRET: secret, OPENAI_API_KEY: openai } = process.env;
  if (user && secret) {
    const [, tipo, b64] = /^data:(image\/[a-z]+);base64,(.+)$/.exec(dataUrl) || [];
    if (!b64) return 0;
    const f = new FormData();
    f.append("media", new Blob([Buffer.from(b64, "base64")], { type: tipo }), "immagine." + tipo.split("/")[1]);
    f.append("models", "nudity-2.1,gore-2.0,offensive-2.0");
    f.append("api_user", user);
    f.append("api_secret", secret);
    const r = await fetch("https://api.sightengine.com/1.0/check.json", { method: "POST", body: f, signal: AbortSignal.timeout(15000) }).then((x) => x.json()).catch(() => null);
    if (r?.status !== "success") return 0;
    const n = r.nudity || {}, o = r.offensive || {};
    return Math.max(0, n.sexual_activity || 0, n.sexual_display || 0, n.erotica || 0, r.gore?.prob || 0, o.nazi || 0, o.supremacist || 0, o.terrorist || 0);
  }
  if (openai) {
    const r = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${openai}` },
      body: JSON.stringify({ model: "omni-moderation-latest", input: [{ type: "image_url", image_url: { url: dataUrl } }] }),
    }).then((x) => x.json()).catch(() => null);
    const sc = r?.results?.[0]?.category_scores || {};
    return Math.max(0, ...CATEGORIE_IMMAGINE.map((k) => sc[k] || 0));
  }
  return 0;
}
