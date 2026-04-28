import Link from "next/link";
import { notFound } from "next/navigation";

import { LeagueInviteAcceptForm } from "@/components/features/leagues/LeagueInviteAcceptForm";
import { PlayerPageHeading } from "@/components/layout/player-page-heading";
import { SixBackPageShell, SixBackSection } from "@/components/shared/SixBackPageShell";
import { Card, CardContent } from "@/components/ui/card";
import { getLeagueInviteDetailsByToken } from "@/server/queries/league-invite-details";

type Props = { token: string };
const INVITE_EXPIRY_CHECK_EPOCH_MS = Date.now();

export async function LeagueInviteAcceptPage({ token }: Props) {
  const details = await getLeagueInviteDetailsByToken(token);
  if (!details) notFound();

  const exp = new Date(details.invite.expires_at).getTime();
  const expired = Number.isFinite(exp) && exp < INVITE_EXPIRY_CHECK_EPOCH_MS;
  const usable = details.invite.status === "pending" && !expired;

  return (
    <SixBackPageShell className="max-w-4xl">
      <PlayerPageHeading
        title="Accept league invite"
        description={`${details.league.name} → ${details.season.name} · ${details.team.name}`}
      />
      {!usable ? (
        <Card className="mt-8 rounded-xl border-destructive/30">
          <CardContent className="py-8 text-center text-sm">
            {details.invite.status === "accepted"
              ? "This invite was already used."
              : expired
                ? "This invite has expired. Ask your captain to send a new invite."
                : "This invite is no longer valid."}
            <p className="mt-4">
              <Link href="/leagues" className="underline">
                Leagues home
              </Link>
            </p>
          </CardContent>
        </Card>
      ) : !details.waiver ? (
        <Card className="mt-8 rounded-xl">
          <CardContent className="py-8 text-sm text-muted-foreground">
            Waiver is not configured for this season. Contact the organizer.
          </CardContent>
        </Card>
      ) : (
        <SixBackSection title="Accept Invitation" eyebrow="Roster Invite" className="mt-6 space-y-6">
          <Card className="rounded-xl">
            <CardContent className="space-y-2 py-6 text-sm">
              <p className="text-muted-foreground">
                Invited email: <span className="font-medium text-foreground">{details.invite.email}</span>
              </p>
              <div className="max-h-64 overflow-auto rounded-lg border bg-muted/30 p-4 text-xs whitespace-pre-wrap">
                {details.waiver.body_text}
              </div>
            </CardContent>
          </Card>
          <LeagueInviteAcceptForm
            token={details.invite.token}
            waiverVersionLabel={details.waiver.version_label}
          />
        </SixBackSection>
      )}
    </SixBackPageShell>
  );
}
