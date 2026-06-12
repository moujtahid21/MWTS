/* MW Transport Service — Login page. Sits OUTSIDE the (dashboard) group,
   so no Sidebar/Topbar. The proxy redirects authenticated users away. */
import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Anmelden — MW Transport Service" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectedFrom?: string }>;
}) {
  const { redirectedFrom } = await searchParams;
  const dest = redirectedFrom && redirectedFrom.startsWith("/") ? redirectedFrom : "/overview";

  return (
    <div className="login-screen">
      <div className="login-card card">
        <div className="login-brand">
          <span className="login-mark" aria-hidden="true">MW</span>
          <div className="login-brand-text">
            <div className="login-title">MW Transport Service</div>
            <div className="login-sub">Disposition Cockpit</div>
          </div>
        </div>

        <h1 className="login-heading">Anmelden</h1>
        <p className="login-lead">Melde dich mit deinem Dispositions-Konto an.</p>

        <LoginForm redirectedFrom={dest} />
      </div>

      <p className="login-foot">© 2026 MW Transport Service · Multi-Tenant Logistik</p>
    </div>
  );
}
