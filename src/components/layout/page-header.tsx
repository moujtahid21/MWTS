import type { ReactNode } from "react";

/** Matches `.page-head` in the design system. Server component — no client JS. */
export function PageHeader({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div style={{ flex: 1, minWidth: 200 }}>
        <h2 className="ph-title">{title}</h2>
        {sub ? <div className="ph-sub">{sub}</div> : null}
      </div>
      {children ? <div className="flex items-center gap-sm wrap">{children}</div> : null}
    </div>
  );
}
