import Link from "next/link";
import { PACCHETTI, prezzoPacchetto, eur, num } from "../../lib/prezzi";

// The six packs as cards. Each card opens /crea-spazio?pack=X.
export default function Pacchetti() {
  return (
    <div className="packs-t">
      {Object.values(PACCHETTI).map((p) => {
        const tot = prezzoPacchetto(p.n);
        return (
          <Link href={`/crea-spazio?pack=${p.n}`} className={"pt" + (p.n === 100 ? " star" : "")} key={p.n}>
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
            <div className="left"><span>{num(p.spazi)} spazi in tutto</span><span className="go">Scegli</span></div>
          </Link>
        );
      })}
    </div>
  );
}
