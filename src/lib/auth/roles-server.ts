/* ============================================================
   MW Transport Service — Rollen-Resolver (serverseitig)
   ------------------------------------------------------------
   Eine Quelle für „welche Rolle hat der aktuelle User", nutzbar in
   Server Actions, Server Components und Middleware.

   Auflösungsreihenfolge:
     1. JWT-Claim `app_metadata.role`  (gesetzt vom Custom Access Token
        Hook, siehe supabase/access-token-hook.sql) — kein DB-Zugriff.
     2. Fallback: einmalige `memberships`-Query (greift nur, solange der
        Hook noch nicht aktiv ist).
   ============================================================ */
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

type DB = SupabaseClient<Database>;

/** Rolle aus den JWT-Claims (app_metadata.role) — synchron, ohne Query. */
export function roleFromClaims(user: User | null | undefined): string | null {
  const r = (user?.app_metadata as Record<string, unknown> | undefined)?.role;
  return typeof r === "string" && r.length > 0 ? r : null;
}

/**
 * Vollständige Auflösung inkl. Fallback. Default 'dispatcher', damit ein
 * unbekannter Zustand niemals versehentlich das Fahrer-Portal freigibt.
 */
export async function getUserRole(supabase: DB): Promise<string> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "dispatcher";

  const claim = roleFromClaims(user);
  if (claim) return claim;

  const { data } = await supabase
    .from("memberships")
    .select("role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return data?.role ?? "dispatcher";
}
