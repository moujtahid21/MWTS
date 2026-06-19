import { Suspense } from "react";
import { Drivers } from "@/components/modules/drivers";
import { loadTenantDrivers } from "@/lib/server/drivers-data";

export const metadata = { title: "Fahrerverwaltung — MW Transport Service" };

export default async function DriversPage() {
  const { drivers, kpi } = await loadTenantDrivers();
  return (
    <Suspense fallback={null}>
      <Drivers initialDrivers={drivers} initialKpi={kpi} />
    </Suspense>
  );
}
