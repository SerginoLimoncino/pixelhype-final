import { cookies, headers } from "next/headers";

// Site language (Sergio, 2026-10-11): Italian and English. The visitor's choice is kept in the "lingua" cookie
// (IT/EN switch in the header); without a choice, Italian browsers get Italian and everyone else English.
export async function lingua() {
  const scelta = (await cookies()).get("lingua")?.value;
  if (scelta === "it" || scelta === "en") return scelta;
  const al = ((await headers()).get("accept-language") || "").trim().toLowerCase();
  return !al || al.startsWith("it") ? "it" : "en";
}

// T("Compra", "Buy"): the text in the visitor's language.
export async function traduttore() {
  const en = (await lingua()) === "en";
  return { en, T: (it, eng) => (en ? eng : it) };
}
