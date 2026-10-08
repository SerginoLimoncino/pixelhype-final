"use client";

import { useState } from "react";
import Link from "next/link";

// On the phone the menu doesn't fit in the header: a button opens it as a list under the header.
export default function MenuTelefono({ asteAperte }) {
  const [aperto, setAperto] = useState(false);
  const chiudi = () => setAperto(false);
  return (
    <>
      <button type="button" className="menu-btn" aria-label={aperto ? "Chiudi il menu" : "Apri il menu"} aria-expanded={aperto} onClick={() => setAperto(!aperto)}>
        <span /><span /><span />
      </button>
      {aperto && (
        <nav className="menu-tel" onClick={chiudi}>
          <Link href="/#galleria">La galleria</Link>
          <Link href="/compra">Prezzi</Link>
          {asteAperte && <Link href="/aste" className="nav-aste">Aste</Link>}
          <Link href="/#aste">Il Cuore</Link>
          <Link href="/#come">Come funziona</Link>
        </nav>
      )}
    </>
  );
}
