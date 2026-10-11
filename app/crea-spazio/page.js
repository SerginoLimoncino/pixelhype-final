import CreaSpazio from "./CreaSpazio";
import { PACCHETTI, cuoreFissoDa } from "../../lib/prezzi";
import { pixelVendutiPresto, caloPresto, PACK_CUORE_FISSO } from "../../lib/db";

export const dynamic = "force-dynamic";

export const metadata = { title: "Crea il tuo spazio · PixelHype" };

// /crea-spazio?pack=X  (X = 1, 2, 4, 10, 25, 50, 100)
export default async function Page({ searchParams }) {
  const sp = await searchParams;
  const pack = PACCHETTI[sp?.pack] ? Number(sp.pack) : 4;
  const venduti = await pixelVendutiPresto();
  const cuore = sp?.cuore === "1" && PACK_CUORE_FISSO.includes(pack) && venduti >= cuoreFissoDa(pack);
  return <CreaSpazio iniziale={pack} venduti={venduti} calo={await caloPresto(venduti)} cuore={cuore} />;
}
