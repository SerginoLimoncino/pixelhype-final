"use client";
import { useEffect, useState } from "react";
import { useLingua } from "../../components/Lingua";

// Next to "Highest bid": tells the bidder on this device that the highest bid is theirs.
// The bid form announces the bidder's situation with the "pixelhype-mia" event.
export default function Tua({ asta, migliore }) {
  const [mia, setMia] = useState(null);
  const { T } = useLingua();
  useEffect(() => {
    const senti = (e) => { if (e.detail?.asta === asta) setMia(e.detail); };
    window.addEventListener("pixelhype-mia", senti);
    return () => window.removeEventListener("pixelhype-mia", senti);
  }, [asta]);
  if (!mia?.inTesta || mia.migliore !== migliore) return null;
  return <b className="tua">✓ {T("la tua", "yours")}</b>;
}
