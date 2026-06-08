"use client";

/* MW Transport Service — ported from app/dashboard.jsx. Behaviour preserved 1:1. */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Icon } from "@/components/icon";
import {
  Avatar, Plate, StatusBadge, TypeBadge, Modal, useToast, Sparkline, MiniBars,
  Donut, Field, Switch, Check, Menu, PageHead, Empty, fmtDate, fmtEur,
} from "@/components/ui";
import { MWDATA } from "@/lib/data";
import { useAppNav } from "@/lib/use-app-nav";

function StatTile({ label, value, icon, delta, deltaDir, sub }) {
  return (
    <div className="stat">
      <div className="lbl"><Icon name={icon} size={14} /> {label}</div>
      <div className="val">{value}</div>
      {(delta || sub) && (
        <div className={"delta " + (deltaDir || "flat")}>
          {delta && <Icon name={deltaDir === "down" ? "arrowDown" : "arrowUp"} size={12} sw={2.5} />}
          {delta || sub}
        </div>
      )}
    </div>
  );
}

/* Live-Uhr + Datum — eigenständige Komponente, damit nur diese (nicht das ganze
   Dashboard) im Sekundentakt neu rendert. tabular-nums verhindert Breiten-Flackern. */
function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const date = now.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
  const time = now.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  return (
    <div className="flex items-center gap-sm" style={{ height: 36, padding: "0 12px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)" }} title="Aktuelles Datum & Uhrzeit">
      <Icon name="clock" size={14} style={{ color: "var(--fg-3)", flex: "0 0 auto" }} />
      <span className="t-mut" style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{date}</span>
      <span style={{ width: 1, height: 16, background: "var(--border)", flex: "0 0 auto" }} />
      <span className="t-mono t-strong" style={{ fontSize: 13, whiteSpace: "nowrap", fontVariantNumeric: "tabular-nums" }}>{time} Uhr</span>
    </div>
  );
}

export function Dashboard() {
  const onNav = useAppNav();
  const kpi = MWDATA.kpi;
  const D = MWDATA;
  const [variant, setVariant] = useState("ops");
  useEffect(() => { const v = localStorage.getItem("mw_dash"); if (v) setVariant(v); }, []);
  useEffect(() => { localStorage.setItem("mw_dash", variant); }, [variant]);

  const todayOrders = D.orders.filter(o => o.pickupDate === "2026-06-04" || o.pickupDate === "2026-06-05").slice(0, 6);
  const unassigned = D.orders.filter(o => o.status === "nicht_zugewiesen").slice(0, 5);
  const availDrivers = D.drivers.filter(d => d.status === "available" && d.active).slice(0, 8);

  return (
    <div className="view-narrow">
      <PageHead title="Übersicht" sub="Disposition · Operativer Lagebericht">
        <LiveClock />
        <div className="seg">
          <button className={variant === "ops" ? "on" : ""} onClick={() => setVariant("ops")}><Icon name="trend" size={14} />Operativ</button>
          <button className={variant === "cockpit" ? "on" : ""} onClick={() => setVariant("cockpit")}><Icon name="grid" size={14} />Cockpit</button>
        </div>
        <button className="btn btn-primary" onClick={() => onNav("orders", { create: true })}><Icon name="plus" size={16} />Neuer Auftrag</button>
      </PageHead>

      {variant === "ops" ? (
        <OpsVariant D={D} kpi={kpi} todayOrders={todayOrders} unassigned={unassigned} availDrivers={availDrivers} onNav={onNav} />
      ) : (
        <CockpitVariant D={D} kpi={kpi} unassigned={unassigned} availDrivers={availDrivers} onNav={onNav} />
      )}
    </div>
  );
}

/* ---------- Variant A: Operativ ---------- */
function OpsVariant({ D, kpi, todayOrders, unassigned, availDrivers, onNav }) {
  return (
    <React.Fragment>
      <div className="grid4" style={{ marginBottom: "var(--gap)" }}>
        <StatTile label="Aufträge gesamt" value={kpi.total.toLocaleString("de-DE")} icon="orders" delta="+4,2 % ggü. Vorwoche" deltaDir="up" />
        <StatTile label="Zugewiesen" value={kpi.assigned.toLocaleString("de-DE")} icon="route" delta="86,7 % Quote" deltaDir="up" />
        <StatTile label="Nicht zugewiesen" value={kpi.unassigned.toLocaleString("de-DE")} icon="alert" sub="Disposition nötig" />
        <StatTile label="Aktive Fahrer" value={kpi.activeDrivers + " / " + kpi.driversTotal} icon="drivers" delta="8 unterwegs" deltaDir="up" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--gap)", marginBottom: "var(--gap)" }}>
        <div className="card">
          <div className="card-head"><div style={{ flex: 1 }}><h3>Durchsatz</h3><span className="sub">Abgewickelte Aufträge · letzte 14 Tage</span></div>
            <span className="badge ok"><Icon name="trend" size={12} />+18 %</span></div>
          <div className="card-pad"><Sparkline data={D.series} w={640} h={120} /></div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Status-Verteilung</h3></div>
          <div className="card-pad" style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <div style={{ position: "relative", flex: "0 0 auto" }}>
              <Donut segments={D.statusBreakdown} size={124} thick={15} />
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", textAlign: "center" }}>
                <div><div style={{ fontSize: 22, fontWeight: 780, letterSpacing: "-.03em" }}>{(kpi.total / 1000).toFixed(1)}k</div><div style={{ fontSize: 10.5, color: "var(--fg-3)", fontWeight: 600 }}>gesamt</div></div>
              </div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
              {D.statusBreakdown.map(s => (
                <div key={s.key} className="flex items-center gap-sm" style={{ fontSize: 12.5 }}>
                  <span className="dot-ind" style={{ background: `var(--${s.cls || "border-strong"}${s.cls ? "" : ""})`, backgroundColor: { ok: "var(--ok)", info: "var(--info)", warn: "var(--warn)", danger: "var(--danger)", "": "var(--border-strong)" }[s.cls] }} />
                  <span style={{ flex: 1, color: "var(--fg-2)" }}>{s.label}</span>
                  <span className="t-mono t-strong">{s.value.toLocaleString("de-DE")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "var(--gap)" }}>
        <div className="card">
          <div className="card-head"><div style={{ flex: 1 }}><h3>Heute &amp; morgen</h3><span className="sub">{todayOrders.length} anstehende Abholungen</span></div>
            <button className="btn btn-sm btn-ghost" onClick={() => onNav("orders")}>Alle Aufträge <Icon name="chevRight" size={14} /></button></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <tbody>
                {todayOrders.map(o => (
                  <tr key={o.id} style={{ cursor: "pointer" }} onClick={() => onNav("orders", { focus: o.id })}>
                    <td style={{ width: 130 }}><Plate value={o.plate} /></td>
                    <td><div className="t-strong" style={{ fontSize: 13 }}>{o.from.city}</div><div className="t-mut" style={{ fontSize: 11.5 }}>→ {o.to.city}</div></td>
                    <td>{o.driver ? <div className="flex items-center gap-sm"><Avatar name={o.driver.name} size={26} /><span style={{ fontSize: 12.5 }}>{o.driver.name.split(" ")[0]}</span></div> : <span className="badge warn">offen</span>}</td>
                    <td style={{ textAlign: "right" }}><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><div style={{ flex: 1 }}><h3>Verfügbare Fahrer</h3><span className="sub">{availDrivers.length} sofort einsatzbereit</span></div>
            <button className="btn btn-sm btn-ghost" onClick={() => onNav("calendar")}>Kalender</button></div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 9 }}>
            {availDrivers.map(d => (
              <div key={d.id} className="flex items-center gap-sm" style={{ cursor: "pointer" }} onClick={() => onNav("drivers", { focus: d.id })}>
                <Avatar name={d.name} size={30} />
                <div style={{ flex: 1, minWidth: 0 }}><div className="t-strong" style={{ fontSize: 13 }}>{d.name}</div><div className="t-mut" style={{ fontSize: 11.5 }}>{d.city} · {d.plz}</div></div>
                <TypeBadge type={d.type} />
                <span className="dot-ind" style={{ background: "var(--ok)" }} title="verfügbar" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

/* ---------- Variant B: Cockpit ---------- */
function CockpitVariant({ D, kpi, unassigned, availDrivers, onNav }) {
  const actionItems = [
    { icon: "alert", cls: "warn", n: kpi.unassigned, label: "Aufträge ohne Fahrer", act: () => onNav("orders", { filter: "nicht_zugewiesen" }) },
    { icon: "documents", cls: "info", n: kpi.arbeitsnachweisOffen, label: "Arbeitsnachweise offen", act: () => onNav("documents") },
    { icon: "shield", cls: "danger", n: kpi.arbeitsnachweisUnbestaetigt, label: "Nachweise unbestätigt", act: () => onNav("documents") },
    { icon: "euro", cls: "purple", n: kpi.auslagenOffen, label: "Auslagen offen", act: () => onNav("orders") },
  ];
  return (
    <React.Fragment>
      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: "var(--gap)", marginBottom: "var(--gap)" }}>
        {/* Big action card */}
        <div className="card" style={{ background: "linear-gradient(150deg, var(--color-primary), var(--color-primary-strong))", border: "none", color: "#fff" }}>
          <div className="card-pad">
            <div style={{ fontSize: 12.5, fontWeight: 600, opacity: .85, display: "flex", alignItems: "center", gap: 7 }}><Icon name="route" size={15} />Disposition heute</div>
            <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-.04em", margin: "10px 0 2px", lineHeight: 1 }}>{kpi.unassigned.toLocaleString("de-DE")}</div>
            <div style={{ fontSize: 13, opacity: .9 }}>Aufträge warten auf Zuweisung</div>
            <button className="btn" style={{ marginTop: 18, background: "rgba(255,255,255,.18)", border: "1px solid rgba(255,255,255,.25)", color: "#fff", width: "100%" }} onClick={() => onNav("orders", { filter: "nicht_zugewiesen" })}>Jetzt disponieren <Icon name="arrowRight" size={15} /></button>
          </div>
        </div>
        {/* Throughput compact */}
        <div className="card"><div className="card-pad">
          <div className="lbl" style={{ fontSize: 12, color: "var(--fg-3)", fontWeight: 600, display: "flex", gap: 7, alignItems: "center" }}><Icon name="trend" size={14} />Durchsatz (14T)</div>
          <div style={{ fontSize: 30, fontWeight: 780, letterSpacing: "-.03em", margin: "8px 0 10px" }}>{D.series.reduce((a, b) => a + b, 0)}</div>
          <MiniBars data={D.series} h={52} />
        </div></div>
        {/* Driver mix */}
        <div className="card"><div className="card-pad">
          <div className="lbl" style={{ fontSize: 12, color: "var(--fg-3)", fontWeight: 600, display: "flex", gap: 7, alignItems: "center" }}><Icon name="drivers" size={14} />Fahrer-Mix</div>
          <div style={{ fontSize: 30, fontWeight: 780, letterSpacing: "-.03em", margin: "8px 0 12px" }}>{kpi.driversTotal}</div>
          {[["Angestellt", kpi.angestellt, "ok"], ["Mini Job", kpi.minijob, "warn"], ["Selbständig", kpi.selbst, "info"]].map(([l, n, c]) => (
            <div key={l} style={{ marginBottom: 7 }}>
              <div className="flex between" style={{ fontSize: 11.5, marginBottom: 3 }}><span className="t-mut">{l}</span><span className="t-strong t-mono">{n}</span></div>
              <div className="progress"><div style={{ width: (n / kpi.driversTotal * 100) + "%", background: { ok: "var(--ok)", warn: "var(--warn)", info: "var(--info)" }[c] }} /></div>
            </div>
          ))}
        </div></div>
      </div>

      {/* Action queue */}
      <div className="grid4" style={{ marginBottom: "var(--gap)" }}>
        {actionItems.map((a, i) => (
          <button key={i} className="stat" onClick={a.act} style={{ cursor: "pointer", textAlign: "left", font: "inherit" }}>
            <div className="stat-ic" style={{ color: `var(--${a.cls}-fg)`, background: `var(--${a.cls}-bg)` }}><Icon name={a.icon} size={17} /></div>
            <div className="lbl">{a.label}</div>
            <div className="val" style={{ color: `var(--${a.cls}-fg)` }}>{a.n.toLocaleString("de-DE")}</div>
            <div className="delta flat"><Icon name="arrowRight" size={12} /> öffnen</div>
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--gap)" }}>
        <div className="card">
          <div className="card-head"><div style={{ flex: 1 }}><h3>Dringend zu disponieren</h3><span className="sub">älteste offene Aufträge</span></div></div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {unassigned.map(o => (
              <div key={o.id} className="flex items-center gap-sm" style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: "var(--r)", cursor: "pointer" }} onClick={() => onNav("orders", { focus: o.id })}>
                <Plate value={o.plate} />
                <div style={{ flex: 1, minWidth: 0 }}><div className="t-strong" style={{ fontSize: 12.5 }}>{o.from.city} → {o.to.city}</div><div className="t-mut" style={{ fontSize: 11 }}>{o.auftraggeber}</div></div>
                <button className="btn btn-sm btn-primary" onClick={(e) => { e.stopPropagation(); onNav("orders", { focus: o.id }); }}>Zuweisen</button>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-head"><div style={{ flex: 1 }}><h3>Karte</h3><span className="sub">Flotten-Übersicht Live</span></div>
            <button className="btn btn-sm btn-ghost" onClick={() => onNav("map")}>Vollbild</button></div>
          <div onClick={() => onNav("map")} style={{ cursor: "pointer", height: 268, borderRadius: "0 0 var(--r-lg) var(--r-lg)", overflow: "hidden", position: "relative", background: "linear-gradient(135deg,#cfe6d6,#bcd9e8)" }}>
            <MapMini />
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

function MapMini() {
  const pins = [[28, 42], [35, 55], [42, 38], [55, 62], [48, 48], [62, 35], [38, 70], [70, 50], [25, 60]];
  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%" }} preserveAspectRatio="xMidYMid slice">
      <g stroke="rgba(255,255,255,.5)" strokeWidth="0.6" fill="none">
        <path d="M10 30 Q40 25 90 35" /><path d="M5 55 Q50 48 95 60" /><path d="M30 10 Q35 50 25 90" /><path d="M65 5 Q60 50 70 95" />
      </g>
      {pins.map((p, i) => (
        <g key={i} transform={`translate(${p[0]} ${p[1]})`}>
          <circle r="2.4" fill={i % 3 === 0 ? "var(--color-primary)" : i % 3 === 1 ? "#2563eb" : "#dc2626"} stroke="#fff" strokeWidth="0.7" />
        </g>
      ))}
    </svg>
  );
}
