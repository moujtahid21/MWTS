"use client";

/* ============================================================
   MW Transport Service — Meine Aufträge + Beleg-Upload
   src/components/driver/orders-view.tsx
   ------------------------------------------------------------
   Liste (nach Status gruppiert) → Detail → auftragsgebundener
   Beleg-Upload (Belegtyp-Dropdown, Kamera-Trigger via capture,
   Tankbeleg-Zusatzfelder). Phase 3: orders + order_documents.
   ============================================================ */
import { useRef, useState } from "react";
import {
  Camera, Upload, X, Check, ChevronLeft, ChevronRight, Route, Calendar, Clock,
  Fuel, FileText, Navigation, ShieldCheck, Inbox, RefreshCw, Receipt,
} from "lucide-react";
import { Plate, Modal, Field, PageHead, Empty, useToast } from "@/components/ui";
import { fmtDate, isoOf } from "@/lib/driver/date-utils";
import { DOC_TYPES } from "@/lib/driver/mock-data";
import type { DriverOrder, OrderStatus, OrderDocument, DocType } from "@/lib/driver/types";

const STEPS = ["Angenommen", "Abgeholt", "Unterwegs", "Geliefert"];

const STATUS_META: Record<OrderStatus, { label: string; cls: string }> = {
  zugewiesen: { label: "Zugewiesen", cls: "info" },
  angenommen: { label: "Angenommen", cls: "ok" },
  unterwegs: { label: "Unterwegs", cls: "purple" },
  fertig: { label: "Fertig", cls: "ok" },
  storniert: { label: "Storniert", cls: "danger" },
  nicht_zugewiesen: { label: "Nicht zugewiesen", cls: "warn" },
};

const DOC_ICON: Record<string, typeof Fuel> = { fuel: Fuel, refresh: RefreshCw, file: FileText, receipt: Receipt };

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const s = STATUS_META[status];
  return <span className={"badge " + s.cls}><span className="dot" /> {s.label}</span>;
}

function docMeta(type: string) {
  return DOC_TYPES.find((t) => t.key === type) ?? { key: type, label: type, icon: "file", extra: false };
}

/* ---------- Mini-Route ---------- */
function RouteMini({ from, to }: { from: DriverOrder["from"]; to: DriverOrder["to"] }) {
  return (
    <div className="relative pl-5">
      <div className="absolute bottom-2 left-[5px] top-2 w-[2px] bg-[var(--border-strong)]" />
      <div className="relative mb-3">
        <span className="absolute -left-5 top-[3px] h-[11px] w-[11px] rounded-full border-2 border-[var(--surface)] bg-[var(--info)]" />
        <div className="t-strong text-[13.5px]">{from.city}</div>
        <div className="t-mut text-[12px]">{from.street}, {from.plz}</div>
      </div>
      <div className="relative">
        <span className="absolute -left-5 top-[3px] h-[11px] w-[11px] rounded-full border-2 border-[var(--surface)] bg-[var(--danger)]" />
        <div className="t-strong text-[13.5px]">{to.city}</div>
        <div className="t-mut text-[12px]">{to.street}, {to.plz}</div>
      </div>
    </div>
  );
}

/* ---------- Auftragskarte ---------- */
function OrderCard({ o, onOpen }: { o: DriverOrder; onOpen: (id: number) => void }) {
  return (
    <button onClick={() => onOpen(o.id)} className="card w-full overflow-hidden p-0 text-left">
      <div className="p-[15px]">
        <div className="mb-3 flex items-center justify-between">
          <Plate value={o.plate} />
          <OrderStatusBadge status={o.status} />
        </div>
        <RouteMini from={o.from} to={o.to} />
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px]">
          <span className="badge"><Route size={11} /> {o.km} km</span>
          {o.pickup_date && <span className="badge"><Calendar size={11} /> {fmtDate(o.pickup_date)}</span>}
          {o.pickup_window && <span className="badge"><Clock size={11} /> {o.pickup_window}</span>}
          {o.refuel && <span className="badge warn"><Fuel size={11} /> Tanken</span>}
          {o.documents.length > 0 && <span className="badge info"><FileText size={11} /> {o.documents.length} Belege</span>}
          <div className="flex-1" />
          <ChevronRight size={16} style={{ color: "var(--fg-faint)" }} />
        </div>
      </div>
    </button>
  );
}

/* ---------- Beleg-Modal ---------- */
function AddDocModal({
  order, now, onClose, onSave, toast,
}: {
  order: DriverOrder; now: Date; onClose: () => void;
  onSave: (id: number, doc: OrderDocument) => void; toast: (m: string, i?: string) => void;
}) {
  const [type, setType] = useState<DocType>("Tankbeleg");
  const [brutto, setBrutto] = useState("");
  const [liter, setLiter] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const meta = docMeta(type);

  const pick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const save = () => {
    if (!file) { toast("Bitte Beleg fotografieren oder Datei wählen", "alert"); return; }
    const ext = file.type.startsWith("image/") ? "jpg" : "pdf";
    const doc: OrderDocument = {
      id: "D-" + Math.floor(Math.random() * 9000 + 1000),
      order_id: order.id,
      driver_id: "self",
      type,
      file_name: meta.label.replace(/[^a-zA-Z]/g, "") + "_" + order.plate.replace(/\s/g, "") + "." + ext,
      uploaded_at: isoOf(now),
      status: "offen",
      preview_url: preview,
      ...(type === "Tankbeleg" ? { brutto: brutto || "—", liter: liter || "—" } : {}),
    };
    onSave(order.id, doc);
    toast("Beleg hochgeladen · " + meta.label, "upload");
  };

  return (
    <Modal
      title="Beleg hinzufügen"
      sub={`Auftrag #${order.id} · ${order.plate}`}
      onClose={onClose}
      footer={<><div className="flex-1" /><button className="btn" onClick={onClose}>Abbrechen</button><button className="btn btn-primary" onClick={save}><Upload size={16} /> Hochladen</button></>}
    >
      <Field label="Belegtyp" req>
        <select className="select" value={type} onChange={(e) => setType(e.target.value as DocType)}>
          {DOC_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </Field>

      {meta.extra && (
        <div className="grid2 mt-[var(--gap)]">
          <Field label="Bruttobetrag (€)" req><input className="input" inputMode="decimal" placeholder="64,20" value={brutto} onChange={(e) => setBrutto(e.target.value)} /></Field>
          <Field label="Litermenge (L)" req><input className="input" inputMode="decimal" placeholder="38,5" value={liter} onChange={(e) => setLiter(e.target.value)} /></Field>
        </div>
      )}

      <div className="mt-[var(--gap)]">
        <div className="field"><label>Foto / Datei<span className="req">*</span></label></div>
        {/* Kamera-Trigger: capture="environment" öffnet auf Smartphones direkt die Kamera */}
        <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={pick} className="hidden" />
        {!file ? (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex min-h-[132px] w-full flex-col items-center justify-center gap-2 rounded-[var(--r)] border border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]"
          >
            <Camera size={30} />
            <span className="text-[13.5px] font-[650]">Beleg fotografieren</span>
            <span className="t-mut text-[11.5px]">Kamera öffnen oder Datei wählen</span>
          </button>
        ) : (
          <div className="flex items-center gap-3 rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface-2)] p-3">
            <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[8px] bg-[var(--surface-3)]">
              {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <FileText size={26} style={{ color: "var(--danger-fg)" }} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="t-strong break-all text-[13px]">{file.name}</div>
              <div className="t-mut text-[11.5px]">{(file.size / 1024).toFixed(0)} KB · bereit zum Upload</div>
            </div>
            <button className="icon-btn sq" onClick={() => { setFile(null); setPreview(null); }}><X size={16} /></button>
          </div>
        )}
        <div className="t-mut mt-2 flex items-center gap-1 text-[11.5px] leading-[1.5]">
          <ShieldCheck size={12} /> Ablage tenant-sicher: <span className="t-mono">tenant/orders/{order.id}/beleg_…</span>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Detail ---------- */
function OrderDetail({
  order, now, onBack, onAccept, onReject, onAdvance, onAddDoc, toast,
}: {
  order: DriverOrder; now: Date; onBack: () => void;
  onAccept: (id: number) => void; onReject: (id: number) => void; onAdvance: (id: number) => void;
  onAddDoc: (id: number, doc: OrderDocument) => void; toast: (m: string, i?: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const canUpload = order.status === "angenommen" || order.status === "unterwegs";
  const actionable = order.status === "zugewiesen";

  return (
    <div>
      <button className="btn btn-ghost mb-[var(--gap)]" onClick={onBack}><ChevronLeft size={16} /> Alle Aufträge</button>

      <div className="card mb-[var(--gap)]">
        <div className="card-head">
          <div className="flex-1">
            <div className="mb-1 flex items-center gap-2"><Plate value={order.plate} /><OrderStatusBadge status={order.status} /></div>
            <span className="sub">{order.model} · #{order.id} · {order.auftraggeber}</span>
          </div>
        </div>
        <div className="card-pad">
          <div className="grid grid-cols-1 gap-[var(--gap)] md:grid-cols-[1.1fr_1fr]">
            <RouteMini from={order.from} to={order.to} />
            <div className="flex flex-col gap-2">
              {([
                ["MV-Nr.", order.mv_nr],
                ["Strecke", order.km + " km"],
                ["Abholung", order.pickup_date ? fmtDate(order.pickup_date) + (order.pickup_window ? " · " + order.pickup_window : "") : "—"],
                ["Vergütung", order.price + " €"],
              ] as const).map(([l, v]) => (
                <div key={l} className="flex items-center justify-between gap-3 text-[12.5px]">
                  <span className="t-mut whitespace-nowrap">{l}</span>
                  <span className="t-strong t-mono text-right">{v}</span>
                </div>
              ))}
              {order.refuel && <span className="badge warn self-start"><Fuel size={11} /> Volltanken erforderlich</span>}
            </div>
          </div>

          {actionable ? (
            <div className="mt-[18px] border-t border-[var(--border)] pt-4">
              <div className="t-strong mb-[10px] text-[13.5px]">Diesen Auftrag annehmen?</div>
              <div className="flex gap-2">
                <button className="btn flex-1" style={{ minHeight: 44 }} onClick={() => onReject(order.id)}><X size={17} /> Ablehnen</button>
                <button className="btn btn-primary" style={{ flex: 1.5, minHeight: 44 }} onClick={() => onAccept(order.id)}><Check size={17} /> Annehmen</button>
              </div>
            </div>
          ) : order.status !== "fertig" ? (
            <div className="mt-[18px] border-t border-[var(--border)] pt-4">
              <div className="mb-2 flex gap-1">
                {STEPS.map((s, i) => <div key={s} className="h-[6px] flex-1 rounded-full" style={{ background: i < order.step ? "var(--color-primary)" : "var(--surface-3)" }} />)}
              </div>
              <div className="mb-3 flex items-center justify-between text-[12.5px]"><span className="t-strong">{STEPS[Math.min(order.step, 3)]}</span><span className="t-mut">{order.step}/4</span></div>
              <div className="flex gap-2">
                <button className="btn flex-1" style={{ minHeight: 44 }} onClick={() => toast("Navigation wird geöffnet", "navigation")}><Navigation size={16} /> Navi</button>
                <button className="btn btn-primary" style={{ flex: 1.5, minHeight: 44 }} onClick={() => onAdvance(order.id)}><Check size={16} /> {STEPS[order.step] ?? "Abschließen"}</button>
              </div>
            </div>
          ) : (
            <div className="mt-4 border-t border-[var(--border)] pt-[14px]"><span className="badge ok"><Check size={12} /> Auftrag abgeschlossen</span></div>
          )}
        </div>
      </div>

      {/* Dokumente */}
      <div className="card">
        <div className="card-head">
          <div className="flex-1"><h3>Dokumente &amp; Quittungen</h3><span className="sub">{order.documents.length} Belege zu diesem Auftrag</span></div>
          {canUpload && <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}><Camera size={15} /> Beleg</button>}
        </div>
        <div className="card-pad flex flex-col gap-[9px]">
          {order.documents.length === 0 && (
            <div className="muted-box flex-col gap-[6px] p-[22px_16px] text-[13px]">
              <Inbox size={22} /><span>Noch keine Belege</span>
              <span className="t-mut text-[12px]">{canUpload ? "Tankbeleg, CMR, Waschstraße … direkt fotografieren" : "Belege nach Auftragsannahme hochladbar"}</span>
            </div>
          )}
          {order.documents.map((d) => {
            const meta = docMeta(d.type);
            const DocIc = DOC_ICON[meta.icon] ?? FileText;
            return (
              <div key={d.id} className="flex items-center gap-2 rounded-[var(--r)] border border-[var(--border)] p-[10px_12px]">
                <div className="grid h-[38px] w-[38px] shrink-0 place-items-center overflow-hidden rounded-[9px] bg-[var(--color-primary-soft)] text-[var(--color-primary-strong)]">
                  {d.preview_url ? <img src={d.preview_url} alt="" className="h-full w-full object-cover" /> : <DocIc size={18} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="t-strong break-all text-[12.5px]">{d.file_name}</div>
                  <div className="t-mut text-[11.5px]">{meta.label} · {fmtDate(d.uploaded_at)}{d.type === "Tankbeleg" && d.brutto ? ` · ${d.brutto} € / ${d.liter} L` : ""}</div>
                </div>
                <span className={"badge " + (d.status === "fertig" ? "ok" : "warn")}><span className="dot" /> {d.status}</span>
              </div>
            );
          })}
        </div>
      </div>

      {adding && <AddDocModal order={order} now={now} onClose={() => setAdding(false)} onSave={(id, doc) => { onAddDoc(id, doc); setAdding(false); }} toast={toast} />}
    </div>
  );
}

/* ---------- Hauptansicht ---------- */
export function OrdersView({ initialOrders, initialSel = null }: { initialOrders: DriverOrder[]; initialSel?: number | null }) {
  const now = new Date();
  const toast = useToast();
  const [orders, setOrders] = useState<DriverOrder[]>(initialOrders);
  const [sel, setSel] = useState<number | null>(initialSel);

  const accept = (id: number) => { setOrders((os) => os.map((o) => (o.id === id ? { ...o, status: "angenommen", step: 1 } : o))); toast("Auftrag angenommen", "check"); };
  const reject = (id: number) => { setOrders((os) => os.map((o) => (o.id === id ? { ...o, status: "storniert" } : o))); setSel(null); toast("Auftrag abgelehnt", "close"); };
  const advance = (id: number) => setOrders((os) => os.map((o) => {
    if (o.id !== id) return o;
    const step = Math.min(o.step + 1, 4);
    const status: OrderStatus = step >= 4 ? "fertig" : step >= 2 ? "unterwegs" : o.status;
    return { ...o, step, status };
  }));
  const addDoc = (id: number, doc: OrderDocument) => setOrders((os) => os.map((o) => (o.id === id ? { ...o, documents: [doc, ...o.documents] } : o)));

  const order = orders.find((o) => o.id === sel);
  if (order) return <OrderDetail order={order} now={now} onBack={() => setSel(null)} onAccept={accept} onReject={reject} onAdvance={advance} onAddDoc={addDoc} toast={toast} />;

  const groups: [string, DriverOrder[]][] = [
    ["Aktion erforderlich", orders.filter((o) => o.status === "zugewiesen")],
    ["Aktive Aufträge", orders.filter((o) => o.status === "angenommen" || o.status === "unterwegs")],
    ["Abgeschlossen", orders.filter((o) => o.status === "fertig")],
  ];

  return (
    <div>
      <PageHead title="Meine Aufträge" sub={orders.length + " Aufträge zugewiesen"} />
      {orders.length === 0 && <Empty title="Keine Aufträge" icon="orders" sub="Neue Zuweisungen erscheinen hier" />}
      {groups.map(([label, list]) => list.length > 0 && (
        <div key={label} className="mb-[var(--gap)]">
          <div className="section-label">{label} <span className="badge h-[19px]">{list.length}</span></div>
          <div className="mt-[10px] flex flex-col gap-[10px]">
            {list.map((o) => <OrderCard key={o.id} o={o} onOpen={setSel} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
