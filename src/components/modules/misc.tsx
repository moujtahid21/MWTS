"use client";

/* MW Transport Service — ported from app/misc.jsx. Behaviour preserved 1:1. */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Icon } from "@/components/icon";
import {
  Avatar, Plate, StatusBadge, TypeBadge, Modal, useToast, Sparkline, MiniBars,
  Donut, Field, Switch, Check, Menu, PageHead, Empty, fmtDate, fmtEur,
} from "@/components/ui";
import { MWDATA } from "@/lib/data";
import { useAppNav } from "@/lib/use-app-nav";


/* ============ KALENDER (Verfügbarkeiten) ============ */
export function CalendarView() {
  const onNav = useAppNav();
  const D = MWDATA;
  const toast = useToast();
  const drivers = D.drivers.filter(d => d.active).slice(0, 12);
  const days = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const dates = [2, 3, 4, 5, 6, 7, 8];
  // build availability grid deterministically
  const [grid, setGrid] = useState(() => drivers.map((d, i) => dates.map((_, j) => {
    const v = (i * 7 + j * 3 + d.name.length) % 10;
    return v < 5 ? "free" : v < 8 ? "booked" : "off";
  })));
  const cycle = { free: "booked", booked: "off", off: "free" };
  const colors = { free: ["var(--ok-bg)", "var(--ok-fg)", "verfügbar"], booked: ["var(--info-bg)", "var(--info-fg)", "verplant"], off: ["var(--surface-3)", "var(--fg-faint)", "abwesend"] };
  const click = (i, j) => setGrid(g => g.map((row, ri) => ri === i ? row.map((c, ci) => ci === j ? cycle[c] : c) : row));

  return (
    <div className="view-narrow">
      <PageHead title="Verfügbarkeits-Kalender" sub="KW 23 · 02.–08. Juni 2026 · klicken zum Umschalten">
        <button className="btn"><Icon name="chevLeft" size={15} />Vorwoche</button>
        <button className="btn">Nächste Woche<Icon name="chevRight" size={15} /></button>
        <button className="btn btn-primary" onClick={() => toast("Schichtplanung folgt in Phase 2", "calendar")}><Icon name="plus" size={16} />Schicht planen</button>
      </PageHead>

      <div className="flex gap-sm" style={{ marginBottom: "var(--gap)" }}>
        {Object.entries(colors).map(([k, c]) => <span key={k} className="badge" style={{ background: c[0], color: c[1] }}><span className="dot" />{c[2]}</span>)}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="tbl" style={{ minWidth: 720 }}>
            <thead><tr><th style={{ minWidth: 200 }}>Fahrer</th>{days.map((d, i) => <th key={d} style={{ textAlign: "center" }}>{d}<div className="t-mut" style={{ fontWeight: 400, fontSize: 11 }}>{dates[i].toString().padStart(2, "0")}.06</div></th>)}<th style={{ textAlign: "center" }}>Quote</th></tr></thead>
            <tbody>
              {drivers.map((d, i) => {
                const free = grid[i].filter(c => c === "free").length;
                return (
                  <tr key={d.id}>
                    <td><div className="flex items-center gap-sm" style={{ cursor: "pointer" }} onClick={() => onNav("drivers", { focus: d.id })}><Avatar name={d.name} size={28} /><div><div className="t-strong" style={{ fontSize: 12.5 }}>{d.name}</div><div className="t-mut" style={{ fontSize: 11 }}>{d.type}</div></div></div></td>
                    {grid[i].map((c, j) => (
                      <td key={j} style={{ textAlign: "center", padding: 5 }}>
                        <button onClick={() => click(i, j)} title={colors[c][2]} style={{ width: "100%", height: 34, border: "1px solid var(--border)", borderRadius: 7, background: colors[c][0], color: colors[c][1], cursor: "pointer", display: "grid", placeItems: "center" }}>
                          {c === "free" ? <Icon name="check" size={14} sw={3} /> : c === "booked" ? <Icon name="truck" size={14} /> : <Icon name="close" size={13} />}
                        </button>
                      </td>
                    ))}
                    <td style={{ textAlign: "center" }}><span className="t-mono t-strong">{free}/7</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ============ KARTE ============ */
export function MapView() {
  const D = MWDATA;
  const [layer, setLayer] = useState("karte");
  // pseudo positions for NRW cluster + spread (percent of 1000x620 box)
  const pins = D.orders.slice(0, 30).map((o, i) => ({
    o, x: 18 + ((i * 137) % 64), y: 14 + ((i * 91) % 70),
    type: o.status === "fertig" ? "done" : o.status === "nicht_zugewiesen" ? "open" : o.driver ? "active" : "open"
  }));
  const pinColor = { active: "var(--color-primary)", open: "#dc2626", done: "#2563eb" };
  const [sel, setSel] = useState(null);

  return (
    <div>
      <PageHead title="Karte" sub={pins.length + " Fahrzeuge live · Flotten-Übersicht Deutschland"}>
        <div className="seg"><button className={layer === "karte" ? "on" : ""} onClick={() => setLayer("karte")}>Karte</button><button className={layer === "sat" ? "on" : ""} onClick={() => setLayer("sat")}>Satellit</button></div>
        <button className="btn"><Icon name="refresh" size={15} />Aktualisieren</button>
      </PageHead>
      <div className="flex gap-sm wrap" style={{ marginBottom: "var(--gap)" }}>
        <span className="badge ok"><span className="dot" />Unterwegs / zugewiesen</span>
        <span className="badge danger"><span className="dot" />Offen (kein Fahrer)</span>
        <span className="badge info"><span className="dot" />Fertig / am Stellplatz</span>
      </div>
      <div className="card" style={{ overflow: "hidden", position: "relative", height: "calc(100vh - 230px)" }}>
        <div style={{ position: "absolute", inset: 0, background: layer === "sat" ? "linear-gradient(135deg,#243b2a,#1c2e3a)" : "linear-gradient(135deg,#d9ead0,#cbe0ea)" }}>
          <svg viewBox="0 0 1000 620" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
            {/* roads */}
            <g stroke={layer === "sat" ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.6)"} strokeWidth="3" fill="none">
              <path d="M100 200 Q400 160 920 240" /><path d="M60 380 Q500 320 960 420" /><path d="M300 60 Q340 320 260 580" /><path d="M680 40 Q620 320 720 600" /><path d="M120 120 Q500 380 880 540" />
            </g>
            <g stroke={layer === "sat" ? "rgba(255,255,255,.07)" : "rgba(255,255,255,.35)"} strokeWidth="1.5" fill="none">
              {Array.from({ length: 8 }).map((_, i) => <line key={i} x1={i * 130} y1="0" x2={i * 130} y2="620" />)}
              {Array.from({ length: 6 }).map((_, i) => <line key={i} x1="0" y1={i * 110} x2="1000" y2={i * 110} />)}
            </g>
            {/* city labels */}
            {[["Düsseldorf", 230, 300], ["Köln", 250, 360], ["Dortmund", 300, 250], ["Frankfurt", 480, 430], ["Bremen", 420, 130], ["Berlin", 760, 200], ["Stuttgart", 520, 540]].map(([n, x, y]) => (
              <text key={n} x={x} y={y} fontSize="13" fontWeight="600" fill={layer === "sat" ? "rgba(255,255,255,.55)" : "rgba(20,40,30,.5)"} fontFamily="var(--font-sans)">{n}</text>
            ))}
            {pins.map((p, i) => (
              <g key={i} transform={`translate(${p.x / 100 * 1000} ${p.y / 100 * 620})`} style={{ cursor: "pointer" }} onClick={() => setSel(p.o)}>
                <path d="M0 0 C-9 -13 -9 -22 0 -28 C9 -22 9 -13 0 0 Z" transform="translate(0 2)" fill={pinColor[p.type]} stroke="#fff" strokeWidth="1.6" />
                <circle cx="0" cy="-19" r="4.5" fill="#fff" />
              </g>
            ))}
          </svg>
        </div>
        {sel && (
          <div className="card" style={{ position: "absolute", top: 16, right: 16, width: 280, boxShadow: "var(--shadow-lg)" }}>
            <div className="card-head" style={{ padding: "12px 14px" }}><div style={{ flex: 1 }}><Plate value={sel.plate} /></div><button className="icon-btn sq" style={{ height: 28, minWidth: 28 }} onClick={() => setSel(null)}><Icon name="close" size={15} /></button></div>
            <div className="card-pad" style={{ padding: 14 }}>
              <div className="t-mut" style={{ fontSize: 12 }}>{sel.model}</div>
              <div style={{ margin: "10px 0", fontSize: 12.5 }}><div className="flex items-center gap-sm"><span className="dot-ind" style={{ background: "var(--info)" }} />{sel.from.city}</div><div className="flex items-center gap-sm" style={{ marginTop: 4 }}><span className="dot-ind" style={{ background: "var(--danger)" }} />{sel.to.city}</div></div>
              <div className="flex items-center between"><StatusBadge status={sel.status} />{sel.driver && <div className="flex items-center gap-sm"><Avatar name={sel.driver.name} size={24} /><span style={{ fontSize: 12 }}>{sel.driver.name.split(" ")[0]}</span></div>}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ STELLPLÄTZE ============ */
export function Parking() {
  const D = MWDATA;
  const toast = useToast();
  const [list, setList] = useState(D.parking);
  const [add, setAdd] = useState(false);
  return (
    <div className="view-narrow">
      <PageHead title="Stellplätze" sub={list.length + " Standorte · " + list.reduce((s, p) => s + p.used, 0) + " / " + list.reduce((s, p) => s + p.cap, 0) + " Plätze belegt"}>
        <button className="btn btn-primary" onClick={() => setAdd(true)}><Icon name="plus" size={16} />Stellplatz hinzufügen</button>
      </PageHead>
      <div className="grid3">
        {list.map(p => {
          const pct = Math.round(p.used / p.cap * 100);
          const c = pct > 90 ? "danger" : pct > 70 ? "warn" : "ok";
          return (
            <div key={p.id} className="card card-pad">
              <div className="flex items-center gap-sm" style={{ marginBottom: 10 }}>
                <div className="avatar" style={{ width: 38, height: 38, flexBasis: 38, borderRadius: 10, background: "var(--color-primary-soft)", color: "var(--color-primary-strong)" }}><Icon name="parking" size={18} /></div>
                <div style={{ flex: 1, minWidth: 0 }}><div className="t-strong" style={{ fontSize: 14 }}>{p.name}</div><div className="t-mut" style={{ fontSize: 11.5 }}>{p.plz} {p.city}</div></div>
                {p.taxi && <span className="badge info" title="Taxi notwendig">Taxi</span>}
              </div>
              <div className="t-mut flex items-center gap-sm" style={{ fontSize: 12, marginBottom: 12 }}><Icon name="clock" size={13} />{p.hours}</div>
              <div className="flex between" style={{ fontSize: 12, marginBottom: 5 }}><span className="t-mut">Belegung</span><span className="t-strong t-mono">{p.used}/{p.cap} · {pct}%</span></div>
              <div className="progress"><div style={{ width: pct + "%", background: `var(--${c})` }} /></div>
            </div>
          );
        })}
      </div>
      {add && <Modal title="Neuer Stellplatz" onClose={() => setAdd(false)} footer={<React.Fragment><div style={{ flex: 1 }} /><button className="btn" onClick={() => setAdd(false)}>Schließen</button><button className="btn btn-primary" onClick={() => { setAdd(false); toast("Stellplatz gespeichert", "check"); }}><Icon name="check" size={16} />Speichern</button></React.Fragment>}>
        <div className="grid2" style={{ marginBottom: "var(--gap)" }}>
          <Field label="Stellplatz Name" req><input className="input" placeholder="Hub …" /></Field>
          <Field label="Bundesland" req><select className="select">{D.bundeslaender.map(b => <option key={b}>{b}</option>)}</select></Field>
        </div>
        <div className="grid4" style={{ marginBottom: "var(--gap)" }}>
          <Field label="Stadt" req><input className="input" /></Field>
          <Field label="Straße" req span><input className="input" /></Field>
          <Field label="PLZ" req><input className="input" /></Field>
        </div>
        <div className="grid2"><Field label="Öffnungszeiten"><input className="input" placeholder="Mo–Fr 06–22" /></Field><Field label="Kapazität"><input className="input" type="number" placeholder="40" /></Field></div>
      </Modal>}
    </div>
  );
}

/* ============ DOKUMENTE ============ */
function Documents() {
  const D = MWDATA;
  const toast = useToast();
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("all");
  const types = ["all", ...new Set(D.documents.map(d => d.type))];
  const list = D.documents.filter(d => (fType === "all" || d.type === fType) && (!q || d.name.toLowerCase().includes(q.toLowerCase()) || d.driver.toLowerCase().includes(q.toLowerCase()) || d.order.includes(q)));
  const sCls = { fertig: "ok", offen: "warn", unbestätigt: "danger" };
  const ic = (n) => n.endsWith(".jpg") || n.endsWith(".png") ? "camera" : "pdf";
  return (
    <div className="view-narrow">
      <PageHead title="Dokumente" sub={D.documents.length + " Dateien · Protokolle, Nachweise, Belege"}>
        <button className="btn btn-primary" onClick={() => toast("Datei-Upload", "upload")}><Icon name="upload" size={15} />Hochladen</button>
      </PageHead>
      <div className="card" style={{ marginBottom: "var(--gap)", padding: "12px var(--pad)" }}>
        <div className="flex items-center gap-sm wrap">
          <div className="search" style={{ flex: "1 1 240px" }}><Icon name="search" size={16} /><input className="input" placeholder="Dateiname, Fahrer oder Auftrag …" value={q} onChange={e => setQ(e.target.value)} /></div>
          <select className="select" style={{ width: "auto" }} value={fType} onChange={e => setFType(e.target.value)}>{types.map(t => <option key={t} value={t}>{t === "all" ? "Alle Typen" : t}</option>)}</select>
        </div>
      </div>
      <div className="card"><div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Dokument</th><th>Typ</th><th>Auftrag</th><th>Fahrer</th><th>Datum</th><th>Größe</th><th>Status</th><th style={{ width: 80 }}></th></tr></thead>
        <tbody>
          {list.map(d => (
            <tr key={d.id}>
              <td><div className="flex items-center gap-sm"><div className="avatar" style={{ width: 30, height: 30, flexBasis: 30, borderRadius: 7, background: "var(--danger-bg)", color: "var(--danger-fg)" }}><Icon name={ic(d.name)} size={15} /></div><span className="t-strong" style={{ fontSize: 12.5 }}>{d.name}</span></div></td>
              <td><span className="badge outline">{d.type}</span></td>
              <td className="t-mono" style={{ fontSize: 12 }}>{d.order}</td>
              <td style={{ fontSize: 12.5 }}>{d.driver}</td>
              <td className="t-mut t-mono" style={{ fontSize: 12 }}>{fmtDate(d.date)}</td>
              <td className="t-mut t-mono" style={{ fontSize: 12 }}>{d.size}</td>
              <td><span className={"badge " + (sCls[d.status] || "")}><span className="dot" />{d.status}</span></td>
              <td><div className="flex" style={{ justifyContent: "flex-end", gap: 4 }}><button className="icon-btn sq" style={{ height: 30, minWidth: 30 }} onClick={() => toast("Vorschau", "eye")}><Icon name="eye" size={15} /></button><button className="icon-btn sq" style={{ height: 30, minWidth: 30 }} onClick={() => toast("Download gestartet", "download")}><Icon name="download" size={15} /></button></div></td>
            </tr>
          ))}
        </tbody>
      </table>{list.length === 0 && <Empty title="Keine Dokumente" icon="documents" />}</div></div>
    </div>
  );
}

/* ============ INFORMATION (Rich text) ============ */
export function Information() {
  const toast = useToast();
  const tools = [["B", "bold"], ["I", "italic"], ["U", "underline"]];
  return (
    <div className="view-narrow">
      <PageHead title="Information" sub="Interne Hinweise & Aushänge für das Team"><button className="btn btn-primary" onClick={() => toast("Gespeichert", "check")}><Icon name="check" size={15} />Speichern</button></PageHead>
      <div className="card">
        <div className="flex items-center gap-sm" style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)", flexWrap: "wrap" }}>
          {tools.map(([l]) => <button key={l} className="icon-btn sq" style={{ height: 30, minWidth: 30, fontWeight: 700 }}>{l}</button>)}
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <button className="icon-btn sq" style={{ height: 30, minWidth: 30 }}><Icon name="list" size={15} /></button>
          <select className="select" style={{ width: "auto", height: 30 }}><option>Hanken Grotesk</option><option>IBM Plex Mono</option></select>
          <div style={{ width: 1, height: 20, background: "var(--border)" }} />
          <button className="icon-btn sq" style={{ height: 30, minWidth: 30 }}><Icon name="mapPin" size={15} /></button>
          <button className="icon-btn sq" style={{ height: 30, minWidth: 30 }}><Icon name="camera" size={15} /></button>
        </div>
        <div contentEditable suppressContentEditableWarning style={{ minHeight: 360, padding: "20px var(--pad)", outline: "none", fontSize: 14, lineHeight: 1.7, color: "var(--fg)" }}>
          <h3 style={{ marginTop: 0 }}>Hinweise Disposition – KW 23</h3>
          <p>Bitte bei allen <b>Sixt-Aufträgen</b> die MV-Nr. zwingend im Protokoll vermerken. Übergaben in AT/CH nur mit Vorab-Avis (48&nbsp;h).</p>
          <p>Neue Fahrer im Onboarding: Personalausweis &amp; Führerschein (beide Seiten) müssen vor der ersten Fahrt hochgeladen sein.</p>
          <ul><li>Tankbelege immer fotografieren</li><li>Schadensprotokoll mit mindestens 6 Fotos</li><li>Rückgabeprotokoll inkl. Kilometerstand</li></ul>
        </div>
      </div>
    </div>
  );
}
