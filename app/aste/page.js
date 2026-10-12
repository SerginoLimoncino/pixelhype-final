import Link from "next/link";
import { dbAttivo, pixelVendutiPresto, caloPresto, cuoreLiberi } from "../../lib/db";
import { asteAperte, aggiornaAstePresto, listaAste, minimo } from "../../lib/aste";
import Timer from "../components/Timer";
import { SOGLIA_ASTE, CUORE_ASTE, CUORE_PICCOLI, FINALE, cuoreFissoDa, prezzoCuore, nomePack, misura, eur, num } from "../../lib/prezzi";
import { traduttore } from "../../lib/lingua";
import { PRENOTAZIONI } from "../../lib/modo";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { T } = await traduttore();
  return { title: T("Aste · PixelHype", "Auctions · PixelHype") };
}

// The auctions page. Hidden (only a short note) until the first 1,000 pixel are sold.
export default async function Aste() {
  const venduti = await pixelVendutiPresto();
  const { en, T } = await traduttore();
  if (!dbAttivo() || !asteAperte(venduti)) {
    return (
      <section className="wrap blk">
        <div className="sec-h">
          <div className="eyebrow">{T("Aste", "Auctions")}</div>
          <h2>{en ? <>The Heart is <em>waiting</em>.</> : <>Il Cuore ti <em>aspetta</em>.</>}</h2>
          {PRENOTAZIONI ? <p>{T("Quando si apre la vendita partono le prime aste, fuori dal Cuore. Quelle del Cuore iniziano a 1.000 pixel venduti. Ci saranno spazi di tutte le misure, anche da 1 pixel.", "When sales open, the first auctions start, outside the Heart. The Heart auctions begin at 1,000 pixels sold. There will be spaces of every size, even 1 pixel.")}</p> : <p>{T(`Le aste del Cuore partono a ${num(SOGLIA_ASTE)} pixel venduti: mancano ${num(Math.max(0, SOGLIA_ASTE - venduti))} pixel. Ci saranno spazi di tutte le misure, anche da 1 pixel.`, `The Heart auctions start at ${num(SOGLIA_ASTE)} pixels sold: ${num(Math.max(0, SOGLIA_ASTE - venduti))} pixels to go. There will be spaces of every size, even 1 pixel.`)}</p>}
        </div>
        <Link href="/compra" className="cta">{PRENOTAZIONI ? T("Intanto prenota il tuo spazio", "Meanwhile, book your space") : T("Intanto prendi il tuo spazio", "Meanwhile, get your space")}</Link>
      </section>
    );
  }
  await aggiornaAstePresto();
  const { aperte, prossime, finite } = await listaAste().catch(() => ({ aperte: [], prossime: 0, finite: [] }));
  const gruppo = (zona) => aperte.filter((a) => a.zona === zona);
  const piccoli = venduti >= CUORE_PICCOLI ? await cuoreLiberi().catch(() => null) : null;
  if (piccoli) for (const n of Object.keys(piccoli)) if (venduti < cuoreFissoDa(Number(n))) piccoli[n] = 0;
  const calo = piccoli ? await caloPresto(venduti) : 0;

  return (
    <section className="blk heart">
      <div className="wrap">
        <div className="sec-h">
          <div className="eyebrow">{T("Aste in corso", "Live auctions")}</div>
          <h2>{en ? <>The centre is won <em>at auction</em>.</> : <>Il centro si conquista <em>all'asta</em>.</>}</h2>
          <p>{en ? <>{gruppo("ultimo").length ? "The mosaic's last auction: The Last Piece, 150 pixels, next to the Heart. It lasts 7 days and the highest bid wins." : venduti >= FINALE ? "Grand finale: the last 12 pieces, 6 in the Heart and 6 scattered across the mosaic, with starting prices 30% lower in the Heart and 40% lower outside. Each auction lasts 3 days and the highest bid wins." : "Each auction lasts 7 days and the highest bid wins."} Tap an auction to see on the map the exact spot you win. Bidding costs nothing: you only pay if you win. {prossime > 0 && `${prossime} more auctions will open in the coming days.`}</> : <>{gruppo("ultimo").length ? "L'ultima asta del mosaico: L'Ultimo Pezzo da 150 pixel, accanto al Cuore. Dura 7 giorni e vince l'offerta più alta." : venduti >= FINALE ? "Gran finale: gli ultimi 12 pezzi, 6 nel Cuore e 6 sparsi nel mosaico, con la base del 30% più bassa nel Cuore e del 40% fuori. Ogni asta dura 3 giorni e vince l'offerta più alta." : "Ogni asta dura 7 giorni e vince l'offerta più alta."} Tocca un'asta per vedere sulla mappa il posto esatto che conquisti. Offrire non costa nulla: paghi solo se vinci. {prossime > 0 && `Altre ${prossime} aste si apriranno nei prossimi giorni.`}</>}</p>
        </div>
        {piccoli && Object.values(piccoli).some((n) => n > 0) && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 12 }}>{venduti >= FINALE ? T("Gran finale · altri spazi del Cuore a prezzo fisso", "Grand finale · more Heart spaces at a fixed price") : T("Spazi piccoli del Cuore a prezzo fisso", "Small Heart spaces at a fixed price")}</h3>
            <div className="lots">
              {Object.keys(piccoli).map(Number).filter((n) => piccoli[n] > 0).map((n) => (
                <Link href={`/crea-spazio?pack=${n}&cuore=1`} className="lot oro" key={n} style={{ textDecoration: "none" }}>
                  <span className="q">{T("Senza asta · cornice d'oro", "No auction · gold frame")}</span>
                  <span className="s">{misura(n, en)}</span>
                  <span className="b">{eur(prezzoCuore(n, venduti, calo))} · {T("restano", "left")} {num(piccoli[n])}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        {[...(gruppo("ultimo").length ? [["ultimo", T("L'Ultimo Pezzo · l'ultima asta del mosaico", "The Last Piece · the mosaic's last auction")]] : []), ["cuore", T("Nel Cuore", "In the Heart")], ["fuori", T("Fuori dal Cuore · base 40% più bassa", "Outside the Heart · starting price 40% lower")]].map(([zona, titolo]) => (
          <div key={zona} style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 12 }}>{titolo}</h3>
            {gruppo(zona).length === 0 ? <p className="note">{zona === "cuore" && venduti < CUORE_ASTE ? T(`Le aste del Cuore partono a ${num(CUORE_ASTE)} pixel venduti: mancano ${num(CUORE_ASTE - venduti)} pixel.`, `The Heart auctions start at ${num(CUORE_ASTE)} pixels sold: ${num(CUORE_ASTE - venduti)} pixels to go.`) : T("Nessuna asta aperta in questo momento.", "No auctions open right now.")}</p> : (
              <div className="lots">
                {gruppo(zona).map((a) => (
                  <Link href={`/aste/${a.id}`} className={zona === "fuori" ? "lot" : "lot oro"} key={a.id} style={{ textDecoration: "none" }}>
                    <span className="q">{nomePack(a.pack, en)}</span>
                    <span className="s">{misura(a.pack, en)}</span>
                    <span className="b">{a.migliore ? `${T("Offerta più alta", "Highest bid")} ${eur(a.migliore)}` : `${T("Base", "Starting price")} ${eur(a.base)}`}</span>
                    <span className="b">{T("Offri da", "Bid from")} {eur(minimo(a, a.migliore))}</span>
                    <span className="b">{T("Finisce tra", "Ends in")} <Timer fine={a.fine} /></span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {finite.length > 0 && (
          <div>
            <h3 style={{ marginBottom: 12 }}>{T("Aste finite", "Finished auctions")}</h3>
            <div className="lots">
              {finite.map((a) => (
                <div className={a.zona === "cuore" ? "lot oro finita" : "lot finita"} key={a.id}>
                  <span className="q">{T("Asta finita", "Auction ended")}</span>
                  <span className="s">{misura(a.pack, en)}</span>
                  <span className="b">{a.zona === "cuore" ? T("Nel Cuore", "In the Heart") : T("Fuori dal Cuore", "Outside the Heart")}{a.vinta ? ` · ${T("chiusa a", "closed at")} ${eur(a.vinta)}` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
