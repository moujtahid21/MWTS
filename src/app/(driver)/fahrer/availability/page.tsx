/* ============================================================
   /fahrer/availability — Verfügbarkeits-Kalender
   Lädt das aktuelle ±6-Wochen-Fenster serverseitig (RLS-scoped) und
   übergibt es an die Client-View. Speichern läuft über die Server Action
   saveAvailability. Solange die Tabelle noch nicht migriert ist, liefert
   der Loader Mock-Daten (isMock) und die View arbeitet rein lokal weiter.
   ============================================================ */
import { AvailabilityView } from "@/components/driver/availability-view";
import { loadMyAvailabilities } from "@/lib/driver/availability-data";
import { addDays, isoOf, mondayOf } from "@/lib/driver/date-utils";

export const metadata = { title: "Verfügbarkeit · Fahrer-Portal" };

export default async function DriverAvailabilityPage() {
  const now = new Date();
  // Fenster großzügig: 1 Woche zurück bis 8 Wochen voraus.
  const from = isoOf(addDays(mondayOf(now), -7));
  const to = isoOf(addDays(mondayOf(now), 56));

  const { map, isMock } = await loadMyAvailabilities(from, to);

  return <AvailabilityView initialAvail={map} isMock={isMock} />;
}
