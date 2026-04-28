"use client";

import { useState, useTransition } from "react";

import { signupForGame } from "@/server/actions/signup";
import type { GameKind } from "@/types/domain";

type SignupStep = "intro" | "form" | "interac" | "sent";

export function SignupForm({
  gameId,
  priceCents,
  signedCount,
  capacity,
  hostName,
  hostEmail,
  gameTitle,
  startsAtDisplay,
  kind,
}: {
  gameId: string;
  priceCents: number;
  signedCount: number;
  capacity: number;
  hostName: string;
  hostEmail: string;
  gameTitle: string;
  startsAtDisplay: string;
  kind: GameKind;
}) {
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<SignupStep>("intro");
  const [playerName, setPlayerName] = useState("");
  const [playerEmail, setPlayerEmail] = useState("");
  const [paymentCode, setPaymentCode] = useState<string | null>(null);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

  const spotsLeft = Math.max(capacity - signedCount, 0);
  const priceWhole = Math.floor(priceCents / 100);
  const pctFill = capacity > 0 ? Math.min(100, (signedCount / capacity) * 100) : 0;
  const hostFirst = hostName.trim().split(/\s+/)[0] ?? "Host";

  const interacMessage =
    paymentCode &&
    `Hi ${hostFirst}! Sending $${priceWhole} for ${gameTitle} on ${startsAtDisplay}. Reference: ${paymentCode}. → ${playerName || "[Your name]"}`;

  function copyText(text: string, key: string): void {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1400);
  }

  function submitToServer(): void {
    const formData = new FormData();
    formData.set("gameId", gameId);
    formData.set("playerName", playerName);
    formData.set("playerEmail", playerEmail);
    setErr(null);
    startTransition(async () => {
      const res = await signupForGame(formData);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setPaymentCode(res.data.paymentCode);
      setWaitlistJoined(res.data.waitlist);
      setStep("interac");
    });
  }

  const introLabel =
    spotsLeft <= 0 ? "Join wait-list" : kind === "dropin" ? "Sign me up" : "Register team";

  if (step === "sent" && paymentCode) {
    return (
      <div className="card accent" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "2px solid var(--ink)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="display" style={{ fontSize: 14 }}>
            {waitlistJoined ? "YOU'RE ON THE LIST" : "YOU'RE IN"}
          </span>
          <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>
            {paymentCode}
          </span>
        </div>
        <div style={{ padding: 22, background: "var(--paper)" }}>
          <div
            className="display"
            style={{ fontSize: 38, lineHeight: 0.95, marginBottom: 10, letterSpacing: "-.03em" }}
          >
            See you
            <br />
            <span className="serif-display" style={{ fontStyle: "italic", textTransform: "lowercase" }}>
              on court.
            </span>
          </div>
          <p style={{ margin: "0 0 18px", fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>
            Your spot is held. We auto-match your reference code in the Interac message → usually within a minute of it
            landing → and your status flips to confirmed.
          </p>
          <div className="card thin" style={{ padding: 14, background: "var(--bg)", marginBottom: 14, boxShadow: "none" }}>
            <div
              className="mono"
              style={{
                fontSize: 10,
                letterSpacing: ".14em",
                color: "var(--ink-3)",
                marginBottom: 6,
                fontWeight: 700,
              }}
            >
              PAYMENT STATUS
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 700 }}>
              <span
                className="pulse"
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "var(--accent)",
                  border: "2px solid var(--ink)",
                }}
              />
              Awaiting confirmation from {hostFirst}
            </div>
          </div>
          <button type="button" className="btn ghost sm" style={{ width: "100%" }} disabled title="Coming soon">
            Cancel my spot
          </button>
        </div>
      </div>
    );
  }

  if (step === "interac" && paymentCode && interacMessage) {
    return (
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "2px solid var(--ink)",
            background: "var(--ink)",
            color: "var(--paper)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="display" style={{ fontSize: 14, color: "var(--accent)" }}>
            SEND INTERAC E-TRANSFER
          </span>
          <span className="chip gold">2 / 2</span>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <div
                className="mono"
                style={{ fontSize: 10, letterSpacing: ".14em", color: "var(--ink-3)", fontWeight: 700 }}
              >
                AMOUNT
              </div>
              <div className="display" style={{ fontSize: 34, lineHeight: 1, letterSpacing: "-.03em" }}>
                ${priceWhole}.00
              </div>
            </div>
            <div>
              <div
                className="mono"
                style={{ fontSize: 10, letterSpacing: ".14em", color: "var(--ink-3)", fontWeight: 700 }}
              >
                REFERENCE
              </div>
              <div className="display" style={{ fontSize: 18, lineHeight: 1.2, marginTop: 6 }}>
                {paymentCode}
              </div>
            </div>
          </div>
          <div className="label">Send to</div>
          <div
            className="card thin"
            style={{
              padding: "10px 12px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 10,
              background: "var(--bg)",
            }}
          >
            <span className="mono" style={{ fontSize: 13.5, fontWeight: 700 }}>
              {hostEmail}
            </span>
            <button type="button" onClick={() => copyText(hostEmail, "email")} className="btn xs">
              {copied === "email" ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <div className="label">Auto-generated message</div>
          <div className="card thin" style={{ padding: "10px 12px", marginBottom: 14, background: "var(--bg)" }}>
            <div style={{ fontSize: 13, lineHeight: 1.5, marginBottom: 8 }}>{interacMessage}</div>
            <button type="button" onClick={() => copyText(interacMessage, "msg")} className="btn xs ghost">
              {copied === "msg" ? "✓ Copied" : "Copy message"}
            </button>
          </div>
          <ol style={{ paddingLeft: 18, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.6, margin: "0 0 16px" }}>
            <li>Open your bank app → Interac e-Transfer</li>
            <li>
              Send <strong>${priceWhole}</strong> to <strong>{hostEmail}</strong>
            </li>
            <li>Paste the reference in the message field</li>
            <li>Tap &quot;I sent it&quot; so your host knows to expect it</li>
          </ol>
          <button type="button" onClick={() => setStep("sent")} className="btn lg accent" style={{ width: "100%" }}>
            I sent the e-Transfer ✓
          </button>
        </div>
      </div>
    );
  }

  if (step === "form") {
    return (
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "2px solid var(--ink)",
            background: "var(--accent)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span className="display" style={{ fontSize: 14 }}>
            YOUR INFO
          </span>
          <span className="chip">1 / 2</span>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="field">
            <label className="label">Full name</label>
            <input
              className="input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="field">
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={playerEmail}
              onChange={(e) => setPlayerEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <div
              className="mono"
              style={{
                fontSize: 11,
                color: "var(--ink-3)",
                marginTop: 6,
                fontWeight: 600,
                letterSpacing: ".04em",
                lineHeight: 1.5,
              }}
            >
              Use the email tied to your <strong style={{ color: "var(--ink)" }}>active Interac account</strong> → we
              match it against the e-Transfer to confirm your spot.
            </div>
          </div>
          {err ? (
            <p style={{ margin: 0, color: "var(--warn)", fontSize: 13 }}>{err}</p>
          ) : null}
          <button
            type="button"
            onClick={submitToServer}
            className="btn lg"
            disabled={pending || !playerName.trim() || !playerEmail.trim()}
            style={{ width: "100%", opacity: !playerName || !playerEmail ? 0.4 : 1 }}
          >
            {pending ? "Creating your signup…" : "Continue to Interac →"}
          </button>
          <button type="button" onClick={() => setStep("intro")} className="btn ghost sm" style={{ width: "100%" }}>
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      <div
        style={{
          background: "var(--ink)",
          color: "var(--paper)",
          padding: "18px 22px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            className="mono"
            style={{ fontSize: 10, letterSpacing: ".14em", color: "rgba(251,248,241,.5)", fontWeight: 700 }}
          >
            {kind === "dropin" ? "PER PLAYER" : "PER TEAM"}
          </div>
          <div className="display" style={{ fontSize: 38, color: "var(--accent)", lineHeight: 1 }}>
            ${priceWhole}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            className="mono"
            style={{ fontSize: 10, letterSpacing: ".14em", color: "rgba(251,248,241,.5)", fontWeight: 700 }}
          >
            SPOTS LEFT
          </div>
          <div className="display" style={{ fontSize: 38, lineHeight: 1 }}>
            {spotsLeft}
          </div>
        </div>
      </div>
      <div style={{ padding: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--ink-3)",
            marginBottom: 6,
            letterSpacing: ".08em",
            fontWeight: 700,
          }}
          className="mono"
        >
          <span>{signedCount} SIGNED</span>
          <span>OF {capacity}</span>
        </div>
        <div
          style={{
            height: 10,
            borderRadius: 0,
            background: "var(--bg)",
            border: "2px solid var(--ink)",
            overflow: "hidden",
            marginBottom: 18,
          }}
        >
          <div style={{ height: "100%", width: `${pctFill}%`, background: "var(--accent)" }} />
        </div>
        <button type="button" onClick={() => setStep("form")} className="btn lg accent" style={{ width: "100%" }}>
          {introLabel} →
        </button>
        <div
          className="mono"
          style={{
            fontSize: 10,
            textAlign: "center",
            marginTop: 10,
            color: "var(--ink-3)",
            letterSpacing: ".14em",
            fontWeight: 700,
          }}
        >
          NO CARD FEES · INTERAC ONLY
        </div>
      </div>
    </div>
  );
}
