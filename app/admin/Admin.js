"use client";

import { useEffect, useRef, useState } from "react";
import { PACCHETTI, eur } from "../../lib/prezzi";
import Ritaglio, { leggiImmagine } from "../components/Ritaglio";

const STATI = { online: "Online", da_controllare: "Da controllare", in_attesa: "In attesa di pagamento", nascosto: "Nascosto" };

// Crops any image to fill the block exactly (cover), 100 real px per mosaic pixel.
function ritaglia(file, w, h) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      const c = document.createElement("canvas");
      c.width = w * 100; c.height = h * 100;
      const k = Math.max(c.width / im.width, c.height / im.height);
      c.getContext("2d").drawImage(im, (c.width - im.width * k) / 2, (c.height - im.height * k) / 2, im.width * k, im.height * k);
      URL.revokeObjectURL(url);
      const webp = c.toDataURL("image/webp", 0.9);
      resolve(webp.startsWith("data:image/webp") ? webp : c.toDataURL("image/jpeg", 0.9));
    };
    im.onerror = () => reject("Immagine non leggibile.");
    im.src = url;
  });
}

export default function Admin() {
  const [pw, setPw] = useState("");
  const [entrato, setEntrato] = useState(false);
  const [spazi, setSpazi] = useState([]);
  const [aste, setAste] = useState(null);
  const [msg, setMsg] = useState("");
  const [lavoro, setLavoro] = useState(false);
  const [filtro, setFiltro] = useState("tutti");
  const [r, setR] = useState({ pack: 1, nome: "", link: "", img: null });
  const tagliata = useRef(null); // returns the image cropped as in the preview

  async function chiama(azione, dati = {}, pass = pw) {
    setLavoro(true); setMsg("");
    try {
      const res = await fetch("/api/admin", { method: "POST", headers: { "Content-Type": "application/json", "x-admin": pass }, body: JSON.stringify({ azione, ...dati }) });
      const d = await res.json();
      if (!res.ok) throw new Error(d.errore || "Errore");
      if (d.spazi) setSpazi(d.spazi);
      if (d.aste !== undefined) setAste(d.aste);
      return true;
    } catch (e) {
      setMsg(e.message); return false;
    } finally { setLavoro(false); }
  }

  useEffect(() => {
    let salvata = "";
    try { salvata = sessionStorage.getItem("ph-admin") || ""; } catch {}
    if (salvata) { setPw(salvata); chiama("lista", {}, salvata).then((ok) => setEntrato(ok)); }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function entra(e) {
    e.preventDefault();
    if (await chiama("lista")) { setEntrato(true); try { sessionStorage.setItem("ph-admin", pw); } catch {} }
  }

  async function regala(e) {
    e.preventDefault();
    const p = PACCHETTI[r.pack];
    if (!r.img) return setMsg("Scegli un'immagine.");
    const immagine = tagliata.current();
    if (await chiama("regala", { pack: r.pack, nome: r.nome, link: r.link, immagine })) {
      setMsg(`Fatto: "${r.nome}" è online nel mosaico.`);
      setR({ pack: r.pack, nome: "", link: "", img: null });
      e.target.reset();
    }
  }

  async function cambiaImmagine(s, file) {
    if (!file) return;
    const immagine = await ritaglia(file, s.w, s.h).catch(() => null);
    if (immagine && await chiama("modifica", { id: s.id, immagine })) setMsg(`Immagine di "${s.nome}" cambiata.`);
  }

  if (!entrato) {
    return (
      <section className="wrap" style={{ paddingTop: 64, paddingBottom: 96, maxWidth: 440 }}>
        <form className="card" onSubmit={entra} style={{ display: "grid", gap: 14 }}>
          <div className="eyebrow">Pannello di controllo</div>
          <label className="f">Password
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
          </label>
          <button className="cta" disabled={!pw || lavoro}>{lavoro ? "Un attimo…" : "Entra"}</button>
          {msg && <p className="hint" style={{ color: "#8a3f2c" }}>{msg}</p>}
        </form>
      </section>
    );
  }

  const conta = (st) => spazi.filter((s) => s.stato === st).length;
  const pixel = spazi.filter((s) => s.x !== null).reduce((a, s) => a + s.w * s.h, 0);
  const incasso = spazi.filter((s) => s.x !== null).reduce((a, s) => a + s.prezzo, 0);
  const lista = filtro === "tutti" ? spazi : spazi.filter((s) => s.stato === filtro);

  return (
    <section className="wrap admin" style={{ paddingTop: 40, paddingBottom: 96 }}>
      <div className="sec-h"><div className="eyebrow">Pannello di controllo</div><h2>Il tuo <em>mosaico</em>.</h2></div>

      <div className="adm-stats">
        <div><b>{pixel}</b><span>pixel presi</span></div>
        <div><b>{eur(incasso)}</b><span>incassato (+ IVA)</span></div>
        <div><b>{conta("da_controllare")}</b><span>da controllare</span></div>
        <div><b>{conta("in_attesa")}</b><span>in attesa di pagamento</span></div>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Aste</h3>
        {!aste || (aste.aperte.length === 0 && aste.prossime === 0 && aste.chiuse === 0) ? (
          <p className="muted">Partono da sole dopo i primi 1.000 pixel venduti. Non devi fare niente.</p>
        ) : (
          <>
            <p className="muted">{aste.aperte.length} in corso · {aste.prossime} in arrivo · {aste.chiuse} vinte e pagate. Tutto automatico.</p>
            {aste.aperte.map((a) => (
              <p key={a.id} className="muted">{a.zona === "cuore" ? "Cuore" : "Fuori"} · {a.pack} pixel · {a.migliore ? `offerta più alta ${eur(a.migliore)}` : `base ${eur(a.base)}, nessuna offerta`} · finisce {new Date(a.fine).toLocaleString("it-IT")}</p>
            ))}
          </>
        )}
      </div>

      <form className="card adm-gift" onSubmit={regala}>
        <h3>Regala uno spazio</h3>
        <p className="muted">Conta come venduto a 0 €: prende una posizione a caso e va subito online.</p>
        <div className="adm-row">
          <label className="f">Misura
            <select value={r.pack} onChange={(e) => setR({ ...r, pack: Number(e.target.value) })}>
              {Object.values(PACCHETTI).map((p) => <option key={p.n} value={p.n}>{p.nome} · {p.titolo}</option>)}
            </select>
          </label>
          <label className="f">Nome<input value={r.nome} onChange={(e) => setR({ ...r, nome: e.target.value })} placeholder="Es. Bar Centrale" /></label>
          <label className="f">Link<input value={r.link} onChange={(e) => setR({ ...r, link: e.target.value })} placeholder="www.barcentrale.it" /></label>
          <label className="f">Immagine<input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) leggiImmagine(f).then((img) => setR((v) => ({ ...v, img }))).catch((x) => setMsg(String(x))); }} /></label>
        </div>
        {r.img && <div style={{ maxWidth: 420 }}><Ritaglio img={r.img} w={PACCHETTI[r.pack].w} h={PACCHETTI[r.pack].h} fatto={(f) => (tagliata.current = f)} /></div>}
        <button className="cta" disabled={lavoro || !r.nome || !r.link || !r.img}>{lavoro ? "Un attimo…" : "Regala e metti online"}</button>
      </form>

      {msg && <p className="adm-msg">{msg}</p>}

      <div className="adm-filters">
        {["tutti", "da_controllare", "online", "in_attesa", "nascosto"].map((f) => (
          <button key={f} type="button" className={"ghost sm" + (filtro === f ? " on" : "")} onClick={() => setFiltro(f)}>{f === "tutti" ? "Tutti" : STATI[f]} ({f === "tutti" ? spazi.length : conta(f)})</button>
        ))}
        <button type="button" className="ghost sm" onClick={() => chiama("lista")}>Aggiorna</button>
      </div>

      <div className="adm-list">
        {lista.length === 0 && <p className="muted">Nessuno spazio qui.</p>}
        {lista.map((s) => (
          <div className={"adm-item st-" + s.stato} key={s.id}>
            <div className="adm-img" style={{ aspectRatio: `${s.w} / ${s.h}`, backgroundImage: s.img ? `url("${s.img}")` : "none" }} />
            <div className="adm-info">
              <b>{s.nome}</b>
              <span className="adm-link" title="Per sicurezza il link non si apre con un clic">{s.link}</span>
              <span>{s.w * s.h} pixel · {s.omaggio ? "Omaggio" : eur(s.prezzo)} · {STATI[s.stato] || s.stato}{s.x !== null ? ` · riga ${s.y + 1}, col. ${s.x + 1}` : ""}</span>
              {s.email && <span>{s.email}</span>}
            </div>
            <div className="adm-act">
              {s.stato === "da_controllare" && <button type="button" className="cta sm" onClick={() => chiama("approva", { id: s.id })}>Approva</button>}
              {s.stato === "nascosto" && <button type="button" className="cta sm" onClick={() => chiama("approva", { id: s.id })}>Rimetti online</button>}
              {s.stato === "online" && <button type="button" className="ghost sm" onClick={() => chiama("nascondi", { id: s.id })}>Nascondi</button>}
              {s.stato === "in_attesa" && <button type="button" className="ghost sm" onClick={() => chiama("verifica", { id: s.id })}>Controlla pagamento</button>}
              {s.x !== null && (
                <label className="ghost sm adm-file">Cambia immagine<input type="file" accept="image/*" hidden onChange={(e) => cambiaImmagine(s, e.target.files?.[0])} /></label>
              )}
              <button type="button" className="ghost sm" onClick={() => { const l = prompt("Nuovo link", s.link); if (l) chiama("modifica", { id: s.id, link: l }); }}>Cambia link</button>
              <button type="button" className="ghost sm danger" onClick={() => { if (confirm(`Cancellare "${s.nome}"? Lo spazio torna libero.`)) chiama("cancella", { id: s.id }); }}>Cancella</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
