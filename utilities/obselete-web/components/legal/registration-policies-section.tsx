"use client";

import { cn } from "@/lib/utils";
import {
  CANCELLATION_MIN_HOURS_BEFORE_GAME,
  GAME_SCHEDULE_TIMEZONE_LABEL,
  PAYMENT_CODE_EXPIRY_MINUTES,
  WAITLIST_INVITE_MINUTES,
} from "@/lib/registration-policy";

export function RegistrationPoliciesSection({ className }: { className?: string }) {
  return (
    <div className={cn("text-sm leading-relaxed text-foreground", className)}>
      <h3 className="font-heading text-xs font-semibold uppercase tracking-wide text-primary">
        Payment code ({PAYMENT_CODE_EXPIRY_MINUTES} minutes)
      </h3>
      <p className="mt-2 text-muted-foreground">
        Your payment code expires in {PAYMENT_CODE_EXPIRY_MINUTES} minutes. If we do not receive your e-transfer in
        time, your signup is automatically cancelled and the spot can go to someone else.
      </p>

      <h3 className="mt-6 font-heading text-xs font-semibold uppercase tracking-wide text-primary">
        Waitlist invite ({WAITLIST_INVITE_MINUTES} minutes)
      </h3>
      <p className="mt-2 text-muted-foreground">
        When a spot opens, invited waitlisted players have {WAITLIST_INVITE_MINUTES} minutes to complete payment and
        claim the released spot. If the window passes, the invite expires and we may offer the spot to the next person
        on the list.
      </p>

      <h3 className="mt-6 font-heading text-xs font-semibold uppercase tracking-wide text-primary">
        Cancellation ({CANCELLATION_MIN_HOURS_BEFORE_GAME}+ hours before start)
      </h3>
      <p className="mt-2 text-muted-foreground">
        To cancel under our policy, contact us at least {CANCELLATION_MIN_HOURS_BEFORE_GAME} hours before the scheduled
        game start. Start times are based on the date and time shown on the run, interpreted in{" "}
        {GAME_SCHEDULE_TIMEZONE_LABEL}.
      </p>

      <h3 className="mt-6 font-heading text-xs font-semibold uppercase tracking-wide text-primary">Refunds</h3>
      <p className="mt-2 text-muted-foreground">
        Any refunds owed are sent after games are settled (for example, if a run is cancelled or adjusted after
        accounting). If nothing is owed, you will not receive a refund message.
      </p>
    </div>
  );
}
