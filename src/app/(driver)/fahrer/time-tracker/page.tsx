/* ============================================================
   /fahrer/time-tracker — Stempeluhr
   ============================================================ */
import { PageHead } from "@/components/ui";
import { TimeTrackerCard } from "@/components/driver/time-tracker-card";

export const metadata = { title: "Stempeluhr · Fahrer-Portal" };

export default function DriverTimeTrackerPage() {
  return (
    <div className="mx-auto max-w-[640px]">
      <PageHead title="Stempeluhr" sub="Arbeitszeit, Pausen & Wartezeit mit Standortnachweis" />
      <TimeTrackerCard />
    </div>
  );
}
