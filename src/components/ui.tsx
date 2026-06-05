"use client";

/* MW Transport Service — shared UI components. Ported from app/ui.jsx */
import React, { useState, useEffect, useRef, useMemo, useCallback, useId } from "react";
import { Icon } from "./icon";
import { MWDATA } from "@/lib/data";


/* ---- color helper for avatars ---- */
const AV_COLORS = ["#0ea5e9","#8b5cf6","#f59e0b","#ec4899","#14b8a6","#ef4444","#6366f1","#10b981","#f97316","#06b6d4"];
export function avatarColor(seed) {
  let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return AV_COLORS[h % AV_COLORS.length];
}
export function initials(name) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] || "") + (p[p.length - 1]?.[0] || "")).toUpperCase();
}
export function Avatar({ name, size = 32 }) {
  return <div className="avatar" style={{ width: size, height: size, flexBasis: size, background: avatarColor(name), fontSize: size * 0.4 }}>{initials(name)}</div>;
}

/* ---- License plate ---- */
export function Plate({ value }) {
  const v = String(value).trim();
  const dash = v.indexOf("-");
  const region = dash > 0 ? v.slice(0, dash) : v.split(/\s+/)[0];
  const rest = dash > 0 ? v.slice(dash + 1).trim() : v.split(/\s+/).slice(1).join(" ");
  return (
    <span className="plate" title={v}>
      <span className="eu"><b>D</b></span>
      <span className="pn"><b style={{ fontWeight: 700 }}>{region}</b>{rest ? " " + rest : ""}</span>
    </span>
  );
}

/* ---- Status badge ---- */
export function StatusBadge({ status, size }) {
  const s = MWDATA.statusMap[status] || { label: status, cls: "" };
  return <span className={"badge " + s.cls + (size === "lg" ? " lg" : "")}><span className="dot"></span>{s.label}</span>;
}
export function TypeBadge({ type }) {
  const cls = type === "Selbständig" ? "info" : type === "Angestellt" ? "ok" : type === "Mini Job" ? "warn" : "";
  return <span className={"badge " + cls}>{type}</span>;
}

/* ---- Modal ---- */
export function Modal({ title, sub, onClose, children, footer, size }) {
  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={"modal" + (size === "lg" ? " lg" : "")} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div style={{ flex: 1 }}>
            <h2>{title}</h2>
            {sub && <div className="sub">{sub}</div>}
          </div>
          <button className="icon-btn sq" onClick={onClose} aria-label="Schließen"><Icon name="close" size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

/* ---- Toast ---- */
const ToastCtx = React.createContext(() => {});
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, icon = "check") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {toasts.map((t) => <div className="toast" key={t.id}><span className="ic"><Icon name={t.icon} size={16} /></span>{t.msg}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}
export const useToast = () => React.useContext(ToastCtx);

export function Sparkline({ data, w = 220, h = 56, fill = true }) {
  const max = Math.max(...data), min = Math.min(...data);
  const rng = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - 4 - ((v - min) / rng) * (h - 10)]);
  const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const area = line + ` L ${w} ${h} L 0 ${h} Z`;
  
  const rawId = useId();
  const gid = `sg-${rawId.replace(/:/g, "")}`; 

  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={area} fill={`url(#${gid})`} />}
      <path d={line} fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="3" fill="var(--color-primary)" />
    </svg>
  );
}
/* ---- Bars ---- */
export function MiniBars({ data, h = 60 }) {
  const max = Math.max(...data) || 1;
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: h }}>
      {data.map((v, i) => (
        <div key={i} title={v} style={{ flex: 1, height: Math.max(4, (v / max) * h) + "px", background: i === data.length - 1 ? "var(--color-primary)" : "var(--color-primary-soft)", borderRadius: "3px 3px 2px 2px", transition: "height .3s" }} />
      ))}
    </div>
  );
}

/* ---- Donut ---- */
export function Donut({ segments, size = 132, thick = 16 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - thick) / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;
  const colorFor = (cls) => ({ ok: "var(--ok)", info: "var(--info)", warn: "var(--warn)", danger: "var(--danger)", purple: "var(--purple)", "": "var(--border-strong)" }[cls] || "var(--border-strong)");
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={thick} />
        {segments.map((s, i) => {
          const len = (s.value / total) * c;
          const el = <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={colorFor(s.cls)} strokeWidth={thick} strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} strokeLinecap="butt" />;
          acc += len; return el;
        })}
      </g>
    </svg>
  );
}

/* ---- Field helpers ---- */
export function Field({ label, req, children, span }) {
  return <div className={"field" + (span ? " col-span2" : "")}><label>{label}{req && <span className="req">*</span>}</label>{children}</div>;
}
export function Switch({ on, onChange }) {
  return <button className={"switch" + (on ? " on" : "")} onClick={() => onChange(!on)} role="switch" aria-checked={on}></button>;
}
export function Check({ on, onChange, label }) {
  return (
    <button onClick={() => onChange(!on)} style={{ display: "flex", alignItems: "center", gap: 9, background: "none", border: 0, cursor: "pointer", font: "inherit", color: "var(--fg)", padding: 0 }}>
      <span className={"checkbox" + (on ? " on" : "")}>{on && <Icon name="check" size={13} sw={3} />}</span>
      {label && <span style={{ fontSize: "var(--font-ui)" }}>{label}</span>}
    </button>
  );
}

/* ---- Dropdown menu ---- */
export function Menu({ trigger, items, align = "right" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 6px)", [align]: 0, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--r)", boxShadow: "var(--shadow-pop)", padding: 5, minWidth: 180, zIndex: 60 }}>
          {items.map((it, i) => it.divider ? <div key={i} className="divider" style={{ margin: "5px 0" }} /> : (
            <button key={i} onClick={() => { setOpen(false); it.onClick && it.onClick(); }}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 9px", border: 0, background: "none", borderRadius: 6, cursor: "pointer", font: "inherit", fontSize: 13, fontWeight: 550, color: it.danger ? "var(--danger-fg)" : "var(--fg)", textAlign: "left" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-3)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "none"}>
              {it.icon && <Icon name={it.icon} size={15} />}{it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---- Page header ---- */
export function PageHead({ title, sub, children }) {
  return (
    <div className="page-head">
      <div style={{ flex: 1, minWidth: 200 }}>
        <h2 className="ph-title">{title}</h2>
        {sub && <div className="ph-sub">{sub}</div>}
      </div>
      {children && <div className="flex items-center gap-sm wrap">{children}</div>}
    </div>
  );
}

/* ---- Empty state ---- */
export function Empty({ icon = "search", title, sub }) {
  return <div className="empty"><div className="ic"><Icon name={icon} size={24} /></div><div style={{ fontWeight: 650, color: "var(--fg-2)" }}>{title}</div>{sub && <div style={{ fontSize: 13, marginTop: 4 }}>{sub}</div>}</div>;
}

/* ---- date format ---- */
export function fmtDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}
export function fmtEur(n) { return n.toLocaleString("de-DE") + " €"; }
