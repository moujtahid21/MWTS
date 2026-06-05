"use server";

/* ============================================================
   MW Transport Service — Order Server Actions
   ------------------------------------------------------------
   Every function:
     • runs as the authenticated user (cookie-bound Supabase client)
     • is scoped to the user's tenant_id (resolved + RLS-enforced)
     • wraps DB calls in try/catch
     • returns the standard envelope { data, error }
   User-facing error strings are in German.
   ============================================================ */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenantId } from "@/lib/supabase/tenant";
import {
  rowToOrderVM,
  type ActionResult,
  type OrderRow,
  type OrderInsert,
  type OrderVM,
  type CreateOrderInput,
  type AssignDriverInput,
} from "@/lib/supabase/types";

const ORDERS_PATH = "/orders";

function toNumber(v: string | number | undefined, fallback = 0): number {
  if (v === undefined || v === null || v === "") return fallback;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

/** Build the DB insert payload from a UI form input + tenant id. */
function buildOrderInsert(input: CreateOrderInput, tenantId: string): OrderInsert {
  return {
    tenant_id: tenantId,
    mv_nr: input.mvNr ?? null,
    plate: input.plate ?? null,
    model: input.model ?? null,
    vin: input.vin ?? null,
    customer_id: input.customerId ?? null,
    auftraggeber: input.auftraggeber ?? null,
    from_city: input.fromCity ?? null,
    from_plz: input.fromPlz ?? null,
    from_street: input.fromStreet ?? null,
    to_city: input.toCity ?? null,
    to_plz: input.toPlz ?? null,
    to_street: input.toStreet ?? null,
    pickup_date: input.pickupDate || null,
    pickup_window: null,
    delivery_date: input.deliveryDate || null,
    status: input.status || "nicht_zugewiesen",
    driver_id: null,
    driver_name: null,
    driver_phone: null,
    driver_city: null,
    job_type: null,
    bundesland: input.bundesland ?? null,
    price: toNumber(input.price),
    price_selbst: toNumber(input.priceSelbst),
    km: toNumber(input.km),
    refuel: !!input.refuel,
    arbeitsnachweis: null,
  };
}

/* ---------- READ ---------- */
export async function getOrders(): Promise<ActionResult<OrderVM[]>> {
  try {
    const supabase = await createClient();
    const tenantId = await getActiveTenantId(supabase);
    if (!tenantId) return { data: null, error: "Keine aktive Organisation. Bitte erneut anmelden." };

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("order_no", { ascending: false });

    if (error) throw error;
    return { data: (data as OrderRow[]).map(rowToOrderVM), error: null };
  } catch (err) {
    console.error("[getOrders]", err);
    return { data: null, error: "Aufträge konnten nicht geladen werden." };
  }
}

export async function getOrderById(id: string): Promise<ActionResult<OrderVM>> {
  try {
    const supabase = await createClient();
    const tenantId = await getActiveTenantId(supabase);
    if (!tenantId) return { data: null, error: "Keine aktive Organisation." };

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .single();

    if (error) throw error;
    return { data: rowToOrderVM(data as OrderRow), error: null };
  } catch (err) {
    console.error("[getOrderById]", err);
    return { data: null, error: "Auftrag wurde nicht gefunden." };
  }
}

/* ---------- CREATE ---------- */
export async function createOrder(input: CreateOrderInput): Promise<ActionResult<OrderVM>> {
  try {
    const supabase = await createClient();
    const tenantId = await getActiveTenantId(supabase);
    if (!tenantId) return { data: null, error: "Keine aktive Organisation. Bitte erneut anmelden." };

    if (!input.model && !input.plate) {
      return { data: null, error: "Mindestens Modell oder Kennzeichen ist erforderlich." };
    }

    const { data, error } = await supabase
      .from("orders")
      .insert(buildOrderInsert(input, tenantId))
      .select("*")
      .single();

    if (error) throw error;
    revalidatePath(ORDERS_PATH);
    return { data: rowToOrderVM(data as OrderRow), error: null };
  } catch (err) {
    console.error("[createOrder]", err);
    return { data: null, error: "Auftrag konnte nicht angelegt werden." };
  }
}

/* ---------- UPDATE ---------- */
export async function updateOrderStatus(
  id: string,
  status: string,
): Promise<ActionResult<OrderVM>> {
  try {
    const supabase = await createClient();
    const tenantId = await getActiveTenantId(supabase);
    if (!tenantId) return { data: null, error: "Keine aktive Organisation." };

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    revalidatePath(ORDERS_PATH);
    return { data: rowToOrderVM(data as OrderRow), error: null };
  } catch (err) {
    console.error("[updateOrderStatus]", err);
    return { data: null, error: "Status konnte nicht aktualisiert werden." };
  }
}

export async function cancelOrder(id: string): Promise<ActionResult<OrderVM>> {
  return updateOrderStatus(id, "storniert");
}

export async function assignOrderDriver(
  id: string,
  driver: AssignDriverInput,
): Promise<ActionResult<OrderVM>> {
  try {
    const supabase = await createClient();
    const tenantId = await getActiveTenantId(supabase);
    if (!tenantId) return { data: null, error: "Keine aktive Organisation." };

    const { data, error } = await supabase
      .from("orders")
      .update({
        driver_id: driver.id,
        driver_name: driver.name,
        driver_phone: driver.phone ?? null,
        driver_city: driver.city ?? null,
        job_type: driver.type ?? null,
        status: "zugewiesen",
      })
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    revalidatePath(ORDERS_PATH);
    return { data: rowToOrderVM(data as OrderRow), error: null };
  } catch (err) {
    console.error("[assignOrderDriver]", err);
    return { data: null, error: "Fahrer konnte nicht zugewiesen werden." };
  }
}

/* Bulk status update (used by the selection toolbar). */
export async function updateOrdersStatus(
  ids: string[],
  status: string,
): Promise<ActionResult<number>> {
  try {
    const supabase = await createClient();
    const tenantId = await getActiveTenantId(supabase);
    if (!tenantId) return { data: null, error: "Keine aktive Organisation." };
    if (ids.length === 0) return { data: 0, error: null };

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("tenant_id", tenantId)
      .in("id", ids)
      .select("id");

    if (error) throw error;
    revalidatePath(ORDERS_PATH);
    return { data: data?.length ?? 0, error: null };
  } catch (err) {
    console.error("[updateOrdersStatus]", err);
    return { data: null, error: "Aktion konnte nicht ausgeführt werden." };
  }
}

/* ---------- DELETE ---------- */
export async function deleteOrder(id: string): Promise<ActionResult<true>> {
  try {
    const supabase = await createClient();
    const tenantId = await getActiveTenantId(supabase);
    if (!tenantId) return { data: null, error: "Keine aktive Organisation." };

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) throw error;
    revalidatePath(ORDERS_PATH);
    return { data: true, error: null };
  } catch (err) {
    console.error("[deleteOrder]", err);
    return { data: null, error: "Auftrag konnte nicht gelöscht werden." };
  }
}
