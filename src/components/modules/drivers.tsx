"use client";

/* MW Transport Service — ported from app/drivers.jsx. Behaviour preserved 1:1. */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Icon } from "@/components/icon";
import {
  Avatar, Plate, StatusBadge, TypeBadge, Modal, useToast, Sparkline, MiniBars,
  Donut, Field, Switch, Check, Menu, PageHead, Empty, fmtDate, fmtEur,
} from "@/components/ui";
import { MWDATA } from "@/lib/data";
import { useAppNav, useModuleInitial } from "@/lib/use-app-nav";

export function Drivers({initialDrivers, initialKpi}) {
  const onNav = useAppNav();
  const initial = useModuleInitial();
  const kpi = initialKpi??MWDATA.kpi;
  const D = MWDATA;
  const toast = useToast();
  const [list, setList] = useState(initialDrivers ?? D.drivers);
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("all");
  const [detail, setDetail] = useState(null);
  const [edit, setEdit] = useState(null);
  const [invite, setInvite] = useState(false);

  useEffect(() => { if (initial?.focus) { const d = list.find(x => x.id === initial.focus); if (d) setDetail(d); } }, [initial]);

  const filtered = list.filter(d => {
    if (fType !== "all" && d.type !== fType) return false;
    if (q) { const s = q.toLowerCase(); return d.name.toLowerCase().includes(s) || d.city.toLowerCase().includes(s) || d.email.toLowerCase().includes(s) || d.plz.includes(s); }
    return true;
  });

  const save = (data) => {
    if (data.id && list.some(d => d.id === data.id)) setList(l => l.map(d => d.id === data.id ? data : d));
    else setList(l => [{ ...data, id: "F-" + (2100 + l.length), rating: "—", trips: 0, status: "available", active: true, docs: {} }, ...l]);
    setEdit(null); toast("Fahrer gespeichert", "check");
  };

  const stt = { available: ["ok", "verfügbar"], onjob: ["purple", "unterwegs"], offduty: ["", "frei"] };

  return (
    <div>
      <PageHead title="Fahrerverwaltung" sub={list.length + " Fahrer · " + list.filter(d => d.status === "available" && d.active).length + " verfügbar"}>
        <button className="btn" onClick={() => onNav("drivers-pricing")}><Icon name="euro" size={15} />Preisliste</button>
        <button className="btn" onClick={() => toast("PDF-Report wird erstellt", "pdf")}><Icon name="pdf" size={15} />Report PDF</button>
        <button className="btn" onClick={() => toast("Excel-Report wird erstellt", "excel")}><Icon name="excel" size={15} />Report Excel</button>
        <button className="btn btn-primary" onClick={() => setEdit("new")}><Icon name="plus" size={16} />Fahrer hinzufügen</button>
      </PageHead>

      <div className="grid4" style={{ marginBottom: "var(--gap)" }}>
        {[["Gesamt", kpi.driversTotal, "", "drivers"], ["Angestellt", kpi.angestellt, "ok", "user"], ["Selbständig", kpi.selbst, "info", "building"], ["Mini Job", kpi.minijob, "warn", "clock"]].map(([l, v, c, ic]) => (
          <div key={l} className="stat"><div className="stat-ic" style={{ color: c ? `var(--${c}-fg)` : "var(--fg-3)", background: c ? `var(--${c}-bg)` : "var(--surface-3)" }}><Icon name={ic} size={17} /></div><div className="lbl">{l}</div><div className="val" style={{ color: c ? `var(--${c}-fg)` : "var(--fg)" }}>{v}</div></div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: "var(--gap)", padding: "12px var(--pad)" }}>
        <div className="flex items-center gap-sm wrap">
          <div className="search" style={{ flex: "1 1 240px", minWidth: 200 }}><Icon name="search" size={16} /><input className="input" placeholder="Fahrer, Stadt, PLZ oder E-Mail …" value={q} onChange={e => setQ(e.target.value)} /></div>
          <div className="seg">
            {["all", ...D.jobTypes].map(t => <button key={t} className={fType === t ? "on" : ""} onClick={() => setFType(t)}>{t === "all" ? "Alle" : t}</button>)}
          </div>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={() => setInvite(true)}><Icon name="qr" size={15} />Per ID-Token einladen</button>
        </div>
      </div>

      <div className="card"><div className="tbl-wrap" style={{ maxHeight: "calc(100vh - 380px)" }}>
        <table className="tbl">
          <thead><tr><th>Name</th><th>Kontakt</th><th>Stadt / PLZ</th><th>Registriert</th><th>Datenschutz</th><th>Art</th><th>Status</th><th style={{ width: 90 }}></th></tr></thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} style={{ cursor: "pointer", opacity: d.active ? 1 : .5 }} onClick={() => setDetail(d)}>
                <td><div className="flex items-center gap-sm"><Avatar name={d.name} size={32} /><div><div className="t-strong">{d.name}</div><div className="t-mut t-mono" style={{ fontSize: 10.5 }}>{d.id}{!d.active && " · inaktiv"}</div></div></div></td>
                <td><a className="link" href={"mailto:" + d.email} style={{ fontSize: 12.5 }} onClick={e => e.stopPropagation()}>{d.email}</a><div className="t-mut t-mono" style={{ fontSize: 11 }}>{d.phone}</div></td>
                <td><div className="t-strong" style={{ fontSize: 12.5 }}>{d.city}</div><div className="t-mut t-mono" style={{ fontSize: 11 }}>{d.plz}</div></td>
                <td className="t-mut t-mono" style={{ fontSize: 12 }}>{fmtDate(d.registered)}</td>
                <td><span className="badge ok"><Icon name="check" size={11} sw={3} />zugestimmt</span></td>
                <td><TypeBadge type={d.type} /></td>
                <td><span className={"badge " + stt[d.status][0]}><span className="dot" />{stt[d.status][1]}</span></td>
                <td><div className="flex" style={{ justifyContent: "flex-end", gap: 4 }} onClick={e => e.stopPropagation()}>
                  <button className="icon-btn sq" style={{ height: 30, minWidth: 30 }} onClick={() => toast("Fahrer-PDF wird erstellt", "pdf")}><Icon name="pdf" size={15} /></button>
                  <button className="icon-btn sq" style={{ height: 30, minWidth: 30 }} onClick={() => setEdit(d)}><Icon name="edit" size={15} /></button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <Empty title="Keine Fahrer gefunden" icon="drivers" />}
      </div></div>

      {detail && <DriverDetail driver={detail} onClose={() => setDetail(null)} onEdit={() => { setEdit(detail); setDetail(null); }} onAssign={() => onNav("orders")} />}
      {edit && <DriverForm D={D} driver={edit === "new" ? null : edit} onClose={() => setEdit(null)} onSave={save} />}
      {invite && <InviteToken onClose={() => setInvite(false)} toast={toast} />}
    </div>
  );
}

function DocSlot({ label, ok }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--fg-2)", marginBottom: 6 }}>{label}</div>
      <div className="muted-box" style={{ height: 96, position: "relative", borderColor: ok ? "var(--ok)" : "var(--border-strong)", background: ok ? "var(--ok-bg)" : "var(--surface-2)" }}>
        {ok ? <div style={{ textAlign: "center", color: "var(--ok-fg)" }}><Icon name="check" size={22} sw={2.5} /><div style={{ fontSize: 11, fontWeight: 600, marginTop: 4 }}>hochgeladen</div></div>
          : <div style={{ textAlign: "center" }}><Icon name="camera" size={22} /><div style={{ fontSize: 11, marginTop: 4 }}>fehlt</div></div>}
      </div>
    </div>
  );
}

function DriverDetail({ driver: d, onClose, onEdit, onAssign }) {
  const docs = [["Personalausweis Vorderseite", d.docs.perso_v], ["Personalausweis Rückseite", d.docs.perso_r], ["Führerschein Vorderseite", d.docs.fs_v], ["Führerschein Rückseite", d.docs.fs_r], ["Gewerbeanmeldung", d.docs.gewerbe], ["Nachweis USt-Pflicht", d.docs.ustvat]];
  const docCount = docs.filter(x => x[1]).length;
  return (
    <Modal title={d.name} sub={d.id + " · " + d.city} onClose={onClose}
      footer={<React.Fragment><button className="btn" onClick={onEdit}><Icon name="edit" size={15} />Bearbeiten</button><div style={{ flex: 1 }} /><button className="btn btn-primary" onClick={onAssign}><Icon name="orders" size={15} />Auftrag zuweisen</button></React.Fragment>}>
      <div className="flex items-center gap-sm" style={{ marginBottom: 16 }}>
        <Avatar name={d.name} size={52} />
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-sm"><span className="t-strong" style={{ fontSize: 16 }}>{d.name}</span><TypeBadge type={d.type} /></div>
          <div className="t-mut" style={{ fontSize: 12.5, marginTop: 2 }}>{d.email} · {d.phone}</div>
        </div>
        <div style={{ textAlign: "right" }}><div className="flex items-center gap-sm" style={{ justifyContent: "flex-end", color: "var(--warn)" }}><Icon name="star" size={15} /><span className="t-strong" style={{ fontSize: 16 }}>{d.rating}</span></div><div className="t-mut" style={{ fontSize: 11.5 }}>{d.trips} Fahrten</div></div>
      </div>
      <div className="grid4" style={{ marginBottom: 16 }}>
        {[["Stadt", d.city], ["PLZ", d.plz, true], ["Registriert", fmtDate(d.registered)], ["USt-pflichtig", d.vat ? "Ja" : "Nein"]].map(([l, v, m]) => (
          <div key={l}><div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 600 }}>{l}</div><div className={(m ? "t-mono " : "") + "t-strong"} style={{ fontSize: 13, marginTop: 3 }}>{v}</div></div>
        ))}
      </div>
      <div className="section-label">Dokumente <span className="badge" style={{ marginLeft: "auto" }}>{docCount} / 6</span></div>
      <div className="grid3" style={{ marginTop: 8 }}>
        {docs.map(([l, ok]) => <DocSlot key={l} label={l} ok={ok} />)}
      </div>
    </Modal>
  );
}

function DriverForm({ D, driver, onClose, onSave }) {
  const blank = { gender: "", name: "", email: "", phone: "", city: "", plz: "", street: "", land: "", type: "Mini Job", vat: false, active: true, taxNr: "", iban: "", bank: "", registered: "2026-06-05", consent: "2026-06-05" };
  const [f, setF] = useState(driver ? { ...driver } : blank);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.name && f.email;
  return (
    <Modal size="lg" title={driver ? "Fahrer bearbeiten" : "Fahrer hinzufügen"} sub={driver ? driver.id : "Stammdaten & Dokumente"} onClose={onClose}
      footer={<React.Fragment><div style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Schließen</button><button className="btn btn-primary" disabled={!valid} onClick={() => onSave(f)}><Icon name="send" size={15} />{driver ? "Speichern" : "Einladung senden"}</button></React.Fragment>}>
      <div className="section-label" style={{ marginTop: 0 }}>Person</div>
      <div className="grid4" style={{ marginBottom: "var(--gap)" }}>
        <Field label="Name" req span><input className="input" value={f.name} onChange={e => set("name", e.target.value)} placeholder="Vor- und Nachname" /></Field>
        <Field label="E-Mail" req><input className="input" value={f.email} onChange={e => set("email", e.target.value)} /></Field>
        <Field label="Telefon"><input className="input" value={f.phone} onChange={e => set("phone", e.target.value)} /></Field>
      </div>
      <div className="grid4" style={{ marginBottom: "var(--gap)" }}>
        <Field label="Stadt"><input className="input" value={f.city} onChange={e => set("city", e.target.value)} /></Field>
        <Field label="Straße" span><input className="input" value={f.street} onChange={e => set("street", e.target.value)} /></Field>
        <Field label="PLZ"><input className="input" value={f.plz} onChange={e => set("plz", e.target.value)} /></Field>
      </div>
      <div className="section-label">Beschäftigung</div>
      <div className="grid3" style={{ marginBottom: "var(--gap)" }}>
        <Field label="Art"><select className="select" value={f.type} onChange={e => set("type", e.target.value)}>{D.jobTypes.map(t => <option key={t}>{t}</option>)}</select></Field>
        <Field label="Steuernummer"><input className="input" value={f.taxNr} onChange={e => set("taxNr", e.target.value)} placeholder="DE…" /></Field>
        <Field label="IBAN"><input className="input" value={f.iban} onChange={e => set("iban", e.target.value)} placeholder="DE.. .... ...." /></Field>
      </div>
      <div className="flex items-center gap" style={{ padding: "12px 14px", border: "1px solid var(--border)", borderRadius: "var(--r)", marginBottom: "var(--gap)" }}>
        <Check on={f.vat} onChange={v => set("vat", v)} label="Umsatzsteuerpflichtig" />
        <div style={{ width: 1, height: 20, background: "var(--border)" }} />
        <Check on={f.active} onChange={v => set("active", v)} label="Aktiv" />
      </div>
      <div className="section-label">Dokumente (Upload durch Fahrer)</div>
      <div className="grid3" style={{ marginTop: 8 }}>
        {["Personalausweis V.", "Personalausweis R.", "Führerschein V.", "Führerschein R.", "Gewerbeanmeldung", "Nachweis USt"].map(l => <DocSlot key={l} label={l} ok={false} />)}
      </div>
    </Modal>
  );
}

function InviteToken({ onClose, toast }) {
  const token = "MWT-7F3A-9K21-DQ84-B0C5-2E19";
  return (
    <Modal title="Fahrer per ID-Token einladen" sub="Sichere Einmal-Aktivierung" onClose={onClose}
      footer={<React.Fragment><div style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Schließen</button><button className="btn btn-primary" onClick={() => { toast("Einladung versendet", "send"); onClose(); }}><Icon name="send" size={15} />Einladung senden</button></React.Fragment>}>
      <div className="flex gap" style={{ alignItems: "flex-start" }}>
        <div style={{ width: 132, height: 132, flex: "0 0 132px", borderRadius: "var(--r)", background: "var(--surface-3)", display: "grid", placeItems: "center", color: "var(--fg-2)" }}><Icon name="qr" size={84} sw={1} /></div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, color: "var(--fg-2)", marginTop: 0, lineHeight: 1.55 }}>Der ID-Token identifiziert den Auftragnehmer eindeutig. Sende den Token oder QR-Code an den Fahrer — bei Aktivierung wird das Konto automatisch mit deinem Mandanten verknüpft.</p>
          <Field label="ID-Token (Einmal-Code)"><div className="flex gap-sm"><input className="input t-mono" readOnly value={token} /><button className="btn" onClick={() => { navigator.clipboard?.writeText(token); toast("Token kopiert", "copy"); }}><Icon name="copy" size={15} /></button></div></Field>
          <Field label="E-Mail des Fahrers"><input className="input" placeholder="fahrer@example.de" /></Field>
        </div>
      </div>
    </Modal>
  );
}
