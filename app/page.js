import Link from "next/link";
import Mosaico from "./components/Mosaico";
import Pacchetti from "./components/Pacchetti";
import { FASI, LOTTI_CUORE, CUORE_ASTE, fase, prezzoPixel, restanoInFase, charm, eur, num } from "../lib/prezzi";
import { pixelVendutiPresto, caloPresto } from "../lib/db";
import { traduttore } from "../lib/lingua";
import { PRENOTAZIONI } from "../lib/modo";

export const revalidate = 30; // prezzo e contatore si aggiornano da soli

export default async function Home() {
  const v = await pixelVendutiPresto(), calo = await caloPresto(v);
  const f = fase(v);
  const { en, T } = await traduttore();
  const avanzamento = Math.round(((v - f * 1000) / 1000) * 100);
  return (
    <>
      <section className="wrap hero">
        <div>
          <div className="eyebrow">{T("Opera collettiva · 10.000 pixel · per sempre", "Collective artwork · 10,000 pixels · forever")}</div>
          <h1>{en ? <>A work of art<br />made of <em>brands</em>.</> : <>Un'opera d'arte<br />fatta di <em>marchi</em>.</>}</h1>
          <p className="lead">{T("Dal grande brand al bar sotto casa: ognuno ha il suo posto nel mosaico, con la sua immagine e il suo link. Una volta preso, è tuo. Per sempre.", "From the big brand to the café around the corner: everyone has a place in the mosaic, with their own image and link. Once it is taken, it is yours. Forever.")}</p>
        </div>
        <div className="phasebox">
          <div className="pb-top"><span>{T("Fase", "Phase")} {f + 1} {T("di", "of")} {FASI.length}</span><span>{T("prezzo a pixel", "price per pixel")}</span></div>
          <div className="pb-price">{eur(prezzoPixel(v, calo))}<small>{T("+ IVA", "+ VAT")}</small></div>
          <div className="bar"><i style={{ width: Math.max(2, avanzamento) + "%" }} /></div>
          <p className="pb-note">{en ? <><b>{num(restanoInFase(v))} pixels</b> left at this price. Then it goes up to <b>{f < FASI.length - 1 ? eur(FASI[f + 1]) : "the final auctions"}</b>.</> : <>Restano <b>{num(restanoInFase(v))} pixel</b> a questo prezzo. Poi si passa {f < FASI.length - 1 ? <>a <b>{eur(FASI[f + 1])}</b></> : <><b>alle aste finali</b></>}.</>}</p>
          {PRENOTAZIONI && <p className="pb-note"><b>{T("Prenotazioni aperte.", "Bookings open.")}</b> {T("Scegli la misura e lascia l'email: ora non paghi nulla e quando si apre la vendita ti scriviamo per primi.", "Choose the size and leave your email: you pay nothing now, and when sales open we write to you first.")}</p>}
          <div className="pb-row">
            <Link href="/compra" className="cta">{PRENOTAZIONI ? T("Prenota il tuo spazio", "Book your space") : T("Prendi il tuo spazio", "Get your space")}</Link>
            <a href="#galleria" className="ghost">{T("Esplora l'opera", "Explore the artwork")}</a>
          </div>
        </div>
      </section>

      <Mosaico />

      <section className="blk" id="prezzi">
        <div className="wrap">
          <div className="sec-h">
            <div className="eyebrow">{T("Il prezzo", "The price")}</div>
            <h2>{en ? <>First come, <em>pay less</em>.</> : <>Chi arriva prima, <em>paga meno</em>.</>}</h2>
            <p>{T("Nove fasi da 1.000 pixel. Finita una fase, il prezzo sale per sempre. Il prezzo che vedi quando paghi è quello che paghi.", "Nine phases of 1,000 pixels. When a phase ends, the price goes up for good. The price you see when you pay is the price you pay.")}</p>
          </div>
          <div className="phases">
            {FASI.map((p, i) => (i === f ? prezzoPixel(v, calo) : p)).map((v, i) => (
              <div className={"ph" + (i === f ? " now" : "")} key={i}>
                <span className="n">{T("Fase", "Phase")} {i + 1}</span>
                <span className="p">{v} €<small> / pixel</small></span>
                <span className="x">{T("100 pixel", "100 pixels")}: {eur(charm(v * 100 * 0.75))}</span>
              </div>
            ))}
          </div>
          <div className="sec-h" style={{ marginTop: 64 }}>
            <div className="eyebrow">{T("I pacchetti", "The packs")}</div>
            <h2>{en ? <>Choose your <em>space</em>.</> : <>Scegli il tuo <em>spazio</em>.</>}</h2>
            <p>{T("Ogni pacchetto è un unico spazio con una sola immagine. I blocchi da 25, 50 e 100 pixel hanno la cornice d'oro e finiscono in evidenza.", "Each pack is a single space with one image. The 25, 50 and 100-pixel blocks get a gold frame and are featured.")}</p>
          </div>
          <Pacchetti venduti={v} calo={calo} />
        </div>
      </section>

      <section className="blk heart" id="aste">
        <div className="wrap">
          <div className="sec-h">
            <div className="eyebrow">{T("Il Cuore dell'opera", "The Heart of the artwork")}</div>
            <h2>{en ? <>The centre is won <em>at auction</em>.</> : <>Il centro si conquista <em>all'asta</em>.</>}</h2>
            <p>{T("900 pixel al centro, per tutte le misure. Si parte da basi basse e decidono le offerte. Le aste si aprono da sole, poche alla volta.", "900 pixels in the centre, in every size. Starting prices are low and the bids decide. Auctions open by themselves, a few at a time.")}</p>
          </div>
          <div className="lots">
            {LOTTI_CUORE.map((l) => (
              <div className="lot" key={l.misura}>
                <span className="q">{l.spazi} {en ? (l.spazi > 1 ? "spaces" : "space") : l.spazi > 1 ? "spazi" : "spazio"}</span>
                <span className="s">{en ? l.misura.replace(/^(\d+) pixel$/, (m, n) => (n === "1" ? m : m + "s")) : l.misura}</span>
                <span className="b">{T("Base svelata all'apertura", "Starting price revealed at opening")}</span>
              </div>
            ))}
          </div>
          {v < CUORE_ASTE && <p className="note">{en ? <>The Heart auctions start at <b>1,000 pixels sold</b>: {num(Math.max(0, CUORE_ASTE - v))} pixels to go.</> : <>Le aste del Cuore partono a <b>{num(CUORE_ASTE)} pixel venduti</b>: mancano {num(Math.max(0, CUORE_ASTE - v))} pixel.</>}</p>}
          <p className="note"><Link href="/aste" className="cta sm">{PRENOTAZIONI ? T("Come funzionano le aste", "How the auctions work") : T("Vedi le aste in corso", "See the live auctions")}</Link></p>
        </div>
      </section>

      <section className="blk" id="come">
        <div className="wrap">
          <div className="sec-h"><div className="eyebrow">{T("Come funziona", "How it works")}</div><h2>{en ? <>Three steps, <em>forever</em>.</> : <>Tre passi, <em>per sempre</em>.</>}</h2></div>
          <div className="steps">
            <div className="st"><div className="k">I</div><h3>{T("Scegli lo spazio", "Choose the space")}</h3><p>{T("Da 1 a 100 pixel. La posizione viene assegnata a caso nel mosaico e non cambia più.", "From 1 to 100 pixels. The position in the mosaic is assigned at random and never changes.")}</p></div>
            <div className="st"><div className="k">II</div><h3>{T("Firma la tua opera", "Sign your work")}</h3><p>{T("Carica il tuo logo o la tua immagine, aggiungi il link, guarda l'anteprima.", "Upload your logo or image, add your link, check the preview.")}</p></div>
            <div className="st"><div className="k">III</div><h3>{T("Entra nella collezione", "Join the collection")}</h3><p>{PRENOTAZIONI ? T("Oggi prenoti senza pagare. Quando si apre la vendita ti scriviamo per primi: paghi in sicurezza e sei online subito.", "Today you book without paying. When sales open we write to you first: you pay securely and you are online right away.") : T("Paghi in sicurezza e sei online subito. Chiunque ti trova con la ricerca.", "Pay securely and you are online right away. Anyone can find you with the search.")}</p></div>
          </div>
          <p className="note" style={{ marginTop: 28 }}>{T("Quando il mosaico sarà completo, potrai anche rivendere il tuo spazio, solo tramite PixelHype: la rivendita apre 30 giorni dopo l'ultimo pixel venduto, a un prezzo non inferiore alla metà di quanto l'hai pagato. Lo spazio non è un investimento e nessuno garantisce che venga rivenduto.", "Once the mosaic is complete, you will also be able to resell your space, only through PixelHype: resale opens 30 days after the last pixel is sold, at a price no lower than half of what you paid. The space is not an investment and nobody guarantees it will be resold.")} <Link href="/termini">{T("Leggi i Termini", "Read the Terms")}</Link></p>
          <div className="secret">
            <div><h3>{T("Il mosaico nasconde un segreto.", "The mosaic hides a secret.")}</h3><p>{T("Quando l'ultimo pixel sarà venduto, il mosaico svelerà una sorpresa. La scopriremo tutti insieme, alla fine.", "When the last pixel is sold, the mosaic will reveal a surprise. We will all discover it together, at the end.")}</p></div>
            <Link href="/compra" className="ghost">{T("Fanne parte", "Be part of it")}</Link>
          </div>
        </div>
      </section>
    </>
  );
}
