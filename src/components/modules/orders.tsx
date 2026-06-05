"use client";

/* MW Transport Service — ported from app/orders.jsx. Behaviour preserved 1:1. */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Icon } from "@/components/icon";
import {
  Avatar, Plate, StatusBadge, TypeBadge, Modal, useToast, Sparkline, MiniBars,
  Donut, Field, Switch, Check, Menu, PageHead, Empty, fmtDate, fmtEur,
} from "@/components/ui";
import { MWDATA } from "@/lib/data";
import { useAppNav, useModuleInitial } from "@/lib/use-app-nav";
import {
  getOrders, createOrder as createOrderAction, cancelOrder as cancelOrderAction,
  assignOrderDriver, updateOrdersStatus,
} from "@/actions/order-actions";
import type { OrderVM } from "@/lib/supabase/types";

function OrderStatStrip({ kpi }) {
  const items = [
    ["Gesamt", kpi.total, ""], ["Zugewiesen", kpi.assigned, "ok"], ["Nicht zugewiesen", kpi.unassigned, "warn"],
    ["Auslagen offen", kpi.auslagenOffen, "info"], ["Nachweis offen", kpi.arbeitsnachweisOffen, "info"],
    ["Fertig", kpi.fertig, "ok"], ["Storniert", kpi.storniert, "danger"], ["Inaktiv", kpi.inaktiv, ""],
  ];
  return (
    <div className="card" style={{ marginBottom: "var(--gap)", display: "flex", overflowX: "auto" }}>
      {items.map(([l, v, c], i) => (
        <div key={l} style={{ padding: "12px 18px", borderRight: i < items.length - 1 ? "1px solid var(--border)" : "none", flex: "1 0 auto", minWidth: 120 }}>
          <div style={{ fontSize: 11.5, color: "var(--fg-3)", fontWeight: 600, whiteSpace: "nowrap" }}>{l}</div>
          <div className="t-mono" style={{ fontSize: 20, fontWeight: 760, letterSpacing: "-.02em", marginTop: 4, color: c ? `var(--${c}-fg)` : "var(--fg)" }}>{v.toLocaleString("de-DE")}</div>
        </div>
      ))}
    </div>
  );
}

/* Loading skeleton — mirrors the 10-column order table layout. */
function OrderSkeletonRows({ rows = 8 }: { rows?: number }) {
  const bar = (w: number | string) => (
    <span style={{ display: "block", height: 11, width: w, borderRadius: 5, background: "var(--border)", opacity: 0.7, animation: "mwtPulse 1.2s ease-in-out infinite" }} />
  );
  return (
    <React.Fragment>
      <style>{"@keyframes mwtPulse{0%,100%{opacity:.45}50%{opacity:.9}}"}</style>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={"sk" + i}>
          <td><span className="checkbox" /></td>
          <td>{bar(54)}</td>
          <td>{bar(90)}</td>
          <td>{bar("70%")}</td>
          <td>{bar(72)}</td>
          <td>{bar("60%")}</td>
          <td>{bar(80)}</td>
          <td>{bar(70)}</td>
          <td style={{ textAlign: "right" }}>{bar(40)}</td>
          <td>{bar(48)}</td>
        </tr>
      ))}
    </React.Fragment>
  );
}

export function Orders() {
  const onNav = useAppNav();
  const initial = useModuleInitial();
  // Lookup/config lists (status labels, dropdown sources, driver pool for the
  // assignment picker) stay as tenant config constants for now — only the
  // live order records move to Supabase in this phase.
  const D = MWDATA;
  const toast = useToast();
  const [orders, setOrders] = useState<OrderVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [fStatus, setFStatus] = useState(initial?.filter || "all");
  const [fType, setFType] = useState("all");
  const [fAuftraggeber, setFAuftraggeber] = useState("all");
  const [fBundesland, setFBundesland] = useState("all");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState({ k: "id", dir: "desc" });
  const [showCreate, setShowCreate] = useState(!!initial?.create);
  const [detail, setDetail] = useState<OrderVM | null>(null);
  const [assignFor, setAssignFor] = useState<string | "bulk" | null>(null);

  // Fetch tenant-scoped orders from Supabase via the Server Action.
  const load = useCallback(async () => {
    setLoading(true);
    const res = await getOrders();
    if (res.error) {
      setLoadError(res.error);
      setOrders([]);
    } else {
      setLoadError(null);
      setOrders(res.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (initial?.filter) setFStatus(initial.filter);
    if (initial?.auftraggeber) setFAuftraggeber(initial.auftraggeber);
    if (initial?.create) setShowCreate(true);
  }, [initial]);

  // Open the requested order once it has loaded (deep-link / cross-module nav).
  useEffect(() => {
    if (initial?.focus && orders.length) {
      const o = orders.find(x => String(x.orderNo) === String(initial.focus) || x.id === initial.focus);
      if (o) setDetail(o);
    }
  }, [initial, orders]);

  // KPI counters derived from the live tenant data set.
  const kpi = useMemo(() => {
    const by = (s: string) => orders.filter(o => o.status === s).length;
    return {
      total: orders.length,
      assigned: orders.filter(o => o.driver).length,
      unassigned: by("nicht_zugewiesen"),
      auslagenOffen: orders.filter(o => o.refuel && o.status !== "storniert").length,
      arbeitsnachweisOffen: orders.filter(o => o.arbeitsnachweis === "offen").length,
      fertig: by("fertig"),
      storniert: by("storniert"),
      inaktiv: by("inaktiv"),
    };
  }, [orders]);

  const filtered = useMemo(() => {
    let r = orders.filter(o => {
      if (fStatus !== "all" && o.status !== fStatus) return false;
      if (fType !== "all" && o.jobType !== fType) return false;
      if (fAuftraggeber !== "all" && o.auftraggeber !== fAuftraggeber) return false;
      if (fBundesland !== "all" && o.bundesland !== fBundesland) return false;
      if (q) {
        const s = q.toLowerCase();
        if (!(String(o.orderNo).includes(s) || o.plate.toLowerCase().includes(s) || o.model.toLowerCase().includes(s) ||
          o.from.city.toLowerCase().includes(s) || o.to.city.toLowerCase().includes(s) || o.vin.toLowerCase().includes(s) ||
          (o.driver && o.driver.name.toLowerCase().includes(s)) || o.auftraggeber.toLowerCase().includes(s))) return false;
      }
      return true;
    });
    r = [...r].sort((a, b) => {
      let av, bv;
      switch (sort.k) {
        case "plate": av = a.plate; bv = b.plate; break;
        case "from": av = a.from.city; bv = b.from.city; break;
        case "date": av = a.pickupDate || ""; bv = b.pickupDate || ""; break;
        case "price": av = a.price; bv = b.price; break;
        default: av = a.orderNo; bv = b.orderNo;
      }
      const c = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === "asc" ? c : -c;
    });
    return r;
  }, [orders, q, fStatus, fType, fAuftraggeber, fBundesland, sort]);

  const toggleSort = (k) => setSort(s => ({ k, dir: s.k === k && s.dir === "asc" ? "desc" : "asc" }));
  const SortTh = ({ k, children, style }) => (
    <th className="sortable" style={style} onClick={() => toggleSort(k)}>
      <span className="flex items-center gap-sm" style={{ gap: 4 }}>{children}{sort.k === k && <Icon name={sort.dir === "asc" ? "arrowUp" : "arrowDown"} size={12} />}</span>
    </th>
  );

  const allSel = filtered.length > 0 && filtered.every(o => sel.has(o.id));
  const toggleAll = () => setSel(allSel ? new Set() : new Set(filtered.map(o => o.id)));
  const toggleOne = (id) => setSel(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const activeFilters = [fStatus, fType, fAuftraggeber, fBundesland].filter(x => x !== "all").length + (q ? 1 : 0);
  const clearFilters = () => { setFStatus("all"); setFType("all"); setFAuftraggeber("all"); setFBundesland("all"); setQ(""); };

  // Assign a driver — optimistic UI, then persist via the Server Action.
  const assignDriver = async (orderId, driver) => {
    const patch = { driver, status: "zugewiesen", jobType: driver.type };
    setOrders(os => os.map(o => o.id === orderId ? { ...o, ...patch } : o));
    setDetail(d => d && d.id === orderId ? { ...d, ...patch } : d);
    setAssignFor(null);
    const res = await assignOrderDriver(orderId, { id: driver.id, name: driver.name, phone: driver.phone, city: driver.city, type: driver.type });
    if (res.error) { toast(res.error, "x"); load(); return; }
    toast(driver.name.split(" ")[0] + " zugewiesen · Benachrichtigung gesendet", "send");
  };

  const cancelOrder = async (id) => {
    setOrders(os => os.map(o => o.id === id ? { ...o, status: "storniert" } : o));
    setDetail(null);
    const res = await cancelOrderAction(id);
    if (res.error) { toast(res.error, "x"); load(); return; }
    toast("Auftrag storniert", "x");
  };

  const createOrder = async (data) => {
    const res = await createOrderAction(data);
    if (res.error || !res.data) { toast(res.error ?? "Auftrag konnte nicht angelegt werden.", "x"); return; }
    setOrders(os => [res.data as OrderVM, ...os]);
    setShowCreate(false);
    toast("Auftrag #" + res.data.orderNo + " angelegt", "check");
  };

  /* ============================================================
     Export / Import
     Libraries are dynamically imported so they are code-split out
     of the initial client bundle and only fetched on first use —
     which is also why the handlers are async.
     Exports respect the active filters/search (we export `filtered`).
     ============================================================ */
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Timestamp for filenames, e.g. 2026-06-05_14-22
  const stamp = () => new Date().toISOString().slice(0, 16).replace("T", "_").replace(":", "-");

  // Single source of truth for the exported shape. German headers map
  // directly to the spreadsheet columns / PDF table headers.
  const toRow = (o) => ({
    "ID": o.orderNo,
    "MV-Nr.": o.mvNr,
    "Kennzeichen": o.plate,
    "Modell": o.model,
    "Abholort": `${o.from.plz} ${o.from.city}`,
    "Anlieferort": `${o.to.plz} ${o.to.city}`,
    "Kunde": o.auftraggeber,
    "Fahrer": o.driver ? o.driver.name : "—",
    "Datum": o.pickupDate ? fmtDate(o.pickupDate) : "undefiniert",
    "Status": D.statusMap[o.status]?.label ?? o.status,
    "Preis (€)": o.price,
  });

  const exportToExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const rows = filtered.map(toRow);
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 9 }, { wch: 12 }, { wch: 13 }, { wch: 22 }, { wch: 22 }, { wch: 22 }, { wch: 20 }, { wch: 22 }, { wch: 13 }, { wch: 18 }, { wch: 10 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Aufträge");
      XLSX.writeFile(wb, `MW-Auftraege_${stamp()}.xlsx`);
      toast(rows.length + " Aufträge als Excel exportiert", "excel");
    } catch (err) {
      console.error(err);
      toast("Excel-Export fehlgeschlagen", "x");
    }
  };

  const exportToCSV = async () => {
    try {
      const XLSX = await import("xlsx");
      const rows = filtered.map(toRow);
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Aufträge");
      // bookType csv emits a UTF-8 CSV with BOM so Umlaute open cleanly in Excel
      XLSX.writeFile(wb, `MW-Auftraege_${stamp()}.csv`, { bookType: "csv" });
      toast(rows.length + " Aufträge als CSV exportiert", "documents");
    } catch (err) {
      console.error(err);
      toast("CSV-Export fehlgeschlagen", "x");
    }
  };

  const exportToPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

      // Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("MW Transport Service — Auftragsübersicht", 40, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(`${filtered.length} Aufträge · Stand ${fmtDate(new Date().toISOString().slice(0, 10))}`, 40, 56);

      autoTable(doc, {
        startY: 72,
        head: [["ID", "Kennzeichen", "Strecke", "Kunde", "Datum", "Status"]],
        body: filtered.map(o => [
          String(o.orderNo),
          o.plate,
          `${o.from.city} → ${o.to.city}`,
          o.auftraggeber,
          o.pickupDate ? fmtDate(o.pickupDate) : "undefiniert",
          D.statusMap[o.status]?.label ?? o.status,
        ]),
        styles: { fontSize: 8.5, cellPadding: 5, lineColor: [228, 228, 231], lineWidth: 0.5, textColor: [39, 39, 42] },
        headStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: "bold" },
        alternateRowStyles: { fillColor: [250, 250, 250] },
        columnStyles: { 0: { cellWidth: 60, fontStyle: "bold" }, 1: { cellWidth: 80 }, 4: { cellWidth: 80 } },
        margin: { left: 40, right: 40 },
        didDrawPage: (data) => {
          const page = doc.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`Seite ${page}`, doc.internal.pageSize.getWidth() - 60, doc.internal.pageSize.getHeight() - 20);
        },
      });

      doc.save(`MW-Auftraege_${stamp()}.pdf`);
      toast(filtered.length + " Aufträge als PDF exportiert", "pdf");
    } catch (err) {
      console.error(err);
      toast("PDF-Export fehlgeschlagen", "x");
    }
  };

  // Maps a parsed spreadsheet row (our German export headers, or close
  // variants) to the CreateOrderInput the Server Action expects.
  const sheetRowToInput = (r: Record<string, any>) => {
    const get = (...keys: string[]) => {
      for (const k of keys) {
        const hit = Object.keys(r).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
        if (hit && r[hit] !== "" && r[hit] != null) return String(r[hit]).trim();
      }
      return "";
    };
    const splitLoc = (v: string) => {
      // "40468 Düsseldorf" -> { plz, city }
      const m = v.match(/^\s*(\d{4,5})\s+(.*)$/);
      return m ? { plz: m[1], city: m[2] } : { plz: "", city: v };
    };
    const from = splitLoc(get("Abholort", "Von", "From"));
    const to = splitLoc(get("Anlieferort", "Nach", "To"));
    return {
      mvNr: get("MV-Nr.", "MV", "MV-Nr"),
      plate: get("Kennzeichen", "Plate"),
      model: get("Modell", "Model", "Fahrzeug"),
      auftraggeber: get("Kunde", "Auftraggeber", "Customer"),
      fromCity: from.city, fromPlz: from.plz,
      toCity: to.city, toPlz: to.plz,
      bundesland: get("Bundesland"),
      price: get("Preis (€)", "Preis", "Price"),
    };
  };

  // Reads the chosen .xlsx/.xls/.csv, converts the first sheet to a JSON
  // array, then loops the rows through the createOrder Server Action.
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(ev.target.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: "" });

        if (json.length === 0) { toast("Die Datei enthält keine Datenzeilen.", "x"); e.target.value = ""; return; }

        toast(json.length + " Zeilen werden importiert …", "upload");
        let ok = 0; let failed = 0;
        for (const row of json) {
          const input = sheetRowToInput(row);
          if (!input.model && !input.plate) { failed++; continue; }
          const res = await createOrderAction(input);
          if (res.error) failed++; else ok++;
        }

        await load(); // re-sync the table from the database
        if (failed === 0) toast(ok + " Aufträge importiert", "check");
        else toast(`${ok} importiert · ${failed} fehlgeschlagen`, ok ? "check" : "x");
      } catch (err) {
        console.error(err);
        toast("Import fehlgeschlagen — Datei prüfen", "x");
      }
    };
    reader.onerror = () => toast("Datei konnte nicht gelesen werden", "x");
    reader.readAsArrayBuffer(file);
    e.target.value = ""; // allow re-selecting the same file
  };

  return (
    <div>
      <PageHead title="Auftragsverwaltung" sub={filtered.length.toLocaleString("de-DE") + " von " + orders.length.toLocaleString("de-DE") + " Aufträgen"}>
        <Menu align="right" trigger={<button className="btn"><Icon name="download" size={15} />Export <Icon name="chevDown" size={13} /></button>}
          items={[{ icon: "excel", label: "Als Excel (.xlsx)", onClick: exportToExcel }, { icon: "pdf", label: "Als PDF", onClick: exportToPDF }, { icon: "documents", label: "Als CSV", onClick: exportToCSV }]} />
        <button className="btn" onClick={() => fileInputRef.current?.click()}><Icon name="upload" size={15} />Import</button>
        <input ref={fileInputRef} type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} style={{ display: "none" }} />
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}><Icon name="plus" size={16} />Neuer Auftrag</button>
      </PageHead>

      <OrderStatStrip kpi={kpi} />

      {/* Filter bar */}
      <div className="card" style={{ marginBottom: "var(--gap)", padding: "12px var(--pad)" }}>
        <div className="flex items-center gap-sm wrap">
          <div className="search" style={{ flex: "1 1 260px", minWidth: 200 }}>
            <Icon name="search" size={16} />
            <input className="input" placeholder="Kennzeichen, ID, Modell, Ort, Fahrer, VIN …" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <select className="select" style={{ width: "auto", minWidth: 150 }} value={fStatus} onChange={e => setFStatus(e.target.value)}>
            <option value="all">Alle Status</option>
            {Object.entries(D.statusMap).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select className="select" style={{ width: "auto" }} value={fType} onChange={e => setFType(e.target.value)}>
            <option value="all">Alle Fahrer-Arten</option>{D.jobTypes.map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="select" style={{ width: "auto", minWidth: 160 }} value={fAuftraggeber} onChange={e => setFAuftraggeber(e.target.value)}>
            <option value="all">Alle Auftraggeber</option>{D.auftraggeber.map(a => <option key={a}>{a}</option>)}
          </select>
          <select className="select" style={{ width: "auto", minWidth: 150 }} value={fBundesland} onChange={e => setFBundesland(e.target.value)}>
            <option value="all">Alle Bundesländer</option>{D.bundeslaender.map(b => <option key={b}>{b}</option>)}
          </select>
          {activeFilters > 0 && <button className="btn btn-ghost btn-sm" onClick={clearFilters}><Icon name="close" size={14} />Filter zurücksetzen ({activeFilters})</button>}
        </div>
      </div>

      {/* Bulk action bar */}
      {sel.size > 0 && (
        <div className="card" style={{ marginBottom: "var(--gap)", padding: "10px var(--pad)", display: "flex", alignItems: "center", gap: 12, borderColor: "var(--color-primary)", background: "var(--color-primary-soft)" }}>
          <span className="t-strong">{sel.size} ausgewählt</span>
          <div className="spacer" style={{ flex: 1 }} />
          <button className="btn btn-sm" onClick={() => { setAssignFor("bulk"); }}><Icon name="drivers" size={14} />Fahrer zuweisen</button>
          <button className="btn btn-sm" onClick={async () => { try { const XLSX = await import("xlsx"); const rows = orders.filter(o => sel.has(o.id)).map(toRow); const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "Auswahl"); XLSX.writeFile(wb, `MW-Auswahl_${stamp()}.xlsx`); toast(rows.length + " Aufträge exportiert", "excel"); } catch (err) { console.error(err); toast("Export fehlgeschlagen", "x"); } }}><Icon name="download" size={14} />Export</button>
          <button className="btn btn-sm btn-danger" onClick={async () => { const ids = [...sel]; setOrders(os => os.map(o => sel.has(o.id) ? { ...o, status: "storniert" } : o)); setSel(new Set()); const res = await updateOrdersStatus(ids, "storniert"); if (res.error) { toast(res.error, "x"); load(); } else toast((res.data ?? ids.length) + " storniert", "x"); }}><Icon name="trash" size={14} />Stornieren</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setSel(new Set())}>Abwählen</button>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="tbl-wrap" style={{ maxHeight: "calc(100vh - 380px)" }}>
          <table className="tbl">
            <thead><tr>
              <th style={{ width: 38 }}><span className={"checkbox" + (allSel ? " on" : "")} onClick={toggleAll} style={{ cursor: "pointer" }}>{allSel && <Icon name="check" size={12} sw={3} />}</span></th>
              <SortTh k="id" style={{ width: 92 }}>ID / MV</SortTh>
              <SortTh k="plate">Fahrzeug</SortTh>
              <SortTh k="from">Abholort → Anlieferort</SortTh>
              <SortTh k="date" style={{ width: 130 }}>Abholung</SortTh>
              <th>Auftraggeber</th>
              <th style={{ width: 150 }}>Fahrer</th>
              <th>Status</th>
              <SortTh k="price" style={{ width: 90, textAlign: "right" }}>Preis</SortTh>
              <th style={{ width: 100 }}></th>
            </tr></thead>
            <tbody>
              {loading ? <OrderSkeletonRows rows={8} /> : filtered.map(o => (
                <tr key={o.id} className={sel.has(o.id) ? "sel" : ""}>
                  <td><span className={"checkbox" + (sel.has(o.id) ? " on" : "")} onClick={() => toggleOne(o.id)} style={{ cursor: "pointer" }}>{sel.has(o.id) && <Icon name="check" size={12} sw={3} />}</span></td>
                  <td><div className="t-mono t-strong" style={{ fontSize: 12.5 }}>{o.orderNo}</div><div className="t-mut t-mono" style={{ fontSize: 10.5 }}>{o.mvNr}</div></td>
                  <td style={{ cursor: "pointer" }} onClick={() => setDetail(o)}><Plate value={o.plate} /><div className="t-mut" style={{ fontSize: 11, marginTop: 3, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.model}</div></td>
                  <td style={{ cursor: "pointer" }} onClick={() => setDetail(o)}>
                    <div className="flex items-center gap-sm" style={{ gap: 6, fontSize: 12.5 }}><span className="dot-ind" style={{ background: "var(--info)" }} /><span className="t-strong">{o.from.city}</span><span className="t-mut">{o.from.plz}</span></div>
                    <div className="flex items-center gap-sm" style={{ gap: 6, fontSize: 12.5, marginTop: 3 }}><span className="dot-ind" style={{ background: "var(--danger)" }} /><span className="t-strong">{o.to.city}</span><span className="t-mut">{o.to.plz}</span></div>
                  </td>
                  <td><div style={{ fontSize: 12.5 }} className={o.pickupDate ? "t-strong" : "t-mut"}>{o.pickupDate ? fmtDate(o.pickupDate) : "undefiniert"}</div>{o.pickupWindow && <div className="t-mut" style={{ fontSize: 11 }}><Icon name="clock" size={10} /> {o.pickupWindow}</div>}</td>
                  <td><div style={{ fontSize: 12.5, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={o.auftraggeber}>{o.auftraggeber}</div></td>
                  <td>
                    {o.driver ? <div className="flex items-center gap-sm" style={{ gap: 7 }}><Avatar name={o.driver.name} size={26} /><div style={{ minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 600, whiteSpace: "nowrap" }}>{o.driver.name.split(" ")[0]} {o.driver.name.split(" ").slice(-1)[0][0]}.</div></div></div>
                      : <button className="btn btn-sm" onClick={() => setAssignFor(o.id)} style={{ height: 28 }}><Icon name="plus" size={13} />Zuweisen</button>}
                  </td>
                  <td><StatusBadge status={o.status} /></td>
                  <td style={{ textAlign: "right" }} className="t-mono t-strong">{o.price} €</td>
                  <td>
                    <div className="flex items-center" style={{ gap: 4, justifyContent: "flex-end" }}>
                      <button className="icon-btn sq" style={{ height: 30, minWidth: 30 }} onClick={() => setDetail(o)} title="Details"><Icon name="eye" size={15} /></button>
                      <Menu align="right" trigger={<button className="icon-btn sq" style={{ height: 30, minWidth: 30 }}><Icon name="more" size={15} /></button>}
                        items={[
                          { icon: "edit", label: "Bearbeiten", onClick: () => setDetail(o) },
                          { icon: "drivers", label: "Fahrer zuweisen", onClick: () => setAssignFor(o.id) },
                          { icon: "documents", label: "Protokoll öffnen", onClick: () => toast("Protokoll wird geladen", "documents") },
                          { icon: "copy", label: "Duplizieren", onClick: () => toast("Auftrag dupliziert", "copy") },
                          { divider: true },
                          { icon: "trash", label: "Stornieren", danger: true, onClick: () => cancelOrder(o.id) },
                        ]} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && filtered.length === 0 && (loadError
            ? <Empty title="Aufträge konnten nicht geladen werden" sub={loadError} />
            : <Empty title="Keine Aufträge gefunden" sub="Passe Filter oder Suche an." />)}
        </div>
        <div className="tbl-foot"><span>{filtered.length.toLocaleString("de-DE")} Aufträge</span><div style={{ flex: 1 }} /><span>Σ Preis: <b className="t-mono" style={{ color: "var(--fg)" }}>{fmtEur(filtered.reduce((s, o) => s + o.price, 0))}</b></span></div>
      </div>

      {showCreate && <OrderForm D={D} onClose={() => setShowCreate(false)} onSave={createOrder} />}
      {detail && <OrderDetail order={detail} onClose={() => setDetail(null)} onAssign={() => setAssignFor(detail.id)} onCancel={() => cancelOrder(detail.id)} />}
      {assignFor && <AssignDriver D={D} onClose={() => setAssignFor(null)} onPick={async (d) => {
        if (assignFor === "bulk") {
          const ids = [...sel];
          setOrders(os => os.map(o => sel.has(o.id) ? { ...o, driver: d, status: "zugewiesen", jobType: d.type } : o));
          setSel(new Set()); setAssignFor(null);
          const results = await Promise.all(ids.map(id => assignOrderDriver(id, { id: d.id, name: d.name, phone: d.phone, city: d.city, type: d.type })));
          const failed = results.filter(r => r.error).length;
          if (failed) { toast(`${ids.length - failed} zugewiesen · ${failed} fehlgeschlagen`, "x"); load(); }
          else toast(d.name.split(" ")[0] + " zu " + ids.length + " Aufträgen zugewiesen", "send");
        } else assignDriver(assignFor, d);
      }} />}
    </div>
  );
}

/* ---------- Create / Edit form ---------- */
function OrderForm({ D, onClose, onSave }) {
  const [f, setF] = useState({ mvNr: "", plate: "", model: "", vin: "", auftraggeber: D.auftraggeber[0], fromCity: "", fromStreet: "", fromPlz: "", toCity: "", toStreet: "", toPlz: "", pickupDate: "", deliveryDate: "", km: "", price: "", priceSelbst: "", bundesland: D.bundeslaender[0], refuel: false, active: true });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const valid = f.model && f.fromCity && f.fromStreet && f.fromPlz && f.toCity && f.toStreet && f.toPlz;
  return (
    <Modal size="lg" title="Neuer Auftrag" sub="Fahrzeug-Transport anlegen" onClose={onClose}
      footer={<React.Fragment><div style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Abbrechen</button><button className="btn btn-primary" disabled={!valid} onClick={() => onSave(f)}><Icon name="check" size={16} />Auftrag speichern</button></React.Fragment>}>
      <div className="section-label">Fahrzeug</div>
      <div className="grid4" style={{ marginBottom: "var(--gap)" }}>
        <Field label="MV-Nr."><input className="input" value={f.mvNr} onChange={e => set("mvNr", e.target.value)} placeholder="MV-90210" /></Field>
        <Field label="Kennzeichen"><input className="input" value={f.plate} onChange={e => set("plate", e.target.value)} placeholder="M -VU 6239" /></Field>
        <Field label="Modell" req><input className="input" value={f.model} onChange={e => set("model", e.target.value)} placeholder="VW Touran" /></Field>
        <Field label="FIN / VIN"><input className="input" value={f.vin} onChange={e => set("vin", e.target.value)} placeholder="WVGZZZ…" /></Field>
      </div>
      <div className="grid3" style={{ marginBottom: "var(--gap)" }}>
        <Field label="Auftraggeber"><select className="select" value={f.auftraggeber} onChange={e => set("auftraggeber", e.target.value)}>{D.auftraggeber.map(a => <option key={a}>{a}</option>)}</select></Field>
        <Field label="Bundesland"><select className="select" value={f.bundesland} onChange={e => set("bundesland", e.target.value)}>{D.bundeslaender.map(b => <option key={b}>{b}</option>)}</select></Field>
        <Field label="Preis (€)"><input className="input" type="number" value={f.price} onChange={e => set("price", e.target.value)} placeholder="0" /></Field>
      </div>

      <div className="section-label" style={{ color: "var(--info-fg)" }}>Abholort</div>
      <div className="grid4" style={{ marginBottom: "var(--gap)" }}>
        <Field label="Stadt" req><input className="input" value={f.fromCity} onChange={e => set("fromCity", e.target.value)} /></Field>
        <Field label="Straße" req span><input className="input" value={f.fromStreet} onChange={e => set("fromStreet", e.target.value)} /></Field>
        <Field label="PLZ" req><input className="input" value={f.fromPlz} onChange={e => set("fromPlz", e.target.value)} /></Field>
      </div>
      <div className="section-label" style={{ color: "var(--danger-fg)" }}>Anlieferort</div>
      <div className="grid4" style={{ marginBottom: "var(--gap)" }}>
        <Field label="Stadt" req><input className="input" value={f.toCity} onChange={e => set("toCity", e.target.value)} /></Field>
        <Field label="Straße" req span><input className="input" value={f.toStreet} onChange={e => set("toStreet", e.target.value)} /></Field>
        <Field label="PLZ" req><input className="input" value={f.toPlz} onChange={e => set("toPlz", e.target.value)} /></Field>
      </div>

      <div className="section-label">Termine &amp; Extras</div>
      <div className="grid4">
        <Field label="Abholdatum"><input className="input" type="date" value={f.pickupDate} onChange={e => set("pickupDate", e.target.value)} /></Field>
        <Field label="Anlieferdatum"><input className="input" type="date" value={f.deliveryDate} onChange={e => set("deliveryDate", e.target.value)} /></Field>
        <Field label="Kilometer"><input className="input" type="number" value={f.km} onChange={e => set("km", e.target.value)} placeholder="0" /></Field>
        <div className="field"><label>Optionen</label><div className="flex items-center" style={{ height: "var(--control-h)", gap: 14 }}><Check on={f.refuel} onChange={v => set("refuel", v)} label="Volltanken" /></div></div>
      </div>
    </Modal>
  );
}

/* ---------- Detail drawer ---------- */
function OrderDetail({ order, onClose, onAssign, onCancel }) {
  const o = order;
  return (
    <Modal title={"Auftrag #" + o.orderNo} sub={o.mvNr + " · " + o.auftraggeber} onClose={onClose}
      footer={<React.Fragment>
        <button className="btn btn-danger" onClick={onCancel}><Icon name="close" size={15} />Stornieren</button>
        <div style={{ flex: 1 }} />
        <button className="btn" onClick={() => { }}><Icon name="documents" size={15} />Protokoll</button>
        {!o.driver && <button className="btn btn-primary" onClick={onAssign}><Icon name="drivers" size={15} />Fahrer zuweisen</button>}
      </React.Fragment>}>
      <div className="flex items-center gap-sm" style={{ marginBottom: 16 }}>
        <Plate value={o.plate} /><span className="t-strong">{o.model}</span><div style={{ flex: 1 }} /><StatusBadge status={o.status} size="lg" />
      </div>
      <div className="grid2" style={{ marginBottom: 16 }}>
        <div className="card" style={{ padding: 14, boxShadow: "none" }}>
          <div className="section-label" style={{ color: "var(--info-fg)", marginTop: 0 }}>Abholort</div>
          <div className="t-strong" style={{ marginTop: 6 }}>{o.from.street}</div>
          <div className="t-mut">{o.from.plz} {o.from.city}</div>
          <div className="flex items-center gap-sm" style={{ marginTop: 10, fontSize: 12.5 }}><Icon name="calendar" size={14} className="t-mut" /><span className={o.pickupDate ? "t-strong" : "t-mut"}>{o.pickupDate ? fmtDate(o.pickupDate) : "undefiniert"}</span>{o.pickupWindow && <span className="badge">{o.pickupWindow}</span>}</div>
        </div>
        <div className="card" style={{ padding: 14, boxShadow: "none" }}>
          <div className="section-label" style={{ color: "var(--danger-fg)", marginTop: 0 }}>Anlieferort</div>
          <div className="t-strong" style={{ marginTop: 6 }}>{o.to.street}</div>
          <div className="t-mut">{o.to.plz} {o.to.city}</div>
          <div className="flex items-center gap-sm" style={{ marginTop: 10, fontSize: 12.5 }}><Icon name="calendar" size={14} className="t-mut" /><span className={o.deliveryDate ? "t-strong" : "t-mut"}>{o.deliveryDate ? fmtDate(o.deliveryDate) : "undefiniert"}</span></div>
        </div>
      </div>
      <div className="grid4" style={{ marginBottom: 16 }}>
        {[["FIN", o.vin, true], ["Bundesland", o.bundesland], ["Kilometer", o.km + " km", true], ["Preis", o.price + " €", true]].map(([l, v, m]) => (
          <div key={l}><div style={{ fontSize: 11, color: "var(--fg-3)", fontWeight: 600 }}>{l}</div><div className={"" + (m ? "t-mono " : "") + "t-strong"} style={{ fontSize: 12.5, marginTop: 3, wordBreak: "break-all" }}>{v}</div></div>
        ))}
      </div>
      <div className="section-label">Zugewiesener Fahrer</div>
      {o.driver ? (
        <div className="flex items-center gap-sm" style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: "var(--r)", marginTop: 8 }}>
          <Avatar name={o.driver.name} size={36} />
          <div style={{ flex: 1 }}><div className="t-strong">{o.driver.name}</div><div className="t-mut" style={{ fontSize: 12 }}>{o.driver.phone} · {o.driver.city}</div></div>
          <TypeBadge type={o.jobType || o.driver.type} />
        </div>
      ) : <div className="muted-box" style={{ padding: 16, marginTop: 8, fontSize: 13 }}>Noch kein Fahrer zugewiesen</div>}
    </Modal>
  );
}

/* ---------- Assign driver picker ---------- */
function AssignDriver({ D, onClose, onPick }) {
  const [q, setQ] = useState("");
  const list = D.drivers.filter(d => d.active && (!q || d.name.toLowerCase().includes(q.toLowerCase()) || d.city.toLowerCase().includes(q.toLowerCase())));
  const order = ["available", "onjob", "offduty"];
  list.sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status));
  return (
    <Modal title="Fahrer zuweisen" sub="Verfügbare Fahrer zuerst" onClose={onClose}>
      <div className="search" style={{ marginBottom: 14 }}><Icon name="search" size={16} /><input className="input" placeholder="Fahrer oder Ort suchen …" value={q} onChange={e => setQ(e.target.value)} autoFocus /></div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "48vh", overflowY: "auto" }}>
        {list.map(d => {
          const stt = { available: ["ok", "verfügbar"], onjob: ["purple", "unterwegs"], offduty: ["", "frei (offline)"] }[d.status];
          return (
            <button key={d.id} onClick={() => onPick(d)} disabled={d.status === "offduty"} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 11px", border: "1px solid var(--border)", borderRadius: "var(--r)", background: "var(--surface)", cursor: d.status === "offduty" ? "not-allowed" : "pointer", textAlign: "left", font: "inherit", opacity: d.status === "offduty" ? .55 : 1 }}>
              <Avatar name={d.name} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}><div className="t-strong" style={{ fontSize: 13.5 }}>{d.name}</div><div className="t-mut" style={{ fontSize: 12 }}>{d.city} · {d.plz} · ⭐ {d.rating}</div></div>
              <TypeBadge type={d.type} />
              <span className={"badge " + stt[0]}><span className="dot" />{stt[1]}</span>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
