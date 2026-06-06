/* ============================================================
   MW Fahrer-App — Core: Primitives, SignaturePad, Phone-Chrome, Helpers
   Exports to window at end.
   React-Hooks (useState, useEffect, …) sind global via Inline-Script.
   ============================================================ */

/* ---------- Helpers ---------- */
const fmtKm = (n) => n.toLocaleString("de-DE");
const fmtEur = (n) => n.toLocaleString("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0 });
const initials = (name) => name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
const nowHM = () => new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
const pad2 = (n) => String(n).padStart(2, "0");
function fmtDur(sec) {
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = Math.floor(sec % 60);
  return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
}

/* ---------- Toast ---------- */
const ToastCtx = createContext(() => {});
function ToastHost({ children }) {
  const [toasts, setToasts] = useState([]);
  const push = useCallback((msg, icon = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-host">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <Icon name={t.icon} size={17} /><span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
const useToast = () => useContext(ToastCtx);

/* ---------- Buttons ---------- */
function Btn({ children, variant = "default", size = "md", full, disabled, onClick, icon, style }) {
  const cls = `btn btn-${variant} btn-${size}${full ? " btn-full" : ""}`;
  return (
    <button className={cls} disabled={disabled} onClick={onClick} style={style}>
      {icon && <Icon name={icon} size={size === "lg" ? 19 : 17} />}
      {children}
    </button>
  );
}

/* ---------- Card ---------- */
function Card({ children, style, onClick, className = "", accent }) {
  return (
    <div className={`card ${className}`} onClick={onClick}
      style={{ ...(accent ? { borderColor: "var(--color-primary)" } : null), ...style, cursor: onClick ? "pointer" : undefined }}>
      {children}
    </div>
  );
}

/* ---------- Section label ---------- */
function SLabel({ children, style }) {
  return <div className="slabel" style={style}>{children}</div>;
}

/* ---------- Switch ---------- */
function Switch({ on, onChange }) {
  return (
    <button className={`switch${on ? " on" : ""}`} onClick={() => onChange(!on)} role="switch" aria-checked={on}>
      <span className="switch-knob" />
    </button>
  );
}

/* ---------- Checkbox row ---------- */
function CheckRow({ checked, onChange, label, sub }) {
  return (
    <button className={`checkrow${checked ? " checked" : ""}`} onClick={() => onChange(!checked)}>
      <span className="checkbox">{checked && <Icon name="check" size={14} sw={3} />}</span>
      <span className="checkrow-text">
        <span className="checkrow-label">{label}</span>
        {sub && <span className="checkrow-sub">{sub}</span>}
      </span>
    </button>
  );
}

/* ---------- Counter / stepper ---------- */
function Counter({ value, onChange, min = 0, max = 9 }) {
  return (
    <div className="counter">
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}><Icon name="minus" size={16} /></button>
      <span>{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}><Icon name="plus" size={16} /></button>
    </div>
  );
}

/* ---------- Segmented control ---------- */
function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map(o => (
        <button key={o.value} className={value === o.value ? "active" : ""} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={15} />}{o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Plate ---------- */
function Plate({ value }) {
  return (
    <span className="plate"><span className="plate-eu"><span className="plate-stars" />D</span><span className="plate-num">{value}</span></span>
  );
}

/* ---------- Avatar ---------- */
function Avatar({ name, size = 40 }) {
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>{initials(name)}</span>;
}

/* ---------- Pill / badge ---------- */
function Pill({ children, tone = "neutral", icon }) {
  return <span className={`pill pill-${tone}`}>{icon && <Icon name={icon} size={12} />}{children}</span>;
}

/* ---------- Field ---------- */
function Field({ label, children, hint }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
}

/* ---------- Route mini ---------- */
function RouteMini({ from, to, compact }) {
  return (
    <div className={`routemini${compact ? " compact" : ""}`}>
      <div className="routemini-line" />
      <div className="routemini-stop">
        <span className="routemini-dot from" />
        <div className="routemini-city">{from.city} <span className="routemini-plz">{from.plz}</span></div>
        {!compact && <div className="routemini-street">{from.street}</div>}
      </div>
      <div className="routemini-stop">
        <span className="routemini-dot to" />
        <div className="routemini-city">{to.city} <span className="routemini-plz">{to.plz}</span></div>
        {!compact && <div className="routemini-street">{to.street}</div>}
      </div>
    </div>
  );
}

/* ============================================================
   SignaturePad — echtes Zeichnen auf Canvas (Maus + Touch)
   ============================================================ */
function SignaturePad({ onChange, height = 150, label }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const last = useRef(null);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.4; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.strokeStyle = getComputedStyle(canvas).getPropertyValue("--ink").trim() || "#16202b";
  }, []);

  const pos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const p = e.touches ? e.touches[0] : e;
    return { x: p.clientX - rect.left, y: p.clientY - rect.top };
  };
  const start = (e) => { e.preventDefault(); drawing.current = true; last.current = pos(e); };
  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const p = pos(e);
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p;
    if (!hasInk) { setHasInk(true); onChange && onChange(true); }
  };
  const end = () => { drawing.current = false; };
  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    setHasInk(false); onChange && onChange(false);
  };

  return (
    <div className="sigpad">
      <div className="sigpad-frame" style={{ height }}>
        <canvas ref={canvasRef}
          onMouseDown={start} onMouseMove={move} onMouseUp={end} onMouseLeave={end}
          onTouchStart={start} onTouchMove={move} onTouchEnd={end} />
        {!hasInk && <span className="sigpad-hint"><Icon name="edit" size={16} />{label || "Hier unterschreiben"}</span>}
        <span className="sigpad-baseline" />
      </div>
      <div className="sigpad-actions">
        <span className={`sigpad-status${hasInk ? " ok" : ""}`}>{hasInk ? "✓ Signatur erfasst" : "Noch nicht unterschrieben"}</span>
        <button className="sigpad-clear" onClick={clear}>Löschen</button>
      </div>
    </div>
  );
}

/* ============================================================
   Phone Chrome — iOS / Android Rahmen + Statusbar + Homebar
   ============================================================ */
function PhoneStatusBar({ os }) {
  return (
    <div className={`statusbar ${os}`}>
      <span className="statusbar-time">9:41</span>
      {os === "ios" && <span className="statusbar-notch" />}
      <span className="statusbar-icons">
        <Icon name="route" size={13} /><span className="statusbar-net">5G</span>
        <span className="statusbar-batt"><span className="statusbar-batt-fill" /></span>
      </span>
    </div>
  );
}

function PhoneFrame({ os = "ios", children }) {
  return (
    <div className={`phone phone-${os}`}>
      <div className="phone-screen">
        <PhoneStatusBar os={os} />
        <div className="phone-content">{children}</div>
        <div className={`homebar ${os}`}>{os === "android"
          ? <div className="android-nav"><span className="tri" /><span className="circ" /><span className="sq" /></div>
          : <span className="ios-bar" />}</div>
      </div>
    </div>
  );
}

/* ---------- Bottom sheet ---------- */
function Sheet({ open, onClose, children, title }) {
  if (!open) return null;
  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={e => e.stopPropagation()}>
        <div className="sheet-grab" />
        {title && <div className="sheet-title">{title}</div>}
        {children}
      </div>
    </div>
  );
}

/* ---------- Progress dots for multi-step ---------- */
function StepBar({ total, current }) {
  return (
    <div className="stepbar">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`stepbar-seg${i < current ? " done" : ""}${i === current ? " active" : ""}`} />
      ))}
    </div>
  );
}

Object.assign(window, {
  fmtKm, fmtEur, initials, nowHM, fmtDur, pad2,
  ToastHost, useToast, Btn, Card, SLabel, Switch, CheckRow, Counter, Segmented,
  Plate, Avatar, Pill, Field, RouteMini, SignaturePad,
  PhoneFrame, PhoneStatusBar, Sheet, StepBar,
});
