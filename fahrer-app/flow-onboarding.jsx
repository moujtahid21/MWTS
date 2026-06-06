/* ============================================================
   MW Fahrer-App — Flow 1: Onboarding (DSGVO, Fahrerhandbuch, Berechtigungen)
   Zwingend beim First-Launch. Überspringen blockiert.
   ============================================================ */
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const steps = ["Willkommen", "Datenschutz", "Fahrerhandbuch", "Berechtigungen"];

  return (
    <div className="screen" style={{ background: "var(--surface)" }}>
      <div className="ob-top">
        <div className="ob-brand"><span className="stage-mark">MW</span><span>MW Transport Service</span></div>
        <StepBar total={steps.length} current={step} />
      </div>
      <div className="screen-scroll pad">
        {step === 0 && <ObWelcome />}
        {step === 1 && <ObPrivacy />}
        {step === 2 && <ObHandbook />}
        {step === 3 && <ObPermissions />}
      </div>
    </div>
  );

  function footer(disabled, label, onNext) {
    return (
      <div className="ob-footer">
        <Btn variant="primary" size="lg" full disabled={disabled} onClick={onNext}>{label}</Btn>
      </div>
    );
  }

  function ObWelcome() {
    return (
      <React.Fragment>
        <div className="ob-hero">
          <div className="ob-hero-icon"><Icon name="truck" size={40} /></div>
          <h1 className="ob-h1">Willkommen an Bord</h1>
          <p className="ob-lead">Die Fahrer-App für Fahrzeugüberführungen. Bevor es losgeht, führen wir dich einmalig durch die rechtlichen Grundlagen und richten die App ein.</p>
        </div>
        <div className="ob-list">
          {[["shield", "Datenschutz", "DSGVO-Einwilligung mit Unterschrift"], ["fileText", "Fahrerhandbuch", "Betriebliche Pflichten bestätigen"], ["lock", "Berechtigungen", "GPS, Kamera & Medien freigeben"]].map(([ic, t, s]) => (
            <div className="ob-list-item" key={t}>
              <span className="ob-list-ic"><Icon name={ic} size={20} /></span>
              <div><div className="t-strong">{t}</div><div className="muted" style={{ fontSize: 12.5 }}>{s}</div></div>
            </div>
          ))}
        </div>
        {footer(false, "Los geht's", () => setStep(1))}
      </React.Fragment>
    );
  }

  function ObPrivacy() {
    const [scrolledEnd, setScrolledEnd] = useState(false);
    const [accept, setAccept] = useState(false);
    const [signed, setSigned] = useState(false);
    const onScroll = (e) => {
      const el = e.target;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 40) setScrolledEnd(true);
    };
    return (
      <React.Fragment>
        <h2 className="ob-h2">Datenschutzerklärung</h2>
        <p className="ob-sub">Permanente Standorterfassung & Metadaten</p>
        <div className="ob-legal" onScroll={onScroll}>
          <p><strong>1. Standortdaten.</strong> Während eines aktiven Auftrags erfasst die App deinen Standort permanent im Hinter- und Vordergrund. Dies dient dem Routenabgleich, dem Diebstahlschutz des Kundenfahrzeugs und der Berechnung der voraussichtlichen Ankunftszeit.</p>
          <p><strong>2. Metadaten.</strong> Zeitstempel, Fotos (inkl. Aufnahmeort und -zeit), Kilometerstände und Protokolldaten werden erhoben und zur rechtlichen Absicherung der Überführung gespeichert.</p>
          <p><strong>3. Zweckbindung.</strong> Die Daten werden ausschließlich zur Durchführung, Abrechnung und Qualitätssicherung der Überführungsaufträge verarbeitet und nicht an unbefugte Dritte weitergegeben.</p>
          <p><strong>4. Aufbewahrung.</strong> Protokolle und Belege werden gemäß den gesetzlichen Aufbewahrungsfristen gespeichert. Standort-Rohdaten werden nach Abschluss des Auftrags aggregiert.</p>
          <p><strong>5. Rechte.</strong> Dir stehen die Rechte auf Auskunft, Berichtigung und Löschung gemäß DSGVO zu, soweit keine gesetzliche Aufbewahrungspflicht entgegensteht.</p>
          <p><strong>6. Einwilligung.</strong> Mit deiner Unterschrift bestätigst du, diese Erklärung gelesen und verstanden zu haben und in die beschriebene Datenverarbeitung einzuwilligen.</p>
        </div>
        {!scrolledEnd && <div className="ob-scrollhint"><Icon name="chevDown" size={14} />Bitte vollständig durchlesen</div>}
        <div style={{ marginTop: 14 }}>
          <CheckRow checked={accept} onChange={setAccept} label="Ich willige in die Datenverarbeitung ein" sub="Standorterfassung & Metadaten gemäß DSGVO" />
        </div>
        <Field label="Digitale Signatur (Einwilligung)">
          <SignaturePad height={130} onChange={setSigned} label="Zur Einwilligung unterschreiben" />
        </Field>
        {footer(!(scrolledEnd && accept && signed), "Akzeptieren & weiter", () => setStep(2))}
      </React.Fragment>
    );
  }

  function ObHandbook() {
    const [confirmed, setConfirmed] = useState(false);
    const duties = [
      ["doc", "Führerschein stets mitführen", "Bei jeder Fahrt gültig und griffbereit."],
      ["close", "Keine private Nutzung", "Kundenfahrzeuge ausschließlich dienstlich bewegen."],
      ["alert", "StVO strikt einhalten", "Geschwindigkeit & Verkehrsregeln zwingend beachten."],
      ["fuel", "Ess-, Trink- & Rauchverbot", "Im Fahrzeug absolut untersagt."],
    ];
    return (
      <React.Fragment>
        <h2 className="ob-h2">Fahrerhandbuch</h2>
        <p className="ob-sub">Betriebliche Grundvoraussetzungen — Kernpflichten</p>
        <div className="ob-duties">
          {duties.map(([ic, t, s]) => (
            <div className="ob-duty" key={t}>
              <span className="ob-duty-ic"><Icon name={ic} size={18} /></span>
              <div><div className="t-strong" style={{ fontSize: 14 }}>{t}</div><div className="muted" style={{ fontSize: 12.5 }}>{s}</div></div>
            </div>
          ))}
        </div>
        <div className="info-box" style={{ marginTop: 14 }}>
          <Icon name="info" size={18} style={{ flex: "0 0 auto" }} />
          <span>Das vollständige Fahrerhandbuch findest du jederzeit unter <strong>Profil → Meine Dokumente</strong>.</span>
        </div>
        <div style={{ marginTop: 16 }}>
          <CheckRow checked={confirmed} onChange={setConfirmed} label="Ich habe das Fahrerhandbuch gelesen und verstanden" sub="Bestätigung der betrieblichen Pflichten" />
        </div>
        {footer(!confirmed, "Bestätigen & weiter", () => setStep(3))}
      </React.Fragment>
    );
  }

  function ObPermissions() {
    const [perms, setPerms] = useState({ gps: false, cam: false, media: false });
    const all = perms.gps && perms.cam && perms.media;
    const items = [
      ["gps", "gps", "Standort (GPS)", "Hintergrund & Vordergrund — Tracking, Routenabgleich, Diebstahlschutz."],
      ["cam", "camera", "Kamera", "Schadensdokumentation & Beleg-Scanning."],
      ["media", "doc", "Medienspeicher", "Zwischenspeichern & Upload von Fahrzeugfotos."],
    ];
    return (
      <React.Fragment>
        <h2 className="ob-h2">Berechtigungen</h2>
        <p className="ob-sub">Alle Zugriffe sind zwingend erforderlich. Ohne sie bleibt die App gesperrt.</p>
        <div style={{ marginTop: 6 }}>
          {items.map(([key, ic, t, s]) => (
            <div className={`perm-row${perms[key] ? " granted" : ""}`} key={key}>
              <span className="perm-ic"><Icon name={ic} size={20} /></span>
              <div className="perm-text"><div className="t-strong" style={{ fontSize: 14 }}>{t}</div><div className="muted" style={{ fontSize: 12 }}>{s}</div></div>
              {perms[key]
                ? <span className="perm-ok"><Icon name="check" size={16} sw={3} />Erlaubt</span>
                : <button className="btn btn-soft btn-sm" onClick={() => setPerms(p => ({ ...p, [key]: true }))}>Erlauben</button>}
            </div>
          ))}
        </div>
        {!all && <div className="note-box" style={{ marginTop: 14 }}><Icon name="lock" size={18} style={{ flex: "0 0 auto" }} />App-Nutzung ist gesperrt, bis alle Berechtigungen erteilt sind.</div>}
        {footer(!all, all ? "App starten" : "Alle Zugriffe erforderlich", onDone)}
      </React.Fragment>
    );
  }
}

window.Onboarding = Onboarding;
