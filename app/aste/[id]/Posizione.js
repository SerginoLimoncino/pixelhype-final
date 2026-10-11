// Small map of the whole mosaic with the exact place where the space of this auction will go, in gold.
// Taken pixels are drawn as one path of row runs, so the map stays light even with thousands of spaces.
export default function Posizione({ x, y, w, h, presi = [], en = false }) {
  const occ = new Uint8Array(100 * 100);
  presi.forEach((b) => { for (let j = b.y; j < b.y + b.h; j++) for (let i = b.x; i < b.x + b.w; i++) occ[j * 100 + i] = 1; });
  let d = "";
  for (let j = 0; j < 100; j++) for (let i = 0; i < 100; i++) {
    if (!occ[j * 100 + i]) continue;
    let k = i; while (k < 100 && occ[j * 100 + k]) k++;
    d += `M${i} ${j}h${k - i}v1h${i - k}z`; i = k;
  }
  return (
    <figure className="posizione">
      <svg viewBox="-1 -1 102 102" role="img" aria-label={en ? `Your space will go at row ${y + 1}, column ${x + 1}` : `Il tuo spazio andrà alla riga ${y + 1}, colonna ${x + 1}`}>
        <rect x="-1" y="-1" width="102" height="102" fill="#14130f" />
        <path d={d} fill="#3a372f" />
        <rect x="35" y="35" width="30" height="30" fill="none" stroke="#c9a45c" strokeWidth=".6" />
        <rect className="qui" x={x} y={y} width={w} height={h} fill="#e6c37a" />
        <circle className="alone" cx={x + w / 2} cy={y + h / 2} r={Math.max(w, h) / 2 + 3} fill="none" stroke="#e6c37a" strokeWidth=".7" />
      </svg>
      <figcaption>{en ? `In gold, the exact spot of your space: row ${y + 1}, column ${x + 1}. It stays yours forever.` : `In oro il posto esatto del tuo spazio: riga ${y + 1}, colonna ${x + 1}. Resta tuo per sempre.`}</figcaption>
    </figure>
  );
}
