/* ============================================================
   MW Fahrer-App — Flow 5: Übergabeprotokoll (Drop-off, 4 Schritte)
   Tank-/Ladelogik · Wasch-Algorithmus · Ident-Check · 3 Signaturen
   ============================================================ */
function DropoffProtocol({ o, pickupData, onClose, onComplete, onEvent, toast }) {
  const [step, setStep] = useState(0);
  const steps = ["Tank & Pflege", "Neuschaden", "Ident-Check", "Signaturen"];
  const isEV = o.fuel === "ev";

  // Tank / charge
  const [fuelVal, setFuelVal] = useState(""); // km Restreichweite (Verbrenner) oder % (EV)
  // Wash algorithm
  const dirtyAtPickup = false; // aus Übernahme (Demo: nicht verschmutzt)
  const washRequired = o.km > 200 || dirtyAtPickup;
  const [washScanned, setWashScanned] = useState(false);

  // New damage
  const pickupDamages = (pickupData && pickupData.damages) || [];
  const [hasNewDamage, setHasNewDamage] = useState(null);

  // Identity
  const [knownPerson, setKnownPerson] = useState(false);
  const [docShown, setDocShown] = useState(false);
  const [recipientName, setRecipientName] = useState("");

  // Signatures (3)
  const [sig1, setSig1] = useState(false); // Übergebender
  const [sig2, setSig2] = useState(false); // Fahrer
  const [sig3, setSig3] = useState(false); // Übernehmender/Kunde

  const fuelNum = parseFloat(String(fuelVal).replace(",", "."));
  const fuelOk = isEV
    ? (fuelNum >= 30)            // EV: mind. 30 %
    : (fuelNum >= 150);          // Verbrenner: mind. 150 km Restreichweite
  const fuelEntered = fuelVal !== "" && !isNaN(fuelNum);
  const washOk = !washRequired || washScanned;
  const identOk = knownPerson || (docShown && recipientName.trim().length > 1);

  const canNext = () => {
    if (step === 0) return fuelEntered && fuelOk && washOk;
    if (step === 1) return hasNewDamage !== null;
    if (step === 2) return identOk;
    if (step === 3) return sig1 && sig2 && sig3;
    return true;
  };

  const finish = () => { onComplete({ fuelVal, recipientName }); toast("Übergabe abgeschlossen · Protokoll gültig", "checkCircle"); };
  const next = () => {
    if (step === 1 && hasNewDamage === "yes") { onEvent("damage"); return; }
    step < steps.length - 1 ? setStep(step + 1) : finish();
  };

  return (
    <div className="screen" style={{ background: "var(--surface)" }}>
      <div className="topbar">
        <button className="topbar-back" onClick={step === 0 ? onClose : () => setStep(step - 1)}><Icon name={step === 0 ? "close" : "chevLeft"} size={20} /></button>
        <div style={{ flex: 1 }}>
          <div className="topbar-title">Übergabe · {steps[step]}</div>
          <div className="topbar-sub">Schritt {step + 1}/{steps.length} · {o.plate}</div>
        </div>
      </div>
      <div style={{ padding: "10px 16px 0" }}><StepBar total={steps.length} current={step} /></div>

      <div className="screen-scroll pad pad-b">
        {/* STEP 1 — Tank/Lade + Wäsche */}
        {step === 0 && (
          <React.Fragment>
            <h3 className="proto-h">Füllstand & Fahrzeugpflege</h3>
            {isEV ? (
              <React.Fragment>
                <p className="proto-p">Erfasse den Batterie-Ladestand (SoC). Übergabe nur mit mind. <strong>30–40 %</strong>.</p>
                <Field label="Ladestand (SoC) in %">
                  <input className="input" type="number" inputMode="numeric" placeholder="z. B. 38" value={fuelVal} onChange={e => setFuelVal(e.target.value)} />
                </Field>
                <BatteryGauge percent={isNaN(fuelNum) ? 0 : fuelNum} />
              </React.Fragment>
            ) : (
              <React.Fragment>
                <p className="proto-p">Erfasse die aktuelle Restreichweite. Übergabe nur mit mind. <strong>150 km</strong>.</p>
                <Field label="Restreichweite in km">
                  <input className="input" type="number" inputMode="numeric" placeholder="z. B. 220" value={fuelVal} onChange={e => setFuelVal(e.target.value)} />
                </Field>
              </React.Fragment>
            )}
            {fuelEntered && !fuelOk && (
              <div className="danger-box" style={{ marginBottom: 14 }}>
                <Icon name={isEV ? "zap" : "fuel"} size={18} style={{ flex: "0 0 auto" }} />
                <div>{isEV ? "Ladestand zu niedrig. Bitte zur nächsten Ladesäule navigieren und auf mind. 30–40 % laden." : "Restreichweite zu niedrig. Bitte vor der Übergabe nachtanken (mind. 150 km)."}
                  <button className="btn btn-soft btn-sm" style={{ marginTop: 10 }} onClick={() => toast(isEV ? "Navigiere zur Ladesäule" : "Navigiere zur Tankstelle", "navigation")}><Icon name="navigation" size={14} />{isEV ? "Ladesäule finden" : "Tankstelle finden"}</button>
                </div>
              </div>
            )}
            {fuelEntered && fuelOk && <div className="ok-box" style={{ marginBottom: 14 }}><Icon name="checkCircle" size={18} style={{ flex: "0 0 auto" }} />Füllstand ausreichend für die Übergabe.</div>}

            <SLabel style={{ marginTop: 6 }}>Fahrzeugpflege</SLabel>
            {washRequired ? (
              <div className={`wash-card${washScanned ? " done" : ""}`}>
                <div className="row" style={{ gap: 10 }}>
                  <span className="wash-ic"><Icon name="droplet" size={20} /></span>
                  <div style={{ flex: 1 }}>
                    <div className="t-strong">Pflicht-Wäsche erforderlich</div>
                    <div className="muted" style={{ fontSize: 12.5 }}>{o.km > 200 ? `Langstrecke ${fmtKm(o.km)} km (> 200 km).` : "Bei Übernahme als verschmutzt markiert."} Vor Übergabe waschen und Beleg scannen.</div>
                  </div>
                </div>
                {washScanned
                  ? <div className="ok-box" style={{ marginTop: 10 }}><Icon name="checkCircle" size={16} />Waschbeleg gescannt</div>
                  : <Btn variant="soft" full style={{ marginTop: 12 }} icon="scan" onClick={() => { setWashScanned(true); toast("Waschbeleg gescannt", "scan"); }}>Waschbeleg scannen</Btn>}
              </div>
            ) : (
              <div className="ok-box"><Icon name="checkCircle" size={18} style={{ flex: "0 0 auto" }} />Keine Pflicht-Wäsche (≤ 200 km, sauber übernommen).</div>
            )}
          </React.Fragment>
        )}

        {/* STEP 2 — Neuschaden */}
        {step === 1 && (
          <React.Fragment>
            <h3 className="proto-h">Neuschaden-Abgleich</h3>
            <p className="proto-p">Vergleiche das Fahrzeug mit den bei der Übernahme erfassten Schäden.</p>
            <SLabel>Schäden bei Übernahme ({pickupDamages.length})</SLabel>
            {pickupDamages.length === 0
              ? <div className="empty" style={{ padding: 16 }}>Keine Vorschäden dokumentiert.</div>
              : <div className="dmg-list">{pickupDamages.map((d, i) => (
                  <div className="dmg-item" key={i}><span className="dmg-code">{d.code}</span><span>{d.part}</span></div>
                ))}</div>}
            <SLabel style={{ marginTop: 18 }}>Sind während der Überführung Neuschäden entstanden?</SLabel>
            <div className="grid2">
              <button className={`bigchoice${hasNewDamage === "no" ? " on ok" : ""}`} onClick={() => setHasNewDamage("no")}>
                <Icon name="checkCircle" size={26} /><span>Nein, keine</span>
              </button>
              <button className={`bigchoice${hasNewDamage === "yes" ? " on danger" : ""}`} onClick={() => setHasNewDamage("yes")}>
                <Icon name="alert" size={26} /><span>Ja, Neuschaden</span>
              </button>
            </div>
            {hasNewDamage === "yes" && <div className="note-box" style={{ marginTop: 14 }}><Icon name="info" size={18} style={{ flex: "0 0 auto" }} />Bei „Weiter" öffnet sich die Ereignis-Erfassung zur Schadensdokumentation.</div>}
          </React.Fragment>
        )}

        {/* STEP 3 — Ident-Check */}
        {step === 2 && (
          <React.Fragment>
            <h3 className="proto-h">Identitätsprüfung Empfänger</h3>
            <p className="proto-p">Gesetzliche Pflicht: Identität prüfen, sofern der Empfänger nicht persönlich bekannt ist.</p>
            <CheckRow checked={knownPerson} onChange={v => { setKnownPerson(v); }} label="Empfänger ist mir persönlich bekannt" sub="Dann ist keine Dokumentenprüfung nötig" />
            {!knownPerson && (
              <React.Fragment>
                <div className="divider" />
                <CheckRow checked={docShown} onChange={setDocShown} label="Personalausweis / Führerschein wurde vorgelegt" sub="Dokument geprüft und gültig" />
                <Field label="Name Empfänger (Druckbuchstaben)">
                  <input className="input" value={recipientName} onChange={e => setRecipientName(e.target.value.toUpperCase())} placeholder="z. B. MAX MUSTERMANN" />
                </Field>
              </React.Fragment>
            )}
          </React.Fragment>
        )}

        {/* STEP 4 — 3 Signaturen */}
        {step === 3 && (
          <React.Fragment>
            <h3 className="proto-h">Drei digitale Signaturen</h3>
            <div className="info-box" style={{ marginBottom: 16 }}><Icon name="info" size={18} style={{ flex: "0 0 auto" }} />Ohne Kundenunterschrift ist das Protokoll im System <strong>ungültig</strong>.</div>
            <Field label="1 · Unterschrift Übergebender"><SignaturePad height={120} onChange={setSig1} label="Übergebender" /></Field>
            <Field label="2 · Unterschrift Fahrer"><SignaturePad height={120} onChange={setSig2} label="Fahrer" /></Field>
            <Field label={`3 · Unterschrift Übernehmender${recipientName ? " — " + recipientName : " / Kunde"}`}><SignaturePad height={120} onChange={setSig3} label="Kunde bestätigt Erhalt & Schlüsselanzahl" /></Field>
            <div className="sig-status">
              <span className={sig1 ? "ok" : ""}><Icon name={sig1 ? "checkCircle" : "edit"} size={14} />Übergebender</span>
              <span className={sig2 ? "ok" : ""}><Icon name={sig2 ? "checkCircle" : "edit"} size={14} />Fahrer</span>
              <span className={sig3 ? "ok" : ""}><Icon name={sig3 ? "checkCircle" : "edit"} size={14} />Kunde</span>
            </div>
          </React.Fragment>
        )}
      </div>

      <div className="proto-footer">
        <Btn variant="primary" size="lg" full disabled={!canNext()} onClick={next}
          icon={step === steps.length - 1 ? "checkCircle" : undefined}>
          {step === steps.length - 1 ? "Übergabe abschließen" : (step === 1 && hasNewDamage === "yes") ? "Schaden erfassen" : "Weiter"}
        </Btn>
      </div>
    </div>
  );
}

function BatteryGauge({ percent }) {
  const p = Math.max(0, Math.min(100, percent));
  const tone = p >= 40 ? "var(--ok)" : p >= 30 ? "var(--warn)" : "var(--danger)";
  return (
    <div className="batt-gauge" style={{ marginBottom: 14 }}>
      <div className="batt-track"><div className="batt-fill" style={{ width: p + "%", background: tone }} /></div>
      <div className="batt-marks"><span style={{ left: "30%" }}>30%</span><span style={{ left: "40%" }}>40%</span></div>
    </div>
  );
}

window.DropoffProtocol = DropoffProtocol;
