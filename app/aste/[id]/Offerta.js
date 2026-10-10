"use client";

import { useRef, useState } from "react";
import Ritaglio, { leggiImmagine } from "../../components/Ritaglio";
import { normalizzaLink } from "../../../lib/controllo";
import { eur } from "../../../lib/prezzi";

// Bid form: brand, link, image (with crop preview), email and amount. The card is saved with Stripe.
export default function Offerta({ asta, w, h, min }) {
  const [importo, setImporto] = useState(String(min));
  const [nome, setNome] = useState("");
  const [link, setLink] = useState("");
  const [email, setEmail] = useState("");
  const [img, setImg] = useState(null);
  const [ok, setOk] = useState(false);
  const [errore, setErrore] = useState("");
  const [stato, setStato] = useState("modulo"); // modulo | invio | fatto
  const tagliata = useRef(null);

  const euro = Math.floor(Number(importo));
  const pronto = euro >= min && nome.trim() && normalizzaLink(link) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && img && ok;

  function carica(e) {
    const f = e.target.files?.[0];
    setErrore("");
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setErrore("L'immagine è troppo grande: massimo 10 MB."); return; }
    leggiImmagine(f).then((r) => (Math.min(r.w, r.h) < 100 ? setErrore("L'immagine è troppo piccola: almeno 100 pixel per lato.") : setImg(r))).catch((m) => setErrore(String(m)));
  }

  // A small copy (max 512 px) for the automatic image check.
  function piccola(src) {
    return new Promise((ok) => {
      const im = new Image();
      im.onload = () => {
        const k = Math.min(1, 512 / Math.max(im.width, im.height)), c = document.createElement("canvas");
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
        ok(c.toDataURL("image/jpeg", 0.85));
      };
      im.src = src;
    });
  }

  async function offri() {
    if (!pronto) return;
    setStato("invio"); setErrore("");
    try {
      const immagine = tagliata.current();
      const c = await fetch("/api/controlla", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ link, immagine: await piccola(immagine) }) }).then((x) => x.json());
      if (!c.ok) { setErrore(c.motivo); setStato("modulo"); return; }
      const d = await fetch("/api/aste/offerta", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ asta, importo: euro, nome, link, email, dubbio: c.dubbio, immagine }) }).then((x) => x.json());
      if (d.url) { window.location.href = d.url; return; }
      if (d.prova) { setStato("fatto"); return; }
      setErrore(d.errore || "Non è stato possibile registrare l'offerta."); setStato("modulo");
    } catch {
      setErrore("Non è stato possibile registrare l'offerta. Riprova tra poco."); setStato("modulo");
    }
  }

  if (stato === "fatto") return <div className="card"><p className="ok-big">Offerta registrata.</p><p className="muted">Prova senza pagamento: nessun addebito.</p></div>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Ritaglio img={img} w={w} h={h} fatto={(fn) => (tagliata.current = fn)} />
      <div className="card" style={{ display: "grid", gap: 14 }}>
        <span className="step-n">La tua offerta</span>
        <div className="fields">
          <label className="f">Quanto offri (€, + IVA)
            <input type="number" min={min} step="10" value={importo} onChange={(e) => setImporto(e.target.value)} />
            <span className="hint">Minimo {eur(min)}</span>
          </label>
          <label className="f">Nome del tuo brand
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Es. Bar Centrale" maxLength={40} />
          </label>
          <label className="f">Il tuo link
            <input type="text" inputMode="url" autoCapitalize="none" value={link} onChange={(e) => setLink(e.target.value)} placeholder="www.iltuosito.it" />
          </label>
          <label className="f">La tua immagine
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={carica} />
          </label>
          <label className="f">La tua email (per la ricevuta)
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nome@esempio.it" />
          </label>
        </div>
        <label className="check">
          <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
          <span>Confermo che l'immagine è mia o ho il diritto di usarla. Se vinco, accetto l'addebito della mia offerta sulla carta che salvo ora.</span>
        </label>
        <button type="button" className="cta" disabled={!pronto || stato === "invio"} onClick={offri}>
          {stato === "invio" ? "Controllo in corso…" : `Offri ${euro >= min ? eur(euro) : ""}`}
        </button>
        {errore && <p className="hint" style={{ color: "#8a3f2c" }}>{errore}</p>}
        <p className="muted">Salvi la carta in modo sicuro con Stripe. Non paghi nulla adesso.</p>
      </div>
    </div>
  );
}
