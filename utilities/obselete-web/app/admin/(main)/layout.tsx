import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { AdminBottomDock } from "@/components/admin/admin-bottom-dock";
import { AdminDesktopNav } from "@/components/admin/admin-desktop-nav";
import { AdminGmailGateProvider } from "@/components/admin/admin-gmail-gate-context";
import { PostLoginGmailPrompt } from "@/components/admin/post-login-gmail-prompt";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { isAllowedAdminEmail } from "@/lib/auth";

export default async function AdminMainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const allowlisted = isAllowedAdminEmail(user?.email);
  const { data: settings } = await supabase
    .from("admin_settings")
    .select("gmail_refresh_token")
    .eq("id", 1)
    .maybeSingle();
  const gmailConnected = Boolean(settings?.gmail_refresh_token?.trim());

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-30 border-b bg-card/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-12 max-w-5xl items-center gap-2 px-3 sm:h-14 sm:gap-3 sm:px-4 xl:max-w-6xl">
          <Button variant="ghost" size="icon" className="size-9 shrink-0 sm:size-10" asChild>
            <Link href="/" aria-label="Back to site">
              <ArrowLeft className="size-5" />
            </Link>
          </Button>
          <span className="hidden shrink-0 text-sm font-semibold tracking-tight text-foreground/90 md:inline">
            Admin
          </span>
          <AdminDesktopNav />
          <span className="min-w-0 flex-1 text-center text-base font-semibold tracking-tight sm:text-lg md:hidden">
            Admin
          </span>
          <SignOutButton className="shrink-0" />
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 pb-24 sm:px-6 md:pb-8 lg:py-10 xl:max-w-6xl">
        <AdminGmailGateProvider gmailConnected={gmailConnected}>
          <Suspense fallback={null}>
            <PostLoginGmailPrompt
              gmailConnected={gmailConnected}
              allowlisted={allowlisted}
            />
          </Suspense>
          {children}
        </AdminGmailGateProvider>
      </div>
      <Suspense fallback={null}>
        <AdminBottomDock />
      </Suspense>
    </div>
  );
}
