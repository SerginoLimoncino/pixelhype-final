import CreaSpazio from "./CreaSpazio";
import { traduttore } from "../../lib/lingua";
import { PACCHETTI, cuoreFissoDa, inVenditaOra } from "../../lib/prezzi";
import { pixelVendutiPresto, caloPresto, PACK_CUORE_FISSO } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { T } = await traduttore();
  return { title: T("Crea il tuo spazio · PixelHype", "Create your space · PixelHype") };
}

// /crea-spazio?pack=X  (X = 1, 2, 4, 10, 25, 50, 100)
export default async function Page({ searchParams }) {
  const sp = await searchParams;
  const venduti = await pixelVendutiPresto();
  const scelto = PACCHETTI[sp?.pack];
  const pack = scelto && !scelto.soloAsta && inVenditaOra(scelto, venduti) ? scelto.n : 4;
  const cuore = sp?.cuore === "1" && PACK_CUORE_FISSO.includes(pack) && venduti >= cuoreFissoDa(pack);
  return <CreaSpazio iniziale={pack} venduti={venduti} calo={await caloPresto(venduti)} cuore={cuore} />;
}
