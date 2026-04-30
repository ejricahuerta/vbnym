"use client";

import type { ReactElement } from "react";
import { useState, useTransition } from "react";

import { signupForGame } from "@/server/actions/signup";
import type { GameKind } from "@/types/domain";

type SignupStep = "intro" | "form" | "interac" | "sent";

type SignupFormInitialStep = "intro" | "form";

function SignupHeaderCloseButton({ onClick }: { onClick: () => void }): ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close"
      className="display"
      style={{
        width: 36,
        height: 36,
        display: "grid",
        placeItems: "center",
        border: "2px solid var(--ink)",
        background: "var(--paper)",
        color: "var(--ink)",
        fontSize: 20,
        lineHeight: 1,
        letterSpacing: 0,
        cursor: "pointer",
        padding: 0,
        flexShrink: 0,
      }}
    >
      ×
    </button>
  );
}

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
  initialStep = "intro",
  onDismissFromForm,
  onHeaderClose,
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
  /** When the intro card is shown elsewhere (e.g. mobile dock), open directly on the info step. */
  initialStep?: SignupFormInitialStep;
  /** If set, form step “Back” does this instead of returning to intro (e.g. close modal). */
  onDismissFromForm?: () => void;
  /** If set, show × in the top-right of each step’s card header (e.g. mobile modal). */
  onHeaderClose?: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState<SignupStep>(initialStep);
  const [addedByName, setAddedByName] = useState("");
  const [addedByEmail, setAddedByEmail] = useState("");
  const [includeSigner, setIncludeSigner] = useState(true);
  const [players, setPlayers] = useState<string[]>([""]);
  /** When false, solo signup (one player); group fields live inside the accordion */
  const [groupSignupOpen, setGroupSignupOpen] = useState(false);
  const [paymentCode, setPaymentCode] = useState<string | null>(null);
  const [pendingAmountCents, setPendingAmountCents] = useState<number>(priceCents);
  const [pendingPlayerCount, setPendingPlayerCount] = useState<number>(1);
  const [waitlistJoined, setWaitlistJoined] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState("");

  const spotsLeft = Math.max(capacity - signedCount, 0);
  const priceWhole = Math.floor(priceCents / 100);
  const maxAdditionalPlayers = includeSigner ? 5 : 6;
  const trimmedPlayers = players.map((name) => name.trim()).filter(Boolean);
  const playerCount = !groupSignupOpen
    ? 1
    : includeSigner
      ? trimmedPlayers.length + 1
      : trimmedPlayers.length;
  const totalAmountCents = priceCents * Math.max(playerCount, 1);
  const totalWhole = Math.floor(totalAmountCents / 100);
  const pctFill = capacity > 0 ? Math.min(100, (signedCount / capacity) * 100) : 0;
  const hostFirst = hostName.trim().split(/\s+/)[0] ?? "Host";

  const interacMessage = paymentCode;

  function copyText(text: string, key: string): void {
    void navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1400);
  }

  function submitToServer(): void {
    const formData = new FormData();
    formData.set("gameId", gameId);
    formData.set("addedByName", addedByName);
    formData.set("addedByEmail", addedByEmail);
    const solo = !groupSignupOpen;
    formData.set("includeSigner", solo ? "true" : includeSigner ? "true" : "false");
    formData.set("playersJson", JSON.stringify(solo ? [] : trimmedPlayers));
    setErr(null);
    startTransition(async () => {
      const res = await signupForGame(formData);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      setPaymentCode(res.data.paymentCode);
      setPendingAmountCents(res.data.amountCents);
      setPendingPlayerCount(res.data.playerCount);
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
            gap: 10,
          }}
        >
          <span className="display" style={{ fontSize: 14, flex: 1, minWidth: 0 }}>
            {waitlistJoined ? "YOU'RE ON THE LIST" : "YOU'RE IN"}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span className="mono" style={{ fontSize: 11, fontWeight: 700 }}>
              {paymentCode}
            </span>
            {onHeaderClose ? <SignupHeaderCloseButton onClick={onHeaderClose} /> : null}
          </div>
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
            landing → and your status flips to confirmed. If payment is still pending after 30 minutes, the pending signup
            can be auto-cancelled.
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
              Pending confirmation from {hostFirst}
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
            gap: 10,
          }}
        >
          <span className="display" style={{ fontSize: 14, color: "var(--accent)", flex: 1, minWidth: 0 }}>
            SEND INTERAC E-TRANSFER
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span className="chip gold">2 / 2</span>
            {onHeaderClose ? <SignupHeaderCloseButton onClick={onHeaderClose} /> : null}
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <div
                className="mono"
                style={{ fontSize: 10, letterSpacing: ".14em", color: "var(--ink-3)", fontWeight: 700 }}
              >
                AMOUNT
              </div>
              <div className="display" style={{ fontSize: 34, lineHeight: 1, letterSpacing: "-.03em" }}>
                ${Math.floor(pendingAmountCents / 100)}.00
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
              Send <strong>${Math.floor(pendingAmountCents / 100)}</strong> to <strong>{hostEmail}</strong>
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
            gap: 10,
          }}
        >
          <span className="display" style={{ fontSize: 14, flex: 1, minWidth: 0 }}>
            YOUR INFO
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <span className="chip">1 / 2</span>
            {onHeaderClose ? <SignupHeaderCloseButton onClick={onHeaderClose} /> : null}
          </div>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="field">
            <label className="label">Your full name</label>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 6, letterSpacing: ".04em", lineHeight: 1.4 }}>
              {groupSignupOpen
                ? "You are paying for this group → use the name on your Interac transfer."
                : "You are paying for your spot → use the name on your Interac transfer."}
            </div>
            <input
              className="input"
              value={addedByName}
              onChange={(e) => setAddedByName(e.target.value)}
              placeholder="First and last name"
            />
          </div>
          <div className="field">
            <label className="label">Your email</label>
            <input
              className="input"
              type="email"
              value={addedByEmail}
              onChange={(e) => setAddedByEmail(e.target.value)}
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
          <div className="field" style={{ marginTop: 4 }}>
            <button
              type="button"
              id="signup-group-toggle"
              aria-expanded={groupSignupOpen}
              aria-controls="signup-group-panel"
              onClick={() => {
                setGroupSignupOpen((open) => {
                  const next = !open;
                  if (next && players.length === 0) setPlayers([""]);
                  return next;
                });
              }}
              className="btn ghost sm"
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                border: "2px solid var(--ink)",
                background: "var(--bg)",
                fontWeight: 700,
              }}
            >
              <span style={{ fontSize: 13 }}>Sign up a group (optional)</span>
              <span
                className="signup-group-toggle-icon"
                data-open={groupSignupOpen ? "true" : "false"}
                style={{ fontSize: 18, lineHeight: 1, fontWeight: 800 }}
                aria-hidden
              >
                +
              </span>
            </button>
          </div>
          <div
            className="signup-group-accordion"
            data-open={groupSignupOpen ? "true" : "false"}
            aria-hidden={!groupSignupOpen}
          >
            <div className="signup-group-accordion-shell">
              <div
                id="signup-group-panel"
                role="region"
                aria-labelledby="signup-group-toggle"
                inert={!groupSignupOpen ? true : undefined}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div className="field">
                  <label className="label">Signup type</label>
                  <div style={{ display: "grid", gap: 6 }}>
                    <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                      <input type="radio" checked={includeSigner} onChange={() => setIncludeSigner(true)} />
                      Sign up myself plus players (max 6 total)
                    </label>
                    <label style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 13 }}>
                      <input type="radio" checked={!includeSigner} onChange={() => setIncludeSigner(false)} />
                      Sign up for a friend or group (max 6, excluding me)
                    </label>
                  </div>
                </div>
                <div className="field">
                  <label className="label">{includeSigner ? "Additional players" : "Players"}</label>
                  <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", marginBottom: 8, letterSpacing: ".04em" }}>
                    Use Full Name or First Name plus Last Name Initial
                  </div>
                  <div style={{ display: "grid", gap: 8 }}>
                    {players.map((name, index) => (
                      <input
                        key={`player-${index}`}
                        className="input"
                        value={name}
                        onChange={(event) => {
                          const next = [...players];
                          next[index] = event.target.value;
                          setPlayers(next);
                        }}
                        placeholder={includeSigner ? `Player ${index + 2} name` : `Player ${index + 1} name`}
                      />
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button
                      type="button"
                      className="btn xs ghost"
                      onClick={() => {
                        if (players.length < maxAdditionalPlayers) setPlayers([...players, ""]);
                      }}
                      disabled={players.length >= maxAdditionalPlayers}
                    >
                      Add player
                    </button>
                    <button
                      type="button"
                      className="btn xs ghost"
                      onClick={() => {
                        if (players.length > 1) setPlayers(players.slice(0, -1));
                      }}
                      disabled={players.length <= 1}
                    >
                      Remove last
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="card thin" style={{ padding: 10, background: "var(--bg)" }}>
            <div className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: ".04em" }}>
              {playerCount} player{playerCount === 1 ? "" : "s"} × ${priceWhole} each = ${totalWhole}
            </div>
          </div>
          {err ? (
            <p style={{ margin: 0, color: "var(--warn)", fontSize: 13 }}>{err}</p>
          ) : null}
          <button
            type="button"
            onClick={submitToServer}
            className="btn lg"
            disabled={
              pending ||
              !addedByName.trim() ||
              !addedByEmail.trim() ||
              (groupSignupOpen && !includeSigner && trimmedPlayers.length === 0)
            }
            style={{
              width: "100%",
              opacity: !addedByName || !addedByEmail ? 0.4 : 1,
            }}
          >
            {pending ? "Creating your signup…" : "Continue to Interac →"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (onDismissFromForm) {
                onDismissFromForm();
                return;
              }
              setStep("intro");
            }}
            className="btn ghost sm"
            style={{ width: "100%" }}
          >
            {onDismissFromForm ? "Close" : "Back"}
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
          display: "grid",
          gridTemplateColumns: onHeaderClose ? "minmax(0, 1fr) minmax(0, 1fr) auto" : "1fr 1fr",
          gap: 12,
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
            ${totalWhole}
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
        {onHeaderClose ? (
          <div style={{ justifySelf: "end", alignSelf: "start" }}>
            <SignupHeaderCloseButton onClick={onHeaderClose} />
          </div>
        ) : null}
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
        <div className="mono" style={{ fontSize: 10, textAlign: "center", marginTop: 10, color: "var(--ink-3)", letterSpacing: ".12em" }}>
          Solo price shown · add a group on the next step if you need more than one player
        </div>
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
