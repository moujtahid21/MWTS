import {
  LayoutDashboard,
  ClipboardList,
  Map,
  Smartphone,
  Building2,
  Users,
  SquareParking,
  Calendar,
  CalendarRange,
  FileText,
  Info,
  Settings,
  type LucideIcon,
} from "lucide-react";

/**
 * Single source of truth for the dispatcher navigation.
 *
 * Each item maps a German UI label to a real App Router segment under
 * `src/app/(dashboard)/<path>`. The active state in the sidebar is derived
 * from the current pathname (see `components/layout/sidebar.tsx`), never from
 * component-local state — so deep links, refresh and the browser back button
 * all behave correctly.
 *
 * `badgeKey` references a counter on the tenant KPI payload; render it only
 * when present and non-zero.
 */
export type NavItem = {
  /** App Router path, e.g. "/orders" */
  href: string;
  /** German label shown in the rail */
  label: string;
  icon: LucideIcon;
  /** Optional KPI counter key to render as a badge */
  badgeKey?: string;
  /** Tooltip / aria description */
  description?: string;
};

export type NavSection = {
  /** Section heading, e.g. "Disposition" */
  title: string;
  items: NavItem[];
};

export const NAV: NavSection[] = [
  {
    title: "Disposition",
    items: [
      { href: "/overview", label: "Übersicht", icon: LayoutDashboard, description: "Dispatcher-Cockpit" },
      { href: "/orders", label: "Aufträge", icon: ClipboardList, badgeKey: "unassigned", description: "Auftragsverwaltung" },
      { href: "/map", label: "Karte", icon: Map, description: "Live-Flottenkarte" },
      { href: "/driver-app", label: "Fahrer-App", icon: Smartphone, description: "Mobile PWA-Vorschau" },
    ],
  },
  {
    title: "Stammdaten",
    items: [
      { href: "/clients", label: "Kunden", icon: Building2, description: "Kundenverwaltung" },
      { href: "/drivers", label: "Fahrer", icon: Users, description: "Fahrerverwaltung" },
      { href: "/parking", label: "Stellplätze", icon: SquareParking, description: "Kapazität & Standorte" },
    ],
  },
  {
    title: "Planung & Belege",
    items: [
      { href: "/calendar", label: "Kalender", icon: Calendar, description: "Verfügbarkeit" },
      { href: "/shiftplanner", label: "Schichtplanung", icon: CalendarRange, description: "Dienst- & Schichtpläne" },
      { href: "/documents", label: "Dokumente", icon: FileText, description: "Belege & Nachweise" },
      { href: "/information", label: "Information", icon: Info, description: "Aushänge & Notizen" },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/settings", label: "Einstellungen", icon: Settings, description: "White-Label & Sicherheit" },
    ],
  },
];

/** Flat list — handy for breadcrumb / title lookups. */
export const NAV_FLAT: NavItem[] = NAV.flatMap((s) => s.items);

/** Page titles keyed by pathname, including routes not shown in the rail. */
export const PAGE_TITLES: Record<string, string> = {
  "/overview": "Übersicht",
  "/orders": "Auftragsverwaltung",
  "/map": "Karte",
  "/driver-app": "Fahrer-App",
  "/clients": "Kundenverwaltung",
  "/drivers": "Fahrerverwaltung",
  "/drivers/pricing": "Preisliste",
  "/parking": "Stellplätze",
  "/calendar": "Kalender",
  "/shiftplanner": "Schichtplanung",
  "/documents": "Dokumente",
  "/information": "Information",
  "/settings": "Einstellungen",
  "/profile": "Mein Profil",
};

export function titleForPath(pathname: string): string {
  if (PAGE_TITLES[pathname]) return PAGE_TITLES[pathname];
  // fall back to the deepest matching prefix (e.g. /drivers/123 -> Fahrerverwaltung)
  const match = Object.keys(PAGE_TITLES)
    .filter((p) => pathname.startsWith(p) && p !== "/")
    .sort((a, b) => b.length - a.length)[0];
  return match ? PAGE_TITLES[match]! : "Übersicht";
}
