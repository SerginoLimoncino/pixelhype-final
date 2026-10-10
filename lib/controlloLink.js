// Server-side link check, used before payment and before saving any link.
// Refuses: adult sites, links that don't open, direct downloads (files that could carry viruses),
// addresses that hide where they go, and sites on official virus/scam lists (URLHAUS_KEY or GOOGLE_SAFE_BROWSING_KEY on Vercel).
import { normalizzaLink, linkVietato } from "./controllo";

const FILE_VIETATI = /\.(exe|msi|bat|cmd|scr|pif|vbs|js|jar|apk|dmg|pkg|deb|rpm|sh|ps1|zip|rar|7z|tar|gz|iso|img|bin|dll|torrent)$/i;
const TIPI_VIETATI = /(octet-stream|msdownload|x-msdos|x-executable|java-archive|android\.package|zip|rar|7z|x-tar|gzip|x-sh|x-bat|x-apple-diskimage|bittorrent)/i;
const PRIVATI = /^(localhost|.*\.local|.*\.internal|0\.|10\.|127\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|\[)/i;

const no = (motivo) => ({ ok: false, motivo });

async function googleDicePericoloso(urls) {
  const key = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!key) return false;
  const r = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client: { clientId: "pixelhype", clientVersion: "1" },
      threatInfo: { threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"], platformTypes: ["ANY_PLATFORM"], threatEntryTypes: ["URL"], threatEntries: urls.map((url) => ({ url })) },
    }),
  }).then((x) => x.json()).catch(() => ({}));
  return !!r.matches?.length;
}

// URLhaus (abuse.ch): free official list of addresses that spread viruses. Needs URLHAUS_KEY on Vercel.
async function urlhausDicePericoloso(urls) {
  const key = process.env.URLHAUS_KEY;
  if (!key) return false;
  const chiedi = (tipo, campo, valore) => fetch(`https://urlhaus-api.abuse.ch/v1/${tipo}/`, {
    method: "POST",
    headers: { "Auth-Key": key, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ [campo]: valore }),
    signal: AbortSignal.timeout(8000),
  }).then((x) => x.json()).catch(() => ({}));
  for (const u of urls) {
    const r = await chiedi("url", "url", u);
    if (r.query_status === "ok" && r.threat) return true;
    // Whole site listed as dangerous by the big blocklists.
    const h = await chiedi("host", "host", new URL(u).hostname);
    const bl = h.blacklists || {};
    if (h.query_status === "ok" && ((bl.spamhaus_dbl && bl.spamhaus_dbl !== "not listed") || bl.surbl === "listed")) return true;
  }
  return false;
}

// Each address on the way (redirects included) must pass the basic rules.
function controllaIndirizzo(href) {
  const u = new URL(href);
  if (u.username || u.password) return "Questo link non è accettato.";
  if (PRIVATI.test(u.hostname) || /^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) return "Usa l'indirizzo del sito (es. www.iltuosito.it), non un numero.";
  if (u.port && !["80", "443"].includes(u.port)) return "Questo link non è accettato.";
  if (linkVietato(href)) return "Non accettiamo link a siti per adulti.";
  if (FILE_VIETATI.test(u.pathname)) return "Il link deve portare a un sito, non a un file da scaricare.";
  return null;
}

export async function controllaLink(link) {
  const primo = normalizzaLink(link);
  if (!primo) return no("Questo link non sembra un indirizzo web. Esempio: www.iltuosito.it");

  // Open the site like a visitor would, following redirects one by one (max 6).
  const visti = [];
  let href = primo, risposta = null;
  for (let i = 0; i < 6; i++) {
    const errore = controllaIndirizzo(href);
    if (errore) return no(errore);
    visti.push(href);
    try {
      risposta = await fetch(href, {
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; PixelHypeCheck/1.0; +https://www.getpixelhype.com)", Accept: "text/html,*/*" },
      });
    } catch {
      return no("Questo sito non si apre. Controlla che il link sia giusto e che il sito sia online.");
    }
    const dove = risposta.status >= 300 && risposta.status < 400 && risposta.headers.get("location");
    if (!dove) break;
    href = new URL(dove, href).href;
    if (!/^https?:/.test(href)) return no("Questo link non è accettato.");
    if (i === 5) return no("Questo link rimanda troppe volte ad altri indirizzi.");
  }

  // Many big sites block automatic visits (401/403/429/503) but exist: those are accepted.
  const st = risposta.status;
  if (st >= 400 && ![401, 403, 429, 503].includes(st)) return no("Questo sito non si apre (pagina non trovata o errore). Controlla il link.");
  if (st < 400) {
    const tipo = risposta.headers.get("content-type") || "";
    const allegato = /attachment/i.test(risposta.headers.get("content-disposition") || "");
    if (allegato || TIPI_VIETATI.test(tipo)) return no("Il link deve portare a un sito, non a un file da scaricare.");
  }
  risposta.body?.cancel().catch(() => {});

  if (await googleDicePericoloso(visti) || await urlhausDicePericoloso(visti)) return no("Questo link risulta pericoloso (virus o truffa) e non può essere accettato.");

  return { ok: true, link: primo };
}
