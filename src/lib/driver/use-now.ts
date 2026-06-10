"use client";

/* ============================================================
   MW Transport Service — useNow
   ------------------------------------------------------------
   Erzwingt ein Re-Render im Sekundentakt, solange `active` true ist.
   Genutzt von Stempeluhr (Live-Timer) und der Live-Uhr im Dashboard.
   ============================================================ */
import { useEffect, useState } from "react";

export function useNow(active: boolean, intervalMs = 1000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);
  return now;
}

/* ------------------------------------------------------------
   useHydrated — false beim ersten Render (Server + Client-Hydration),
   true nach dem Mount. Verhindert SSR-Mismatches, wenn ein persistierter
   Client-Store (z. B. die laufende Stempeluhr aus localStorage) vom
   serverseitig gerenderten Default abweicht.
   ------------------------------------------------------------ */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
