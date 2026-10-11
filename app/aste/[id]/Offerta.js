"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Ritaglio, { leggiImmagine } from "../../components/Ritaglio";
import { normalizzaLink } from "../../../lib/controllo";
import { eur } from "../../../lib/prezzi";
import { useLingua } from "../../components/Lingua";

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
  const { en, T } = useLingua();

  const euro = Math.floor(Number(importo));
  const pronto = euro >= min && nome.trim() && normalizzaLink(link) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && img && ok;

  function carica(e) {
    const f = e.target.files?.[0];
    setErrore("");
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setErrore(T("L'immagine è troppo grande: massimo 10 MB.", "The image is too big: 10 MB maximum.")); return; }
    leggiImmagine(f).then((r) => (Math.min(r.w, r.h) < 100 ? setErrore(T("L'immagine è troppo piccola: almeno 100 pixel per lato.", "The image is too small: at least 100 pixels per side.")) : setImg(r))).catch((m) => setErrore(String(m)));
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
      setErrore(d.errore || T("Non è stato possibile registrare l'offerta.", "The bid could not be saved.")); setStato("modulo");
    } catch {
      setErrore(T("Non è stato possibile registrare l'offerta. Riprova tra poco.", "The bid could not be saved. Please try again shortly.")); setStato("modulo");
    }
  }

  if (stato === "fatto") return <div className="card"><p className="ok-big">{T("Offerta registrata.", "Bid saved.")}</p><p className="muted">{T("Prova senza pagamento: nessun addebito.", "Test without payment: nothing charged.")}</p></div>;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Ritaglio img={img} w={w} h={h} fatto={(fn) => (tagliata.current = fn)} />
      <div className="card" style={{ display: "grid", gap: 14 }}>
        <span className="step-n">{T("La tua offerta", "Your bid")}</span>
        <div className="fields">
          <label className="f">{T("Quanto offri (€, + IVA)", "Your bid (€, + VAT)")}
            <input type="number" min={min} step="10" value={importo} onChange={(e) => setImporto(e.target.value)} />
            <span className="hint">{T("Minimo", "Minimum")} {eur(min)}</span>
          </label>
          <label className="f">{T("Nome del tuo brand", "Your brand name")}
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={T("Es. Bar Centrale", "E.g. Central Café")} maxLength={40} />
          </label>
          <label className="f">{T("Il tuo link", "Your link")}
            <input type="text" inputMode="url" autoCapitalize="none" value={link} onChange={(e) => setLink(e.target.value)} placeholder={T("www.iltuosito.it", "www.yoursite.com")} />
          </label>
          <label className="f">{T("La tua immagine", "Your image")}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={carica} />
            <span className="hint"><b>{T("Formato consigliato", "Recommended size")}: {w * 100} × {h * 100} px</b> {T("(o più grande, con la stessa forma). Così l'immagine riempie lo spazio senza bande.", "(or larger, same shape). This way the image fills the space with no bands.")}</span>
          </label>
          <label className="f">{T("La tua email (per la ricevuta)", "Your email (for the receipt)")}
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={T("nome@esempio.it", "name@example.com")} />
          </label>
        </div>
        <label className="check">
          <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
          <span>{en ? <>I confirm that the image is mine or that I have the right to use it, and I accept the <Link href="/termini" target="_blank">Terms</Link>. If I win, I accept that my bid is charged to the payment method I save now, that the space is published right away and that I lose the right of withdrawal. I have read the <Link href="/privacy" target="_blank">Privacy policy</Link>.</> : <>Confermo che l'immagine è mia o ho il diritto di usarla e accetto i <Link href="/termini" target="_blank">Termini</Link>. Se vinco, accetto l'addebito della mia offerta sul metodo di pagamento che salvo ora, la pubblicazione immediata dello spazio e la perdita del diritto di recesso. Ho letto la <Link href="/privacy" target="_blank">Privacy policy</Link>.</>}</span>
        </label>
        <button type="button" className="cta" disabled={!pronto || stato === "invio"} onClick={offri}>
          {stato === "invio" ? T("Controllo in corso…", "Checking…") : `${T("Offri", "Bid")} ${euro >= min ? eur(euro) : ""}`}
        </button>
        {errore && <p className="hint" style={{ color: "#8a3f2c" }}>{errore}</p>}
        <p className="muted">{T("Salvi carta o PayPal in modo sicuro. Non paghi nulla adesso.", "You save a card or PayPal securely. You pay nothing now.")}</p>
      </div>
    </div>
  );
}
