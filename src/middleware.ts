/* ============================================================
   MW Transport Service — Next.js middleware
   ------------------------------------------------------------
   Runs on every matched request to keep the Supabase session fresh
   and enforce authentication (see lib/supabase/middleware.ts).
   ============================================================ */
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     *  - _next/static, _next/image (build assets)
     *  - favicon and common static image/font files
     * The auth check itself decides which of the remaining routes are public.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?)$).*)",
  ],
};
