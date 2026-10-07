"use client";

import { useEffect, useRef, useState } from "react";
import { prezzoPixel, eur, num } from "../../lib/prezzi";

// DEMO = true riempie il mosaico con marchi di esempio, per vedere come sarà.
// Al lancio metti false: il mosaico mostrerà solo gli spazi venduti davvero.
const DEMO = true;

const N = 100, CELL = 24, SELL = N * N - 900;
const NAMES = ["Maison Aurelia", "Bar Centrale", "Forno Rossi", "Officina 12", "Nova Fitness", "Atelier Blu", "Pizzeria Vesuvio", "Bottega Verde", "Moto Racing", "Gelateria Polo", "Studio Legale Neri", "Pixel Lab", "Viaggi Mare", "Cantina Alta", "Libreria Nord", "Gioielleria Doro", "Ottica Viso", "Sushi Kai", "Hotel Riva", "Caffè Roma", "Yoga Zen", "Gaming Hub", "Fiori Rosa", "Auto Sprint"];
const PAL = [["#123d30", "#1d5a47"], ["#1f5c5a", "#2f7a72"], ["#4a2233", "#6b3248"], ["#1b2a44", "#2b4066"], ["#8a6a3a", "#b8925a"], ["#1a1915", "#33302a"], ["#5c2a1e", "#8a3f2c"]];
const SHAPES = [[1, 1], [2, 1], [2, 2], [5, 2], [5, 5], [10, 10]], WEIGHTS = [31, 23, 21, 15, 7, 2];
const CAP = { 25: 40, 100: 10 };
const big = (b) => b.w * b.h >= 25;
const NOMI_PACCHETTO = { 1: "Il Pixel", 2: "Il Doppio", 4: "Il Quadro", 10: "La Striscia", 25: "La Vetrina", 100: "Il Capolavoro" };
const SECONDI_SCHERMO = 10; // ogni quanti secondi cambia il marchio sullo schermo
const inHeart = (x, y, w, h) => x + w > 35 && x < 65 && y + h > 35 && y < 65;

// Builds the grid model: who owns each cell, the blocks, and the hidden-logo brightness map.
function buildModel(fill) {
  let seed = 11;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const owner = new Int32Array(N * N).fill(-1), blocks = [];
  let free = SELL, luckyLeft = 3;
  const tgt = new Float32Array(N * N);
  const oc = document.createElement("canvas"); oc.width = N; oc.height = N;
  const o = oc.getContext("2d");
  o.fillStyle = "#000"; o.fillRect(0, 0, N, N); o.fillStyle = "#fff"; o.strokeStyle = "#fff"; o.lineWidth = 3; o.lineJoin = "round";
  o.textAlign = "center"; o.textBaseline = "middle"; o.font = "bold 27px sans-serif";
  ["PIXEL", "HYPE"].forEach((t, k) => { const yy = k ? 81 : 19; o.fillText(t, 50, yy, 92); o.strokeText(t, 50, yy, 92); });
  o.fillRect(8, 33, 84, 2); o.fillRect(8, 65, 84, 2);
  const d = o.getImageData(0, 0, N, N).data;
  for (let i = 0; i < N * N; i++) tgt[i] = d[i * 4] / 255;
  const tgtAvg = (x, y, w, h) => { let t = 0; for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) t += tgt[j * N + i]; return t / (w * h); };
  const pick = () => { const t = rnd() * 99; let a = 0; for (let i = 0; i < WEIGHTS.length; i++) { a += WEIGHTS[i]; if (t < a) return SHAPES[i]; } return SHAPES[0]; };

  function place(s, born) {
    const area = s[0] * s[1];
    if (CAP[area] !== undefined && blocks.filter((b) => b.w * b.h === area).length >= CAP[area]) s = [2, 2];
    const light = s[0] * s[1] <= 4 ? rnd() < 0.42 : rnd() < 0.08, want = light ? 1 : 0;
    let best = null, cands = 0;
    for (let t = 0; t < 900 && cands < 80; t++) {
      const w = s[0], h = s[1], x = Math.floor(rnd() * (N - w + 1)), y = Math.floor(rnd() * (N - h + 1));
      const lucky = inHeart(x, y, w, h);
      if (lucky && (w * h > 2 || luckyLeft <= 0 || rnd() > 0.3)) continue;
      if (w * h >= 25 && blocks.some((b) => big(b) && Math.abs(b.x + b.w / 2 - (x + w / 2)) < 14 && Math.abs(b.y + b.h / 2 - (y + h / 2)) < 14)) continue;
      let ok = true;
      for (let j = y; j < y + h && ok; j++) for (let i = x; i < x + w; i++) if (owner[j * N + i] >= 0) { ok = false; break; }
      if (!ok) continue;
      const fillNow = 1 - free / SELL, mw = Math.max(0, Math.min(1, (fillNow - 0.3) / 0.4));
      const sc = mw * Math.abs(tgtAvg(x, y, w, h) - want) + (1 - mw) * rnd() + rnd() * 0.12;
      cands++;
      if (!best || sc < best.sc) best = { x, y, sc, lucky };
    }
    if (!best) return null;
    if (best.lucky) luckyLeft--;
    const id = blocks.length;
    const b = { id, x: best.x, y: best.y, w: s[0], h: s[1], name: NAMES[id % NAMES.length] + (id >= NAMES.length ? " " + (Math.floor(id / NAMES.length) + 1) : ""), pal: PAL[Math.floor(rnd() * PAL.length)], born, lucky: best.lucky, light, icon: Math.floor(rnd() * 4) };
    blocks.push(b);
    for (let j = b.y; j < b.y + b.h; j++) for (let i = b.x; i < b.x + b.w; i++) owner[j * N + i] = id;
    free -= b.w * b.h;
    return b;
  }
  const goal = Math.round(SELL * (1 - fill));
  let fails = 0;
  while (free > goal) {
    const b = place(free > 3000 ? pick() : [[1, 1], [2, 1], [2, 2], [5, 2]][Math.floor(rnd() * 4)], -1e9);
    if (b) fails = 0; else if (++fails > 300) break;
  }
  return { owner, blocks, tgtAvg, fill, get free() { return free; } };
}

// The real mosaic: spaces sold or given, read from the database.
function modelloReale(spazi, venduti) {
  const owner = new Int32Array(N * N).fill(-1);
  const blocks = spazi.map((r, id) => {
    const b = { id, x: r.x, y: r.y, w: r.w, h: r.h, name: r.nome, link: r.link, img: r.img, pal: PAL[id % PAL.length], born: -1e9, lucky: inHeart(r.x, r.y, r.w, r.h), light: false, icon: id % 4 };
    if (r.img) { b.imgEl = new Image(); b.imgEl.src = r.img; }
    for (let j = b.y; j < b.y + b.h; j++) for (let i = b.x; i < b.x + b.w; i++) owner[j * N + i] = id;
    return b;
  });
  return { owner, blocks, tgtAvg: () => 0.5, fill: venduti / SELL, free: Math.max(0, SELL - venduti) };
}
const esc = (t) => String(t).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
const caricata = (b) => b.imgEl && b.imgEl.complete && b.imgEl.naturalWidth > 0;
const sfondo = (b) => (b.img ? `center / cover no-repeat url("${b.img}")` : `linear-gradient(135deg,${b.light ? "#faf8f4,#e4dccb" : b.pal[1] + "," + b.pal[0]})`);

export default function Mosaico() {
  const stageRef = useRef(null), cvRef = useRef(null), miniRef = useRef(null), tipRef = useRef(null), helpRef = useRef(null);
  const api = useRef({});
  const [feat, setFeat] = useState([]);
  const [tutti, setTutti] = useState([]);
  const [q, setQ] = useState("");
  const [res, setRes] = useState(null);
  const [freeCount, setFreeCount] = useState(SELL);
  const [demo, setDemo] = useState(false);

  useEffect(() => {
    let vivo = true, stop = () => {};
    const avvia = (model) => {
    const { owner, blocks, tgtAvg } = model;
    setFreeCount(model.free);
    setTutti(blocks);
    setFeat(blocks.filter(big).sort((a, b) => b.w * b.h - a.w * a.h).slice(0, 12));
    const stage = stageRef.current, cv = cvRef.current, mini = miniRef.current, tip = tipRef.current;
    const ctx = cv.getContext("2d"), mctx = mini.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const view = { x: 0, y: 0, s: 1, init: false };
    let dpr = 1, W = 0, H = 0, sel = -1, raf = 0;

    const clamp = () => {
      const ws = N * CELL * view.s, m = 60;
      view.x = ws < W ? (ws - W) / 2 : Math.max(-m, Math.min(ws - W + m, view.x));
      view.y = ws < H ? (ws - H) / 2 : Math.max(-m, Math.min(ws - H + m, view.y));
    };
    const resize = () => {
      dpr = window.devicePixelRatio || 1;
      const r = stage.getBoundingClientRect(); W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr; mini.width = mini.clientWidth * dpr; mini.height = mini.clientHeight * dpr;
      if (!view.init) { view.s = Math.min(1.1, Math.max(0.5, W / 1150)); view.x = (N * CELL * view.s - W) / 2; view.y = (N * CELL * view.s - H) / 2; view.init = true; }
      clamp();
    };
    const zoomAt = (f, sx, sy) => {
      const ns = Math.max(0.12, Math.min(3, view.s * f)), wx = (view.x + sx) / view.s, wy = (view.y + sy) / view.s;
      view.s = ns; view.x = wx * ns - sx; view.y = wy * ns - sy; clamp();
    };
    const flyTo = (wx, wy) => {
      const tx = wx * view.s - W / 2, ty = wy * view.s - H / 2;
      if (reduce) { view.x = tx; view.y = ty; clamp(); return; }
      const fx = view.x, fy = view.y, t0 = performance.now();
      const step = (t) => { const k = Math.min(1, (t - t0) / 600), e = 1 - Math.pow(1 - k, 3); view.x = fx + (tx - fx) * e; view.y = fy + (ty - fy) * e; clamp(); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    };
    const hideHelp = () => { if (helpRef.current) helpRef.current.style.opacity = 0; };
    const goldGrad = (c, x, y, w, h) => { const g = c.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, "#8a6a3a"); g.addColorStop(0.35, "#d9bf8c"); g.addColorStop(0.55, "#b8925a"); g.addColorStop(0.75, "#f1e2bd"); g.addColorStop(1, "#9c7a45"); return g; };
    const icon = (c, b, cx, cy, r) => {
      const ink = b.light ? "rgba(18,18,16,.8)" : "rgba(241,226,189,.92)";
      c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = Math.max(1, r * 0.14); c.beginPath();
      if (b.icon === 0) { c.arc(cx, cy, r * 0.55, 0, 6.28); c.stroke(); }
      else if (b.icon === 1) { c.moveTo(cx, cy - r * 0.6); c.lineTo(cx + r * 0.55, cy + r * 0.45); c.lineTo(cx - r * 0.55, cy + r * 0.45); c.closePath(); c.fill(); }
      else if (b.icon === 2) { c.moveTo(cx, cy - r * 0.6); c.lineTo(cx + r * 0.6, cy); c.lineTo(cx, cy + r * 0.6); c.lineTo(cx - r * 0.6, cy); c.closePath(); c.stroke(); }
      else { for (let k = 0; k < 5; k++) { let a = -1.57 + k * 1.2566; c.lineTo(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6); a += 0.628; c.lineTo(cx + Math.cos(a) * r * 0.25, cy + Math.sin(a) * r * 0.25); } c.closePath(); c.fill(); }
    };

    function draw(now) {
      const c = ctx, s = view.s * dpr, cs = CELL * s;
      c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = "#14130f"; c.fillRect(0, 0, cv.width, cv.height);
      c.setTransform(s, 0, 0, s, -view.x * dpr, -view.y * dpr);
      const veil = Math.max(0, Math.min(0.75, (0.75 - view.s) / 0.5)) * Math.max(0, Math.min(1, (model.fill - 0.4) / 0.5));
      c.fillStyle = "#1d1c18"; c.fillRect(0, 0, N * CELL, N * CELL);
      const pulse = reduce ? 0.5 : (Math.sin(now / 1400) + 1) / 2, A = 35 * CELL, S = 30 * CELL;
      c.fillStyle = "#0d0d0b"; c.fillRect(A, A, S, S);
      c.globalAlpha = 0.08 + 0.05 * pulse; c.fillStyle = goldGrad(c, A, A, S, S); c.fillRect(A, A, S, S); c.globalAlpha = 1;
      c.strokeStyle = goldGrad(c, A, A, S, S); c.lineWidth = 3 / view.s; c.strokeRect(A, A, S, S); c.lineWidth = 1 / view.s; c.strokeRect(A + 8, A + 8, S - 16, S - 16);
      if (cs > 5) { c.fillStyle = goldGrad(c, A, A + S * 0.35, S, S * 0.3); c.textAlign = "center"; c.textBaseline = "middle"; c.font = "italic 700 120px " + getComputedStyle(document.body).getPropertyValue("--font-display") + ", Georgia, serif"; c.fillText("Il Cuore", 50 * CELL, 48 * CELL); c.font = "700 20px sans-serif"; c.fillText("A S T E   P R E M I U M", 50 * CELL, 54 * CELL); }
      if (cs > 7) { c.strokeStyle = "rgba(241,226,189,.06)"; c.lineWidth = 1 / view.s; c.beginPath(); for (let i = 0; i <= N; i++) { c.moveTo(i * CELL, 0); c.lineTo(i * CELL, N * CELL); c.moveTo(0, i * CELL); c.lineTo(N * CELL, i * CELL); } c.stroke(); }
      const sweep = reduce ? -1e9 : ((now / 10) % (N * CELL * 2.6)) - N * CELL * 0.4;
      const serif = getComputedStyle(document.body).getPropertyValue("--font-display") + ", Georgia, serif";
      blocks.forEach((b, k) => {
        const x = b.x * CELL, y = b.y * CELL, w = b.w * CELL, h = b.h * CELL, cx = x + w / 2, cy = y + h / 2;
        const g = c.createLinearGradient(x, y, x + w, y + h);
        if (b.light) { g.addColorStop(0, "#faf8f4"); g.addColorStop(1, "#e4dccb"); } else { g.addColorStop(0, b.pal[1]); g.addColorStop(1, b.pal[0]); }
        c.fillStyle = g; c.fillRect(x + 1, y + 1, w - 2, h - 2);
        const conImg = caricata(b);
        if (conImg) c.drawImage(b.imgEl, x + 1, y + 1, w - 2, h - 2);
        if (veil > 0) { const tv = tgtAvg(b.x, b.y, b.w, b.h); c.fillStyle = tv > 0.5 ? `rgba(241,226,189,${veil * tv})` : `rgba(13,13,11,${veil * (1 - tv)})`; c.fillRect(x + 1, y + 1, w - 2, h - 2); }
        const dd = x + y - sweep; if (dd > -140 && dd < 140) { c.fillStyle = `rgba(241,226,189,${0.16 * (1 - Math.abs(dd) / 140)})`; c.fillRect(x + 1, y + 1, w - 2, h - 2); }
        if (!conImg && (cs > 9 || (big(b) && cs > 4))) {
          const r = Math.min(w, h) / 2, tc = b.light ? "rgba(18,18,16,.88)" : "rgba(246,240,226,.95)";
          if (b.w === b.h && b.w >= 5) { icon(c, b, cx, y + h * 0.4, r * 0.55); c.fillStyle = tc; const fz = Math.min(h * 0.13, w / (b.name.length * 0.48 + 1)); c.font = `italic 700 ${fz}px ${serif}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(b.name, cx, y + h * 0.8); }
          else if (b.w >= 2 && b.h >= 2 && cs > 14) { icon(c, b, x + Math.min(w, h) * 0.5, cy, r * 0.6); c.fillStyle = tc; const fs = Math.min(h * 0.3, w / (b.name.length * 0.5 + 2.4), 44); if (fs * s > 7) { c.font = `italic 700 ${fs}px ${serif}`; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText(b.name, x + Math.min(w, h) * 0.95, cy); } }
          else if (b.w >= 2 && cs > 12) { c.fillStyle = tc; c.font = `italic 700 ${h * 0.5}px ${serif}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(b.name.split(" ")[0].slice(0, Math.floor(w / (h * 0.28))), cx, cy); }
          else icon(c, b, cx, cy, r * 0.8);
        }
        if (b.lucky) { c.strokeStyle = "#d9bf8c"; c.lineWidth = 2 / view.s; c.strokeRect(x + 1, y + 1, w - 2, h - 2); }
        if (big(b)) { c.strokeStyle = goldGrad(c, x, y, w, h); c.lineWidth = Math.max(2.5, 2 / view.s); c.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); }
        if (k === sel) { c.strokeStyle = "#f1e2bd"; c.lineWidth = 3 / view.s; c.strokeRect(x, y, w, h); }
      });
      // mini-map
      const m = mctx, kk = mini.width / (N * CELL);
      m.setTransform(1, 0, 0, 1, 0, 0); m.fillStyle = "#1d1c18"; m.fillRect(0, 0, mini.width, mini.height);
      m.fillStyle = "rgba(184,146,90,.45)"; m.fillRect(35 * CELL * kk, 35 * CELL * kk, 30 * CELL * kk, 30 * CELL * kk);
      blocks.forEach((b) => { m.fillStyle = b.light ? "#f0eee9" : b.pal[1]; m.fillRect(b.x * CELL * kk, b.y * CELL * kk, Math.max(1, b.w * CELL * kk), Math.max(1, b.h * CELL * kk)); });
      m.strokeStyle = "#d9bf8c"; m.lineWidth = 1.5 * dpr; m.strokeRect((view.x / view.s) * kk, (view.y / view.s) * kk, (W / view.s) * kk, (H / view.s) * kk);
      raf = requestAnimationFrame(draw);
    }

    // pointer: drag to pan, pinch to zoom, tap for info
    const pts = new Map(); let pinch = null, moved = 0;
    const showTip = (html, sx, sy) => { tip.innerHTML = html; tip.hidden = false; tip.style.left = Math.min(sx + 12, W - 240) + "px"; tip.style.top = Math.min(sy + 12, H - 100) + "px"; };
    const tap = (e) => {
      const r = cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
      const gx = Math.floor((view.x + sx) / view.s / CELL), gy = Math.floor((view.y + sy) / view.s / CELL);
      if (gx < 0 || gy < 0 || gx >= N || gy >= N) { tip.hidden = true; sel = -1; return; }
      const id = owner[gy * N + gx];
      if (id >= 0 && id === sel && blocks[id].link) { window.open(blocks[id].link, "_blank", "noopener"); return; }
      if (id >= 0) { const b = blocks[id]; sel = id; showTip(`<span>${b.w * b.h} pixel${b.lucky ? " · ✦ posto fortunato nel Cuore" : ""}</span><b>${esc(b.name)}</b>Tocca di nuovo per aprire il sito`, sx, sy); }
      else if (inHeart(gx, gy, 1, 1)) { sel = -1; showTip("<span>Il Cuore · Aste Premium</span><b>Riservato all'asta</b>Spazi da 1 a 100 pixel, con base d'asta", sx, sy); }
      else { sel = -1; showTip(`<span>Pixel ${gx + 1}, ${gy + 1}</span><b>Libero · ${eur(prezzoPixel())}</b>Prendilo prima che salga il prezzo`, sx, sy); }
    };
    const down = (e) => { cv.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); moved = 0; hideHelp(); if (pts.size === 2) { const a = [...pts.values()]; pinch = { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y) }; } };
    const move = (e) => {
      if (!pts.has(e.pointerId)) return;
      const p = pts.get(e.pointerId), dx = e.clientX - p.x, dy = e.clientY - p.y; pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 2 && pinch) { const a = [...pts.values()], d = Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), r = cv.getBoundingClientRect(); zoomAt(d / pinch.d, (a[0].x + a[1].x) / 2 - r.left, (a[0].y + a[1].y) / 2 - r.top); pinch.d = d; moved += 10; }
      else if (pts.size === 1) { view.x -= dx; view.y -= dy; clamp(); moved += Math.abs(dx) + Math.abs(dy); }
      tip.hidden = true;
    };
    const up = (e) => { const wasTap = pts.size === 1 && moved < 6; pts.delete(e.pointerId); if (pts.size < 2) pinch = null; if (wasTap) tap(e); };
    const cancel = (e) => { pts.delete(e.pointerId); pinch = null; };
    const wheel = (e) => { if (!e.ctrlKey) return; e.preventDefault(); const r = cv.getBoundingClientRect(); zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - r.left, e.clientY - r.top); hideHelp(); };
    const miniClick = (e) => { const r = mini.getBoundingClientRect(); flyTo(((e.clientX - r.left) / r.width) * N * CELL, ((e.clientY - r.top) / r.height) * N * CELL); };
    cv.addEventListener("pointerdown", down); cv.addEventListener("pointermove", move); cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", cancel);
    cv.addEventListener("wheel", wheel, { passive: false }); mini.addEventListener("click", miniClick);
    window.addEventListener("resize", resize);

    api.current = {
      zoomIn: () => zoomAt(1.3, W / 2, H / 2),
      zoomOut: () => zoomAt(1 / 1.3, W / 2, H / 2),
      reveal: () => { const t0 = performance.now(), s0 = view.s, s1 = (Math.min(W, H) / (N * CELL)) * 0.95; const st = (t) => { const k = Math.min(1, (t - t0) / 900), e = 1 - Math.pow(1 - k, 3); zoomAt((s0 + (s1 - s0) * e) / view.s, W / 2, H / 2); if (k < 1) requestAnimationFrame(st); }; requestAnimationFrame(st); hideHelp(); },
      goTo: (b) => { sel = b.id; if (view.s < 0.6) zoomAt(0.7 / view.s, W / 2, H / 2); flyTo((b.x + b.w / 2) * CELL, (b.y + b.h / 2) * CELL); hideHelp(); },
      search: (t) => blocks.filter((b) => b.name.toLowerCase().includes(t)).sort((a, b) => b.w * b.h - a.w * a.h).slice(0, 8),
    };
    resize(); raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      cv.removeEventListener("pointerdown", down); cv.removeEventListener("pointermove", move); cv.removeEventListener("pointerup", up); cv.removeEventListener("pointercancel", cancel);
      cv.removeEventListener("wheel", wheel); mini.removeEventListener("click", miniClick); window.removeEventListener("resize", resize);
    };
    };
    // Real spaces from the database; if there are none yet, the demo with example brands.
    fetch("/api/spazi").then((r) => r.json()).catch(() => ({})).then(({ spazi = [], venduti = 0 }) => {
      if (!vivo) return;
      const reale = spazi.length > 0 || !DEMO;
      setDemo(!reale);
      stop = avvia(reale ? modelloReale(spazi, venduti) : buildModel(0.25));
    });
    return () => { vivo = false; stop(); };
  }, []);

  const onSearch = (v) => { setQ(v); const t = v.trim().toLowerCase(); setRes(t ? api.current.search(t) : null); };
  const goTo = (b) => { api.current.goTo(b); setRes(null); setQ(b.name); stageRef.current.scrollIntoView({ behavior: "smooth", block: "center" }); };

  return (
    <>
      {feat.length > 0 && (
        <div className="wrap feat">
          <div className="feat-h"><span className="eyebrow">In evidenza</span><span className="feat-n">I marchi dei blocchi più grandi</span></div>
          <div className="feat-row">
            {feat.map((b) => (
              <button type="button" className="fc" key={b.id} onClick={() => goTo(b)}>
                <div className="sw" style={{ background: sfondo(b) }} />
                <b>{b.name}</b>
                <span>{b.w * b.h === 100 ? "Il Capolavoro · 100 pixel" : "La Vetrina · 25 pixel"}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <Schermo blocchi={tutti} onTrova={goTo} />
      <div className="wrap gallery" id="galleria">
        <div className="toolbar">
          <div className="search">
            <input type="search" placeholder="Cerca un marchio" autoComplete="off" aria-label="Cerca un marchio" value={q} onChange={(e) => onSearch(e.target.value)} />
            {res && (
              <div className="results">
                {res.length ? res.map((b) => (
                  <button type="button" key={b.id} onClick={() => goTo(b)}>{b.name}<span>riga {b.y + 1} · col. {b.x + 1} · {b.w * b.h} px</span></button>
                )) : <div className="none">Nessun marchio trovato</div>}
              </div>
            )}
          </div>
          <div className="legend"><span><i style={{ background: "var(--goldgrad)" }} />Il Cuore, all'asta</span><span><i style={{ background: "#1d1c18", border: "1px solid #6f6a5e" }} />Libero</span><span><i style={{ background: "var(--green2)" }} />Già preso</span></div>
        </div>
        <div className="frame"><div className="mat">
          <div className="stage" ref={stageRef}>
            <canvas className="cv" ref={cvRef} aria-label="Il mosaico di 10.000 pixel. Trascina per esplorare, usa più e meno per lo zoom." />
            <div className="ctl">
              <button type="button" aria-label="Avvicina" onClick={() => api.current.zoomIn()}>+</button>
              <button type="button" aria-label="Allontana" onClick={() => api.current.zoomOut()}>−</button>
              <button type="button" aria-label="Guarda l'opera intera" title="Guarda l'opera intera" onClick={() => api.current.reveal()}>✦</button>
            </div>
            <canvas className="mini" ref={miniRef} aria-label="Mini-mappa: tocca per spostarti" />
            <div className="tip" ref={tipRef} hidden />
          </div>
        </div></div>
        <div className="label">
          <div className="cartel"><b>PixelHype, 2026</b>Opera collettiva su web, 10.000 pixel. Ogni spazio è firmato da chi lo possiede. Collezione aperta, {num(freeCount)} pixel ancora disponibili.</div>
          {demo && <div className="demo-note">Anteprima con marchi di esempio</div>}
        </div>
      </div>
    </>
  );
}

// "In onda": every few seconds a random brand from the mosaic, of any size, shown big.
function Schermo({ blocchi, onTrova }) {
  const [b, setB] = useState(null);
  const [giro, setGiro] = useState(0);
  useEffect(() => {
    if (!blocchi.length) return;
    let ultimo = -1;
    const cambia = () => {
      let i = Math.floor(Math.random() * blocchi.length);
      if (i === ultimo && blocchi.length > 1) i = (i + 1) % blocchi.length;
      ultimo = i; setB(blocchi[i]); setGiro((g) => g + 1);
    };
    cambia();
    const t = setInterval(cambia, SECONDI_SCHERMO * 1000);
    return () => clearInterval(t);
  }, [blocchi]);
  if (!b) return null;
  const area = b.w * b.h;
  const lato = 150, sc = lato / Math.max(b.w, b.h);
  return (
    <div className="wrap onair">
      <div className="onair-h"><span className="eyebrow">In onda</span><span className="feat-n">Ogni {SECONDI_SCHERMO} secondi un marchio a caso, dal pixel singolo ai 100 pixel</span></div>
      <div className="screen">
        <div className="screen-in" key={giro}>
          <div className="screen-art" style={{ width: b.w * sc, height: b.h * sc, background: sfondo(b), boxShadow: big(b) ? "0 0 0 3px #d9bf8c" : "0 0 0 1px rgba(217,191,140,.35)" }} />
          <div className="screen-txt">
            <span className="screen-size">{NOMI_PACCHETTO[area] || area + " pixel"} · {area} pixel</span>
            <b>{b.name}</b>
            <span className="screen-pos">riga {b.y + 1} · colonna {b.x + 1}</span>
            <button type="button" className="ghost sm" onClick={() => onTrova(b)}>Trovalo nel mosaico</button>
          </div>
        </div>
        <i className="screen-bar" key={"bar" + giro} style={{ animationDuration: SECONDI_SCHERMO + "s" }} />
      </div>
    </div>
  );
}
