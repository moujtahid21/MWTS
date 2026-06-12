"use client";

/* ============================================================
   MW Transport Service — Passwort-festlegen-Formular
   src/app/auth/set-password/set-password-form.tsx
   ------------------------------------------------------------
   Setzt das Passwort der bereits per Invite-Link hergestellten Session
   (supabase.auth.updateUser) und leitet anschließend rollenrichtig
   weiter (Fahrer → /fahrer/dashboard, Staff → /overview).
   ============================================================ */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { homeForRole } from "@/lib/roles";

export function SetPasswordForm() {
  const router = useRouter();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (pw.length < 8) { setError("Mindestens 8 Zeichen."); return; }
    if (pw !== pw2) { setError("Die Passwörter stimmen nicht überein."); return; }

    setPending(true);
    const supabase = createClient();

    const { data: updated, error: updErr } = await supabase.auth.updateUser({ password: pw });
    if (updErr) {
      setError(updErr.message.includes("session")
        ? "Sitzung abgelaufen. Bitte den Einladungslink erneut öffnen."
        : updErr.message);
      setPending(false);
      return;
    }

    // Rolle aus den Claims der frischen Session → richtige Startseite.
    const role = (updated.user?.app_metadata as Record<string, unknown> | undefined)?.role;
    router.replace(homeForRole(typeof role === "string" ? role : null));
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="login-form">
      {error && <div className="login-alert" role="alert">{error}</div>}

      <div className="field">
        <label htmlFor="pw">Neues Passwort</label>
        <input id="pw" type="password" className="input" autoComplete="new-password"
          value={pw} onChange={(e) => setPw(e.target.value)} required placeholder="••••••••" />
      </div>
      <div className="field">
        <label htmlFor="pw2">Passwort bestätigen</label>
        <input id="pw2" type="password" className="input" autoComplete="new-password"
          value={pw2} onChange={(e) => setPw2(e.target.value)} required placeholder="••••••••" />
      </div>

      <button type="submit" className="btn btn-primary login-submit" disabled={pending}>
        {pending ? "Speichern …" : "Passwort speichern & anmelden"}
      </button>
    </form>
  );
}
