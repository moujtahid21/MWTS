import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return NextResponse.json({
    email: user?.email,
    app_metadata: user?.app_metadata,   // ← hier sollte role + tenant_id stehen
  });
}