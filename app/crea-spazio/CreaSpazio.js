"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PACCHETTI, FASI, fase, prezzoPacchetto, prezzoPixel, eur } from "../../lib/prezzi";
import { normalizzaLink } from "../../lib/controllo";

const MAX_MB = 10; // file più grandi vengono rifiutati
const MAX_LATO = 1600; // lato massimo dopo il ridimensionamento automatico
const MIN_LATO = 100; // immagini più piccole sarebbero sgranate
const PX_FINALE = 100; // pixel reali per ogni pixel del mosaico nell'immagine finale

// Reads the file, rejects images that are too big or too small, and shrinks the rest.
function preparaImmagine(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject("Il file deve essere un'immagine (JPG, PNG o WebP).");
    if (file.size > MAX_MB * 1024 * 1024) return reject(`L'immagine è troppo grande: massimo ${MAX_MB} MB.`);
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const w = im.naturalWidth, h = im.naturalHeight;
      if (w * h > 40e6) return reject("L'immagine ha troppi pixel (oltre 40 megapixel). Usane una più piccola.");
      if (Math.min(w, h) < MIN_LATO) return reject(`L'immagine è troppo piccola: almeno ${MIN_LATO} pixel per lato.`);
      const k = Math.min(1, MAX_LATO / Math.max(w, h));
      const c = document.createElement("canvas");
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      resolve({ src: c.toDataURL("image/webp", 0.9), w: c.width, h: c.height, el: c });
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject("Non riesco a leggere questa immagine."); };
    im.src = url;
  });
}

export default function CreaSpazio({ iniziale, venduti = 0 }) {
  const [pack, setPack] = useState(iniziale);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [img, setImg] = useState(null); // { src, w, h }
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef(null);
  const [fit, setFit] = useState("cover");
  const [ok, setOk] = useState(false);
  const [errore, setErrore] = useState("");
  const [stato, setStato] = useState("modulo"); // modulo | invio | fatto
  const [errPaga, setErrPaga] = useState("");

  const p = PACCHETTI[pack];
  const totale = prezzoPacchetto(pack, venduti);
  const linkValido = !!normalizzaLink(link);
  const emailValida = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const pronto = nome.trim() && emailValida && linkValido && img && ok;

  function caricaImmagine(e) {
    const file = e.target.files?.[0];
    setErrore("");
    if (!file) return;
    preparaImmagine(file)
      .then((res) => { setImg(res); setZoom(1); setOff({ x: 0, y: 0 }); })
      .catch((msg) => { setImg(null); setErrore(String(msg)); e.target.value = ""; });
  }

  async function paga() {
    if (!pronto) return;
    setStato("invio");
    setErrPaga("");
    const finale = immagineFinale(); // questa è l'immagine che verrà caricata e controllata
    try {
      // Automatic check of link and image before paying.
      const c = await fetch("/api/controlla", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link, immagine: immagineControllo() }),
      }).then((x) => x.json());
      if (!c.ok) { setErrPaga(c.motivo); setStato("modulo"); return; }
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack, nome, link, email, dubbio: c.dubbio, immagine: finale }),
      });
      const d = await r.json();
      if (d.url) { window.location.href = d.url; return; }
      // Without the Stripe key on Vercel the payment is only a test: nothing is charged.
      if (d.prova) { setTimeout(() => setStato("fatto"), 800); return; }
      throw new Error(d.errore);
    } catch {
      setErrPaga("Il pagamento non è partito. Riprova tra poco.");
      setStato("modulo");
    }
  }

  // Preview size: the block keeps its shape and fits in about 320px.
  const cell = Math.min(64, Math.floor(320 / p.w));
  const PW = p.w * cell, PH = p.h * cell;
  // Image size inside the preview: "cover" fills the block, "contain" shows it whole; zoom enlarges it.
  const base = img ? (fit === "cover" ? Math.max(PW / img.w, PH / img.h) : Math.min(PW / img.w, PH / img.h)) : 1;
  const dw = img ? img.w * base * zoom : 0, dh = img ? img.h * base * zoom : 0;
  const lim = (o) => ({
    x: dw > PW ? Math.max(-(dw - PW) / 2, Math.min((dw - PW) / 2, o.x)) : 0,
    y: dh > PH ? Math.max(-(dh - PH) / 2, Math.min((dh - PH) / 2, o.y)) : 0,
  });
  const o = lim(off);

  // Pack, fit or zoom changes can leave the image off-centre: keep it inside the block.
  useEffect(() => { setOff((v) => lim(v)); }, [pack, fit, zoom]); // eslint-disable-line react-hooks/exhaustive-deps

  function inizioTrascina(e) {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, o };
  }
  function trascina(e) {
    if (!drag.current) return;
    const d = drag.current;
    setOff(lim({ x: d.o.x + e.clientX - d.x, y: d.o.y + e.clientY - d.y }));
  }
  function fineTrascina() { drag.current = null; }

  // The final cropped image, exactly as it will appear in the mosaic.
  function immagineFinale() {
    const c = document.createElement("canvas");
    c.width = p.w * PX_FINALE; c.height = p.h * PX_FINALE;
    const g = c.getContext("2d"), r = c.width / PW;
    g.fillStyle = "#faf8f4"; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img.el, (PW / 2 - dw / 2 + o.x) * r, (PH / 2 - dh / 2 + o.y) * r, dw * r, dh * r);
    const webp = c.toDataURL("image/webp", 0.9);
    return webp.startsWith("data:image/webp") ? webp : c.toDataURL("image/jpeg", 0.9); // Safari non fa webp
  }

  // A small copy of the final image (max 512 px) for the automatic check.
  function immagineControllo() {
    const W = p.w * PX_FINALE, H = p.h * PX_FINALE, k = Math.min(1, 512 / Math.max(W, H));
    const c = document.createElement("canvas");
    c.width = Math.round(W * k); c.height = Math.round(H * k);
    const g = c.getContext("2d"), r = c.width / PW;
    g.fillStyle = "#faf8f4"; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img.el, (PW / 2 - dw / 2 + o.x) * r, (PH / 2 - dh / 2 + o.y) * r, dw * r, dh * r);
    return c.toDataURL("image/jpeg", 0.85);
  }

  if (stato === "fatto") {
    return (
      <section className="wrap buy" style={{ gridTemplateColumns: "1fr", maxWidth: 720 }}>
        <div className="card" style={{ display: "grid", gap: 16 }}>
          <span className="step-n">Prova completata · nessun addebito</span>
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
          <div className="eyebrow">Fase {fase(venduti) + 1} di {FASI.length} · {eur(prezzoPixel(venduti))} a pixel</div>
          <h2>Crea il tuo <em>spazio</em>.</h2>
        </div>

        <div className="card">
          <span className="step-n">Passo I</span>
          <h3>Scegli il pacchetto</h3>
          <div className="pkpick">
            {Object.values(PACCHETTI).map((x) => (
              <button type="button" key={x.n} aria-pressed={x.n === pack} onClick={() => setPack(x.n)}>
                <b>{x.titolo}</b>
                <span className="pr">{eur(prezzoPacchetto(x.n, venduti))}</span>
                <small>{x.titolo}{x.sconto ? ` · -${Math.round(x.sconto * 100)}%` : ""}</small>
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
              <input type="text" inputMode="url" autoCapitalize="none" value={link} onChange={(e) => setLink(e.target.value)} placeholder="www.iltuosito.it" />
              {link && !linkValido && <span className="hint">Scrivi l'indirizzo del sito, per esempio www.iltuosito.it</span>}
            </label>
            <label className="f">La tua immagine
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={caricaImmagine} />
              <span className="hint">JPG, PNG o WebP, massimo {MAX_MB} MB. Se è molto grande la rimpiccioliamo noi. Una sola immagine per tutto il blocco.</span>
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
            <div className={"pv" + (img ? " edit" : "")} style={{ width: PW, height: PH }} onPointerDown={inizioTrascina} onPointerMove={trascina} onPointerUp={fineTrascina} onPointerCancel={fineTrascina}>
              {img ? <img src={img.src} alt="Anteprima del tuo spazio" draggable={false} style={{ position: "absolute", width: dw, height: dh, maxWidth: "none", left: PW / 2 - dw / 2 + o.x, top: PH / 2 - dh / 2 + o.y }} /> : <div className="empty">La tua immagine</div>}
              <div className="gr" style={{ gridTemplateColumns: `repeat(${p.w},1fr)`, gridTemplateRows: `repeat(${p.h},1fr)` }}>
                {Array.from({ length: p.n }, (_, i) => <div key={i} />)}
              </div>
            </div>
          </div>
          {img && (
            <div className="editor">
              <span className="step-n">Ritaglia</span>
              <p className="muted">Trascina l'immagine per spostarla e usa lo zoom per ingrandirla.</p>
              <label className="zoom">
                <span>Zoom</span>
                <input type="range" min="1" max="4" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Zoom immagine" />
              </label>
              <div className="ed-row">
                <button type="button" className="ghost sm" onClick={() => { setZoom(1); setOff({ x: 0, y: 0 }); }}>Centra</button>
                <button type="button" className="ghost sm" onClick={() => setFit(fit === "cover" ? "contain" : "cover")}>{fit === "cover" ? "Mostra intera" : "Riempi lo spazio"}</button>
              </div>
            </div>
          )}
          <div style={{ padding: 24, display: "grid", gap: 16 }}>
            <span className="step-n">Passo III · Riepilogo</span>
            <div className="sum">
              <div><span>Spazio</span><span>{p.nome} · {p.titolo}</span></div>
              <div><span>Brand</span><span>{nome || "—"}</span></div>
              <div><span>Posizione</span><span>a caso, per sempre</span></div>
              <div className="tot"><span>Totale</span><span>{eur(totale)} <small>+ IVA</small></span></div>
            </div>
            <label className="check">
              <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
              <span>Confermo che l'immagine è mia o ho il diritto di usarla, e accetto che venga controllata prima di andare online.</span>
            </label>
            <button type="button" className="cta" disabled={!pronto || stato === "invio"} onClick={paga}>
              {stato === "invio" ? "Controllo in corso…" : `Paga ${eur(totale)}`}
            </button>
            <div className="pay-methods"><span>Carta</span><span>Apple Pay</span><span>Google Pay</span><span>PayPal</span></div>
            {errPaga && <p className="hint" style={{ color: "#8a3f2c" }}>{errPaga}</p>}
            <p className="muted">Paghi in modo sicuro con Stripe. I dati della carta non passano mai da PixelHype.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
