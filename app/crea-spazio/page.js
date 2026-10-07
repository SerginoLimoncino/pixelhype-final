import CreaSpazio from "./CreaSpazio";
import { PACCHETTI } from "../../lib/prezzi";

export const metadata = { title: "Crea il tuo spazio · PixelHype" };

// /crea-spazio?pack=X  (X = 1, 2, 4, 10, 25, 100)
export default async function Page({ searchParams }) {
  const sp = await searchParams;
  const pack = PACCHETTI[sp?.pack] ? Number(sp.pack) : 4;
  return <CreaSpazio iniziale={pack} />;
}
