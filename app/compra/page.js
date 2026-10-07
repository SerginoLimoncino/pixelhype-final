import Pacchetti from "../components/Pacchetti";
import { FASI, fase, prezzoPixel, restanoInFase, eur, num } from "../../lib/prezzi";

export const metadata = { title: "Prezzi e pacchetti · PixelHype" };

export default function Compra() {
  const f = fase();
  return (
    <section className="wrap" style={{ padding: "56px 0 84px" }}>
      <div className="sec-h">
        <div className="eyebrow">Fase {f + 1} di {FASI.length} · {eur(prezzoPixel())} a pixel + IVA</div>
        <h2>Scegli il tuo <em>spazio</em>.</h2>
        <p>Restano {num(restanoInFase())} pixel a questo prezzo. La posizione nel mosaico viene assegnata a caso e resta tua per sempre.</p>
      </div>
      <Pacchetti />
    </section>
  );
}
