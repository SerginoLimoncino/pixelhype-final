import { dbAttivo } from "../../../lib/db";
import { sistemaOrdini } from "../../../lib/aste";

export const dynamic = "force-dynamic";

// Called every 10 minutes by GitHub (.github/workflows/ordini.yml): paid spaces that did not get their place yet
// are placed in the mosaic, even if nobody visits the site.
export async function GET() {
  if (!dbAttivo()) return Response.json({ ok: false });
  try { await sistemaOrdini(); return Response.json({ ok: true }); } catch (e) { return Response.json({ ok: false, errore: String(e.message || e) }); }
}
