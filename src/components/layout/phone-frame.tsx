"use client";

/* ============================================================
   MW Transport Service — Phone-Frame (Vorschau-Hülle)
   src/components/layout/phone-frame.tsx
   ------------------------------------------------------------
   Schlichter Geräterahmen, um die Fahrer-Views (mobil-first) im
   Disponenten-Cockpit als realistische Vorschau zu zeigen. Skaliert
   nicht den Inhalt — der Rahmen hat die echte Viewport-Breite eines
   Smartphones (390px), die Views sind ohnehin responsiv.
   ============================================================ */
export function PhoneFrame({
  children,
  width = 390,
  height = 800,
}: {
  children: React.ReactNode;
  width?: number;
  height?: number;
}) {
  return (
    <div
      className="relative shrink-0 rounded-[44px] border border-[var(--border)] bg-[#0b0f14] p-[10px] shadow-[var(--shadow-lg)]"
      style={{ width: width + 20 }}
    >
      {/* Notch */}
      <div className="pointer-events-none absolute left-1/2 top-[10px] z-20 h-[26px] w-[120px] -translate-x-1/2 rounded-b-[14px] bg-[#0b0f14]" />
      <div
        className="relative overflow-hidden rounded-[34px] bg-[var(--bg)]"
        style={{ width, height }}
      >
        <div className="h-full w-full overflow-y-auto overflow-x-hidden">{children}</div>
      </div>
    </div>
  );
}
