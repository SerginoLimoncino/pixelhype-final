import Link from "next/link";
import { notFound } from "next/navigation";
import { dbAttivo, pixelVendutiPresto, posizioni } from "../../../lib/db";
import { asteAperte, aggiornaAstePresto, unaAsta, minimo } from "../../../lib/aste";
import { PACCHETTI, eur, quando } from "../../../lib/prezzi";
import Offerta from "./Offerta";
import Timer from "../../components/Timer";
import Posizione from "./Posizione";

export const dynamic = "force-dynamic";
export const metadata = { title: "Asta · PixelHype" };

export default async function UnaAsta({ params }) {
  const { id } = await params;
  if (!dbAttivo() || !asteAperte(await pixelVendutiPresto())) notFound();
  await aggiornaAstePresto();
  const a = await unaAsta(Number(id)).catch(() => null);
  if (!a || a.stato === "attesa") notFound();
  const p = PACCHETTI[a.pack];
  const aperta = a.stato === "aperta" && new Date(a.fine) > new Date();
  const presi = aperta && a.x !== null ? await posizioni().catch(() => []) : [];

  return (
    <section className="wrap buy">
      <div className="card" style={{ display: "grid", gap: 12, alignContent: "start" }}>
        <span className="step-n">{a.zona === "cuore" ? "Asta nel Cuore" : "Asta fuori dal Cuore"}</span>
        <h2>{p.nome} · <em>{p.titolo}</em></h2>
        <div className="sum">
          <div><span>Base d'asta</span><span>{eur(a.base)}</span></div>
          <div><span>Offerta più alta</span><span>{a.migliore ? eur(a.migliore) : "nessuna"}</span></div>
          <div><span>Offerte</span><span>{a.offerte}</span></div>
          {aperta && <div><span>Tempo rimasto</span><span><Timer fine={a.fine} /></span></div>}
          <div><span>{aperta ? "Finisce il" : "Finita il"}</span><span>{quando(a.fine)}</span></div>
          <div><span>Posizione</span><span>{a.x === null ? "a caso nel mosaico, per sempre" : `${a.zona === "cuore" ? "nel Cuore, " : ""}riga ${a.y + 1}, colonna ${a.x + 1}`}</span></div>
        </div>
        {aperta && a.x !== null && <Posizione x={a.x} y={a.y} w={p.w} h={p.h} presi={presi} />}
        <p className="muted">Offrire non costa nulla: salvi carta o PayPal e paghi solo se vinci. Se un'offerta arriva negli ultimi 5 minuti, l'asta si allunga di 5 minuti. Prezzi + IVA.</p>
        <Link href="/aste" className="ghost">Tutte le aste</Link>
      </div>
      {aperta ? <Offerta asta={a.id} w={p.w} h={p.h} min={minimo(a, a.migliore)} /> : <div className="card"><p className="muted">Asta finita.</p></div>}
    </section>
  );
}
