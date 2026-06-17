"use client";

/* ============================================================
   MW Transport Service — Fahrer-Portal Vorschau (für Disponenten)
   src/components/driver/driver-portal-preview.tsx
   ------------------------------------------------------------
   Zeigt die ECHTEN Fahrer-Komponenten in einem Phone-Frame, damit
   Disposition/Verwaltung sieht, was Fahrer in der App tun. Kein iframe
   (die Middleware sperrt /fahrer für Staff) — die Views werden direkt
   gerendert, im Mock-Modus (keine Server-Writes als Disponent).

   Navigation über einen eigenen Switcher + simulierte Bottom-Nav, statt
   der echten Next-<Link>-Navigation (die hier ins Disponenten-Routing
   führen würde).
   ============================================================ */
import { useMemo, useState } from "react";
import { LayoutDashboard, Clock, CalendarCheck, ClipboardList, Truck, ExternalLink } from "lucide-react";
import { PageHead, ToastProvider } from "@/components/ui";
import { PhoneFrame } from "@/components/layout/phone-frame";
import { DashboardView } from "@/components/driver/dashboard-view";
import { TimeTrackerCard } from "@/components/driver/time-tracker-card";
import { AvailabilityView } from "@/components/driver/availability-view";
import { OrdersView } from "@/components/driver/orders-view";
import { seedAvailabilities, seedOrders } from "@/lib/driver/mock-data";

type Screen = "dashboard" | "time" | "availability" | "orders";

const SCREENS: { id: Screen; label: string; icon: typeof Clock }[] = [
  { id: "dashboard", label: "Übersicht", icon: LayoutDashboard },
  { id: "time", label: "Stempeluhr", icon: Clock },
  { id: "availability", label: "Verfügbarkeit", icon: CalendarCheck },
  { id: "orders", label: "Aufträge", icon: ClipboardList },
];

export function DriverPortalPreview() {
  const [screen, setScreen] = useState<Screen>("dashboard");
  const now = useMemo(() => new Date(), []);
  const avail = useMemo(() => seedAvailabilities(now), [now]);
  const orders = useMemo(() => seedOrders(now), [now]);

  return (
    <div>
      <PageHead
        title="Fahrer-Portal · Vorschau"
        sub="So sehen Fahrer die Web-App auf ihrem Smartphone. Schreibgeschützte Demo-Daten."
      >
        <a href="/fahrer/dashboard" target="_blank" rel="noreferrer" className="btn">
          <ExternalLink size={15} /> In eigenem Tab öffnen
        </a>
      </PageHead>

      <div className="flex flex-col items-start gap-6 lg:flex-row">
        {/* Phone */}
        <PhoneFrame>
          {/* eigener Toast-Kontext, damit die Demo-Interaktionen Feedback geben */}
          <ToastProvider>
            <div className="flex min-h-full flex-col">
              {/* simulierte Topbar */}
              <div className="sticky top-0 z-10 flex h-12 items-center gap-2 border-b border-[var(--border)] bg-[var(--surface)] px-4">
                <span className="grid h-7 w-7 place-items-center rounded-md bg-[var(--color-primary)] text-white">
                  <Truck size={15} />
                </span>
                <span className="text-[14px] font-[700]">
                  {SCREENS.find((s) => s.id === screen)?.label}
                </span>
              </div>

              <div className="flex-1 px-4 pb-4 pt-4">
                {screen === "dashboard" && (
                  <DashboardView
                    driverName="Amin Dahmouni"
                    driverSub="Vorschau · Demo-Daten"
                    orders={orders}
                    availabilities={avail}
                  />
                )}
                {screen === "time" && (
                  <div>
                    <PageHead title="Stempeluhr" sub="Arbeitszeit, Pausen & Wartezeit" />
                    <TimeTrackerCard />
                  </div>
                )}
                {screen === "availability" && <AvailabilityView initialAvail={avail} isMock />}
                {screen === "orders" && <OrdersView initialOrders={orders} />}
              </div>

              {/* simulierte Bottom-Nav */}
              <div className="sticky bottom-0 flex border-t border-[var(--border)] bg-[var(--surface)] px-1">
                {SCREENS.map((s) => {
                  const Icon = s.icon;
                  const active = screen === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setScreen(s.id)}
                      className={
                        "flex min-h-[54px] flex-1 flex-col items-center justify-center gap-[3px] py-[7px] " +
                        (active ? "text-[var(--color-primary)]" : "text-[var(--fg-faint)]")
                      }
                    >
                      <Icon size={20} strokeWidth={active ? 2.3 : 2} />
                      <span className="text-[10px] font-[650]">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </ToastProvider>
        </PhoneFrame>

        {/* Begleittext */}
        <div className="card card-pad max-w-[420px]">
          <h3 className="text-[15px] font-[700]">Was Fahrer hier tun</h3>
          <ul className="mt-3 flex flex-col gap-3 text-[13px] text-[var(--fg-2)]">
            <li className="flex gap-2"><LayoutDashboard size={16} className="mt-[2px] shrink-0 text-[var(--fg-faint)]" /><span><b>Übersicht</b> — Live-Status, nächster Auftrag, Wochen-Verfügbarkeit.</span></li>
            <li className="flex gap-2"><Clock size={16} className="mt-[2px] shrink-0 text-[var(--fg-faint)]" /><span><b>Stempeluhr</b> — Ein-/Ausstempeln, Pause & Wartezeit (Standgeld) mit Standortnachweis.</span></li>
            <li className="flex gap-2"><CalendarCheck size={16} className="mt-[2px] shrink-0 text-[var(--fg-faint)]" /><span><b>Verfügbarkeit</b> — Wochen-/Monatskalender, Klick = Zeitfenster, Halten = ganztägig. Verplante Tage sind schreibgeschützt.</span></li>
            <li className="flex gap-2"><ClipboardList size={16} className="mt-[2px] shrink-0 text-[var(--fg-faint)]" /><span><b>Aufträge</b> — annehmen/ablehnen, Status weiterschalten, Belege fotografieren (Tankbeleg, CMR …).</span></li>
          </ul>
          <p className="mt-4 text-[12px] text-[var(--fg-3)]">
            Diese Vorschau nutzt Demo-Daten und schreibt nichts in die Datenbank. Fahrer
            melden sich unter derselben URL an und werden automatisch ins Portal geleitet.
          </p>
        </div>
      </div>
    </div>
  );
}
