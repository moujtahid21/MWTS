/* ============================================================
   /fahrer/availability — Verfügbarkeits-Kalender
   ============================================================ */
import { AvailabilityView } from "@/components/driver/availability-view";

export const metadata = { title: "Verfügbarkeit · Fahrer-Portal" };

export default function DriverAvailabilityPage() {
  // Phase 3: supabase.from("driver_availabilities").select(...).eq("driver_id", me.id)
  return <AvailabilityView />;
}
