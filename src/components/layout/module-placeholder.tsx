import type { LucideIcon } from "lucide-react";
import { PageHeader } from "./page-header";

/**
 * Scaffold body for a route whose full module is being ported in a later step.
 * Keeps every page route renderable and visually consistent while the legacy
 * `*.jsx` module is rewritten as typed React Server/Client Components.
 *
 * Replace the `<ModulePlaceholder>` in a `page.tsx` with the real module once
 * built — the route, layout, title and nav wiring already work.
 */
export function ModulePlaceholder({
  title,
  sub,
  icon: Icon,
  legacy,
  scope,
  note,
}: {
  title: string;
  sub: string;
  icon: LucideIcon;
  /** Legacy prototype file this route replaces, for the dev porting it. */
  legacy: string;
  /** Phase-1 / Phase-2 marker from AGENT_GUIDE. */
  scope: "Phase 1" | "Phase 2";
  note?: string;
}) {
  return (
    <div className="view-narrow">
      <PageHeader title={title} sub={sub} />
      <div
        className="card card-pad"
        style={{ display: "grid", placeItems: "center", textAlign: "center", padding: "64px 24px" }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            display: "grid",
            placeItems: "center",
            background: "var(--color-primary-soft)",
            color: "var(--color-primary-strong)",
            marginBottom: 16,
          }}
        >
          <Icon size={26} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{title}</div>
        <div className="t-mut" style={{ fontSize: 13, marginTop: 6, maxWidth: 460 }}>
          {note ??
            "Route, Layout und Navigation sind aktiv. Das Modul-UI wird hier eingesetzt."}
        </div>
        <div className="flex items-center gap-sm" style={{ marginTop: 18 }}>
          <span className={"badge " + (scope === "Phase 1" ? "brand" : "purple")}>{scope}</span>
          <span className="badge outline t-mono">{legacy}</span>
        </div>
      </div>
    </div>
  );
}
