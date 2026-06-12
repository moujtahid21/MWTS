/* ============================================================
   MW Transport Service — Next.js Proxy (vormals middleware)
   src/proxy.ts
   ------------------------------------------------------------
   Next.js 16 hat die `middleware`-Konvention in `proxy` umbenannt:
   die Datei heißt jetzt proxy.ts und MUSS eine Funktion `proxy`
   (oder einen Default-Export) bereitstellen.

   Bleibt ein schlanker Delegator — die eigentliche Auth- + RBAC-Logik
   (inkl. Role-Check) lebt in lib/supabase/middleware.ts und nutzt den
   einen, bereits vorhandenen getUser()-Call wieder.
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
