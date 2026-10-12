"use client";

import { createContext, useContext } from "react";
import { useRouter } from "next/navigation";

const Ctx = createContext("it");

export function LinguaProvider({ lingua, children }) {
  return <Ctx.Provider value={lingua}>{children}</Ctx.Provider>;
}

// In client components: const { en, T } = useLingua(); T("Compra", "Buy")
export function useLingua() {
  const en = useContext(Ctx) === "en";
  return { en, T: (it, eng) => (en ? eng : it) };
}

// IT / EN switch in the header: saves the choice for a year and reloads the page in the new language.
export function CambiaLingua() {
  const lingua = useContext(Ctx);
  const router = useRouter();
  const scegli = (l) => {
    if (l === lingua) return;
    document.cookie = `lingua=${l}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  };
  return (
    <div className="lingua" role="group" aria-label="Lingua / Language">
      <button type="button" aria-pressed={lingua === "it"} onClick={() => scegli("it")}>IT</button>
      <button type="button" aria-pressed={lingua === "en"} onClick={() => scegli("en")}>EN</button>
    </div>
  );
}
