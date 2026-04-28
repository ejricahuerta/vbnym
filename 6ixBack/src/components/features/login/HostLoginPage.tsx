import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { HostMagicLinkForm } from "@/components/features/login/HostMagicLinkForm";
import { LoginCenteredLayout } from "@/components/features/login/LoginCenteredLayout";
import { getHostSessionEmail } from "@/lib/auth";

export async function HostLoginPage() {
  const hostSession = await getHostSessionEmail();
  if (hostSession) {
    redirect("/host");
  }

  return (
    <LoginCenteredLayout
      leftEyebrow={
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", color: "inherit", textDecoration: "none" }} className="display">
          6IX BACK
        </Link>
      }
      leftTitle="Host"
      leftAccent="sign-in."
      leftDescription="Magic link only. Your email must already be approved as a host."
      leftLinks={[
        { prefix: "Not approved yet?", label: "Request host access", href: "/host/request" },
        { prefix: "Player account?", label: "Player sign-in", href: "/login" },
        { prefix: "Want to join a game?", label: "Browse games", href: "/browse" },
      ]}
      rightTitle="Magic link"
    >
      <Suspense fallback={<p style={{ fontSize: 14 }}>Loading…</p>}>
        <HostMagicLinkForm />
      </Suspense>
    </LoginCenteredLayout>
  );
}
