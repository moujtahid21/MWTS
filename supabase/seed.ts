/* ============================================================
   MW Transport Service — Supabase Seed (Phase 2)
   ------------------------------------------------------------
   Seeds ONE tenant with its customers + orders taken straight from
   the existing demo data (src/lib/data.ts), and provisions a demo
   dispatcher user whose JWT carries the tenant_id — so after login
   the tenant-scoped Server Actions return real rows immediately.

   Uses the SERVICE-ROLE key (bypasses RLS) — server-side only,
   never ship this in the client bundle.

   Run:   npm run seed
   (loads .env.local automatically; see the env loader below)
   ============================================================ */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MWDATA } from "../src/lib/data";
import type { Database } from "../src/lib/supabase/types";

/* ---------- tiny .env.local loader (no dotenv dependency) ---------- */
function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const raw = readFileSync(resolve(process.cwd(), file), "utf8");
      for (const line of raw.split("\n")) {
        const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        const key = m[1];
        let val = m[2].trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!(key in process.env)) process.env[key] = val;
      }
    } catch {
      /* file optional */
    }
  }
}
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "\n✗ Fehlende Umgebungsvariablen.\n" +
      "  Bitte NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY in .env.local setzen.\n",
  );
  process.exit(1);
}

/* Configurable demo identity. */
const TENANT_NAME = process.env.SEED_TENANT_NAME ?? "MW Transport Service";
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "dispo@mwtransport.de";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "mwtransport2026";

const DRIVER_EMAIL = process.env.SEED_DRIVER_EMAIL ?? "amin@mwtransport.de";
const DRIVER_PASSWORD = process.env.SEED_DRIVER_PASSWORD ?? "fahrer2026";

const admin = createClient<Database>(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

/* ---------- helpers ---------- */
async function getOrCreateTenant(): Promise<string> {
  const { data: existing } = await admin
    .from("tenants")
    .select("id")
    .eq("name", TENANT_NAME)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data, error } = await admin
    .from("tenants")
    .insert({ name: TENANT_NAME, brand: "Grün", label: "MW" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function getOrCreateAdminUser(tenantId: string): Promise<string> {
  // Try to find an existing user by listing (admin API has no getByEmail).
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list?.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (found) {
    // Make sure the tenant_id claim is present / current.
    await admin.auth.admin.updateUserById(found.id, {
      app_metadata: { tenant_id: tenantId, role: "dispatcher" },
    });
    return found.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    app_metadata: { tenant_id: tenantId, role: "dispatcher" },
    user_metadata: { name: "Disposition MW" },
  });
  if (error) throw error;
  return data.user.id;
}

async function getOrCreateDriverUser(tenantId: string): Promise<string> {
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const found = list?.users.find((u) => u.email?.toLowerCase() === DRIVER_EMAIL.toLowerCase());

  if (found) {
    await admin.auth.admin.updateUserById(found.id, {
      app_metadata: { tenant_id: tenantId, role: "driver", driver_display_id: "F-2001" },
    });
    return found.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: DRIVER_EMAIL,
    password: DRIVER_PASSWORD,
    email_confirm: true,
    // Die Rolle 'driver' ins JWT schreiben, damit RLS und Middleware das erkennen
    app_metadata: { tenant_id: tenantId, role: "driver", driver_display_id: "F-2001" },
    user_metadata: { name: "Amin Dahmouni" },
  });
  if (error) throw error;
  return data.user.id;
}

async function ensureMembership(userId: string, tenantId: string, role: string = "dispatcher") {
  const { error } = await admin
    .from("memberships")
    .upsert({ user_id: userId, tenant_id: tenantId, role });
  if (error) throw error;
}

async function ensureDriverProfile(userId: string, tenantId: string) {
  const { error } = await admin.from("drivers").upsert({
    tenant_id: tenantId,
    user_id: userId,
    display_id: "F-2001",
    name: "Amin Dahmouni",
    phone: "+49 151 98765432", // Beispiel
    city: "Düsseldorf",
    job_type: "Angestellt"
  }, { onConflict: "tenant_id, display_id" });

  if (error) {
     console.warn("  [Warnung] Konnte Driver-Profil nicht anlegen. Existiert die 'drivers' Tabelle?");
  }
}

/* ---------- main ---------- */
async function main() {
  console.log("→ Seed: Tenant wird sichergestellt …");
  const tenantId = await getOrCreateTenant();
  console.log("  tenant_id =", tenantId);

  console.log("→ Demo-Benutzer wird provisioniert …");
  const userId = await getOrCreateAdminUser(tenantId);
  await ensureMembership(userId, tenantId);
  console.log("  user_id   =", userId);

  console.log("→ Demo-Fahrer wird provisioniert …");
  const driverId = await getOrCreateDriverUser(tenantId);
  await ensureMembership(driverId, tenantId, "driver");
  await ensureDriverProfile(driverId, tenantId);
  console.log("  driver_id =", driverId);

  // Idempotent re-seed: clear this tenant's business rows first.
  console.log("→ Vorhandene Tenant-Daten werden bereinigt …");
  await admin.from("orders").delete().eq("tenant_id", tenantId);
  await admin.from("customers").delete().eq("tenant_id", tenantId);

  /* ---- Customers ---- */
  const customerRows = MWDATA.customers.map((c: any) => ({
    tenant_id: tenantId,
    display_id: c.id,
    name: c.name,
    short_name: c.short ?? null,
    email: c.email ?? null,
    phone: c.phone ?? null,
    land: c.land ?? "Deutschland",
    city: c.city ?? null,
    street: c.street ?? null,
    plz: c.plz ?? null,
    contacts: c.contacts ?? [],
    dispo_ausland: c.dispoAusland ?? null,
    durchfuehrung: c.durchfuehrung ?? null,
    rechnung: c.rechnung ?? null,
    order_count: c.orders ?? 0,
    open_orders: c.openOrders ?? 0,
  }));

  console.log(`→ ${customerRows.length} Kunden werden eingespielt …`);
  const { data: insertedCustomers, error: custErr } = await admin
    .from("customers")
    .insert(customerRows)
    .select("id, name");
  if (custErr) throw custErr;

  // name → uuid for linking orders to their customer.
  const customerByName = new Map<string, string>();
  (insertedCustomers ?? []).forEach((c) => customerByName.set(c.name, c.id));

  /* ---- Orders ---- */
  const orderRows = MWDATA.orders.map((o: any) => ({
    tenant_id: tenantId,
    order_no: o.id, // numeric human-readable order number (e.g. 548197)
    mv_nr: o.mvNr ?? null,
    plate: o.plate ?? null,
    model: o.model ?? null,
    vin: o.vin ?? null,
    customer_id: customerByName.get(o.auftraggeber) ?? null,
    auftraggeber: o.auftraggeber ?? null,
    from_city: o.from?.city ?? null,
    from_plz: o.from?.plz ?? null,
    from_street: o.from?.street ?? null,
    to_city: o.to?.city ?? null,
    to_plz: o.to?.plz ?? null,
    to_street: o.to?.street ?? null,
    pickup_date: o.pickupDate ?? null,
    pickup_window: o.pickupWindow ?? null,
    delivery_date: o.deliveryDate ?? null,
    status: o.status ?? "nicht_zugewiesen",
    driver_id: o.driver?.id ?? null,
    driver_name: o.driver?.name ?? null,
    driver_phone: o.driver?.phone ?? null,
    driver_city: o.driver?.city ?? null,
    job_type: o.jobType ?? null,
    bundesland: o.bundesland ?? null,
    price: o.price ?? 0,
    price_selbst: o.priceSelbst ?? 0,
    km: o.km ?? 0,
    refuel: !!o.refuel,
    arbeitsnachweis: o.arbeitsnachweis ?? null,
  }));

  console.log(`→ ${orderRows.length} Aufträge werden eingespielt …`);
  // Insert in chunks to stay well within payload limits.
  const chunkSize = 200;
  for (let i = 0; i < orderRows.length; i += chunkSize) {
    const chunk = orderRows.slice(i, i + chunkSize);
    const { error } = await admin.from("orders").insert(chunk);
    if (error) throw error;
  }

  console.log("\n✓ Seed abgeschlossen.\n");
  console.log("  Login-Daten (Demo-Disponent):");
  console.log("    E-Mail:   " + ADMIN_EMAIL);
  console.log("    Passwort: " + ADMIN_PASSWORD);
  console.log("\n  Login-Daten (Demo-Fahrer):");
  console.log("    E-Mail:   " + DRIVER_EMAIL);
  console.log("    Passwort: " + DRIVER_PASSWORD);
  console.log("\n  Jetzt `npm run dev` starten und unter /login anmelden.\n");

}

main().catch((err) => {
  console.error("\n✗ Seed fehlgeschlagen:\n", err);
  process.exit(1);
});
