import type { ReactElement } from "react";

import { redirect } from "next/navigation";

import { HostFormClient } from "@/components/features/host-create/HostFormClient";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { getHostSessionEmail } from "@/lib/auth";

export async function HostCreatePage(): Promise<ReactElement> {
  const hostSessionEmail = await getHostSessionEmail();

  if (!hostSessionEmail) {
    redirect("/host/login");
  }

  return (
    <div>
      <SiteHeader />
      <section style={{ borderBottom: "2px solid var(--ink)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 18px" }}>
          <div className="label" style={{ marginBottom: 10 }}>
            For hosts
          </div>
          <h1 className="display" style={{ fontSize: "clamp(44px, 8vw, 96px)", margin: "0 0 12px", letterSpacing: "-.04em" }}>
            Post your{" "}
            <span className="serif-display" style={{ fontStyle: "italic", textTransform: "lowercase" }}>
              night.
            </span>
          </h1>
          <p style={{ maxWidth: 560, color: "var(--ink-2)", fontSize: 16, margin: 0 }}>
            Three quick steps. Your post goes live the moment you publish → players can sign up immediately.
          </p>
        </div>
      </section>
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 18px 40px" }}>
        <HostFormClient hostSessionEmail={hostSessionEmail} />
      </section>
      <SiteFooter />
    </div>
  );
}
