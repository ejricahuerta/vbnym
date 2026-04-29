import type { ReactElement } from "react";
import Link from "next/link";
import { Suspense } from "react";

import { HostAccessRequestForm } from "@/components/features/host-request/HostAccessRequestForm";
import { LoginCenteredLayout } from "@/components/features/login/LoginCenteredLayout";
import { getLiveGameSummaryForHostRequest } from "@/server/queries/games";
import { listOrganizations } from "@/server/queries/organizations";

export async function HostRequestPage({ gameId }: { gameId?: string }): Promise<ReactElement> {
  const [organizations, gameSummary] = await Promise.all([
    listOrganizations(),
    gameId ? getLiveGameSummaryForHostRequest(gameId) : Promise.resolve(null),
  ]);

  return (
    <LoginCenteredLayout
      leftEyebrow={
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", color: "inherit", textDecoration: "none" }} className="display">
          6IX BACK
        </Link>
      }
      leftTitle="Host"
      leftAccent="access."
      leftDescription="Ask to run games on 6IX BACK. We will review requests and email you if you are approved."
      leftLinks={[{ prefix: "Already approved?", label: "Host sign-in", href: "/host/login" }]}
      rightTitle="Request access"
    >
      <Suspense fallback={<p style={{ fontSize: 14 }}>Loading…</p>}>
        <HostAccessRequestForm organizations={organizations} gameSummary={gameSummary} />
      </Suspense>
    </LoginCenteredLayout>
  );
}
