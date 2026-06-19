/* ============================================================
   MW Transport Service — Supabase schema types + view-model mappers
   ------------------------------------------------------------
   Strict row types for every table the app touches. Snake_case DB rows
   are mapped to the camelCase / nested view-models the UI components
   already expect, so the refactor stays contained to the data boundary.

   NOTE (Build-Fix): @supabase/supabase-js ≥ 2.74 (createServerClient aus
   @supabase/ssr) verlangt am Database-Typ
     • einen `__InternalSupabase`-Schlüssel mit `PostgrestVersion`
     • und an JEDER Tabelle einen `Relationships`-Schlüssel.
   Fehlt eines davon, bricht die Typinferenz komplett zusammen und alle
   Queries/.insert() werden zu `never` ("not assignable to parameter of
   type 'never[]'"). Beides ist unten gesetzt — exakt wie `supabase gen
   types` es heute erzeugt.
   ============================================================ */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/* ---------- Embedded value objects ---------- */
export interface CustomerContact {
  name: string;
  role: string;
  phone: string;
  email: string;
}

/* ---------- Table rows (exact DB shape) ---------- */
export interface CustomerRow {
  id: string;
  tenant_id: string;
  display_id: string | null;
  name: string;
  short_name: string | null;
  email: string | null;
  phone: string | null;
  land: string | null;
  city: string | null;
  street: string | null;
  plz: string | null;
  contacts: CustomerContact[];
  dispo_ausland: string | null;
  durchfuehrung: string | null;
  rechnung: string | null;
  order_count: number;
  open_orders: number;
  created_at: string;
}

export interface OrderRow {
  id: string;
  tenant_id: string;
  order_no: number | null;
  mv_nr: string | null;
  plate: string | null;
  model: string | null;
  vin: string | null;
  customer_id: string | null;
  auftraggeber: string | null;
  from_city: string | null;
  from_plz: string | null;
  from_street: string | null;
  to_city: string | null;
  to_plz: string | null;
  to_street: string | null;
  pickup_date: string | null;
  pickup_window: string | null;
  delivery_date: string | null;
  status: string;
  driver_id: string | null;
  driver_name: string | null;
  driver_phone: string | null;
  driver_city: string | null;
  job_type: string | null;
  bundesland: string | null;
  price: number;
  price_selbst: number;
  km: number;
  refuel: boolean;
  arbeitsnachweis: string | null;
  created_at: string;
}

export interface MembershipRow {
  user_id: string;
  tenant_id: string;
  role: string;
}

export interface TenantRow {
  id: string;
  name: string;
  brand: string | null;
  label: string | null;
  created_at: string;
}

export interface DriverRow {
  id: string;
  tenant_id: string;
  user_id: string | null;
  display_id: string;
  name: string;
  phone: string | null;
  city: string | null;
  job_type: string | null;
  role: string;
  created_at: string;
}

export interface DriverAvailabilityRow {
  id: string;
  tenant_id: string;
  user_id: string;
  driver_id: string | null;
  date: string;
  status: string;
  start_time: string | null;
  end_time: string | null;
  is_full_day: boolean;
  shift_code: string | null;
  order_ref: number | null;
  updated_at: string;
}

export interface InviteTokenRow {
  id: string;
  tenant_id: string;
  token: string;
  role: string;
  email: string | null;
  created_by: string | null;
  expires_at: string;
  used_at: string | null;
  used_by: string | null;
  created_at: string;
}

/* ---------- Insert payloads (tenant_id injected server-side) ---------- */
export type CustomerInsert = Omit<
  CustomerRow,
  "id" | "created_at" | "order_count" | "open_orders"
> & { id?: string; order_count?: number; open_orders?: number };

export type OrderInsert = Omit<OrderRow, "id" | "created_at" | "order_no"> & {
  id?: string;
  order_no?: number | null;
};

export type DriverInsert = Omit<DriverRow, "id" | "created_at" | "role"> & {
  id?: string;
  role?: string;
};

export type DriverAvailabilityInsert = Omit<
  DriverAvailabilityRow,
  "id" | "updated_at"
> & { id?: string };

export type InviteTokenInsert = Omit<
  InviteTokenRow,
  "id" | "created_at" | "used_at" | "used_by"
> & { id?: string; used_at?: string | null; used_by?: string | null };

/* ---------- Typed Database (for createClient<Database>()) ----------
   WICHTIG: `type`, NICHT `interface`. Ein interface ohne Index-Signatur
   ist nicht dem internen `Record<string, GenericSchema>`-Constraint von
   postgrest-js zuweisbar → Tabellen kollabieren auf `never` (genau der
   `never[]`-Insert-Fehler). `supabase gen types` erzeugt ebenfalls `type`. */
export type Database = {
  // Pflicht ab supabase-js ≥ 2.74 — sonst resolved alles zu `never`.
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      customers: {
        Row: CustomerRow;
        Insert: CustomerInsert;
        Update: Partial<CustomerInsert>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: OrderInsert;
        Update: Partial<OrderInsert>;
        Relationships: [];
      };
      memberships: {
        Row: MembershipRow;
        Insert: MembershipRow;
        Update: Partial<Pick<MembershipRow, "role">>;
        Relationships: [];
      };
      tenants: {
        Row: TenantRow;
        Insert: Pick<TenantRow, "name"> & Partial<TenantRow>;
        Update: Partial<TenantRow>;
        Relationships: [];
      };
      drivers: {
        Row: DriverRow;
        Insert: DriverInsert;
        Update: Partial<DriverInsert>;
        Relationships: [];
      };
      driver_availabilities: {
        Row: DriverAvailabilityRow;
        Insert: DriverAvailabilityInsert;
        Update: Partial<DriverAvailabilityInsert>;
        Relationships: [];
      };
      invite_tokens: {
        Row: InviteTokenRow;
        Insert: InviteTokenInsert;
        Update: Partial<InviteTokenInsert>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

/* ============================================================
   View-models — the shapes orders.tsx / customers.tsx consume
   ============================================================ */
export interface OrderDriverVM {
  id: string;
  name: string;
  phone: string;
  city: string;
  type: string;
}

export interface OrderVM {
  /** Supabase PK (uuid) — used for every mutation. */
  id: string;
  /** Human-readable order number (e.g. 548197) — used for display/sort. */
  orderNo: number;
  mvNr: string;
  plate: string;
  plateRaw: string;
  model: string;
  vin: string;
  customerId: string | null;
  auftraggeber: string;
  from: { city: string; plz: string; street: string };
  to: { city: string; plz: string; street: string };
  pickupDate: string | null;
  pickupWindow: string | null;
  deliveryDate: string | null;
  status: string;
  driver: OrderDriverVM | null;
  jobType: string | null;
  bundesland: string;
  price: number;
  priceSelbst: number;
  km: number;
  refuel: boolean;
  arbeitsnachweis: string | null;
  created: string;
}

export interface CustomerVM {
  id: string;
  displayId: string;
  name: string;
  short: string;
  email: string;
  phone: string;
  land: string;
  city: string;
  street: string;
  plz: string;
  contacts: CustomerContact[];
  dispoAusland: string;
  durchfuehrung: string;
  rechnung: string;
  orders: number;
  openOrders: number;
}

/* ---------- Row → view-model mappers ---------- */
export function rowToOrderVM(r: OrderRow): OrderVM {
  return {
    id: r.id,
    orderNo: r.order_no ?? 0,
    mvNr: r.mv_nr ?? "",
    plate: r.plate ?? "",
    plateRaw: r.plate ?? "",
    model: r.model ?? "",
    vin: r.vin ?? "",
    customerId: r.customer_id,
    auftraggeber: r.auftraggeber ?? "",
    from: { city: r.from_city ?? "", plz: r.from_plz ?? "", street: r.from_street ?? "" },
    to: { city: r.to_city ?? "", plz: r.to_plz ?? "", street: r.to_street ?? "" },
    pickupDate: r.pickup_date,
    pickupWindow: r.pickup_window,
    deliveryDate: r.delivery_date,
    status: r.status,
    driver: r.driver_id
      ? {
          id: r.driver_id,
          name: r.driver_name ?? "",
          phone: r.driver_phone ?? "",
          city: r.driver_city ?? "",
          type: r.job_type ?? "",
        }
      : null,
    jobType: r.job_type,
    bundesland: r.bundesland ?? "",
    price: Number(r.price ?? 0),
    priceSelbst: Number(r.price_selbst ?? 0),
    km: Number(r.km ?? 0),
    refuel: !!r.refuel,
    arbeitsnachweis: r.arbeitsnachweis,
    created: r.created_at,
  };
}

export function rowToCustomerVM(r: CustomerRow): CustomerVM {
  return {
    id: r.id,
    displayId: r.display_id ?? r.id.slice(0, 8),
    name: r.name,
    short: r.short_name ?? r.name,
    email: r.email ?? "",
    phone: r.phone ?? "",
    land: r.land ?? "Deutschland",
    city: r.city ?? "",
    street: r.street ?? "",
    plz: r.plz ?? "",
    contacts: Array.isArray(r.contacts) ? r.contacts : [],
    dispoAusland: r.dispo_ausland ?? "",
    durchfuehrung: r.durchfuehrung ?? "",
    rechnung: r.rechnung ?? "",
    orders: Number(r.order_count ?? 0),
    openOrders: Number(r.open_orders ?? 0),
  };
}

/* ---------- Standard action response envelope ---------- */
export interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

/* ---------- Action input payloads (from the UI forms) ---------- */
export interface CreateOrderInput {
  mvNr?: string;
  plate?: string;
  model?: string;
  vin?: string;
  customerId?: string | null;
  auftraggeber?: string;
  fromCity?: string;
  fromPlz?: string;
  fromStreet?: string;
  toCity?: string;
  toPlz?: string;
  toStreet?: string;
  pickupDate?: string;
  deliveryDate?: string;
  bundesland?: string;
  price?: string | number;
  priceSelbst?: string | number;
  km?: string | number;
  refuel?: boolean;
  status?: string;
}

export interface AssignDriverInput {
  id: string;
  name: string;
  phone?: string;
  city?: string;
  type?: string;
}

export interface CreateCustomerInput {
  id?: string;
  name: string;
  short?: string;
  email?: string;
  phone?: string;
  land?: string;
  city?: string;
  street?: string;
  plz?: string;
  contacts?: CustomerContact[];
  dispoAusland?: string;
  durchfuehrung?: string;
  rechnung?: string;
}
