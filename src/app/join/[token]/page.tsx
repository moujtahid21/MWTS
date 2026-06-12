/* ============================================================
   /join/[token] — Einmal-Einladungslink einlösen
   ------------------------------------------------------------
   Liegt außerhalb der (dashboard)/(driver)-Gruppen → kein Chrome.
   MUSS in der Middleware als öffentlich gelten (Prefix /join), damit
   nicht angemeldete neue Mitglieder die Seite erreichen.
   ============================================================ */
import type { Metadata } from "next";
import { getInviteToken } from "@/actions/invite-token-actions";
import { JoinForm } from "./join-form";

export const metadata: Metadata = { title: "Einladung annehmen — MW Transport Service" };

export default async function JoinPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const info = await getInviteToken(token);

  const reasonText: Record<string, string> = {
    not_found: "Dieser Einladungslink ist ungültig.",
    used: "Dieser Einladungslink wurde bereits verwendet.",
    expired: "Dieser Einladungslink ist abgelaufen.",
  };
  const roleLabel: Record<string, string> = { admin: "Administrator", dispatcher: "Disponent", driver: "Fahrer" };

  return (
    <div className="login-screen">
      <div className="login-card card">
        <div className="login-brand">
          <span className="login-mark" aria-hidden="true">MW</span>
          <div className="login-brand-text">
            <div className="login-title">MW Transport Service</div>
            <div className="login-sub">Einladung annehmen</div>
          </div>
        </div>

        {info.valid ? (
          <>
            <h1 className="login-heading">Konto erstellen</h1>
            <p className="login-lead">
              Du wurdest zu <b>{info.tenantName}</b> als <b>{roleLabel[info.role!]}</b> eingeladen.
              Lege dein Konto an, um loszulegen.
            </p>
            <JoinForm token={token} presetEmail={info.email ?? ""} />
          </>
        ) : (
          <>
            <h1 className="login-heading">Einladung ungültig</h1>
            <p className="login-lead">{reasonText[info.reason ?? "not_found"]}</p>
            <a href="/login" className="btn btn-primary login-submit" style={{ textDecoration: "none", textAlign: "center" }}>
              Zur Anmeldung
            </a>
          </>
        )}
      </div>
      <p className="login-foot">© 2026 MW Transport Service · Multi-Tenant Logistik</p>
    </div>
  );
}
