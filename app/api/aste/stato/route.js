import { dbAttivo } from "../../../../lib/db";
import { PRENOTAZIONI } from "../../../../lib/modo";
import { unaAsta, impronta } from "../../../../lib/aste";

export const dynamic = "force-dynamic";

// Asked every few seconds by an open auction page: one small query, so the page refreshes only when something changed.
export async function GET(req) {
  if (!dbAttivo() || PRENOTAZIONI) return Response.json({ impronta: null }, { status: 400 });
  const a = await unaAsta(Number(new URL(req.url).searchParams.get("id"))).catch(() => null);
  if (!a || a.stato === "attesa") return Response.json({ impronta: null }, { status: 404 });
  return Response.json({ impronta: impronta(a) }, { headers: { "Cache-Control": "no-store" } });
}
