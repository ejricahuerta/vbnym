import Link from "next/link";

import { SixBackSection } from "@/components/shared/SixBackPageShell";
import { Button } from "@/components/ui/button";

const CARDS = [
  { href: "/admin/games", title: "Events", detail: "Manage scheduled games and publishing." },
  { href: "/admin/hosts", title: "Hosts", detail: "Track host activity and coverage." },
  { href: "/admin/players", title: "Players", detail: "Review player participation and status." },
  { href: "/admin/venues", title: "Venues", detail: "Maintain venue locations and setup." },
  { href: "/admin/reports", title: "Reports", detail: "Review operational issues and alerts." },
] as const;

export function AdminOverviewPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="display text-4xl">Control Room</h1>
        <p className="mt-2 text-sm text-muted-foreground">Reference overview tab with quick links to each admin section.</p>
      </div>
      <SixBackSection eyebrow="Admin" title="Overview" className="mt-0">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {CARDS.map((card) => (
            <article key={card.href} className="card p-4">
              <p className="text-base font-semibold">{card.title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{card.detail}</p>
              <Button asChild variant="outline" className="mt-3">
                <Link href={card.href}>Open</Link>
              </Button>
            </article>
          ))}
        </div>
      </SixBackSection>
    </div>
  );
}
