"use client";

/* ============================================================
   MW Transport Service — Avatar-Menü (Logout)
   src/components/layout/avatar-menu.tsx
   ------------------------------------------------------------
   Klick auf den Avatar öffnet ein kleines Dropdown mit Name/E-Mail
   und „Abmelden". Der Logout läuft über die bestehende Server Action
   signOut() (Supabase-Auth), die danach auf /login weiterleitet.
   ============================================================ */
import { useEffect, useRef, useState, useTransition } from "react";
import { LogOut, UserRound } from "lucide-react";
import { Avatar } from "@/components/ui";
import { signOut } from "@/actions/auth-actions";

export function AvatarMenu({
  name,
  email,
  size = 30,
  align = "right",
}: {
  name: string;
  email?: string;
  size?: number;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  // Klick außerhalb / Escape schließt das Menü.
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Konto-Menü"
        className="block rounded-full ring-offset-2 ring-offset-[var(--surface)] transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <Avatar name={name} size={size} />
      </button>

      {open && (
        <div
          role="menu"
          className={
            "absolute top-[calc(100%+8px)] z-50 w-[230px] overflow-hidden rounded-[var(--r-lg)] border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-lg)] " +
            (align === "right" ? "right-0" : "left-0")
          }
        >
          <div className="flex items-center gap-[10px] border-b border-[var(--border)] p-3">
            <Avatar name={name} size={34} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-[13px] font-[650] text-[var(--fg)]">{name}</div>
              {email && <div className="truncate text-[11.5px] text-[var(--fg-3)]">{email}</div>}
            </div>
          </div>
          <div className="p-1.5">
            <a
              href="/fahrer/dashboard"
              role="menuitem"
              className="flex items-center gap-2.5 rounded-[var(--r)] px-2.5 py-2 text-[13px] font-[550] text-[var(--fg-2)] no-underline hover:bg-[var(--surface-3)]"
            >
              <UserRound size={16} /> Mein Konto
            </a>
            <button
              role="menuitem"
              disabled={pending}
              onClick={() => startTransition(() => void signOut())}
              className="flex w-full items-center gap-2.5 rounded-[var(--r)] px-2.5 py-2 text-[13px] font-[600] text-[var(--danger-fg)] hover:bg-[var(--danger-bg)] disabled:opacity-60"
            >
              <LogOut size={16} /> {pending ? "Abmelden …" : "Abmelden"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
