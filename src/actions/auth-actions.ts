"use server";

/* ============================================================
   MW Transport Service — Auth Server Actions
   ------------------------------------------------------------
   Email/password sign-in + sign-out via the cookie-bound Supabase
   server client. Nach erfolgreicher Anmeldung wird rollenabhängig
   weitergeleitet (Fahrer → /fahrer/dashboard, Staff → /overview).
   ============================================================ */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserRole } from "@/lib/auth/roles-server";
import { homeForRole, isDriverRole, isDriverPath } from "@/lib/roles";

export interface LoginState {
  error: string | null;
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectedFrom") ?? "") || "";

  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort eingeben." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Keep the message generic — don't leak which field was wrong.
    return { error: "Anmeldung fehlgeschlagen. E-Mail oder Passwort ist falsch." };
  }

  // Rolle auflösen und rollenrichtige Landeseite bestimmen.
  const role = await getUserRole(supabase);
  const fallback = homeForRole(role); // Fahrer → /fahrer/dashboard, sonst /overview

  // Ein vorhandenes redirectedFrom nur übernehmen, wenn es zur Rolle passt
  // (sonst landet ein Fahrer auf einer gesperrten Disponenten-Route u. v. v.).
  let dest = fallback;
  if (redirectTo.startsWith("/")) {
    const target = redirectTo;
    const driverWantsDriver = isDriverRole(role) && isDriverPath(target);
    const staffWantsStaff = !isDriverRole(role) && !isDriverPath(target);
    if (driverWantsDriver || staffWantsStaff) dest = target;
  }

  revalidatePath("/", "layout");
  // redirect() throws internally — must be outside any try/catch.
  redirect(dest);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
