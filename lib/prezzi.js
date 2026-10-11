import { PIXEL_RISERVA } from "./mappa";

// Listino ufficiale PixelHype (prezzi + IVA).
// Il prezzo a pixel sale ogni 1.000 pixel venduti. Tutti i prezzi finiscono in 9.

export const FASI = [19, 29, 49, 79, 129, 189, 249, 309, 369];
export const PIXEL_GRIGLIA = 9100; // 10.000 meno i 900 pixel del Cuore (aste)

// Per ora nessun database: quando ci sarà, questo numero arriverà dal database.
export const PIXEL_VENDUTI = 0;

// No limit per size: people buy what they want while there is room. Only the 100-pixel blocks stop at `max`.
export const PACCHETTI = {
  1: { n: 1, w: 1, h: 1, nome: "Il Pixel", titolo: "1 pixel", sconto: 0, descr: "Per creator e negozi" },
  2: { n: 2, w: 2, h: 1, nome: "Il Doppio", titolo: "2 pixel", sconto: 0, descr: "Più visibilità" },
  4: { n: 4, w: 2, h: 2, nome: "Il Quadro", titolo: "4 pixel", sconto: 0, descr: "Il blocco del brand" },
  10: { n: 10, w: 5, h: 2, nome: "La Striscia", titolo: "10 pixel", sconto: 0.05, descr: "Blocco premium" },
  25: { n: 25, w: 5, h: 5, nome: "La Vetrina", titolo: "25 pixel", sconto: 0.1, descr: "Grande vetrina, cornice d'oro" },
  50: { n: 50, w: 10, h: 5, nome: "Il Murale", titolo: "50 pixel", sconto: 0.15, descr: "Grande parete, cornice d'oro" },
  100: { n: 100, w: 10, h: 10, nome: "Il Capolavoro", titolo: "100 pixel", sconto: 0.25, max: 15, descr: "Il più grande, cornice d'oro" },
  // Only at auction, the very last one (lib/mappa.js ULTIMO_PEZZO): never on sale directly.
  150: { n: 150, w: 15, h: 10, nome: "L'Ultimo Pezzo", titolo: "150 pixel", sconto: 0.25, soloAsta: true, descr: "L'ultima asta del mosaico" },
};

// Aste (Sergio, 2026-10-11): da subito 4 aste fuori dal Cuore; quelle del Cuore partono a 1.000 pixel venduti.
export const SOGLIA_ASTE = 0;
export const CUORE_ASTE = 1000;

// The big sizes come out a few at a time so they are not all sold cheap at the start (Sergio, 2026-10-11):
// how many can be bought directly up to each phase (unsold ones carry over). None in the first 1,000;
// 50 pixel: 2 per phase up to 3,000, then no limit; 100 pixel: 2 per phase up to 4,000, then 1 (direct max 11 of 15).
// 1, 2, 4, 10 and 25 pixel have no limit.
export const LIMITI_FASE = { 50: [0, 2, 4], 100: [0, 2, 4, 6, 7, 8, 9, 10, 11] };
export const limitePack = (p, venduti) => LIMITI_FASE[p.n]?.[Math.min(8, Math.floor(venduti / 1000))] ?? p.max;
export const inVenditaOra = (p, venduti) => limitePack(p, venduti) !== 0;

// Spaces in the Cuore. The base of each auction is the normal price of that size when it opens (see lib/aste.js).
export const LOTTI_CUORE = [
  { spazi: 100, misura: "1 pixel" },
  { spazi: 50, misura: "2 pixel" },
  { spazi: 25, misura: "4 pixel" },
  { spazi: 20, misura: "10 pixel" },
  { spazi: 4, misura: "25 pixel" },
  { spazi: 2, misura: "50 pixel" },
  { spazi: 2, misura: "100 pixel" },
];

export function fase(venduti = PIXEL_VENDUTI) {
  return Math.min(FASI.length - 1, Math.floor(venduti / 1000));
}

// Quiet weekly price drop (Sergio, 2026-10-10): if nothing sells for a whole week the price per pixel goes down
// about 5%, rounded to end in 9 (at least 10 €), every week until sales restart; at most 25% below the phase price. `calo` = how many weekly drops in the current phase (lib/db.js, caloPrezzo).
// The site never calls it a discount and never shows the old price.
export const RIBASSO_SETTIMANA = 0.05, RIBASSO_MAX = 0.25;
const su9 = (v) => Math.ceil((v + 1) / 10) * 10 - 1;
const pavimento = (venduti) => su9(FASI[fase(venduti)] * (1 - RIBASSO_MAX));

export function prezzoPixel(venduti = PIXEL_VENDUTI, calo = 0) {
  let p = FASI[fase(venduti)];
  for (let i = 0; i < calo; i++) p = Math.max(pavimento(venduti), Math.min(p - 10, charm(p * (1 - RIBASSO_SETTIMANA))));
  return p;
}
export const puoScendere = (venduti, calo) => prezzoPixel(venduti, calo) > pavimento(venduti);

export function restanoInFase(venduti = PIXEL_VENDUTI) {
  const f = fase(venduti);
  const fine = f < FASI.length - 1 ? (f + 1) * 1000 : PIXEL_GRIGLIA - PIXEL_RISERVA;
  return Math.max(0, fine - venduti);
}

// Arrotonda al numero più vicino che finisce in 9 (sopra i 10.000: in 90).
export function charm(v) {
  v = Math.round(v);
  return v < 10000 ? Math.round((v + 1) / 10) * 10 - 1 : Math.round((v + 10) / 100) * 100 - 10;
}

// Grand finale (9,000 sold): the last 1 and 2-pixel spaces of the Cuore are sold at a fixed price, 50% above normal.
export const prezzoCuore = (n, venduti, calo = 0) => charm(prezzoPacchetto(n, venduti, calo) * 1.5);
// Grand finale when only the last 10 normal pixel are left (10,000 - Cuore - reserved places - 10 = 8,850).
export const FINALE = PIXEL_GRIGLIA - PIXEL_RISERVA - 10;
// The sizes people can buy directly (L'Ultimo Pezzo is auction only).
export const IN_VENDITA = Object.values(PACCHETTI).filter((p) => !p.soloAsta);
// Cuore spaces at a fixed price (normal +50%): the small ones (1, 2, 4 pixel) from 5,000 sold, so the Cuore
// fills up little by little (Sergio, 2026-10-11); the others from the grand finale.
export const CUORE_PICCOLI = 5000;
export const cuoreFissoDa = (n) => (n <= 4 ? CUORE_PICCOLI : FINALE);

export function prezzoPacchetto(n, venduti = PIXEL_VENDUTI, calo = 0) {
  const p = PACCHETTI[n];
  if (!p) return 0;
  const base = prezzoPixel(venduti, calo);
  return p.n === 1 ? base : charm(p.n * base * (1 - p.sconto));
}

// Numero con il punto delle migliaia (1.099, 27.690), uguale su server e browser.
export function num(v) {
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function eur(v) {
  return num(v) + " €";
}

// Date and time, Rome time (e.g. "14 ottobre, 22:10" / "14 October, 22:10").
export function quando(d, en = false) {
  return new Date(d).toLocaleString(en ? "en-GB" : "it-IT", { timeZone: "Europe/Rome", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}

// English names of the packs (the Italian ones are in PACCHETTI).
const EN = {
  1: ["The Pixel", "For creators and shops"],
  2: ["The Double", "More visibility"],
  4: ["The Square", "The brand block"],
  10: ["The Strip", "Premium block"],
  25: ["The Showcase", "Big showcase, gold frame"],
  50: ["The Mural", "Big wall, gold frame"],
  100: ["The Masterpiece", "The biggest, gold frame"],
  150: ["The Last Piece", "The mosaic's last auction"],
};
export const nomePack = (n, en = false) => (en ? EN[n]?.[0] : PACCHETTI[n]?.nome) || "";
// "4 pixel" / "4 pixels"
export const misura = (n, en = false) => `${num(n)} pixel${en && n !== 1 ? "s" : ""}`;
export const descrPack = (n, en = false) => (en ? EN[n]?.[1] : PACCHETTI[n]?.descr) || "";
