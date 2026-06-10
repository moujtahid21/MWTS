"use client";

/* ============================================================
   MW Transport Service — Fahrer-Übersicht
   src/components/driver/dashboard-view.tsx
   ============================================================ */
import Link from "next/link";
import { useMemo } from "react";
import { Clock, Route, Calendar, ClipboardList, Star, Check, Minus, Truck, Lock, ChevronRight } from "lucide-react";
import { PageHead, Plate, Empty } from "@/components/ui";
import { TimeTrackerSummary } from "./time-tracker-summary";
import {
  DOW_SHORT, DOW_LONG, MONTHS_LONG, pad2, isoOf, addDays, dowMon, mondayOf, isoWeek,
  fmtDate, checkAvailabilityLock,
} from "@/lib/driver/date-utils";
import { useNow, useHydrated } from "@/lib/driver/use-now";
import { ME, seedAvailabilities, seedOrders } from "@/lib/driver/mock-data";
import type { DriverAvailability, DriverOrder } from "@/lib/driver/types";

function LiveClock() {
  const hydrated = useHydrated();
  const t = useNow(true);
  const d = new Date(t);
  const time = `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
  const date = `${DOW_LONG[dowMon(d)]}, ${d.getDate()}. ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
  return (
    <div className="flex h-9 items-center gap-2 rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] px-3">
      <Clock size={14} style={{ color: "var(--fg-3)" }} />
      <span className="t-mut hidden whitespace-nowrap text-[12.5px] md:inline">{date}</span>
      <span className="hidden h-4 w-px bg-[var(--border)] md:inline-block" />
      <span className="t-mono t-strong whitespace-nowrap text-[13px] tabular-nums" suppressHydrationWarning>{hydrated ? `${time} Uhr` : "--:--:-- Uhr"}</span>
    </div>
  );
}

const greeting = (h: number) => (h < 11 ? "Guten Morgen" : h < 18 ? "Guten Tag" : "Guten Abend");

export function DashboardView() {
  const now = useMemo(() => new Date(), []);
  const orders: DriverOrder[] = useMemo(() => seedOrders(now), [now]);
  const avail: Record<string, DriverAvailability> = useMemo(() => seedAvailabilities(now), [now]);

  const todayIso = isoOf(now);
  const active = orders.filter((o) => o.status === "angenommen" || o.status === "unterwegs");
  const todo = orders.filter((o) => o.status === "zugewiesen");
  const next = active[0] ?? todo[0];

  const weekStart = mondayOf(now);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const availCount = weekDays.filter((d) => (avail[isoOf(d)] ?? {}).status === "anwesend").length;

  return (
    <div>
      <PageHead title={`${greeting(now.getHours())}, ${ME.name.split(" ")[0]}`} sub={`${ME.team} · ${ME.type} · ${ME.contract_h}h/Woche`}>
        <LiveClock />
      </PageHead>

      <div className="grid grid-cols-1 items-start gap-[var(--gap)] lg:grid-cols-2">
        <TimeTrackerSummary />

        {/* nächster Auftrag */}
        <div className="card overflow-hidden">
          <div className="card-head">
            <div className="flex-1"><h3>Nächster Auftrag</h3><span className="sub">{todo.length} offen · {active.length} aktiv</span></div>
            <Route size={17} style={{ color: "var(--fg-3)" }} />
          </div>
          {next ? (
            <Link href={`/fahrer/orders?id=${next.id}`} className="card-pad block text-inherit no-underline">
              <div className="mb-[10px] flex items-center justify-between"><Plate value={next.plate} /><span className="badge ok"><span className="dot" /> {next.status}</span></div>
              <div className="flex flex-wrap items-center gap-2 text-[12px]">
                <span className="badge"><Calendar size={11} /> {fmtDate(next.pickup_date)}</span>
                {next.pickup_window && <span className="badge"><Clock size={11} /> {next.pickup_window}</span>}
                <span className="badge"><Route size={11} /> {next.km} km</span>
                <div className="flex-1" />
                <span className="t-strong flex items-center" style={{ color: "var(--color-primary-strong)" }}>Öffnen <ChevronRight size={14} /></span>
              </div>
              <div className="t-mut mt-2 text-[12.5px]">{next.from.city} → {next.to.city}</div>
            </Link>
          ) : (
            <div className="card-pad"><Empty title="Keine offenen Aufträge" icon="check" /></div>
          )}
        </div>
      </div>

      {/* Kennzahlen */}
      <div className="mt-[var(--gap)] grid grid-cols-1 gap-[var(--gap)] sm:grid-cols-3">
        {([
          ["Verfügbar diese Woche", `${availCount} / 7`, Calendar, "/fahrer/availability", "Tage eingetragen"],
          ["Aktive Aufträge", String(active.length + todo.length), ClipboardList, "/fahrer/orders", "zugewiesen"],
          ["Bewertung", `${ME.rating} ★`, Star, null, `${ME.trips} Fahrten`],
        ] as const).map(([l, v, Ic, href, sub]) => {
          const inner = (
            <>
              <div className="flex items-center justify-between"><span className="t-mut text-[12px]">{l}</span><Ic size={15} style={{ color: "var(--fg-faint)" }} /></div>
              <div className="t-strong mt-[6px] text-[26px] font-[780] tracking-[-0.02em]">{v}</div>
              <div className="t-mut text-[12px]">{sub}</div>
            </>
          );
          return href ? (
            <Link key={l} href={href} className="card card-pad text-inherit no-underline">{inner}</Link>
          ) : (
            <div key={l} className="card card-pad">{inner}</div>
          );
        })}
      </div>

      {/* Wochen-Streifen */}
      <div className="card mt-[var(--gap)]">
        <div className="card-head">
          <div className="flex-1"><h3>Diese Woche</h3><span className="sub">KW {isoWeek(now)} · Verfügbarkeit auf einen Blick</span></div>
          <Link href="/fahrer/availability" className="btn btn-sm">Bearbeiten <ChevronRight size={14} /></Link>
        </div>
        <div className="card-pad">
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map((d) => {
              const iso = isoOf(d);
              const a = avail[iso] ?? { status: "abwesend" } as DriverAvailability;
              const lock = checkAvailabilityLock(iso, now);
              const isToday = iso === todayIso;
              return (
                <div key={iso} className="text-center">
                  <div className="t-mut text-[11px] font-semibold">{DOW_SHORT[dowMon(d)]}</div>
                  <div
                    className="mt-[5px] grid h-11 place-items-center rounded-[10px] border"
                    style={{
                      borderColor: isToday ? "var(--color-primary)" : "var(--border)",
                      borderWidth: isToday ? 1.5 : 1,
                      background: a.status === "abwesend" ? "var(--surface-2)" : a.status === "verplant" ? "var(--info-bg)" : "var(--ok-bg)",
                      color: a.status === "verplant" ? "var(--info-fg)" : "var(--ok-fg)",
                      opacity: lock.isLocked && a.status === "abwesend" ? 0.5 : 1,
                    }}
                  >
                    {a.status === "anwesend" ? <Check size={16} strokeWidth={3} /> : a.status === "verplant" ? <Truck size={15} /> : lock.isLocked ? <Lock size={13} style={{ color: "var(--fg-faint)" }} /> : <Minus size={14} style={{ color: "var(--fg-faint)" }} />}
                  </div>
                  <div className="t-mut mt-[3px] font-mono text-[10.5px] tabular-nums">{pad2(d.getDate())}.{pad2(d.getMonth() + 1)}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
