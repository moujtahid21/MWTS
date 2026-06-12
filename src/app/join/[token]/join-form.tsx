"use client";

/* ============================================================
   MW Transport Service — Join-Formular (Token einlösen)
   src/app/join/[token]/join-form.tsx
   ------------------------------------------------------------
   Legt via redeemInviteToken Konto + Mitgliedschaft an. Bei Erfolg
   meldet sich der Nutzer direkt mit den eben gesetzten Daten an und
   wird rollenrichtig weitergeleitet (Middleware übernimmt das Routing).
   ============================================================ */
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { redeemInviteToken, type RedeemState } from "@/actions/invite-token-actions";
import { createClient } from "@/lib/supabase/client";

const initial: RedeemState = { ok: false, error: null };

export function JoinForm({ token, presetEmail }: { token: string; presetEmail: string }) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(redeemInviteToken, initial);
  const [email, setEmail] = useState(presetEmail);
  const [password, setPassword] = useState("");
  const [signingIn, setSigningIn] = useState(false);

  // Nach erfolgreichem Anlegen direkt einloggen → Middleware leitet weiter.
  useEffect(() => {
    if (!state.ok) return;
    setSigningIn(true);
    (async () => {
      const supabase = createClient();
      await supabase.auth.signInWithPassword({ email, password });
      router.replace("/");
      router.refresh();
    })();
  }, [state.ok]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <form action={formAction} className="login-form">
      <input type="hidden" name="token" value={token} />
      {state.error && <div className="login-alert" role="alert">{state.error}</div>}

      <div className="field">
        <label htmlFor="name">Vollständiger Name</label>
        <input id="name" name="name" className="input" required placeholder="Max Mustermann" autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor="email">E-Mail</label>
        <input id="email" name="email" type="email" className="input" required value={email}
          onChange={(e) => setEmail(e.target.value)} placeholder="max@firma.de" autoComplete="email" />
      </div>
      <div className="field">
        <label htmlFor="password">Passwort festlegen</label>
        <input id="password" name="password" type="password" className="input" required value={password}
          onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
      </div>

      <button type="submit" className="btn btn-primary login-submit" disabled={pending || signingIn}>
        {pending ? "Konto wird erstellt …" : signingIn ? "Anmeldung …" : "Konto erstellen & beitreten"}
      </button>
    </form>
  );
}
