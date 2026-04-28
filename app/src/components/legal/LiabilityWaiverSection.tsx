export function LiabilityWaiverSection() {
  return (
    <div style={{ fontSize: 14, lineHeight: 1.55, color: "var(--ink)" }}>
      <p style={{ margin: 0, fontWeight: 700 }}>Please read this waiver carefully before proceeding.</p>

      <h3 className="mono" style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 700, color: "var(--accent-deep)", margin: "24px 0 0" }}>
        DESCRIPTION OF ACTIVITY
      </h3>
      <p style={{ margin: "10px 0 0", color: "var(--ink-2)" }}>
        This waiver applies to participation in recreational drop-in volleyball sessions, including indoor and/or outdoor
        volleyball games, warm-up activities, drills, and any associated physical activities.
      </p>

      <h3 className="mono" style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 700, color: "var(--accent-deep)", margin: "24px 0 0" }}>
        ACKNOWLEDGMENT OF RISKS
      </h3>
      <p style={{ margin: "10px 0 0", color: "var(--ink-2)" }}>
        I acknowledge and understand that participation in recreational volleyball involves inherent risks, dangers, and
        hazards, including but not limited to:
      </p>
      <ul style={{ margin: "10px 0 0", paddingLeft: 22, color: "var(--ink-2)" }}>
        <li style={{ marginBottom: 6 }}>Physical contact with other players, the ball, nets, posts, or facility structures</li>
        <li style={{ marginBottom: 6 }}>Slipping, tripping, or falling on playing surfaces</li>
        <li style={{ marginBottom: 6 }}>Sprains, strains, fractures, dislocations, or other musculoskeletal injuries</li>
        <li style={{ marginBottom: 6 }}>Head, neck, or spinal injuries</li>
        <li style={{ marginBottom: 6 }}>Eye injuries or dental injuries</li>
        <li style={{ marginBottom: 6 }}>Cardiovascular events or exertion-related illness</li>
        <li style={{ marginBottom: 6 }}>Aggravation of pre-existing medical conditions</li>
        <li style={{ marginBottom: 6 }}>Actions or negligence of other participants</li>
      </ul>
      <p style={{ margin: "12px 0 0", color: "var(--ink-2)" }}>
        I confirm that I am physically fit and have no medical condition that would prevent my safe participation in this
        activity.
      </p>

      <h3 className="mono" style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 700, color: "var(--accent-deep)", margin: "24px 0 0" }}>
        WAIVER AND RELEASE OF LIABILITY
      </h3>
      <p style={{ margin: "10px 0 0", color: "var(--ink-2)" }}>
        In consideration of being permitted to participate in the drop-in volleyball program, I agree to the following:
      </p>
      <ol style={{ margin: "10px 0 0", paddingLeft: 22, color: "var(--ink-2)" }}>
        <li style={{ marginBottom: 12 }}>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>Release of claims: </span>I, on behalf of myself, my
          heirs, executors, administrators, and assigns, voluntarily release, waive, and discharge the organization, its
          owners, operators, directors, officers, employees, volunteers, and agents (collectively, the &quot;Released
          Parties&quot;) from any and all claims, demands, losses, damages, actions, or causes of action arising out of or
          related to my participation, including those caused by the <span style={{ fontWeight: 700, color: "var(--ink)" }}>negligence</span>{" "}
          of the Released Parties, to the extent permitted by Ontario law.
        </li>
        <li style={{ marginBottom: 12 }}>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>Assumption of risk: </span>I voluntarily assume all risks
          associated with participation in drop-in volleyball, whether known or unknown, foreseen or unforeseen.
        </li>
        <li style={{ marginBottom: 12 }}>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>Indemnification: </span>I agree to indemnify and hold
          harmless the Released Parties from any claims, costs, or liabilities (including legal fees) arising from my
          participation or conduct during the activity.
        </li>
        <li style={{ marginBottom: 12 }}>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>Medical authorization: </span>In the event of an emergency,
          I authorize the Released Parties to arrange for medical treatment at my expense if I am unable to authorize
          treatment myself.
        </li>
        <li style={{ marginBottom: 12 }}>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>Rules and conduct: </span>I agree to follow all facility
          rules, program guidelines, and instructions provided by staff or organizers. I understand that I may be removed
          from the activity for unsafe or inappropriate conduct without refund.
        </li>
      </ol>

      <h3 className="mono" style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 700, color: "var(--accent-deep)", margin: "24px 0 0" }}>
        GOVERNING LAW
      </h3>
      <p style={{ margin: "10px 0 0", color: "var(--ink-2)" }}>
        This waiver is governed by the laws of the <span style={{ fontWeight: 700, color: "var(--ink)" }}>Province of Ontario</span>{" "}
        and the applicable laws of <span style={{ fontWeight: 700, color: "var(--ink)" }}>Canada</span>. Any disputes shall be subject to the
        exclusive jurisdiction of the courts of Ontario. If any provision of this waiver is found to be invalid or
        unenforceable, the remaining provisions shall continue in full force and effect.
      </p>

      <div
        style={{
          marginTop: 24,
          border: "1.5px solid var(--ink-3)",
          borderRadius: 6,
          background: "var(--bg-2)",
          padding: "12px 14px",
          fontSize: 12,
          color: "var(--ink-2)",
        }}
      >
        <p style={{ margin: 0, fontWeight: 700, color: "var(--ink)" }}>Legal notice</p>
        <p style={{ margin: "8px 0 0" }}>
          This waiver is provided for general informational purposes and does not constitute legal advice. Please consult a
          licensed Ontario lawyer before use to ensure compliance with the <span style={{ fontStyle: "italic" }}>Occupiers&apos; Liability Act, R.S.O. 1990</span>{" "}
          and the <span style={{ fontStyle: "italic" }}>Limitations Act, 2002</span>.
        </p>
      </div>
    </div>
  );
}
