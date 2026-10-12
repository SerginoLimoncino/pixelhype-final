import Link from "next/link";
import { notFound } from "next/navigation";
import { dbAttivo, pixelVendutiPresto, posizioni } from "../../../lib/db";
import { asteAperte, aggiornaAstePresto, unaAsta, minimo } from "../../../lib/aste";
import { PACCHETTI, nomePack, misura, eur, quando } from "../../../lib/prezzi";
import { traduttore } from "../../../lib/lingua";
import Offerta from "./Offerta";
import Timer from "../../components/Timer";
import Posizione from "./Posizione";

export const dynamic = "force-dynamic";
export async function generateMetadata() {
  const { T } = await traduttore();
  return { title: T("Asta · PixelHype", "Auction · PixelHype") };
}

export default async function UnaAsta({ params }) {
  const { id } = await params;
  const { en, T } = await traduttore();
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
        <span className="step-n">{a.zona === "cuore" ? T("Asta nel Cuore", "Auction in the Heart") : T("Asta fuori dal Cuore", "Auction outside the Heart")}</span>
        <h2>{nomePack(a.pack, en)} · <em>{misura(a.pack, en)}</em></h2>
        <div className="sum">
          <div><span>{T("Base d'asta", "Starting price")}</span><span>{eur(a.base, en)}</span></div>
          <div><span>{T("Offerta più alta", "Highest bid")}</span><span>{a.migliore ? eur(a.migliore, en) : T("nessuna", "none")}</span></div>
          <div><span>{T("Offerte", "Bids")}</span><span>{a.offerte}</span></div>
          {aperta && <div><span>{T("Tempo rimasto", "Time left")}</span><span><Timer fine={a.fine} /></span></div>}
          <div><span>{aperta ? T("Finisce il", "Ends on") : T("Finita il", "Ended on")}</span><span>{quando(a.fine, en)}</span></div>
          <div><span>{T("Posizione", "Position")}</span><span>{a.x === null ? T("a caso nel mosaico, per sempre", "random in the mosaic, forever") : en ? `${a.zona === "cuore" ? "in the Heart, " : ""}row ${a.y + 1}, column ${a.x + 1}` : `${a.zona === "cuore" ? "nel Cuore, " : ""}riga ${a.y + 1}, colonna ${a.x + 1}`}</span></div>
        </div>
        {aperta && a.x !== null && <Posizione x={a.x} y={a.y} w={p.w} h={p.h} presi={presi} en={en} />}
        <p className="muted">{T("Offrire non costa nulla: salvi carta o PayPal e paghi solo se vinci. Se un'offerta arriva negli ultimi 5 minuti, l'asta si allunga di 5 minuti. Prezzi + IVA.", "Bidding costs nothing: you save a card or PayPal and only pay if you win. If a bid arrives in the last 5 minutes, the auction is extended by 5 minutes. Prices + VAT.")}</p>
        <Link href="/aste" className="ghost">{T("Tutte le aste", "All auctions")}</Link>
      </div>
      {aperta ? <Offerta asta={a.id} w={p.w} h={p.h} min={minimo(a, a.migliore)} /> : <div className="card"><p className="muted">{T("Asta finita.", "Auction ended.")}</p></div>}
    </section>
  );
}
