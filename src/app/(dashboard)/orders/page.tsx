import { Suspense } from "react";
import { Orders } from "@/components/modules/orders";

export const metadata = { title: "Auftragsverwaltung — MW Transport Service" };

export default function OrdersPage() {
  return (
    <Suspense fallback={null}>
      <Orders />
    </Suspense>
  );
}
