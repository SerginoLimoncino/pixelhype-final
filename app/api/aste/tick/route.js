import { aggiornaAste } from "../../../../lib/aste";
import { dbAttivo, aggiornaRibasso } from "../../../../lib/db";

export const dynamic = "force-dynamic";

// Called once a day by Vercel (vercel.json): the weekly price drop, and auctions close even if nobody visits the site.
export async function GET() {
  if (!dbAttivo()) return Response.json({ ok: false });
  try { await aggiornaRibasso(); await aggiornaAste(); return Response.json({ ok: true }); } catch (e) { return Response.json({ ok: false, errore: String(e.message || e) }); }
}
