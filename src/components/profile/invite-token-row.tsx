"use client";

/* ============================================================
   MW Transport Service — Profil: Einmal-Einladungstoken
   src/components/profile/invite-token-row.tsx
   ------------------------------------------------------------
   Ersetzt die statische „Framer-Einladungstoken"-Zeile. „Erzeugen"
   ruft die Server Action createInviteToken → zeigt teilbaren Link mit
   Kopier-Button, Rollenwahl und Ablaufdatum. Nur für Admins nutzbar
   (die Server Action prüft die Rolle zusätzlich serverseitig).
   ============================================================ */
import { useState, useTransition } from "react";
import { Plus, Copy, Check, RefreshCw } from "lucide-react";
import { createInviteToken, type TokenRole, type CreateTokenResult } from "@/actions/invite-token-actions";

const ROLES: { value: TokenRole; label: string }[] = [
  { value: "driver", label: "Fahrer" },
  { value: "dispatcher", label: "Disponent" },
  { value: "admin", label: "Administrator" },
];

export function InviteTokenRow() {
  const [role, setRole] = useState<TokenRole>("driver");
  const [result, setResult] = useState<CreateTokenResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, start] = useTransition();

  const generate = () =>
    start(async () => {
      setCopied(false);
      setResult(await createInviteToken(role));
    });

  const copy = async () => {
    if (!result?.url) return;
    try {
      await navigator.clipboard.writeText(result.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "11px 13px" }}>
      <div className="flex between items-center" style={{ gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 180 }}>
          <div className="t-strong" style={{ fontSize: 13 }}>Einmal-Einladungstoken</div>
          <div className="t-mut" style={{ fontSize: 11.5 }}>Teilbarer Einmal-Link für neue Mitglieder</div>
        </div>
        <div className="flex items-center gap-sm">
          <select
            className="select"
            value={role}
            onChange={(e) => setRole(e.target.value as TokenRole)}
            style={{ height: 30, fontSize: 12.5, padding: "0 8px" }}
            aria-label="Rolle für Einladung"
          >
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <button className="btn btn-sm" onClick={generate} disabled={pending}>
            {result ? <RefreshCw size={13} /> : <Plus size={13} />}
            {pending ? "Erzeugt …" : result ? "Neu erzeugen" : "Erzeugen"}
          </button>
        </div>
      </div>

      {result?.error && (
        <div style={{ marginTop: 10, fontSize: 12, fontWeight: 600, color: "var(--danger-fg)" }}>{result.error}</div>
      )}

      {result?.ok && result.url && (
        <div style={{ marginTop: 10 }}>
          <div className="flex items-center gap-sm">
            <input className="input t-mono" readOnly value={result.url} style={{ fontSize: 12 }} onFocus={(e) => e.currentTarget.select()} />
            <button className="btn btn-sm" onClick={copy} title="Link kopieren">
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Kopiert" : "Kopieren"}
            </button>
          </div>
          <div className="t-mut" style={{ fontSize: 11, marginTop: 6 }}>
            Rolle: <b>{ROLES.find((r) => r.value === result.role)?.label}</b>
            {result.expiresAt && <> · gültig bis {new Date(result.expiresAt).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })}</>}
            {" "}· einmalig verwendbar
          </div>
        </div>
      )}
    </div>
  );
}
