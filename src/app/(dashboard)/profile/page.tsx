"use client";

import Link from "next/link";
import {
  Settings,
  LogOut,
  Pencil,
  ShieldCheck,
  KeyRound,
  Plus,
  Smartphone,
  Truck,
  ClipboardList,
  Users,
  FileText,
  Settings2,
  type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";

type Session = { dev: string; loc: string; ip: string; when: string; current?: boolean };
type Activity = { icon: LucideIcon; txt: string; when: string };

const USER = {
  name: "M. Disponent",
  role: "Administrator",
  tenant: "MW Transport Service",
  email: "m.disponent@mwt.de",
  phone: "+49 151 23456789",
  initials: "MD",
  joined: "März 2023",
  lastLogin: "Heute, 08:41 Uhr",
  tenantId: "mwt-0001",
};

const SESSIONS: Session[] = [
  { dev: "Chrome · macOS", loc: "Hamburg, DE", ip: "84.142.xx.xx", when: "Aktiv jetzt", current: true },
  { dev: "Safari · iPhone", loc: "Hamburg, DE", ip: "84.142.xx.xx", when: "vor 2 Std." },
  { dev: "Edge · Windows", loc: "Bremen, DE", ip: "91.20.xx.xx", when: "Gestern, 17:22" },
];

const ACTIVITY: Activity[] = [
  { icon: ClipboardList, txt: "Auftrag MWT-2041 freigegeben", when: "vor 12 Min." },
  { icon: Users, txt: "Fahrer T. König eingeladen", when: "vor 1 Std." },
  { icon: FileText, txt: "Arbeitsnachweis #882 bestätigt", when: "vor 3 Std." },
  { icon: Settings2, txt: "Markenfarbe geändert", when: "Gestern" },
];

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex between items-center" style={{ padding: "11px 0", borderBottom: "1px solid var(--border)" }}>
      <span className="t-mut" style={{ fontSize: 12.5 }}>{label}</span>
      <span className={"t-strong" + (mono ? " t-mono" : "")} style={{ fontSize: 13 }}>{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="view-narrow">
      <PageHeader title="Mein Profil" sub="Konto, Sicherheit und persönliche Einstellungen">
        <Link href="/settings" className="btn">
          <Settings size={15} />
          Einstellungen
        </Link>
        <button className="btn btn-danger">
          <LogOut size={15} />
          Ausloggen
        </button>
      </PageHeader>

      {/* Identity banner */}
      <div className="card card-pad" style={{ display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
        <div className="avatar" style={{ width: 68, height: 68, flexBasis: 68, borderRadius: 16, background: "var(--color-primary)", fontSize: 26 }}>
          {USER.initials}
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 21, fontWeight: 780, letterSpacing: "-.02em" }}>{USER.name}</div>
          <div className="flex items-center gap-sm wrap" style={{ marginTop: 6 }}>
            <span className="badge brand lg">{USER.role}</span>
            <span className="badge outline lg">
              <Truck size={12} />
              {USER.tenant}
            </span>
            <span className="t-mut" style={{ fontSize: 12.5 }}>Mitglied seit {USER.joined}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="t-mut" style={{ fontSize: 11.5 }}>Letzter Login</div>
          <div className="t-strong" style={{ fontSize: 13, marginTop: 3 }}>{USER.lastLogin}</div>
        </div>
      </div>

      <div className="grid2" style={{ marginTop: "var(--gap)", alignItems: "start" }}>
        {/* Account */}
        <div className="card">
          <div className="card-head">
            <div style={{ flex: 1 }}>
              <h3>Kontodaten</h3>
              <span className="sub">Persönliche Angaben</span>
            </div>
            <button className="btn btn-sm">
              <Pencil size={14} />
              Bearbeiten
            </button>
          </div>
          <div className="card-pad" style={{ paddingTop: 4, paddingBottom: 8 }}>
            <Row label="Name" value={USER.name} />
            <Row label="E-Mail" value={USER.email} mono />
            <Row label="Telefon" value={USER.phone} mono />
            <Row label="Rolle" value={USER.role} />
            <div className="flex between items-center" style={{ padding: "11px 0" }}>
              <span className="t-mut" style={{ fontSize: 12.5 }}>Mandant (tenant_id)</span>
              <span className="t-strong t-mono" style={{ fontSize: 13 }}>{USER.tenantId}</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="card">
          <div className="card-head">
            <div style={{ flex: 1 }}>
              <h3>Sicherheit</h3>
              <span className="sub">Anmeldung &amp; 2-Faktor</span>
            </div>
          </div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="flex between items-center" style={{ padding: "11px 13px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--ok-bg)" }}>
              <div className="flex items-center gap-sm">
                <ShieldCheck size={20} color="var(--ok-fg)" />
                <div>
                  <div className="t-strong" style={{ fontSize: 13, color: "var(--ok-fg)" }}>TOTP 2FA aktiv</div>
                  <div style={{ fontSize: 11.5, color: "var(--ok-fg)", opacity: 0.8 }}>Authenticator-App gekoppelt</div>
                </div>
              </div>
              <button className="btn btn-sm">Verwalten</button>
            </div>
            <div className="flex between items-center" style={{ padding: "11px 13px", border: "1px solid var(--border)", borderRadius: "var(--r)" }}>
              <div className="flex items-center gap-sm">
                <KeyRound size={18} color="var(--fg-3)" />
                <div>
                  <div className="t-strong" style={{ fontSize: 13 }}>Passwort</div>
                  <div className="t-mut" style={{ fontSize: 11.5 }}>Zuletzt geändert vor 3 Monaten</div>
                </div>
              </div>
              <button className="btn btn-sm">Ändern</button>
            </div>
            <div className="flex between items-center" style={{ padding: "11px 13px", border: "1px solid var(--border)", borderRadius: "var(--r)" }}>
              <div>
                <div className="t-strong" style={{ fontSize: 13 }}>Framer-Einladungstoken</div>
                <div className="t-mut" style={{ fontSize: 11.5 }}>Einmal-Token für neue Mitglieder</div>
              </div>
              <button className="btn btn-sm">
                <Plus size={13} />
                Erzeugen
              </button>
            </div>
          </div>
        </div>

        {/* Sessions */}
        <div className="card">
          <div className="card-head">
            <div style={{ flex: 1 }}>
              <h3>Aktive Sitzungen</h3>
              <span className="sub">{SESSIONS.length} Geräte</span>
            </div>
            <button className="btn btn-sm btn-danger">Alle abmelden</button>
          </div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {SESSIONS.map((s, i) => (
              <div key={i} className="flex items-center gap-sm" style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--r)" }}>
                <Smartphone size={16} color="var(--fg-3)" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="t-strong" style={{ fontSize: 12.5 }}>
                    {s.dev}
                    {s.current ? <span className="badge ok" style={{ marginLeft: 6 }}>Dieses Gerät</span> : null}
                  </div>
                  <div className="t-mut t-mono" style={{ fontSize: 11 }}>{s.loc} · {s.ip}</div>
                </div>
                <span className="t-mut" style={{ fontSize: 11.5 }}>{s.when}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="card">
          <div className="card-head">
            <div style={{ flex: 1 }}>
              <h3>Letzte Aktivität</h3>
              <span className="sub">Dein Audit-Log</span>
            </div>
          </div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {ACTIVITY.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex items-center gap-sm" style={{ padding: "10px 0", borderBottom: i < ACTIVITY.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <Icon size={16} color="var(--color-primary)" />
                  <div style={{ flex: 1 }} className="t-strong">{a.txt}</div>
                  <span className="t-mut" style={{ fontSize: 11.5 }}>{a.when}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
