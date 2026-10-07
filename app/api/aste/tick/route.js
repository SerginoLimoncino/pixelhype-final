import { aggiornaAste } from "../../../../lib/aste";
import { dbAttivo } from "../../../../lib/db";

export const dynamic = "force-dynamic";

// Called once a day by Vercel (vercel.json), so auctions close even if nobody visits the site.
export async function GET() {
  if (!dbAttivo()) return Response.json({ ok: false });
  try { await aggiornaAste(); return Response.json({ ok: true }); } catch (e) { return Response.json({ ok: false, errore: String(e.message || e) }); }
}
