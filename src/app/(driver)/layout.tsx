/* ============================================================
   MW Transport Service — Fahrer-Portal Layout
   src/app/(driver)/layout.tsx
   ------------------------------------------------------------
   Gemeinsame Shell für alle Fahrer-Routen unter /fahrer/*.
   Server Component: löst den angemeldeten Fahrer aus `drivers`
   (per user_id) auf und reicht Name/E-Mail an die Client-Shell.
   Der RBAC-Gate (proxy.ts) stellt sicher, dass nur Fahrer hier landen.
   ============================================================ */
import { ToastProvider } from "@/components/ui";
import { getDriverContext } from "@/lib/driver/driver-data";
import { DriverShell, type DriverProfile } from "@/components/layout/driver-shell";

export default async function DriverLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getDriverContext();

  const driver: DriverProfile = {
    name: ctx?.driver?.name ?? ctx?.email?.split("@")[0] ?? "Fahrer",
    email: ctx?.email ?? "",
    roleLabel: "Fahrer",
  };

  return (
    <ToastProvider>
      <DriverShell driver={driver}>{children}</DriverShell>
    </ToastProvider>
  );
}
