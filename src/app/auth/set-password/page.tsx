/* ============================================================
   /auth/set-password — Passwort festlegen (nach Einladung)
   ------------------------------------------------------------
   Liegt außerhalb der (dashboard)/(driver)-Gruppen → kein Chrome.
   Erreichbar nur mit gültiger Session (durch /auth/confirm gesetzt);
   ist keine Session vorhanden, schickt die Middleware auf /login.
   ============================================================ */
import type { Metadata } from "next";
import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = { title: "Passwort festlegen — MW Transport Service" };

export default function SetPasswordPage() {
  return (
    <div className="login-screen">
      <div className="login-card card">
        <div className="login-brand">
          <span className="login-mark" aria-hidden="true">MW</span>
          <div className="login-brand-text">
            <div className="login-title">MW Transport Service</div>
            <div className="login-sub">Konto aktivieren</div>
          </div>
        </div>

        <h1 className="login-heading">Passwort festlegen</h1>
        <p className="login-lead">Willkommen! Lege ein sicheres Passwort fest, um dein Konto zu aktivieren.</p>

        <SetPasswordForm />
      </div>

      <p className="login-foot">© 2026 MW Transport Service · Multi-Tenant Logistik</p>
    </div>
  );
}
