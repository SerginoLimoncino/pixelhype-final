import CreaSpazio from "./CreaSpazio";
import { PACCHETTI, FINALE } from "../../lib/prezzi";
import { pixelVendutiPresto } from "../../lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Crea il tuo spazio · PixelHype" };

// /crea-spazio?pack=X  (X = 1, 2, 4, 10, 25, 100)
export default async function Page({ searchParams }) {
  const sp = await searchParams;
  const pack = PACCHETTI[sp?.pack] ? Number(sp.pack) : 4;
  const venduti = await pixelVendutiPresto();
  const cuore = sp?.cuore === "1" && (pack === 1 || pack === 2) && venduti >= FINALE;
  return <CreaSpazio iniziale={pack} venduti={venduti} cuore={cuore} />;
}
