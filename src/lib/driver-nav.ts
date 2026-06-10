/* ============================================================
   MW Transport Service — Fahrer-Portal Navigation
   ------------------------------------------------------------
   Single source of truth für die Fahrer-Navigation. Analog zu lib/nav.ts
   (Disponenten), aber bewusst schlank — vier Bereiche, mobil-first.

   `short` ist das Label für die Bottom-Nav (enger Platz), `label` das
   volle Label für die Desktop-Sidebar.
   ============================================================ */
import {
  LayoutDashboard,
  Clock,
  CalendarCheck,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";

export type DriverNavItem = {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
};

export const DRIVER_NAV: DriverNavItem[] = [
  { href: "/fahrer/dashboard", label: "Übersicht", short: "Start", icon: LayoutDashboard },
  { href: "/fahrer/time-tracker", label: "Stempeluhr", short: "Zeit", icon: Clock },
  { href: "/fahrer/availability", label: "Verfügbarkeit", short: "Frei", icon: CalendarCheck },
  { href: "/fahrer/orders", label: "Aufträge", short: "Aufträge", icon: ClipboardList },
];

export const DRIVER_PAGE_TITLES: Record<string, string> = {
  "/fahrer/dashboard": "Übersicht",
  "/fahrer/time-tracker": "Stempeluhr",
  "/fahrer/availability": "Verfügbarkeit",
  "/fahrer/orders": "Aufträge",
};

export function driverTitleForPath(pathname: string): string {
  if (DRIVER_PAGE_TITLES[pathname]) return DRIVER_PAGE_TITLES[pathname];
  const match = Object.keys(DRIVER_PAGE_TITLES)
    .filter((p) => pathname.startsWith(p))
    .sort((a, b) => b.length - a.length)[0];
  return match ? DRIVER_PAGE_TITLES[match]! : "Fahrer-Portal";
}
