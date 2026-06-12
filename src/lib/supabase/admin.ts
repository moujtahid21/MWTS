/* ============================================================
   MW Transport Service — Supabase Admin Client (Service Role)
   src/lib/supabase/admin.ts
   ------------------------------------------------------------
   NUR serverseitig verwenden (Server Actions / Route Handler).
   Nutzt den SERVICE_ROLE_KEY und UMGEHT damit Row Level Security —
   deshalb niemals in Client-Code importieren und vor jeder Nutzung
   die Berechtigung des Aufrufers (Admin-Rolle) explizit prüfen.

   Benötigt in .env.local:
     SUPABASE_SERVICE_ROLE_KEY=...   (Project Settings → API → service_role)
   ============================================================ */
import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL fehlen — Admin-Client nicht verfügbar.",
    );
  }
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
