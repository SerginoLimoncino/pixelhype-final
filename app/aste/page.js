import Link from "next/link";
import { dbAttivo, pixelVendutiPresto, cuoreLiberi } from "../../lib/db";
import { asteAperte, aggiornaAstePresto, listaAste, minimo } from "../../lib/aste";
import Timer from "../components/Timer";
import { PACCHETTI, SOGLIA_ASTE, FINALE, prezzoCuore, eur, num, quando } from "../../lib/prezzi";

export const dynamic = "force-dynamic";
export const metadata = { title: "Aste · PixelHype" };

// The auctions page. Hidden (only a short note) until the first 1,000 pixel are sold.
export default async function Aste() {
  const venduti = await pixelVendutiPresto();
  if (!dbAttivo() || !asteAperte(venduti)) {
    return (
      <section className="wrap blk">
        <div className="sec-h">
          <div className="eyebrow">Aste</div>
          <h2>Le aste non sono <em>ancora aperte</em>.</h2>
          <p>Si aprono da sole dopo i primi {num(SOGLIA_ASTE)} pixel venduti. Ora siamo a {num(venduti)}.</p>
        </div>
        <Link href="/compra" className="cta">Intanto prendi il tuo spazio</Link>
      </section>
    );
  }
  await aggiornaAstePresto();
  const { aperte, prossime, finite } = await listaAste().catch(() => ({ aperte: [], prossime: 0, finite: [] }));
  const gruppo = (zona) => aperte.filter((a) => a.zona === zona);
  const piccoli = venduti >= FINALE ? await cuoreLiberi().catch(() => null) : null;

  return (
    <section className="blk heart">
      <div className="wrap">
        <div className="sec-h">
          <div className="eyebrow">Aste in corso</div>
          <h2>Il centro si conquista <em>all'asta</em>.</h2>
          <p>Ogni asta dura 7 giorni e vince l'offerta più alta. Offrire non costa nulla: la carta viene addebitata solo se vinci. {prossime > 0 && `Altre ${prossime} aste si apriranno nei prossimi giorni.`}</p>
        </div>
        {piccoli && (piccoli[1] > 0 || piccoli[2] > 0) && (
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 12 }}>Gran finale · ultimi pixel del Cuore a prezzo fisso</h3>
            <div className="lots">
              {[1, 2].filter((n) => piccoli[n] > 0).map((n) => (
                <Link href={`/crea-spazio?pack=${n}&cuore=1`} className="lot oro" key={n} style={{ textDecoration: "none" }}>
                  <span className="q">Senza asta · cornice d'oro</span>
                  <span className="s">{PACCHETTI[n].titolo}</span>
                  <span className="b">{eur(prezzoCuore(n, venduti))} · restano {num(piccoli[n])}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        {[["cuore", "Nel Cuore"], ["fuori", "Fuori dal Cuore · base 30% più bassa"]].map(([zona, titolo]) => (
          <div key={zona} style={{ marginBottom: 32 }}>
            <h3 style={{ marginBottom: 12 }}>{titolo}</h3>
            {gruppo(zona).length === 0 ? <p className="note">Nessuna asta aperta in questo momento.</p> : (
              <div className="lots">
                {gruppo(zona).map((a) => (
                  <Link href={`/aste/${a.id}`} className={zona === "cuore" ? "lot oro" : "lot"} key={a.id} style={{ textDecoration: "none" }}>
                    <span className="q">{PACCHETTI[a.pack].nome}</span>
                    <span className="s">{PACCHETTI[a.pack].titolo}</span>
                    <span className="b">{a.migliore ? `Offerta più alta ${eur(a.migliore)}` : `Base ${eur(a.base)}`}</span>
                    <span className="b">Offri da {eur(minimo(a, a.migliore))}</span>
                    <span className="b">Finisce tra <Timer fine={a.fine} /></span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
        {finite.length > 0 && (
          <div>
            <h3 style={{ marginBottom: 12 }}>Aste finite</h3>
            <div className="lots">
              {finite.map((a) => (
                <div className={a.zona === "cuore" ? "lot oro finita" : "lot finita"} key={a.id}>
                  <span className="q">Asta finita</span>
                  <span className="s">{PACCHETTI[a.pack].titolo}</span>
                  <span className="b">{a.zona === "cuore" ? "Nel Cuore" : "Fuori dal Cuore"}{a.vinta ? ` · chiusa a ${eur(a.vinta)}` : ""}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
