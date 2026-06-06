/* ============================================================
   MW Fahrer-App — Flow 2: Dashboard, Annahme-Workflow, Auftragsdetail
   ============================================================ */
function statusMeta(o) {
  if (o.dstate === "offer") return { tone: "brand", label: "Angebot" };
  if (o.dstate === "active") return { tone: "ok", label: "Aktiv" };
  if (o.dstate === "done") return { tone: "neutral", label: "Abgeschlossen" };
  return { tone: "neutral", label: "Warteschlange" };
}

function FuelBadge({ o }) {
  if (o.fuel === "ev") return <Pill tone="info" icon="zap">Elektro</Pill>;
  return <Pill tone="neutral" icon="fuel">{o.fuel === "diesel" ? "Diesel" : "Benzin"}</Pill>;
}

/* ---------- HOME TAB ---------- */
function HomeTab({ me, orders, onAccept, onReject, onOpenOrder, nav }) {
  const offers = orders.filter(o => o.dstate === "offer");
  const active = orders.find(o => o.dstate === "active");
  const queued = orders.filter(o => o.dstate === "queued");

  return (
    <div className="screen">
      <div className="apphead">
        <div className="apphead-row">
          <Avatar name={me.name} size={42} />
          <div style={{ flex: 1 }}>
            <div className="apphead-hi">Willkommen,</div>
            <div className="apphead-name">{me.first}</div>
          </div>
          <div className="apphead-bell"><Icon name="bell" size={22} /><span className="dot" /></div>
        </div>
        <div className="apphead-stats">
          <div className="apphead-stat"><div className="apphead-stat-v">{orders.filter(o => o.dstate !== "offer").length}</div><div className="apphead-stat-l">Heute</div></div>
          <div className="apphead-stat"><div className="apphead-stat-v">{offers.length}</div><div className="apphead-stat-l">Angebote</div></div>
          <div className="apphead-stat"><div className="apphead-stat-v">★ {me.rating}</div><div className="apphead-stat-l">Rating</div></div>
        </div>
      </div>

      <div className="screen-scroll pad pad-b">
        {offers.length > 0 && <SLabel>Neue Angebote · Push erhalten</SLabel>}
        {offers.map(o => <OfferCard key={o.id} o={o} onAccept={onAccept} onReject={onReject} />)}

        <SLabel style={{ marginTop: offers.length ? 20 : 4 }}>Aktiver Auftrag</SLabel>
        {active
          ? <ActiveCard o={active} onOpen={() => onOpenOrder(active.id)} nav={nav} />
          : <div className="empty">Kein aktiver Auftrag.<br />Nimm ein Angebot an, um zu starten.</div>}

        {queued.length > 0 && <React.Fragment>
          <SLabel style={{ marginTop: 20 }}>In Warteschlange</SLabel>
          {queued.map(o => (
            <Card key={o.id} style={{ marginBottom: 10, opacity: .85 }} className="card-pad">
              <div className="row between" style={{ marginBottom: 8 }}><Plate value={o.plate} /><Pill>{statusMeta(o).label}</Pill></div>
              <RouteMini from={o.from} to={o.to} compact />
            </Card>
          ))}
        </React.Fragment>}
      </div>
    </div>
  );
}

/* ---------- Offer card (Zustandsschutz: nur Annehmen/Ablehnen) ---------- */
function OfferCard({ o, onAccept, onReject }) {
  return (
    <Card accent style={{ marginBottom: 12, overflow: "hidden" }}>
      <div className="offer-banner">
        <Icon name="bell" size={14} /><span>Neuer Auftrag</span><span className="offer-price">{fmtEur(o.price)}</span>
      </div>
      <div className="card-pad">
        <div className="row between" style={{ marginBottom: 10 }}>
          <Plate value={o.plate} />
          <div className="row" style={{ gap: 6 }}>{o.isNew && <Pill tone="warn" icon="star">Neufahrzeug</Pill>}<FuelBadge o={o} /></div>
        </div>
        <div className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>{o.model}</div>
        <RouteMini from={o.from} to={o.to} />
        <div className="row" style={{ gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          <Pill icon="route">{fmtKm(o.km)} km</Pill>
          <Pill icon="calendar">{o.pickupWindow}</Pill>
          <Pill tone="brand">{o.customerShort}</Pill>
        </div>
        <div className="lock-hint"><Icon name="lock" size={13} />Details erst nach Annahme sichtbar</div>
        <div className="row" style={{ gap: 10, marginTop: 12 }}>
          <Btn variant="outline" full onClick={() => onReject(o.id)} icon="close">Ablehnen</Btn>
          <Btn variant="primary" full onClick={() => onAccept(o.id)} icon="check" style={{ flex: 1.5 }}>Annehmen</Btn>
        </div>
      </div>
    </Card>
  );
}

/* ---------- Active job card ---------- */
function ActiveCard({ o, onOpen, nav }) {
  const stage = o.pickupDone ? (o.dropoffDone ? 3 : 2) : 1;
  const stages = ["Angenommen", "Übernommen", "Unterwegs", "Geliefert"];
  return (
    <Card accent onClick={onOpen} style={{ overflow: "hidden" }}>
      <div className="card-pad">
        <div className="row between" style={{ marginBottom: 10 }}>
          <Plate value={o.plate} />
          <Pill tone="ok"><span className="livedot" />aktiv</Pill>
        </div>
        <RouteMini from={o.from} to={o.to} />
        <div className="stepbar" style={{ margin: "14px 0 8px" }}>
          {stages.map((s, i) => <div key={s} className={`stepbar-seg${i < stage ? " done" : ""}`} />)}
        </div>
        <div className="row between" style={{ fontSize: 12 }}>
          <span className="t-strong">{stages[Math.min(stage, 3)]}</span>
          <span className="muted">Tippen für Details →</span>
        </div>
      </div>
    </Card>
  );
}

/* ============================================================
   ORDER DETAIL (nach Annahme) — Stammdaten, Notizen, Trip, Aktionen
   ============================================================ */
function OrderDetail({ o, onBack, onStartPickup, onStartDropoff, onNav, onTracking, toast }) {
  return (
    <div className="screen">
      <div className="topbar">
        <button className="topbar-back" onClick={onBack}><Icon name="chevLeft" size={20} /></button>
        <div style={{ flex: 1 }}><div className="topbar-title">Auftrag #{o.id}</div><div className="topbar-sub">{o.customerShort}</div></div>
        <Pill tone="ok"><span className="livedot" />aktiv</Pill>
      </div>
      <div className="screen-scroll pad pad-b">
        {o.isNew && <div className="note-box" style={{ marginBottom: 14 }}><Icon name="star" size={18} style={{ flex: "0 0 auto" }} /><div><strong>Neufahrzeug.</strong> Penible Prüfung, Foto-Pflicht, Übergabe nur im Freien bei Tageslicht. Max. 130 km/h.</div></div>}

        {/* Vehicle */}
        <Card className="card-pad" style={{ marginBottom: 12 }}>
          <div className="row between" style={{ marginBottom: 12 }}><Plate value={o.plate} /><FuelBadge o={o} /></div>
          <div className="kv"><span className="kv-k">Modell</span><span className="kv-v">{o.model}</span></div>
          <div className="kv"><span className="kv-k">FIN / VIN</span><span className="kv-v" style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{o.vin}</span></div>
          <div className="kv"><span className="kv-k">Kilometerstand</span><span className="kv-v">{fmtKm(o.mileage)} km</span></div>
          <div className="kv"><span className="kv-k">MV-Nr.</span><span className="kv-v">{o.mvNr}</span></div>
          <div className="kv"><span className="kv-k">Kunde</span><span className="kv-v">{o.customer}</span></div>
        </Card>

        {/* Note */}
        {o.note && <div className="info-box" style={{ marginBottom: 14 }}><Icon name="info" size={18} style={{ flex: "0 0 auto" }} /><div><strong>Hinweis Disposition:</strong> {o.note}</div></div>}

        {/* Contact */}
        <Card className="card-pad" style={{ marginBottom: 14 }}>
          <div className="row between">
            <div><div className="muted" style={{ fontSize: 12 }}>Ansprechpartner vor Ort</div><div className="t-strong">{o.contact.name}</div></div>
            <button className="btn btn-soft btn-sm" onClick={() => toast("Anruf wird gestartet", "phone")}><Icon name="phone" size={15} />Anrufen</button>
          </div>
        </Card>

        {/* Trip + Navi */}
        <SLabel>Strecke</SLabel>
        <Card className="card-pad" style={{ marginBottom: 8 }}>
          <NavStop label="Abholort" stop={o.from} window={o.pickupWindow} onNav={() => onNav(o.from)} />
          <div className="divider" />
          <NavStop label="Abgabeort" stop={o.to} onNav={() => onNav(o.to)} />
        </Card>
        <div className="row" style={{ gap: 8, marginBottom: 18, marginTop: 12 }}>
          <Btn variant="outline" full icon="gps" onClick={onTracking}>Live-Tracking</Btn>
        </div>

        {/* Protocol actions */}
        <SLabel>Protokolle</SLabel>
        <button className={`proto-action${o.pickupDone ? " done" : ""}`} onClick={onStartPickup}>
          <span className="proto-ic"><Icon name={o.pickupDone ? "checkCircle" : "fileText"} size={22} /></span>
          <div className="proto-text"><div className="t-strong">Übernahmeprotokoll</div><div className="muted" style={{ fontSize: 12 }}>{o.pickupDone ? "Abgeschlossen · erneut öffnen" : "Pickup — Schäden, Checkliste, Reifen, Signaturen"}</div></div>
          <Icon name="chevRight" size={18} style={{ color: "var(--fg-faint)" }} />
        </button>
        <button className={`proto-action${o.dropoffDone ? " done" : ""}${!o.pickupDone ? " locked" : ""}`} onClick={() => o.pickupDone ? onStartDropoff() : toast("Zuerst Übernahme abschließen", "lock")}>
          <span className="proto-ic"><Icon name={o.dropoffDone ? "checkCircle" : (o.pickupDone ? "fileText" : "lock")} size={22} /></span>
          <div className="proto-text"><div className="t-strong">Übergabeprotokoll</div><div className="muted" style={{ fontSize: 12 }}>{o.pickupDone ? "Drop-off — Ident-Check, Neuschaden, 3 Signaturen" : "Erst nach Übernahme verfügbar"}</div></div>
          <Icon name="chevRight" size={18} style={{ color: "var(--fg-faint)" }} />
        </button>
      </div>
    </div>
  );
}

function NavStop({ label, stop, window, onNav }) {
  return (
    <div className="row between" style={{ alignItems: "flex-start" }}>
      <div className="row" style={{ alignItems: "flex-start", gap: 10 }}>
        <span className={`navstop-dot ${label === "Abholort" ? "from" : "to"}`} />
        <div>
          <div className="muted" style={{ fontSize: 11.5 }}>{label}{window ? ` · ${window}` : ""}</div>
          <div className="t-strong" style={{ fontSize: 14 }}>{stop.city} <span className="muted" style={{ fontWeight: 500 }}>{stop.plz}</span></div>
          <div className="muted" style={{ fontSize: 12.5 }}>{stop.street}</div>
        </div>
      </div>
      <button className="navbtn" onClick={onNav}><Icon name="navigation" size={18} /></button>
    </div>
  );
}

Object.assign(window, { HomeTab, OrderDetail, statusMeta, FuelBadge });
