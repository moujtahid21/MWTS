/* ============================================================
   MW Transport Service — Active tenant resolver
   ------------------------------------------------------------
   Resolves the tenant_id for the authenticated user. RLS already
   guarantees isolation at the database level; we resolve the id in
   application code too so INSERTs can stamp the correct tenant_id
   and reads can be explicit about scope.

   Resolution order:
     1. JWT `app_metadata.tenant_id` (set on invite / login) — no extra query.
     2. Fallback lookup in the `memberships` table.
   ============================================================ */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

export async function getActiveTenantId(
  supabase: SupabaseClient<Database>,
): Promise<string | null> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const metaTenant = (user.app_metadata as Record<string, unknown> | undefined)?.tenant_id;
  if (typeof metaTenant === "string" && metaTenant.length > 0) {
    return metaTenant;
  }

  const { data } = await supabase
    .from("memberships")
    .select("tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return data?.tenant_id ?? null;
}
