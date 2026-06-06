/* ============================================================
   MW Fahrer-App — Flow 4: Übernahmeprotokoll (Pickup Log, 6 Schritte)
   ============================================================ */
function PickupProtocol({ o, onClose, onComplete, toast }) {
  const A = window.MWAPP;
  const [step, setStep] = useState(0);
  const intensiv = o.mileage >= 30000;
  const steps = ["Stammdaten", "Schäden", "Ausstattung", "Reifen", "Innenraum", "Signaturen"];

  // Draft state
  const [dataOk, setDataOk] = useState(false);
  const [damages, setDamages] = useState([]); // {part, code, note}
  const [areas, setAreas] = useState({ "Außenhaut": null, "Glas": null, "Interieur": null });
  const [photos, setPhotos] = useState({}); // label -> bool
  const [equip, setEquip] = useState(() => Object.fromEntries(A.equipment.map(e => [e.key, e.type === "count" ? e.def : false])));
  const [tireType, setTireType] = useState("sommer");
  const [secondSet, setSecondSet] = useState(false);
  const [tread, setTread] = useState({ vl: "", vr: "", hl: "", hr: "" });
  const [interior, setInterior] = useState({}); // part -> code
  const [smoker, setSmoker] = useState(false);
  const [notes, setNotes] = useState("");
  const [sigHandover, setSigHandover] = useState(false);
  const [sigDriver, setSigDriver] = useState(false);
  const [handoverName, setHandoverName] = useState("");

  // Winterreifenpflicht: simulierte Wetterlage
  const weather = { temp: -2, condition: "Schnee/Nässe", risk: true };
  const winterBlock = weather.risk && weather.temp < 1 && tireType === "sommer";

  const isEV = o.fuel === "ev";
  const reqPhotos = o.isNew ? A.newCarPhotos : [];
  const photosTaken = reqPhotos.filter(p => photos[p]).length;
  const photosOk = !o.isNew || photosTaken === reqPhotos.length;
  const treadOk = ["vl", "vr", "hl", "hr"].every(k => tread[k] !== "");
  const areasOk = !intensiv || Object.values(areas).every(v => v !== null);

  const canNext = () => {
    if (step === 0) return dataOk;
    if (step === 1) return photosOk && areasOk;
    if (step === 3) return treadOk && !winterBlock;
    if (step === 5) return sigHandover && sigDriver && handoverName.trim().length > 1;
    return true;
  };

  const finish = () => {
    onComplete({ damages, photos, equip, tireType, tread, interior, smoker, notes });
    toast("Übernahmeprotokoll abgeschlossen", "checkCircle");
  };

  const next = () => step < steps.length - 1 ? setStep(step + 1) : finish();

  const toggleDamage = (part, code) => {
    setDamages(d => {
      const exists = d.find(x => x.part === part && x.code === code);
      return exists ? d.filter(x => x !== exists) : [...d, { part, code }];
    });
  };

  return (
    <div className="screen" style={{ background: "var(--surface)" }}>
      <div className="topbar">
        <button className="topbar-back" onClick={step === 0 ? onClose : () => setStep(step - 1)}><Icon name={step === 0 ? "close" : "chevLeft"} size={20} /></button>
        <div style={{ flex: 1 }}>
          <div className="topbar-title">Übernahme · {steps[step]}</div>
          <div className="topbar-sub">Schritt {step + 1}/{steps.length} · {o.plate}</div>
        </div>
      </div>
      <div style={{ padding: "10px 16px 0" }}><StepBar total={steps.length} current={step} /></div>

      <div className="screen-scroll pad pad-b">
        {/* STEP 1 — Stammdaten */}
        {step === 0 && (
          <React.Fragment>
            <h3 className="proto-h">Stammdaten abgleichen</h3>
            <p className="proto-p">Gleiche Kennzeichen und FIN physisch mit dem Fahrzeug ab. Mit „Weiter" bestätigst du die Korrektheit.</p>
            <Card className="card-pad" style={{ marginBottom: 14 }}>
              <div className="row between" style={{ marginBottom: 12 }}><Plate value={o.plate} /><FuelBadge o={o} /></div>
              <div className="kv"><span className="kv-k">Modell</span><span className="kv-v">{o.model}</span></div>
              <div className="kv"><span className="kv-k">FIN / VIN</span><span className="kv-v" style={{ fontFamily: "var(--mono)", fontSize: 12 }}>{o.vin}</span></div>
              <div className="kv"><span className="kv-k">Kilometerstand</span><span className="kv-v">{fmtKm(o.mileage)} km</span></div>
            </Card>
            {intensiv && <div className="note-box" style={{ marginBottom: 12 }}><Icon name="alert" size={18} style={{ flex: "0 0 auto" }} /><div><strong>Intensiv-Prüfmodus</strong> (ab 30.000 km). Jeder Bereich muss einzeln per Ja/Nein dokumentiert werden.</div></div>}
            {o.isNew && <div className="note-box" style={{ marginBottom: 12 }}><Icon name="star" size={18} style={{ flex: "0 0 auto" }} /><div><strong>Neufahrzeug.</strong> Penible Prüfung & Foto-Pflicht aus allen Winkeln im nächsten Schritt.</div></div>}
            <CheckRow checked={dataOk} onChange={setDataOk} label="Kennzeichen & FIN stimmen überein" sub="Sichtprüfung am Fahrzeug erfolgt" />
          </React.Fragment>
        )}

        {/* STEP 2 — Schäden */}
        {step === 1 && (
          <React.Fragment>
            <h3 className="proto-h">Vorschäden dokumentieren</h3>
            <div className="code-legend">
              {A.damageCodes.map(c => <span key={c.code} className="code-chip"><b>{c.code}</b>{c.label}</span>)}
            </div>

            {intensiv && (
              <div style={{ marginTop: 8, marginBottom: 8 }}>
                <SLabel>Intensiv-Prüfung · Ja / Nein</SLabel>
                {Object.keys(areas).map(area => (
                  <div className="area-row" key={area}>
                    <span className="t-strong" style={{ fontSize: 14 }}>{area}</span>
                    <Segmented value={areas[area]} onChange={v => setAreas(a => ({ ...a, [area]: v }))}
                      options={[{ value: "ok", label: "I.O." }, { value: "defect", label: "Mangel" }]} />
                  </div>
                ))}
              </div>
            )}

            <SLabel style={{ marginTop: 14 }}>Schadensmatrix · tippe Bereich × Code</SLabel>
            <div className="dmatrix">
              <div className="dmatrix-head">
                <span />
                {A.damageCodes.map(c => <span key={c.code} className="dmatrix-code">{c.code}</span>)}
              </div>
              {A.carParts.map(part => (
                <div className="dmatrix-row" key={part}>
                  <span className="dmatrix-part">{part}</span>
                  {A.damageCodes.map(c => {
                    const on = damages.some(x => x.part === part && x.code === c.code);
                    return <button key={c.code} className={`dmatrix-cell${on ? " on" : ""}`} onClick={() => toggleDamage(part, c.code)}>{on ? c.code : ""}</button>;
                  })}
                </div>
              ))}
            </div>
            {damages.length > 0 && <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>{damages.length} Schaden/Schäden markiert</div>}

            {o.isNew && (
              <React.Fragment>
                <SLabel style={{ marginTop: 18 }}>Foto-Pflicht Neufahrzeug ({photosTaken}/{reqPhotos.length})</SLabel>
                <div className="note-box" style={{ marginBottom: 10 }}><Icon name="sun" size={16} style={{ flex: "0 0 auto" }} />Nur im Freien bei Tageslicht — keine Tiefgarage.</div>
                <div className="photo-grid">
                  {reqPhotos.map(p => (
                    <button key={p} className={`photo-tile${photos[p] ? " done" : ""}`} onClick={() => setPhotos(ph => ({ ...ph, [p]: !ph[p] }))}>
                      <Icon name={photos[p] ? "check" : "camera"} size={20} sw={photos[p] ? 2.6 : 2} /><span>{p}</span>
                    </button>
                  ))}
                </div>
              </React.Fragment>
            )}
            {!o.isNew && (
              <React.Fragment>
                <SLabel style={{ marginTop: 18 }}>Fotos (optional, empfohlen)</SLabel>
                <div className="photo-grid four">
                  {["Front", "Heck", "Fahrerseite", "Beifahrerseite"].map(p => (
                    <button key={p} className={`photo-tile${photos[p] ? " done" : ""}`} onClick={() => setPhotos(ph => ({ ...ph, [p]: !ph[p] }))}>
                      <Icon name={photos[p] ? "check" : "camera"} size={20} /><span>{p}</span>
                    </button>
                  ))}
                </div>
              </React.Fragment>
            )}
          </React.Fragment>
        )}

        {/* STEP 3 — Ausstattung */}
        {step === 2 && (
          <React.Fragment>
            <h3 className="proto-h">Ausstattung & Zubehör</h3>
            <p className="proto-p">Deklariere alle Elemente als vorhanden bzw. gib die Anzahl an.</p>
            {A.equipment.filter(e => !e.evOnly || isEV).map(e => (
              <div className="equip-row" key={e.key}>
                <span className="equip-label">{e.label}</span>
                {e.type === "count"
                  ? <Counter value={equip[e.key]} onChange={v => setEquip(s => ({ ...s, [e.key]: v }))} />
                  : <Switch on={equip[e.key]} onChange={v => setEquip(s => ({ ...s, [e.key]: v }))} />}
              </div>
            ))}
          </React.Fragment>
        )}

        {/* STEP 4 — Reifen */}
        {step === 3 && (
          <React.Fragment>
            <h3 className="proto-h">Reifen & Felgen</h3>
            <Field label="Reifentyp">
              <Segmented value={tireType} onChange={setTireType}
                options={[{ value: "sommer", label: "Sommer" }, { value: "winter", label: "Winter" }, { value: "ganzjahr", label: "Ganzjahr" }]} />
            </Field>

            <div className="weather-chip">
              <Icon name="thermometer" size={16} /><span>Wetter aktuell: <b>{weather.temp}°C</b> · {weather.condition}</span>
            </div>
            {winterBlock && (
              <div className="danger-box" style={{ marginBottom: 14 }}>
                <Icon name="snow" size={18} style={{ flex: "0 0 auto" }} />
                <div><strong>Winterreifenpflicht!</strong> Bei {weather.temp}°C und {weather.condition} ist die Fahrt mit Sommerreifen unzulässig. Abfahrt blockiert — bitte Disposition kontaktieren.
                  <button className="btn btn-danger btn-sm" style={{ marginTop: 10 }} onClick={() => toast("Disposition wird angerufen", "phone")}><Icon name="phone" size={14} />Disposition anrufen</button>
                </div>
              </div>
            )}

            <div className="row between" style={{ margin: "4px 0 12px" }}>
              <span className="t-strong" style={{ fontSize: 14 }}>Zweiter Radsatz vorhanden</span>
              <Switch on={secondSet} onChange={setSecondSet} />
            </div>

            <SLabel>Profiltiefe (mm) · alle 4 Reifen</SLabel>
            <div className="grid2">
              {[["vl", "Vorne Links"], ["vr", "Vorne Rechts"], ["hl", "Hinten Links"], ["hr", "Hinten Rechts"]].map(([k, l]) => (
                <Field key={k} label={l}>
                  <input className="input" type="number" inputMode="decimal" step="0.5" placeholder="z. B. 6,5" value={tread[k]} onChange={e => setTread(t => ({ ...t, [k]: e.target.value }))} />
                </Field>
              ))}
            </div>
          </React.Fragment>
        )}

        {/* STEP 5 — Innenraum */}
        {step === 4 && (
          <React.Fragment>
            <h3 className="proto-h">Innenraum & Notizen</h3>
            <div className="code-legend">
              {[["B", "Beschädigung"], ["V", "Verschmutzung"], ["R", "Riss"]].map(([c, l]) => <span key={c} className="code-chip"><b>{c}</b>{l}</span>)}
            </div>
            {A.interiorParts.map(part => (
              <div className="area-row" key={part}>
                <span className="t-strong" style={{ fontSize: 13.5 }}>{part}</span>
                <div className="row" style={{ gap: 6 }}>
                  {["B", "V", "R"].map(c => (
                    <button key={c} className={`code-toggle${interior[part] === c ? " on" : ""}`}
                      onClick={() => setInterior(s => ({ ...s, [part]: s[part] === c ? null : c }))}>{c}</button>
                  ))}
                </div>
              </div>
            ))}
            <div className="row between" style={{ margin: "14px 0" }}>
              <span className="t-strong" style={{ fontSize: 14 }}>Verraucht</span>
              <Switch on={smoker} onChange={setSmoker} />
            </div>
            <Field label="Eigene Notizen">
              <textarea className="textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Bemerkungen, Sonderkonditionen, nicht klassifizierbare Vorschäden …" />
            </Field>
          </React.Fragment>
        )}

        {/* STEP 6 — Signaturen */}
        {step === 5 && (
          <React.Fragment>
            <h3 className="proto-h">Digitale Signaturen</h3>
            <p className="proto-p">Zwei Unterschriften zur Gültigkeit des Übernahmeprotokolls.</p>
            <Field label="Name Übergebender (Druckbuchstaben)">
              <input className="input" value={handoverName} onChange={e => setHandoverName(e.target.value.toUpperCase())} placeholder="z. B. AUTOHAUS — M. SCHMITZ" />
            </Field>
            <Field label="Unterschrift Übergebender">
              <SignaturePad height={140} onChange={setSigHandover} label="Übergebender unterschreibt" />
            </Field>
            <Field label="Unterschrift Fahrer">
              <SignaturePad height={140} onChange={setSigDriver} label="Fahrer unterschreibt" />
            </Field>
          </React.Fragment>
        )}
      </div>

      <div className="proto-footer">
        <Btn variant="primary" size="lg" full disabled={!canNext()} onClick={next}
          icon={step === steps.length - 1 ? "checkCircle" : undefined}>
          {step === steps.length - 1 ? "Übernahme abschließen" : winterBlock && step === 3 ? "Abfahrt blockiert" : "Weiter"}
        </Btn>
      </div>
    </div>
  );
}

window.PickupProtocol = PickupProtocol;
