import { NextResponse } from "next/server";

import { isAdminAuthorized } from "@/lib/auth";
import { appOrigin } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST() {
  if (!(await isAdminAuthorized())) {
    return NextResponse.redirect(`${appOrigin()}/admin?gmail=unauthorized`);
  }
  const supabase = createServerSupabase();
  await supabase.from("gmail_connections").delete().eq("id", "universal");
  return NextResponse.redirect(`${appOrigin()}/admin?gmail=disconnected`);
}
