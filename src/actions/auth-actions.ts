"use server";

/* ============================================================
   MW Transport Service — Auth Server Actions
   ------------------------------------------------------------
   Email/password sign-in + sign-out via the cookie-bound Supabase
   server client. On success the session cookies are set server-side
   and the middleware takes over from there.
   ============================================================ */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface LoginState {
  error: string | null;
}

export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectedFrom") ?? "/overview") || "/overview";

  if (!email || !password) {
    return { error: "Bitte E-Mail und Passwort eingeben." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // Keep the message generic — don't leak which field was wrong.
    return { error: "Anmeldung fehlgeschlagen. E-Mail oder Passwort ist falsch." };
  }

  revalidatePath("/", "layout");
  // redirect() throws internally — must be outside the try/catch above.
  redirect(redirectTo.startsWith("/") ? redirectTo : "/overview");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
