"use client";

/* MW Transport Service — Einstellungen (White-Label, RBAC, Sicherheit) + Preisliste.
   Ported from app/settings.jsx; brand & label now bind to the Zustand tenant store. */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Icon } from "@/components/icon";
import {
  Avatar, Plate, StatusBadge, TypeBadge, Modal, useToast, Sparkline, MiniBars,
  Donut, Field, Switch, Check, Menu, PageHead, Empty, fmtDate, fmtEur,
} from "@/components/ui";
import { MWDATA } from "@/lib/data";
import { useAppNav } from "@/lib/use-app-nav";
import { useTenantStore, BRAND_PRESETS } from "@/lib/store/use-tenant-store";
import {UserSettings} from "@/components/settings/user-settings";

export function Settings() {
  const toast = useToast();
  const brandKey = useTenantStore((st) => st.brand);
  const setBrandStore = useTenantStore((st) => st.setBrand);
  const label = useTenantStore((st) => st.label);
  const setLabel = useTenantStore((st) => st.setLabel);
  const brand = BRAND_PRESETS[brandKey] || BRAND_PRESETS["Grün"];
  const setBrand = ({ h }) => {
    const entry = Object.values(BRAND_PRESETS).find((b) => b.h === h);
    if (entry) setBrandStore(entry.name);
  };
  const [tab, setTab] = useState("brand");
  const tabs = [["brand", "White-Label", "layers"], ["roles", "Rollen & Rechte", "shield"], ["security", "Sicherheit", "key"], ["tenant", "Mandant", "building"], ["users", "Nutzer", "drivers"]];
  const presets = [
    { h: 142, s: "71%", l: "38%", name: "Grün" }, { h: 217, s: "91%", l: "53%", name: "Blau" },
    { h: 173, s: "80%", l: "36%", name: "Türkis" }, { h: 245, s: "75%", l: "59%", name: "Indigo" },
    { h: 25, s: "95%", l: "53%", name: "Orange" }, { h: 350, s: "75%", l: "47%", name: "Rot" },
    { h: 271, s: "70%", l: "55%", name: "Violett" }, { h: 200, s: "18%", l: "20%", name: "Slate" },
  ];
  return (
    <div className="view-narrow">
      <PageHead title="Einstellungen" sub="Mandant, White-Label-Branding und Sicherheit" />
      <div className="flex gap" style={{ alignItems: "flex-start" }}>
        <div className="card" style={{ flex: "0 0 220px", padding: 6 }}>
          {tabs.map(([k, l, ic]) => (
            <button key={k} className="nav-item" onClick={() => setTab(k)} style={{ color: tab === k ? "var(--fg)" : "var(--fg-2)", background: tab === k ? "var(--color-primary-soft)" : "transparent", fontWeight: tab === k ? 700 : 550 }}>
              <Icon name={ic} size={17} style={{ color: tab === k ? "var(--color-primary-strong)" : "inherit" }} /><span className="nav-label">{l}</span>
            </button>
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {tab === "brand" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
              <div className="card">
                <div className="card-head"><div style={{ flex: 1 }}><h3>Markenfarbe</h3><span className="sub">Wird zur Laufzeit als <span className="kbd">--color-primary</span> injiziert</span></div></div>
                <div className="card-pad">
                  <div className="flex gap-sm wrap">
                    {presets.map(p => {
                      const on = brand.h === p.h;
                      return <button key={p.name} onClick={() => setBrand({ h: p.h, s: p.s, l: p.l })} title={p.name}
                        style={{ width: 56, height: 56, borderRadius: 12, border: on ? "3px solid var(--fg)" : "3px solid transparent", background: `hsl(${p.h} ${p.s} ${p.l})`, cursor: "pointer", boxShadow: "var(--shadow-sm)", display: "grid", placeItems: "center", color: "#fff" }}>{on && <Icon name="check" size={20} sw={3} />}</button>;
                    })}
                  </div>
                  <div className="divider" />
                  <div className="flex items-center gap" style={{ flexWrap: "wrap" }}>
                    <span className="t-mut" style={{ fontSize: 13 }}>Live-Vorschau:</span>
                    <button className="btn btn-primary">Primär-Button</button>
                    <span className="badge brand">Badge</span>
                    <div className="switch on" style={{ flex: "0 0 38px" }} />
                    <a className="link">Verlinkter Text</a>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-head"><div style={{ flex: 1 }}><h3>Erscheinungsbild</h3><span className="sub">Name & Logo des Mandanten</span></div></div>
                <div className="card-pad grid2">
                  <Field label="Anzeigename"><input className="input" value={label} onChange={e => setLabel(e.target.value)} /></Field>
                  <Field label="Kürzel (Sidebar)"><input className="input" defaultValue="MWT" maxLength={4} /></Field>
                  <div className="field col-span2"><label>Logo</label>
                    <div className="flex items-center gap">
                      <div className="brand-mark" style={{ width: 48, height: 48, borderRadius: 12 }}><Icon name="truck" size={24} /></div>
                      <button className="btn"><Icon name="upload" size={15} />Logo hochladen</button>
                      <span className="t-mut" style={{ fontSize: 12 }}>SVG oder PNG, max. 1 MB</span>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end" }}><button className="btn btn-primary" onClick={() => toast("Branding gespeichert", "check")}><Icon name="check" size={16} />Branding speichern</button></div>
            </div>
          )}

          {tab === "roles" && (
            <div className="card">
              <div className="card-head"><div style={{ flex: 1 }}><h3>Rollen & Berechtigungen (RBAC)</h3><span className="sub">Pro Mandant über Row-Level-Security getrennt</span></div></div>
              <div className="tbl-wrap"><table className="tbl">
                <thead><tr><th>Berechtigung</th><th style={{ textAlign: "center" }}>Admin</th><th style={{ textAlign: "center" }}>Disponent</th><th style={{ textAlign: "center" }}>Fahrer</th></tr></thead>
                <tbody>
                  {[["Aufträge anlegen & bearbeiten", 1, 1, 0], ["Aufträge annehmen/ablehnen", 0, 0, 1], ["Kundenstammdaten", 1, 1, 0], ["Fahrer verwalten", 1, 1, 0], ["Preislisten bearbeiten", 1, 0, 0], ["Protokolle hochladen", 1, 1, 1], ["Mandant & Branding", 1, 0, 0], ["Nutzer einladen", 1, 1, 0], ["Reports exportieren", 1, 1, 0]].map((r, i) => (
                    <tr key={i}><td className="t-strong" style={{ fontSize: 13 }}>{r[0]}</td>
                      {[1, 2, 3].map(c => <td key={c} style={{ textAlign: "center" }}>{r[c] ? <span style={{ color: "var(--ok-fg)" }}><Icon name="check" size={17} sw={3} /></span> : <span className="t-faint" style={{ color: "var(--fg-faint)" }}>—</span>}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table></div>
            </div>
          )}

          {tab === "security" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
              <div className="card">
                <div className="card-head"><div style={{ flex: 1 }}><h3>ID-Token</h3></div><span className="badge ok"><span className="dot" />aktiv</span></div>
                <div className="card-pad">
                  <p className="t-mut" style={{ fontSize: 13, marginTop: 0, lineHeight: 1.55 }}>Identifiziert den Auftragnehmer eindeutig. An den Auftraggeber senden, um als Auftragnehmer hinzugefügt zu werden.</p>
                  <div className="flex gap-sm"><input className="input t-mono" readOnly value="MWT-7F3A-9K21-DQ84-B0C5-2E19" /><button className="btn" onClick={() => toast("Token kopiert", "copy")}><Icon name="copy" size={15} /></button></div>
                </div>
              </div>
              <div className="card">
                <div className="card-head"><div style={{ flex: 1 }}><h3>Zwei-Faktor-Authentifizierung</h3><span className="sub">TOTP via Authenticator-App</span></div><span className="badge warn">empfohlen</span></div>
                <div className="card-pad flex items-center between"><span style={{ fontSize: 13 }}>2FA für alle Admin-Konten erzwingen</span><Switch on={true} onChange={() => { }} /></div>
              </div>
              <div className="card">
                <div className="card-head"><h3>Login-Daten</h3></div>
                <div className="card-pad grid2">
                  <Field label="E-Mail" span><input className="input" defaultValue="disposition@mwtransport.de" /></Field>
                  <Field label="Neues Passwort"><input className="input" type="password" placeholder="••••••••" /></Field>
                  <Field label="Passwort bestätigen"><input className="input" type="password" placeholder="••••••••" /></Field>
                </div>
                <div className="card-pad" style={{ paddingTop: 0, display: "flex", justifyContent: "flex-end" }}><button className="btn btn-primary" onClick={() => toast("Gespeichert", "check")}>Speichern</button></div>
              </div>
            </div>
          )}

          {tab === "tenant" && (
            <div className="card">
              <div className="card-head"><div style={{ flex: 1 }}><h3>Mandant (Multi-Tenant)</h3><span className="sub">DSGVO-konform · Daten je <span className="kbd">tenant_id</span> isoliert</span></div></div>
              <div className="card-pad grid2">
                <Field label="Firmenname"><input className="input" defaultValue="MW Transport Service GmbH" /></Field>
                <Field label="Mandant-ID"><input className="input t-mono" readOnly defaultValue="tnt_mw_8841" /></Field>
                <Field label="USt-IdNr."><input className="input" defaultValue="DE 312 445 778" /></Field>
                <Field label="Standard-Sprache"><select className="select"><option>Deutsch</option><option>English</option></select></Field>
                <Field label="Zeitzone"><select className="select"><option>Europe/Berlin (MEZ)</option></select></Field>
                <Field label="Datenregion"><select className="select"><option>EU (Frankfurt)</option></select></Field>
              </div>
              <div className="card-pad" style={{ paddingTop: 0 }}>
                <div className="flex items-center gap-sm" style={{ padding: "10px 14px", background: "var(--ok-bg)", color: "var(--ok-fg)", borderRadius: "var(--r)", fontSize: 12.5, fontWeight: 600 }}><Icon name="shield" size={16} />DSGVO-Auftragsverarbeitung aktiv · Aufbewahrung 10 Jahre · Auto-Löschung inaktiver Fahrerdaten nach 36 Monaten</div>
              </div>
            </div>
          )}
            {tab === "users" && <UserSettings />}
        </div>
      </div>
    </div>
  );
}

/* ============ PREISLISTE ============ */
export function Pricing() {
  const onNav = useAppNav();
  const D = MWDATA;
  const toast = useToast();
  const rows = [
    ["Standard PKW", "bis 150 km", "0,95 €/km", "45 €", "Mini Job"],
    ["Standard PKW", "150–400 km", "0,82 €/km", "45 €", "Selbständig"],
    ["Transporter / Sprinter", "bis 200 km", "1,25 €/km", "65 €", "Angestellt"],
    ["Premium / SUV", "alle", "1,10 €/km", "60 €", "Selbständig"],
    ["Überführung Ausland", "AT / CH / BeNeLux", "1,40 €/km", "120 €", "Selbständig"],
    ["Express (taggleich)", "alle", "+30 % Zuschlag", "—", "alle"],
  ];
  return (
    <div className="view-narrow">
      <PageHead title="Preisliste" sub="Tarife für Fahrer-Vergütung & Auftraggeber-Abrechnung">
        <button className="btn" onClick={() => onNav("drivers")}><Icon name="chevLeft" size={15} />Zurück zu Fahrern</button>
        <button className="btn btn-primary" onClick={() => toast("Tarif hinzugefügt", "check")}><Icon name="plus" size={16} />Tarif hinzufügen</button>
      </PageHead>
      <div className="card"><div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Fahrzeugklasse</th><th>Distanz</th><th>Kilometersatz</th><th>Grundpauschale</th><th>Standard-Fahrerart</th><th style={{ width: 60 }}></th></tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="t-strong">{r[0]}</td><td className="t-mut">{r[1]}</td>
              <td className="t-mono t-strong">{r[2]}</td><td className="t-mono">{r[3]}</td>
              <td>{r[4] === "alle" ? <span className="badge">alle</span> : <TypeBadge type={r[4]} />}</td>
              <td><button className="icon-btn sq" style={{ height: 30, minWidth: 30 }} onClick={() => toast("Tarif bearbeiten", "edit")}><Icon name="edit" size={15} /></button></td>
            </tr>
          ))}
        </tbody>
      </table></div></div>
    </div>
  );
}
