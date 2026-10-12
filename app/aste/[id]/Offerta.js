"use client";

import { useEffect, useRef, useState } from "react";
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

  // A bidder who already saved a card here is recognised by the key kept in this browser: one-click raise or withdraw.
  const LS = `pixelhype-asta-${asta}`;
  const [chiave, setChiave] = useState(null);
  const [mia, setMia] = useState(null);
  const [rilancio, setRilancio] = useState("");
  const [conferma, setConferma] = useState(null); // null | "rilancia" | "ritira"
  const [altro, setAltro] = useState(false); // bid with another brand: show the full form
  const [lavoro, setLavoro] = useState(false);
  const leggiLS = () => { try { return localStorage.getItem(LS); } catch { return null; } };
  const scriviLS = (v) => { try { v ? localStorage.setItem(LS, v) : localStorage.removeItem(LS); } catch {} };
  const chiedi = (corpo) => fetch("/api/aste/mia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ asta, chiave, ...corpo }) }).then((x) => x.json());
  useEffect(() => {
    const k = leggiLS();
    if (!k) return;
    setChiave(k);
    fetch("/api/aste/mia", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ asta, chiave: k }) })
      .then((x) => x.json()).then((d) => { if (d.mia) { setMia(d.mia); setRilancio(String(d.mia.min)); } else scriviLS(null); }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  async function confermato() {
    setLavoro(true); setErrore("");
    const d = await chiedi(conferma === "rilancia" ? { azione: "rilancia", importo: Math.floor(Number(rilancio)) } : { azione: "ritira" }).catch(() => ({ errore: T("Qualcosa non ha funzionato. Riprova tra poco.", "Something went wrong. Please try again shortly.") }));
    setLavoro(false); setConferma(null);
    if (d.errore) { setErrore(d.errore); return; }
    if (d.ritirata) { scriviLS(null); setMia(null); window.location.reload(); return; }
    window.location.reload();
  }

  const euro = Math.floor(Number(importo));
  const pronto = euro >= min && nome.trim() && (!link.trim() || normalizzaLink(link)) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && img && ok;

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
      if (d.prova) { if (d.chiave) scriviLS(d.chiave); setStato("fatto"); return; }
      setErrore(d.errore || T("Non è stato possibile registrare l'offerta.", "The bid could not be saved.")); setStato("modulo");
    } catch {
      setErrore(T("Non è stato possibile registrare l'offerta. Riprova tra poco.", "The bid could not be saved. Please try again shortly.")); setStato("modulo");
    }
  }

  if (stato === "fatto") return <div className="card"><p className="ok-big">{T("Offerta registrata.", "Bid saved.")}</p><p className="muted">{T("Prova senza pagamento: nessun addebito.", "Test without payment: nothing charged.")}</p></div>;

  if (mia && mia.aperta && !altro) {
    const r = Math.floor(Number(rilancio));
    return (
      <div className="card" style={{ display: "grid", gap: 14 }}>
        <span className="step-n">{T("Sei in gara", "You are in the race")}</span>
        <p className="muted">{T("Offri come", "Bidding as")} <b>{mia.nome}</b>. {T("La tua offerta", "Your bid")}: <b>{eur(mia.importo, en)}</b>.</p>
        <p className="ok-big" style={{ fontSize: 26 }}>{mia.inTesta ? T("✓ Sei in testa.", "✓ You are in the lead.") : `${T("Qualcuno ha offerto di più", "Someone bid more")}: ${eur(mia.migliore, en)}.`}</p>
        {conferma ? (
          <div className="card" style={{ display: "grid", gap: 12, background: "var(--paper)" }}>
            {conferma === "rilancia" ? (
              <>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  {mia.img && <img src={mia.img} alt="" style={{ width: 64, height: 64, objectFit: "cover", border: "1px solid var(--line)" }} />}
                  <div><b>{mia.nome}</b><br /><span className="muted">{mia.link || T("nessun link", "no link")}</span></div>
                </div>
                <p>{en ? <>Do you confirm a bid of <b>{eur(r, en)} + VAT</b> for this space, with this image and this link? If you win, it is charged to the payment method you saved.</> : <>Confermi di offrire <b>{eur(r, en)} + IVA</b> per questo spazio, con questa immagine e questo link? Se vinci, viene addebitata sul metodo di pagamento che hai salvato.</>}</p>
              </>
            ) : (
              <p>{T("Vuoi davvero ritirarti? Le tue offerte in questa asta vengono annullate e non ti verrà addebitato nulla.", "Do you really want to withdraw? Your bids in this auction are cancelled and nothing will be charged.")}</p>
            )}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" className="cta" disabled={lavoro} onClick={confermato}>{lavoro ? T("Un attimo…", "One moment…") : T("Conferma", "Confirm")}</button>
              <button type="button" className="ghost" disabled={lavoro} onClick={() => setConferma(null)}>{T("Annulla", "Cancel")}</button>
            </div>
          </div>
        ) : (
          <>
            <label className="f">{T("Nuova offerta (€, + IVA)", "New bid (€, + VAT)")}
              <input type="number" inputMode="numeric" min={mia.min} step="1" value={rilancio} onChange={(e) => setRilancio(e.target.value)} />
              <span className="hint">{T("Minimo", "Minimum")} {eur(mia.min, en)}</span>
            </label>
            <button type="button" className="cta" disabled={!(r >= mia.min)} onClick={() => setConferma("rilancia")}>{T("Rilancia a", "Raise to")} {r >= mia.min ? eur(r, en) : ""}</button>
            {mia.inTesta
              ? <p className="hint">{T("Chi è in testa non può ritirarsi.", "The bidder in the lead cannot withdraw.")}</p>
              : <button type="button" className="ghost" onClick={() => setConferma("ritira")}>{T("Ritirati dall'asta", "Withdraw from the auction")}</button>}
          </>
        )}
        {errore && <p className="hint" style={{ color: "#8a3f2c" }}>{errore}</p>}
        <p className="muted">{T("Nessun dato da reinserire: usiamo il metodo di pagamento che hai già salvato.", "Nothing to type again: we use the payment method you already saved.")}{" "}
          <button type="button" className="linklike" onClick={() => setAltro(true)}>{T("Offri con un altro marchio", "Bid with another brand")}</button></p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <Ritaglio img={img} w={w} h={h} fatto={(fn) => (tagliata.current = fn)} />
      <div className="card" style={{ display: "grid", gap: 14 }}>
        <span className="step-n">{T("La tua offerta", "Your bid")}</span>
        <div className="fields">
          <label className="f">{T("Quanto offri (€, + IVA)", "Your bid (€, + VAT)")}
            <input type="number" min={min} step="10" value={importo} onChange={(e) => setImporto(e.target.value)} />
            <span className="hint">{T("Minimo", "Minimum")} {eur(min, en)}</span>
          </label>
          <label className="f">{T("Nome del tuo brand", "Your brand name")}
            <input type="text" value={nome} onChange={(e) => setNome(e.target.value)} placeholder={T("Es. Bar Centrale", "E.g. Central Café")} maxLength={40} />
          </label>
          <label className="f">{T("Il tuo link (facoltativo)", "Your link (optional)")}
            <input type="text" inputMode="url" autoCapitalize="none" autoComplete="url" name="sito" value={link} onChange={(e) => setLink(e.target.value)} placeholder={T("www.iltuosito.it", "www.yoursite.com")} />
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
          {stato === "invio" ? T("Controllo in corso…", "Checking…") : `${T("Offri", "Bid")} ${euro >= min ? eur(euro, en) : ""}`}
        </button>
        {!pronto && stato !== "invio" && <p className="hint">{T("Per continuare manca: ", "To continue, add: ")}{[
          euro < min && T(`un'offerta di almeno ${eur(min, en)}`, `a bid of at least ${eur(min, en)}`),
          !nome.trim() && T("il nome del brand", "the brand name"),
          link.trim() && !normalizzaLink(link) && T("un link valido", "a valid link"),
          !img && T("l'immagine", "the image"),
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && T("l'email", "the email"),
          !ok && T("la spunta di conferma", "the confirmation tick"),
        ].filter(Boolean).join(", ")}.</p>}
        {errore && <p className="hint" style={{ color: "#8a3f2c" }}>{errore}</p>}
        <p className="muted">{T("Salvi carta o PayPal in modo sicuro. Non paghi nulla adesso.", "You save a card or PayPal securely. You pay nothing now.")}</p>
      </div>
    </div>
  );
}
