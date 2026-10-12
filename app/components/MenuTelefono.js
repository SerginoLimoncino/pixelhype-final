"use client";

import { useState } from "react";
import Link from "next/link";
import { useLingua, CambiaLingua } from "./Lingua";

// On the phone the menu doesn't fit in the header: a button opens it as a list under the header.
export default function MenuTelefono({ asteAperte }) {
  const [aperto, setAperto] = useState(false);
  const chiudi = () => setAperto(false);
  const { T } = useLingua();
  return (
    <>
      <button type="button" className="menu-btn" aria-label={aperto ? T("Chiudi il menu", "Close the menu") : T("Apri il menu", "Open the menu")} aria-expanded={aperto} onClick={() => setAperto(!aperto)}>
        <span /><span /><span />
      </button>
      {aperto && (
        <nav className="menu-tel" onClick={chiudi}>
          <Link href="/#galleria">{T("La galleria", "The gallery")}</Link>
          <Link href="/compra">{T("Prezzi", "Prices")}</Link>
          {asteAperte && <Link href="/aste" className="nav-aste">{T("Aste", "Auctions")}</Link>}
          <Link href="/#aste">{T("Il Cuore", "The Heart")}</Link>
          <Link href="/#come">{T("Come funziona", "How it works")}</Link>
          <div onClick={(e) => e.stopPropagation()}><CambiaLingua /></div>
        </nav>
      )}
    </>
  );
}
