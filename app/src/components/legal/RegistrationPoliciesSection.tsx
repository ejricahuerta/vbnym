import {
  CANCELLATION_MIN_HOURS_BEFORE_GAME,
  GAME_SCHEDULE_TIMEZONE_LABEL,
  PAYMENT_CODE_EXPIRY_MINUTES,
  WAITLIST_INVITE_MINUTES,
} from "@/lib/registration-policy";

export function RegistrationPoliciesSection() {
  return (
    <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink)" }}>
      <h3 className="mono" style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 700, color: "var(--accent-deep)", margin: 0 }}>
        PAYMENT CODE ({PAYMENT_CODE_EXPIRY_MINUTES} MINUTES)
      </h3>
      <p style={{ margin: "10px 0 0", color: "var(--ink-2)" }}>
        Your payment code expires in {PAYMENT_CODE_EXPIRY_MINUTES} minutes. If we do not receive your e-transfer in time,
        your signup is automatically cancelled and the spot can go to someone else.
      </p>

      <h3 className="mono" style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 700, color: "var(--accent-deep)", margin: "24px 0 0" }}>
        WAITLIST INVITE ({WAITLIST_INVITE_MINUTES} MINUTES)
      </h3>
      <p style={{ margin: "10px 0 0", color: "var(--ink-2)" }}>
        When a spot opens, invited waitlisted players have {WAITLIST_INVITE_MINUTES} minutes to complete payment and claim
        the released spot. If the window passes, the invite expires and we may offer the spot to the next person on the
        list.
      </p>

      <h3 className="mono" style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 700, color: "var(--accent-deep)", margin: "24px 0 0" }}>
        CANCELLATION ({CANCELLATION_MIN_HOURS_BEFORE_GAME}+ HOURS BEFORE START)
      </h3>
      <p style={{ margin: "10px 0 0", color: "var(--ink-2)" }}>
        To cancel under our policy, contact us at least {CANCELLATION_MIN_HOURS_BEFORE_GAME} hours before the scheduled game
        start. Start times are based on the date and time shown on the run, interpreted in {GAME_SCHEDULE_TIMEZONE_LABEL}.
      </p>

      <h3 className="mono" style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 700, color: "var(--accent-deep)", margin: "24px 0 0" }}>
        REFUNDS
      </h3>
      <p style={{ margin: "10px 0 0", color: "var(--ink-2)" }}>
        Any refunds owed are sent after games are settled (for example, if a run is cancelled or adjusted after accounting).
        If nothing is owed, you will not receive a refund message.
      </p>
    </div>
  );
}
