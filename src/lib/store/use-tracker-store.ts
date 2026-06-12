"use client";

/* ============================================================
   MW Transport Service — Fahrer-Portal: Stempeluhr-Store
   ------------------------------------------------------------
   Zustandsmaschine als Zustand-Store (analog use-ui-store), damit der
   Live-Status über Client-Navigationen zwischen /fahrer/dashboard und
   /fahrer/time-tracker erhalten bleibt.

   Phasen:  idle → working → (break | waiting) → working → … → idle
   Jeder Stempel wird mit Geo-Fix protokolliert (Standgeld-Nachweis).

   Persistenz: schreibt einen Snapshot in localStorage, damit ein Reload
   die laufende Schicht nicht verliert. In Phase 3 ersetzt durch
   supabase.from("time_stamps").insert(...).
   ============================================================ */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { captureGeo } from "@/lib/driver/geo";
import type { StampType, TimeStamp } from "@/lib/driver/types";
import { ME } from "@/lib/driver/mock-data";

export type TrackerPhase = "idle" | "working" | "break" | "waiting";

interface TrackerState {
  phase: TrackerPhase;
  clockInAt: number | null; // ms
  phaseStartAt: number | null; // ms (Start der aktuellen break/wait-Phase)
  accBreak: number; // akkumulierte Pause (s)
  accWait: number; // akkumulierte Wartezeit (s)
  log: TimeStamp[];
  // actions
  start: () => Promise<void>;
  togglePause: () => Promise<void>;
  toggleWait: () => Promise<void>;
  end: () => Promise<void>;
}

const STAMP_TYPE: Record<string, StampType> = {
  in: "in",
  out: "out",
  pause_start: "break_start",
  pause_end: "break_end",
  wait_start: "wait_start",
  wait_end: "wait_end",
};

async function stamp(label: string, type: StampType): Promise<TimeStamp> {
  const fix = await captureGeo();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    driver_id: ME.id,
    type,
    ts: new Date().toISOString(),
    lat: fix.lat,
    lng: fix.lng,
    geo_source: fix.source,
    label,
  };
}

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      phase: "idle",
      clockInAt: null,
      phaseStartAt: null,
      accBreak: 0,
      accWait: 0,
      log: [],

      start: async () => {
        const t0 = Date.now();
        set({ phase: "working", clockInAt: t0, phaseStartAt: t0, accBreak: 0, accWait: 0, log: [] });
        const s = await stamp("Arbeitszeit gestartet", STAMP_TYPE.in);
        set((st) => ({ log: [s, ...st.log] }));
      },

      togglePause: async () => {
        const st = get();
        if (st.phase === "break") {
          set({
            accBreak: st.accBreak + (Date.now() - (st.phaseStartAt ?? Date.now())) / 1000,
            phase: "working",
            phaseStartAt: Date.now(),
          });
          const s = await stamp("Pause beendet", STAMP_TYPE.pause_end);
          set((x) => ({ log: [s, ...x.log] }));
        } else {
          set({ phase: "break", phaseStartAt: Date.now() });
          const s = await stamp("Pause begonnen", STAMP_TYPE.pause_start);
          set((x) => ({ log: [s, ...x.log] }));
        }
      },

      toggleWait: async () => {
        const st = get();
        if (st.phase === "waiting") {
          set({
            accWait: st.accWait + (Date.now() - (st.phaseStartAt ?? Date.now())) / 1000,
            phase: "working",
            phaseStartAt: Date.now(),
          });
          const s = await stamp("Wartezeit beendet", STAMP_TYPE.wait_end);
          set((x) => ({ log: [s, ...x.log] }));
        } else {
          set({ phase: "waiting", phaseStartAt: Date.now() });
          const s = await stamp("Wartezeit gestartet · an Laderampe", STAMP_TYPE.wait_start);
          set((x) => ({ log: [s, ...x.log] }));
        }
      },

      end: async () => {
        const s = await stamp("Schicht beendet", STAMP_TYPE.out);
        set((st) => ({
          phase: "idle",
          clockInAt: null,
          phaseStartAt: null,
          accBreak: 0,
          accWait: 0,
          log: [s, ...st.log],
        }));
      },
    }),
    { name: "mwts-driver-tracker" },
  ),
);

/* ---------- abgeleitete Live-Werte ---------- */
export interface TrackerValues {
  sessionSecs: number;
  ongoingBreak: number;
  ongoingWait: number;
  breakTotal: number;
  waitTotal: number;
  workSecs: number;
}

export function deriveValues(st: TrackerState, now = Date.now()): TrackerValues {
  const sessionSecs = st.clockInAt ? (now - st.clockInAt) / 1000 : 0;
  const ongoingBreak = st.phase === "break" && st.phaseStartAt ? (now - st.phaseStartAt) / 1000 : 0;
  const ongoingWait = st.phase === "waiting" && st.phaseStartAt ? (now - st.phaseStartAt) / 1000 : 0;
  const breakTotal = st.accBreak + ongoingBreak;
  const waitTotal = st.accWait + ongoingWait;
  const workSecs = Math.max(0, sessionSecs - breakTotal - waitTotal);
  return { sessionSecs, ongoingBreak, ongoingWait, breakTotal, waitTotal, workSecs };
}
