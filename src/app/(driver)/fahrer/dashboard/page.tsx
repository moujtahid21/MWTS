/* ============================================================
   /fahrer/dashboard — Fahrer-Übersicht
   ============================================================ */
import { DashboardView } from "@/components/driver/dashboard-view";

export const metadata = { title: "Übersicht · Fahrer-Portal" };

export default function DriverDashboardPage() {
  // Phase 3: hier serverseitig orders/availabilities tenant-scoped laden
  // und als Props an die (Client-)View geben.
  return <DashboardView />;
}
