/* ============================================================
   MW Transport Service — Fahrer-Portal Layout
   src/app/(driver)/layout.tsx
   ------------------------------------------------------------
   Gemeinsame Shell für alle Fahrer-Routen unter /fahrer/*.

   Server Component: löst den angemeldeten User serverseitig auf und
   reicht ein schlankes `driver`-Profil an die Client-Shell weiter
   (Sidebar/Topbar/Bottom-Nav brauchen usePathname + Link → Client).

   Der RBAC-Gate in lib/supabase/proxy.ts stellt bereits sicher,
   dass NUR Fahrer (role === "driver") hier landen — dieses Layout muss
   die Rolle also nicht erneut prüfen.

   Phase 3: Profilfelder (Name, Team, Vertragsstunden) aus der
   `drivers`-/Profil-Tabelle joinen; aktuell aus user_metadata gemockt.
   ============================================================ */
import { ToastProvider } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { DriverShell, type DriverProfile } from "@/components/layout/driver-shell";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // TODO Phase 3: select name/team/role from drivers/profile (tenant-scoped via RLS).
  const meta = (user?.user_metadata ?? {}) as Record<string, string>;
  const driver: DriverProfile = {
    name: meta.full_name ?? meta.name ?? "Fahrer",
    email: user?.email ?? "",
    roleLabel: "Fahrer",
  };

  return (
    <ToastProvider>
      <DriverShell driver={driver}>{children}</DriverShell>
    </ToastProvider>
  );
}
