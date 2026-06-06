/* ============================================================
   MW Fahrer-App — Demo-Daten (Phase 3 Prototyp)
   Plain JS, an window gehängt. Aufträge orientieren sich an data.ts.
   ============================================================ */
(function () {
  const me = {
    id: "F-2015", name: "Pedro Martinez Ferron", first: "Pedro",
    city: "Essen", plz: "45127", email: "p.martinez@gmail.com",
    phone: "+49 176 55098321", type: "Mini Job", rating: "4.8", trips: 312,
    iban: "DE89 3704 0044 0532 0130 00",
  };

  // Betriebsleitung (aus APP_PHASE.md, Kap. 7.3)
  const ops = [
    { name: "Herr El-Yousfy", phone: "+49 176 92196970" },
    { name: "Herr Tekin", phone: "+49 176 30300979" },
  ];

  // Aufträge mit Zuständen: offer | active | queued | done
  const orders = [
    {
      id: "548197", mvNr: "MV-2026-0617", plate: "WI-UD3281",
      model: "VOLKSWAGEN GOLF 2.0 TDI", vin: "WVWZZZ1KZAW681234",
      customer: "Mercedes-Benz Niederlassung Rhein-Ruhr", customerShort: "MB Rhein-Ruhr",
      contact: { name: "Bastian Kirmis", phone: "+49 160 7620715" },
      from: { city: "Düsseldorf", plz: "40468", street: "Kieshecker Weg 260", lat: 51.27, lng: 6.74 },
      to: { city: "Wiesbaden", plz: "65189", street: "Mainzer Straße 75", lat: 50.07, lng: 8.24 },
      pickupWindow: "08:00 – 10:00", pickupDate: "2026-06-07", deliveryDate: "2026-06-07",
      km: 312, price: 268, fuel: "diesel", isNew: false, mileage: 41280,
      note: "Abholcode an der Schranke: 4471. Ansprechpartner Hr. Kirmis vor Ort fragen.",
      dstate: "offer",
    },
    {
      id: "549927", mvNr: "MV-2026-0631", plate: "M-VU6239",
      model: "VOLKSWAGEN ID.4 PRO", vin: "WVWZZZE2ZNP012398",
      customer: "VW Leasing Service", customerShort: "VW Leasing",
      contact: { name: "Julia Stuurman", phone: "+49 170 6688711" },
      from: { city: "Köln", plz: "50667", street: "Hohe Straße 12", lat: 50.93, lng: 6.95 },
      to: { city: "Frankfurt am Main", plz: "60528", street: "Hahnstraße 70", lat: 50.07, lng: 8.65 },
      pickupWindow: "09:30 – 11:00", pickupDate: "2026-06-07", deliveryDate: "2026-06-07",
      km: 196, price: 232, fuel: "ev", isNew: false, mileage: 8740,
      note: "EV — Ladekarte im Handschuhfach. Mind. 40 % bei Übergabe.",
      dstate: "offer",
    },
    {
      id: "550104", mvNr: "MV-2026-0644", plate: "DA-MB1290",
      model: "MERCEDES-BENZ EQE 350+", vin: "W1KZZZ...NEU0044",
      customer: "MB Rhein-Ruhr", customerShort: "MB Rhein-Ruhr",
      contact: { name: "Bastian Kirmis", phone: "+49 160 7620715" },
      from: { city: "Germersheim", plz: "76726", street: "Mercedes-Benz-Straße 1", lat: 49.22, lng: 8.36 },
      to: { city: "Düsseldorf", plz: "40472", street: "Mercedes-Benz-Straße 1", lat: 51.27, lng: 6.79 },
      pickupWindow: "13:00 – 14:30", pickupDate: "2026-06-08", deliveryDate: "2026-06-08",
      km: 358, price: 412, fuel: "ev", isNew: true, mileage: 6,
      note: "NEUFAHRZEUG. CMR-Frachtbrief Pflicht. Übergabe nur im Freien bei Tageslicht. Max. 130 km/h. Schutzfolie nicht entfernen.",
      dstate: "queued",
    },
  ];

  // Schadenscodes (Kap. 5.2)
  const damageCodes = [
    { code: "K", label: "Kratzer" }, { code: "S", label: "Steinschlag" },
    { code: "D", label: "Delle" }, { code: "B", label: "Beschädigung" },
    { code: "V", label: "Verschmutzung" }, { code: "R", label: "Riss" },
  ];

  // Fahrzeugseiten für Schadensmarkierung
  const carParts = ["Front", "Heck", "Fahrerseite", "Beifahrerseite", "Dach", "Motorhaube"];

  // Pflicht-Fotowinkel für Neufahrzeuge (Kap. 5.2)
  const newCarPhotos = [
    "Frontseite", "Heckansicht", "Windschutzscheibe", "Fahrerseite", "Beifahrerseite",
    "Innenraum vorn", "Innenraum hinten", "Tacho", "Kofferraum geöffnet",
    "Reifen VL", "Reifen VR", "Reifen HL", "Reifen HR",
  ];

  // Ausstattungs-Checkliste (Kap. 5.3)
  const equipment = [
    { key: "schein", label: "Fahrzeugschein (ZB Teil I)", type: "bool" },
    { key: "keys", label: "Anzahl Schlüssel", type: "count", def: 2 },
    { key: "tirefit", label: "Tire-Fit / Reserverad / Bordwerkzeug", type: "bool" },
    { key: "warn", label: "Warndreieck / Verbandskasten / Warnweste", type: "bool" },
    { key: "navi", label: "Navigation / Navi-SD / DVD", type: "bool" },
    { key: "service", label: "Serviceplan / Betriebsanleitung / Infomappe", type: "bool" },
    { key: "matten", label: "Fußmatten / Kofferraumabdeckung / Antenne", type: "bool" },
    { key: "ladekabel", label: "Ladekabel E-Fahrzeug (Anzahl)", type: "count", def: 1, evOnly: true },
  ];

  const interiorParts = ["Vordersitze", "Rücksitze", "Innenverkleidung", "Teppichboden", "Dachhimmel", "Armaturen"];

  window.MWAPP = { me, ops, orders, damageCodes, carParts, newCarPhotos, equipment, interiorParts };
})();
