import { after } from "next/server";
import { spaziOnline, pixelVenduti } from "../../../lib/db";
import { aggiornaAste } from "../../../lib/aste";

export const dynamic = "force-dynamic";

// The spaces shown in the mosaic.
export async function GET() {
  // After answering, move the auctions forward (open, close, unlock): nobody has to do it by hand.
  after(() => aggiornaAste().catch(() => {}));
  // One query after the other (the connection is shared); never wait more than 15 seconds.
  const leggi = async () => { const spazi = await spaziOnline(); return { spazi, venduti: await pixelVenduti() }; };
  const tempo = new Promise((_, no) => setTimeout(() => no(new Error("il database non risponde")), 15000));
  try {
    return Response.json(await Promise.race([leggi(), tempo]));
  } catch (e) {
    return Response.json({ spazi: [], venduti: 0, errore: String(e.message || e) });
  }
}
