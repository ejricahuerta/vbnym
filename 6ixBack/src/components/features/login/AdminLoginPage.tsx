import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminMagicLinkForm } from "@/components/features/login/AdminMagicLinkForm";
import { LoginCenteredLayout } from "@/components/features/login/LoginCenteredLayout";
import { isAdminAuthorized } from "@/lib/auth";

export async function AdminLoginPage() {
  const adminOk = await isAdminAuthorized();
  if (adminOk) {
    redirect("/admin");
  }

  return (
    <LoginCenteredLayout
      leftEyebrow={
        <Link href="/" style={{ display: "inline-flex", alignItems: "center", color: "inherit", textDecoration: "none" }} className="display">
          6IX BACK
        </Link>
      }
      leftTitle="Control"
      leftAccent="room."
    >
      <Suspense fallback={<p style={{ fontSize: 14 }}>Loading…</p>}>
        <AdminMagicLinkForm />
      </Suspense>
    </LoginCenteredLayout>
  );
}
