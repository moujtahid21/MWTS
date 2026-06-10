"use client";

/* ============================================================
   MW Transport Service — Stempeluhr (volle Karte)
   src/components/driver/time-tracker-card.tsx
   ============================================================ */
import { Play, Square, Pause, Hourglass, Clock, Coffee, MapPin } from "lucide-react";
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

export function TimeTrackerCard() {
  const st = useTrackerStore();
  const toast = useToast();
  const hydrated = useHydrated();
  const now = useNow(st.phase !== "idle");
  const v = deriveValues(st, now);
  const meta = PHASE_META[st.phase];
  const running = st.phase !== "idle";

  // Bis localStorage rehydriert ist, neutralen Platzhalter zeigen (kein SSR-Mismatch).
  if (!hydrated) return <div className="card" style={{ minHeight: 360 }} aria-busy="true" />;

  const wrap =
    (fn: () => Promise<void>, msg: string, icon = "check") =>
    async () => {
      await fn();
      toast(msg, icon);
    };

  return (
    <div className="card overflow-hidden">
      {/* Status-Banner */}
      <div
        className="flex items-center gap-3 border-b border-[var(--border)] px-[18px] py-4"
        style={{ background: meta.bg }}
      >
        <span
          className="h-3 w-3 rounded-full"
          style={{
            background: meta.color,
            boxShadow: running ? `0 0 0 4px color-mix(in srgb, ${meta.color} 22%, transparent)` : "none",
          }}
        />
        <div className="flex-1">
          <div className="text-[14.5px] font-[650]" style={{ color: meta.color }}>{meta.label}</div>
          {st.clockInAt && <div className="t-mut text-[12px]">Eingestempelt um {hhmm(st.clockInAt)} Uhr</div>}
        </div>
        {(st.phase === "break" || st.phase === "waiting") && (
          <div className="font-mono text-[18px] font-bold tabular-nums" style={{ color: meta.color }}>
            {fmtClock(st.phase === "break" ? v.ongoingBreak : v.ongoingWait)}
          </div>
        )}
      </div>

      <div className="card-pad">
        {/* großer Arbeitszeit-Zähler */}
        <div className="py-[10px] pb-[18px] text-center">
          <div className="t-mut text-[12px] font-semibold uppercase tracking-[0.04em]">Arbeitszeit heute</div>
          <div
            className="mt-1 font-mono text-[52px] font-[780] leading-[1.05] tabular-nums tracking-[-0.02em]"
            style={{ color: running ? "var(--fg)" : "var(--fg-faint)" }}
          >
            {fmtClock(v.workSecs)}
          </div>
        </div>

        {/* Steuerung */}
        {st.phase === "idle" ? (
          <button
            onClick={wrap(st.start, "Eingestempelt · Standort erfasst", "zap")}
            className="flex h-24 w-full items-center justify-center gap-3 rounded-[var(--r-xl)] text-[21px] font-[750] text-white shadow-[var(--shadow)] transition active:scale-[.985]"
            style={{ background: "var(--color-primary)" }}
          >
            <Play size={26} /> Arbeitszeit starten
          </button>
        ) : (
          <>
            <button
              onClick={wrap(st.end, "Ausgestempelt · " + fmtHM(v.workSecs) + " Arbeitszeit", "send")}
              className="flex h-24 w-full items-center justify-center gap-3 rounded-[var(--r-xl)] text-[21px] font-[750] text-white shadow-[var(--shadow)] transition active:scale-[.985]"
              style={{ background: "var(--danger)" }}
            >
              <Square size={22} /> Schicht beenden
            </button>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                onClick={wrap(st.togglePause, st.phase === "break" ? "Pause beendet" : "Pause läuft", "coffee")}
                className="flex h-[60px] items-center justify-center gap-2 rounded-[var(--r-xl)] text-[16px] font-[750] text-white transition active:scale-[.985]"
                style={{ background: st.phase === "break" ? "var(--warn-fg)" : "var(--warn)" }}
              >
                {st.phase === "break" ? <Play size={19} /> : <Pause size={19} />}
                {st.phase === "break" ? "Pause beenden" : "Pause einlegen"}
              </button>
              <button
                onClick={wrap(st.toggleWait, st.phase === "waiting" ? "Wartezeit beendet" : "Wartezeit läuft (separat erfasst)", "hourglass")}
                className="flex h-[60px] items-center justify-center gap-2 rounded-[var(--r-xl)] text-[16px] font-[750] text-white transition active:scale-[.985]"
                style={{ background: st.phase === "waiting" ? "#c2410c" : "#ea580c" }}
              >
                {st.phase === "waiting" ? <Play size={19} /> : <Hourglass size={19} />}
                {st.phase === "waiting" ? "Wartezeit beenden" : "Wartezeit starten"}
              </button>
            </div>
          </>
        )}

        {/* Summen */}
        {running && (
          <div className="mt-4 grid grid-cols-3 gap-[10px]">
            {([
              ["Pause gesamt", fmtClock(v.breakTotal), Coffee, "var(--warn-fg)"],
              ["Wartezeit", fmtClock(v.waitTotal), Hourglass, "#c2410c"],
              ["Session", fmtClock(v.sessionSecs), Clock, "var(--fg-2)"],
            ] as const).map(([l, val, Ic, c]) => (
              <div key={l} className="rounded-[var(--r-lg)] bg-[var(--surface-2)] p-[10px_12px]">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--fg-3)]">
                  <Ic size={13} style={{ color: c }} /> {l}
                </div>
                <div className="mt-1 font-mono text-[16px] font-bold tabular-nums" style={{ color: c }}>{val}</div>
              </div>
            ))}
          </div>
        )}

        {/* Stempel-Protokoll mit Geo */}
        {st.log.length > 0 && (
          <div className="mt-[18px]">
            <div className="section-label">
              Stempel-Protokoll
              <span className="t-mut font-normal normal-case tracking-normal">· mit Standort (Standgeld-Nachweis)</span>
            </div>
            <div className="mt-2 flex flex-col gap-[7px]">
              {st.log.slice(0, 6).map((e) => (
                <div key={e.id} className="flex items-center gap-2 text-[12.5px]">
                  <span
                    className="inline-block h-2 w-2 shrink-0 rounded-full"
                    style={{
                      background:
                        e.type === "in" || e.type === "break_end" || e.type === "wait_end"
                          ? "var(--ok)"
                          : e.type === "out"
                          ? "var(--danger)"
                          : e.type === "break_start"
                          ? "var(--warn)"
                          : "#ea580c",
                    }}
                  />
                  <span className="t-mono t-mut shrink-0 basis-11">{hhmm(new Date(e.ts).getTime())}</span>
                  <span className="t-strong flex-1 font-semibold">{e.label}</span>
                  {e.lat != null && (
                    <span className="badge" title={e.geo_source === "gps" ? "GPS" : "Demo-Standort"}>
                      <MapPin size={10} /> {e.lat}, {e.lng}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export { PHASE_META };
