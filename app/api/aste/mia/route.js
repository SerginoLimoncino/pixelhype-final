import { traduciRisposte } from "../../../../lib/messaggi";
import { dbAttivo } from "../../../../lib/db";
import { unaAsta, minimo, laMiaOfferta, rilancia, ritirati } from "../../../../lib/aste";

export const dynamic = "force-dynamic";

// A bidder who already saved their card: see their bid, raise with one click, or withdraw.
// They are recognised by the secret key their browser received with the first bid.
async function rispondi(req) {
  if (!dbAttivo()) return Response.json({ errore: "Le aste non sono ancora aperte." }, { status: 400 });
  const { asta, chiave, azione, importo } = await req.json().catch(() => ({}));
  const id = Number(asta);
  if (azione === "rilancia") {
    const a = await unaAsta(id);
    if (!a || a.stato !== "aperta" || new Date(a.fine) <= new Date()) return Response.json({ errore: "Questa asta è chiusa." }, { status: 400 });
    const euro = Math.floor(Number(importo));
    if (!(euro >= minimo(a, a.migliore))) return Response.json({ errore: `L'offerta minima ora è ${minimo(a, a.migliore)} €.` }, { status: 400 });
    const r = await rilancia(id, String(chiave || ""), euro);
    if (!r.ok) return Response.json({ errore: r.motivo }, { status: 400 });
  }
  if (azione === "ritira") {
    const r = await ritirati(id, String(chiave || ""));
    if (!r.ok) return Response.json({ errore: r.motivo }, { status: 400 });
    return Response.json({ ritirata: true });
  }
  return Response.json({ mia: await laMiaOfferta(id, String(chiave || "")) });
}

export const POST = traduciRisposte(rispondi);
