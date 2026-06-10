/* ============================================================
   MW Transport Service — Fahrer-Portal: Datums- & Sperrlogik
   ------------------------------------------------------------
   Geschäftsregeln für die Verfügbarkeits-Planung:
     • Vergangenheit gesperrt
     • rollierende 48-Stunden-Sperre
     • Donnerstag-Deadline (23:59) für Folgewochen
     • Wochenend-Sperre für laufende / direkt bevorstehende Woche
   ============================================================ */

export const DOW_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"] as const;
export const DOW_LONG = [
  "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag",
] as const;
export const MONTHS_LONG = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember",
] as const;

export const pad2 = (n: number) => String(n).padStart(2, "0");

export const isoOf = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

export function parseIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** Montag = 0 … Sonntag = 6 */
export const dowMon = (d: Date) => (d.getDay() + 6) % 7;

export function mondayOf(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return addDays(x, -dowMon(x));
}

export function isoWeek(d: Date): number {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = (t.getDay() + 6) % 7;
  t.setDate(t.getDate() - day + 3);
  const first = new Date(t.getFullYear(), 0, 4);
  return (
    1 +
    Math.round(
      ((t.getTime() - first.getTime()) / 86400000 - 3 + ((first.getDay() + 6) % 7)) / 7,
    )
  );
}

export function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

export const fmtShort = (d: Date) => `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.`;

/** Sekunden → "HH:MM:SS" */
export function fmtClock(secs: number): string {
  const s = Math.max(0, Math.floor(secs));
  return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}`;
}

/** Sekunden → "Xh MMm" */
export function fmtHM(secs: number): string {
  const m = Math.floor(secs / 60);
  return `${Math.floor(m / 60)}h ${pad2(m % 60)}m`;
}

/* ---------- Sperrlogik ---------- */
export type LockReason =
  | "PAST"
  | "UNDER_48H"
  | "THURSDAY_DEADLINE"
  | "WEEKEND_RESTRICTION";

export const LOCK_REASON_DE: Record<LockReason, string> = {
  PAST: "Tag liegt in der Vergangenheit",
  UNDER_48H: "Weniger als 48 Stunden bis zum Arbeitstag — gesperrt",
  THURSDAY_DEADLINE: "Planungsfenster für diese Woche ist Do 23:59 abgelaufen",
  WEEKEND_RESTRICTION: "Wochenend-Änderung für laufende/nächste Woche gesperrt",
};

export type LockResult = { isLocked: boolean; reason?: LockReason };

export function checkAvailabilityLock(
  targetDateIso: string,
  now: Date = new Date(),
): LockResult {
  const target = parseIso(targetDateIso);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 1. Vergangenheit
  if (target < today) return { isLocked: true, reason: "PAST" };

  // 2. Rollierende 48-Stunden-Sperre
  const diffHours = (target.getTime() - now.getTime()) / 3600000;
  if (diffHours < 48) return { isLocked: true, reason: "UNDER_48H" };

  const curWeek = isoWeek(now);
  const tgtWeek = isoWeek(target);
  const curDow = now.getDay(); // 0 So .. 4 Do .. 6 Sa
  const tgtDow = target.getDay();

  // 3. Donnerstag-Deadline für Folgewoche(n)
  if (tgtWeek > curWeek) {
    if (curDow === 0 || curDow >= 5) return { isLocked: true, reason: "THURSDAY_DEADLINE" };
    if (curDow === 4 && (now.getHours() > 23 || (now.getHours() === 23 && now.getMinutes() >= 59)))
      return { isLocked: true, reason: "THURSDAY_DEADLINE" };
  }

  // 4. Wochenend-Sperre für laufende oder direkt bevorstehende Woche
  if ((tgtDow === 0 || tgtDow === 6) && tgtWeek <= curWeek + 1)
    return { isLocked: true, reason: "WEEKEND_RESTRICTION" };

  return { isLocked: false };
}
