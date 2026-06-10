/* ============================================================
   MW Transport Service — Rollen & RBAC-Konstanten
   ------------------------------------------------------------
   Single source of truth für die rollenbasierte Trennung zwischen
   dem Fahrer-Portal (Route Group `(driver)`, URL-Präfix `/fahrer`)
   und dem Disponenten-Cockpit (Route Group `(dashboard)`).

   Die Rolle liegt in `public.memberships.role` (Default 'dispatcher',
   siehe supabase/schema.sql). Im Hot Path lesen wir sie aus dem JWT
   (`app_metadata.role`) — analog zu tenant.ts — und fallen nur dann
   auf eine DB-Query zurück, wenn der Claim fehlt.
   ============================================================ */

/** Rolle, die das Fahrer-Portal sieht. */
export const DRIVER_ROLE = "driver" as const;

/** Rollen, die das Disponenten-/Verwaltungs-Cockpit sehen. */
export const STAFF_ROLES = ["dispatcher", "accounting", "admin", "owner"] as const;

export type AppRole = typeof DRIVER_ROLE | (typeof STAFF_ROLES)[number] | (string & {});

/** URL-Präfix des Fahrer-Portals. Route Groups erzeugen kein URL-Segment,
 *  daher trennen wir die Bereiche über diesen echten Pfad-Präfix, um die
 *  Kollision von `(dashboard)/orders` und `(driver)/orders` zu vermeiden. */
export const DRIVER_PREFIX = "/fahrer";

/** Standard-Landeseiten nach dem Login je Rolle. */
export const DRIVER_HOME = "/fahrer/dashboard";
export const STAFF_HOME = "/overview";

export function isDriverRole(role: string | null | undefined): boolean {
  return role === DRIVER_ROLE;
}

/** Liegt der Pfad im Fahrer-Bereich? */
export function isDriverPath(pathname: string): boolean {
  return pathname === DRIVER_PREFIX || pathname.startsWith(DRIVER_PREFIX + "/");
}

/** Landeseite passend zur Rolle. */
export function homeForRole(role: string | null | undefined): string {
  return isDriverRole(role) ? DRIVER_HOME : STAFF_HOME;
}
