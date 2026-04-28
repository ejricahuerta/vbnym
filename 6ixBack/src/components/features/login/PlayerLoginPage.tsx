import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { LoginCenteredLayout } from "@/components/features/login/LoginCenteredLayout";
import { PlayerPortalLoginForm } from "@/components/features/player/PlayerPortalLoginForm";
import { getPlayerSessionEmail } from "@/lib/auth";

export async function PlayerLoginPage() {
  const playerSession = await getPlayerSessionEmail();
  if (playerSession) {
    redirect("/player");
  }

  return (
    <LoginCenteredLayout
      leftEyebrow={
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", color: "inherit", textDecoration: "none" }} className="display">
          6IX BACK
        </Link>
      }
      leftTitle="Welcome"
      leftAccent="back."
      leftDescription="Sign in with the same email you used for signup. We send a secure magic link to this browser."
      leftLinks={[
        { prefix: "Hosting a game?", label: "Host sign-in", href: "/host/login" },
        { prefix: "Back to browsing?", label: "Find a game", href: "/browse" },
      ]}
      rightTitle="Magic link"
    >
      <Suspense fallback={<p style={{ fontSize: 14 }}>Loading…</p>}>
        <PlayerPortalLoginForm />
      </Suspense>
    </LoginCenteredLayout>
  );
}
