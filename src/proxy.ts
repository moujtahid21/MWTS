/* ============================================================
   MW Transport Service — Next.js proxy  (UNVERÄNDERT)
   ------------------------------------------------------------
   Bleibt ein schlanker Delegator. Die eigentliche Auth- + RBAC-Logik
   (inkl. Role-Check) lebt in lib/supabase/proxy.ts, damit sie den
   einen, bereits vorhandenen getUser()-Call wiederverwendet.
   ============================================================ */
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *  - _next/static, _next/image (build assets)
     *  - favicon and common static image/font files
     * The auth/role check itself decides which of the remaining routes are public.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
