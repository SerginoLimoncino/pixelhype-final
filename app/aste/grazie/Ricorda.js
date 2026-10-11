"use client";

import { useEffect } from "react";

// Keeps the bidder's key in this browser, so next time they can raise or withdraw with one click.
export default function Ricorda({ asta, chiave }) {
  useEffect(() => { try { localStorage.setItem(`pixelhype-asta-${asta}`, chiave); } catch {} }, [asta, chiave]);
  return null;
}
