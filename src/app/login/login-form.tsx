"use client";

/* MW Transport Service — Login form (client). Uses the login Server Action
   via useActionState so the session cookie is set server-side. */
import { useActionState } from "react";
import { login, type LoginState } from "@/actions/auth-actions";

const initialState: LoginState = { error: null };

export function LoginForm({ redirectedFrom }: { redirectedFrom: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="login-form">
      <input type="hidden" name="redirectedFrom" value={redirectedFrom} />

      {state.error && (
        <div className="login-alert" role="alert">
          {state.error}
        </div>
      )}

      <div className="field">
        <label htmlFor="email">E-Mail</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="input"
          placeholder="dispo@mwtransport.de"
        />
      </div>

      <div className="field">
        <label htmlFor="password">Passwort</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="input"
          placeholder="••••••••"
        />
      </div>

      <button type="submit" className="btn btn-primary login-submit" disabled={pending}>
        {pending ? "Anmeldung läuft …" : "Anmelden"}
      </button>
    </form>
  );
}
