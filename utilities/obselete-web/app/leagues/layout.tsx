import { Suspense } from "react";

import { MobileDock } from "@/components/layout/mobile-dock";
import { SiteHeader } from "@/components/layout/site-header";

export default function LeaguesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-background pb-24 md:pb-8">
      <SiteHeader />
      {children}
      <Suspense fallback={null}>
        <MobileDock />
      </Suspense>
    </div>
  );
}
