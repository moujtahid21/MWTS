"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Lightweight global state for the active tenant's UI configuration.
 *
 * Per AGENT_GUIDE Rule 2 (Dynamic Multi-Tenancy & White-Labeling) the brand
 * colour is never hardcoded — it is injected into the DOM at runtime as
 * `--color-primary` (via `--brand-h/s/l`). In production these values arrive
 * from the `tenants` table (Supabase) and are hydrated here; the named presets
 * below are only a fallback / design-time palette.
 */
export type BrandPreset = {
  name: string;
  h: number;
  s: string;
  l: string;
};

export const BRAND_PRESETS: Record<string, BrandPreset> = {
  "Grün": { name: "Grün", h: 142, s: "71%", l: "38%" },
  "Blau": { name: "Blau", h: 217, s: "91%", l: "53%" },
  "Türkis": { name: "Türkis", h: 173, s: "80%", l: "36%" },
  "Indigo": { name: "Indigo", h: 245, s: "75%", l: "59%" },
  "Orange": { name: "Orange", h: 25, s: "95%", l: "53%" },
  "Rot": { name: "Rot", h: 350, s: "75%", l: "47%" },
  "Violett": { name: "Violett", h: 271, s: "70%", l: "55%" },
  "Slate": { name: "Slate", h: 200, s: "18%", l: "30%" },
};

export type Density = "comfortable" | "compact";

export type TenantState = {
  /** White-label company label, e.g. "MW Transport Service" */
  label: string;
  /** Active brand preset key */
  brand: string;
  dark: boolean;
  density: Density;
  setBrand: (brand: string) => void;
  setDark: (dark: boolean) => void;
  toggleDark: () => void;
  setDensity: (density: Density) => void;
  setLabel: (label: string) => void;
};

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      label: "MW Transport Service",
      brand: "Grün",
      dark: false,
      density: "comfortable",
      setBrand: (brand) => set({ brand }),
      setDark: (dark) => set({ dark }),
      toggleDark: () => set((s) => ({ dark: !s.dark })),
      setDensity: (density) => set({ density }),
      setLabel: (label) => set({ label }),
    }),
    { name: "mwt-tenant-ui" },
  ),
);
