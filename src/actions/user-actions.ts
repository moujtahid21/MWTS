"use server";

/* ============================================================
   MW Transport Service — Nutzerverwaltung & Einladungs-Flow
   src/actions/user-actions.ts
   ------------------------------------------------------------
   Admin lädt neue Nutzer ein. Ablauf:
     1. Aufrufer-Berechtigung prüfen (muss Admin/Owner im Tenant sein).
     2. supabase.auth.admin.inviteUserByEmail(...) → Einladungs-E-Mail.
     3. app_metadata.role + memberships-Zeile setzen.
     4a. Wird ein BESTEHENDER Fahrer (display_id) verknüpft, bekommt
         dessen drivers-Zeile die neue user_id (keine Dublette!) und
         die Rolle stammt aus drivers.role (Soll-Rolle).
     4b. Sonst: bei Rolle 'driver' eine neue drivers-Zeile (inkl. role).

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
  let role = String(formData.get("role") ?? "") as InviteRole;
  // Optional: bestehende drivers-Zeile, die mit dem neuen Account verknüpft wird.
  const linkDriverId = String(formData.get("driver_id") ?? "").trim(); // display_id, z. B. "F-2016"

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

  // 0) Wenn ein bestehender Fahrer verknüpft werden soll: Zeile laden und
  //    prüfen, dass sie noch frei ist (kein user_id). Die Soll-Rolle aus
  //    drivers.role gewinnt — so wird z. B. F-2016 automatisch Disponent.
  let existingDriver: { id: string; user_id: string | null; role: string; name: string } | null = null;
  if (linkDriverId) {
    const { data } = await admin
      .from("drivers")
      .select("id, user_id, role, name")
      .eq("tenant_id", tenantId)
      .eq("display_id", linkDriverId)
      .maybeSingle();
    if (!data) return { ok: false, error: `Fahrer ${linkDriverId} nicht gefunden.`, message: null };
    if (data.user_id) return { ok: false, error: `Fahrer ${linkDriverId} ist bereits mit einem Konto verknüpft.`, message: null };
    existingDriver = data;
    role = (data.role as InviteRole) ?? role; // Soll-Rolle des Datensatzes
  }

  // 1) Einladung verschicken.
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/auth/set-password`,
    data: { full_name: name, phone },
  });

  if (inviteErr || !invited?.user) {
    const msg = inviteErr?.message?.includes("already")
      ? "Diese E-Mail ist bereits registriert."
      : inviteErr?.message ?? "Einladung fehlgeschlagen.";
    return { ok: false, error: msg, message: null };
  }
  const userId = invited.user.id;

  // role + tenant_id in app_metadata — daraus liest das Routing (proxy.ts).
  await admin.auth.admin.updateUserById(userId, {
    app_metadata: { role, tenant_id: tenantId },
  });

  // 2) Mitgliedschaft (idempotent).
  const { error: memErr } = await admin
    .from("memberships")
    .upsert({ user_id: userId, tenant_id: tenantId, role }, { onConflict: "user_id,tenant_id" });
  if (memErr) {
    return { ok: false, error: "Nutzer eingeladen, aber Mitgliedschaft fehlgeschlagen: " + memErr.message, message: null };
  }

  // 3) drivers-Zeile: bestehende verknüpfen ODER (nur bei Fahrern) neu anlegen.
  if (existingDriver) {
    const { error: linkErr } = await admin
      .from("drivers")
      .update({ user_id: userId, role, phone: phone || undefined, city: city || undefined })
      .eq("id", existingDriver.id);
    if (linkErr) {
      return { ok: false, error: "Nutzer eingeladen, aber Verknüpfung fehlgeschlagen: " + linkErr.message, message: null };
    }
  } else if (role === "driver") {
    const { error: drvErr } = await admin.from("drivers").insert({
      tenant_id: tenantId,
      user_id: userId,
      display_id: genDriverDisplayId(),
      name,
      phone: phone || null,
      city: city || null,
      role: "driver",
    });
    if (drvErr) {
      return { ok: false, error: "Nutzer eingeladen, aber Fahrerprofil fehlgeschlagen: " + drvErr.message, message: null };
    }
  }

  revalidatePath("/settings");
  revalidatePath("/drivers");
  const suffix = existingDriver ? ` · verknüpft mit ${linkDriverId}` : "";
  return {
    ok: true,
    error: null,
    message: `Einladung an ${email} gesendet · Rolle: ${ROLE_LABEL[role]}${suffix}.`,
  };
}

/* ---------- Verknüpfbare Fahrer (ohne Account) für das Invite-Dropdown ---------- */
export interface LinkableDriver {
  display_id: string;
  name: string;
  role: string;
  city: string | null;
  phone: string | null;
}

export async function listLinkableDrivers(): Promise<LinkableDriver[]> {
  let tenantId: string;
  try {
    ({ tenantId } = await assertAdmin());
  } catch {
    return [];
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("drivers")
    .select("display_id, name, role, city, phone")
    .eq("tenant_id", tenantId)
    .is("user_id", null)
    .order("display_id", { ascending: true });
  return (data as LinkableDriver[]) ?? [];
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
