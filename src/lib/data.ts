/* ============================================================
   MW Transport Service — Demo data (German vehicle logistics)
   Ported from app/data.js + app/data-shifts.js to a typed module.
   In production this is replaced by tenant-scoped Supabase queries.
   ============================================================ */

const _build = () => {
  const customers = [
    { id: "K-1042", name: "Sixt Autovermietung", short:"Sixt", email: "disposition@sixt.de", phone: "+49 89 74444", city: "Pullach", street: "Zugspitzstrasse 1", plz: "82049", land: "Deutschland", orders: 184, openOrders: 12, contacts: [
        { name: "Steffen Ratiu", role: "Disposition", phone: "+49 151 22014477", email: "steffen.ratiu@sixt.de" },
        { name: "Anna Weber", role: "Abrechnung", phone: "+49 151 88120033", email: "anna.weber@sixt.de" } ],
      dispoAusland: "Übergaben in AT/CH nur mit Vorab-Avis (48h).", durchfuehrung: "Fahrzeuge stets volltanken, Innenreinigung dokumentieren.", rechnung: "Sammelrechnung zum Monatsende, Referenz MV-Nr. zwingend." },
    { id: "K-1043", name: "Avis Autovermietung", short:"Avis", email: "flotte@avis.de", phone: "+49 6171 6800", city: "Oberursel", street: "Zimmersmühlenweg 21", plz: "61440", land: "Deutschland", orders: 98, openOrders: 7, contacts: [
        { name: "Carina Boeing", role: "Flottenmanagement", phone: "+49 160 5512098", email: "carina.boeing@avis.de" } ],
      dispoAusland: "", durchfuehrung: "Schadensprotokoll mit min. 6 Fotos.", rechnung: "Einzelrechnung je Auftrag." },
    { id: "K-1044", name: "Enterprise Autovermietung", short:"Enterprise", email: "logistik@enterprise.de", phone: "+49 211 5402", city: "Düsseldorf", street: "Immermannstraße 65", plz: "40210", land: "Deutschland", orders: 61, openOrders: 4, contacts: [
        { name: "Sharon Kelch", role: "Logistik", phone: "+49 173 9920781", email: "sharon.kelch@enterprise.de" } ],
      dispoAusland: "EU-weit, Maut über Auftraggeber.", durchfuehrung: "Schlüsselübergabe nur gegen Unterschrift.", rechnung: "14-Tage-Ziel." },
    { id: "K-1051", name: "Moll Automobile", short:"Moll", email: "fuhrpark@moll.de", phone: "+49 241 16050", city: "Aachen", street: "Jülicher Straße 336", plz: "52070", land: "Deutschland", orders: 142, openOrders: 9, contacts: [
        { name: "Corinna Moebius", role: "Fuhrpark", phone: "+49 170 4421187", email: "corinna.moebius@moll.de" },
        { name: "Christian Franzen", role: "Werkstatt", phone: "+49 170 9981233", email: "christian.franzen@moll.de" } ],
      dispoAusland: "", durchfuehrung: "Werkstatttermine telefonisch bestätigen.", rechnung: "Monatlich, nach Kostenstelle getrennt." },
    { id: "K-1052", name: "Hertz Deutschland", short:"Hertz", email: "ops@hertz.de", phone: "+49 69 970620", city: "Frankfurt am Main", street: "Hahnstraße 70", plz: "60528", land: "Deutschland", orders: 47, openOrders: 3, contacts: [
        { name: "Bianca Schröer", role: "Disposition", phone: "+49 151 33442211", email: "bianca.schroeer@hertz.de" } ],
      dispoAusland: "BeNeLux regelmäßig.", durchfuehrung: "Standardprotokoll.", rechnung: "Einzelrechnung." },
    { id: "K-1060", name: "Europcar Mobility", short:"Europcar", email: "dispo@europcar.de", phone: "+49 40 520180", city: "Hamburg", street: "Süderstraße 282", plz: "20537", land: "Deutschland", orders: 33, openOrders: 2, contacts: [
        { name: "Linda Atipo-Ngapy", role: "Disposition", phone: "+49 152 55120099", email: "linda.atipo@europcar.de" } ],
      dispoAusland: "", durchfuehrung: "Reifen-Check Pflicht.", rechnung: "Monatlich." },
    { id: "K-1071", name: "Mercedes-Benz Niederlassung Rhein-Ruhr", short:"MB Rhein-Ruhr", email: "logistik@mb-rheinruhr.de", phone: "+49 211 23030", city: "Düsseldorf", street: "Mercedes-Benz-Straße 1", plz: "40472", land: "Deutschland", orders: 76, openOrders: 6, contacts: [
        { name: "Bastian Kirmis", role: "Auslieferung", phone: "+49 160 7620715", email: "bastian.kirmis@mercedes-benz.de" } ],
      dispoAusland: "", durchfuehrung: "Neuwagen: Schutzfolie nicht entfernen.", rechnung: "14-Tage-Ziel." },
    { id: "K-1080", name: "VW Leasing Service", short:"VW Leasing", email: "rueckgabe@vwfs.de", phone: "+49 531 2120", city: "Braunschweig", street: "Gifhorner Straße 57", plz: "38112", land: "Deutschland", orders: 54, openOrders: 5, contacts: [
        { name: "Julia Stuurman", role: "Rückläufer", phone: "+49 170 6688711", email: "julia.stuurman@vwfs.de" } ],
      dispoAusland: "", durchfuehrung: "Rückgabeprotokoll inkl. Kilometerstand.", rechnung: "Monatlich." },
  ];

  const driverNames = [
    ["Amin Dahmouni","Wülfrath","42489","Angestellt","amin.dahmouni@gmail.com","+49 176 21625135","2025-11-19","m"],
    ["Christian Franz","Neuss","41464","Selbständig","christian_franz@gmx.de","+49 162 9212310","2025-02-14","m"],
    ["Pietro Papa","Neuss","41469","Mini Job","pietro_p@web.de","+49 176 20771466","2026-01-15","m"],
    ["Karl-Heinz Wondra","Meerbusch","40667","Selbständig","wondra@me.com","+49 157 74007651","2025-04-24","m"],
    ["Thomas Dinter","Krefeld","47800","Mini Job","cycletec@t-online.de","+49 170 3179192","2025-05-30","m"],
    ["Andreas Kluckhohn","Krefeld","47839","Selbständig","akluckhohn@web.de","+49 176 34625986","2025-09-10","m"],
    ["Karl-Heinz Stiller","Korschenbroich","41352","Mini Job","kh.stiller@gmx.de","+49 160 7620715","2025-10-09","m"],
    ["Ilias Ouald Abbou","Heiligenhaus","42579","Mini Job","i.oualdabbou@googlemail.com","+49 157 71353840","2024-09-24","m"],
    ["Siegfried Kirsten","Duisburg","47269","Mini Job","siegfried-kirsten@web.de","+49 170 5603096","2025-09-25","m"],
    ["Stefan Stredak","Duisburg","47269","Mini Job","stefanstredak@icloud.com","+49 163 2507963","2025-08-27","m"],
    ["Dominic Seezar","Düsseldorf","40227","Selbständig","tekinecom17@gmail.com","+49 176 30300979","2025-07-03","m"],
    ["Bilal El Alaoui","Düsseldorf","40235","Angestellt","elalaoui732@gmail.com","+49 170 76688711","2025-03-18","m"],
    ["Redouan Daoudi","Köln","50667","Angestellt","daoudiredouan72@gmail.com","+49 163 9770184","2025-06-11","m"],
    ["Martina Pophal","Düsseldorf","40210","Selbständig","martina.pophal@vittra.de","+49 151 64120098","2025-01-22","f"],
    ["Pedro Martinez Ferron","Essen","45127","Mini Job","p.martinez@gmail.com","+49 176 55098321","2025-12-02","m"],
    ["Semih Yilmaz","Wuppertal","42103","Selbständig","semih.yilmaz@gmx.de","+49 152 11220098","2025-08-14","m"],
    ["Andrei Popescu","Mönchengladbach","41061","Angestellt","a.popescu@web.de","+49 160 22113344","2025-10-30","m"],
    ["Goran Petrovic","Oberhausen","46045","Mini Job","g.petrovic@gmail.com","+49 157 99001122","2025-07-19","m"],
    ["Markus Lindner","Leverkusen","51373","Angestellt","m.lindner@t-online.de","+49 170 44556677","2025-05-08","m"],
    ["Fatih Demir","Solingen","42651","Selbständig","fatih.demir@gmx.net","+49 176 88990011","2025-09-02","m"],
    ["Anja Reichert","Ratingen","40878","Angestellt","anja.reichert@web.de","+49 151 77882200","2025-04-15","f"],
    ["Tobias Engel","Hilden","40721","Mini Job","tobias.engel@gmail.com","+49 163 22119988","2025-11-11","m"],
  ];
  const drivers = driverNames.map((d, i) => {
    const reg = new Date(d[6]);
    return {
      id: "F-" + (2001 + i), name: d[0], city: d[1], plz: d[2], type: d[3], email: d[4], phone: d[5],
      registered: d[6], consent: d[6] + " · " + ["08:47","09:00","14:31","10:51","09:17","07:53","18:32","17:12","04:45","08:50"][i%10],
      gender: d[7], active: i % 9 !== 4, status: ["available","onjob","available","offduty","available","onjob","available","available","offduty","available"][i%10],
      vat: d[3] === "Selbständig", taxNr: d[3]==="Selbständig" ? "DE" + (210000000 + i*137) : "",
      rating: (4.2 + ((i*7)%9)/10).toFixed(1), trips: 40 + (i*53)%620,
      docs: { perso_v: i%4!==0, perso_r: i%4!==0, fs_v: i%3!==0, fs_r: i%3!==0, gewerbe: d[3]==="Selbständig" && i%2===0, ustvat: d[3]==="Selbständig" }
    };
  });

  const cities = [
    ["Düsseldorf","40468","Kieshecker Weg 260"],["Düren","52349","Zülpicher Straße 150"],
    ["Germersheim","76726","Mercedes-Benz-Straße 1"],["Moers","47441","am schuermannhuett 34c"],
    ["Neuss","41460","Danziger Straße 17-19"],["Bremen","28199","Flughafenallee 27"],
    ["Zülpich","53909","richard lawson str 1"],["Mülheim an der Ruhr","45473","Bessemerstr. 2"],
    ["Köln","50667","Hohe Straße 12"],["Essen","45127","Kettwiger Straße 3"],
    ["Dortmund","44137","Westenhellweg 90"],["Wuppertal","42103","Friedrich-Ebert-Str. 50"],
    ["Aachen","52070","Jülicher Straße 336"],["Bonn","53111","Markt 1"],
    ["Frankfurt am Main","60528","Hahnstraße 70"],["Stuttgart","70173","Königstraße 5"],
    ["Hamburg","20537","Süderstraße 282"],["Berlin","10785","Potsdamer Platz 1"],
  ];
  const models = [
    ["VW TOURAN MPV 7S BE AUT","WVGZZZ1TXTW006279","M -VU 6239"],["MB A200 LIM BE AUT","W1K3F8HB6TJ555670","M -HB 3325"],
    ["MB E200 LIM BE AUT","W1KLF5AB3TA225686","M -VU 1465"],["VW T-ROC OFF BE MAN","WVGZZZA11TV005039","M -SP 8437"],
    ["OPEL CORSA LIM BE AUT","VXKUPHPY4S4014967","M -RD 4533"],["BMW 320d TOUR BE AUT","WBA8E91070K123456","M -LM 4728"],
    ["AUDI A4 AVANT BE AUT","WAUZZZ8E56A998877","M -KT 9012"],["VW GOLF VIII LIM BE MAN","WVWZZZAUXNW334455","M -GF 2210"],
    ["SKODA OCTAVIA COMBI BE AUT","TMBJJ7NE5N0112233","M -SK 5566"],["MB GLC SUV BE AUT","W1N2539831F778899","M -GL 7788"],
    ["FORD FOCUS LIM BE MAN","WF05XXGCH5KP44556","M -FO 3344"],["BMW X1 SUV BE AUT","WBAUX91030L667788","M -BX 8899"],
    ["VW PASSAT VAR BE AUT","WVWZZZ3CZNE556677","M -PA 1122"],["RENAULT CLIO LIM BE MAN","VF15RJL0H66778899","M -RC 4455"],
    ["MB SPRINTER KASTEN BE MAN","WDB9061331N223344","M -SP 6677"],["TESLA MODEL 3 LIM BE AUT","5YJ3E7EAXKF334455","M -TS 9900"],
  ];
  const auftraggeber = ["Sixt Autovermietung","Avis Autovermietung","Enterprise Autovermietung","Mercedes-Benz Niederlassung Rhein-Ruhr","VW Leasing Service","Moll Automobile","Hertz Deutschland"];
  const bundeslaender = ["Nordrhein-Westfalen","Bayern","Baden-Württemberg","Hessen","Niedersachsen","Rheinland-Pfalz","Bremen","Berlin"];
  // order statuses: zugewiesen, nicht_zugewiesen, fertig, storniert, inaktiv
  const statusMap = {
    zugewiesen: { label: "Zugewiesen", cls: "info" },
    angenommen: { label: "Angenommen", cls: "ok" },
    unterwegs: { label: "Unterwegs", cls: "purple" },
    nicht_zugewiesen: { label: "Nicht zugewiesen", cls: "warn" },
    fertig: { label: "Fertig", cls: "ok" },
    storniert: { label: "Storniert", cls: "danger" },
    inaktiv: { label: "Inaktiv", cls: "" },
  };
  const jobTypes = ["Mini Job","Selbständig","Angestellt"];

  function mkDate(base, off) { const d = new Date(base); d.setDate(d.getDate() + off); return d.toISOString().slice(0,10); }
  const today = new Date("2026-06-04");
  const orders = [];
  const statusPool = ["angenommen","zugewiesen","unterwegs","nicht_zugewiesen","fertig","fertig","storniert","zugewiesen","angenommen","inaktiv"];
  for (let i = 0; i < 64; i++) {
    const m = models[i % models.length];
    const from = cities[i % cities.length];
    const to = cities[(i + 5) % cities.length];
    const st = statusPool[i % statusPool.length];
    const drv = (st === "nicht_zugewiesen" || st === "inaktiv") ? null : drivers[(i * 3) % drivers.length];
    const ag = auftraggeber[i % auftraggeber.length];
    const offset = (i % 21) - 6;
    // clean deterministic German plate: REGION-LL NNNN
    const regions = ["M", "D", "K", "B", "F", "S", "DU", "E", "NE", "AC"];
    const letters = ["VU", "HB", "SP", "RD", "LM", "KT", "GF", "BX", "PA", "TS"];
    const reg = regions[i % regions.length];
    const ll = letters[(i * 3) % letters.length];
    const nnnn = 1000 + (i * 137) % 8999;
    const plate = `${reg}-${ll} ${nnnn}`;
    orders.push({
      id: 548197 - i * 137,
      mvNr: "MV-" + (90210 + i * 17),
      plate,
      plateRaw: plate,
      model: m[0], vin: m[1],
      auftraggeber: ag,
      from: { city: from[0], plz: from[1], street: from[2] },
      to: { city: to[0], plz: to[1], street: to[2] },
      pickupDate: i % 5 === 0 ? null : mkDate(today, offset),
      pickupWindow: i % 3 === 0 ? "08:00–16:30" : null,
      deliveryDate: i % 4 === 0 ? null : mkDate(today, offset + 2),
      status: st,
      driver: drv,
      jobType: drv ? jobTypes[(i) % 3] : null,
      bundesland: bundeslaender[i % bundeslaender.length],
      price: 120 + (i * 37) % 480,
      priceSelbst: 80 + (i * 23) % 260,
      km: 40 + (i * 67) % 720,
      refuel: i % 4 === 0,
      arbeitsnachweis: st === "fertig" ? (i % 3 === 0 ? "bestätigt" : "offen") : null,
      created: mkDate(today, offset - 3),
    });
  }

  const parking = [
    { id:"S-01", name:"Hub Düsseldorf-Nord", city:"Düsseldorf", street:"Kieshecker Weg 260", plz:"40468", bundesland:"Nordrhein-Westfalen", cap:40, used:31, taxi:false, hours:"Mo–Fr 06–22, Sa 08–14" },
    { id:"S-02", name:"Stellplatz Köln-Süd", city:"Köln", street:"Bonner Straße 180", plz:"50968", bundesland:"Nordrhein-Westfalen", cap:24, used:18, taxi:true, hours:"24/7" },
    { id:"S-03", name:"Depot Germersheim", city:"Germersheim", street:"Mercedes-Benz-Straße 1", plz:"76726", bundesland:"Rheinland-Pfalz", cap:120, used:96, taxi:false, hours:"Mo–Sa 05–23" },
    { id:"S-04", name:"Hof Neuss-Hafen", city:"Neuss", street:"Danziger Straße 17", plz:"41460", bundesland:"Nordrhein-Westfalen", cap:30, used:12, taxi:true, hours:"Mo–Fr 07–20" },
    { id:"S-05", name:"Parkdeck Frankfurt-Flughafen", city:"Frankfurt am Main", street:"Hahnstraße 70", plz:"60528", bundesland:"Hessen", cap:60, used:55, taxi:true, hours:"24/7" },
    { id:"S-06", name:"Stellfläche Bremen-Nord", city:"Bremen", street:"Flughafenallee 27", plz:"28199", bundesland:"Bremen", cap:18, used:7, taxi:false, hours:"Mo–Fr 06–18" },
  ];

  const documents = [
    { id:"D-2041", name:"CMR_Frachtbrief_548197.pdf", type:"CMR-Frachtbrief", order:"548197", driver:"Pedro Martinez Ferron", size:"248 KB", date:"2026-06-03", status:"fertig" },
    { id:"D-2040", name:"Schadensprotokoll_M-VU6239.pdf", type:"Schadensprotokoll", order:"548197", driver:"Pedro Martinez Ferron", size:"1.2 MB", date:"2026-06-03", status:"fertig" },
    { id:"D-2039", name:"Übergabe_M-HB3325.pdf", type:"Übergabeprotokoll", order:"547032", driver:"Christian Franz", size:"412 KB", date:"2026-06-02", status:"offen" },
    { id:"D-2038", name:"Arbeitsnachweis_KW23_Wondra.pdf", type:"Arbeitsnachweis", order:"—", driver:"Karl-Heinz Wondra", size:"96 KB", date:"2026-06-02", status:"unbestätigt" },
    { id:"D-2037", name:"Rechnung_Sixt_Mai2026.pdf", type:"Rechnung", order:"Sammel", driver:"—", size:"320 KB", date:"2026-06-01", status:"fertig" },
    { id:"D-2036", name:"Tankbeleg_M-SP8437.jpg", type:"Tankbeleg", order:"540561", driver:"Semih Yilmaz", size:"840 KB", date:"2026-05-31", status:"fertig" },
    { id:"D-2035", name:"Führerschein_Daoudi.pdf", type:"Fahrer-Dokument", order:"—", driver:"Redouan Daoudi", size:"180 KB", date:"2026-05-30", status:"fertig" },
    { id:"D-2034", name:"CMR_Frachtbrief_544987.pdf", type:"CMR-Frachtbrief", order:"544987", driver:"Andrei Popescu", size:"256 KB", date:"2026-05-29", status:"offen" },
  ];

  // dashboard time series (last 14 days throughput)
  const series = [42,38,51,47,55,49,62,58,44,67,71,63,59,74];
  const statusBreakdown = [
    { key:"zugewiesen", label:"Zugewiesen", value: 8975, cls:"info" },
    { key:"angenommen", label:"Angenommen", value: 6210, cls:"ok" },
    { key:"nicht_zugewiesen", label:"Nicht zugewiesen", value: 1370, cls:"warn" },
    { key:"fertig", label:"Fertig", value: 5536, cls:"ok" },
    { key:"storniert", label:"Storniert", value: 184, cls:"danger" },
    { key:"inaktiv", label:"Inaktiv", value: 222, cls:"" },
  ];

  const MWDATA: any = {
    customers, drivers, orders, parking, documents, series, statusBreakdown,
    statusMap, auftraggeber, bundeslaender, jobTypes, cities, models,
    kpi: {
      total: 10345, assigned: 8975, unassigned: 1370, auslagenOffen: 486,
      arbeitsnachweisOffen: 1768, arbeitsnachweisUnbestaetigt: 267, fertig: 5536, storniert: 184, inaktiv: 222,
      activeDrivers: 34, driversTotal: 49, selbst: 8, angestellt: 22, minijob: 19,
    }
  };

/* ---- Schicht- & Personal-Daten (Phase 2) ---- */

  const D = MWDATA;

  /* ---- "Jetzt" für die 48h-Regel (UTC-fest) ---- */
  const NOW = new Date("2026-06-05T11:30:00Z");
  const LOCK_MS = 48 * 3600 * 1000;

  /* ---- Aktuelle Woche: KW 23 · Mo 01.06 – So 07.06.2026 ---- */
  const weekStart = new Date(Date.UTC(2026, 5, 1));
  const isoDay = (d) => d.toISOString().slice(0, 10);
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(weekStart); d.setUTCDate(d.getUTCDate() + i); return isoDay(d); });

  /* ---- Schicht-Templates ---- */
  const TPL = {
    F: { code: "F", name: "Frühdienst", start: "06:00", end: "14:30", brk: 30, color: "#0ea5e9" },
    T: { code: "T", name: "Tagesdienst", start: "09:00", end: "17:30", brk: 30, color: "var(--ok)" },
    S: { code: "S", name: "Spätdienst", start: "14:00", end: "22:30", brk: 45, color: "#f59e0b" },
    N: { code: "N", name: "Nachtdienst", start: "22:00", end: "06:30", brk: 45, color: "#7c3aed" },
    B: { code: "B", name: "Bereitschaft", start: "08:00", end: "20:00", brk: 60, color: "#14b8a6" },
  };
  MWDATA.SHIFT_TPL = TPL;

  /* ---- Personal (reuse drivers + Büro) ---- */
  const roleByType = { "Angestellt": "Fahrer (VZ)", "Selbständig": "Fahrer (Sub)", "Mini Job": "Fahrer (MJ)" };
  const contractByType = { "Angestellt": 40, "Selbständig": 0, "Mini Job": 10 };
  const staff = D.drivers.slice(0, 14).map((d, i) => ({
    id: "P-" + (3001 + i), driverId: d.id, name: d.name, initials: undefined,
    role: roleByType[d.type] || "Fahrer", team: ["NRW Nord", "NRW Süd", "Rheinland"][i % 3],
    contractH: contractByType[d.type] ?? 20, type: d.type, city: d.city, phone: d.phone, email: d.email,
    active: d.active, vacationTotal: 28, vacationTaken: 6 + (i * 3) % 16,
  }));
  // add 2 office/dispo staff
  staff.unshift(
    { id: "P-3000", driverId: null, name: "Sandra Keller", role: "Disponentin", team: "Disposition", contractH: 40, type: "Angestellt", city: "Düsseldorf", phone: "+49 211 5500100", email: "s.keller@mwtransport.de", active: true, vacationTotal: 30, vacationTaken: 11 },
    { id: "P-2999", driverId: null, name: "Murat Aydın", role: "Lagerleiter", team: "Hub Nord", contractH: 40, type: "Angestellt", city: "Düsseldorf", phone: "+49 211 5500120", email: "m.aydin@mwtransport.de", active: true, vacationTotal: 30, vacationTaken: 18 },
  );

  /* ---- Schichteinträge: shifts[staffId][dateISO] ----
     Jeder Eintrag trägt Soll (Plan) + Ist (Stempel, Phase 3). */
  function hoursBetween(a, b, brk) {
    const [ah, am] = a.split(":").map(Number); const [bh, bm] = b.split(":").map(Number);
    let mins = (bh * 60 + bm) - (ah * 60 + am); if (mins < 0) mins += 24 * 60;
    return (mins - brk) / 60;
  }
  const pattern = ["T", "F", "S", "frei", "T", "T", "frei", "F", "S", "T", "frei", "N", "T", "frei"];
  const shifts = {};
  staff.forEach((s, si) => {
    shifts[s.id] = {};
    days.forEach((date, di) => {
      const dt = new Date(date + "T00:00:00Z");
      const dow = dt.getUTCDay(); // 0 Sun .. 6 Sat
      let key = pattern[(si + di * 2) % pattern.length];
      // Sundays mostly free; office staff Mon-Fri T
      if (dow === 0) key = (si % 4 === 0) ? "B" : "frei";
      if (s.role.startsWith("Dispo") || s.role.startsWith("Lager")) key = (dow === 0 || dow === 6) ? "frei" : "T";
      // some vacation / sick blocks
      const onVacation = (si === 3 && di >= 2 && di <= 6) || (si === 9 && di >= 8 && di <= 12) || (si === 6 && di === 4);
      const sick = (si === 12 && di === 5);

      let entry;
      if (onVacation) entry = { state: "urlaub" };
      else if (sick) entry = { state: "krank" };
      else if (key === "frei") entry = { state: "frei" };
      else {
        const tpl = TPL[key];
        const soll = hoursBetween(tpl.start, tpl.end, tpl.brk);
        // Ist (Stempel): nur für Vergangenheit befüllt (Phase 3 simulation)
        const isPast = dt.getTime() + 12 * 3600 * 1000 < NOW.getTime();
        let actualIn = null, actualOut = null, ist = null, clockStatus = "ausstehend";
        if (isPast) {
          const jitterIn = [(si + di) % 3 - 1, 0, 2, -3, 5][di % 5];
          const jitterOut = [(si * di) % 4, 8, -6, 12, 0][si % 5];
          const adj = (t, m) => { const [h, mm] = t.split(":").map(Number); let tot = h * 60 + mm + m; const hh = Math.floor((tot + 1440) % 1440 / 60); const m2 = (tot + 1440) % 60; return String(hh).padStart(2, "0") + ":" + String(m2).padStart(2, "0"); };
          actualIn = adj(tpl.start, jitterIn); actualOut = adj(tpl.end, jitterOut);
          ist = hoursBetween(actualIn, actualOut, tpl.brk);
          clockStatus = "erfasst";
        }
        entry = { state: "shift", code: key, start: tpl.start, end: tpl.end, brk: tpl.brk, soll: +soll.toFixed(2), actualIn, actualOut, ist: ist == null ? null : +ist.toFixed(2), clockStatus };
      }
      // 48h Sperre
      const lockEnd = dt.getTime() + 24 * 3600 * 1000;
      const locked = dt.getTime() < NOW.getTime() + LOCK_MS && lockEnd > NOW.getTime() - 0;
      const past = dt.getTime() + 24 * 3600 * 1000 <= NOW.getTime();
      entry.locked = locked && !past;
      entry.past = past;
      entry.date = date;
      shifts[s.id][date] = entry;
    });
  });

  /* ---- Urlaubsanträge ---- */
  const vacations = [
    { id: "U-501", staffId: staff[4].id, name: staff[4].name, type: "Urlaub", from: "2026-06-03", to: "2026-06-07", days: 5, status: "genehmigt", note: "Familienurlaub" },
    { id: "U-502", staffId: staff[10].id, name: staff[10].name, type: "Urlaub", from: "2026-06-09", to: "2026-06-13", days: 5, status: "beantragt", note: "" },
    { id: "U-503", staffId: staff[7].id, name: staff[7].name, type: "Krank", from: "2026-06-05", to: "2026-06-05", days: 1, status: "genehmigt", note: "AU liegt vor" },
    { id: "U-504", staffId: staff[2].id, name: staff[2].name, type: "Urlaub", from: "2026-06-22", to: "2026-07-03", days: 10, status: "beantragt", note: "Sommerurlaub" },
    { id: "U-505", staffId: staff[13].id, name: staff[13].name, type: "Sonderurlaub", from: "2026-06-18", to: "2026-06-18", days: 1, status: "beantragt", note: "Umzug" },
    { id: "U-506", staffId: staff[1].id, name: staff[1].name, type: "Urlaub", from: "2026-06-15", to: "2026-06-19", days: 5, status: "abgelehnt", note: "Engpass NRW Nord" },
  ];

  MWDATA.shiftMeta = { NOW: NOW.toISOString(), weekStartISO: isoDay(weekStart), days, lockHours: 48 };
  MWDATA.staff = staff;
  MWDATA.shifts = shifts;
  MWDATA.vacations = vacations;

  return MWDATA;
};

export const MWDATA: any = _build();
export default MWDATA;
