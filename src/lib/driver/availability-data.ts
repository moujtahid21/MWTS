/* ============================================================
   MW Transport Service — driver_availabilities Datenzugriff
   src/lib/driver/availability-data.ts
   ------------------------------------------------------------
   Server-seitiger Loader + Server Actions (RLS-geschützt). Mappt
   zwischen DB-Row (snake_case, user_id/tenant_id) und dem View-Modell
   DriverAvailability.

   Solange die Tabelle in einer Umgebung noch nicht migriert ist, fällt
   der Loader auf die Mock-Seeds zurück (erkennbar an Postgres-Fehlercode
   42P01 = undefined_table), damit die UI nicht bricht.
   ============================================================ */
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenantId } from "@/lib/supabase/tenant";
import type { DriverAvailability, AvailabilityStatus } from "@/lib/driver/types";
import { seedAvailabilities } from "@/lib/driver/mock-data";

const TABLE = "driver_availabilities";

/**
 * Erkennt „Tabelle existiert nicht" über beide Wege:
 *  • PGRST205 — PostgREST findet die Tabelle nicht im Schema-Cache (supabase-js)
 *  • 42P01    — Postgres undefined_table (direktes SQL)
 * sowie als letzte Absicherung die Fehlermeldung selbst.
 */
function isMissingTableError(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST205" || error.code === "42P01") return true;
  const msg = (error.message ?? "").toLowerCase();
  return msg.includes("schema cache") || msg.includes("could not find the table");
}

interface AvailRow {
  date: string;
  status: AvailabilityStatus;
  start_time: string | null;
  end_time: string | null;
  is_full_day: boolean;
  shift_code: string | null;
  order_ref: number | null;
  driver_id: string | null;
}

function rowToModel(r: AvailRow): DriverAvailability {
  return {
    driver_id: r.driver_id ?? "",
    date: r.date,
    status: r.status,
    start_time: r.start_time,
    end_time: r.end_time,
    is_full_day: r.is_full_day,
    shift_code: r.shift_code,
    order_ref: r.order_ref,
  };
}

export interface AvailabilityLoad {
  /** date → availability */
  map: Record<string, DriverAvailability>;
  /** true, solange auf Mock-Daten zurückgefallen wird (Tabelle fehlt) */
  isMock: boolean;
}

/**
 * Lädt die Verfügbarkeiten des angemeldeten Fahrers in einem Datumsfenster.
 * RLS stellt sicher, dass nur eigene (bzw. als Staff: Tenant-)Zeilen kommen.
 */
export async function loadMyAvailabilities(
  fromIso: string,
  toIso: string,
): Promise<AvailabilityLoad> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from(TABLE)
    .select("date,status,start_time,end_time,is_full_day,shift_code,order_ref,driver_id")
    .gte("date", fromIso)
    .lte("date", toIso)
    .order("date", { ascending: true });

  // Tabelle noch nicht migriert → Mock, damit die Demo lebt.
  // supabase-js geht über PostgREST: fehlende Tabelle = PGRST205
  // (der reine Postgres-Code 42P01 kommt nur bei direktem SQL).
  if (error) {
    if (isMissingTableError(error)) {
      return { map: seedAvailabilities(new Date()), isMock: true };
    }
    throw error;
  }

  const map: Record<string, DriverAvailability> = {};
  for (const r of (data ?? []) as AvailRow[]) map[r.date] = rowToModel(r);
  return { map, isMock: false };
}

export interface SaveAvailabilityInput {
  date: string;
  status: AvailabilityStatus;
  start_time?: string | null;
  end_time?: string | null;
  is_full_day?: boolean;
}

/**
 * Upsert einer einzelnen Verfügbarkeit (ein Fahrer-Tag).
 * Die RLS-Policy verhindert das Überschreiben verplanter Tage.
 * Konfliktziel: (tenant_id, user_id, date).
 */
export async function saveAvailability(input: SaveAvailabilityInput): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet.");

  const tenantId = await getActiveTenantId(supabase);
  if (!tenantId) throw new Error("Kein aktiver Tenant.");

  const { error } = await supabase.from(TABLE).upsert(
    {
      tenant_id: tenantId,
      user_id: user.id,
      date: input.date,
      status: input.status,
      start_time: input.status === "abwesend" ? null : input.start_time ?? null,
      end_time: input.status === "abwesend" ? null : input.end_time ?? null,
      is_full_day: input.is_full_day ?? false,
    },
    { onConflict: "tenant_id,user_id,date" },
  );
  if (error) throw error;

  revalidatePath("/fahrer/availability");
  revalidatePath("/fahrer/dashboard");
}
