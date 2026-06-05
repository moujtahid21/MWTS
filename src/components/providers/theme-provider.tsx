"use client";

import { useEffect } from "react";
import { BRAND_PRESETS, useTenantStore } from "@/lib/store/use-tenant-store";

/**
 * Applies the active tenant's UI config to the document root so every CSS
 * variable in `globals.css` resolves correctly. Runs on the client only — the
 * server renders a neutral default and this hydrates the brand/theme/density.
 *
 * In production, swap the store read for the tenant config fetched in the root
 * layout (Supabase) and inject `--brand-*` server-side to avoid a flash.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const brand = useTenantStore((s) => s.brand);
  const dark = useTenantStore((s) => s.dark);
  const density = useTenantStore((s) => s.density);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = dark ? "dark" : "light";
    root.dataset.density = density === "compact" ? "compact" : "comfortable";
    const b = BRAND_PRESETS[brand] ?? BRAND_PRESETS["Grün"]!;
    root.style.setProperty("--brand-h", String(b.h));
    root.style.setProperty("--brand-s", b.s);
    root.style.setProperty("--brand-l", b.l);
  }, [brand, dark, density]);

  return <>{children}</>;
}
