/* ============================================================
   MW Fahrer-App — Flow 6+7: Live-Tracking, Ereignis/Notfall, Scanner
   ============================================================ */

/* ---------- LIVE TRACKING ---------- */
function TrackingScreen({ o, onBack, onEvent, toast }) {
  const A = window.MWAPP;
  const [reminder, setReminder] = useState(false);
  const [delay, setDelay] = useState(false);
  const [eta, setEta] = useState(42);

  // Simulate ETA countdown; fire 30-min reminder
  useEffect(() => {
    const t = setInterval(() => {
      setEta(e => {
        const n = Math.max(0, e - 1);
        if (n === 30) setReminder(true);
        return n;
      });
    }, 1500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="screen">
      <div className="topbar">
        <button className="topbar-back" onClick={onBack}><Icon name="chevLeft" size={20} /></button>
        <div style={{ flex: 1 }}><div className="topbar-title">Live-Tracking</div><div className="topbar-sub">{o.plate} · permanentes GPS</div></div>
        <Pill tone="ok"><span className="livedot" />live</Pill>
      </div>
      <div className="screen-scroll pad pad-b">
        {/* Map */}
        <div className="mapview" style={{ marginBottom: 14 }}>
          <div className="mapview-road" /><div className="mapview-road two" />
          <span className="mapview-pin from" style={{ left: "18%", top: "34%" }}><Icon name="mapPin" size={26} /></span>
          <span className="mapview-pin" style={{ left: "82%", top: "62%" }}><Icon name="mapPin" size={26} /></span>
          <span className="mapview-car" style={{ left: "48%", top: "46%" }}><Icon name="car" size={16} /></span>
        </div>

        {reminder && (
          <div className="reminder-card">
            <div className="row" style={{ gap: 10 }}>
              <span className="reminder-ic"><Icon name="bell" size={20} /></span>
              <div style={{ flex: 1 }}><div className="t-strong">Ankunft in 30 Minuten</div><div className="muted" style={{ fontSize: 12.5 }}>Jetzt den Kunden anrufen, sobald du in der Nähe bist.</div></div>
            </div>
            <div className="row" style={{ gap: 8, marginTop: 12 }}>
              <Btn variant="primary" full icon="phone" onClick={() => { toast("Kunde wird angerufen", "phone"); setReminder(false); }}>Kunde anrufen</Btn>
              <Btn variant="outline" full icon="send" onClick={() => { toast("Auto-SMS an Kunde gesendet", "send"); setReminder(false); }}>Auto-SMS</Btn>
            </div>
          </div>
        )}

        {delay && (
          <div className="danger-box" style={{ marginBottom: 14 }}>
            <Icon name="alert" size={18} style={{ flex: "0 0 auto" }} />
            <div><strong>Verspätung erkannt.</strong> Stau auf der Route gefährdet den Termin. Kunde sofort informieren.
              <button className="btn btn-danger btn-sm" style={{ marginTop: 10 }} onClick={() => { toast("Verspätungsmeldung gesendet", "send"); setDelay(false); }}><Icon name="send" size={14} />Verspätung melden</button>
            </div>
          </div>
        )}

        <div className="grid3" style={{ marginBottom: 14 }}>
          <div className="stat-tile"><div className="stat-v">{eta}<small>min</small></div><div className="stat-l">ETA</div></div>
          <div className="stat-tile"><div className="stat-v">98<small>km/h</small></div><div className="stat-l">Tempo</div></div>
          <div className="stat-tile"><div className="stat-v">{fmtKm(o.km - 84)}<small>km</small></div><div className="stat-l">Rest</div></div>
        </div>

        <div className="ok-box" style={{ marginBottom: 14 }}><Icon name="route" size={18} style={{ flex: "0 0 auto" }} />Route entspricht der berechneten Strecke. Keine Abweichung.</div>

        <SLabel>Ereignis melden</SLabel>
        <Btn variant="danger" size="lg" full icon="alert" onClick={() => onEvent("choice")}>Schaden / Notfall melden</Btn>

        {/* Demo triggers */}
        <div className="demo-row">
          <button onClick={() => setReminder(true)}>▸ 30-Min-Reminder</button>
          <button onClick={() => setDelay(true)}>▸ Verspätung simulieren</button>
        </div>
      </div>
    </div>
  );
}

/* ---------- EREIGNIS / NOTFALL ---------- */
function EventScreen({ initialType, onBack, onResolved, toast }) {
  const A = window.MWAPP;
  // type: choice | stone | accident
  const [type, setType] = useState(initialType === "damage" ? "choice" : (initialType || "choice"));
  const [form, setForm] = useState({ plate: "", km: "", time: nowHM(), place: "" });
  const [called, setCalled] = useState(false);
  const police = type === "accident";
  const formOk = form.km && form.place;

  if (type === "choice") {
    return (
      <div className="screen" style={{ background: "var(--surface)" }}>
        <EventTop onBack={onBack} title="Ereignis melden" />
        <div className="screen-scroll pad pad-b">
          <div className="danger-box" style={{ marginBottom: 16 }}><Icon name="alert" size={18} style={{ flex: "0 0 auto" }} /><div>Nicht eigenständig handeln. Wähle die Art des Ereignisses — die App führt dich durch die Pflichtschritte.</div></div>
          <button className="event-choice" onClick={() => setType("stone")}>
            <span className="event-choice-ic warn"><Icon name="alert" size={22} /></span>
            <div><div className="t-strong">Steinschlag mit Rissbildung</div><div className="muted" style={{ fontSize: 12.5 }}>Sofort anhalten · Daten erfassen · Büro anrufen</div></div>
            <Icon name="chevRight" size={18} style={{ color: "var(--fg-faint)" }} />
          </button>
          <button className="event-choice" onClick={() => setType("accident")}>
            <span className="event-choice-ic danger"><Icon name="alert" size={22} /></span>
            <div><div className="t-strong">Unfall / Wildschaden / Vandalismus</div><div className="muted" style={{ fontSize: 12.5 }}>Polizei zwingend · Daten erfassen · Büro anrufen</div></div>
            <Icon name="chevRight" size={18} style={{ color: "var(--fg-faint)" }} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="screen" style={{ background: "var(--surface)" }}>
      <EventTop onBack={() => setType("choice")} title={type === "stone" ? "Steinschlag" : "Unfall / Schaden"} />
      <div className="screen-scroll pad pad-b">
        <div className="danger-box" style={{ marginBottom: 14 }}>
          <Icon name="stop" size={18} style={{ flex: "0 0 auto" }} />
          <div><strong>Sofort an geeigneter Stelle anhalten.</strong> Weiterfahren erst nach Freigabe durch das Büro.</div>
        </div>
        {police && <div className="danger-box" style={{ marginBottom: 14, border: "1px solid var(--danger)" }}><Icon name="shield" size={18} style={{ flex: "0 0 auto" }} /><div><strong>Polizei hinzuziehen!</strong> Das Rufen der Behörden ist zwingend erforderlich.</div></div>}

        <SLabel>Ereignis erfassen</SLabel>
        <Field label="Kennzeichen Verursacher (falls vorhanden)"><input className="input" value={form.plate} onChange={e => setForm(f => ({ ...f, plate: e.target.value.toUpperCase() }))} placeholder="z. B. K-AB 1234" /></Field>
        <div className="grid2">
          <Field label="Kilometerstand"><input className="input" type="number" inputMode="numeric" value={form.km} onChange={e => setForm(f => ({ ...f, km: e.target.value }))} placeholder="km" /></Field>
          <Field label="Uhrzeit"><input className="input" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} /></Field>
        </div>
        <Field label="Ort / Straßenabschnitt"><input className="input" value={form.place} onChange={e => setForm(f => ({ ...f, place: e.target.value }))} placeholder="z. B. A3 km 142, Ri. Köln" /></Field>

        <SLabel style={{ marginTop: 8 }}>Notruf Betriebsleitung</SLabel>
        {A.ops.map(p => (
          <button key={p.name} className="call-row" onClick={() => { setCalled(true); toast(p.name + " wird angerufen", "phone"); }}>
            <span className="call-ic"><Icon name="phone" size={18} /></span>
            <div style={{ flex: 1 }}><div className="t-strong" style={{ fontSize: 14 }}>{p.name}</div><div className="muted" style={{ fontSize: 12.5, fontFamily: "var(--mono)" }}>{p.phone}</div></div>
            <Icon name="phone" size={16} style={{ color: "var(--color-primary)" }} />
          </button>
        ))}

        <div className="note-box" style={{ marginTop: 14 }}><Icon name="lock" size={18} style={{ flex: "0 0 auto" }} />Weiterfahren ist gesperrt, bis das Büro die Freigabe erteilt.</div>
        <Btn variant="primary" size="lg" full style={{ marginTop: 14 }} disabled={!(formOk && called)} icon="checkCircle"
          onClick={() => { toast("Ereignis gemeldet · warte auf Freigabe", "send"); onResolved(); }}>
          {formOk && called ? "Ereignis absenden" : "Daten erfassen & Büro anrufen"}
        </Btn>
      </div>
    </div>
  );
}

function EventTop({ onBack, title }) {
  return (
    <div className="topbar" style={{ background: "var(--danger-bg)" }}>
      <button className="topbar-back" onClick={onBack}><Icon name="chevLeft" size={20} /></button>
      <div style={{ flex: 1 }}><div className="topbar-title" style={{ color: "var(--danger-fg)" }}>{title}</div><div className="topbar-sub">Notfall-Protokoll</div></div>
    </div>
  );
}

/* ---------- DOKUMENTEN-SCANNER ---------- */
function ScannerScreen({ onBack, toast }) {
  const types = [
    ["fuel", "Tankbeleg", "Auslagen Betankung"],
    ["droplet", "Waschstraßenbeleg", "Auslagen Wäsche"],
    ["fileText", "CMR-Frachtbrief", "Pflicht bei Neufahrzeugen"],
    ["doc", "Sonstige Quittung", "Parkgebühren, Öl, etc."],
  ];
  const [active, setActive] = useState(null);
  const [phase, setPhase] = useState("idle"); // idle | scanning | done

  const startScan = (label) => {
    setActive(label); setPhase("scanning");
    setTimeout(() => setPhase("done"), 1900);
  };

  return (
    <div className="screen" style={{ background: "var(--surface)" }}>
      <div className="topbar">
        <button className="topbar-back" onClick={onBack}><Icon name="chevLeft" size={20} /></button>
        <div style={{ flex: 1 }}><div className="topbar-title">Dokumenten-Scanner</div><div className="topbar-sub">Randerkennung · PDF · Auto-Upload</div></div>
      </div>
      <div className="screen-scroll pad pad-b">
        {phase === "idle" && (
          <React.Fragment>
            <div className="info-box" style={{ marginBottom: 16 }}><Icon name="info" size={18} style={{ flex: "0 0 auto" }} />Reine Fotos sind für die Abrechnung unzulässig. Belege müssen als PDF gescannt werden.</div>
            <SLabel>Belegart wählen</SLabel>
            {types.map(([ic, t, s]) => (
              <button key={t} className="proto-action" onClick={() => startScan(t)}>
                <span className="proto-ic"><Icon name={ic} size={22} /></span>
                <div className="proto-text"><div className="t-strong">{t}</div><div className="muted" style={{ fontSize: 12 }}>{s}</div></div>
                <Icon name="scan" size={18} style={{ color: "var(--fg-faint)" }} />
              </button>
            ))}
          </React.Fragment>
        )}

        {phase === "scanning" && (
          <div className="scanner-view">
            <div className="scanner-doc"><Icon name="fileText" size={54} /><div className="scanner-line" /></div>
            <div className="t-strong" style={{ marginTop: 18 }}>Scanne {active} …</div>
            <div className="muted" style={{ fontSize: 12.5 }}>Randerkennung · Perspektivkorrektur · Kontrast</div>
          </div>
        )}

        {phase === "done" && (
          <div className="scanner-done">
            <div className="scanner-pdf"><Icon name="checkCircle" size={30} /></div>
            <div className="t-strong" style={{ fontSize: 16, marginTop: 12 }}>{active} gescannt</div>
            <div className="muted" style={{ fontSize: 13, marginBottom: 4 }}>In kompaktes PDF umgewandelt</div>
            <div className="pdf-chip"><Icon name="doc" size={15} />{active.replace(/\s/g, "_")}_549927.pdf · 214 KB</div>
            <div className="ok-box" style={{ marginTop: 16, width: "100%" }}><Icon name="check" size={16} />Automatisch in den Auftrag hochgeladen</div>
            <div className="row" style={{ gap: 8, marginTop: 16, width: "100%" }}>
              <Btn variant="outline" full onClick={() => setPhase("idle")} icon="scan">Weiterer Beleg</Btn>
              <Btn variant="primary" full onClick={onBack} icon="check">Fertig</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { TrackingScreen, EventScreen, ScannerScreen });
