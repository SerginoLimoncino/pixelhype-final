// Automatic checks before payment: link and image. Only adult, illegal or scam content is blocked.

// Adds https:// when missing ("www.bar.it" -> "https://www.bar.it"). Returns null if it isn't a web address.
export function normalizzaLink(v) {
  let s = String(v || "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  try {
    const u = new URL(s);
    if (!/^https?:$/.test(u.protocol) || !u.hostname.includes(".") || u.hostname.endsWith(".")) return null;
    return u.href;
  } catch {
    return null;
  }
}

// Adult sites and words. Matched on whole parts of the address, so "essex.it" or "sussex.com" pass.
const SITI_VIETATI = ["pornhub", "xvideos", "xnxx", "xhamster", "redtube", "youporn", "onlyfans", "fansly", "chaturbate", "stripchat", "livejasmin", "bongacams", "camsoda", "brazzers", "spankbang", "eporner", "manyvids"];
const PAROLE_VIETATE = ["porn", "porno", "xxx", "sex", "escort", "escorts", "hentai", "nude", "nudes", "camgirl", "camgirls", "milf"];

export function linkVietato(href) {
  const u = new URL(href);
  const parti = (u.hostname + " " + u.pathname).toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
  return parti.some((p) => SITI_VIETATI.includes(p) || PAROLE_VIETATE.includes(p) || p.startsWith("porn") || p.startsWith("xxx"));
}
