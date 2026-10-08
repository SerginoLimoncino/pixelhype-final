import Link from "next/link";
import { PACCHETTI, prezzoPacchetto, eur, num } from "../../lib/prezzi";
import { disponibiliPresto } from "../../lib/db";

// The six packs as cards. Each card opens /crea-spazio?pack=X. A size that is sold out shows "Esaurito".
export default async function Pacchetti({ venduti = 0 }) {
  const d = await disponibiliPresto();
  return (
    <div className="packs-t">
      {Object.values(PACCHETTI).map((p) => {
        const tot = prezzoPacchetto(p.n, venduti);
        const restano = d ? d.ok[p.n] : true;
        const presi = d ? d.presi[p.n] || 0 : 0;
        const fineFase = !restano && p.max && presi < p.max; // only this phase's share is gone
        const stato = restano ? (p.max ? `Solo ${num(p.max)} in tutto${d ? `, ora disponibili ${num(d.limite[p.n] - presi)}` : ""}` : "Disponibile")
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
