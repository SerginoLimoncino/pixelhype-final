import Link from "next/link";
import Mosaico from "./components/Mosaico";
import Pacchetti from "./components/Pacchetti";
import { FASI, LOTTI_CUORE, PIXEL_VENDUTI, fase, prezzoPixel, restanoInFase, charm, eur, num } from "../lib/prezzi";

export default function Home() {
  const f = fase();
  const avanzamento = Math.round(((PIXEL_VENDUTI - f * 1000) / 1000) * 100);
  return (
    <>
      <section className="wrap hero">
        <div>
          <div className="eyebrow">Opera collettiva · 10.000 pixel · per sempre</div>
          <h1>Un'opera d'arte<br />fatta di <em>marchi</em>.</h1>
          <p className="lead">Dal grande brand al bar sotto casa: ognuno ha il suo posto nel mosaico, con la sua immagine e il suo link. Una volta preso, è tuo. Per sempre.</p>
        </div>
        <div className="phasebox">
          <div className="pb-top"><span>Fase {f + 1} di {FASI.length}</span><span>prezzo a pixel</span></div>
          <div className="pb-price">{eur(prezzoPixel())}<small>+ IVA</small></div>
          <div className="bar"><i style={{ width: Math.max(2, avanzamento) + "%" }} /></div>
          <p className="pb-note">Restano <b>{num(restanoInFase())} pixel</b> a questo prezzo. Poi si passa a <b>{f < FASI.length - 1 ? eur(FASI[f + 1]) : "le aste finali"}</b>.</p>
          <div className="pb-row">
            <Link href="/compra" className="cta">Prendi il tuo spazio</Link>
            <a href="#galleria" className="ghost">Esplora l'opera</a>
          </div>
        </div>
      </section>

      <Mosaico />

      <section className="blk" id="prezzi">
        <div className="wrap">
          <div className="sec-h">
            <div className="eyebrow">Il prezzo</div>
            <h2>Chi arriva prima, <em>paga meno</em>.</h2>
            <p>Nove fasi da 1.000 pixel. Finita una fase, il prezzo sale per sempre. Il prezzo che vedi quando paghi è quello che paghi.</p>
          </div>
          <div className="phases">
            {FASI.map((v, i) => (
              <div className={"ph" + (i === f ? " now" : "")} key={v}>
                <span className="n">Fase {i + 1}</span>
                <span className="p">{v} €<small> / pixel</small></span>
                <span className="x">10x10: {eur(charm(v * 100 * 0.75))}</span>
              </div>
            ))}
          </div>
          <div className="sec-h" style={{ marginTop: 64 }}>
            <div className="eyebrow">I pacchetti</div>
            <h2>Scegli il tuo <em>spazio</em>.</h2>
            <p>Ogni pacchetto è un unico spazio con una sola immagine. I blocchi da 25 pixel e i 10x10 hanno la cornice d'oro e finiscono in evidenza.</p>
          </div>
          <Pacchetti />
        </div>
      </section>

      <section className="blk heart" id="aste">
        <div className="wrap">
          <div className="sec-h">
            <div className="eyebrow">Il Cuore dell'opera</div>
            <h2>Il centro si conquista <em>all'asta</em>.</h2>
            <p>900 pixel al centro, per tutte le misure. Si parte da basi basse e decidono le offerte. Le aste si aprono da sole, poche alla volta.</p>
          </div>
          <div className="lots">
            {LOTTI_CUORE.map((l) => (
              <div className="lot" key={l.misura}>
                <span className="q">{l.spazi} {l.spazi > 1 ? "spazi" : "spazio"}</span>
                <span className="s">{l.misura}</span>
                <span className="b">Base d'asta <strong>{eur(l.base)}</strong></span>
              </div>
            ))}
          </div>
          <p className="note">Tre piccoli posti fortunati nel Cuore escono a caso a chi compra nella griglia normale.</p>
        </div>
      </section>

      <section className="blk" id="come">
        <div className="wrap">
          <div className="sec-h"><div className="eyebrow">Come funziona</div><h2>Tre passi, <em>per sempre</em>.</h2></div>
          <div className="steps">
            <div className="st"><div className="k">I</div><h3>Scegli lo spazio</h3><p>Da 1 pixel a un blocco 10x10. La posizione viene assegnata a caso nel mosaico e non cambia più.</p></div>
            <div className="st"><div className="k">II</div><h3>Firma la tua opera</h3><p>Carica il tuo logo o la tua immagine, aggiungi il link, guarda l'anteprima.</p></div>
            <div className="st"><div className="k">III</div><h3>Entra nella collezione</h3><p>Paghi in sicurezza e sei online subito. Chiunque ti trova con la ricerca.</p></div>
          </div>
          <div className="secret">
            <div><h3>Il mosaico nasconde un segreto.</h3><p>Più la griglia si riempie, più si capisce che i pixel stanno formando qualcosa. Lo scopriremo tutti insieme, alla fine.</p></div>
            <Link href="/compra" className="ghost">Fanne parte</Link>
          </div>
        </div>
      </section>
    </>
  );
}
