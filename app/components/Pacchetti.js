import Link from "next/link";
import { IN_VENDITA, inVenditaOra, prezzoPacchetto, eur, num } from "../../lib/prezzi";
import { disponibiliPresto } from "../../lib/db";

// The six packs as cards. Each card opens /crea-spazio?pack=X. A size that is sold out shows "Esaurito".
export default async function Pacchetti({ venduti = 0, calo = 0 }) {
  const d = await disponibiliPresto();
  return (
    <div className="packs-t">
      {IN_VENDITA.map((p) => {
        const tot = prezzoPacchetto(p.n, venduti, calo);
        const presto = !inVenditaOra(p, d?.venduti ?? venduti); // big sizes: not on sale yet
        const restano = d ? d.ok[p.n] : !presto;
        const presi = d ? d.presi[p.n] || 0 : 0;
        const lim = d ? d.limite[p.n] : null;
        const fineFase = !restano && (presto || (lim != null && presi < (p.max ?? Infinity))); // only this phase's share is gone
        const stato = presto ? "In vendita da 1.000 pixel venduti" : restano ? (lim != null ? `${p.max ? `Solo ${num(p.max)} in tutto, ` : ""}ora disponibili ${num(lim - presi)}` : p.max ? `Solo ${num(p.max)} in tutto` : "Disponibile")
          : fineFase ? "Finiti per questa fase, altri alla prossima" : "Esaurito";
        return (
          <Link href={restano ? `/crea-spazio?pack=${p.n}` : fineFase ? "/compra" : "/aste"} className={"pt" + (p.n === 100 ? " star" : "") + (restano ? "" : " esaurito")} key={p.n}>
            {p.n === 100 && <span className="badge">Il più grande</span>}
            <div className="shape">
              <div className="g" style={{ gridTemplateColumns: `repeat(${p.w},8px)` }}>
                {Array.from({ length: p.n }, (_, i) => <i key={i} />)}
              </div>
            </div>
            <span className="nm">{p.nome}</span>
            <span className="sz">{p.titolo}</span>
            <span className="v">{eur(tot)}<small>+ IVA</small></span>
            <span className="pp">{p.sconto ? <><b>-{Math.round(p.sconto * 100)}%</b> · </> : null}{eur(Math.floor(tot / p.n))} a pixel</span>
            <div className="left"><span>{stato}</span><span className="go">{restano ? "Scegli" : fineFase ? "" : "Vedi le aste"}</span></div>
          </Link>
        );
      })}
    </div>
  );
}
