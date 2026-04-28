import { Suspense } from "react";
import { format } from "date-fns";
import { Lock } from "lucide-react";
import Link from "next/link";

import { LeaguePortalLoginForm } from "@/components/features/leagues/LeaguePortalLoginForm";
import { LeaguePortalRecoveryBanner } from "@/components/games/league-portal-recovery-banner";
import { PlayerPageHeading } from "@/components/layout/player-page-heading";
import { SignOutLeaguePortalButton } from "@/components/features/leagues/SignOutLeaguePortalButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getLeaguePortalAccessState } from "@/lib/league-portal-access";
import { getLeagueTeamPortalBundlesForEmail } from "@/server/queries/team-portal";

function waiverBadge(ok: boolean) {
  return (
    <Badge variant={ok ? "default" : "secondary"} className="rounded-md">
      {ok ? "Waiver" : "No waiver"}
    </Badge>
  );
}

function payBadge(status: string) {
  const label =
    status === "confirmed"
      ? "Paid"
      : status === "pending"
        ? "Payment pending"
        : status === "cancelled"
          ? "Cancelled"
          : "→";
  return (
    <Badge
      variant={status === "confirmed" ? "default" : "outline"}
      className="rounded-md"
    >
      {label}
    </Badge>
  );
}

export async function LeagueTeamPortalPage() {
  const { isAuthenticated, email } = await getLeaguePortalAccessState();
  const bundles =
    isAuthenticated && email
      ? await getLeagueTeamPortalBundlesForEmail(email)
      : [];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 lg:max-w-4xl lg:py-10 xl:max-w-6xl 2xl:max-w-6xl">
      <PlayerPageHeading
        title="League team portal"
        description="Schedule and roster for your registered league teams."
      />
      <Suspense fallback={null}>
        <LeaguePortalRecoveryBanner />
      </Suspense>
      <div className="mt-6 sm:mt-8">
        {!isAuthenticated ? (
          <Card className="gap-0 overflow-hidden rounded-xl border border-accent/35 shadow-sm">
            <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-14">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-accent/10 text-accent sm:size-16">
                <Lock className="size-7 sm:size-8" aria-hidden />
              </div>
              <h2 className="font-heading text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Sign in to your team
              </h2>
              <p className="mt-2 max-w-md text-sm text-muted-foreground">
                Use the email your captain added to the roster. We&apos;ll email you a secure magic link.
              </p>
              <div className="mt-6 w-full max-w-md text-left">
                <LeaguePortalLoginForm />
              </div>
            </CardContent>
          </Card>
        ) : bundles.length === 0 ? (
          <Card className="rounded-xl border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No league teams found for this session. Try signing in with the email on your roster.
              <div className="mt-4 flex justify-center gap-2">
                <SignOutLeaguePortalButton />
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{email}</span>
              </p>
              <SignOutLeaguePortalButton />
            </div>
            {bundles.map((b) => (
              <Card key={b.teamId} className="overflow-hidden rounded-xl shadow-sm">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                    <span>{b.teamName}</span>
                    <Badge variant="outline" className="rounded-md font-normal">
                      {b.leagueName} · {b.seasonName}
                    </Badge>
                    {b.role === "captain" ? (
                      <Badge className="rounded-md">Captain</Badge>
                    ) : null}
                  </CardTitle>
                  <Button variant="link" className="h-auto px-0 text-sm" asChild>
                    <Link href={`/leagues/${b.leagueSlug}/${b.seasonSlug}`}>
                      Public season page
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-8 pt-6">
                  <section>
                    <h3 className="mb-3 font-semibold tracking-tight">Schedule</h3>
                    {b.fixtures.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No fixtures linked yet. Your organizer will publish games here.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Match</TableHead>
                            <TableHead>Location</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {b.fixtures.map((f) => (
                            <TableRow key={f.fixtureId}>
                              <TableCell>
                                {format(new Date(f.game.date + "T12:00:00"), "MMM d, yyyy")}
                              </TableCell>
                              <TableCell>{f.game.time}</TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {f.homeTeamName ?? "TBD"} vs {f.awayTeamName ?? "TBD"}
                                </span>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <div className="font-medium">{f.game.location}</div>
                                  {f.game.address ? (
                                    <div className="text-muted-foreground">{f.game.address}</div>
                                  ) : null}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </section>
                  <section>
                    <h3 className="mb-3 font-semibold tracking-tight">Roster</h3>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {b.roster.map((r) => (
                          <TableRow key={r.id}>
                            <TableCell>{r.name ?? "→"}</TableCell>
                            <TableCell className="text-muted-foreground">{r.email}</TableCell>
                            <TableCell className="capitalize">{r.role}</TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                {waiverBadge(r.waiver_accepted)}
                                {payBadge(r.payment_status)}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </section>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
