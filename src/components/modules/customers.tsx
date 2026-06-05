"use client";

/* MW Transport Service — ported from app/customers.jsx. Behaviour preserved 1:1. */
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Icon } from "@/components/icon";
import {
  Avatar, Plate, StatusBadge, TypeBadge, Modal, useToast, Sparkline, MiniBars,
  Donut, Field, Switch, Check, Menu, PageHead, Empty, fmtDate, fmtEur,
} from "@/components/ui";
import { MWDATA } from "@/lib/data";
import { useAppNav } from "@/lib/use-app-nav";
import {
  getCustomers, createCustomer, updateCustomer, deleteCustomer,
} from "@/actions/customer-actions";
import type { CustomerVM } from "@/lib/supabase/types";

export function Customers() {
  const onNav = useAppNav();
  const D = MWDATA;
  const toast = useToast();
  const [list, setList] = useState<CustomerVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<CustomerVM | "new" | null>(null);
  const [view, setView] = useState("grid");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getCustomers();
    if (res.error) { setLoadError(res.error); setList([]); }
    else { setLoadError(null); setList(res.data ?? []); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = list.filter(c => !q || c.name.toLowerCase().includes(q.toLowerCase()) || c.city.toLowerCase().includes(q.toLowerCase()) || c.email.toLowerCase().includes(q.toLowerCase()));

  // Create or update via the tenant-scoped Server Action, then re-sync state.
  const save = async (data) => {
    setSaving(true);
    const isEdit = data.id && list.some(c => c.id === data.id);
    const res = isEdit ? await updateCustomer(data.id, data) : await createCustomer(data);
    setSaving(false);
    if (res.error || !res.data) { toast(res.error ?? "Kunde konnte nicht gespeichert werden.", "x"); return; }
    setList(l => isEdit ? l.map(c => c.id === res.data!.id ? res.data! : c) : [res.data!, ...l]);
    setEdit(null);
    toast("Kunde gespeichert", "check");
  };

  const del = async (id) => {
    const prev = list;
    setList(l => l.filter(c => c.id !== id));
    const res = await deleteCustomer(id);
    if (res.error) { toast(res.error, "x"); setList(prev); return; }
    toast("Kunde gelöscht", "trash");
  };

  return (
    <div className="view-narrow">
      <PageHead title="Kundenverwaltung" sub={list.length + " Auftraggeber · " + list.reduce((s, c) => s + c.openOrders, 0) + " offene Aufträge"}>
        <div className="seg"><button className={view === "grid" ? "on" : ""} onClick={() => setView("grid")}><Icon name="grid" size={14} /></button><button className={view === "list" ? "on" : ""} onClick={() => setView("list")}><Icon name="list" size={14} /></button></div>
        <button className="btn btn-primary" onClick={() => setEdit("new")}><Icon name="plus" size={16} />Kunde hinzufügen</button>
      </PageHead>

      <div className="search" style={{ marginBottom: "var(--gap)", maxWidth: 380 }}><Icon name="search" size={16} /><input className="input" placeholder="Kunde, Stadt oder E-Mail suchen …" value={q} onChange={e => setQ(e.target.value)} /></div>

      {loading ? (
        <div className="grid3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={"csk" + i} className="card" style={{ height: 220, opacity: 0.6, animation: "mwtPulse 1.2s ease-in-out infinite" }} />
          ))}
          <style>{"@keyframes mwtPulse{0%,100%{opacity:.4}50%{opacity:.75}}"}</style>
        </div>
      ) : filtered.length === 0 ? (
        loadError
          ? <Empty title="Kunden konnten nicht geladen werden" sub={loadError} />
          : <Empty title="Keine Kunden gefunden" sub={q ? "Passe deine Suche an." : "Lege deinen ersten Kunden an."} />
      ) : view === "grid" ? (
        <div className="grid3">
          {filtered.map(c => (
            <div key={c.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
              <div className="card-pad" style={{ flex: 1 }}>
                <div className="flex items-center gap-sm" style={{ marginBottom: 12 }}>
                  <div className="avatar" style={{ width: 42, height: 42, flexBasis: 42, borderRadius: 11, background: "var(--color-primary-soft)", color: "var(--color-primary-strong)" }}><Icon name="building" size={20} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}><div className="t-strong" style={{ fontSize: 14.5, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</div><div className="t-mut t-mono" style={{ fontSize: 11.5 }}>{c.displayId}</div></div>
                  <Menu trigger={<button className="icon-btn sq" style={{ height: 30, minWidth: 30 }}><Icon name="more" size={15} /></button>}
                    items={[{ icon: "edit", label: "Bearbeiten", onClick: () => setEdit(c) }, { icon: "orders", label: "Aufträge anzeigen", onClick: () => onNav("orders", { auftraggeber: c.name }) }, { divider: true }, { icon: "trash", label: "Löschen", danger: true, onClick: () => del(c.id) }]} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7, fontSize: 12.5 }}>
                  <div className="flex items-center gap-sm t-mut"><Icon name="mapPin" size={14} />{c.street}, {c.plz} {c.city}</div>
                  <div className="flex items-center gap-sm t-mut"><Icon name="mail" size={14} /><a className="link" href={"mailto:" + c.email}>{c.email}</a></div>
                  <div className="flex items-center gap-sm t-mut"><Icon name="phone" size={14} />{c.phone}</div>
                </div>
                {c.contacts.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--fg-3)", marginBottom: 7 }}>Ansprechpartner</div>
                    <div className="flex items-center" style={{ gap: 6 }}>
                      {c.contacts.map((p, i) => <div key={i} title={p.name + " · " + p.role}><Avatar name={p.name} size={28} /></div>)}
                      <span className="t-mut" style={{ fontSize: 12 }}>{c.contacts.map(p => p.name.split(" ")[0]).join(", ")}</span>
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", borderTop: "1px solid var(--border)" }}>
                <div style={{ flex: 1, padding: "11px 16px", textAlign: "center", borderRight: "1px solid var(--border)" }}><div className="t-mono t-strong" style={{ fontSize: 17 }}>{c.orders}</div><div className="t-mut" style={{ fontSize: 11 }}>Aufträge</div></div>
                <div style={{ flex: 1, padding: "11px 16px", textAlign: "center" }}><div className="t-mono t-strong" style={{ fontSize: 17, color: c.openOrders ? "var(--warn-fg)" : "var(--fg)" }}>{c.openOrders}</div><div className="t-mut" style={{ fontSize: 11 }}>offen</div></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card"><div className="tbl-wrap"><table className="tbl">
          <thead><tr><th>Kunde</th><th>Adresse</th><th>Kontakt</th><th>Ansprechpartner</th><th style={{ textAlign: "right" }}>Aufträge</th><th style={{ width: 80 }}></th></tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td><div className="flex items-center gap-sm"><div className="avatar" style={{ width: 32, height: 32, flexBasis: 32, borderRadius: 8, background: "var(--color-primary-soft)", color: "var(--color-primary-strong)" }}><Icon name="building" size={16} /></div><div><div className="t-strong">{c.name}</div><div className="t-mut t-mono" style={{ fontSize: 11 }}>{c.displayId}</div></div></div></td>
                <td className="t-mut" style={{ fontSize: 12.5 }}>{c.plz} {c.city}</td>
                <td><a className="link" href={"mailto:" + c.email} style={{ fontSize: 12.5 }}>{c.email}</a></td>
                <td>{c.contacts.length ? <div className="flex items-center" style={{ gap: 4 }}>{c.contacts.map((p, i) => <div key={i} title={p.name}><Avatar name={p.name} size={24} /></div>)}</div> : <span className="t-mut">—</span>}</td>
                <td style={{ textAlign: "right" }} className="t-mono t-strong">{c.orders} <span className="t-mut" style={{ fontWeight: 400 }}>/ {c.openOrders} offen</span></td>
                <td><div className="flex" style={{ justifyContent: "flex-end", gap: 4 }}><button className="icon-btn sq" style={{ height: 30, minWidth: 30 }} onClick={() => setEdit(c)}><Icon name="edit" size={15} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table></div></div>
      )}

      {edit && <CustomerForm D={D} busy={saving} customer={edit === "new" ? null : edit} onClose={() => setEdit(null)} onSave={save} />}
    </div>
  );
}

function CustomerForm({ customer, onClose, onSave, busy }) {
  const blank = { name: "", phone: "", email: "", land: "Deutschland", city: "", street: "", plz: "", contacts: [], dispoAusland: "", durchfuehrung: "", rechnung: "" };
  const [f, setF] = useState(customer ? { ...customer } : blank);
  const set = (k, v) => setF(s => ({ ...s, [k]: v }));
  const addRow = () => set("contacts", [...f.contacts, { name: "", role: "", phone: "", email: "" }]);
  const setRow = (i, k, v) => set("contacts", f.contacts.map((r, j) => j === i ? { ...r, [k]: v } : r));
  const delRow = (i) => set("contacts", f.contacts.filter((_, j) => j !== i));
  const valid = f.name && f.email;
  return (
    <Modal size="lg" title={customer ? "Kunde bearbeiten" : "Neuer Kunde"} sub={customer ? customer.displayId : "Auftraggeber-Stammdaten"} onClose={onClose}
      footer={<React.Fragment><div style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Schließen</button><button className="btn btn-primary" disabled={!valid || busy} onClick={() => onSave(f)}><Icon name="check" size={16} />{busy ? "Speichern …" : "Speichern"}</button></React.Fragment>}>
      <div className="grid3" style={{ marginBottom: "var(--gap)" }}>
        <Field label="Kunde" req><input className="input" value={f.name} onChange={e => set("name", e.target.value)} /></Field>
        <Field label="Telefonnummer"><input className="input" value={f.phone} onChange={e => set("phone", e.target.value)} /></Field>
        <Field label="E-Mail" req><input className="input" value={f.email} onChange={e => set("email", e.target.value)} /></Field>
      </div>
      <div className="grid4" style={{ marginBottom: "var(--gap)" }}>
        <Field label="Land"><input className="input" value={f.land} onChange={e => set("land", e.target.value)} /></Field>
        <Field label="Stadt"><input className="input" value={f.city} onChange={e => set("city", e.target.value)} /></Field>
        <Field label="Straße"><input className="input" value={f.street} onChange={e => set("street", e.target.value)} /></Field>
        <Field label="PLZ"><input className="input" value={f.plz} onChange={e => set("plz", e.target.value)} /></Field>
      </div>

      <div className="section-label">Ansprechpartner</div>
      <div className="card" style={{ boxShadow: "none", marginBottom: "var(--gap)", overflow: "hidden" }}>
        <table className="tbl"><thead><tr><th>Name</th><th>Zuständigkeit</th><th>Telefon</th><th>E-Mail</th><th style={{ width: 44 }}></th></tr></thead>
          <tbody>
            {f.contacts.map((r, i) => (
              <tr key={i}>
                <td><input className="input" style={{ height: 32 }} value={r.name} onChange={e => setRow(i, "name", e.target.value)} placeholder="Name" /></td>
                <td><input className="input" style={{ height: 32 }} value={r.role} onChange={e => setRow(i, "role", e.target.value)} placeholder="z. B. Disposition" /></td>
                <td><input className="input" style={{ height: 32 }} value={r.phone} onChange={e => setRow(i, "phone", e.target.value)} placeholder="+49 …" /></td>
                <td><input className="input" style={{ height: 32 }} value={r.email} onChange={e => setRow(i, "email", e.target.value)} placeholder="mail@…" /></td>
                <td><button className="icon-btn sq btn-danger" style={{ height: 32, minWidth: 32 }} onClick={() => delRow(i)}><Icon name="trash" size={14} /></button></td>
              </tr>
            ))}
            {f.contacts.length === 0 && <tr><td colSpan={5} className="t-mut" style={{ textAlign: "center", padding: 16 }}>Noch keine Ansprechpartner</td></tr>}
          </tbody>
        </table>
        <button className="btn btn-ghost" style={{ width: "100%", borderRadius: 0, borderTop: "1px solid var(--border)" }} onClick={addRow}><Icon name="plus" size={15} />Zeile hinzufügen</button>
      </div>

      <div className="grid3">
        <Field label="Disposition Ausland"><textarea className="textarea" value={f.dispoAusland} onChange={e => set("dispoAusland", e.target.value)} /></Field>
        <Field label="Info Auftragsdurchführung"><textarea className="textarea" value={f.durchfuehrung} onChange={e => set("durchfuehrung", e.target.value)} /></Field>
        <Field label="Rechnungsstellungs-Info"><textarea className="textarea" value={f.rechnung} onChange={e => set("rechnung", e.target.value)} /></Field>
      </div>
    </Modal>
  );
}
