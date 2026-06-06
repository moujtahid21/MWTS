/* ============================================================
   MW Fahrer-App — Flow 3+8: Zeiterfassung, Kalender, Profil
   ============================================================ */

/* ---------- ZEITERFASSUNG (Stempeluhr) ---------- */
function TimeTab({ toast }) {
  // mode: idle | work | pause | wait
  const [mode, setMode] = useState("idle");
  const [workSec, setWorkSec] = useState(0);
  const [pauseSec, setPauseSec] = useState(0);
  const [waitSec, setWaitSec] = useState(0);
  const [log, setLog] = useState([]);

  useEffect(() => {
    const t = setInterval(() => {
      setMode(m => {
        if (m === "work") setWorkSec(s => s + 1);
        else if (m === "pause") setPauseSec(s => s + 1);
        else if (m === "wait") setWaitSec(s => s + 1);
        return m;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const stamp = (label, icon) => setLog(l => [{ label, time: nowHM(), icon }, ...l].slice(0, 8));

  const setM = (next, label, icon) => { setMode(next); stamp(label, icon); toast(label, icon); };

  const working = mode === "work";
  return (
    <div className="screen">
      <div className="apphead" style={{ paddingBottom: 22 }}>
        <div className="apphead-row"><div style={{ flex: 1 }}><div className="apphead-hi">Zeiterfassung</div><div className="apphead-name">Stempeluhr</div></div><Icon name="clock" size={24} /></div>
      </div>
      <div className="screen-scroll pad pad-b">
        {/* Big timer */}
        <div className={`timer-card ${mode}`}>
          <div className="timer-state">{mode === "idle" ? "Bereit" : mode === "work" ? "Arbeitszeit läuft" : mode === "pause" ? "Pause" : "Wartezeit"}</div>
          <div className="timer-big">{fmtDur(mode === "pause" ? pauseSec : mode === "wait" ? waitSec : workSec)}</div>
          <div className="timer-sub">{mode === "idle" ? "Starte deine Tour" : nowHM() + " Uhr"}</div>
        </div>

        {/* Primary work control */}
        {mode === "idle" || mode === "work" ? (
          <Btn variant={working ? "danger" : "primary"} size="lg" full style={{ margin: "14px 0" }}
            icon={working ? "stop" : "play"} onClick={() => working ? setM("idle", "Arbeitszeit beendet", "stop") : setM("work", "Arbeitszeit gestartet", "play")}>
            {working ? "Arbeitszeit beenden" : "Arbeitszeit starten"}
          </Btn>
        ) : (
          <Btn variant="primary" size="lg" full style={{ margin: "14px 0" }} icon="play" onClick={() => setM("work", "Zurück zur Arbeit", "play")}>Weiterarbeiten</Btn>
        )}

        {/* Pause / Wait */}
        <div className="grid2" style={{ marginBottom: 18 }}>
          <button className={`clock-btn${mode === "pause" ? " active" : ""}`} disabled={mode === "idle"}
            onClick={() => mode === "pause" ? setM("work", "Pause beendet", "play") : setM("pause", "Pause gestartet", "pause")}>
            <Icon name="pause" size={22} /><span>{mode === "pause" ? "Pause beenden" : "Pause"}</span>
          </button>
          <button className={`clock-btn${mode === "wait" ? " active" : ""}`} disabled={mode === "idle"}
            onClick={() => mode === "wait" ? setM("work", "Wartezeit beendet", "play") : setM("wait", "Wartezeit gestartet", "clock")}>
            <Icon name="clock" size={22} /><span>{mode === "wait" ? "Warten beenden" : "Wartezeit"}</span>
          </button>
        </div>

        {/* Totals */}
        <div className="grid3" style={{ marginBottom: 18 }}>
          <div className="stat-tile"><div className="stat-v" style={{ fontSize: 17 }}>{fmtDur(workSec).slice(0, 5)}</div><div className="stat-l">Arbeit</div></div>
          <div className="stat-tile"><div className="stat-v" style={{ fontSize: 17 }}>{fmtDur(pauseSec).slice(0, 5)}</div><div className="stat-l">Pause</div></div>
          <div className="stat-tile"><div className="stat-v" style={{ fontSize: 17 }}>{fmtDur(waitSec).slice(0, 5)}</div><div className="stat-l">Warten</div></div>
        </div>

        <div className="info-box" style={{ marginBottom: 16 }}><Icon name="info" size={17} style={{ flex: "0 0 auto" }} />Wartezeiten (Abholung, Tankstelle, Waschstraße) werden gesondert getrackt.</div>

        {log.length > 0 && <React.Fragment>
          <SLabel>Heutige Stempel</SLabel>
          {log.map((e, i) => (
            <div className="log-row" key={i}><span className="log-ic"><Icon name={e.icon} size={15} /></span><span style={{ flex: 1 }}>{e.label}</span><span className="muted" style={{ fontFamily: "var(--mono)", fontSize: 12.5 }}>{e.time}</span></div>
          ))}
        </React.Fragment>}
      </div>
    </div>
  );
}

/* ---------- KALENDER (Shiftplanner-Sync, grün/rot) ---------- */
function CalendarScreen({ onBack, toast }) {
  const today = 7; // 7. Juni
  const [avail, setAvail] = useState(() => {
    const init = {};
    for (let d = 1; d <= 30; d++) init[d] = (d % 7 === 0 || d % 7 === 6) ? "off" : "on";
    return init;
  });
  const toggle = (d) => setAvail(a => ({ ...a, [d]: a[d] === "on" ? "off" : "on" }));
  const weekdays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const firstOffset = 0; // 1. Juni 2026 = Montag

  return (
    <div className="screen">
      <div className="topbar">
        <button className="topbar-back" onClick={onBack}><Icon name="chevLeft" size={20} /></button>
        <div style={{ flex: 1 }}><div className="topbar-title">Verfügbarkeit</div><div className="topbar-sub">Juni 2026 · Sync mit Disposition</div></div>
        <button className="navbtn" style={{ width: 38, height: 38, borderRadius: 11, background: "var(--surface-2)", color: "var(--fg)", border: "1px solid var(--border)" }} onClick={() => toast("Mit Disposition synchronisiert", "refresh")}><Icon name="refresh" size={17} /></button>
      </div>
      <div className="screen-scroll pad pad-b">
        <div className="row" style={{ gap: 16, marginBottom: 14 }}>
          <span className="legend-dot"><span style={{ background: "var(--ok)" }} />Verfügbar</span>
          <span className="legend-dot"><span style={{ background: "var(--danger)" }} />Nicht verfügbar</span>
        </div>
        <div className="cal-grid cal-head">{weekdays.map(w => <span key={w} className="cal-wd">{w}</span>)}</div>
        <div className="cal-grid">
          {Array.from({ length: firstOffset }).map((_, i) => <span key={"e" + i} />)}
          {Array.from({ length: 30 }).map((_, i) => {
            const d = i + 1;
            return (
              <button key={d} className={`cal-day ${avail[d]}${d === today ? " today" : ""}`} onClick={() => toggle(d)}>
                {d}
              </button>
            );
          })}
        </div>
        <div className="info-box" style={{ marginTop: 16 }}><Icon name="calendar" size={17} style={{ flex: "0 0 auto" }} />Tippe einen Tag, um zwischen verfügbar (grün) und abwesend (rot) zu wechseln. Änderungen synchronisieren in Echtzeit mit <strong>/shiftplanner</strong>.</div>
      </div>
    </div>
  );
}

/* ---------- PROFIL ---------- */
function ProfileTab({ me, onCalendar, onScanner, toast }) {
  const items = [
    ["user", "Persönliche Daten", () => toast("Persönliche Daten", "user")],
    ["calendar", "Verfügbarkeit / Kalender", onCalendar],
    ["scan", "Dokumenten-Scanner", onScanner],
    ["fileText", "Meine Dokumente & Fahrerhandbuch", () => toast("Dokumente geöffnet", "fileText")],
    ["euro", "Vergütung & Abrechnung", () => toast("Abrechnung", "euro")],
    ["shield", "Datenschutz (DSGVO)", () => toast("Datenschutz", "shield")],
  ];
  return (
    <div className="screen">
      <div className="apphead" style={{ paddingBottom: 24, textAlign: "center" }}>
        <div style={{ display: "grid", placeItems: "center", gap: 10 }}>
          <Avatar name={me.name} size={66} />
          <div><div className="apphead-name" style={{ fontSize: 18 }}>{me.name}</div><div className="apphead-hi">{me.email}</div></div>
          <div className="row" style={{ gap: 8, justifyContent: "center" }}>
            <span className="pill" style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}>{me.type}</span>
            <span className="pill" style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}><Icon name="star" size={11} />{me.rating}</span>
            <span className="pill" style={{ background: "rgba(255,255,255,.18)", color: "#fff" }}>{me.trips} Fahrten</span>
          </div>
        </div>
      </div>
      <div className="screen-scroll pad pad-b">
        {items.map(([ic, l, fn]) => (
          <button key={l} className="profile-row" onClick={fn}>
            <Icon name={ic} size={19} style={{ color: "var(--color-primary)" }} /><span style={{ flex: 1 }}>{l}</span><Icon name="chevRight" size={16} style={{ color: "var(--fg-faint)" }} />
          </button>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { TimeTab, CalendarScreen, ProfileTab });
