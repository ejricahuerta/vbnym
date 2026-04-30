import { NextResponse } from "next/server";

import { getHostSessionEmail } from "@/lib/auth";
import { buildGmailConnectForPaymentSyncEmailTemplate } from "@/lib/email-templates";
import { appOrigin } from "@/lib/env";
import { hostGmailConnectionId } from "@/lib/host-gmail";
import { sendTransactionalEmailResult } from "@/lib/send-email";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(): Promise<Response> {
  const hostEmail = await getHostSessionEmail();
  if (!hostEmail) {
    return NextResponse.redirect(`${appOrigin()}/host/login?gmail=unauthorized`);
  }
  const supabase = createServerSupabase();
  await supabase.from("gmail_connections").delete().eq("id", hostGmailConnectionId(hostEmail));
  const template = buildGmailConnectForPaymentSyncEmailTemplate({
    reconnectUrl: `${appOrigin()}/api/gmail/host/oauth/start`,
    reason: "disconnect",
  });
  await sendTransactionalEmailResult({
    to: hostEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
  return NextResponse.redirect(`${appOrigin()}/host?gmail=disconnected`);
}
