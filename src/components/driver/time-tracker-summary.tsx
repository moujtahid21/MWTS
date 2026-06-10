"use client";

/* ============================================================
   MW Transport Service — Stempeluhr (Kurzfassung fürs Dashboard)
   src/components/driver/time-tracker-summary.tsx
   ============================================================ */
import Link from "next/link";
import { Play, Square, Clock, ChevronRight } from "lucide-react";
import { useToast } from "@/components/ui";
import { useTrackerStore, deriveValues, type TrackerPhase } from "@/lib/store/use-tracker-store";
import { useNow, useHydrated } from "@/lib/driver/use-now";
import { fmtClock, fmtHM, pad2 } from "@/lib/driver/date-utils";

const PHASE_META: Record<TrackerPhase, { label: string; color: string; bg: string }> = {
  idle: { label: "Nicht eingestempelt", color: "var(--fg-3)", bg: "var(--surface-3)" },
  working: { label: "Im Dienst", color: "var(--ok-fg)", bg: "var(--ok-bg)" },
  break: { label: "Pause", color: "var(--warn-fg)", bg: "var(--warn-bg)" },
  waiting: { label: "Wartezeit (Standgeld)", color: "#c2410c", bg: "#fff1e6" },
};

const hhmm = (ms: number) => {
  const d = new Date(ms);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
};

export function TimeTrackerSummary() {
  const st = useTrackerStore();
  const toast = useToast();
  const hydrated = useHydrated();
  const now = useNow(st.phase !== "idle");
  const v = deriveValues(st, now);
  const meta = PHASE_META[st.phase];
  const running = st.phase !== "idle";

  if (!hydrated) return <div className="card" style={{ minHeight: 168 }} aria-busy="true" />;

  return (
    <div className="card overflow-hidden">
      <div className="card-head border-b border-[var(--border)]" style={{ background: meta.bg }}>
        <span className="h-[10px] w-[10px] rounded-full" style={{ background: meta.color }} />
        <div className="flex-1">
          <h3 style={{ color: meta.color }}>{meta.label}</h3>
          {st.clockInAt && <span className="sub">seit {hhmm(st.clockInAt)} Uhr</span>}
        </div>
        <Clock size={17} style={{ color: meta.color }} />
      </div>
      <div className="card-pad">
        <div className="mb-[14px] flex items-center justify-between">
          <div>
            <div className="t-mut text-[11.5px]">Arbeitszeit heute</div>
            <div
              className="font-mono text-[30px] font-[780] tabular-nums"
              style={{ color: running ? "var(--fg)" : "var(--fg-faint)" }}
            >
              {fmtClock(v.workSecs)}
            </div>
          </div>
          {running && (
            <div className="text-right">
              <div className="t-mut text-[11.5px]">Wartezeit</div>
              <div className="font-mono text-[16px] font-bold tabular-nums" style={{ color: "#c2410c" }}>
                {fmtClock(v.waitTotal)}
              </div>
            </div>
          )}
        </div>

        {st.phase === "idle" ? (
          <button
            onClick={async () => {
              await st.start();
              toast("Eingestempelt · Standort erfasst", "zap");
            }}
            className="flex h-[56px] w-full items-center justify-center gap-2 rounded-[var(--r-xl)] text-[16px] font-[750] text-white transition active:scale-[.985]"
            style={{ background: "var(--color-primary)" }}
          >
            <Play size={19} /> Einstempeln
          </button>
        ) : (
          <div className="flex gap-2">
            <Link href="/fahrer/time-tracker" className="btn flex-1" style={{ minHeight: 44 }}>
              Stempeluhr öffnen <ChevronRight size={15} />
            </Link>
            <button
              onClick={async () => {
                await st.end();
                toast("Ausgestempelt · " + fmtHM(v.workSecs) + " Arbeitszeit", "send");
              }}
              className="btn btn-danger"
              style={{ minHeight: 44 }}
            >
              <Square size={16} /> Beenden
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
