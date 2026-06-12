"use server";

/* ============================================================
   MW Transport Service — Nutzerverwaltung & Einladungs-Flow
   src/actions/user-actions.ts
   ------------------------------------------------------------
   Admin lädt neue Nutzer ein. Ablauf:
     1. Aufrufer-Berechtigung prüfen (muss Admin/Owner im Tenant sein).
     2. supabase.auth.admin.inviteUserByEmail(...)  → verschickt die
        Einladungs-E-Mail mit Link auf /auth/confirm (Token).
     3. membership-Zeile (tenant_id, user_id, role) anlegen.
     4. Bei Rolle 'driver' zusätzlich eine drivers-Zeile anlegen.

   Alle Schreibzugriffe laufen über den Service-Role-Client (umgeht RLS),
   daher ist die Rollenprüfung in Schritt 1 sicherheitskritisch.
   ============================================================ */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getActiveTenantId } from "@/lib/supabase/tenant";
import { roleFromClaims } from "@/lib/auth/roles-server";

/* UI-Rollen → DB-Rollen */
export type InviteRole = "admin" | "dispatcher" | "driver";
const ROLE_LABEL: Record<InviteRole, string> = {
  admin: "Administrator",
  dispatcher: "Disponent",
  driver: "Fahrer",
};

export interface InviteState {
  ok: boolean;
  error: string | null;
  message: string | null;
}

/** Prüft, ob der aktuelle User Admin/Owner im aktiven Tenant ist. */
async function assertAdmin(): Promise<{ tenantId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht angemeldet.");

  const tenantId = await getActiveTenantId(supabase);
  if (!tenantId) throw new Error("Kein aktiver Tenant.");

  // Rolle bevorzugt aus den JWT-Claims; Fallback memberships-Query.
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
  if (role !== "admin" && role !== "owner") {
    throw new Error("Nur Administratoren dürfen Nutzer einladen.");
  }
  return { tenantId };
}

function genDriverDisplayId() {
  return "F-" + Math.floor(1000 + Math.random() * 9000);
}

export async function inviteUser(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const role = String(formData.get("role") ?? "") as InviteRole;

  if (!name || !email) return { ok: false, error: "Name und E-Mail sind erforderlich.", message: null };
  if (!["admin", "dispatcher", "driver"].includes(role))
    return { ok: false, error: "Bitte eine gültige Rolle wählen.", message: null };

  let tenantId: string;
  try {
    ({ tenantId } = await assertAdmin());
  } catch (e) {
    return { ok: false, error: (e as Error).message, message: null };
  }

  const admin = createAdminClient();

  // 1) Einladung verschicken. Der Link führt auf /auth/confirm (Token-Tausch),
  //    danach leitet die App auf /auth/set-password weiter.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/auth/set-password`,
    data: { full_name: name, phone },
  });

  if (inviteErr || !invited?.user) {
    // Häufigster Fall: E-Mail existiert bereits als User.
    const msg = inviteErr?.message?.includes("already")
      ? "Diese E-Mail ist bereits registriert."
      : inviteErr?.message ?? "Einladung fehlgeschlagen.";
    return { ok: false, error: msg, message: null };
  }

  const userId = invited.user.id;

  // role + tenant_id in app_metadata schreiben — daraus liest das Routing
  // (proxy.ts) die Rolle. inviteUserByEmail kann das nicht direkt, daher hier.
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role, tenant_id: tenantId },
  });

  // 2) Mitgliedschaft im Tenant anlegen (idempotent via upsert).
  const { error: memErr } = await admin
    .from("memberships")
    .upsert({ user_id: userId, tenant_id: tenantId, role }, { onConflict: "user_id,tenant_id" });
  if (memErr) {
    return { ok: false, error: "Nutzer eingeladen, aber Mitgliedschaft fehlgeschlagen: " + memErr.message, message: null };
  }

  // 3) Bei Fahrern zusätzlich einen drivers-Datensatz erzeugen.
  if (role === "driver") {
    const { error: drvErr } = await admin.from("drivers").insert({
      tenant_id: tenantId,
      user_id: userId,
      display_id: genDriverDisplayId(),
      name,
      phone: phone || null,
      city: city || null,
    });
    if (drvErr) {
      return { ok: false, error: "Nutzer eingeladen, aber Fahrerprofil fehlgeschlagen: " + drvErr.message, message: null };
    }
  }

  revalidatePath("/settings");
  return {
    ok: true,
    error: null,
    message: `Einladung an ${email} gesendet · Rolle: ${ROLE_LABEL[role]}.`,
  };
}

/* ---------- Nutzerliste des Tenants (für die Settings-Tabelle) ---------- */
export interface TenantUser {
  user_id: string;
  email: string;
  name: string;
  role: InviteRole | string;
  status: "aktiv" | "eingeladen";
}

export async function listTenantUsers(): Promise<TenantUser[]> {
  let tenantId: string;
  try {
    ({ tenantId } = await assertAdmin());
  } catch {
    return [];
  }

  const admin = createAdminClient();
  const { data: members } = await admin
    .from("memberships")
    .select("user_id, role")
    .eq("tenant_id", tenantId);

  if (!members?.length) return [];

  // Auth-Stammdaten (E-Mail, Name, Bestätigungsstatus) je User holen.
  const users: TenantUser[] = [];
  for (const m of members) {
    const { data } = await admin.auth.admin.getUserById(m.user_id);
    const u = data?.user;
    users.push({
      user_id: m.user_id,
      email: u?.email ?? "—",
      name: (u?.user_metadata?.full_name as string) ?? u?.email ?? "—",
      role: m.role,
      status: u?.email_confirmed_at || u?.last_sign_in_at ? "aktiv" : "eingeladen",
    });
  }
  return users;
}
