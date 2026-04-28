import { Suspense } from "react";
import { AppShellHeader } from "@/components/layout/app-shell-header";
import { AppMobileDock } from "@/components/layout/app-mobile-dock";

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <AppShellHeader />
      <div className="flex min-h-0 flex-1 flex-col pb-[5.5rem] lg:pb-6">{children}</div>
      <Suspense fallback={null}>
        <AppMobileDock />
      </Suspense>
    </div>
  );
}
