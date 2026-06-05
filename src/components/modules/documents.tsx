"use client";

/* MW Transport Service — ported from app/documents2.jsx. Behaviour preserved 1:1. */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Icon } from "@/components/icon";
import {
  Avatar, Plate, StatusBadge, TypeBadge, Modal, useToast, Sparkline, MiniBars,
  Donut, Field, Switch, Check, Menu, PageHead, Empty, fmtDate, fmtEur,
} from "@/components/ui";
import { MWDATA } from "@/lib/data";

export function DocumentsModule() {
  const D = MWDATA;
  const toast = useToast();
  const blobs = useRef({});           // id -> Blob (für echten Download hochgeladener Dateien)
  const fileInput = useRef(null);
  const CATS = ["CMR-Frachtbrief", "Schadensprotokoll", "Übergabeprotokoll", "Arbeitsnachweis", "Rechnung", "Tankbeleg", "Fahrer-Dokument", "Sonstiges"];

  const seed = D.documents.map(d => ({ ...d, uploaded: false }));
  const [docs, setDocs] = useState(seed);
  const [q, setQ] = useState("");
  const [fType, setFType] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [sort, setSort] = useState({ k: "date", dir: "desc" });
  const [sel, setSel] = useState(new Set());
  const [page, setPage] = useState(0);
  const [drag, setDrag] = useState(false);
  const [pendingCat, setPendingCat] = useState("CMR-Frachtbrief");
  const PER = 8;

  const fmtSize = (b) => b < 1024 ? b + " B" : b < 1048576 ? (b / 1024).toFixed(0) + " KB" : (b / 1048576).toFixed(1) + " MB";
  const guessType = (name) => {
    const n = name.toLowerCase();
    if (n.includes("cmr") || n.includes("fracht")) return "CMR-Frachtbrief";
    if (n.includes("schad")) return "Schadensprotokoll";
    if (n.includes("überg") || n.includes("ueberg")) return "Übergabeprotokoll";
    if (n.includes("nachweis") || n.includes("arbeit")) return "Arbeitsnachweis";
    if (n.includes("rechn") || n.includes("invoice")) return "Rechnung";
    if (n.includes("tank")) return "Tankbeleg";
    return pendingCat;
  };

  const addFiles = useCallback((fileList) => {
    const arr = Array.from(fileList);
    if (!arr.length) return;
    const today = new Date().toISOString().slice(0, 10);
    const added = arr.map((f, i) => {
      const id = "D-" + (3000 + Math.floor(Math.random() * 9000));
      blobs.current[id] = f;
      return { id, name: f.name, type: guessType(f.name), order: "—", driver: "—", size: fmtSize(f.size), date: today, status: "offen", uploaded: true };
    });
    setDocs(d => [...added, ...d]);
    setPage(0);
    toast(arr.length === 1 ? "1 Datei hochgeladen" : arr.length + " Dateien hochgeladen", "upload");
  }, [pendingCat]);

  const download = (doc) => {
    let blob = blobs.current[doc.id];
    if (!blob) {
      // generierter Platzhalter-Inhalt für Seed-Dokumente
      const content = `MW Transport Service — ${doc.type}\nDatei: ${doc.name}\nAuftrag: ${doc.order}\nFahrer: ${doc.driver}\nDatum: ${doc.date}\n\n(Demo-Export — in Produktion: Supabase Storage Signed-URL)`;
      blob = new Blob([content], { type: "text/plain" });
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = doc.name; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast("Download gestartet", "download");
  };

  const exportList = (fmt) => {
    const rows = [["ID", "Dateiname", "Typ", "Auftrag", "Fahrer", "Datum", "Größe", "Status"], ...filtered.map(d => [d.id, d.name, d.type, d.order, d.driver, d.date, d.size, d.status])];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "dokumente_export." + (fmt === "excel" ? "csv" : fmt); a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1500);
    toast(fmt.toUpperCase() + "-Export erstellt (" + filtered.length + " Zeilen)", fmt === "excel" ? "excel" : fmt === "pdf" ? "pdf" : "download");
  };

  const del = (id) => { setDocs(d => d.filter(x => x.id !== id)); delete blobs.current[id]; toast("Dokument gelöscht", "trash"); };

  const types = ["all", ...CATS];
  const statuses = ["all", "fertig", "offen", "unbestätigt"];
  const filtered = useMemo(() => {
    let r = docs.filter(d => (fType === "all" || d.type === fType) && (fStatus === "all" || d.status === fStatus) &&
      (!q || d.name.toLowerCase().includes(q.toLowerCase()) || d.driver.toLowerCase().includes(q.toLowerCase()) || String(d.order).includes(q) || d.type.toLowerCase().includes(q.toLowerCase())));
    r = [...r].sort((a, b) => { const av = a[sort.k], bv = b[sort.k]; const c = av < bv ? -1 : av > bv ? 1 : 0; return sort.dir === "asc" ? c : -c; });
    return r;
  }, [docs, q, fType, fStatus, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PER));
  const pageRows = filtered.slice(page * PER, page * PER + PER);
  useEffect(() => { if (page >= pages) setPage(0); }, [pages]);

  const toggleSort = (k) => setSort(s => ({ k, dir: s.k === k && s.dir === "asc" ? "desc" : "asc" }));
  const SortTh = ({ k, children, style }) => <th className="sortable" style={style} onClick={() => toggleSort(k)}><span className="flex items-center" style={{ gap: 4 }}>{children}{sort.k === k && <Icon name={sort.dir === "asc" ? "arrowUp" : "arrowDown"} size={12} />}</span></th>;
  const allSel = pageRows.length > 0 && pageRows.every(d => sel.has(d.id));
  const sCls = { fertig: "ok", offen: "warn", unbestätigt: "danger" };
  const ic = (n) => /\.(jpg|jpeg|png|heic)$/i.test(n) ? "camera" : /\.(xls|xlsx|csv)$/i.test(n) ? "excel" : "pdf";

  const byCat = CATS.map(c => ({ c, n: docs.filter(d => d.type === c).length })).filter(x => x.n).sort((a, b) => b.n - a.n).slice(0, 4);

  return (
    <div className="view-narrow">
      <PageHead title="Dokumente" sub={docs.length + " Dateien · " + docs.filter(d => d.status !== "fertig").length + " offen"}>
        <Menu align="right" trigger={<button className="btn"><Icon name="download" size={15} />Export <Icon name="chevDown" size={13} /></button>}
          items={[{ icon: "excel", label: "Liste als Excel/CSV", onClick: () => exportList("excel") }, { icon: "pdf", label: "Bericht als PDF", onClick: () => exportList("pdf") }, { icon: "documents", label: "Liste als CSV", onClick: () => exportList("csv") }]} />
        <button className="btn btn-primary" onClick={() => fileInput.current.click()}><Icon name="upload" size={15} />Hochladen</button>
        <input ref={fileInput} type="file" multiple style={{ display: "none" }} onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
      </PageHead>

      {/* Bento: dropzone + category bento */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1fr", gap: "var(--gap)", marginBottom: "var(--gap)" }}>
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={e => { e.preventDefault(); setDrag(false); }}
          onDrop={e => { e.preventDefault(); setDrag(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileInput.current.click()}
          className="card"
          style={{ border: drag ? "2px dashed var(--color-primary)" : "2px dashed var(--border-strong)", background: drag ? "var(--color-primary-soft)" : "var(--surface-2)", cursor: "pointer", display: "grid", placeItems: "center", padding: 26, transition: "all .12s", boxShadow: "none" }}>
          <div style={{ textAlign: "center" }}>
            <div className="avatar" style={{ width: 52, height: 52, flexBasis: 52, borderRadius: 14, margin: "0 auto 12px", background: drag ? "var(--color-primary)" : "var(--color-primary-soft)", color: drag ? "#fff" : "var(--color-primary-strong)" }}><Icon name="inbox" size={26} /></div>
            <div className="t-strong" style={{ fontSize: 15 }}>{drag ? "Dateien hier ablegen" : "Dateien hierher ziehen"}</div>
            <div className="t-mut" style={{ fontSize: 12.5, marginTop: 3 }}>oder klicken zum Auswählen · PDF, JPG, PNG, XLSX · max. 25 MB</div>
            <div className="flex items-center gap-sm" style={{ justifyContent: "center", marginTop: 14 }} onClick={e => e.stopPropagation()}>
              <span className="t-mut" style={{ fontSize: 12 }}>Kategorie:</span>
              <select className="select" style={{ width: "auto", height: 32 }} value={pendingCat} onChange={e => setPendingCat(e.target.value)}>{CATS.map(c => <option key={c}>{c}</option>)}</select>
            </div>
          </div>
        </div>
        <div className="card card-pad">
          <div className="section-label" style={{ marginTop: 0 }}>Nach Kategorie</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
            {byCat.map(({ c, n }) => (
              <button key={c} onClick={() => { setFType(c); setPage(0); }} style={{ display: "flex", alignItems: "center", gap: 10, border: 0, background: "none", cursor: "pointer", font: "inherit", padding: 0, textAlign: "left" }}>
                <div className="avatar" style={{ width: 30, height: 30, flexBasis: 30, borderRadius: 8, background: "var(--surface-3)", color: "var(--fg-2)" }}><Icon name="documents" size={15} /></div>
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: "var(--fg)" }}>{c}</span>
                <span className="badge">{n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: "var(--gap)", padding: "12px var(--pad)" }}>
        <div className="flex items-center gap-sm wrap">
          <div className="search" style={{ flex: "1 1 240px" }}><Icon name="search" size={16} /><input className="input" placeholder="Dateiname, Typ, Fahrer oder Auftrag …" value={q} onChange={e => { setQ(e.target.value); setPage(0); }} /></div>
          <select className="select" style={{ width: "auto" }} value={fType} onChange={e => { setFType(e.target.value); setPage(0); }}>{types.map(t => <option key={t} value={t}>{t === "all" ? "Alle Typen" : t}</option>)}</select>
          <select className="select" style={{ width: "auto" }} value={fStatus} onChange={e => { setFStatus(e.target.value); setPage(0); }}>{statuses.map(s => <option key={s} value={s}>{s === "all" ? "Alle Status" : s}</option>)}</select>
          {(fType !== "all" || fStatus !== "all" || q) && <button className="btn btn-ghost btn-sm" onClick={() => { setFType("all"); setFStatus("all"); setQ(""); }}><Icon name="close" size={14} />Zurücksetzen</button>}
        </div>
      </div>

      {sel.size > 0 && (
        <div className="card" style={{ marginBottom: "var(--gap)", padding: "10px var(--pad)", display: "flex", alignItems: "center", gap: 12, borderColor: "var(--color-primary)", background: "var(--color-primary-soft)" }}>
          <span className="t-strong">{sel.size} ausgewählt</span><div style={{ flex: 1 }} />
          <button className="btn btn-sm" onClick={() => { docs.filter(d => sel.has(d.id)).forEach(download); }}><Icon name="download" size={14} />Herunterladen</button>
          <button className="btn btn-sm btn-danger" onClick={() => { setDocs(d => d.filter(x => !sel.has(x.id))); setSel(new Set()); toast("Gelöscht", "trash"); }}><Icon name="trash" size={14} />Löschen</button>
          <button className="btn btn-sm btn-ghost" onClick={() => setSel(new Set())}>Abwählen</button>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr>
              <th style={{ width: 38 }}><span className={"checkbox" + (allSel ? " on" : "")} onClick={() => setSel(allSel ? new Set([...sel].filter(id => !pageRows.some(d => d.id === id))) : new Set([...sel, ...pageRows.map(d => d.id)]))} style={{ cursor: "pointer" }}>{allSel && <Icon name="check" size={12} sw={3} />}</span></th>
              <SortTh k="name">Dateiname</SortTh>
              <SortTh k="type">Kategorie</SortTh>
              <SortTh k="order" style={{ width: 90 }}>Auftrag</SortTh>
              <SortTh k="driver">Fahrer</SortTh>
              <SortTh k="date" style={{ width: 120 }}>Upload-Datum</SortTh>
              <th style={{ width: 80 }}>Größe</th>
              <SortTh k="status">Status</SortTh>
              <th style={{ width: 110 }}>Aktionen</th>
            </tr></thead>
            <tbody>
              {pageRows.map(d => (
                <tr key={d.id} className={sel.has(d.id) ? "sel" : ""}>
                  <td><span className={"checkbox" + (sel.has(d.id) ? " on" : "")} onClick={() => setSel(s => { const n = new Set(s); n.has(d.id) ? n.delete(d.id) : n.add(d.id); return n; })} style={{ cursor: "pointer" }}>{sel.has(d.id) && <Icon name="check" size={12} sw={3} />}</span></td>
                  <td><div className="flex items-center gap-sm"><div className="avatar" style={{ width: 30, height: 30, flexBasis: 30, borderRadius: 7, background: "var(--danger-bg)", color: "var(--danger-fg)" }}><Icon name={ic(d.name)} size={15} /></div><div style={{ minWidth: 0 }}><div className="t-strong" style={{ fontSize: 12.5, maxWidth: 230, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>{d.uploaded && <div className="t-mut" style={{ fontSize: 10.5 }}><Icon name="check" size={10} sw={3} style={{ color: "var(--ok-fg)" }} /> gerade hochgeladen</div>}</div></div></td>
                  <td><span className="badge outline">{d.type}</span></td>
                  <td className="t-mono" style={{ fontSize: 12 }}>{d.order}</td>
                  <td style={{ fontSize: 12.5 }}>{d.driver}</td>
                  <td className="t-mut t-mono" style={{ fontSize: 12 }}>{fmtDate(d.date)}</td>
                  <td className="t-mut t-mono" style={{ fontSize: 12 }}>{d.size}</td>
                  <td><span className={"badge " + (sCls[d.status] || "")}><span className="dot" />{d.status}</span></td>
                  <td><div className="flex" style={{ justifyContent: "flex-end", gap: 4 }}>
                    <button className="icon-btn sq" style={{ height: 30, minWidth: 30 }} title="Vorschau" onClick={() => toast("Vorschau (Demo)", "eye")}><Icon name="eye" size={15} /></button>
                    <button className="icon-btn sq" style={{ height: 30, minWidth: 30 }} title="Download" onClick={() => download(d)}><Icon name="download" size={15} /></button>
                    <button className="icon-btn sq btn-danger" style={{ height: 30, minWidth: 30 }} title="Löschen" onClick={() => del(d.id)}><Icon name="trash" size={15} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <Empty title="Keine Dokumente" sub="Lade Dateien per Drag-&-Drop hoch." icon="documents" />}
        </div>
        <div className="tbl-foot">
          <span>{filtered.length} Dokument(e)</span><div style={{ flex: 1 }} />
          <span>Seite {page + 1} / {pages}</span>
          <button className="icon-btn sq" style={{ height: 30, minWidth: 30 }} disabled={page === 0} onClick={() => setPage(p => p - 1)}><Icon name="chevLeft" size={15} /></button>
          <button className="icon-btn sq" style={{ height: 30, minWidth: 30 }} disabled={page >= pages - 1} onClick={() => setPage(p => p + 1)}><Icon name="chevRight" size={15} /></button>
        </div>
      </div>
    </div>
  );
}
