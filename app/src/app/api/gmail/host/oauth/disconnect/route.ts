import { NextResponse } from "next/server";

import { getHostSessionEmail } from "@/lib/auth";
import { appOrigin } from "@/lib/env";
import { hostGmailConnectionId } from "@/lib/host-gmail";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(): Promise<Response> {
  const hostEmail = await getHostSessionEmail();
  if (!hostEmail) {
    return NextResponse.redirect(`${appOrigin()}/host/login?gmail=unauthorized`);
  }
  const supabase = createServerSupabase();
  await supabase.from("gmail_connections").delete().eq("id", hostGmailConnectionId(hostEmail));
  return NextResponse.redirect(`${appOrigin()}/host?gmail=disconnected`);
}
