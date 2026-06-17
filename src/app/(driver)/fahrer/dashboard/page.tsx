/* ============================================================
   /fahrer/dashboard — Fahrer-Übersicht (echt, pro Fahrer)
   ------------------------------------------------------------
   Lädt den angemeldeten Fahrer + seine Aufträge + Verfügbarkeiten
   serverseitig (RLS-scoped) und reicht sie an die Client-View.
   Kein gemeinsamer Mock mehr — jeder Fahrer sieht nur seine Daten.
   ============================================================ */
import { DashboardView } from "@/components/driver/dashboard-view";
import { getDriverContext, loadDriverOrders } from "@/lib/driver/driver-data";
import { loadMyAvailabilities } from "@/lib/driver/availability-data";
import { addDays, isoOf, mondayOf } from "@/lib/driver/date-utils";

export const metadata = { title: "Übersicht · Fahrer-Portal" };

export default async function DriverDashboardPage() {
  const ctx = await getDriverContext();

  const now = new Date();
  const from = isoOf(addDays(mondayOf(now), -7));
  const to = isoOf(addDays(mondayOf(now), 56));

  const orders = ctx?.driver ? await loadDriverOrders(ctx.driver) : [];
  const { map: availabilities } = await loadMyAvailabilities(from, to);

  const driverName = ctx?.driver?.name ?? ctx?.email?.split("@")[0] ?? "Fahrer";
  const driverSub = ctx?.driver
    ? [ctx.driver.job_type, ctx.driver.city].filter(Boolean).join(" · ") || "Fahrer"
    : "Fahrerprofil noch nicht hinterlegt";

  return (
    <DashboardView
      driverName={driverName}
      driverSub={driverSub}
      orders={orders}
      availabilities={availabilities}
    />
  );
}
