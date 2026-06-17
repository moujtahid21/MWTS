/* ============================================================
   /fahrer/orders — Meine Aufträge (echt, pro Fahrer)
   ------------------------------------------------------------
   Lädt ausschließlich die Aufträge des angemeldeten Fahrers
   (orders.driver_id = drivers.display_id), tenant-scoped via RLS.
   Deep-Link: /fahrer/orders?id=<order_no> öffnet direkt das Detail.
   Kein Fahrerprofil → keine Aufträge (sauberer Leerzustand in der View).
   ============================================================ */
import { OrdersView } from "@/components/driver/orders-view";
import { getDriverContext, loadDriverOrders } from "@/lib/driver/driver-data";

export const metadata = { title: "Aufträge · Fahrer-Portal" };

export default async function DriverOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const sp = await searchParams;
  const sel = sp.id ? Number(sp.id) : null;

  const ctx = await getDriverContext();
  const orders = ctx?.driver ? await loadDriverOrders(ctx.driver) : [];

  return <OrdersView initialOrders={orders} initialSel={sel} />;
}
