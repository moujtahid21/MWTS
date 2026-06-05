"use server";

/* ============================================================
   MW Transport Service — Customer Server Actions
   ------------------------------------------------------------
   Tenant-scoped CRUD for the customer base. Same contract as the
   order actions: authenticated client, tenant_id scope (RLS-backed),
   try/catch, and the standard { data, error } envelope. German copy.
   ============================================================ */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getActiveTenantId } from "@/lib/supabase/tenant";
import {
  rowToCustomerVM,
  type ActionResult,
  type CustomerRow,
  type CustomerInsert,
  type CustomerVM,
  type CreateCustomerInput,
} from "@/lib/supabase/types";

const CLIENTS_PATH = "/clients";

function buildCustomerPayload(
  input: CreateCustomerInput,
  tenantId: string,
): CustomerInsert {
  return {
    tenant_id: tenantId,
    display_id: input.id ?? null,
    name: input.name,
    short_name: input.short ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    land: input.land ?? "Deutschland",
    city: input.city ?? null,
    street: input.street ?? null,
    plz: input.plz ?? null,
    contacts: Array.isArray(input.contacts) ? input.contacts : [],
    dispo_ausland: input.dispoAusland ?? null,
    durchfuehrung: input.durchfuehrung ?? null,
    rechnung: input.rechnung ?? null,
  };
}

/* ---------- READ ---------- */
export async function getCustomers(): Promise<ActionResult<CustomerVM[]>> {
  try {
    const supabase = await createClient();
    const tenantId = await getActiveTenantId(supabase);
    if (!tenantId) return { data: null, error: "Keine aktive Organisation. Bitte erneut anmelden." };

    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("name", { ascending: true });

    if (error) throw error;
    return { data: (data as CustomerRow[]).map(rowToCustomerVM), error: null };
  } catch (err) {
    console.error("[getCustomers]", err);
    return { data: null, error: "Kunden konnten nicht geladen werden." };
  }
}

/* ---------- CREATE ---------- */
export async function createCustomer(
  input: CreateCustomerInput,
): Promise<ActionResult<CustomerVM>> {
  try {
    const supabase = await createClient();
    const tenantId = await getActiveTenantId(supabase);
    if (!tenantId) return { data: null, error: "Keine aktive Organisation. Bitte erneut anmelden." };

    if (!input.name?.trim()) {
      return { data: null, error: "Der Kundenname ist erforderlich." };
    }

    const { data, error } = await supabase
      .from("customers")
      .insert(buildCustomerPayload(input, tenantId))
      .select("*")
      .single();

    if (error) throw error;
    revalidatePath(CLIENTS_PATH);
    return { data: rowToCustomerVM(data as CustomerRow), error: null };
  } catch (err) {
    console.error("[createCustomer]", err);
    return { data: null, error: "Kunde konnte nicht angelegt werden." };
  }
}

/* ---------- UPDATE ---------- */
export async function updateCustomer(
  id: string,
  input: CreateCustomerInput,
): Promise<ActionResult<CustomerVM>> {
  try {
    const supabase = await createClient();
    const tenantId = await getActiveTenantId(supabase);
    if (!tenantId) return { data: null, error: "Keine aktive Organisation." };

    if (!input.name?.trim()) {
      return { data: null, error: "Der Kundenname ist erforderlich." };
    }

    // tenant_id stays immutable — never let it be reassigned on update.
    const { tenant_id: _omit, ...payload } = buildCustomerPayload(input, tenantId);

    const { data, error } = await supabase
      .from("customers")
      .update(payload)
      .eq("tenant_id", tenantId)
      .eq("id", id)
      .select("*")
      .single();

    if (error) throw error;
    revalidatePath(CLIENTS_PATH);
    return { data: rowToCustomerVM(data as CustomerRow), error: null };
  } catch (err) {
    console.error("[updateCustomer]", err);
    return { data: null, error: "Kunde konnte nicht gespeichert werden." };
  }
}

/* ---------- DELETE ---------- */
export async function deleteCustomer(id: string): Promise<ActionResult<true>> {
  try {
    const supabase = await createClient();
    const tenantId = await getActiveTenantId(supabase);
    if (!tenantId) return { data: null, error: "Keine aktive Organisation." };

    const { error } = await supabase
      .from("customers")
      .delete()
      .eq("tenant_id", tenantId)
      .eq("id", id);

    if (error) throw error;
    revalidatePath(CLIENTS_PATH);
    return { data: true, error: null };
  } catch (err) {
    console.error("[deleteCustomer]", err);
    return { data: null, error: "Kunde konnte nicht gelöscht werden." };
  }
}
