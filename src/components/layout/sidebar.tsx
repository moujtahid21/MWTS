"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MoreHorizontal, Truck } from "lucide-react";
import { NAV } from "@/lib/nav";
import { useUiStore } from "@/lib/store/use-ui-store";
import { useTenantStore } from "@/lib/store/use-tenant-store";

/**
 * Persistent left rail. Lives in the dashboard layout, so it is mounted once
 * and survives client-side navigations between routes.
 *
 * Active state is derived purely from `usePathname()` — an item is active when
 * the pathname equals its href or is nested beneath it (e.g. `/drivers/pricing`
 * keeps "Fahrer" active). No component state tracks the "current page".
 *
 * `badges` are the per-tenant KPI counters; in production they come from a
 * Server Component up the tree (Supabase) and are passed down. Defaulted here
 * so the rail renders standalone.
 */
export function Sidebar({ badges = {} }: { badges?: Record<string, number> }) {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.collapsed);
  const mobileOpen = useUiStore((s) => s.mobileOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileOpen);
  const label = useTenantStore((s) => s.label);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const profileActive = isActive("/profile");

  return (
    <>
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          aria-hidden
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.4)", zIndex: 70 }}
        />
      )}

      <aside
        className={
          "sidebar" + (collapsed ? " collapsed" : "") + (mobileOpen ? " mobile-open" : "")
        }
      >
        {/* Brand → home */}
        <Link href="/overview" className="brand" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="brand-mark">
            <Truck size={19} strokeWidth={2} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="brand-name">{label.split(" ")[0]} {label.split(" ")[1] ?? ""}</div>
            <div className="brand-sub">Service Dispo</div>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="nav" aria-label="Hauptnavigation">
          {NAV.map((group) => (
            <div key={group.title}>
              <div className="nav-section">{group.title}</div>
              {group.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                const badge = item.badgeKey ? badges[item.badgeKey] : undefined;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={"nav-item" + (active ? " active" : "")}
                    title={item.label}
                    aria-current={active ? "page" : undefined}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={18} strokeWidth={active ? 2.3 : 2} />
                    <span className="nav-label">{item.label}</span>
                    {badge ? (
                      <span className={"nav-badge" + (active ? " alert" : "")}>
                        {badge > 999 ? (badge / 1000).toFixed(1) + "k" : badge}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User block → /profile (the requested clickable Link) */}
        <div className="side-foot">
          <Link
            href="/profile"
            className={"side-user" + (profileActive ? " active" : "")}
            title="Mein Profil"
            aria-current={profileActive ? "page" : undefined}
            style={{
              textDecoration: "none",
              color: "inherit",
              background: profileActive ? "var(--sidebar-active)" : undefined,
            }}
          >
            <div className="avatar" style={{ background: "var(--color-primary)" }}>
              MD
            </div>
            <div className="side-foot-txt" style={{ flex: 1 }}>
              <div className="nm">M. Disponent</div>
              <div className="rl">Admin · MWT</div>
            </div>
            <MoreHorizontal size={16} className="nav-label" style={{ color: "var(--sidebar-fg-dim)" }} />
          </Link>
        </div>
      </aside>
    </>
  );
}
