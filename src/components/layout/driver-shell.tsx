"use client";

/* ============================================================
   MW Transport Service — Fahrer-Portal Shell (Client)
   src/components/layout/driver-shell.tsx
   ------------------------------------------------------------
   Responsive Chrome für das Fahrer-Portal:
     • Desktop (md+):   verschlankte linke Sidebar (Brand · Nav · User · Logout)
     • Mobile (<md):    Topbar mit Hamburger  +  Off-Canvas-Drawer
                        +  fixe Bottom-Navigation (Daumen-Reichweite)

   Navigation ausschließlich über Next <Link> + usePathname (kein lokaler
   `route`-State mehr wie im Prototyp). Styling als Tailwind-Utilities auf
   euren Design-Tokens aus globals.css (var(--sidebar), var(--border) …),
   damit der Look 1:1 zum Disponenten-Cockpit passt.
   ============================================================ */
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Truck, Menu, X, LogOut } from "lucide-react";
import { DRIVER_NAV, driverTitleForPath } from "@/lib/driver-nav";
import { Avatar } from "@/components/ui";
import { AvatarMenu } from "@/components/layout/avatar-menu";
import { signOut } from "@/actions/auth-actions";

export type DriverProfile = {
  name: string;
  email: string;
  roleLabel: string;
};

export function DriverShell({
  driver,
  children,
}: {
  driver: DriverProfile;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex min-h-[100dvh] bg-[var(--bg)] text-[var(--fg)]">
      {/* ============ Desktop sidebar (md+) ============ */}
      <aside className="hidden md:flex w-[230px] shrink-0 flex-col bg-[var(--sidebar)] text-[var(--sidebar-fg)] border-r border-white/5">
        <Link
          href="/fahrer/dashboard"
          className="flex items-center gap-3 px-[18px] pt-[18px] pb-4 no-underline text-inherit"
        >
          <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-strong)] text-white shadow-[0_4px_12px_-4px_var(--color-primary)]">
            <Truck size={19} strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block text-[15px] font-[750] leading-none tracking-[-0.02em] text-white">
              MW Transport
            </span>
            <span className="mt-[3px] block text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[var(--sidebar-fg-dim)]">
              Fahrer-Portal
            </span>
          </span>
        </Link>

        <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Fahrer-Navigation">
          <div className="px-[10px] pb-[6px] pt-4 text-[10px] font-bold uppercase tracking-[0.09em] text-[var(--sidebar-fg-dim)]">
            Navigation
          </div>
          {DRIVER_NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  "relative my-[1px] flex items-center gap-3 rounded-lg px-[10px] py-[9px] text-[13.5px] font-[550] no-underline transition-colors " +
                  (active
                    ? "bg-[var(--sidebar-active)] text-white before:absolute before:-left-3 before:top-[7px] before:bottom-[7px] before:w-[3px] before:rounded-r-[3px] before:bg-[var(--color-primary)] before:content-['']"
                    : "text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-active)] hover:text-[#e8edf3]")
                }
              >
                <Icon size={18} strokeWidth={active ? 2.3 : 2} className="shrink-0" />
                <span className="flex-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/5 p-3">
          <div className="flex items-center gap-[10px] rounded-lg px-2 py-[7px]">
            <Avatar name={driver.name} size={32} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-[650] text-[#e8edf3]">{driver.name}</div>
              <div className="text-[11px] text-[var(--sidebar-fg-dim)]">{driver.roleLabel}</div>
            </div>
            <button
              onClick={() => signOut()}
              title="Abmelden"
              aria-label="Abmelden"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[var(--sidebar-fg-dim)] hover:bg-[var(--sidebar-active)] hover:text-white"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ============ Main column ============ */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile topbar (<md) */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-4 md:hidden">
          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Menü öffnen"
            className="grid h-10 w-10 place-items-center rounded-lg text-[var(--fg-2)] hover:bg-[var(--surface-3)]"
          >
            <Menu size={20} />
          </button>
          <div className="flex flex-1 items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--color-primary)] text-white">
              <Truck size={15} />
            </span>
            <span className="text-[15px] font-[700] tracking-[-0.01em]">
              {driverTitleForPath(pathname)}
            </span>
          </div>
          <AvatarMenu name={driver.name} email={driver.email} size={30} align="right" />
        </header>

        <main className="flex-1 px-4 pb-[calc(72px+env(safe-area-inset-bottom))] pt-4 md:px-8 md:pb-8">
          <div className="mx-auto w-full max-w-[920px]">{children}</div>
        </main>

        {/* Mobile bottom navigation (<md) */}
        <nav
          aria-label="Fahrer-Navigation"
          className="fixed inset-x-0 bottom-0 z-40 flex border-t border-[var(--border)] bg-[var(--surface)] px-1 pb-[env(safe-area-inset-bottom)] md:hidden"
        >
          {DRIVER_NAV.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  "flex min-h-[56px] flex-1 flex-col items-center justify-center gap-[3px] rounded-[10px] py-[7px] no-underline transition-colors " +
                  (active ? "text-[var(--color-primary)]" : "text-[var(--fg-faint)]")
                }
              >
                <Icon size={21} strokeWidth={active ? 2.3 : 2} />
                <span className="text-[10.5px] font-[650]">{item.short}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* ============ Mobile off-canvas drawer ============ */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[90] md:hidden">
          <div
            className="absolute inset-0 bg-black/45"
            onClick={() => setDrawerOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 flex h-full w-[262px] flex-col bg-[var(--sidebar)] text-[var(--sidebar-fg)] shadow-[var(--shadow-lg)]">
            <div className="flex items-center gap-3 px-[18px] pt-[18px] pb-4">
              <span className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-strong)] text-white">
                <Truck size={19} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-[750] leading-none text-white">
                  MW Transport
                </span>
                <span className="mt-[3px] block text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[var(--sidebar-fg-dim)]">
                  Fahrer-Portal
                </span>
              </span>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Menü schließen"
                className="grid h-8 w-8 place-items-center rounded-md text-[var(--sidebar-fg-dim)] hover:bg-[var(--sidebar-active)] hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-2">
              {DRIVER_NAV.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={
                      "relative my-[1px] flex items-center gap-3 rounded-lg px-[10px] py-[11px] text-[14px] font-[550] no-underline " +
                      (active
                        ? "bg-[var(--sidebar-active)] text-white"
                        : "text-[var(--sidebar-fg)] hover:bg-[var(--sidebar-active)]")
                    }
                  >
                    <Icon size={19} strokeWidth={active ? 2.3 : 2} className="shrink-0" />
                    <span className="flex-1">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-white/5 p-3">
              <div className="flex items-center gap-[10px] px-2 py-[7px]">
                <Avatar name={driver.name} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-[650] text-[#e8edf3]">
                    {driver.name}
                  </div>
                  <div className="truncate text-[11px] text-[var(--sidebar-fg-dim)]">
                    {driver.email}
                  </div>
                </div>
                <button
                  onClick={() => signOut()}
                  aria-label="Abmelden"
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-[var(--sidebar-fg-dim)] hover:bg-[var(--sidebar-active)] hover:text-white"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
