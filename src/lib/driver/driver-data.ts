import "server-only";

/* ============================================================
   MW Transport Service — Fahrer-Portal: echte, fahrerbezogene Daten
   src/lib/driver/driver-data.ts
   ------------------------------------------------------------
   Löst den ANGEMELDETEN Fahrer aus `drivers` (per user_id) auf und lädt
   ausschließlich dessen eigene Aufträge aus `orders` (per driver_id =
   drivers.display_id). RLS isoliert zusätzlich auf DB-Ebene.

   Kein Mock mehr: Hat der Fahrer kein Profil oder keine Aufträge, kommt
   eine leere Liste zurück — die Views zeigen dann saubere Leerzustände.
   ============================================================ */
import { createClient } from "@/lib/supabase/server";
import type { DriverOrder, OrderStatus } from "@/lib/driver/types";

export interface DriverRow {
  id: string;          // drivers.id (uuid)
  tenant_id: string;
  user_id: string;
  display_id: string;  // "F-XXXX" — verknüpft orders.driver_id
  name: string;
  phone: string | null;
  city: string | null;
  job_type: string | null;
}

export interface DriverContext {
  userId: string;
  email: string;
  driver: DriverRow | null;
}

/** Der eingeloggte Fahrer + sein drivers-Datensatz (oder null, wenn keiner existiert). */
export async function getDriverContext(): Promise<DriverContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: driver } = await supabase
    .from("drivers")
    .select("id, tenant_id, user_id, display_id, name, phone, city, job_type")
    .eq("user_id", user.id)
    .maybeSingle();

  return { userId: user.id, email: user.email ?? "", driver: (driver as DriverRow) ?? null };
}

/** Schritt-Index 0..4 aus dem Status ableiten (für die Fortschrittsanzeige). */
function stepFromStatus(status: string): number {
  switch (status) {
    case "angenommen": return 1;
    case "unterwegs": return 3;
    case "fertig": return 4;
    default: return 0; // zugewiesen / sonstiges
  }
}

interface OrderRow {
  order_no: number;
  mv_nr: string | null;
  plate: string | null;
  model: string | null;
  vin: string | null;
  auftraggeber: string | null;
  status: string;
  from_city: string | null; from_plz: string | null; from_street: string | null;
  to_city: string | null; to_plz: string | null; to_street: string | null;
  pickup_date: string | null;
  pickup_window: string | null;
  delivery_date: string | null;
  km: number | null;
  refuel: boolean | null;
  price: number | null;
}

/** Aufträge NUR dieses Fahrers (orders.driver_id = display_id), tenant-scoped via RLS. */
export async function loadDriverOrders(driver: DriverRow): Promise<DriverOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      "order_no, mv_nr, plate, model, vin, auftraggeber, status, from_city, from_plz, from_street, to_city, to_plz, to_street, pickup_date, pickup_window, delivery_date, km, refuel, price",
    )
    .eq("driver_id", driver.display_id)
    .order("pickup_date", { ascending: true });

  if (error || !data) return [];

  return (data as OrderRow[]).map((r) => ({
    id: r.order_no,
    mv_nr: r.mv_nr ?? "—",
    plate: r.plate ?? "—",
    model: r.model ?? "—",
    vin: r.vin ?? "",
    auftraggeber: r.auftraggeber ?? "—",
    status: (r.status as OrderStatus) ?? "zugewiesen",
    step: stepFromStatus(r.status),
    from: { city: r.from_city ?? "—", plz: r.from_plz ?? "", street: r.from_street ?? "" },
    to: { city: r.to_city ?? "—", plz: r.to_plz ?? "", street: r.to_street ?? "" },
    pickup_date: r.pickup_date ?? "",
    pickup_window: r.pickup_window,
    delivery_date: r.delivery_date ?? "",
    km: r.km ?? 0,
    refuel: r.refuel ?? false,
    price: r.price ?? 0,
    documents: [], // order_documents: Phase 3 (Tabelle noch nicht angelegt)
  }));
}
