"use client";
import { useEffect, useState } from "react";

// Live countdown to an auction's end, like on auction sites: days and hours, then minutes and seconds in the last hour.
export default function Timer({ fine }) {
  const [ora, setOra] = useState(null);
  useEffect(() => {
    setOra(Date.now());
    const t = setInterval(() => setOra(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (ora === null) return <span className="timer">…</span>;
  const s = Math.floor((new Date(fine).getTime() - ora) / 1000);
  if (s <= 0) return <span className="timer">Asta finita</span>;
  const g = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const due = (n) => String(n).padStart(2, "0");
  const testo = g > 0 ? `${g}g ${h}h ${due(m)}m` : h > 0 ? `${h}h ${due(m)}m ${due(x)}s` : `${due(m)}:${due(x)}`;
  return <span className={s < 3600 ? "timer ultima" : "timer"}>{testo}</span>;
}
