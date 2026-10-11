// Fixed places in the mosaic (100 x 100), shared by the shop (lib/db.js) and the auctions (lib/aste.js).

// The Cuore: 30 x 30 pixel from row/column 35, every space has its place.
// 2 of 100 pixel, 8 of 25, 20 of 10, 25 of 4, 50 of 2, 100 of 1 (900 pixel).
export function mappaCuore() {
  const L = [], add = (n, x, y) => L.push({ pack: n, x: 35 + x, y: 35 + y });
  add(100, 0, 0); add(100, 20, 0);
  for (const y of [0, 5]) for (const x of [10, 15]) add(25, x, y);
  for (const y of [10, 15]) for (const x of [0, 5]) add(25, x, y);
  for (let y = 10; y < 20; y += 2) for (let x = 10; x < 30; x += 5) add(10, x, y);
  for (let y = 20; y < 30; y += 2) for (let x = 0; x < 10; x += 2) add(4, x, y);
  for (let y = 20; y < 30; y++) for (let x = 10; x < 20; x += 2) add(2, x, y);
  for (let y = 20; y < 30; y++) for (let x = 20; x < 30; x++) add(1, x, y);
  return L;
}

// Grand finale outside the Cuore (Sergio, 2026-10-11): 6 auctions, 2 of 25 and 4 of 10 pixel (90 pixel), in places
// scattered over the mosaic and kept free from the start, so nobody buys them before the finale.
// The last 10 pixel outside are sold normally, so the grid still closes.
export const RISERVA_FINALE = [
  { pack: 25, x: 12, y: 14 }, { pack: 25, x: 80, y: 76 },
  { pack: 10, x: 70, y: 10 }, { pack: 10, x: 18, y: 82 }, { pack: 10, x: 86, y: 40 }, { pack: 10, x: 8, y: 52 },
];
export const PIXEL_RISERVA = 90;
