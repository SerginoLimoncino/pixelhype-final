"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PACCHETTI, FASI, fase, inVenditaOra, prezzoPacchetto, prezzoCuore, prezzoPixel, nomePack, misura, eur } from "../../lib/prezzi";
import { useLingua } from "../components/Lingua";
import { normalizzaLink } from "../../lib/controllo";
import { coloreBordo } from "../components/Ritaglio";

const MAX_MB = 10; // file più grandi vengono rifiutati
const MAX_LATO = 1600; // lato massimo dopo il ridimensionamento automatico
const MIN_LATO = 100; // immagini più piccole sarebbero sgranate
const PX_FINALE = 100; // pixel reali per ogni pixel del mosaico nell'immagine finale

// Reads the file, rejects images that are too big or too small, and shrinks the rest.
function preparaImmagine(file, T) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) return reject(T("Il file deve essere un'immagine (JPG, PNG o WebP).", "The file must be an image (JPG, PNG or WebP)."));
    if (file.size > MAX_MB * 1024 * 1024) return reject(T(`L'immagine è troppo grande: massimo ${MAX_MB} MB.`, `The image is too big: ${MAX_MB} MB maximum.`));
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const w = im.naturalWidth, h = im.naturalHeight;
      if (w * h > 40e6) return reject(T("L'immagine ha troppi pixel (oltre 40 megapixel). Usane una più piccola.", "The image has too many pixels (over 40 megapixels). Use a smaller one."));
      if (Math.min(w, h) < MIN_LATO) return reject(T(`L'immagine è troppo piccola: almeno ${MIN_LATO} pixel per lato.`, `The image is too small: at least ${MIN_LATO} pixels per side.`));
      const k = Math.min(1, MAX_LATO / Math.max(w, h));
      const c = document.createElement("canvas");
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      resolve({ src: c.toDataURL("image/webp", 0.9), w: c.width, h: c.height, el: c, bordo: coloreBordo(c) });
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject(T("Non riesco a leggere questa immagine.", "This image cannot be read.")); };
    im.src = url;
  });
}

export default function CreaSpazio({ iniziale, venduti = 0, calo = 0, cuore = false, prenota = false }) {
  const [pack, setPack] = useState(iniziale);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [link, setLink] = useState("");
  const [img, setImg] = useState(null); // { src, w, h }
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const drag = useRef(null);
  const [fit, setFit] = useState("cover");
  // Preview width: about 320px, smaller on narrow phones so the whole block stays visible.
  const [largo, setLargo] = useState(320);
  useEffect(() => {
    const misura = () => setLargo(Math.max(200, Math.min(320, window.innerWidth - 80)));
    misura(); window.addEventListener("resize", misura);
    return () => window.removeEventListener("resize", misura);
  }, []);
  const [ok, setOk] = useState(false);
  const [errore, setErrore] = useState("");
  const [stato, setStato] = useState("modulo"); // modulo | invio | fatto
  const [errPaga, setErrPaga] = useState("");
  const { en, T } = useLingua();

  const p = PACCHETTI[pack];
  const prezzoDi = (n) => (cuore ? prezzoCuore(n, venduti, calo) : prezzoPacchetto(n, venduti, calo));
  const totale = prezzoDi(pack);
  const linkValido = !link.trim() || !!normalizzaLink(link); // optional, but if written it must be a web address
  const emailValida = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const pronto = prenota ? emailValida && linkValido && ok : nome.trim() && emailValida && linkValido && img && ok;
  const [gia, setGia] = useState(false);

  function caricaImmagine(e) {
    const file = e.target.files?.[0];
    setErrore("");
    if (!file) return;
    preparaImmagine(file, T)
      .then((res) => { setImg(res); setZoom(1); setOff({ x: 0, y: 0 }); })
      .catch((msg) => { setImg(null); setErrore(String(msg)); e.target.value = ""; });
  }

  // Booking mode: saves email and size, nothing is paid.
  async function prenotaOra() {
    if (!pronto) return;
    setStato("invio"); setErrPaga("");
    try {
      // Image and link are optional; when given they get the same automatic check as a purchase.
      if (img || link.trim()) {
        const c = await fetch("/api/controlla", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ link, immagine: img ? immagineControllo() : undefined }) }).then((x) => x.json()).catch(() => ({}));
        if (!c.ok) { setErrPaga(c.motivo || T("Il controllo non è riuscito. Riprova tra poco.", "The check did not work. Please try again shortly.")); setStato("modulo"); return; }
      }
      const r = await fetch("/api/prenota", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pack, nome, email, link, ok, immagine: img ? immagineFinale() : undefined }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw Object.assign(new Error(d.errore || ""), { nostro: true });
      setGia(!!d.gia); setStato("fatto");
    } catch (e) {
      setErrPaga((e.nostro && e.message) || T("La prenotazione non è partita. Riprova tra poco.", "The booking did not go through. Please try again shortly."));
      setStato("modulo");
    }
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
      }).then((x) => x.json()).catch(() => ({}));
      if (!c.ok) { setErrPaga(c.motivo || T("Il controllo non è riuscito. Riprova tra poco.", "The check did not work. Please try again shortly.")); setStato("modulo"); return; }
      const r = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack, nome, link, email, dubbio: c.dubbio, immagine: finale, cuore }),
      });
      const d = await r.json().catch(() => ({}));
      if (d.url) { window.location.href = d.url; return; }
      // Without the Stripe key on Vercel the payment is only a test: nothing is charged.
      if (d.prova) { setTimeout(() => setStato("fatto"), 800); return; }
      throw Object.assign(new Error(d.errore || ""), { nostro: true });
    } catch (e) {
      setErrPaga((e.nostro && e.message) || T("Il pagamento non è partito. Riprova tra poco.", "The payment did not start. Please try again shortly."));
      setStato("modulo");
    }
  }

  // Preview size: the block keeps its shape and fits in the preview width.
  const cell = Math.min(160, Math.floor(largo / p.w));
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
    g.fillStyle = img.bordo || "#faf8f4"; g.fillRect(0, 0, c.width, c.height);
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
    g.fillStyle = img.bordo || "#faf8f4"; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(img.el, (PW / 2 - dw / 2 + o.x) * r, (PH / 2 - dh / 2 + o.y) * r, dw * r, dh * r);
    return c.toDataURL("image/jpeg", 0.85);
  }

  if (stato === "fatto" && prenota) {
    return (
      <section className="wrap buy" style={{ gridTemplateColumns: "1fr", maxWidth: 720 }}>
        <div className="card" style={{ display: "grid", gap: 16 }}>
          <span className="step-n">{T("Prenotazione ricevuta · nessun pagamento", "Booking received · no payment")}</span>
          <p className="ok-big">{gia ? T("Eri già in lista.", "You were already on the list.") : T("Sei in lista.", "You are on the list.")}</p>
          <p className="muted">{en ? <>We have booked a space of {misura(pack, true)} for you. When sales open we will write to <b>{email}</b> before anyone else: you will choose then whether to buy it. You pay nothing now.</> : <>Ti abbiamo prenotato uno spazio da {misura(pack)}. Quando si apre la vendita scriviamo a <b>{email}</b> prima che a tutti gli altri: deciderai allora se comprarlo. Ora non paghi nulla.</>}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/#galleria" className="cta">{T("Torna al mosaico", "Back to the mosaic")}</Link>
            <Link href="/compra" className="ghost">{T("Prenota un'altra misura", "Book another size")}</Link>
          </div>
        </div>
      </section>
    );
  }

  if (stato === "fatto") {
    return (
      <section className="wrap buy" style={{ gridTemplateColumns: "1fr", maxWidth: 720 }}>
        <div className="card" style={{ display: "grid", gap: 16 }}>
          <span className="step-n">{T("Prova completata · nessun addebito", "Test completed · nothing charged")}</span>
          <p className="ok-big">{T("Sei nell'opera. Per sempre.", "You are in the artwork. Forever.")}</p>
          <p className="muted">{en ? <>Your space &quot;{nomePack(pack, true)}&quot; ({misura(pack, true)}) for <b>{nome}</b> will be placed in the mosaic at a random position, after the image check. You will get the receipt at {email}.</> : <>Il tuo spazio &quot;{p.nome}&quot; ({p.titolo}) per <b>{nome}</b> verrà messo nel mosaico in una posizione scelta a caso, dopo il controllo dell'immagine. Riceverai la ricevuta a {email}.</>}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link href="/#galleria" className="cta">{T("Torna al mosaico", "Back to the mosaic")}</Link>
            <Link href="/compra" className="ghost">{T("Prendi un altro spazio", "Get another space")}</Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="wrap buy">
      <div style={{ display: "grid", gap: 16 }}>
        <div className="sec-h" style={{ marginBottom: 8 }}>
          <div className="eyebrow">{cuore ? T("Gran finale · ultimi spazi del Cuore, cornice d'oro", "Grand finale · last spaces in the Heart, gold frame") : T(`Fase ${fase(venduti) + 1} di ${FASI.length} · ${eur(prezzoPixel(venduti, calo))} a pixel`, `Phase ${fase(venduti) + 1} of ${FASI.length} · ${eur(prezzoPixel(venduti, calo))} per pixel`)}</div>
          <h2>{prenota ? (en ? <>Book your <em>space</em>.</> : <>Prenota il tuo <em>spazio</em>.</>) : en ? (cuore ? <>Your space <em>in the Heart</em>.</> : <>Create your <em>space</em>.</>) : cuore ? <>Il tuo spazio <em>nel Cuore</em>.</> : <>Crea il tuo <em>spazio</em>.</>}</h2>
        </div>

        <div className="card">
          <span className="step-n">{T("Passo I", "Step I")}</span>
          <h3>{T("Scegli il pacchetto", "Choose the pack")}</h3>
          <div className="pkpick">
            {Object.values(PACCHETTI).filter((x) => !x.soloAsta && (cuore ? x.n <= 25 : inVenditaOra(x, venduti))).map((x) => (
              <button type="button" key={x.n} aria-pressed={x.n === pack} onClick={() => setPack(x.n)}>
                <b>{misura(x.n, en)}</b>
                <span className="pr">{eur(prezzoDi(x.n))}</span>
                <small>{nomePack(x.n, en)}{x.sconto ? ` · -${Math.round(x.sconto * 100)}%` : ""}</small>
              </button>
            ))}
          </div>
          {prenota && pack >= 50 && <p className="hint" style={{ marginTop: 12 }}>{T("Pochi spazi di questa misura all'apertura: la prenotazione ti dà la precedenza, non la garanzia. Vince chi conferma prima.", "Few spaces of this size at launch: booking gives you priority, not a guarantee. Whoever confirms first wins.")}</p>}
        </div>

        <div className="card">
          <span className="step-n">{T("Passo II", "Step II")}</span>
          <h3>{T("Firma la tua opera", "Sign your work")}</h3>
          <div className="fields">
            <label className="f">{prenota ? T("Nome del tuo brand (facoltativo)", "Your brand name (optional)") : T("Nome del tuo brand", "Your brand name")}
              <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={T("Es. Bar Centrale", "E.g. Central Café")} maxLength={40} />
            </label>
            <label className="f">{T("Il tuo link (facoltativo)", "Your link (optional)")}
              <input type="text" inputMode="url" autoCapitalize="none" autoComplete="url" name="sito" value={link} onChange={(e) => setLink(e.target.value)} placeholder={T("www.iltuosito.it", "www.yoursite.com")} />
              {link && !linkValido && <span className="hint">{T("Scrivi l'indirizzo del sito, per esempio www.iltuosito.it", "Write the website address, for example www.yoursite.com")}</span>}
            </label>
            <label className="f">{prenota ? T("La tua immagine (facoltativa)", "Your image (optional)") : T("La tua immagine", "Your image")}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={caricaImmagine} />
              <span className="hint">{T(`JPG, PNG o WebP, massimo ${MAX_MB} MB. Se è molto grande la rimpiccioliamo noi. Una sola immagine per tutto il blocco.`, `JPG, PNG or WebP, ${MAX_MB} MB maximum. If it is very large we shrink it for you. One single image for the whole block.`)}</span>
              <span className="hint"><b>{T("Formato consigliato", "Recommended size")}: {p.w * 100} × {p.h * 100} px</b> {T("(o più grande, con la stessa forma). Così l'immagine riempie lo spazio senza bande.", "(or larger, same shape). This way the image fills the space with no bands.")}</span>
              {errore && <span className="hint" style={{ color: "#8a3f2c" }}>{errore}</span>}
            </label>
            <label className="f">{T("Adattamento immagine", "Image fit")}
              <select value={fit} onChange={(e) => setFit(e.target.value)}>
                <option value="cover">{T("Riempi tutto lo spazio", "Fill the whole space")}</option>
                <option value="contain">{T("Mostra l'immagine intera", "Show the whole image")}</option>
              </select>
            </label>
            <label className="f">{prenota ? T("La tua email (ti scriviamo quando apre la vendita)", "Your email (we write to you when sales open)") : T("La tua email (per la ricevuta)", "Your email (for the receipt)")}
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={T("nome@esempio.it", "name@example.com")} />
            </label>
          </div>
        </div>
      </div>

      <div className="sticky">
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div className="pv-wrap">
            <div className={"pv" + (img ? " edit" : "")} style={{ width: PW, height: PH, ...(img && { background: img.bordo }) }} onPointerDown={inizioTrascina} onPointerMove={trascina} onPointerUp={fineTrascina} onPointerCancel={fineTrascina}>
              {img ? <img src={img.src} alt={T("Anteprima del tuo spazio", "Preview of your space")} draggable={false} style={{ position: "absolute", width: dw, height: dh, maxWidth: "none", left: PW / 2 - dw / 2 + o.x, top: PH / 2 - dh / 2 + o.y }} /> : <div className="empty">{T("La tua immagine", "Your image")}</div>}
              <div className="gr" style={{ gridTemplateColumns: `repeat(${p.w},1fr)`, gridTemplateRows: `repeat(${p.h},1fr)` }}>
                {Array.from({ length: p.n }, (_, i) => <div key={i} />)}
              </div>
            </div>
          </div>
          {img && (
            <div className="editor">
              <span className="step-n">{T("Ritaglia", "Crop")}</span>
              <p className="muted">{T("Trascina l'immagine per spostarla e usa lo zoom per ingrandirla.", "Drag the image to move it and use the zoom to enlarge it.")}</p>
              <label className="zoom">
                <span>Zoom</span>
                <input type="range" min="1" max="4" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label={T("Zoom immagine", "Image zoom")} />
              </label>
              <div className="ed-row">
                <button type="button" className="ghost sm" onClick={() => { setZoom(1); setOff({ x: 0, y: 0 }); }}>{T("Centra", "Centre")}</button>
                <button type="button" className="ghost sm" onClick={() => setFit(fit === "cover" ? "contain" : "cover")}>{fit === "cover" ? T("Mostra intera", "Show whole") : T("Riempi lo spazio", "Fill the space")}</button>
              </div>
            </div>
          )}
          <div style={{ padding: 24, display: "grid", gap: 16 }}>
            <span className="step-n">{T("Passo III · Riepilogo", "Step III · Summary")}</span>
            <div className="sum">
              <div><span>{T("Spazio", "Space")}</span><span>{nomePack(pack, en)} · {misura(pack, en)}</span></div>
              <div><span>Brand</span><span>{nome || "—"}</span></div>
              <div><span>{T("Posizione", "Position")}</span><span>{T("a caso, per sempre", "random, forever")}</span></div>
              <div className="tot"><span>{prenota ? T("Prezzo di oggi", "Today's price") : T("Totale", "Total")}</span><span>{eur(totale)} <small>{T("+ IVA", "+ VAT")}</small></span></div>
            </div>
            <label className="check">
              <input type="checkbox" checked={ok} onChange={(e) => setOk(e.target.checked)} />
              {prenota ? <span>{en ? <>I want an email when sales open. I have read the <Link href="/privacy" target="_blank">Privacy policy</Link>.</> : <>Voglio ricevere un'email quando si apre la vendita. Ho letto la <Link href="/privacy" target="_blank">Privacy policy</Link>.</>}</span> : <span>{en ? <>I confirm that the image is mine or that I have the right to use it, and I accept the <Link href="/termini" target="_blank">Terms</Link>. I ask for the space to be published right away and I understand that, once it is published, I lose the right of withdrawal. I have read the <Link href="/privacy" target="_blank">Privacy policy</Link>.</> : <>Confermo che l'immagine è mia o ho il diritto di usarla e accetto i <Link href="/termini" target="_blank">Termini</Link>. Chiedo che lo spazio venga pubblicato subito e so che, una volta pubblicato, perdo il diritto di recesso. Ho letto la <Link href="/privacy" target="_blank">Privacy policy</Link>.</>}</span>}
            </label>
            {prenota ? (
              <button type="button" className="cta" disabled={!pronto || stato === "invio"} onClick={prenotaOra}>{stato === "invio" ? T("Un attimo…", "One moment…") : T("Prenota il tuo spazio", "Book your space")}</button>
            ) : (
            <button type="button" className="cta" disabled={!pronto || stato === "invio"} onClick={paga}>
              {stato === "invio" ? T("Controllo in corso…", "Checking…") : `${T("Paga", "Pay")} ${eur(totale)}`}
            </button>
            )}
            {!pronto && stato !== "invio" && <p className="hint">{T("Per continuare manca: ", "To continue, add: ")}{[
              !prenota && !nome.trim() && T("il nome del brand", "the brand name"),
              !linkValido && T("un link valido", "a valid link"),
              !prenota && !img && T("l'immagine", "the image"),
              !emailValida && T("l'email", "the email"),
              !ok && T("la spunta di conferma", "the confirmation tick"),
            ].filter(Boolean).join(", ")}.</p>}
            {errPaga && <p className="hint" style={{ color: "#8a3f2c" }}>{errPaga}</p>}
            {prenota ? <p className="muted">{T("Ora non paghi nulla. Quando si apre la vendita ti scriviamo e scegli tu se comprare.", "You pay nothing now. When sales open we write to you and you choose whether to buy.")}</p> : <>
            <div className="pay-methods"><span>{T("Carta", "Card")}</span><span>Apple Pay</span><span>Google Pay</span><span>PayPal</span></div>
            <p className="muted">{T("Paghi in modo sicuro con Stripe. I dati della carta non passano mai da PixelHype.", "You pay securely with Stripe. Card details never go through PixelHype.")}</p>
            </>}
          </div>
        </div>
      </div>
    </section>
  );
}
