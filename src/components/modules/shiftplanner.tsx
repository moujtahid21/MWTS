"use client";

/* MW Transport Service — Schichtplanung. Ported from app/shifts.jsx + app/shifts2.jsx. */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Icon } from "@/components/icon";
import {
  Avatar, Plate, StatusBadge, TypeBadge, Modal, useToast, Sparkline, MiniBars,
  Donut, Field, Switch, Check, Menu, PageHead, Empty, fmtDate, fmtEur,
} from "@/components/ui";
import { MWDATA } from "@/lib/data";
import { useAppNav } from "@/lib/use-app-nav";

const SHIFT_NOW = () => new Date(MWDATA.shiftMeta.NOW);
function isoToDate(iso) { return new Date(iso + "T00:00:00Z"); }
function dowShort(iso) { return ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"][isoToDate(iso).getUTCDay()]; }
function dayNum(iso) { return iso.slice(8, 10); }
function isoWeek(d) { const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); const day = (t.getUTCDay() + 6) % 7; t.setUTCDate(t.getUTCDate() - day + 3); const first = new Date(Date.UTC(t.getUTCFullYear(), 0, 4)); return 1 + Math.round(((t.getTime() - first.getTime()) / 86400000 - 3 + ((first.getUTCDay() + 6) % 7)) / 7); }
/* lock if within 48h ahead and not fully past */
function lockState(iso) {
  const now = SHIFT_NOW().getTime();
  const start = Date.parse(iso + "T00:00:00Z");
  const end = start + 24 * 3600 * 1000;
  const past = end <= now;
  const locked = !past && start < now + 48 * 3600 * 1000;
  return { past, locked, future: start >= now + 48 * 3600 * 1000 };
}

export function ShiftPlanning() {
  const onNav = useAppNav();
  const D = MWDATA;
  const [tab, setTab] = useState("dienstplan");
  const tabs = [["dienstplan", "Dienstplan", "calRange"], ["urlaub", "Urlaubsplaner", "plane"], ["personal", "Personalverwaltung", "briefcase"], ["statistik", "Statistiken", "chart"]];

  // KPI bento
  const staff = D.staff;
  const week = D.shiftMeta.days.slice(0, 7);
  let plannedH = 0, actualH = 0, openShifts = 0, lockedCells = 0;
  staff.forEach(s => week.forEach(date => {
    const e = D.shifts[s.id][date];
    if (e?.state === "shift") { plannedH += e.soll; if (e.ist != null) actualH += e.ist; }
    if (lockState(date).locked && e?.state === "shift") lockedCells++;
  }));
  const onVac = D.vacations.filter(v => v.status === "genehmigt" && v.from <= week[6] && v.to >= week[0]).length;
  const pendingVac = D.vacations.filter(v => v.status === "beantragt").length;

  return (
    <div>
      <PageHead title="Schichtplanung" sub={"KW " + isoWeek(isoToDate(week[0])) + " · " + fmtDate(week[0]) + " – " + fmtDate(week[6]) + " · eigenständiges Modul"}>
        <span className="badge outline"><Icon name="lock" size={12} />48h-Sperre aktiv</span>
      </PageHead>

      {/* Bento KPIs */}
      <div className="grid4" style={{ marginBottom: "var(--gap)" }}>
        <div className="stat"><div className="stat-ic"><Icon name="hourglass" size={17} /></div><div className="lbl">Geplante Std. (Woche)</div><div className="val">{Math.round(plannedH)}<span style={{ fontSize: 15, color: "var(--fg-3)" }}> h</span></div><div className="delta flat">{staff.length} Mitarbeiter</div></div>
        <div className="stat"><div className="stat-ic" style={{ color: "var(--info-fg)", background: "var(--info-bg)" }}><Icon name="zap" size={17} /></div><div className="lbl">Ist-Std. (Stempeluhr)</div><div className="val">{Math.round(actualH)}<span style={{ fontSize: 15, color: "var(--fg-3)" }}> h</span></div><div className={"delta " + (actualH >= plannedH ? "up" : "down")}><Icon name={actualH >= plannedH ? "arrowUp" : "arrowDown"} size={12} />{(actualH - plannedH >= 0 ? "+" : "") + Math.round(actualH - plannedH)} h Plus-Minus</div></div>
        <div className="stat"><div className="stat-ic" style={{ color: "var(--warn-fg)", background: "var(--warn-bg)" }}><Icon name="plane" size={17} /></div><div className="lbl">Abwesend (Woche)</div><div className="val">{onVac}</div><div className="delta flat">{pendingVac} Anträge offen</div></div>
        <div className="stat"><div className="stat-ic" style={{ color: "var(--fg-3)", background: "var(--surface-3)" }}><Icon name="lock" size={17} /></div><div className="lbl">Gesperrt (&lt;48h)</div><div className="val">{lockedCells}</div><div className="delta flat">nicht änderbar</div></div>
      </div>

      {/* Tabs */}
      <div className="card" style={{ marginBottom: "var(--gap)", padding: 6, display: "flex", gap: 4, overflowX: "auto" }}>
        {tabs.map(([k, l, ic]) => (
          <button key={k} className="nav-item" onClick={() => setTab(k)} style={{ width: "auto", flex: "0 0 auto", color: tab === k ? "var(--fg)" : "var(--fg-2)", background: tab === k ? "var(--color-primary-soft)" : "transparent", fontWeight: tab === k ? 700 : 600 }}>
            <Icon name={ic} size={17} style={{ color: tab === k ? "var(--color-primary-strong)" : "inherit" }} />{l}
          </button>
        ))}
      </div>

      {tab === "dienstplan" && <Dienstplan onNav={onNav} />}
      {tab === "urlaub" && <Urlaubsplaner />}
      {tab === "personal" && <Personalverwaltung onNav={onNav} />}
      {tab === "statistik" && <ShiftStatistik />}
    </div>
  );
}

/* ============ DIENSTPLAN ============ */
function ShiftChip({ e, compact }) {
  const tpl = MWDATA.SHIFT_TPL[e.code];
  return (
    <div style={{ borderRadius: 7, padding: compact ? "3px 6px" : "6px 8px", background: "color-mix(in srgb, " + tpl.color + " 14%, transparent)", borderLeft: "3px solid " + tpl.color, width: "100%", textAlign: "left", overflow: "hidden" }}>
      <div className="flex items-center between" style={{ gap: 4 }}>
        <span className="t-strong" style={{ fontSize: 11.5, whiteSpace: "nowrap" }}>{tpl.name}</span>
        {e.locked && <Icon name="lock" size={11} style={{ color: "var(--fg-faint)", flex: "0 0 auto" }} />}
      </div>
      <div className="t-mono" style={{ fontSize: 10.5, color: "var(--fg-2)", whiteSpace: "nowrap" }}>{e.start}–{e.end}<span className="t-mut"> ({e.soll}h)</span></div>
      {e.past && e.ist != null && (
        <div className="t-mono" style={{ fontSize: 9.5, marginTop: 2, color: "var(--info-fg)", whiteSpace: "nowrap" }} title="Ist-Zeit aus Fahrer-App (Phase 3)"><Icon name="zap" size={9} /> {e.actualIn}–{e.actualOut}</div>
      )}
    </div>
  );
}

function Dienstplan({ onNav }) {
  const D = MWDATA;
  const toast = useToast();
  const [shifts, setShifts] = useState(() => JSON.parse(JSON.stringify(D.shifts)));
  const [mode, setMode] = useState("woche");
  const [team, setTeam] = useState("all");
  const [weekOff, setWeekOff] = useState(0);
  const [modal, setModal] = useState(null);   // {staffId, date, entry?}

  const allDays = D.shiftMeta.days;
  const week = allDays.slice(weekOff * 7, weekOff * 7 + 7);
  const staff = D.staff.filter(s => team === "all" || s.team === team);
  const teams = ["all", ...new Set(D.staff.map(s => s.team))];

  const saveShift = (staffId, date, data) => {
    setShifts(sh => {
      const next = { ...sh, [staffId]: { ...sh[staffId] } };
      if (data === null) { next[staffId][date] = { state: "frei", date, ...lockState(date) }; }
      else {
        const soll = (() => { const [ah, am] = data.start.split(":").map(Number); const [bh, bm] = data.end.split(":").map(Number); let m = (bh * 60 + bm) - (ah * 60 + am); if (m < 0) m += 1440; return +((m - data.brk) / 60).toFixed(2); })();
        next[staffId][date] = { state: "shift", code: data.code, start: data.start, end: data.end, brk: data.brk, soll, actualIn: null, actualOut: null, ist: null, clockStatus: "ausstehend", date, ...lockState(date) };
      }
      return next;
    });
    setModal(null);
    toast(data === null ? "Schicht entfernt" : "Schicht gespeichert" + (data.notify ? " · Mitarbeiter benachrichtigt" : ""), data?.notify ? "send" : "check");
  };

  const cellClick = (s, date) => {
    const e = shifts[s.id][date]; const ls = lockState(date);
    if (ls.locked) { toast("Gesperrt: liegt innerhalb von 48 Stunden", "lock"); return; }
    if (ls.past) { setModal({ staffId: s.id, date, entry: e, readOnly: true }); return; }
    setModal({ staffId: s.id, date, entry: e?.state === "shift" ? e : null });
  };

  return (
    <React.Fragment>
      {/* Controls */}
      <div className="flex items-center gap-sm wrap" style={{ marginBottom: "var(--gap)" }}>
        <div className="seg"><button className={mode === "woche" ? "on" : ""} onClick={() => setMode("woche")}>Woche</button><button className={mode === "monat" ? "on" : ""} onClick={() => setMode("monat")}>Monat</button></div>
        {mode === "woche" && <React.Fragment>
          <button className="icon-btn sq" disabled={weekOff === 0} onClick={() => setWeekOff(w => w - 1)}><Icon name="chevLeft" size={16} /></button>
          <span className="t-strong" style={{ fontSize: 13.5, minWidth: 168, textAlign: "center" }}>KW {isoWeek(isoToDate(week[0]))} · {fmtDate(week[0]).slice(0, 6)} – {fmtDate(week[6])}</span>
          <button className="icon-btn sq" disabled={weekOff >= 1} onClick={() => setWeekOff(w => w + 1)}><Icon name="chevRight" size={16} /></button>
        </React.Fragment>}
        <select className="select" style={{ width: "auto" }} value={team} onChange={e => setTeam(e.target.value)}>{teams.map(t => <option key={t} value={t}>{t === "all" ? "Alle Teams" : t}</option>)}</select>
        <div style={{ flex: 1 }} />
        <div className="flex items-center gap-sm wrap" style={{ fontSize: 11.5 }}>
          {Object.values(D.SHIFT_TPL).map(t => <span key={t.code} className="flex items-center" style={{ gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: t.color }} />{t.name}</span>)}
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ staffId: staff[0].id, date: week.find(d => lockState(d).future) || week[6] })}><Icon name="plus" size={16} />Arbeitsstunden</button>
      </div>

      {mode === "woche" ? (
        <div className="card" style={{ overflow: "hidden" }}>
          <div style={{ overflowX: "auto" }}>
            <table className="tbl" style={{ minWidth: 920 }}>
              <thead><tr>
                <th style={{ minWidth: 210, position: "sticky", left: 0, zIndex: 3, background: "var(--surface-2)" }}>Mitarbeiter</th>
                {week.map(date => { const ls = lockState(date); return (
                  <th key={date} style={{ textAlign: "center", minWidth: 116, background: ls.locked ? "var(--surface-3)" : "var(--surface-2)" }}>
                    <div className="flex items-center" style={{ justifyContent: "center", gap: 4 }}>{dowShort(date)}, {dayNum(date)}.06 {ls.locked && <Icon name="lock" size={11} style={{ color: "var(--warn-fg)" }} />}</div>
                    <div className="t-mut" style={{ fontWeight: 400, fontSize: 10 }}>{ls.past ? "abgeschlossen" : ls.locked ? "< 48h gesperrt" : "planbar"}</div>
                  </th>
                ); })}
                <th style={{ textAlign: "center", minWidth: 80 }}>Σ Soll</th>
              </tr></thead>
              <tbody>
                {staff.map(s => {
                  let sum = 0;
                  return (
                    <tr key={s.id}>
                      <td style={{ position: "sticky", left: 0, zIndex: 1, background: "var(--surface)" }}><div className="flex items-center gap-sm" style={{ cursor: s.driverId ? "pointer" : "default" }} onClick={() => s.driverId && onNav("drivers", { focus: s.driverId })}><Avatar name={s.name} size={30} /><div style={{ minWidth: 0 }}><div className="t-strong" style={{ fontSize: 12.5, whiteSpace: "nowrap" }}>{s.name}</div><div className="t-mut" style={{ fontSize: 11 }}>{s.role} · {s.contractH}h</div></div></div></td>
                      {week.map(date => {
                        const e = shifts[s.id][date]; const ls = lockState(date);
                        if (e?.state === "shift") sum += e.soll;
                        return (
                          <td key={date} style={{ padding: 5, verticalAlign: "top", background: ls.locked ? "color-mix(in srgb, var(--warn) 5%, transparent)" : "transparent" }}>
                            <div onClick={() => cellClick(s, date)} style={{ cursor: ls.locked ? "not-allowed" : "pointer", minHeight: 48, borderRadius: 8, opacity: ls.locked ? .62 : 1, display: "flex", alignItems: "stretch" }}>
                              {e?.state === "shift" ? <ShiftChip e={{ ...e, locked: ls.locked, past: ls.past }} />
                                : e?.state === "urlaub" ? <div style={{ width: "100%", borderRadius: 7, padding: "6px 8px", background: "var(--info-bg)", color: "var(--info-fg)", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}><Icon name="plane" size={12} />Urlaub</div>
                                : e?.state === "krank" ? <div style={{ width: "100%", borderRadius: 7, padding: "6px 8px", background: "var(--danger-bg)", color: "var(--danger-fg)", fontSize: 11, fontWeight: 600 }}>Krank</div>
                                : <div style={{ width: "100%", borderRadius: 7, border: "1px dashed var(--border)", display: "grid", placeItems: "center", color: "var(--fg-faint)" }}>{ls.locked ? <Icon name="lock" size={13} /> : <Icon name="plus" size={14} />}</div>}
                            </div>
                          </td>
                        );
                      })}
                      <td style={{ textAlign: "center" }}><span className="t-mono t-strong">{sum.toFixed(1)}</span><div className="t-mut" style={{ fontSize: 10 }}>/ {s.contractH}h</div></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : <MonthGrid shifts={shifts} staff={staff} />}

      {modal && <AddShiftModal D={D} init={modal} onClose={() => setModal(null)} onSave={saveShift} />}
    </React.Fragment>
  );
}

/* ---- Month grid ---- */
function MonthGrid({ shifts, staff }) {
  const D = MWDATA;
  // June 2026
  const first = new Date(Date.UTC(2026, 5, 1));
  const startPad = (first.getUTCDay() + 6) % 7; // Mon=0
  const cells = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= 30; d++) cells.push("2026-06-" + String(d).padStart(2, "0"));
  while (cells.length % 7) cells.push(null);
  return (
    <div className="card card-pad">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 8 }}>
        {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map(d => <div key={d} style={{ textAlign: "center", fontSize: 11, fontWeight: 700, color: "var(--fg-3)", letterSpacing: ".05em" }}>{d}</div>)}
        {cells.map((iso, i) => {
          if (!iso) return <div key={i} />;
          const ls = lockState(iso);
          let cnt = 0, vac = 0;
          staff.forEach(s => { const e = shifts[s.id]?.[iso]; if (e?.state === "shift") cnt++; if (e?.state === "urlaub" || e?.state === "krank") vac++; });
          const cov = Math.min(1, cnt / Math.max(1, staff.length));
          return (
            <div key={i} style={{ borderRadius: 10, border: "1px solid var(--border)", background: ls.locked ? "color-mix(in srgb, var(--warn) 6%, var(--surface))" : "var(--surface)", padding: 9, minHeight: 92, position: "relative", opacity: ls.past ? .7 : 1 }}>
              <div className="flex items-center between"><span className="t-mono t-strong" style={{ fontSize: 13 }}>{dayNum(iso)}</span>{ls.locked && <Icon name="lock" size={12} style={{ color: "var(--warn-fg)" }} />}{ls.past && !ls.locked && <Icon name="check" size={12} style={{ color: "var(--ok-fg)" }} />}</div>
              <div style={{ marginTop: 8 }}>
                <div className="flex items-center gap-sm" style={{ fontSize: 11, color: "var(--fg-2)" }}><span style={{ width: 8, height: 8, borderRadius: 99, background: "var(--color-primary)" }} />{cnt} Schichten</div>
                {vac > 0 && <div className="flex items-center gap-sm" style={{ fontSize: 11, color: "var(--info-fg)", marginTop: 3 }}><Icon name="plane" size={11} />{vac} abwesend</div>}
              </div>
              <div className="progress" style={{ position: "absolute", left: 9, right: 9, bottom: 8, height: 4 }}><div style={{ width: (cov * 100) + "%" }} /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---- Add/Edit shift modal ---- */
function AddShiftModal({ D, init, onClose, onSave }) {
  const cur = init.entry;
  const [f, setF] = useState({
    staffId: init.staffId, date: init.date, code: cur?.code || "T",
    start: cur?.start || D.SHIFT_TPL.T.start, end: cur?.end || D.SHIFT_TPL.T.end, brk: cur?.brk ?? 30, paidBrk: 0, note: "", notify: false,
  });
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const pickTpl = (code) => { const t = D.SHIFT_TPL[code]; setF(s => ({ ...s, code, start: t.start, end: t.end, brk: t.brk })); };
  const staff = D.staff.find(s => s.id === f.staffId);
  const soll = (() => { const [ah, am] = f.start.split(":").map(Number); const [bh, bm] = f.end.split(":").map(Number); let m = (bh * 60 + bm) - (ah * 60 + am); if (m < 0) m += 1440; return ((m - f.brk) / 60).toFixed(2); })();
  const ro = init.readOnly;

  return (
    <Modal size="lg" title={ro ? "Schicht-Details" : cur ? "Schicht bearbeiten" : "Arbeitsstunden hinzufügen"} sub={(staff?.name || "") + " · " + fmtDate(f.date)} onClose={onClose}
      footer={ro ? <React.Fragment><div style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Schließen</button></React.Fragment>
        : <React.Fragment>{cur && <button className="btn btn-danger" onClick={() => onSave(f.staffId, f.date, null)}><Icon name="trash" size={15} />Entfernen</button>}<div style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Abbrechen</button><button className="btn btn-primary" onClick={() => onSave(f.staffId, f.date, f)}><Icon name="check" size={16} />{cur ? "Speichern" : "Hinzufügen"}</button></React.Fragment>}>
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "var(--gap)" }}>
        <div>
          <div className="grid2" style={{ marginBottom: "var(--gap)" }}>
            <Field label="Datum"><input className="input" type="date" value={f.date} disabled={ro} onChange={e => set("date", e.target.value)} /></Field>
            <Field label="Mitarbeiter"><select className="select" value={f.staffId} disabled={ro} onChange={e => set("staffId", e.target.value)}>{D.staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></Field>
          </div>
          <Field label="Schicht"><select className="select" value={f.code} disabled={ro} onChange={e => pickTpl(e.target.value)}>{Object.values(D.SHIFT_TPL).map(t => <option key={t.code} value={t.code}>{t.name} ({t.start}–{t.end})</option>)}</select></Field>
          <div className="grid2" style={{ marginTop: "var(--gap)" }}>
            <Field label="Startzeit"><input className="input" type="time" value={f.start} disabled={ro} onChange={e => set("start", e.target.value)} /></Field>
            <Field label="Endzeit"><input className="input" type="time" value={f.end} disabled={ro} onChange={e => set("end", e.target.value)} /></Field>
          </div>
          <div className="grid2" style={{ marginTop: "var(--gap)" }}>
            <Field label="Unbezahlte Pause (Min.)"><input className="input" type="number" value={f.brk} disabled={ro} onChange={e => set("brk", +e.target.value)} /></Field>
            <Field label="Bezahlte Pause (Min.)"><input className="input" type="number" value={f.paidBrk} disabled={ro} onChange={e => set("paidBrk", +e.target.value)} /></Field>
          </div>
          {!ro && <div className="field" style={{ marginTop: "var(--gap)" }}><label>Anmerkung</label><textarea className="textarea" placeholder="Notiz schreiben…" value={f.note} onChange={e => set("note", e.target.value)} /></div>}
          {!ro && <div style={{ marginTop: 12 }}><Check on={f.notify} onChange={v => set("notify", v)} label="Mitarbeiter benachrichtigen (Push an Fahrer-App)" /></div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          <div className="card" style={{ padding: 14, boxShadow: "none" }}>
            <div className="section-label" style={{ marginTop: 0 }}>Soll (Plan)</div>
            <div className="flex between" style={{ marginTop: 8, fontSize: 12.5 }}><span className="t-mut">Zeit</span><span className="t-mono t-strong">{f.start}–{f.end}</span></div>
            <div className="flex between" style={{ marginTop: 6, fontSize: 12.5 }}><span className="t-mut">Pause</span><span className="t-mono">{f.brk} Min.</span></div>
            <div className="flex between" style={{ marginTop: 6, fontSize: 12.5 }}><span className="t-mut">Soll-Stunden</span><span className="t-mono t-strong" style={{ color: "var(--color-primary-strong)" }}>{soll} h</span></div>
          </div>
          {/* Phase 3: Stempelzeiten */}
          <div className="card" style={{ padding: 14, boxShadow: "none", borderStyle: cur?.actualIn ? "solid" : "dashed" }}>
            <div className="section-label" style={{ marginTop: 0, color: "var(--info-fg)" }}><Icon name="zap" size={12} />Ist (Fahrer-App)</div>
            {cur?.actualIn ? (
              <React.Fragment>
                <div className="flex between" style={{ marginTop: 8, fontSize: 12.5 }}><span className="t-mut">Eingestempelt</span><span className="t-mono t-strong">{cur.actualIn}</span></div>
                <div className="flex between" style={{ marginTop: 6, fontSize: 12.5 }}><span className="t-mut">Ausgestempelt</span><span className="t-mono t-strong">{cur.actualOut}</span></div>
                <div className="flex between" style={{ marginTop: 6, fontSize: 12.5 }}><span className="t-mut">Ist-Stunden</span><span className="t-mono t-strong" style={{ color: "var(--info-fg)" }}>{cur.ist} h</span></div>
                <div className="flex between" style={{ marginTop: 6, fontSize: 12.5 }}><span className="t-mut">Plus-Minus</span><span className="t-mono t-strong" style={{ color: (cur.ist - cur.soll) >= 0 ? "var(--ok-fg)" : "var(--danger-fg)" }}>{(cur.ist - cur.soll >= 0 ? "+" : "") + (cur.ist - cur.soll).toFixed(2)} h</span></div>
              </React.Fragment>
            ) : <div className="t-mut" style={{ fontSize: 12, marginTop: 8, lineHeight: 1.5 }}><span className="badge">ausstehend</span><div style={{ marginTop: 8 }}>Stempelzeiten werden in Phase 3 automatisch aus der Fahrer-App (Ein-/Ausstempeln) übernommen.</div></div>}
          </div>
        </div>
      </div>
    </Modal>
  );
}


/* ===== Urlaubsplaner · Personalverwaltung · Statistiken (app/shifts2.jsx) ===== */


/* ============ URLAUBSPLANER ============ */
function Urlaubsplaner() {
  const D = MWDATA;
  const toast = useToast();
  const [vacs, setVacs] = useState(D.vacations);
  const [filter, setFilter] = useState("all");
  const setStatus = (id, status) => { setVacs(v => v.map(x => x.id === id ? { ...x, status } : x)); toast(status === "genehmigt" ? "Antrag genehmigt" : "Antrag abgelehnt", status === "genehmigt" ? "check" : "x"); };
  const list = vacs.filter(v => filter === "all" || v.status === filter);
  const sCls = { genehmigt: "ok", beantragt: "warn", abgelehnt: "danger" };
  const tCls = { Urlaub: "info", Krank: "danger", Sonderurlaub: "purple" };

  // June timeline 1..30
  const monthDays = Array.from({ length: 30 }, (_, i) => i + 1);
  const staffWithVac = D.staff.filter(s => vacs.some(v => v.staffId === s.id && v.status !== "abgelehnt"));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr", gap: "var(--gap)", alignItems: "start" }}>
      {/* Requests */}
      <div className="card">
        <div className="card-head"><div style={{ flex: 1 }}><h3>Anträge</h3><span className="sub">{vacs.filter(v => v.status === "beantragt").length} offen</span></div>
          <select className="select" style={{ width: "auto", height: 32 }} value={filter} onChange={e => setFilter(e.target.value)}><option value="all">Alle</option><option value="beantragt">Offen</option><option value="genehmigt">Genehmigt</option><option value="abgelehnt">Abgelehnt</option></select>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {list.map(v => (
            <div key={v.id} className="flex items-center gap-sm" style={{ padding: "12px var(--pad)", borderBottom: "1px solid var(--border)" }}>
              <Avatar name={v.name} size={34} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="flex items-center gap-sm"><span className="t-strong" style={{ fontSize: 13 }}>{v.name}</span><span className={"badge " + tCls[v.type]}>{v.type}</span></div>
                <div className="t-mut" style={{ fontSize: 12, marginTop: 2 }}>{fmtDate(v.from)} – {fmtDate(v.to)} · {v.days} {v.days === 1 ? "Tag" : "Tage"}{v.note ? " · " + v.note : ""}</div>
              </div>
              {v.status === "beantragt" ? (
                <div className="flex gap-sm">
                  <button className="icon-btn sq btn-danger" style={{ height: 32, minWidth: 32 }} onClick={() => setStatus(v.id, "abgelehnt")}><Icon name="close" size={15} /></button>
                  <button className="btn btn-sm btn-primary" onClick={() => setStatus(v.id, "genehmigt")}><Icon name="check" size={14} />Genehmigen</button>
                </div>
              ) : <span className={"badge " + sCls[v.status]}><span className="dot" />{v.status}</span>}
            </div>
          ))}
          {list.length === 0 && <Empty title="Keine Anträge" icon="plane" />}
        </div>
      </div>

      {/* Timeline + balances */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
        <div className="card">
          <div className="card-head"><h3>Abwesenheits-Timeline · Juni 2026</h3></div>
          <div className="card-pad" style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 420 }}>
              <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, marginBottom: 6 }}>
                <div />
                <div style={{ display: "grid", gridTemplateColumns: "repeat(30,1fr)", fontSize: 8, color: "var(--fg-faint)", textAlign: "center" }}>{monthDays.map(d => <div key={d}>{d % 5 === 0 || d === 1 ? d : ""}</div>)}</div>
              </div>
              {staffWithVac.map(s => (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8, alignItems: "center", marginBottom: 6 }}>
                  <div className="t-strong" style={{ fontSize: 11.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{s.name.split(" ")[0]} {s.name.split(" ").slice(-1)[0][0]}.</div>
                  <div style={{ position: "relative", height: 18, background: "var(--surface-3)", borderRadius: 5 }}>
                    {vacs.filter(v => v.staffId === s.id && v.status !== "abgelehnt").map(v => {
                      const f = +v.from.slice(8, 10), t = +v.to.slice(8, 10);
                      const fromJune = v.from.slice(0, 7) === "2026-06"; if (!fromJune) return null;
                      const left = (f - 1) / 30 * 100, width = (t - f + 1) / 30 * 100;
                      const bg = v.status === "beantragt" ? "var(--warn)" : v.type === "Krank" ? "var(--danger)" : v.type === "Sonderurlaub" ? "var(--purple)" : "var(--info)";
                      return <div key={v.id} title={v.type + " " + fmtDate(v.from) + "–" + fmtDate(v.to)} style={{ position: "absolute", left: left + "%", width: width + "%", top: 2, bottom: 2, background: bg, borderRadius: 4, opacity: v.status === "beantragt" ? .55 : 1 }} />;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-head"><h3>Urlaubskonten</h3></div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {D.staff.slice(0, 6).map(s => {
              const pct = Math.round(s.vacationTaken / s.vacationTotal * 100);
              return (
                <div key={s.id}>
                  <div className="flex between" style={{ fontSize: 12, marginBottom: 4 }}><span className="t-strong">{s.name}</span><span className="t-mono t-mut">{s.vacationTaken} / {s.vacationTotal} Tage</span></div>
                  <div className="progress"><div style={{ width: pct + "%", background: pct > 80 ? "var(--warn)" : "var(--color-primary)" }} /></div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ PERSONALVERWALTUNG ============ */
function Personalverwaltung({ onNav }) {
  const D = MWDATA;
  const toast = useToast();
  const [q, setQ] = useState("");
  const [team, setTeam] = useState("all");
  const teams = ["all", ...new Set(D.staff.map(s => s.team))];
  const list = D.staff.filter(s => (team === "all" || s.team === team) && (!q || s.name.toLowerCase().includes(q.toLowerCase()) || s.role.toLowerCase().includes(q.toLowerCase())));
  const week = D.shiftMeta.days.slice(0, 7);
  const plannedFor = (id) => week.reduce((sum, d) => { const e = D.shifts[id][d]; return sum + (e?.state === "shift" ? e.soll : 0); }, 0);

  return (
    <React.Fragment>
      <div className="flex items-center gap-sm wrap" style={{ marginBottom: "var(--gap)" }}>
        <div className="search" style={{ flex: "1 1 240px", maxWidth: 340 }}><Icon name="search" size={16} /><input className="input" placeholder="Name oder Rolle …" value={q} onChange={e => setQ(e.target.value)} /></div>
        <select className="select" style={{ width: "auto" }} value={team} onChange={e => setTeam(e.target.value)}>{teams.map(t => <option key={t} value={t}>{t === "all" ? "Alle Teams" : t}</option>)}</select>
        <div style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={() => toast("Mitarbeiter-Formular (Demo)", "plus")}><Icon name="plus" size={16} />Mitarbeiter</button>
      </div>
      <div className="card"><div className="tbl-wrap"><table className="tbl">
        <thead><tr><th>Mitarbeiter</th><th>Rolle</th><th>Team</th><th>Vertrag</th><th>Geplant (Woche)</th><th>Auslastung</th><th>Urlaub</th><th>Status</th><th style={{ width: 60 }}></th></tr></thead>
        <tbody>
          {list.map(s => {
            const planned = plannedFor(s.id);
            const util = s.contractH ? Math.round(planned / s.contractH * 100) : 0;
            return (
              <tr key={s.id} style={{ cursor: s.driverId ? "pointer" : "default" }} onClick={() => s.driverId && onNav("drivers", { focus: s.driverId })}>
                <td><div className="flex items-center gap-sm"><Avatar name={s.name} size={32} /><div><div className="t-strong" style={{ fontSize: 12.5 }}>{s.name}</div><div className="t-mut t-mono" style={{ fontSize: 10.5 }}>{s.id}</div></div></div></td>
                <td style={{ fontSize: 12.5 }}>{s.role}</td>
                <td><span className="badge outline">{s.team}</span></td>
                <td className="t-mono" style={{ fontSize: 12.5 }}>{s.contractH ? s.contractH + " h/Wo" : "Sub"}</td>
                <td className="t-mono t-strong">{planned.toFixed(1)} h</td>
                <td style={{ minWidth: 110 }}>{s.contractH ? <div className="flex items-center gap-sm"><div className="progress" style={{ flex: 1 }}><div style={{ width: Math.min(100, util) + "%", background: util > 100 ? "var(--danger)" : util > 85 ? "var(--warn)" : "var(--color-primary)" }} /></div><span className="t-mono t-mut" style={{ fontSize: 11 }}>{util}%</span></div> : <span className="t-mut">—</span>}</td>
                <td className="t-mono" style={{ fontSize: 12 }}>{s.vacationTaken}/{s.vacationTotal}</td>
                <td>{s.active ? <span className="badge ok"><span className="dot" />aktiv</span> : <span className="badge">inaktiv</span>}</td>
                <td onClick={e => e.stopPropagation()}><button className="icon-btn sq" style={{ height: 30, minWidth: 30 }} onClick={() => toast("Mitarbeiter bearbeiten", "edit")}><Icon name="edit" size={15} /></button></td>
              </tr>
            );
          })}
        </tbody>
      </table></div></div>
    </React.Fragment>
  );
}

/* ============ STATISTIKEN ============ */
function ShiftStatistik() {
  const D = MWDATA;
  const week = D.shiftMeta.days.slice(0, 7);
  // per staff soll/ist
  const rows = D.staff.map(s => {
    let soll = 0, ist = 0, hasIst = false;
    week.forEach(d => { const e = D.shifts[s.id][d]; if (e?.state === "shift") { soll += e.soll; if (e.ist != null) { ist += e.ist; hasIst = true; } } });
    return { s, soll, ist, hasIst, diff: ist - soll };
  });
  const totalSoll = rows.reduce((a, r) => a + r.soll, 0);
  const totalIst = rows.reduce((a, r) => a + r.ist, 0);
  // shift type distribution
  const typeCount = {};
  D.staff.forEach(s => week.forEach(d => { const e = D.shifts[s.id][d]; if (e?.state === "shift") typeCount[e.code] = (typeCount[e.code] || 0) + 1; }));
  const donutSegs = Object.entries(typeCount).map(([code, n]) => ({ label: D.SHIFT_TPL[code].name, value: n, cls: "", color: D.SHIFT_TPL[code].color }));
  const totalShifts = donutSegs.reduce((a, s) => a + s.value, 0);
  // team coverage
  const teamCov = {};
  D.staff.forEach(s => { teamCov[s.team] = teamCov[s.team] || { plan: 0, n: 0 }; teamCov[s.team].plan += week.reduce((sum, d) => sum + (D.shifts[s.id][d]?.state === "shift" ? D.shifts[s.id][d].soll : 0), 0); teamCov[s.team].n++; });
  const topOT = [...rows].filter(r => r.hasIst).sort((a, b) => b.diff - a.diff).slice(0, 5);
  const maxH = Math.max(...rows.map(r => Math.max(r.soll, r.ist)), 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
      <div className="grid4">
        <div className="stat"><div className="stat-ic"><Icon name="hourglass" size={17} /></div><div className="lbl">Soll gesamt</div><div className="val">{Math.round(totalSoll)}<span style={{ fontSize: 15, color: "var(--fg-3)" }}> h</span></div></div>
        <div className="stat"><div className="stat-ic" style={{ color: "var(--info-fg)", background: "var(--info-bg)" }}><Icon name="zap" size={17} /></div><div className="lbl">Ist gesamt (Stempel)</div><div className="val">{Math.round(totalIst)}<span style={{ fontSize: 15, color: "var(--fg-3)" }}> h</span></div></div>
        <div className="stat"><div className="stat-ic" style={{ color: (totalIst - totalSoll) >= 0 ? "var(--ok-fg)" : "var(--danger-fg)", background: (totalIst - totalSoll) >= 0 ? "var(--ok-bg)" : "var(--danger-bg)" }}><Icon name="trend" size={17} /></div><div className="lbl">Plus-Minus-Saldo</div><div className="val" style={{ color: (totalIst - totalSoll) >= 0 ? "var(--ok-fg)" : "var(--danger-fg)" }}>{(totalIst - totalSoll >= 0 ? "+" : "") + Math.round(totalIst - totalSoll)}<span style={{ fontSize: 15 }}> h</span></div></div>
        <div className="stat"><div className="stat-ic" style={{ color: "var(--purple-fg)", background: "var(--purple-bg)" }}><Icon name="calRange" size={17} /></div><div className="lbl">Schichten (Woche)</div><div className="val">{totalShifts}</div></div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "var(--gap)", alignItems: "start" }}>
        {/* Soll vs Ist per staff */}
        <div className="card">
          <div className="card-head"><div style={{ flex: 1 }}><h3>Soll vs. Ist je Mitarbeiter</h3><span className="sub">Woche · <span style={{ color: "var(--color-primary-strong)" }}>■ Soll</span> <span style={{ color: "var(--info-fg)" }}>■ Ist (App)</span></span></div></div>
          <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.filter(r => r.soll > 0).map(r => (
              <div key={r.s.id}>
                <div className="flex between" style={{ fontSize: 11.5, marginBottom: 3 }}><span className="t-strong">{r.s.name}</span><span className="t-mono t-mut">{r.soll.toFixed(1)}h{r.hasIst ? " / " + r.ist.toFixed(1) + "h" : ""}</span></div>
                <div style={{ position: "relative", height: 14, background: "var(--surface-3)", borderRadius: 4 }}>
                  <div style={{ position: "absolute", top: 0, left: 0, height: 7, width: (r.soll / maxH * 100) + "%", background: "var(--color-primary)", borderRadius: "4px 4px 0 0" }} />
                  <div style={{ position: "absolute", bottom: 0, left: 0, height: 7, width: (r.ist / maxH * 100) + "%", background: "var(--info)", borderRadius: "0 0 4px 4px" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--gap)" }}>
          {/* Shift type donut */}
          <div className="card">
            <div className="card-head"><h3>Schichtarten</h3></div>
            <div className="card-pad flex items-center gap" style={{ gap: 16 }}>
              <svg width={120} height={120} viewBox="0 0 120 120" style={{ flex: "0 0 auto" }}>
                <g transform="rotate(-90 60 60)">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="var(--surface-3)" strokeWidth="15" />
                  {(() => { let acc = 0; const c = 2 * Math.PI * 50; return donutSegs.map((s, i) => { const len = s.value / totalShifts * c; const el = <circle key={i} cx="60" cy="60" r="50" fill="none" stroke={s.color} strokeWidth="15" strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-acc} />; acc += len; return el; }); })()}
                </g>
              </svg>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                {donutSegs.map(s => <div key={s.label} className="flex items-center gap-sm" style={{ fontSize: 12 }}><span style={{ width: 9, height: 9, borderRadius: 3, background: s.color }} /><span style={{ flex: 1, color: "var(--fg-2)" }}>{s.label}</span><span className="t-mono t-strong">{s.value}</span></div>)}
              </div>
            </div>
          </div>
          {/* Top overtime */}
          <div className="card">
            <div className="card-head"><h3>Mehr-/Minderstunden</h3></div>
            <div className="card-pad" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topOT.map(r => (
                <div key={r.s.id} className="flex items-center gap-sm"><Avatar name={r.s.name} size={26} /><span style={{ flex: 1, fontSize: 12.5 }} className="t-strong">{r.s.name}</span><span className="badge" style={{ background: r.diff >= 0 ? "var(--ok-bg)" : "var(--danger-bg)", color: r.diff >= 0 ? "var(--ok-fg)" : "var(--danger-fg)" }}>{(r.diff >= 0 ? "+" : "") + r.diff.toFixed(1)} h</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
