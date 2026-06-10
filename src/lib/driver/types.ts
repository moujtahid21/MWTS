/* ============================================================
   MW Transport Service — Fahrer-Portal: Domänentypen
   ------------------------------------------------------------
   Geformt nach den (Phase-3-)Supabase-Tabellen, damit die View-
   Komponenten später 1:1 an echte Queries angebunden werden können.
   Snake_case = DB-Spalten; die Views mappen darauf.
   ============================================================ */

/* ---------- driver_availabilities ---------- */
export type AvailabilityStatus =
  | "anwesend" // Fahrer hat Verfügbarkeit eingetragen (grün)
  | "abwesend" // Default, nicht verfügbar (grau)
  | "verplant"; // vom Disponenten zugewiesen (blau, read-only)

export interface DriverAvailability {
  driver_id: string;
  /** ISO-Datum yyyy-mm-dd (PK zusammen mit driver_id) */
  date: string;
  status: AvailabilityStatus;
  /** "HH:mm" oder null bei abwesend */
  start_time: string | null;
  end_time: string | null;
  is_full_day: boolean;
  /** Schicht-Code (F/T/S/N) wenn verplant */
  shift_code: string | null;
  /** Referenz auf orders.order_no wenn verplant */
  order_ref: number | null;
}

/* ---------- time_stamps ---------- */
export type StampType =
  | "in"
  | "out"
  | "break_start"
  | "break_end"
  | "wait_start"
  | "wait_end";

export interface TimeStamp {
  id: string;
  driver_id: string;
  type: StampType;
  /** ISO datetime */
  ts: string;
  lat: number | null;
  lng: number | null;
  geo_source: "gps" | "manual" | "demo" | null;
  label: string;
}

/* ---------- order_documents ---------- */
export type DocType =
  | "Tankbeleg"
  | "Waschstrassenbeleg"
  | "CMR_Frachtbrief"
  | "Sonstige_Quittung";

export type DocStatus = "offen" | "fertig";

export interface OrderDocument {
  id: string;
  order_id: number;
  driver_id: string;
  type: DocType;
  file_name: string;
  uploaded_at: string;
  status: DocStatus;
  /** Nur bei Tankbeleg */
  brutto?: string | null;
  liter?: string | null;
  /** Lokale Objekt-URL der Vorschau (Client-only, vor Upload) */
  preview_url?: string | null;
}

/* ---------- orders (View-Model auf public.orders) ---------- */
export type OrderStatus =
  | "zugewiesen"
  | "angenommen"
  | "unterwegs"
  | "fertig"
  | "storniert"
  | "nicht_zugewiesen";

export interface DriverOrder {
  id: number; // orders.order_no
  mv_nr: string;
  plate: string;
  model: string;
  vin: string;
  auftraggeber: string;
  status: OrderStatus;
  /** 0..4 Fortschritt: Angenommen → Abgeholt → Unterwegs → Geliefert */
  step: number;
  from: { city: string; plz: string; street: string };
  to: { city: string; plz: string; street: string };
  pickup_date: string;
  pickup_window: string | null;
  delivery_date: string;
  km: number;
  refuel: boolean;
  price: number;
  documents: OrderDocument[];
}

/* ---------- Fahrer-Profil ---------- */
export interface DriverProfileData {
  id: string;
  name: string;
  email: string;
  phone: string;
  team: string;
  type: string; // Angestellt | Selbständig | Mini Job
  contract_h: number;
  rating: string;
  trips: number;
  tenant: string;
}

/* ---------- Schicht-Vorlagen ---------- */
export interface ShiftTemplate {
  code: string;
  name: string;
  start: string;
  end: string;
  color: string;
}
