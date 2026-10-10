"use client";

import { useEffect, useRef, useState } from "react";

const PX_FINALE = 100; // pixel reali per ogni pixel del mosaico nell'immagine finale

// Reads an image file and shrinks it to at most 1600px per side.
export function leggiImmagine(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file), im = new Image();
    im.onload = () => {
      URL.revokeObjectURL(url);
      const k = Math.min(1, 1600 / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement("canvas");
      c.width = Math.round(im.naturalWidth * k); c.height = Math.round(im.naturalHeight * k);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      resolve({ src: c.toDataURL("image/png"), w: c.width, h: c.height, el: c });
    };
    im.onerror = () => { URL.revokeObjectURL(url); reject("Non riesco a leggere questa immagine."); };
    im.src = url;
  });
}

// Preview of the block with drag + zoom. `fatto` receives a function that returns the final cropped image.
export default function Ritaglio({ img, w, h, fatto }) {
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });
  const [fit, setFit] = useState("cover");
  const drag = useRef(null);

  const cell = Math.min(64, Math.floor(320 / w));
  const PW = w * cell, PH = h * cell;
  const base = img ? (fit === "cover" ? Math.max(PW / img.w, PH / img.h) : Math.min(PW / img.w, PH / img.h)) : 1;
  const dw = img ? img.w * base * zoom : 0, dh = img ? img.h * base * zoom : 0;
  const lim = (o) => ({
    x: dw > PW ? Math.max(-(dw - PW) / 2, Math.min((dw - PW) / 2, o.x)) : 0,
    y: dh > PH ? Math.max(-(dh - PH) / 2, Math.min((dh - PH) / 2, o.y)) : 0,
  });
  const o = lim(off);

  useEffect(() => { setZoom(1); setOff({ x: 0, y: 0 }); }, [img]);

  useEffect(() => {
    fatto(() => {
      const c = document.createElement("canvas");
      c.width = w * PX_FINALE; c.height = h * PX_FINALE;
      const g = c.getContext("2d"), r = c.width / PW;
      g.fillStyle = "#faf8f4"; g.fillRect(0, 0, c.width, c.height);
      g.drawImage(img.el, (PW / 2 - dw / 2 + o.x) * r, (PH / 2 - dh / 2 + o.y) * r, dw * r, dh * r);
      const webp = c.toDataURL("image/webp", 0.9);
      return webp.startsWith("data:image/webp") ? webp : c.toDataURL("image/jpeg", 0.9);
    });
  }); // eslint-disable-line react-hooks/exhaustive-deps

  function inizio(e) {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, o };
  }
  function muovi(e) {
    if (!drag.current) return;
    const d = drag.current;
    setOff(lim({ x: d.o.x + e.clientX - d.x, y: d.o.y + e.clientY - d.y }));
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div className="pv-wrap">
        <div className={"pv" + (img ? " edit" : "")} style={{ width: PW, height: PH }} onPointerDown={inizio} onPointerMove={muovi} onPointerUp={() => (drag.current = null)} onPointerCancel={() => (drag.current = null)}>
          {img ? <img src={img.src} alt="Anteprima" draggable={false} style={{ position: "absolute", width: dw, height: dh, maxWidth: "none", left: PW / 2 - dw / 2 + o.x, top: PH / 2 - dh / 2 + o.y }} /> : <div className="empty">L'immagine</div>}
          <div className="gr" style={{ gridTemplateColumns: `repeat(${w},1fr)`, gridTemplateRows: `repeat(${h},1fr)` }}>
            {Array.from({ length: w * h }, (_, i) => <div key={i} />)}
          </div>
        </div>
      </div>
      {img && (
        <div className="editor" style={{ borderBottom: 0 }}>
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
    </div>
  );
}
