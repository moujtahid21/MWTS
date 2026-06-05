"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, PanelLeft, Rows3, Search, Moon, Sun } from "lucide-react";
import { titleForPath } from "@/lib/nav";
import { useUiStore } from "@/lib/store/use-ui-store";
import { useTenantStore } from "@/lib/store/use-tenant-store";

/** Sticky header. Title is derived from the route; controls mutate tenant UI state. */
export function Topbar() {
  const pathname = usePathname();
  const toggleCollapsed = useUiStore((s) => s.toggleCollapsed);
  const toggleMobile = useUiStore((s) => s.toggleMobile);
  const density = useTenantStore((s) => s.density);
  const setDensity = useTenantStore((s) => s.setDensity);
  const dark = useTenantStore((s) => s.dark);
  const toggleDark = useTenantStore((s) => s.toggleDark);

  const onMenu = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 920) toggleMobile();
    else toggleCollapsed();
  };

  return (
    <header className="topbar">
      <button className="icon-btn sq" onClick={onMenu} title="Menü" aria-label="Menü umschalten">
        <PanelLeft size={18} />
      </button>
      <div>
        <h1>{titleForPath(pathname)}</h1>
      </div>
      <div className="spacer" />
      <div className="search" style={{ width: 260, maxWidth: "32vw" }}>
        <Search size={16} />
        <input className="input" placeholder="Suchen…  ⌘K" aria-label="Suchen" />
      </div>
      <div className="seg" title="Datendichte">
        <button
          className={density !== "compact" ? "on" : ""}
          onClick={() => setDensity("comfortable")}
          title="Komfortabel"
          aria-pressed={density !== "compact"}
        >
          <Rows3 size={15} />
        </button>
        <button
          className={density === "compact" ? "on" : ""}
          onClick={() => setDensity("compact")}
          title="Kompakt"
          aria-pressed={density === "compact"}
        >
          <Menu size={15} />
        </button>
      </div>
      <button
        className="icon-btn sq"
        onClick={toggleDark}
        title={dark ? "Hell" : "Dunkel"}
        aria-label="Theme umschalten"
      >
        {dark ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <button className="icon-btn sq" title="Benachrichtigungen" style={{ position: "relative" }}>
        <Bell size={18} />
        <span
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 7,
            height: 7,
            borderRadius: 99,
            background: "var(--danger)",
            border: "1.5px solid var(--surface)",
          }}
        />
      </button>
    </header>
  );
}
