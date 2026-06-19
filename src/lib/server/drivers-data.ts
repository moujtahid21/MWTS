import "server-only";

/* ============================================================
   MW Transport Service — Dispatcher: echte Fahrerliste aus Supabase
   src/lib/server/drivers-data.ts
   ------------------------------------------------------------
   Lädt die Fahrer des aktiven Tenants aus der drivers-Tabelle (RLS-/
   Service-scoped) und mappt sie auf die Form, die die bestehende
   <Drivers/>-UI erwartet. Felder, die (noch) nicht in der DB liegen
   (E-Mail, PLZ, Rating …), bekommen sinnvolle Defaults — kein Mock.

   Zusätzlich: orderCount je Fahrer (über orders.driver_id = display_id)
   und die Soll-Rolle (drivers.role), damit Disponenten z. B. sehen,
   dass F-2016 als Disponent geführt wird.
   ============================================================ */
import { createClient } from "@/lib/supabase/server";
import { getActiveTenantId } from "@/lib/supabase/tenant";

/** Shape, die components/modules/drivers.tsx konsumiert. */
export interface UiDriver {
  id: string;            // display_id ("F-2001")
  uuid: string;          // drivers.id
  name: string;
  city: string;
  plz: string;
  type: string;          // job_type ("Angestellt" | "Selbständig" | "Mini Job")
  role: string;          // 'admin' | 'dispatcher' | 'driver'
  email: string;
  phone: string;
  registered: string;    // YYYY-MM-DD aus created_at
  consent: string;
  gender: string;
  active: boolean;
  hasAccount: boolean;   // user_id gesetzt?
  status: "available" | "onjob" | "offduty";
  orderCount: number;
  vat: boolean;
  taxNr: string;
  rating: string;
  trips: number;
  docs: Record<string, boolean>;
}

interface DriverDbRow {
  id: string;
  user_id: string | null;
  display_id: string;
  name: string;
  phone: string | null;
  city: string | null;
  job_type: string | null;
  role: string;
  created_at: string;
}

export interface TenantDriversResult {
  drivers: UiDriver[];
  kpi: { driversTotal: number; angestellt: number; selbst: number; minijob: number; activeDrivers: number };
}

function mapRow(r: DriverDbRow, orderCount: number): UiDriver {
  const reg = (r.created_at ?? "").slice(0, 10);
  return {
    id: r.display_id,
    uuid: r.id,
    name: r.name,
    city: r.city ?? "",
    plz: "",
    type: r.job_type ?? "—",
    role: r.role ?? "driver",
    email: "",
    phone: r.phone ?? "",
    registered: reg,
    consent: reg,
    gender: "",
    active: true,
    hasAccount: !!r.user_id,
    status: orderCount > 0 ? "onjob" : "available",
    orderCount,
    vat: r.job_type === "Selbständig",
    taxNr: "",
    rating: "—",
    trips: orderCount,
    docs: {},
  };
}

export async function loadTenantDrivers(): Promise<TenantDriversResult> {
  const supabase = await createClient();
  const tenantId = await getActiveTenantId(supabase);
  const empty = { drivers: [], kpi: { driversTotal: 0, angestellt: 0, selbst: 0, minijob: 0, activeDrivers: 0 } };
  if (!tenantId) return empty;

  const { data: rows, error } = await supabase
    .from("drivers")
    .select("id, user_id, display_id, name, phone, city, job_type, role, created_at")
    .eq("tenant_id", tenantId)
    .order("display_id", { ascending: true });
  if (error || !rows) return empty;

  // Auftragszahl pro Fahrer (eine Abfrage, im Speicher gruppiert).
  const { data: ordRows } = await supabase
    .from("orders")
    .select("driver_id")
    .eq("tenant_id", tenantId)
    .not("driver_id", "is", null);
  const counts: Record<string, number> = {};
  for (const o of (ordRows ?? []) as { driver_id: string }[]) {
    counts[o.driver_id] = (counts[o.driver_id] ?? 0) + 1;
  }

  const drivers = (rows as DriverDbRow[]).map((r) => mapRow(r, counts[r.display_id] ?? 0));

  return {
    drivers,
    kpi: {
      driversTotal: drivers.length,
      angestellt: drivers.filter((d) => d.type === "Angestellt").length,
      selbst: drivers.filter((d) => d.type === "Selbständig").length,
      minijob: drivers.filter((d) => d.type === "Mini Job").length,
      activeDrivers: drivers.filter((d) => d.status !== "offduty").length,
    },
  };
}
