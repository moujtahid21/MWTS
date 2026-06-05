/* ============================================================
   MW Transport Service — Supabase browser client (@supabase/ssr)
   ------------------------------------------------------------
   For client-side reads / Realtime subscriptions. Mutations should
   still go through the tenant-scoped Server Actions in src/actions.
   ============================================================ */
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
