"use client";

import { useState } from "react";
import Link from "next/link";
import { PACCHETTI, FASI, fase, prezzoPacchetto, prezzoPixel, eur } from "../../lib/prezzi";

// Finché Stripe non è collegato il pagamento è solo una prova: nessun addebito.
const PAGAMENTI_ATTIVI = false;
const MAX_MB = 5;

export default function CreaSpazio({ iniziale }) {
  const [pack, setPack] = useState(iniziale);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [img, setImg] = useState(null);
  const [fit, setFit] = useState("cover");
  const [ok, setOk] = useState(false);
  const [errore, setErrore] = useState("");
  const [stato, setStato] = useState("modulo"); // modulo | invio | fatto

  const p = PACCHETTI[pack];
  const totale = prezzoPacchetto(pack);
  const linkValido = /^https?:\/\/[^\s.]+\.[^\s]+$/i.test(link.trim());
  const emailValida = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const pronto = nome.trim() && emailValida && linkValido && img && ok;

  function caricaImmagine(e) {
    const file = e.target.files?.[0];
    setErrore("");
    if (!file) return;
    if (!file.type.startsWith("image/")) { setErrore("Il file deve essere un'immagine (JPG, PNG o WebP)."); return; }
    if (file.size > MAX_MB * 1024 * 1024) { setErrore(`L'immagine supera ${MAX_MB} MB.`); return; }
    const r = new FileReader();
    r.onload = () => setImg(r.result);
    r.readAsDataURL(file);
  }

  function paga() {
    if (!pronto) return;
    setStato("invio");
    // Qui, con Stripe: crea l'ordine in attesa, apri il checkout, e il webhook
    // assegna i pixel quando il pagamento è confermato.
    setTimeout(() => setStato("fatto"), 1200);
  }

  // Preview size: the block keeps its shape and fits in about 320px.
  const cell = Math.min(64, Math.floor(320 / p.w));

  if (stato === "fatto") {
    return (
      <section className="wrap buy" style={{ gridTemplateColumns: "1fr", maxWidth: 720 }}>
        <div className="card" style={{ display: "grid", gap: 16 }}>
          <span className="step-n">{PAGAMENTI_ATTIVI ? "Pagamento riuscito" : "Prova completata · nessun addebito"}</span>
          <p className="ok-big">Sei nell'opera. Per sempre.</p>
          <p className="muted">Il tuo spazio "{p.nome}" ({p.titolo}) per <b>{nome}</b> verrà messo nel mosaico in una posizione scelta a caso, dopo il controllo dell'immagine. Riceverai la ricevuta a {email}.</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/#galleria" className="cta">Torna al mosaico</Link>
            <Link href="/compra" className="ghost">Prendi un altro spazio</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="wrap buy">
      <div style={{ display: "grid", gap: 16 }}>
        <div className="sec-h" style={{ marginBottom: 8 }}>
          <div className="eyebrow">Fase {fase() + 1} di {FASI.length} · {eur(prezzoPixel())} a pixel</div>
          <h2>Crea il tuo <em>spazio</em>.</h2>
        </div>

        <div className="card">
          <span className="step-n">Passo I</span>
          <h3>Scegli il pacchetto</h3>
          <div className="pkpick">
            {Object.values(PACCHETTI).map((x) => (
              <button type="button" key={x.n} aria-pressed={x.n === pack} onClick={() => setPack(x.n)}>
                <b>{x.titolo}</b>
                <span className="pr">{eur(prezzoPacchetto(x.n))}</span>
                <small>{x.w} x {x.h}{x.sconto ? ` · -${Math.round(x.sconto * 100)}%` : ""}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <span className="step-n">Passo II</span>
          <h3>Firma la tua opera</h3>
          <div className="fields">
            <label className="f">Nome del tuo brand
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Es. Bar Centrale" maxLength={40} />
            </label>
            <label className="f">Il tuo link
              <input type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://" />
              {link && !linkValido && <span className="hint">Scrivi l'indirizzo completo, per esempio https://iltuosito.it</span>}
            </label>
            <label className="f">La tua immagine
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={caricaImmagine} />
              <span className="hint">JPG, PNG o WebP, massimo {MAX_MB} MB. Una sola immagine per tutto il blocco.</span>
              {errore && <span className="hint" style={{ color: "#8a3f2c" }}>{errore}</span>}
            </label>
            <label className="f">Adattamento immagine
              <select value={fit} onChange={(e) => setFit(e.target.value)}>
                <option value="cover">Riempi tutto lo spazio</option>
                <option value="contain">Mostra l'immagine intera</option>
              </select>
            </label>
            <label className="f">La tua email (per la ricevuta)
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@esempio.it" />
            </label>
          </div>
        </div>
      </div>

      <div className="sticky">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="pv-wrap">
            <div className="pv" style={{ width: p.w * cell, height: p.h * cell }}>
              {img ? <img src={img} alt="Anteprima del tuo spazio" style={{ objectFit: fit }} /> : <div className="empty">La tua immagine</div>}
              <div className="gr" style={{ gridTemplateColumns: `repeat(${p.w},1fr)`, gridTemplateRows: `repeat(${p.h},1fr)` }}>
                {Array.from({ length: p.n }, (_, i) => <div key={i} />)}
              </div>
            </div>
          </div>
          <div style={{ padding: 24, display: "grid", gap: 16 }}>
            <span className="step-n">Passo III · Riepilogo</span>
            <div className="sum">
              <div><span>Spazio</span><span>{p.nome} · {p.w} x {p.h}</span></div>
              <div><span>Brand</span><span>{nome || "—"}</span></div>
              <div><span>Posizione</span><span>a caso, per sempre</span></div>
              <div className="tot"><span>Totale</span><span>{eur(totale)} <small>+ IVA</small></span></div>
            </div>
            <label className="check">
              <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
              <span>Confermo che l'immagine è mia o ho il diritto di usarla, e accetto che venga controllata prima di andare online.</span>
            </label>
            <button type="button" className="cta" disabled={!pronto || stato === "invio"} onClick={paga}>
              {stato === "invio" ? "Un attimo…" : `Paga ${eur(totale)}`}
            </button>
            <div className="pay-methods"><span>Carta</span><span>Apple Pay</span><span>Google Pay</span><span>PayPal</span></div>
            {!PAGAMENTI_ATTIVI && <p className="muted">Pagamento di prova: per ora non viene addebitato nulla.</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
