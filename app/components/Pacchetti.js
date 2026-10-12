import Link from "next/link";
import { IN_VENDITA, inVenditaOra, prezzoPacchetto, nomePack, misura, eur, num } from "../../lib/prezzi";
import { traduttore } from "../../lib/lingua";
import { disponibiliPresto } from "../../lib/db";

// Price per pixel with its cents (19,50 €), never rounded down.
const aPixel = (v) => (Number.isInteger(v) ? eur(v) : num(Math.floor(v)) + "," + String(Math.round((v % 1) * 100)).padStart(2, "0") + " €");

// The six packs as cards. Each card opens /crea-spazio?pack=X. A size that is sold out shows "Esaurito".
export default async function Pacchetti({ venduti = 0, calo = 0 }) {
  const d = await disponibiliPresto();
  const { en, T } = await traduttore();
  return (
    <div className="packs-t">
      {IN_VENDITA.map((p) => {
        const tot = prezzoPacchetto(p.n, venduti, calo);
        const presto = !inVenditaOra(p, d?.venduti ?? venduti); // big sizes: not on sale yet
        const restano = d ? d.ok[p.n] : !presto;
        const presi = d ? d.presi[p.n] || 0 : 0;
        const lim = d ? d.limite[p.n] : null;
        const fineFase = !restano && (presto || (lim != null && presi < (p.max ?? Infinity))); // only this phase's share is gone
        const stato = presto ? T("In vendita da 1.000 pixel venduti", "On sale from 1,000 pixels sold") : restano ? (lim != null ? `${p.max ? T(`Solo ${num(p.max)} in tutto, `, `Only ${p.max} in total, `) : ""}${T("ora disponibili", "available now")} ${num(lim - presi)}` : p.max ? T(`Solo ${num(p.max)} in tutto`, `Only ${p.max} in total`) : T("Disponibile", "Available"))
          : fineFase ? T("Finiti per questa fase, altri alla prossima", "Gone for this phase, more in the next one") : T("Esaurito", "Sold out");
        return (
          <Link href={restano ? `/crea-spazio?pack=${p.n}` : fineFase ? "/compra" : "/aste"} className={"pt" + (p.n === 100 ? " star" : "") + (restano ? "" : " esaurito")} key={p.n}>
            {p.n === 100 && <span className="badge">{T("Il più grande", "The biggest")}</span>}
            <div className="shape">
              <div className="g" style={{ gridTemplateColumns: `repeat(${p.w},8px)` }}>
                {Array.from({ length: p.n }, (_, i) => <i key={i} />)}
              </div>
            </div>
            <span className="nm">{nomePack(p.n, en)}</span>
            <span className="sz">{misura(p.n, en)}</span>
            <span className="v">{eur(tot)}<small>{T("+ IVA", "+ VAT")}</small></span>
            <span className="pp">{p.sconto ? <><b>-{Math.round(p.sconto * 100)}%</b> · </> : null}{aPixel(tot / p.n)} {T("a pixel", "per pixel")}</span>
            <div className="left"><span>{stato}</span><span className="go">{restano ? T("Scegli", "Choose") : fineFase ? "" : T("Vedi le aste", "See auctions")}</span></div>
          </Link>
        );
      })}
    </div>
  );
}
