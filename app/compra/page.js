import Pacchetti from "../components/Pacchetti";
import { FASI, fase, prezzoPixel, restanoInFase, eur, num } from "../../lib/prezzi";
import { pixelVendutiPresto, caloPresto } from "../../lib/db";
import { traduttore } from "../../lib/lingua";

export const revalidate = 30;

export async function generateMetadata() {
  const { T } = await traduttore();
  return { title: T("Prezzi e pacchetti · PixelHype", "Prices and packs · PixelHype") };
}

export default async function Compra() {
  const v = await pixelVendutiPresto(), calo = await caloPresto(v);
  const f = fase(v);
  const { en, T } = await traduttore();
  return (
    <section className="wrap" style={{ paddingTop: 56, paddingBottom: 84 }}>
      <div className="sec-h">
        <div className="eyebrow">{T("Fase", "Phase")} {f + 1} {T("di", "of")} {FASI.length} · {eur(prezzoPixel(v, calo), en)} {T("a pixel + IVA", "per pixel + VAT")}</div>
        <h2>{en ? <>Choose your <em>space</em>.</> : <>Scegli il tuo <em>spazio</em>.</>}</h2>
        <p>{T(`Restano ${num(restanoInFase(v), en)} pixel a questo prezzo. La posizione nel mosaico viene assegnata a caso e resta tua per sempre.`, `${num(restanoInFase(v), en)} pixels left at this price. Your position in the mosaic is assigned at random and stays yours forever.`)}</p>
      </div>
      <Pacchetti venduti={v} calo={calo} />
    </section>
  );
}
