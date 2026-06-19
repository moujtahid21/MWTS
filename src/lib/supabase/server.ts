/* ============================================================
   MW Transport Service — Supabase server client (@supabase/ssr)
   ------------------------------------------------------------
   Reads the session from the request cookies so every query runs
   AS the authenticated user. Combined with Row Level Security
   (see supabase/schema.sql) this is what enforces tenant isolation.
   Use ONLY in Server Components, Route Handlers and Server Actions.
   NOTE: `cookies()` is async in Next.js 15+ — this factory is async too,
   so every caller must `await createClient()`.

   BUILD-FIX (supabase-js ≥ 2.74 / ssr): die Generic-Weiterleitung in
   `createServerClient<Database>` aus @supabase/ssr ist fehlerhaft und
   lässt alle Queries auf `never` kollabieren ("not assignable to
   parameter of type 'never[]'", siehe supabase-js #1738). Der reguläre
   SupabaseClient<Database>-Typ aus @supabase/supabase-js ist dagegen
   korrekt — daher casten wir die Instanz darauf. Laufzeitverhalten
   bleibt identisch (es ist derselbe Client), nur die TYPEN werden geheilt.
   ============================================================ */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  const client = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // `setAll` was called from a Server Component where cookies are
            // read-only. The session is refreshed in proxy instead, so
            // this can be safely ignored.
          }
        },
      },
    },
  );

  // Heal the broken ssr generic by re-typing as the (correct) supabase-js client.
  return client as unknown as SupabaseClient<Database>;
}
