"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { KindBadge } from "@/components/shared/UiPrimitives";
import { publishHostGame } from "@/server/actions/host";
import type { GameKind } from "@/types/domain";

const SKILLS = ["Beginner", "Intermediate", "Advanced", "Competitive"] as const;

function IcoArrowLeft({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoArrowRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoTag({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="7.5" r="1.5" fill="currentColor" />
    </svg>
  );
}

function IcoFileText({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IcoWallet({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M21 12V7H5a2 2 0 010-4h14v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M3 5v14a2 2 0 002 2h16v-5" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="14" r="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IcoCheck({ size = 13, color }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden style={{ flexShrink: 0, color }}>
      <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoCheckCircle({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoZap({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IcoTrophy({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 21h8M12 17v4M6 3h12v5a6 6 0 01-12 0V3zM6 8H4a2 2 0 000 4h2M18 8h2a2 2 0 010 4h-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IcoMedal({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="15" r="5" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3l2 6 2-6M14 3l2 6 2-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IcoMapPin({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-4.35 7-11a7 7 0 10-14 0c0 6.65 7 11 7 11z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="10" r="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function IcoBanknote({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="2" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
      <path d="M6 10h.01M18 14h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IcoMegaphone({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 11v5a2 2 0 002 2h2l7 4V3l-7 4H5a2 2 0 00-2 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 9a5 5 0 010 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IcoUserPlus({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM20 8v6M23 11h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function buildStartsAtIso(dateStr: string, timeStr: string): string {
  if (!dateStr || !timeStr) return "";
  const d = new Date(`${dateStr}T${timeStr}`);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString();
}

function formatHostPublishError(message: string): string {
  if (message.includes("Admin authorization")) {
    return "Publishing needs an admin session. Open Admin and complete the magic link sign-in, then return here and publish again.";
  }
  if (message.includes("magic link")) {
    return "Request a host sign-in link below using the same email you will publish with, open the email, then publish again.";
  }
  return message;
}

function HostPreviewCard({
  kind,
  title,
  venueLine,
  skillLevel,
  capacity,
  priceDollars,
}: {
  kind: GameKind;
  title: string;
  venueLine: string;
  skillLevel: string;
  capacity: string;
  priceDollars: string;
}) {
  const displayTitle =
    title.trim() ||
    (kind === "dropin" ? "Your drop-in title" : kind === "league" ? "Your league title" : "Your tournament title");
  const dark = kind === "league";
  const price = Number(priceDollars) || 0;

  return (
    <div
      className="card"
      style={{
        padding: 0,
        overflow: "hidden",
        background: dark ? "var(--ink)" : "var(--paper)",
        color: dark ? "var(--paper)" : "var(--ink)",
        borderColor: "var(--ink)",
      }}
    >
      <div
        style={{
          background: kind === "dropin" ? "var(--accent)" : dark ? "transparent" : "var(--bg)",
          borderBottom: `2px solid ${dark ? "var(--paper)" : "var(--ink)"}`,
          padding: "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <KindBadge kind={kind} invert={dark} />
        <span className="chip outline" style={dark ? { color: "var(--paper)", borderColor: "var(--paper)" } : {}}>
          {skillLevel || "Intermediate"}
        </span>
      </div>
      <div style={{ padding: 20 }}>
        <h3
          className="display"
          style={{
            fontSize: 24,
            margin: "0 0 8px",
            color: dark ? "var(--accent)" : "var(--ink)",
            letterSpacing: "-.02em",
          }}
        >
          {displayTitle}
        </h3>
        <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 14, display: "flex", alignItems: "center", gap: 6 }}>
          <IcoMapPin />
          {venueLine || "Venue · area"}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            borderTop: `2px dashed ${dark ? "rgba(251,248,241,.3)" : "var(--ink)"}`,
            paddingTop: 12,
          }}
        >
          <div>
            <div className="mono" style={{ fontSize: 10, opacity: 0.6, letterSpacing: ".12em", fontWeight: 700 }}>
              SPOTS
            </div>
            <div className="display" style={{ fontSize: 22, letterSpacing: "-.03em" }}>
              {capacity || "→"}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div className="mono" style={{ fontSize: 10, opacity: 0.6, letterSpacing: ".12em", fontWeight: 700 }}>
              {kind === "dropin" ? "PER PLAYER" : "PER TEAM"}
            </div>
            <div
              className="display"
              style={{
                fontSize: 22,
                color: dark ? "var(--accent)" : "var(--ink)",
                letterSpacing: "-.03em",
              }}
            >
              ${Math.round(price)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const TYPE_OPTIONS: {
  id: GameKind;
  t: string;
  d: string;
  ic: "zap" | "trophy" | "medal";
  stat: string;
  meta: string[];
  formatIdx: 1 | 2 | 3;
}[] = [
  {
    id: "dropin",
    t: "Drop-in",
    d: "Single session, individual sign-ups.",
    ic: "zap",
    stat: "Most common",
    meta: ["Per-player price", "Wait-list auto-fills", "Auto-match Interac codes"],
    formatIdx: 1,
  },
  {
    id: "league",
    t: "League",
    d: "Multi-week season with team standings.",
    ic: "trophy",
    stat: "Recurring revenue",
    meta: ["Per-team price", "Standings + playoffs", "Captain manages roster"],
    formatIdx: 2,
  },
  {
    id: "tournament",
    t: "Tournament",
    d: "Single-day pool play into bracket.",
    ic: "medal",
    stat: "Big payouts",
    meta: ["Per-team price", "Pool → bracket", "Prize splits supported"],
    formatIdx: 3,
  },
];

function TypeIcon({ name, size }: { name: "zap" | "trophy" | "medal"; size?: number }) {
  if (name === "zap") return <IcoZap size={size} />;
  if (name === "trophy") return <IcoTrophy size={size} />;
  return <IcoMedal size={size} />;
}

export function HostFormClient({ hostSessionEmail }: { hostSessionEmail: string | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recover = searchParams.get("recover");
  const [pending, startTransition] = useTransition();
  const [step, setStep] = useState(1);
  const [kind, setKind] = useState<GameKind>("dropin");
  const [form, setForm] = useState(() => ({
    title: "",
    venueName: "",
    venueArea: "",
    date: "",
    time: "19:00",
    durationMinutes: "120",
    weeks: "8",
    skillLevel: "Intermediate",
    capacity: "18",
    priceDollars: "15",
    format: "Co-ed 6s",
    hostName: "",
    hostEmail: hostSessionEmail ?? "",
  }));
  const [error, setError] = useState<string | null>(null);
  const [depositConfirmed, setDepositConfirmed] = useState(true);
  const [joinAsPlayer, setJoinAsPlayer] = useState(false);
  function upd(key: keyof typeof form, value: string): void {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function publish(): void {
    const startsAt = buildStartsAtIso(form.date, form.time);
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("title", form.title);
    fd.set("venueName", form.venueName);
    fd.set("venueArea", form.venueArea);
    fd.set("startsAt", startsAt);
    const durationMinutes = kind === "league" ? 120 : Number(form.durationMinutes) || 120;
    fd.set("durationMinutes", String(durationMinutes));
    fd.set("skillLevel", form.skillLevel);
    fd.set("capacity", form.capacity);
    fd.set("priceCents", String(Math.round((Number(form.priceDollars) || 0) * 100)));
    const formatNotes =
      kind === "league"
        ? `${form.format.trim()} (${form.weeks}-week season)`.trim()
        : form.format.trim();
    fd.set("format", formatNotes);
    fd.set("hostName", form.hostName);
    fd.set("hostEmail", form.hostEmail);

    setError(null);
    startTransition(async () => {
      const res = await publishHostGame(fd);
      if (!res.ok) {
        setError(formatHostPublishError(res.error));
        return;
      }
      router.push(`/games/${res.data.id}`);
    });
  }

  const venueLine = [form.venueName, form.venueArea].filter(Boolean).join(", ");

  const stepPills: { label: string; Icon: typeof IcoTag }[] = [
    { label: "1. Type", Icon: IcoTag },
    { label: "2. Details", Icon: IcoFileText },
    { label: "3. Payment", Icon: IcoWallet },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: step === 1 ? "1fr" : "minmax(0,1fr) minmax(280px,1fr)",
        gap: 36,
      }}
      className="host-form-shell"
    >
      <div>
        {recover === "invalid" ? (
          <p
            role="alert"
            style={{
              marginBottom: 16,
              padding: "12px 14px",
              border: "2px solid var(--ink)",
              borderRadius: 8,
              background: "rgba(220,38,38,.15)",
              fontSize: 14,
            }}
          >
            That sign-in link is invalid or expired. Request a new link from{" "}
            <Link href="/host/login" style={{ fontWeight: 700, color: "var(--ink)" }}>
              Host sign-in
            </Link>
            .
          </p>
        ) : null}

        <div style={{ marginBottom: 16 }}>
          <Link href="/host" className="btn sm ghost">
            ← Back to dashboard
          </Link>
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {stepPills.map(({ label, Icon }, index) => {
            const active = step === index + 1;
            return (
              <button
                key={label}
                type="button"
                className="host-step-pill"
                style={{
                  background: active ? "var(--accent)" : "transparent",
                  color: "var(--ink)",
                  boxShadow: active ? "2px 2px 0 var(--ink)" : "none",
                }}
                onClick={() => setStep(index + 1)}
              >
                <Icon size={12} />
                {label}
              </button>
            );
          })}
        </div>

        {step === 1 ? (
          <div>
            <div className="label">What are you running?</div>
            <div className="host-type-cards">
              {TYPE_OPTIONS.map((o) => {
                const active = kind === o.id;
                const headerBg = active
                  ? "var(--ink)"
                  : o.id === "dropin"
                    ? "var(--accent)"
                    : o.id === "league"
                      ? "var(--paper)"
                      : "var(--bg)";
                return (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => setKind(o.id)}
                    style={{
                      appearance: "none",
                      cursor: "pointer",
                      textAlign: "left",
                      background: active ? "var(--ink)" : "var(--paper)",
                      color: active ? "var(--paper)" : "var(--ink)",
                      border: "2px solid var(--ink)",
                      borderRadius: 10,
                      padding: 0,
                      fontFamily: "var(--ui)",
                      overflow: "hidden",
                      boxShadow: active ? "5px 5px 0 var(--accent)" : "3px 3px 0 var(--ink)",
                      transform: active ? "translate(-2px,-2px)" : "none",
                      transition: "transform .15s ease, box-shadow .15s ease, background .15s ease",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "10px 14px",
                        borderBottom: `2px solid ${active ? "var(--paper)" : "var(--ink)"}`,
                        background: headerBg,
                      }}
                    >
                      <span className="mono" style={{ fontSize: 10, letterSpacing: ".16em", fontWeight: 700 }}>
                        FORMAT · 0{o.formatIdx}
                      </span>
                      <span className="mono" style={{ fontSize: 10, letterSpacing: ".14em", fontWeight: 700, opacity: 0.72 }}>
                        {o.stat.toUpperCase()}
                      </span>
                    </div>

                    <div style={{ padding: "22px 18px 18px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                        <h3 className="display" style={{ fontSize: 34, margin: 0, letterSpacing: "-.03em", lineHeight: 0.95 }}>
                          {o.t}
                        </h3>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: "50%",
                            border: `2px solid ${active ? "var(--paper)" : "var(--ink)"}`,
                            background: active ? "var(--accent)" : "var(--paper)",
                            color: "var(--ink)",
                            display: "grid",
                            placeItems: "center",
                            flex: "0 0 auto",
                          }}
                        >
                          <TypeIcon name={o.ic} size={22} />
                        </div>
                      </div>
                      <p
                        style={{
                          margin: "4px 0 12px",
                          fontSize: 13.5,
                          lineHeight: 1.5,
                          color: active ? "rgba(251,248,241,.78)" : "var(--ink-2)",
                        }}
                      >
                        {o.d}
                      </p>

                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          margin: 0,
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                          borderTop: `1px dashed ${active ? "rgba(251,248,241,.3)" : "var(--ink-3)"}`,
                          paddingTop: 12,
                        }}
                      >
                        {o.meta.map((m) => (
                          <li
                            key={m}
                            style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontFamily: "var(--ui)" }}
                          >
                            <IcoCheck color={active ? "var(--accent)" : "var(--ok)"} />
                            <span style={{ color: active ? "rgba(251,248,241,.85)" : "var(--ink)" }}>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div
                      style={{
                        padding: "10px 14px",
                        background: active ? "var(--accent)" : "transparent",
                        borderTop: active ? "2px solid var(--paper)" : "1px solid var(--ink-3)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        color: active ? "var(--ink)" : "var(--ink-3)",
                      }}
                    >
                      <span className="mono" style={{ fontSize: 10, letterSpacing: ".16em", fontWeight: 700 }}>
                        {active ? "SELECTED" : "TAP TO PICK"}
                      </span>
                      {active ? <IcoCheckCircle size={15} /> : <IcoArrowRight size={15} />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
              <button type="button" className="btn" onClick={() => setStep(2)}>
                Continue <IcoArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="field">
              <label className="label">Title</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => upd("title", e.target.value)}
                placeholder={
                  kind === "dropin" ? "Tuesday Co-ed 6s" : kind === "league" ? "Spring Co-ed 6s → Tuesday A" : "6ix Back Spring Open"
                }
              />
            </div>

            <div className="form-grid-3">
              <div className="field">
                <label className="label">Venue</label>
                <input
                  className="input"
                  value={form.venueName}
                  onChange={(e) => upd("venueName", e.target.value)}
                  placeholder="Mattamy Athletic Centre"
                />
              </div>
              <div className="field">
                <label className="label">Area</label>
                <input
                  className="input"
                  value={form.venueArea}
                  onChange={(e) => upd("venueArea", e.target.value)}
                  placeholder="North York"
                />
              </div>
              <div className="field">
                <label className="label">Skill level</label>
                <select className="input" value={form.skillLevel} onChange={(e) => upd("skillLevel", e.target.value)} aria-label="Skill level">
                  {SKILLS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-3">
              <div className="field">
                <label className="label">{kind === "league" ? "First night" : "Date"}</label>
                <input className="input" type="date" value={form.date} onChange={(e) => upd("date", e.target.value)} />
              </div>
              <div className="field">
                <label className="label">Start time</label>
                <input className="input" type="time" value={form.time} onChange={(e) => upd("time", e.target.value)} />
              </div>
              <div className="field">
                <label className="label">{kind === "league" ? "# weeks" : "Duration (min)"}</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={kind === "league" ? form.weeks : form.durationMinutes}
                  onChange={(e) => upd(kind === "league" ? "weeks" : "durationMinutes", e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="field">
                <label className="label">{kind === "dropin" ? "Player cap" : "Team cap"}</label>
                <input
                  className="input"
                  type="number"
                  min={2}
                  value={form.capacity}
                  onChange={(e) => upd("capacity", e.target.value)}
                />
              </div>
              <div className="field">
                <label className="label">Price (CAD)</label>
                <input
                  className="input"
                  type="number"
                  min={0}
                  step={1}
                  value={form.priceDollars}
                  onChange={(e) => upd("priceDollars", e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Format / notes for players</label>
              <input
                className="input"
                value={form.format}
                onChange={(e) => upd("format", e.target.value)}
                placeholder="Co-ed 6s → 3 courts, refs on"
              />
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button type="button" className="btn ghost" onClick={() => setStep(1)}>
                <IcoArrowLeft size={14} /> Back
              </button>
              <button type="button" className="btn" onClick={() => setStep(3)}>
                Continue to payment <IcoArrowRight size={16} />
              </button>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="host-payment-step" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="card accent host-payment-callout">
              <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ flexShrink: 0, lineHeight: 0 }} aria-hidden>
                  <IcoBanknote size={32} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="display host-payment-callout-title" style={{ fontSize: 22, marginBottom: 6, letterSpacing: "-.02em" }}>
                    Interac e-Transfer only
                  </div>
                  <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.5, color: "var(--ink)" }}>
                    We don&apos;t process card payments. Players will send funds directly to your email below → zero fees,
                    zero middleman. We just track who&apos;s paid.
                  </p>
                </div>
              </div>
            </div>

            <div className="field">
              <label className="label">Your name (shown to players)</label>
              <input className="input" value={form.hostName} onChange={(e) => upd("hostName", e.target.value)} placeholder="Marcus K." autoComplete="name" />
            </div>
            <div className="field">
              <label className="label">Interac e-Transfer email</label>
              <input
                className="input"
                type="email"
                value={form.hostEmail}
                onChange={(e) => upd("hostEmail", e.target.value)}
                placeholder="treasurer@yourclub.ca"
                autoComplete="email"
              />
              <div
                className="mono"
                style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 6, fontWeight: 600, letterSpacing: ".04em", lineHeight: 1.45 }}
              >
                This is where players send money → it can differ from your host sign-in email if you&apos;re collecting for
                a club or org. Enable auto-deposit on this inbox so reference codes match automatically.
              </div>
              {hostSessionEmail ? (
                <div
                  className="mono"
                  style={{
                    fontSize: 10,
                    color: "var(--ink-3)",
                    marginTop: 8,
                    fontWeight: 600,
                    letterSpacing: ".04em",
                    lineHeight: 1.45,
                  }}
                >
                  Signed in as {hostSessionEmail}
                </div>
              ) : null}
            </div>

            <label className="host-payment-checkbox">
              <input
                type="checkbox"
                checked={depositConfirmed}
                onChange={(e) => setDepositConfirmed(e.target.checked)}
              />
              <span>I confirm Interac auto-deposit is enabled on this email so the system can auto-match payments by reference code.</span>
            </label>

            <label className="host-payment-checkbox">
              <input
                type="checkbox"
                checked={joinAsPlayer}
                onChange={(e) => setJoinAsPlayer(e.target.checked)}
              />
              <span>
                Join this game as a player too (roster uses your display name above; player email is your host sign-in address).
              </span>
            </label>

            {error ? (
              <p role="alert" className="host-payment-error">
                {error}
              </p>
            ) : null}

            <div className="host-payment-actions">
              <button
                type="button"
                className="btn ghost"
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
              >
                <IcoArrowLeft size={14} /> Back
              </button>
              <button
                type="button"
                className="btn accent"
                onClick={publish}
                disabled={pending || !form.hostEmail?.trim() || !form.hostName?.trim() || !depositConfirmed}
                style={{
                  opacity:
                    !form.hostEmail?.trim() || !form.hostName?.trim() || !depositConfirmed ? 0.4 : 1,
                }}
              >
                {pending ? "Publishing…" : "Publish post"} <IcoArrowRight size={16} />
              </button>
            </div>

            <div className="host-payment-gmail-note">
              <a href="/api/gmail/host/oauth/start" className="mono host-payment-gmail-link">
                Connect Gmail (optional)
              </a>
              <p
                className="mono"
                style={{ fontSize: 10, margin: "6px 0 0", color: "var(--ink-3)", letterSpacing: ".04em", lineHeight: 1.45, fontWeight: 600 }}
              >
                Connect your inbox so automated sync can match incoming Interac messages to roster reference codes.
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {step !== 1 ? (
        <div>
          <div className="label" style={{ marginBottom: 10 }}>
            Live preview
          </div>
          <HostPreviewCard
            kind={kind}
            title={form.title}
            venueLine={venueLine}
            skillLevel={form.skillLevel}
            capacity={form.capacity}
            priceDollars={form.priceDollars}
          />

          <div style={{ marginTop: 24 }}>
            <div className="label" style={{ marginBottom: 10 }}>
              What happens next
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { ic: IcoMegaphone, t: "Post goes live in browse" },
                { ic: IcoUserPlus, t: "Players sign up + see your Interac email" },
                { ic: IcoBanknote, t: "You get paid directly via e-Transfer" },
                { ic: IcoCheckCircle, t: "Reference codes auto-match → spots flip to PAID within a minute" },
              ].map(({ ic: Ico, t }) => (
                <li key={t} style={{ display: "flex", gap: 12, alignItems: "center", fontSize: 14 }}>
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: "var(--accent)",
                      border: "2px solid var(--ink)",
                      display: "inline-grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Ico size={18} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
