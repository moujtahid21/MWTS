/* ============================================================
   MW Transport Service — Fahrer-Portal: Mock-Daten
   ------------------------------------------------------------
   Platzhalter im Supabase-Shape. In Phase 3 ersetzt durch
   tenant-scoped Queries:
     supabase.from("driver_availabilities").select(...).eq("driver_id", me.id)
     supabase.from("orders").select(..., order_documents(*)).eq("driver_id", me.id)
     supabase.from("time_stamps").select(...).eq("driver_id", me.id)
   Verfügbarkeiten werden relativ zum heutigen Datum erzeugt, damit
   editierbare Zukunftstage und gesperrte Tage immer sinnvoll wirken.
   ============================================================ */
import type {
  DriverAvailability,
  DriverOrder,
  DriverProfileData,
  ShiftTemplate,
} from "./types";
import { addDays, isoOf, mondayOf } from "./date-utils";

/* ---------- Profil des angemeldeten Fahrers ---------- */
export const ME: DriverProfileData = {
  id: "F-2001",
  name: "Amin Dahmouni",
  email: "amin.dahmouni@example.com",
  phone: "+49 176 21625135",
  team: "NRW Nord",
  type: "Angestellt",
  contract_h: 40,
  rating: "4.7",
  trips: 312,
  tenant: "MW Transport Service",
};

/* ---------- Belegtypen (order_documents.type) ---------- */
export const DOC_TYPES: { key: string; label: string; icon: string; extra: boolean }[] = [
  { key: "Tankbeleg", label: "Tankbeleg", icon: "fuel", extra: true },
  { key: "Waschstrassenbeleg", label: "Waschstraßenbeleg", icon: "refresh", extra: false },
  { key: "CMR_Frachtbrief", label: "CMR-Frachtbrief", icon: "file", extra: false },
  { key: "Sonstige_Quittung", label: "Sonstige Quittung", icon: "receipt", extra: false },
];

/* ---------- Schicht-Vorlagen ---------- */
export const SHIFT_TPL: Record<string, ShiftTemplate> = {
  F: { code: "F", name: "Frühdienst", start: "06:00", end: "14:30", color: "#0ea5e9" },
  T: { code: "T", name: "Tagesdienst", start: "09:00", end: "17:30", color: "#16a34a" },
  S: { code: "S", name: "Spätdienst", start: "14:00", end: "22:30", color: "#f59e0b" },
  N: { code: "N", name: "Nachtdienst", start: "22:00", end: "06:30", color: "#7c3aed" },
};

/* ---------- Verfügbarkeiten relativ zu heute ----------
   Map-Key = ISO-Datum; nur tatsächlich gesetzte Tage liegen vor. */
export function seedAvailabilities(now = new Date()): Record<string, DriverAvailability> {
  const monday = mondayOf(now);
  const mk = (
    offsetFromMonday: number,
    data: Partial<DriverAvailability>,
  ): [string, DriverAvailability] => {
    const date = isoOf(addDays(monday, offsetFromMonday));
    return [
      date,
      {
        driver_id: ME.id,
        date,
        status: "abwesend",
        start_time: null,
        end_time: null,
        is_full_day: false,
        shift_code: null,
        order_ref: null,
        ...data,
      },
    ];
  };

  return Object.fromEntries([
    // laufende Woche (überwiegend gesperrt durch 48h-Regel)
    mk(1, { status: "verplant", start_time: "09:00", end_time: "17:30", shift_code: "T", order_ref: 548197 }),
    // Folgewoche (KW+1) — editierbar
    mk(8, { status: "abwesend" }),
    mk(9, { status: "verplant", start_time: "09:00", end_time: "17:30", shift_code: "T" }),
    mk(10, { status: "anwesend", start_time: "00:00", end_time: "24:00", is_full_day: true }),
    mk(11, { status: "anwesend", start_time: "08:00", end_time: "18:00" }),
    mk(12, { status: "verplant", start_time: "06:00", end_time: "14:30", shift_code: "F" }),
  ]);
}

/* ---------- Aufträge des Fahrers (relativ zu heute) ---------- */
export function seedOrders(now = new Date()): DriverOrder[] {
  const d = (n: number) => isoOf(addDays(now, n));
  return [
    {
      id: 548197, mv_nr: "MV-90227", plate: "M-VU 6239", model: "VW TOURAN MPV 7S BE AUT",
      vin: "WVGZZZ1TXTW006279", auftraggeber: "Sixt Autovermietung", status: "angenommen", step: 2,
      from: { city: "Düsseldorf", plz: "40468", street: "Kieshecker Weg 260" },
      to: { city: "Köln", plz: "50667", street: "Hohe Straße 12" },
      pickup_date: d(0), pickup_window: "08:00–16:30", delivery_date: d(0),
      km: 58, refuel: true, price: 168, documents: [],
    },
    {
      id: 547060, mv_nr: "MV-90208", plate: "M-HB 3325", model: "MB A200 LIM BE AUT",
      vin: "W1K3F8HB6TJ555670", auftraggeber: "Avis Autovermietung", status: "unterwegs", step: 3,
      from: { city: "Neuss", plz: "41460", street: "Danziger Straße 17" },
      to: { city: "Essen", plz: "45127", street: "Kettwiger Straße 3" },
      pickup_date: d(0), pickup_window: "09:00–12:00", delivery_date: d(0),
      km: 41, refuel: false, price: 142, documents: [],
    },
    {
      id: 546890, mv_nr: "MV-90196", plate: "D-SP 8437", model: "VW T-ROC OFF BE MAN",
      vin: "WVGZZZA11TV005039", auftraggeber: "Enterprise Autovermietung", status: "zugewiesen", step: 0,
      from: { city: "Wülfrath", plz: "42489", street: "Wilhelmstraße 118" },
      to: { city: "Dortmund", plz: "44137", street: "Westenhellweg 90" },
      pickup_date: d(1), pickup_window: "07:00–12:00", delivery_date: d(1),
      km: 72, refuel: true, price: 196, documents: [],
    },
    {
      id: 546120, mv_nr: "MV-90181", plate: "K-LM 4728", model: "BMW 320d TOUR BE AUT",
      vin: "WBA8E91070K123456", auftraggeber: "Mercedes-Benz Niederlassung Rhein-Ruhr", status: "zugewiesen", step: 0,
      from: { city: "Köln", plz: "50667", street: "Hohe Straße 12" },
      to: { city: "Frankfurt am Main", plz: "60528", street: "Hahnstraße 70" },
      pickup_date: d(2), pickup_window: "06:00–10:00", delivery_date: d(2),
      km: 195, refuel: false, price: 312, documents: [],
    },
    {
      id: 545201, mv_nr: "MV-90160", plate: "E-KT 9012", model: "AUDI A4 AVANT BE AUT",
      vin: "WAUZZZ8E56A998877", auftraggeber: "VW Leasing Service", status: "fertig", step: 4,
      from: { city: "Essen", plz: "45127", street: "Kettwiger Straße 3" },
      to: { city: "Aachen", plz: "52070", street: "Jülicher Straße 336" },
      pickup_date: d(-3), pickup_window: "08:00–16:30", delivery_date: d(-3),
      km: 120, refuel: true, price: 224,
      documents: [
        { id: "D-2071", order_id: 545201, driver_id: ME.id, type: "CMR_Frachtbrief", file_name: "CMR_Frachtbrief_545201.pdf", uploaded_at: d(-3), status: "fertig" },
        { id: "D-2072", order_id: 545201, driver_id: ME.id, type: "Tankbeleg", file_name: "Tankbeleg_E-KT9012.jpg", uploaded_at: d(-3), status: "fertig", brutto: "64,20", liter: "38,5" },
      ],
    },
  ];
}
