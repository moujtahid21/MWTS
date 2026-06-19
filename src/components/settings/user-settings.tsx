"use client";

/* ============================================================
   MW Transport Service — Einstellungen: Nutzerverwaltung
   src/components/settings/user-settings.tsx
   ------------------------------------------------------------
   Tab-Inhalt für die Settings-Seite. Listet Tenant-Nutzer und öffnet
   das Einladungs-Modal. Einladung läuft über die Server Action
   inviteUser → Supabase Invite-Mail. Nur für Admins sichtbar/aufrufbar
   (die Server Action prüft die Rolle zusätzlich serverseitig).
   ============================================================ */
import { useEffect, useState, useTransition, useActionState } from "react";
import { Icon } from "@/components/icon";
import { Avatar, Modal, Field, useToast } from "@/components/ui";
import {
  inviteUser,
  listTenantUsers,
  type InviteState,
  type TenantUser,
  type InviteRole,
} from "@/actions/user-actions";

const ROLE_OPTIONS: { value: InviteRole; label: string; desc: string; icon: string }[] = [
  { value: "admin", label: "Administrator", desc: "Voller Zugriff · Mandant, Branding, Nutzer", icon: "shield" },
  { value: "dispatcher", label: "Disponent", desc: "Aufträge, Kunden, Fahrer & Planung", icon: "route" },
  { value: "driver", label: "Fahrer", desc: "Fahrer-Portal · Verfügbarkeit, Stempeluhr, Belege", icon: "truck" },
];

const ROLE_BADGE: Record<string, { label: string; cls: string }> = {
  owner: { label: "Inhaber", cls: "purple" },
  admin: { label: "Administrator", cls: "info" },
  dispatcher: { label: "Disponent", cls: "ok" },
  driver: { label: "Fahrer", cls: "warn" },
};

const initialInvite: InviteState = { ok: false, error: null, message: null };

function InviteModal({ onClose, onDone }: { onClose: () => void; onDone: (msg: string) => void }) {
  const [role, setRole] = useState<InviteRole>("driver");
  const [state, formAction, pending] = useActionState(inviteUser, initialInvite);

  useEffect(() => {
    if (state.ok && state.message) onDone(state.message);
  }, [state.ok, state.message]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal
      title="Nutzer einladen"
      sub="Per E-Mail einladen — der Nutzer legt sein Passwort selbst fest"
      onClose={onClose}
      footer={
        <>
          {state.error && <span style={{ color: "var(--danger-fg)", fontSize: 12.5, fontWeight: 600, marginRight: "auto" }}>{state.error}</span>}
          <button className="btn" onClick={onClose} type="button">Abbrechen</button>
          <button className="btn btn-primary" type="submit" form="invite-form" disabled={pending}>
            <Icon name="mail" size={16} />{pending ? "Senden …" : "Einladung senden"}
          </button>
        </>
      }
    >
      <form id="invite-form" action={formAction}>
        <input type="hidden" name="role" value={role} />
        <div className="grid2">
          <Field label="Vollständiger Name" req><input className="input" name="name" required placeholder="Max Mustermann" /></Field>
          <Field label="E-Mail-Adresse" req><input className="input" name="email" type="email" required placeholder="max@firma.de" /></Field>
          <Field label="Telefon"><input className="input" name="phone" placeholder="+49 …" /></Field>
          <Field label="Stadt"><input className="input" name="city" placeholder="Düsseldorf" /></Field>
        </div>

        <div className="field" style={{ marginTop: "var(--gap)" }}>
          <label>Rolle<span className="req">*</span></label>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {ROLE_OPTIONS.map((r) => {
              const on = role === r.value;
              return (
                <button
                  type="button"
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, textAlign: "left", cursor: "pointer",
                    padding: "11px 13px", borderRadius: "var(--r)", font: "inherit",
                    border: "1.5px solid " + (on ? "var(--color-primary)" : "var(--border)"),
                    background: on ? "var(--color-primary-soft)" : "var(--surface)",
                  }}
                >
                  <span className="grid" style={{ width: 34, height: 34, placeItems: "center", borderRadius: 9, flex: "0 0 34px", background: on ? "var(--color-primary)" : "var(--surface-3)", color: on ? "#fff" : "var(--fg-3)" }}>
                    <Icon name={r.icon} size={17} />
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontWeight: 650, fontSize: 13.5 }}>{r.label}</span>
                    <span className="t-mut" style={{ fontSize: 12 }}>{r.desc}</span>
                  </span>
                  <span className={"checkbox" + (on ? " on" : "")} style={{ borderRadius: 99 }}>{on && <Icon name="check" size={13} sw={3} />}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-sm" style={{ marginTop: "var(--gap)", padding: "10px 13px", background: "var(--info-bg)", color: "var(--info-fg)", borderRadius: "var(--r)", fontSize: 12, fontWeight: 550 }}>
          <Icon name="info" size={15} />Der Nutzer erhält eine E-Mail mit Einladungslink und setzt sein Passwort selbst. Daten werden dem aktuellen Mandanten zugeordnet.
        </div>
      </form>
    </Modal>
  );
}

export function UserSettings() {
  const toast = useToast();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, startLoad] = useTransition();
  const [showInvite, setShowInvite] = useState(false);

  const reload = () => startLoad(async () => setUsers(await listTenantUsers()));
  useEffect(() => { reload(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="card">
      <div className="card-head">
        <div style={{ flex: 1 }}><h3>Nutzer &amp; Einladungen</h3><span className="sub">Mitglieder dieses Mandanten · {users.length}</span></div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowInvite(true)}><Icon name="plus" size={15} />Nutzer einladen</button>
      </div>

      <div className="tbl-wrap">
        <table className="tbl">
          <thead><tr><th>Name</th><th>E-Mail</th><th>Rolle</th><th style={{ textAlign: "center" }}>Status</th></tr></thead>
          <tbody>
            {loading && users.length === 0 && (
              <tr><td colSpan={4} className="t-mut" style={{ textAlign: "center", padding: 24 }}>Lädt …</td></tr>
            )}
            {!loading && users.length === 0 && (
              <tr><td colSpan={4} className="t-mut" style={{ textAlign: "center", padding: 24 }}>Noch keine Nutzer · lade die ersten ein</td></tr>
            )}
            {users.map((u) => {
              const rb = ROLE_BADGE[u.role] ?? { label: u.role, cls: "" };
              return (
                <tr key={u.user_id}>
                  <td><div className="flex items-center gap-sm"><Avatar name={u.name} size={28} /><span className="t-strong" style={{ fontSize: 13 }}>{u.name}</span></div></td>
                  <td className="t-mut" style={{ fontSize: 13 }}>{u.email}</td>
                  <td><span className={"badge " + rb.cls}>{rb.label}</span></td>
                  <td style={{ textAlign: "center" }}>
                    {u.status === "aktiv"
                      ? <span className="badge ok"><span className="dot" />aktiv</span>
                      : <span className="badge warn"><Icon name="clock" size={11} />eingeladen</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showInvite && (
        <InviteModal
          onClose={() => setShowInvite(false)}
          onDone={(msg) => { setShowInvite(false); toast(msg, "mail"); reload(); }}
        />
      )}
    </div>
  );
}
