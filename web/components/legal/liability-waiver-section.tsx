"use client";

import { cn } from "@/lib/utils";

export function LiabilityWaiverSection({ className }: { className?: string }) {
  return (
    <div className={cn("text-sm leading-relaxed text-foreground", className)}>
      <p className="font-semibold text-foreground">Please read this waiver carefully before proceeding.</p>

      <h3 className="mt-6 font-heading text-sm font-semibold tracking-wide text-primary uppercase">
        Description of activity
      </h3>
      <p className="mt-2 text-muted-foreground">
        This waiver applies to participation in recreational drop-in volleyball sessions, including indoor and/or
        outdoor volleyball games, warm-up activities, drills, and any associated physical activities.
      </p>

      <h3 className="mt-6 font-heading text-sm font-semibold tracking-wide text-primary uppercase">
        Acknowledgment of risks
      </h3>
      <p className="mt-2 text-muted-foreground">
        I acknowledge and understand that participation in recreational volleyball involves inherent risks, dangers,
        and hazards, including but not limited to:
      </p>
      <ul className="mt-3 list-disc space-y-1.5 pl-5 text-muted-foreground">
        <li>Physical contact with other players, the ball, nets, posts, or facility structures</li>
        <li>Slipping, tripping, or falling on playing surfaces</li>
        <li>Sprains, strains, fractures, dislocations, or other musculoskeletal injuries</li>
        <li>Head, neck, or spinal injuries</li>
        <li>Eye injuries or dental injuries</li>
        <li>Cardiovascular events or exertion-related illness</li>
        <li>Aggravation of pre-existing medical conditions</li>
        <li>Actions or negligence of other participants</li>
      </ul>
      <p className="mt-3 text-muted-foreground">
        I confirm that I am physically fit and have no medical condition that would prevent my safe participation in
        this activity.
      </p>

      <h3 className="mt-6 font-heading text-sm font-semibold tracking-wide text-primary uppercase">
        Waiver and release of liability
      </h3>
      <p className="mt-2 text-muted-foreground">
        In consideration of being permitted to participate in the drop-in volleyball program, I agree to the following:
      </p>
      <ol className="mt-3 list-decimal space-y-3 pl-5 text-muted-foreground">
        <li>
          <span className="font-medium text-foreground">Release of claims: </span>I, on behalf of myself, my heirs,
          executors, administrators, and assigns, voluntarily release, waive, and discharge the organization, its
          owners, operators, directors, officers, employees, volunteers, and agents (collectively, the &quot;Released
          Parties&quot;) from any and all claims, demands, losses, damages, actions, or causes of action arising out
          of or related to my participation, including those caused by the{" "}
          <span className="font-medium text-foreground">negligence</span> of the Released Parties, to the extent permitted
          by Ontario law.
        </li>
        <li>
          <span className="font-medium text-foreground">Assumption of risk: </span>I voluntarily assume all risks
          associated with participation in drop-in volleyball, whether known or unknown, foreseen or unforeseen.
        </li>
        <li>
          <span className="font-medium text-foreground">Indemnification: </span>I agree to indemnify and hold harmless the
          Released Parties from any claims, costs, or liabilities (including legal fees) arising from my participation or
          conduct during the activity.
        </li>
        <li>
          <span className="font-medium text-foreground">Medical authorization: </span>In the event of an emergency, I
          authorize the Released Parties to arrange for medical treatment at my expense if I am unable to authorize
          treatment myself.
        </li>
        <li>
          <span className="font-medium text-foreground">Rules and conduct: </span>I agree to follow all facility rules,
          program guidelines, and instructions provided by staff or organizers. I understand that I may be removed from
          the activity for unsafe or inappropriate conduct without refund.
        </li>
      </ol>

      <h3 className="mt-6 font-heading text-sm font-semibold tracking-wide text-primary uppercase">Governing law</h3>
      <p className="mt-2 text-muted-foreground">
        This waiver is governed by the laws of the <span className="font-medium text-foreground">Province of Ontario</span>{" "}
        and the applicable laws of <span className="font-medium text-foreground">Canada</span>. Any disputes shall be
        subject to the exclusive jurisdiction of the courts of Ontario. If any provision of this waiver is found to be
        invalid or unenforceable, the remaining provisions shall continue in full force and effect.
      </p>

      <div className="mt-6 rounded-lg border border-border bg-muted/40 px-3 py-3 text-xs text-muted-foreground">
        <p className="font-semibold text-foreground">Legal notice</p>
        <p className="mt-1.5">
          This waiver is provided for general informational purposes and does not constitute legal advice. Please
          consult a licensed Ontario lawyer before use to ensure compliance with the{" "}
          <span className="italic">Occupiers&apos; Liability Act, R.S.O. 1990</span> and the{" "}
          <span className="italic">Limitations Act, 2002</span>.
        </p>
      </div>
    </div>
  );
}
