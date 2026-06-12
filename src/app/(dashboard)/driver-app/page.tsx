/* ============================================================
   /(dashboard)/driver-app — Fahrer-Portal-Vorschau für Disponenten
   ------------------------------------------------------------
   Liegt in der (dashboard)-Route-Group → trägt die Disponenten-Sidebar.
   Rendert die echten Fahrer-Views in einem Phone-Frame (Mock-Modus).
   ============================================================ */
import { DriverPortalPreview } from "@/components/driver/driver-portal-preview";

export const metadata = { title: "Fahrer-Portal · Vorschau" };

export default function DriverAppPreviewPage() {
  return <DriverPortalPreview />;
}
