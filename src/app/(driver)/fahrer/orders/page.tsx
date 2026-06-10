/* ============================================================
   /fahrer/orders — Meine Aufträge
   Deep-Link: /fahrer/orders?id=<order_no> öffnet direkt das Detail
   (z. B. aus dem Dashboard „Nächster Auftrag").
   ============================================================ */
import { OrdersView } from "@/components/driver/orders-view";
import { seedOrders } from "@/lib/driver/mock-data";

export const metadata = { title: "Aufträge · Fahrer-Portal" };

export default async function DriverOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const sp = await searchParams;
  const sel = sp.id ? Number(sp.id) : null;

  // Phase 3: supabase.from("orders").select("*, order_documents(*)").eq("driver_id", me.id)
  const orders = seedOrders(new Date());

  return <OrdersView initialOrders={orders} initialSel={sel} />;
}
