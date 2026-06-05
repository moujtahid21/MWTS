import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { ToastProvider } from "@/components/ui";

/**
 * Shared application shell for every authenticated dispatcher route.
 *
 * This is the common `layout.tsx` requested: the Sidebar + Topbar are rendered
 * once here and persist across navigations between the child route segments
 * (`overview`, `orders`, `map`, `clients`, `drivers`, `parking`, `calendar`,
 * `shiftplanner`, `documents`, `information`, `settings`, `profile`). Only the
 * `{children}` slot re-renders when the route changes.
 *
 * KPI badge counts would be fetched here as a Server Component (Supabase,
 * tenant-scoped via RLS) and passed to the Sidebar. Stubbed for now.
 */
async function getNavBadges(): Promise<Record<string, number>> {
  // TODO: replace with tenant-scoped Supabase query.
  // const supabase = createServerClient();
  // const { count } = await supabase.from("orders").select("*", { count: "exact", head: true }).is("driver_id", null);
  return { unassigned: 1370 };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const badges = await getNavBadges();

  return (
    <div className="app">
      <Sidebar badges={badges} />
      <div className="main">
        <Topbar />
        <main className="view">
          <ToastProvider>{children}</ToastProvider>
        </main>
      </div>
    </div>
  );
}
