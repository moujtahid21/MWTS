/* ============================================================
   MW Transport Service — Supabase session middleware helper
   ------------------------------------------------------------
   Refreshes the auth token on every request (so Server Components
   always see a valid session), gates the app behind login AND enforces
   role-based access control (RBAC) between the dispatcher cockpit
   `(dashboard)` and the driver portal `(driver)` / `/fahrer/*`.

   IMPORTANT (per @supabase/ssr docs): do not run any logic between
   creating the client and calling supabase.auth.getUser(); and always
   return the `supabaseResponse` object as-is (or copy its cookies onto
   any redirect) so the refreshed auth cookies reach the browser.
   ============================================================ */
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./types";
import { roleFromClaims } from "@/lib/auth/roles-server";
import {
  DRIVER_HOME,
  STAFF_HOME,
  homeForRole,
  isDriverPath,
  isDriverRole,
} from "@/lib/roles";

/** Public routes that must stay reachable without a session. */
const PUBLIC_PREFIXES = ["/login", "/auth"];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refreshes the session cookie if needed. Do not remove. Do not add logic above.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));

  /** Build a redirect that carries the refreshed auth cookies along. */
  const redirectTo = (to: string) => {
    const url = request.nextUrl.clone();
    url.pathname = to;
    url.search = "";
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  };

  // 1) Unauthenticated → /login (preserving intended destination).
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectedFrom", pathname);
    const res = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  }

  // 2) Authenticated → Rolle aus den JWT-Claims (Custom Access Token Hook).
  //    Kein DB-Fallback hier: die Middleware läuft pro Request und muss schnell
  //    bleiben. Solange der Hook gesetzt ist, steht role im app_metadata-Claim.
  //    Default 'dispatcher' → ein fehlender Claim gibt NIE das Fahrer-Portal frei.
  if (user) {
    const role = roleFromClaims(user) ?? "dispatcher";
    const wantsDriverArea = isDriverPath(pathname);

    // Already authenticated and visiting /login or root → role home.
    if (pathname.startsWith("/login") || pathname === "/") {
      return redirectTo(homeForRole(role));
    }

    if (isDriverRole(role)) {
      // Drivers may ONLY touch the /fahrer/* portal (and public routes).
      if (!wantsDriverArea && !isPublic) {
        return redirectTo(DRIVER_HOME);
      }
    } else {
      // Staff (dispatcher/accounting/admin) must NOT enter the driver portal.
      if (wantsDriverArea) {
        return redirectTo(STAFF_HOME);
      }
    }
  }

  // Must return the (possibly cookie-mutated) response untouched.
  return supabaseResponse;
}
