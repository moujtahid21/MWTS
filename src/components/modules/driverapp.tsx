"use client";

/* MW Transport Service — ported from app/driverapp.jsx. Behaviour preserved 1:1. */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Icon } from "@/components/icon";
import {
  Avatar, Plate, StatusBadge, TypeBadge, Modal, useToast, Sparkline, MiniBars,
  Donut, Field, Switch, Check, Menu, PageHead, Empty, fmtDate, fmtEur,
} from "@/components/ui";
import { MWDATA } from "@/lib/data";

export function DriverApp() {
  const D = MWDATA;
  const me = D.drivers.find(d => d.name === "Pedro Martinez Ferron") || D.drivers[0];
  return (
    <div className="view-narrow">
      <PageHead title="Fahrer-App" sub="Mobile PWA · Vorschau — so sehen Fahrer ihre Aufträge unterwegs">
        <span className="badge brand"><Icon name="phone" size={12} />Mobile-First · PWA</span>
      </PageHead>
      <div style={{ display: "flex", gap: 40, alignItems: "flex-start", flexWrap: "wrap" }}>
        <PhoneFrame><DriverPhoneApp D={D} me={me} /></PhoneFrame>
        <div style={{ flex: 1, minWidth: 280, maxWidth: 460 }}>
          <h3 style={{ fontSize: 17, fontWeight: 750, margin: "8px 0 6px", letterSpacing: "-.02em" }}>Für unterwegs gebaut</h3>
          <p style={{ color: "var(--fg-2)", fontSize: 14, lineHeight: 1.6, marginTop: 0 }}>Installierbar als PWA – kein App-Store nötig. Große Touch-Targets (≥ 44 px), offline-fähige Auftragsliste, Foto-Upload direkt aus der Kamera.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 18 }}>
            {[["check", "Aufträge annehmen oder ablehnen", "Push-Benachrichtigung bei neuer Zuweisung"], ["route", "Status-Updates in einem Tipp", "Angenommen → Abgeholt → Unterwegs → Geliefert"], ["camera", "Protokoll mit Foto-Upload", "Schaden & Übergabe direkt dokumentieren"], ["mapPin", "Navigation zum Abhol- & Zielort", "ein Tipp öffnet die Karten-App"]].map(([ic, t, s]) => (
              <div key={t} className="flex gap-sm" style={{ alignItems: "flex-start" }}>
                <div className="avatar" style={{ width: 34, height: 34, flexBasis: 34, borderRadius: 9, background: "var(--color-primary-soft)", color: "var(--color-primary-strong)" }}><Icon name={ic} size={17} /></div>
                <div><div className="t-strong" style={{ fontSize: 13.5 }}>{t}</div><div className="t-mut" style={{ fontSize: 12.5 }}>{s}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PhoneFrame({ children }) {
  return (
    <div style={{ width: 372, flex: "0 0 372px", borderRadius: 46, background: "#0a0e13", padding: 13, boxShadow: "var(--shadow-lg)", border: "1px solid var(--border)" }}>
      <div style={{ borderRadius: 34, overflow: "hidden", background: "var(--surface)", position: "relative", height: 760 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 30, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 22px", zIndex: 30, fontSize: 12, fontWeight: 700, color: "var(--fg)" }}>
          <span>9:41</span>
          <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", top: 8, width: 96, height: 20, background: "#0a0e13", borderRadius: 99 }} />
          <span style={{ display: "flex", gap: 5, alignItems: "center" }}><Icon name="route" size={13} /><span style={{ fontSize: 11 }}>5G</span><span style={{ width: 22, height: 11, border: "1.5px solid var(--fg)", borderRadius: 3, position: "relative", display: "inline-block" }}><span style={{ position: "absolute", inset: 1.5, right: 5, background: "var(--ok)", borderRadius: 1 }} /></span></span>
        </div>
        {children}
      </div>
    </div>
  );
}

function DriverPhoneApp({ D, me }) {
  const toast = useToast();
  const [tab, setTab] = useState("home");
  const [orders, setOrders] = useState(() => {
    const pool = D.orders.filter(o => o.driver).slice(0, 8);
    return pool.map((o, i) => ({ ...o, dstate: i === 0 ? "active" : i < 3 ? "offer" : "queued", step: i === 0 ? 1 : 0 }));
  });
  const active = orders.find(o => o.dstate === "active");
  const offers = orders.filter(o => o.dstate === "offer");
  const accept = (id) => { setOrders(os => os.map(o => o.id === id ? { ...o, dstate: os.some(x => x.dstate === "active") ? "queued" : "active", step: 1 } : o)); toast("Auftrag angenommen", "check"); };
  const reject = (id) => { setOrders(os => os.filter(o => o.id !== id)); toast("Auftrag abgelehnt", "x"); };
  const advance = (id) => setOrders(os => os.map(o => o.id === id ? { ...o, step: Math.min(4, o.step + 1) } : o));

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      {/* App header */}
      <div style={{ background: "var(--color-primary)", color: "#fff", padding: "40px 18px 16px" }}>
        <div className="flex items-center gap-sm">
          <Avatar name={me.name} size={40} />
          <div style={{ flex: 1 }}><div style={{ fontSize: 12, opacity: .85 }}>Willkommen,</div><div style={{ fontWeight: 750, fontSize: 16 }}>{me.name.split(" ")[0]}</div></div>
          <div style={{ position: "relative" }}><Icon name="bell" size={22} /><span style={{ position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: 99, background: "#fff", border: "2px solid var(--color-primary)" }} /></div>
        </div>
        <div className="flex" style={{ gap: 8, marginTop: 16 }}>
          {[["Heute", orders.filter(o => o.dstate !== "offer").length], ["Angebote", offers.length], ["⭐ Rating", me.rating]].map(([l, v]) => (
            <div key={l} style={{ flex: 1, background: "rgba(255,255,255,.16)", borderRadius: 12, padding: "10px 12px" }}><div style={{ fontSize: 19, fontWeight: 780 }}>{v}</div><div style={{ fontSize: 11, opacity: .85 }}>{l}</div></div>
          ))}
        </div>
      </div>

      {/* Scroll body */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 90px" }}>
        {tab === "home" && (
          <React.Fragment>
            {offers.length > 0 && <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--fg-3)", margin: "2px 0 10px" }}>Neue Angebote</div>}
            {offers.map(o => (
              <div key={o.id} className="card" style={{ marginBottom: 12, borderColor: "var(--color-primary)", overflow: "hidden" }}>
                <div style={{ background: "var(--color-primary-soft)", padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}><Icon name="bell" size={14} style={{ color: "var(--color-primary-strong)" }} /><span style={{ fontSize: 12, fontWeight: 700, color: "var(--color-primary-strong)" }}>Neuer Auftrag · {o.price} €</span></div>
                <div style={{ padding: 14 }}>
                  <div className="flex items-center between" style={{ marginBottom: 10 }}><Plate value={o.plate} /><TypeBadge type={o.jobType || me.type} /></div>
                  <RouteMini from={o.from} to={o.to} />
                  <div className="flex gap-sm" style={{ marginTop: 8, fontSize: 12 }} ><span className="badge"><Icon name="route" size={11} />{o.km} km</span>{o.pickupDate && <span className="badge"><Icon name="calendar" size={11} />{fmtDate(o.pickupDate)}</span>}{o.refuel && <span className="badge warn"><Icon name="fuel" size={11} />Tanken</span>}</div>
                  <div className="flex gap-sm" style={{ marginTop: 14 }}>
                    <button className="btn" style={{ flex: 1, height: 46 }} onClick={() => reject(o.id)}><Icon name="close" size={17} />Ablehnen</button>
                    <button className="btn btn-primary" style={{ flex: 1.4, height: 46 }} onClick={() => accept(o.id)}><Icon name="check" size={17} />Annehmen</button>
                  </div>
                </div>
              </div>
            ))}
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--fg-3)", margin: "18px 0 10px" }}>Aktiver Auftrag</div>
            {active ? <ActiveJob o={active} onAdvance={advance} onNav={() => toast("Navigation wird geöffnet", "mapPin")} /> : <div className="muted-box" style={{ padding: 24, fontSize: 13 }}>Kein aktiver Auftrag</div>}
          </React.Fragment>
        )}

        {tab === "jobs" && (
          <React.Fragment>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--fg-3)", margin: "2px 0 10px" }}>Meine Aufträge</div>
            {orders.map(o => (
              <div key={o.id} className="card" style={{ marginBottom: 10, padding: 13 }}>
                <div className="flex items-center between" style={{ marginBottom: 8 }}><Plate value={o.plate} />{o.dstate === "active" ? <span className="badge ok"><span className="dot" />aktiv</span> : o.dstate === "offer" ? <span className="badge brand">Angebot</span> : <span className="badge">Warteschlange</span>}</div>
                <RouteMini from={o.from} to={o.to} />
              </div>
            ))}
          </React.Fragment>
        )}

        {tab === "protocol" && <ProtocolForm toast={toast} active={active} />}

        {tab === "profile" && (
          <React.Fragment>
            <div className="card card-pad" style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ display: "grid", placeItems: "center", marginBottom: 10 }}><Avatar name={me.name} size={64} /></div>
              <div className="t-strong" style={{ fontSize: 16 }}>{me.name}</div>
              <div className="t-mut" style={{ fontSize: 12.5 }}>{me.email}</div>
              <div className="flex" style={{ justifyContent: "center", gap: 8, marginTop: 10 }}><TypeBadge type={me.type} /><span className="badge warn"><Icon name="star" size={11} />{me.rating}</span><span className="badge">{me.trips} Fahrten</span></div>
            </div>
            {[["user", "Persönliche Daten"], ["documents", "Meine Dokumente"], ["euro", "Vergütung & Abrechnung"], ["fuel", "Tankkarte"], ["shield", "Datenschutz (DSGVO)"], ["settings", "Einstellungen"]].map(([ic, l]) => (
              <button key={l} className="card" style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 14px", marginBottom: 8, cursor: "pointer", font: "inherit", textAlign: "left", color: "var(--fg)" }} onClick={() => toast(l + " geöffnet", "check")}>
                <Icon name={ic} size={19} style={{ color: "var(--color-primary)" }} /><span style={{ flex: 1, fontWeight: 600, fontSize: 14 }}>{l}</span><Icon name="chevRight" size={16} style={{ color: "var(--fg-faint)" }} />
              </button>
            ))}
          </React.Fragment>
        )}
      </div>

      {/* Bottom tab bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "var(--surface)", borderTop: "1px solid var(--border)", display: "flex", padding: "8px 4px 22px", zIndex: 20 }}>
        {[["home", "Start", "dashboard"], ["jobs", "Aufträge", "orders"], ["protocol", "Protokoll", "camera"], ["profile", "Profil", "user"]].map(([k, l, ic]) => (
          <button key={k} onClick={() => setTab(k)} style={{ flex: 1, border: 0, background: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3, color: tab === k ? "var(--color-primary)" : "var(--fg-faint)", padding: "4px 0" }}>
            <Icon name={ic} size={21} sw={tab === k ? 2.4 : 2} /><span style={{ fontSize: 10.5, fontWeight: tab === k ? 700 : 600 }}>{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RouteMini({ from, to }) {
  return (
    <div style={{ position: "relative", paddingLeft: 18 }}>
      <div style={{ position: "absolute", left: 4, top: 6, bottom: 6, width: 2, background: "var(--border-strong)" }} />
      <div style={{ position: "relative", marginBottom: 8 }}><span style={{ position: "absolute", left: -18, top: 2, width: 10, height: 10, borderRadius: 99, background: "var(--info)", border: "2px solid var(--surface)" }} /><div className="t-strong" style={{ fontSize: 13 }}>{from.city}</div><div className="t-mut" style={{ fontSize: 11.5 }}>{from.street}, {from.plz}</div></div>
      <div style={{ position: "relative" }}><span style={{ position: "absolute", left: -18, top: 2, width: 10, height: 10, borderRadius: 99, background: "var(--danger)", border: "2px solid var(--surface)" }} /><div className="t-strong" style={{ fontSize: 13 }}>{to.city}</div><div className="t-mut" style={{ fontSize: 11.5 }}>{to.street}, {to.plz}</div></div>
    </div>
  );
}

function ActiveJob({ o, onAdvance, onNav }) {
  const steps = ["Angenommen", "Abgeholt", "Unterwegs", "Geliefert"];
  return (
    <div className="card" style={{ overflow: "hidden" }}>
      <div style={{ padding: 14 }}>
        <div className="flex items-center between" style={{ marginBottom: 12 }}><Plate value={o.plate} /><span className="t-mut" style={{ fontSize: 12 }}>{o.model.split(" ").slice(0, 2).join(" ")}</span></div>
        <RouteMini from={o.from} to={o.to} />
        {/* progress steps */}
        <div className="flex" style={{ gap: 4, margin: "16px 0 10px" }}>
          {steps.map((s, i) => <div key={s} style={{ flex: 1, height: 5, borderRadius: 99, background: i < o.step ? "var(--color-primary)" : "var(--surface-3)" }} />)}
        </div>
        <div className="flex items-center between" style={{ fontSize: 12 }}><span className="t-strong">{steps[Math.min(o.step, 3)]}</span><span className="t-mut">{o.step}/4</span></div>
        <div className="flex gap-sm" style={{ marginTop: 14 }}>
          <button className="btn" style={{ flex: 1, height: 46 }} onClick={onNav}><Icon name="mapPin" size={17} />Navi</button>
          {o.step < 4 ? <button className="btn btn-primary" style={{ flex: 1.5, height: 46 }} onClick={() => onAdvance(o.id)}><Icon name="check" size={17} />{steps[o.step] || "Abschließen"}</button>
            : <button className="btn btn-primary" style={{ flex: 1.5, height: 46 }} disabled><Icon name="check" size={17} />Abgeschlossen</button>}
        </div>
      </div>
    </div>
  );
}

function ProtocolForm({ toast, active }) {
  const [photos, setPhotos] = useState([false, false, false, false]);
  const [notes, setNotes] = useState("");
  const taken = photos.filter(Boolean).length;
  return (
    <React.Fragment>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--fg-3)", margin: "2px 0 10px" }}>Übergabe-Protokoll</div>
      {active && <div className="card" style={{ padding: 12, marginBottom: 14 }}><div className="flex items-center between"><Plate value={active.plate} /><span className="t-mut" style={{ fontSize: 12 }}>#{active.id}</span></div></div>}
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--fg-2)", marginBottom: 8 }}>Fotos ({taken}/4)</div>
      <div className="grid2" style={{ marginBottom: 16 }}>
        {["Front", "Heck", "Innenraum", "Schäden"].map((l, i) => (
          <button key={l} onClick={() => setPhotos(p => p.map((v, j) => j === i ? !v : v))} className="muted-box" style={{ height: 96, cursor: "pointer", borderColor: photos[i] ? "var(--ok)" : "var(--border-strong)", background: photos[i] ? "var(--ok-bg)" : "var(--surface-2)", color: photos[i] ? "var(--ok-fg)" : "var(--fg-3)", flexDirection: "column", gap: 5, font: "inherit" }}>
            <Icon name={photos[i] ? "check" : "camera"} size={24} sw={photos[i] ? 2.5 : 2} /><span style={{ fontSize: 11.5, fontWeight: 600 }}>{l}</span>
          </button>
        ))}
      </div>
      <Field label="Anmerkungen"><textarea className="textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Kratzer vorne links, Tank voll …" style={{ minHeight: 90 }} /></Field>
      <div style={{ marginTop: 8, padding: "12px 14px", border: "1px dashed var(--border-strong)", borderRadius: "var(--r)", textAlign: "center", color: "var(--fg-3)", fontSize: 12.5, marginBottom: 14 }}>
        <Icon name="edit" size={18} /><div style={{ marginTop: 4 }}>Unterschrift des Empfängers</div>
      </div>
      <button className="btn btn-primary" style={{ width: "100%", height: 48 }} disabled={taken < 4} onClick={() => toast("Protokoll gesendet", "send")}><Icon name="send" size={17} />Protokoll abschließen{taken < 4 ? ` (${4 - taken} Fotos fehlen)` : ""}</button>
    </React.Fragment>
  );
}
