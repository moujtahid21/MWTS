/* ============================================================
   MW Transport Service — Supabase server client (@supabase/ssr)
   ------------------------------------------------------------
   Reads the session from the request cookies so every query runs
   AS the authenticated user. Combined with Row Level Security
   (see supabase/schema.sql) this is what enforces tenant isolation.
   Use ONLY in Server Components, Route Handlers and Server Actions.
   NOTE: `cookies()` is async in Next.js 15+ — this factory is async too,
   so every caller must `await createClient()`.
   ============================================================ */
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
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
            // read-only. The session is refreshed in middleware instead, so
            // this can be safely ignored.
          }
        },
      },
    },
  );
}
