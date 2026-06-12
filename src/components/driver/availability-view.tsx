"use client";

/* ============================================================
   MW Transport Service — Verfügbarkeits-Kalender
   src/components/driver/availability-view.tsx
   ------------------------------------------------------------
   Vertikal & fokussiert (nur eigene Daten). Kurzer Klick → Zeitfenster-
   Modal, Long-Press (>600ms) → „Ganztägig verfügbar". Sperrlogik aus
   date-utils. State als Map (date → DriverAvailability), bleibt beim
   Blättern erhalten. Phase 3: upsert nach driver_availabilities.
   ============================================================ */
import { useMemo, useState, useTransition } from "react";
import { Check, Minus, Truck, Lock, ChevronLeft, ChevronRight, List, Grid3x3, Calendar, AlertTriangle } from "lucide-react";
import { Modal, Field, Switch, PageHead, useToast } from "@/components/ui";
import {
  DOW_SHORT, DOW_LONG, MONTHS_LONG, pad2, isoOf, parseIso, addDays, dowMon, mondayOf,
  isoWeek, fmtDate, fmtShort, checkAvailabilityLock, LOCK_REASON_DE,
} from "@/lib/driver/date-utils";
import { useLongPress } from "@/lib/driver/use-long-press";
import { SHIFT_TPL, ME } from "@/lib/driver/mock-data";
import { saveAvailability } from "@/lib/driver/availability-data";
import type { DriverAvailability, AvailabilityStatus } from "@/lib/driver/types";

type ViewMode = "woche" | "monat";

const AV_META: Record<AvailabilityStatus, { label: string; cls: string; bg: string; fg: string }> = {
  anwesend: { label: "Anwesend", cls: "ok", bg: "var(--ok-bg)", fg: "var(--ok-fg)" },
  abwesend: { label: "Abwesend", cls: "", bg: "var(--surface-3)", fg: "var(--fg-faint)" },
  verplant: { label: "Verplant", cls: "info", bg: "var(--info-bg)", fg: "var(--info-fg)" },
};

function avTimeText(a: DriverAvailability): string {
  if (!a || a.status === "abwesend") return "Nicht verfügbar";
  if (a.is_full_day) return "Ganztägig verfügbar";
  return `${a.start_time} – ${a.end_time} Uhr`;
}

function emptyAvail(date: string): DriverAvailability {
  return { driver_id: ME.id, date, status: "abwesend", start_time: null, end_time: null, is_full_day: false, shift_code: null, order_ref: null };
}

/* ---------- Tageszeile (Wochenansicht) ---------- */
function DayRow({
  date, a, now, onOpen, onFullDay, toast,
}: {
  date: Date; a: DriverAvailability; now: Date;
  onOpen: (iso: string) => void; onFullDay: (iso: string) => void; toast: (m: string, i?: string) => void;
}) {
  const iso = isoOf(date);
  const lock = checkAvailabilityLock(iso, now);
  const meta = AV_META[a.status];
  const isToday = isoOf(now) === iso;
  const readonly = a.status === "verplant";
  const locked = lock.isLocked;
  const editable = !locked && !readonly;

  const { pressing, handlers } = useLongPress(
    () => { if (editable) onFullDay(iso); },
    () => {
      if (readonly) { toast("Dieser Tag wurde vom Disponenten verplant", "lock"); return; }
      if (locked) { toast(LOCK_REASON_DE[lock.reason!], "lock"); return; }
      onOpen(iso);
    },
    600,
  );

  return (
    <div
      {...handlers}
      role="button"
      tabIndex={0}
      title={locked ? LOCK_REASON_DE[lock.reason!] : readonly ? "Vom Disponenten verplant" : "Klicken: Zeitfenster · Halten: ganztägig"}
      className={
        "relative flex min-h-[44px] w-full items-center gap-[14px] overflow-hidden rounded-[var(--r-lg)] border bg-[var(--surface)] p-[14px_16px] text-left shadow-[var(--shadow-sm)] transition " +
        (editable ? "cursor-pointer hover:border-[var(--color-primary)] hover:shadow-[var(--shadow)] active:scale-[.992] " : "") +
        (locked ? "cursor-not-allowed opacity-[.62] " : "")
      }
      style={{
        borderColor: isToday ? "var(--color-primary)" : "var(--border)",
        boxShadow: isToday ? "0 0 0 1px var(--color-primary)" : undefined,
        background: locked ? "color-mix(in srgb, var(--warn) 5%, var(--surface))" : undefined,
      }}
    >
      {/* Long-press Fortschritt */}
      <span
        className="pointer-events-none absolute inset-0 origin-left bg-[var(--color-primary-soft)]"
        style={{ transform: pressing ? "scaleX(1)" : "scaleX(0)", transition: pressing ? "transform .6s linear" : "none" }}
      />
      <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-[12px]" style={{ background: meta.bg, color: meta.fg }}>
        {locked ? <Lock size={20} /> : a.status === "anwesend" ? <Check size={20} strokeWidth={2.4} /> : a.status === "verplant" ? <Truck size={18} /> : <Minus size={18} />}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="t-strong text-[14.5px]">{DOW_LONG[dowMon(date)]}</span>
          {isToday && <span className="badge brand h-[19px]">heute</span>}
        </div>
        <div className="t-mut mt-[1px] text-[12.5px]">{fmtDate(iso)}</div>
      </div>
      <div className="relative flex flex-col items-end gap-[5px] text-right">
        {locked ? (
          <span className="badge warn"><Lock size={11} /> gesperrt</span>
        ) : (
          <span className={"badge " + meta.cls}><span className="dot" /> {meta.label}</span>
        )}
        <span className="t-mono text-[12px]" style={{ color: locked || a.status === "abwesend" ? "var(--fg-faint)" : "var(--fg-2)" }}>
          {locked ? LOCK_REASON_DE[lock.reason!].split(" — ")[0] : avTimeText(a)}
        </span>
      </div>
    </div>
  );
}

/* ---------- Zeitfenster-Modal ---------- */
function TimePickerModal({
  iso, a, onClose, onSave, onClear,
}: {
  iso: string; a: DriverAvailability;
  onClose: () => void; onSave: (iso: string, data: Partial<DriverAvailability>) => void; onClear: (iso: string) => void;
}) {
  const init = a.status === "anwesend" ? a : null;
  const [fullDay, setFullDay] = useState(init?.is_full_day ?? false);
  const [start, setStart] = useState(init && !init.is_full_day ? init.start_time! : "07:00");
  const [end, setEnd] = useState(init && !init.is_full_day ? init.end_time! : "16:30");
  const d = parseIso(iso);

  const save = () =>
    onSave(iso, fullDay
      ? { status: "anwesend", start_time: "00:00", end_time: "24:00", is_full_day: true }
      : { status: "anwesend", start_time: start, end_time: end, is_full_day: false });

  return (
    <Modal
      title="Verfügbarkeit eintragen"
      sub={`${DOW_LONG[dowMon(d)]} · ${fmtDate(iso)}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-danger" onClick={() => onClear(iso)}><Minus size={15} /> Als abwesend</button>
          <div className="flex-1" />
          <button className="btn" onClick={onClose}>Abbrechen</button>
          <button className="btn btn-primary" onClick={save}><Check size={16} /> Speichern</button>
        </>
      }
    >
      <div className="mb-[var(--gap)]">
        <div className="section-label mt-0">Schnellwahl</div>
        <div className="flex flex-wrap gap-2">
          {Object.values(SHIFT_TPL).map((t) => {
            const active = !fullDay && start === t.start && end === t.end;
            return (
              <button
                key={t.code}
                onClick={() => { setFullDay(false); setStart(t.start); setEnd(t.end); }}
                className="filter-pill"
                style={active ? { borderColor: "var(--color-primary)", color: "var(--color-primary-strong)", background: "var(--color-primary-soft)" } : undefined}
              >
                <span className="h-[9px] w-[9px] rounded-[3px]" style={{ background: t.color }} />
                {t.name}
                <span className="t-mono t-mut text-[11px]">{t.start}–{t.end}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card mb-[var(--gap)] bg-[var(--surface-2)] p-[14px] shadow-none">
        <div className="flex items-center justify-between">
          <div>
            <div className="t-strong text-[13.5px]">Ganztägig verfügbar</div>
            <div className="t-mut text-[12px]">00:00 – 24:00 Uhr · Tipp: Kachel gedrückt halten</div>
          </div>
          <Switch on={fullDay} onChange={setFullDay} />
        </div>
      </div>

      {!fullDay && (
        <div className="grid2">
          <Field label="Verfügbar ab"><input className="input" type="time" value={start} onChange={(e) => setStart(e.target.value)} /></Field>
          <Field label="Verfügbar bis"><input className="input" type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
        </div>
      )}
    </Modal>
  );
}

/* ---------- Monatsgitter ---------- */
function MonthGrid({
  cursor, avail, now, onOpen, toast,
}: {
  cursor: Date; avail: Record<string, DriverAvailability>; now: Date;
  onOpen: (iso: string) => void; toast: (m: string, i?: string) => void;
}) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const pad = dowMon(first);
  const daysInMonth = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < pad; i++) cells.push(null);
  for (let dd = 1; dd <= daysInMonth; dd++) cells.push(new Date(cursor.getFullYear(), cursor.getMonth(), dd));
  while (cells.length % 7) cells.push(null);
  const todayIso = isoOf(now);

  return (
    <div className="card card-pad">
      <div className="mb-[7px] grid grid-cols-7 gap-[7px]">
        {DOW_SHORT.map((d) => (
          <div key={d} className="text-center text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--fg-3)]">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-[7px]">
        {cells.map((date, i) => {
          if (!date) return <div key={i} className="min-h-[78px] rounded-[var(--r)] border border-dashed border-[var(--border)]" />;
          const iso = isoOf(date);
          const a = avail[iso] ?? emptyAvail(iso);
          const lock = checkAvailabilityLock(iso, now);
          const meta = AV_META[a.status];
          const readonly = a.status === "verplant";
          const isToday = iso === todayIso;
          const click = () => {
            if (readonly) { toast("Vom Disponenten verplant", "lock"); return; }
            if (lock.isLocked) { toast(LOCK_REASON_DE[lock.reason!], "lock"); return; }
            onOpen(iso);
          };
          return (
            <button
              key={i}
              onClick={click}
              className={"min-h-[78px] rounded-[var(--r)] border bg-[var(--surface)] p-[7px_8px] text-left transition " + (lock.isLocked ? "cursor-not-allowed opacity-[.55]" : "hover:border-[var(--color-primary)] hover:shadow-[var(--shadow-sm)]")}
              style={{ borderColor: isToday ? "var(--color-primary)" : "var(--border)", boxShadow: isToday ? "0 0 0 1px var(--color-primary)" : undefined }}
            >
              <div className="flex items-center justify-between">
                <span className="t-mono t-strong text-[12.5px]">{pad2(date.getDate())}</span>
                {lock.isLocked ? <Lock size={11} style={{ color: "var(--warn-fg)" }} /> : readonly ? <Truck size={11} style={{ color: "var(--info-fg)" }} /> : null}
              </div>
              {a.status !== "abwesend" && !lock.isLocked && (
                <div className="mt-[6px] flex items-center gap-1 rounded-[6px] px-[5px] py-[3px] text-[10.5px] font-[650]" style={{ background: meta.bg, color: meta.fg }}>
                  <span className="h-[6px] w-[6px] rounded-full bg-current" />
                  {a.is_full_day ? "ganztägig" : a.start_time}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Hauptansicht ---------- */
export function AvailabilityView({
  initialAvail,
  isMock = false,
}: {
  initialAvail: Record<string, DriverAvailability>;
  isMock?: boolean;
}) {
  const now = useMemo(() => new Date(), []);
  const toast = useToast();
  const [avail, setAvail] = useState<Record<string, DriverAvailability>>(initialAvail);
  const [viewMode, setViewMode] = useState<ViewMode>("woche");
  const [weekOffset, setWeekOffset] = useState(0);
  const [monthCursor, setMonthCursor] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [picker, setPicker] = useState<string | null>(null);
  const [, startSave] = useTransition();

  const weekStart = addDays(mondayOf(now), weekOffset * 7);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const getA = (iso: string) => avail[iso] ?? emptyAvail(iso);

  const setAvailFor = (iso: string, data: Partial<DriverAvailability>) =>
    setAvail((m) => ({ ...m, [iso]: { ...emptyAvail(iso), ...m[iso], ...data, date: iso } }));

  /**
   * Optimistisches Update + Persistenz. Im Mock-Modus (Tabelle fehlt) bleibt
   * es rein lokal. Sonst: Server Action; bei Fehler Rollback auf den Vorzustand.
   */
  const persist = (
    iso: string,
    next: Partial<DriverAvailability>,
    okMsg: string,
  ) => {
    const prev = avail[iso];
    setAvailFor(iso, next);
    if (isMock) {
      toast(okMsg, "check");
      return;
    }
    startSave(async () => {
      try {
        await saveAvailability({
          date: iso,
          status: next.status as AvailabilityStatus,
          start_time: next.start_time ?? null,
          end_time: next.end_time ?? null,
          is_full_day: next.is_full_day ?? false,
        });
        toast(okMsg, "check");
      } catch {
        // Rollback
        setAvail((m) => {
          const copy = { ...m };
          if (prev) copy[iso] = prev;
          else delete copy[iso];
          return copy;
        });
        toast("Speichern fehlgeschlagen — erneut versuchen", "alert");
      }
    });
  };

  const setFullDay = (iso: string) =>
    persist(iso, { status: "anwesend", start_time: "00:00", end_time: "24:00", is_full_day: true }, "Ganztägig verfügbar eingetragen");
  const saveTimes = (iso: string, data: Partial<DriverAvailability>) => {
    persist(iso, data, "Verfügbarkeit gespeichert");
    setPicker(null);
  };
  const clear = (iso: string) => {
    persist(iso, { status: "abwesend", start_time: null, end_time: null, is_full_day: false }, "Als abwesend markiert");
    setPicker(null);
  };

  const availCount = weekDays.filter((d) => getA(isoOf(d)).status === "anwesend").length;
  const editableCount = weekDays.filter((d) => !checkAvailabilityLock(isoOf(d), now).isLocked && getA(isoOf(d)).status !== "verplant").length;

  return (
    <div>
      <PageHead title="Meine Verfügbarkeit" sub="Trage ein, wann du fahren kannst — die Disposition plant danach">
        <div className="seg">
          <button className={viewMode === "woche" ? "on" : ""} onClick={() => setViewMode("woche")}><List size={14} /> Woche</button>
          <button className={viewMode === "monat" ? "on" : ""} onClick={() => setViewMode("monat")}><Grid3x3 size={14} /> Monat</button>
        </div>
      </PageHead>

      {/* Legende */}
      <div className="mb-[var(--gap)] flex flex-wrap items-center gap-2">
        <span className="badge ok"><span className="dot" /> Anwesend</span>
        <span className="badge"><span className="dot" /> Abwesend</span>
        <span className="badge info"><span className="dot" /> Verplant (Disponent)</span>
        <span className="badge warn"><Lock size={11} /> Gesperrt</span>
        <div className="flex-1" />
        <span className="badge outline hidden md:inline-flex"><AlertTriangle size={12} /> Planungsschluss: Do 23:59 für die Folgewoche</span>
      </div>

      {viewMode === "woche" ? (
        <>
          <div className="mb-[var(--gap)] flex items-center gap-2">
            <button className="btn" onClick={() => setWeekOffset((w) => w - 1)}><ChevronLeft size={15} /> Vorwoche</button>
            <div className="flex-1 text-center">
              <div className="t-strong text-[14px]">KW {isoWeek(weekStart)}</div>
              <div className="t-mut text-[12px]">{fmtShort(weekDays[0])} – {fmtShort(weekDays[6])} {weekDays[6].getFullYear()}</div>
            </div>
            <button className="btn" onClick={() => setWeekOffset((w) => w + 1)}>Nächste <ChevronRight size={15} /></button>
          </div>
          {weekOffset !== 0 && (
            <div className="mb-[10px]">
              <button className="btn btn-sm btn-ghost" onClick={() => setWeekOffset(0)}><Calendar size={13} /> Zur aktuellen Woche</button>
            </div>
          )}

          <div className="flex flex-col gap-[9px]">
            {weekDays.map((d) => (
              <DayRow key={isoOf(d)} date={d} a={getA(isoOf(d))} now={now} onOpen={setPicker} onFullDay={setFullDay} toast={toast} />
            ))}
          </div>

          <div className="card card-pad mt-[var(--gap)] flex flex-wrap gap-6">
            <div>
              <div className="t-mut text-[12px]">Verfügbar diese Woche</div>
              <div className="t-strong text-[20px] font-[750]">{availCount} <span className="text-[13px] text-[var(--fg-3)]">/ 7 Tage</span></div>
            </div>
            <div>
              <div className="t-mut text-[12px]">Noch planbar</div>
              <div className="t-strong text-[20px] font-[750]">{editableCount} <span className="text-[13px] text-[var(--fg-3)]">Tage</span></div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="mb-[var(--gap)] flex items-center gap-2">
            <button className="btn" onClick={() => setMonthCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}><ChevronLeft size={15} /></button>
            <div className="t-strong flex-1 text-center">{MONTHS_LONG[monthCursor.getMonth()]} {monthCursor.getFullYear()}</div>
            <button className="btn" onClick={() => setMonthCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}><ChevronRight size={15} /></button>
          </div>
          <MonthGrid cursor={monthCursor} avail={avail} now={now} onOpen={setPicker} toast={toast} />
        </>
      )}

      {picker && (
        <TimePickerModal iso={picker} a={getA(picker)} onClose={() => setPicker(null)} onSave={saveTimes} onClear={clear} />
      )}
    </div>
  );
}
