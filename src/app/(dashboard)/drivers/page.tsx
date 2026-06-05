import { Suspense } from "react";
import { Drivers } from "@/components/modules/drivers";

export const metadata = { title: "Fahrerverwaltung — MW Transport Service" };

export default function DriversPage() {
  return (
    <Suspense fallback={null}>
      <Drivers />
    </Suspense>
  );
}
