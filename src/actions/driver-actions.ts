"use server";

/* ============================================================
   MW Transport Service — Fahrer-Pool für die Auftragszuweisung
   src/actions/driver-actions.ts
   ------------------------------------------------------------
   Server Action, die die ECHTEN Fahrer des Tenants liefert (statt
   MWDATA-Mock) — für den "Fahrer zuweisen"-Dialog in der
   Auftragsverwaltung. Nutzt den cookie-gebundenen Server-Client,
   ist also RLS-scoped (Staff-Lesepolicy auf `drivers` vorausgesetzt).

   Rückgabe-Shape = UiDriver (siehe lib/server/drivers-data.ts):
   { id (=display_id), name, city, plz, type, status, rating, active, ... }
   ============================================================ */
import { loadTenantDrivers, type UiDriver } from "@/lib/server/drivers-data";

export async function getAssignableDrivers(): Promise<UiDriver[]> {
  const { drivers } = await loadTenantDrivers();
  // Nur aktive Fahrer kommen für eine Zuweisung infrage.
  return drivers.filter((d) => d.active);
}
