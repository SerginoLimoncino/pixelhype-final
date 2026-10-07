import Pacchetti from "../components/Pacchetti";
import { FASI, fase, prezzoPixel, restanoInFase, eur, num } from "../../lib/prezzi";
import { pixelVenduti } from "../../lib/db";

export const revalidate = 30;

export const metadata = { title: "Prezzi e pacchetti · PixelHype" };

export default async function Compra() {
  const v = await pixelVenduti().catch(() => 0);
  const f = fase(v);
  return (
    <section className="wrap" style={{ paddingTop: 56, paddingBottom: 84 }}>
      <div className="sec-h">
        <div className="eyebrow">Fase {f + 1} di {FASI.length} · {eur(prezzoPixel(v))} a pixel + IVA</div>
        <h2>Scegli il tuo <em>spazio</em>.</h2>
        <p>Restano {num(restanoInFase(v))} pixel a questo prezzo. La posizione nel mosaico viene assegnata a caso e resta tua per sempre.</p>
      </div>
      <Pacchetti venduti={v} />
    </section>
  );
}
