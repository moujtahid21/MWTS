/* ============================================================
   MW Fahrer-App — Main App: Navigation, Tabs, Host-Steuerung
   ============================================================ */
const LS = {
  get booted() { return localStorage.getItem("mwapp_booted") === "1"; },
  set booted(v) { localStorage.setItem("mwapp_booted", v ? "1" : "0"); },
  get theme() { return localStorage.getItem("mwapp_theme") || "light"; },
  set theme(v) { localStorage.setItem("mwapp_theme", v); },
  get device() { return localStorage.getItem("mwapp_device") || "ios"; },
  set device(v) { localStorage.setItem("mwapp_device", v); },
};

function App() {
  const [theme, setTheme] = useState(LS.theme);
  const [device, setDevice] = useState(LS.device);

  useEffect(() => { document.documentElement.setAttribute("data-theme", theme); LS.theme = theme; }, [theme]);
  useEffect(() => { LS.device = device; }, [device]);

  return (
    <div className="stage">
      <div className="stage-head">
        <div className="stage-brand"><span className="stage-mark">MW</span>
          <div><div className="stage-title">MW Fahrer-App</div><div className="stage-sub">Phase 3 · Interaktiver Prototyp</div></div>
        </div>
        <div className="stage-controls">
          <div className="seg-toggle">
            <button className={device === "ios" ? "active" : ""} onClick={() => setDevice("ios")}>iOS</button>
            <button className={device === "android" ? "active" : ""} onClick={() => setDevice("android")}>Android</button>
          </div>
          <div className="seg-toggle">
            <button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}><Icon name="sun" size={14} />Hell</button>
            <button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}><Icon name="moon" size={14} />Dunkel</button>
          </div>
        </div>
      </div>

      <ToastHost>
        <PhoneFrame os={device}>
          <DriverApp />
        </PhoneFrame>
      </ToastHost>

      <div className="stage-foot">Tipp: Alle Flows sind über die App erreichbar — Onboarding beim ersten Start, dann Angebote annehmen → Auftragsdetail → Protokolle. Über das Menü <Icon name="list" size={12} /> oben rechts in der App springst du direkt zu jedem Flow.</div>
    </div>
  );
}

/* ---------- The phone app itself ---------- */
function DriverApp() {
  const A = window.MWAPP;
  const toast = useToast();
  const me = A.me;
  const [booted, setBooted] = useState(LS.booted);
  const [tab, setTab] = useState("home");
  const [orders, setOrders] = useState(() => A.orders.map(o => ({ ...o })));
  const [stack, setStack] = useState([]); // [{name, id}]
  const [jumpOpen, setJumpOpen] = useState(false);

  const top = stack[stack.length - 1];
  const activeOrder = orders.find(o => o.dstate === "active");
  const curOrder = (top && top.id && orders.find(o => o.id === top.id)) || activeOrder;

  const push = (name, id) => setStack(s => [...s, { name, id }]);
  const pop = () => setStack(s => s.slice(0, -1));
  const reset = () => setStack([]);

  /* --- order actions --- */
  const accept = (id) => {
    setOrders(os => os.map(o => o.id === id
      ? { ...o, dstate: os.some(x => x.dstate === "active") ? "queued" : "active" }
      : o));
    toast("Auftrag angenommen", "check");
  };
  const reject = (id) => { setOrders(os => os.filter(o => o.id !== id)); toast("Auftrag abgelehnt", "close"); };
  const patchOrder = (id, patch) => setOrders(os => os.map(o => o.id === id ? { ...o, ...patch } : o));

  /* --- boot gate --- */
  if (!booted) {
    return <Onboarding onDone={() => { LS.booted = true; setBooted(true); toast("Willkommen bei MW", "checkCircle"); }} />;
  }

  /* --- overlay screens (full screen over tabs) --- */
  function renderTop() {
    if (!top) return null;
    const o = curOrder;
    switch (top.name) {
      case "detail":
        return <OrderDetail o={o} toast={toast} onBack={pop}
          onStartPickup={() => push("pickup", o.id)}
          onStartDropoff={() => push("dropoff", o.id)}
          onNav={() => toast("Navigation (Maps) wird geöffnet", "navigation")}
          onTracking={() => push("tracking", o.id)} />;
      case "pickup":
        return <PickupProtocol o={o} toast={toast} onClose={pop}
          onComplete={(data) => { patchOrder(o.id, { pickupDone: true, pickupData: data }); pop(); }} />;
      case "dropoff":
        return <DropoffProtocol o={o} pickupData={o.pickupData} toast={toast} onClose={pop}
          onEvent={() => push("event", o.id)}
          onComplete={() => { patchOrder(o.id, { dropoffDone: true, dstate: "done" }); reset(); setTab("home"); }} />;
      case "tracking":
        return <TrackingScreen o={o} toast={toast} onBack={pop} onEvent={(t) => push("event", o.id)} />;
      case "event":
        return <EventScreen initialType="choice" toast={toast} onBack={pop} onResolved={pop} />;
      case "scanner":
        return <ScannerScreen toast={toast} onBack={pop} />;
      case "calendar":
        return <CalendarScreen toast={toast} onBack={pop} />;
      default: return null;
    }
  }

  /* --- tab content --- */
  function renderTab() {
    switch (tab) {
      case "home": return <HomeTab me={me} orders={orders} onAccept={accept} onReject={reject} onOpenOrder={(id) => push("detail", id)} nav={() => toast("Navigation wird geöffnet", "navigation")} />;
      case "jobs": return <JobsTab orders={orders} onOpen={(id) => { const o = orders.find(x => x.id === id); if (o.dstate === "active") push("detail", id); else toast("Erst annehmen, um Details zu öffnen", "lock"); }} />;
      case "time": return <TimeTab toast={toast} />;
      case "profile": return <ProfileTab me={me} toast={toast} onCalendar={() => push("calendar")} onScanner={() => push("scanner")} />;
      default: return null;
    }
  }

  const jumpItems = [
    ["detail", "Auftragsdetail", () => activeOrder ? push("detail", activeOrder.id) : toast("Erst ein Angebot annehmen", "lock")],
    ["pickup", "Übernahmeprotokoll", () => activeOrder ? push("pickup", activeOrder.id) : toast("Erst ein Angebot annehmen", "lock")],
    ["dropoff", "Übergabeprotokoll", () => activeOrder ? push("dropoff", activeOrder.id) : toast("Erst ein Angebot annehmen", "lock")],
    ["tracking", "Live-Tracking", () => activeOrder ? push("tracking", activeOrder.id) : toast("Erst ein Angebot annehmen", "lock")],
    ["event", "Ereignis / Notfall", () => push("event")],
    ["scanner", "Dokumenten-Scanner", () => push("scanner")],
    ["calendar", "Kalender / Verfügbarkeit", () => push("calendar")],
    ["onboarding", "Onboarding erneut", () => { LS.booted = false; setBooted(false); reset(); }],
  ];

  return (
    <div className="app-root">
      {/* base layer: tabs */}
      <div className="app-base">
        {renderTab()}
        <div className="tabbar">
          {[["home", "Start", "home"], ["jobs", "Aufträge", "list"], ["time", "Zeit", "clock"], ["profile", "Profil", "user"]].map(([k, l, ic]) => (
            <button key={k} className={tab === k ? "active" : ""} onClick={() => setTab(k)}><Icon name={ic} size={22} sw={tab === k ? 2.4 : 2} /><span>{l}</span></button>
          ))}
        </div>
        {/* flow jump button */}
        <button className="jump-fab" onClick={() => setJumpOpen(true)}><Icon name="list" size={18} /></button>
      </div>

      {/* overlay screen */}
      {top && <div className="app-overlay">{renderTop()}</div>}

      {/* flow jump sheet */}
      <Sheet open={jumpOpen} onClose={() => setJumpOpen(false)} title="Zu Flow springen">
        {jumpItems.map(([k, l, fn]) => (
          <button key={k} className="profile-row" onClick={() => { setJumpOpen(false); fn(); }}>
            <Icon name="chevRight" size={16} style={{ color: "var(--color-primary)" }} /><span style={{ flex: 1 }}>{l}</span>
          </button>
        ))}
        <div className="muted" style={{ fontSize: 11.5, textAlign: "center", marginTop: 8 }}>Nur für die Vorschau — in der echten App entfällt dieses Menü.</div>
      </Sheet>
    </div>
  );
}

/* ---------- Jobs tab ---------- */
function JobsTab({ orders, onOpen }) {
  return (
    <div className="screen">
      <div className="apphead" style={{ paddingBottom: 20 }}>
        <div className="apphead-row"><div style={{ flex: 1 }}><div className="apphead-hi">Übersicht</div><div className="apphead-name">Meine Aufträge</div></div><Icon name="list" size={24} /></div>
      </div>
      <div className="screen-scroll pad pad-b">
        {orders.map(o => {
          const m = statusMeta(o);
          return (
            <Card key={o.id} className="card-pad" style={{ marginBottom: 10 }} onClick={() => onOpen(o.id)}>
              <div className="row between" style={{ marginBottom: 8 }}>
                <Plate value={o.plate} />
                <Pill tone={m.tone}>{o.dstate === "active" && <span className="livedot" />}{m.label}</Pill>
              </div>
              <RouteMini from={o.from} to={o.to} compact />
              <div className="row" style={{ gap: 6, marginTop: 10 }}><Pill icon="route">{fmtKm(o.km)} km</Pill><Pill>{o.customerShort}</Pill>{o.isNew && <Pill tone="warn">Neu</Pill>}</div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
