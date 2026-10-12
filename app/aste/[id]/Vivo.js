"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

// Keeps an open auction page live: every 10 seconds it checks whether someone bid or the end moved,
// and refreshes the page (keeping what the visitor typed) only when something changed. Paused while the tab is hidden.
export default function Vivo({ asta, impronta }) {
  const router = useRouter();
  const ultima = useRef(impronta);
  ultima.current = impronta;
  useEffect(() => {
    const t = setInterval(() => {
      if (document.visibilityState !== "visible") return;
      fetch(`/api/aste/stato?id=${asta}`, { cache: "no-store" })
        .then((x) => x.json())
        .then((s) => { if (s.impronta && s.impronta !== ultima.current) router.refresh(); })
        .catch(() => {});
    }, 10000);
    return () => clearInterval(t);
  }, [asta, router]);
  return null;
}
