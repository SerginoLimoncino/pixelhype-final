// Listino ufficiale PixelHype (prezzi + IVA).
// Il prezzo a pixel sale ogni 1.000 pixel venduti. Tutti i prezzi finiscono in 9.

export const FASI = [49, 89, 129, 169, 209, 249, 289, 329, 369];
export const PIXEL_GRIGLIA = 9100; // 10.000 meno i 900 pixel del Cuore (aste)

// Per ora nessun database: quando ci sarà, questo numero arriverà dal database.
export const PIXEL_VENDUTI = 0;

export const PACCHETTI = {
  1: { n: 1, w: 1, h: 1, nome: "Il Pixel", titolo: "1 pixel", sconto: 0, spazi: 3000, descr: "Per creator e negozi" },
  2: { n: 2, w: 2, h: 1, nome: "Il Doppio", titolo: "2 pixel", sconto: 0, spazi: 500, descr: "Più visibilità" },
  4: { n: 4, w: 2, h: 2, nome: "Il Quadro", titolo: "4 pixel", sconto: 0, spazi: 400, descr: "Il blocco del brand" },
  10: { n: 10, w: 5, h: 2, nome: "La Striscia", titolo: "10 pixel", sconto: 0.05, spazi: 150, descr: "Blocco premium" },
  25: { n: 25, w: 5, h: 5, nome: "La Vetrina", titolo: "25 pixel", sconto: 0.1, spazi: 40, descr: "Grande vetrina, cornice d'oro" },
  100: { n: 100, w: 10, h: 10, nome: "Il Capolavoro", titolo: "100 pixel", sconto: 0.25, spazi: 10, descr: "Il più grande, cornice d'oro" },
};

export const LOTTI_CUORE = [
  { spazi: 100, misura: "1 pixel", base: 490 },
  { spazi: 50, misura: "2 pixel", base: 890 },
  { spazi: 25, misura: "4 pixel", base: 1690 },
  { spazi: 20, misura: "10 pixel", base: 3990 },
  { spazi: 8, misura: "25 pixel", base: 4990 },
  { spazi: 2, misura: "100 pixel", base: 9990 },
];

export function fase(venduti = PIXEL_VENDUTI) {
  return Math.min(FASI.length - 1, Math.floor(venduti / 1000));
}

export function prezzoPixel(venduti = PIXEL_VENDUTI) {
  return FASI[fase(venduti)];
}

export function restanoInFase(venduti = PIXEL_VENDUTI) {
  const f = fase(venduti);
  const fine = f < FASI.length - 1 ? (f + 1) * 1000 : PIXEL_GRIGLIA;
  return Math.max(0, fine - venduti);
}

// Arrotonda al numero più vicino che finisce in 9 (sopra i 10.000: in 90).
export function charm(v) {
  v = Math.round(v);
  return v < 10000 ? Math.round((v + 1) / 10) * 10 - 1 : Math.round((v + 10) / 100) * 100 - 10;
}

export function prezzoPacchetto(n, venduti = PIXEL_VENDUTI) {
  const p = PACCHETTI[n];
  if (!p) return 0;
  const base = prezzoPixel(venduti);
  return p.n === 1 ? base : charm(p.n * base * (1 - p.sconto));
}

// Numero con il punto delle migliaia (1.099, 27.690), uguale su server e browser.
export function num(v) {
  return String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function eur(v) {
  return num(v) + " €";
}
