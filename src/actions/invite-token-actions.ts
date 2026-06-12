"use server";

/* ============================================================
   MW Transport Service — Einmal-Einladungstoken (Link-Invite)
   src/actions/invite-token-actions.ts
   ------------------------------------------------------------
   createInviteToken(): Admin erzeugt einen teilbaren Einmal-Link.
   getInviteToken() / redeemInviteToken(): Einlösen unter /join/<token>.

   Schreibzugriffe laufen über den Service-Role-Client (umgeht RLS),
   daher prüft createInviteToken die Admin-Rolle serverseitig, und das
   Einlösen validiert Gültigkeit (unbenutzt + nicht abgelaufen) selbst.
   ============================================================ */
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveTenantId } from "@/lib/supabase/tenant";
import { roleFromClaims } from "@/lib/auth/roles-server";

export type TokenRole = "admin" | "dispatcher" | "driver";
const TTL_DAYS = 7;

export interface CreateTokenResult {
  ok: boolean;
  error: string | null;
  token: string | null;
  url: string | null;
  role: TokenRole | null;
  expiresAt: string | null;
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet.");
  const tenantId = await getActiveTenantId(supabase);
  if (!tenantId) throw new Error("Kein aktiver Tenant.");

  let role = roleFromClaims(user);
  if (!role) {
    const { data } = await supabase
      .from("memberships")
      .select("role")
      .eq("user_id", user.id)
      .eq("tenant_id", tenantId)
      .maybeSingle();
    role = data?.role ?? null;
  }
  if (role !== "admin" && role !== "owner")
    throw new Error("Nur Administratoren dürfen Einladungstokens erzeugen.");
  return { userId: user.id, tenantId };
}

export async function createInviteToken(role: TokenRole = "driver"): Promise<CreateTokenResult> {
  let ctx: { userId: string; tenantId: string };
  try {
    ctx = await assertAdmin();
  } catch (e) {
    return { ok: false, error: (e as Error).message, token: null, url: null, role: null, expiresAt: null };
  }
  if (!["admin", "dispatcher", "driver"].includes(role))
    return { ok: false, error: "Ungültige Rolle.", token: null, url: null, role: null, expiresAt: null };

  const token = randomBytes(18).toString("base64url"); // 24 url-sichere Zeichen
  const expiresAt = new Date(Date.now() + TTL_DAYS * 86400000).toISOString();

  const admin = createAdminClient();
  const { error } = await admin.from("invite_tokens").insert({
    tenant_id: ctx.tenantId,
    token,
    role,
    created_by: ctx.userId,
    expires_at: expiresAt,
  });
  if (error)
    return { ok: false, error: "Token konnte nicht gespeichert werden: " + error.message, token: null, url: null, role: null, expiresAt: null };

  return {
    ok: true,
    error: null,
    token,
    url: `${siteUrl()}/join/${token}`,
    role,
    expiresAt,
  };
}

/* ---------- Einlösen ---------- */
export interface TokenInfo {
  valid: boolean;
  reason?: "not_found" | "used" | "expired";
  role?: TokenRole;
  tenantName?: string;
  email?: string | null;
}

export async function getInviteToken(token: string): Promise<TokenInfo> {
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("invite_tokens")
    .select("role, email, used_at, expires_at, tenant_id")
    .eq("token", token)
    .maybeSingle();

  if (!row) return { valid: false, reason: "not_found" };
  if (row.used_at) return { valid: false, reason: "used" };
  if (new Date(row.expires_at).getTime() < Date.now()) return { valid: false, reason: "expired" };

  const { data: tenant } = await admin
    .from("tenants")
    .select("name")
    .eq("id", row.tenant_id)
    .maybeSingle();

  return { valid: true, role: row.role as TokenRole, email: row.email, tenantName: tenant?.name ?? "MW Transport Service" };
}

export interface RedeemState {
  ok: boolean;
  error: string | null;
}

export async function redeemInviteToken(_prev: RedeemState, formData: FormData): Promise<RedeemState> {
  const token = String(formData.get("token") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!name || !email || password.length < 8)
    return { ok: false, error: "Name, E-Mail und ein Passwort (min. 8 Zeichen) sind erforderlich." };

  const admin = createAdminClient();

  // 1) Token erneut validieren (Race-/Replay-Schutz).
  const { data: row } = await admin
    .from("invite_tokens")
    .select("id, role, tenant_id, used_at, expires_at")
    .eq("token", token)
    .maybeSingle();
  if (!row) return { ok: false, error: "Einladungslink ungültig." };
  if (row.used_at) return { ok: false, error: "Dieser Einladungslink wurde bereits verwendet." };
  if (new Date(row.expires_at).getTime() < Date.now())
    return { ok: false, error: "Dieser Einladungslink ist abgelaufen." };

  // 2) Konto direkt anlegen (E-Mail als bestätigt markiert → sofort login-fähig).
  const { data: created, error: cErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: name, role: row.role, tenant_id: row.tenant_id },
  });
  if (cErr || !created?.user) {
    const msg = cErr?.message?.includes("already")
      ? "Diese E-Mail ist bereits registriert. Bitte melde dich an."
      : cErr?.message ?? "Konto konnte nicht erstellt werden.";
    return { ok: false, error: msg };
  }
  const userId = created.user.id;

  // 3) Mitgliedschaft + ggf. Fahrerprofil.
  const { error: mErr } = await admin
    .from("memberships")
    .upsert({ user_id: userId, tenant_id: row.tenant_id, role: row.role }, { onConflict: "user_id,tenant_id" });
  if (mErr) return { ok: false, error: "Mitgliedschaft fehlgeschlagen: " + mErr.message };

  if (row.role === "driver") {
    await admin.from("drivers").insert({
      tenant_id: row.tenant_id,
      user_id: userId,
      display_id: "F-" + Math.floor(1000 + Math.random() * 9000),
      name,
    });
  }

  // 4) Token entwerten.
  await admin.from("invite_tokens").update({ used_at: new Date().toISOString(), used_by: userId }).eq("id", row.id);

  return { ok: true, error: null };
}
