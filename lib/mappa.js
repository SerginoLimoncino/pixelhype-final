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

// Grand finale outside the Cuore (Sergio, 2026-10-10): the last 100 pixel of the grid, kept from the start right
// around the Cuore, the big ones closest. 10 auctions: 2 of 25, 4 of 10, 2 of 4, 2 of 1 (100 pixel).
// Nobody can buy these places before the finale, so when 9,000 pixel are sold the rest of the grid is full.
export const RISERVA_FINALE = [
  { pack: 25, x: 30, y: 47 }, { pack: 25, x: 65, y: 47 },
  { pack: 10, x: 40, y: 33 }, { pack: 10, x: 55, y: 33 }, { pack: 10, x: 40, y: 65 }, { pack: 10, x: 55, y: 65 },
  { pack: 4, x: 33, y: 33 }, { pack: 4, x: 65, y: 65 },
  { pack: 1, x: 65, y: 34 }, { pack: 1, x: 34, y: 65 },
];
