"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

/**
 * Bridges the legacy modules' `onNav(key, params)` callback to the App Router.
 *
 * The prototype modules navigate by calling `onNav("orders", { focus: 123 })`.
 * Here we translate the legacy key to a real route and pass any params as the
 * query string; the destination module reads them via `useModuleParams()`.
 */
const KEY_TO_PATH: Record<string, string> = {
  dashboard: "/overview",
  orders: "/orders",
  map: "/map",
  driverapp: "/driver-app",
  customers: "/clients",
  drivers: "/drivers",
  "drivers-pricing": "/drivers/pricing",
  parking: "/parking",
  calendar: "/calendar",
  shifts: "/shiftplanner",
  documents: "/documents",
  info: "/information",
  settings: "/settings",
  profile: "/profile",
};

export type NavParams = Record<string, string | number | boolean | undefined>;

export function useAppNav() {
  const router = useRouter();
  return useCallback(
    (key: string, params?: NavParams) => {
      const path = KEY_TO_PATH[key] || "/overview";
      let qs = "";
      if (params) {
        const sp = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
          if (v !== undefined && v !== false) sp.set(k, String(v));
        }
        const s = sp.toString();
        if (s) qs = "?" + s;
      }
      router.push(path + qs);
    },
    [router],
  );
}

/**
 * Reads the legacy `initial` payload (focus / filter / create / auftraggeber)
 * from the URL query string. Modules that deep-link into a focused row or a
 * pre-applied filter call this instead of receiving an `initial` prop.
 * Must be used inside a <Suspense> boundary (Next.js requirement).
 */
export function useModuleInitial() {
  const sp = useSearchParams();
  const focusRaw = sp.get("focus");
  const focus =
    focusRaw == null ? undefined : /^\d+$/.test(focusRaw) ? Number(focusRaw) : focusRaw;
  return {
    focus,
    filter: sp.get("filter") || undefined,
    auftraggeber: sp.get("auftraggeber") || undefined,
    create: sp.get("create") === "1" || sp.get("create") === "true" || undefined,
  };
}
