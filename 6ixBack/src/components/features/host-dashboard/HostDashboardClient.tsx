"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type CSSProperties, useEffect, useMemo, useRef, useState, useTransition } from "react";

import type { GameRow, SignupPaymentStatus, SignupRow } from "@/types/domain";

type PaymentFilter = "all" | "paid" | "sent" | "owes";
const ALERT_AUTO_DISMISS_MS = 5000;

function formatSignedAgo(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "→";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return "just now";
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  return d.toLocaleDateString("en-CA", { month: "short", day: "numeric" });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function HostGmailNotice({
  tone,
  message,
  style,
}: {
  tone: "ok" | "warn" | "neutral";
  message: string;
  style?: CSSProperties;
}) {
  const bg =
    tone === "ok" ? "rgba(34, 197, 94, 0.12)" : tone === "warn" ? "rgba(180, 83, 9, 0.12)" : "var(--bg)";
  const border =
    tone === "ok" ? "var(--ok, #16a34a)" : tone === "warn" ? "var(--warn, #b45309)" : "var(--ink-3)";
  return (
    <div
      role="status"
      className="card"
      style={{
        padding: "12px 16px",
        marginBottom: 18,
        borderLeft: `4px solid ${border}`,
        background: bg,
        ...style,
      }}
    >
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--ink)" }}>{message}</p>
    </div>
  );
}

type HostPayoutAndGmailCardProps =
  | {
      hostGmailConnected: boolean;
      variant: "no-games";
    }
  | {
      hostGmailConnected: boolean;
      variant: "with-games";
      interacDraft: string;
      onInteracDraftChange: (value: string) => void;
      interacPending: boolean;
      interacError: string | null;
      onSaveInterac: () => void;
    };

function HostGmailFooterButtons({
  connected,
  pending,
  locked,
  onPendingChange,
}: {
  connected: boolean;
  pending: boolean;
  locked: boolean;
  onPendingChange: (next: boolean) => void;
}) {
  const disabled = pending || locked;

  function beginConnect(): void {
    if (disabled) return;
    onPendingChange(true);
    window.setTimeout(() => {
      window.location.assign("/api/gmail/host/oauth/start");
    }, 0);
  }

  if (connected) {
    return (
      <form
        action="/api/gmail/host/oauth/disconnect"
        method="post"
        style={{ margin: 0, display: "flex", width: "100%" }}
        onSubmit={() => {
          if (!locked) onPendingChange(true);
        }}
      >
        <button
          type="submit"
          className="btn ghost"
          disabled={disabled}
          style={{ width: "100%", minHeight: 44, paddingLeft: 16, paddingRight: 16 }}
          aria-busy={pending}
        >
          {pending ? "Disconnecting…" : "Disconnect"}
        </button>
      </form>
    );
  }
  return (
    <button
      type="button"
      className="btn accent"
      disabled={disabled}
      aria-busy={pending}
      onClick={beginConnect}
      style={{ width: "100%", minHeight: 44, paddingLeft: 16, paddingRight: 16 }}
    >
      {pending ? "Connecting…" : "Connect Gmail"}
    </button>
  );
}

function HostPayoutAndGmailCard(props: HostPayoutAndGmailCardProps) {
  const connected = props.hostGmailConnected;
  const [gmailPending, setGmailPending] = useState(false);
  const savePending = props.variant === "with-games" ? props.interacPending : false;

  const actionBarStyle: CSSProperties = {
    marginTop: 2,
    padding: "14px 14px 16px",
    borderTop: "2px solid var(--ink)",
    background: "var(--bg-2)",
    display: "flex",
    flexWrap: "wrap",
    alignItems: "stretch",
    gap: 10,
  };

  const interacError =
    props.variant === "with-games" && props.interacError ? (
      <p role="alert" style={{ margin: "0 14px 14px", fontSize: 13, color: "var(--warn)", fontWeight: 600 }}>
        {props.interacError}
      </p>
    ) : null;

  return (
    <div className="card" style={{ padding: 0, marginBottom: 18, overflow: "hidden" }}>
      <div style={{ padding: "12px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
          <div className="label">Host payouts</div>
          <span
            className="chip"
            aria-busy={gmailPending}
            style={{
              background: connected ? "var(--ok)" : "var(--bg-2)",
              borderColor: connected ? "var(--ok)" : "var(--ink-3)",
              color: connected ? "var(--paper)" : "var(--ink)",
              opacity: gmailPending ? 0.8 : 1,
            }}
          >
            {gmailPending ? "Updating..." : connected ? "Connected" : "Not connected"}
          </span>
        </div>
        <div style={{ display: "grid", gap: 2, marginBottom: 12 }}>
          <p className="mono" style={{ margin: 0, fontSize: 11, letterSpacing: ".05em", color: "var(--ink-2)", lineHeight: 1.35 }}>
            Gmail sync: {connected ? "Connected" : "Not connected"}
          </p>
          <p className="mono" style={{ margin: 0, fontSize: 11, letterSpacing: ".05em", color: "var(--ink-2)", lineHeight: 1.35 }}>
            Payout email is where players send Interac e-Transfers for this game.
          </p>
        </div>
      </div>

      {props.variant === "with-games" ? (
        <div style={actionBarStyle}>
          <div
            style={{
              display: "grid",
              gap: 10,
              flex: "1 1 320px",
              minWidth: 0,
            }}
          >
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 44px", gap: 10, width: "100%", minWidth: 0 }}>
              <input
                className="input"
                type="email"
                autoComplete="email"
                value={props.interacDraft}
                onChange={(e) => props.onInteracDraftChange(e.target.value)}
                style={{
                  width: "100%",
                  minWidth: 0,
                  height: 44,
                  minHeight: 44,
                }}
                aria-label="Interac e-Transfer email for selected game"
              />
              <button
                type="button"
                className="btn ghost"
                disabled={props.interacPending || gmailPending}
                aria-busy={props.interacPending}
                aria-label={props.interacPending ? "Saving payout email" : "Save payout email"}
                onClick={props.onSaveInterac}
                style={{
                  width: 44,
                  minWidth: 44,
                  height: 44,
                  minHeight: 44,
                  padding: 0,
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {props.interacPending ? (
                  <span className="mono" style={{ fontSize: 10, letterSpacing: ".06em" }}>
                    ...
                  </span>
                ) : (
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" aria-hidden>
                    <path d="M20 7L10 17l-5-5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div style={{ width: "100%" }}>
            <div style={{ display: "flex", alignItems: "stretch", flexWrap: "nowrap", gap: 10, width: "100%" }}>
              <div style={{ flex: "1 1 100%", minWidth: 0 }}>
                <HostGmailFooterButtons
                  connected={connected}
                  pending={gmailPending}
                  locked={savePending}
                  onPendingChange={setGmailPending}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ ...actionBarStyle, justifyContent: "flex-end" }}>
          <HostGmailFooterButtons
            connected={connected}
            pending={gmailPending}
            locked={false}
            onPendingChange={setGmailPending}
          />
        </div>
      )}
      {interacError}
    </div>
  );
}

function hostGmailFlash(gmailParam: string | null): { tone: "ok" | "warn" | "neutral"; text: string } | null {
  switch (gmailParam) {
    case "connected":
      return null;
    case "disconnected":
      return { tone: "neutral", text: "Gmail disconnected." };
    case "unauthorized":
      return { tone: "warn", text: "Sign in as a host to connect Gmail." };
    case "invalid-state":
      return { tone: "warn", text: "OAuth session expired or invalid. Try Connect Gmail again." };
    case "missing-refresh-token":
      return {
        tone: "warn",
        text: "Google did not return a refresh token. Remove app access under your Google Account security settings and try Connect Gmail again.",
      };
    case "session-expired":
      return { tone: "warn", text: "Host session expired before finishing. Sign in and try Connect Gmail again." };
    default:
      return null;
  }
}

export function HostDashboardClient({
  games,
  signupsByGameId,
  hostGmailConnected,
}: {
  games: GameRow[];
  signupsByGameId: Record<string, SignupRow[]>;
  hostGmailConnected: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gmailFlash = hostGmailFlash(searchParams.get("gmail"));
  const [pickedGameId, setPickedGameId] = useState<string | null>(null);
  const [filter, setFilter] = useState<PaymentFilter>("all");
  const [interacDraft, setInteracDraft] = useState("");
  const [interacError, setInteracError] = useState<string | null>(null);
  const [interacPending, startInteracTransition] = useTransition();
  const [hostRosterError, setHostRosterError] = useState<string | null>(null);
  const [hostRosterPending, startHostRosterTransition] = useTransition();
  const [rosterSavingSignupId, setRosterSavingSignupId] = useState<string | null>(null);
  const [rosterRowsVisible, setRosterRowsVisible] = useState(10);
  const [addPlayerOpen, setAddPlayerOpen] = useState(false);
  const [addPlayerName, setAddPlayerName] = useState("");
  const [addPlayerEmail, setAddPlayerEmail] = useState("");
  const [addPlayerError, setAddPlayerError] = useState<string | null>(null);
  const [addPlayerPending, startAddPlayerTransition] = useTransition();
  const [removePlayerTarget, setRemovePlayerTarget] = useState<SignupRow | null>(null);
  const [removePlayerPending, startRemovePlayerTransition] = useTransition();
  const [reportPlayerTarget, setReportPlayerTarget] = useState<SignupRow | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportPending, startReportTransition] = useTransition();

  const selectedGameId = useMemo(() => {
    if (!games.length) return "";
    if (pickedGameId && games.some((g) => g.id === pickedGameId)) return pickedGameId;
    return games[0].id;
  }, [games, pickedGameId]);

  const selectedGame = useMemo(
    () => games.find((game) => game.id === selectedGameId) ?? games[0],
    [games, selectedGameId]
  );

  useEffect(() => {
    if (selectedGame) {
      setInteracDraft(selectedGame.host_email);
      setInteracError(null);
    }
  }, [selectedGame?.id, selectedGame?.host_email]);

  useEffect(() => {
    if (!interacError) return;
    const id = window.setTimeout(() => setInteracError(null), ALERT_AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [interacError]);

  useEffect(() => {
    if (!hostRosterError) return;
    const id = window.setTimeout(() => setHostRosterError(null), ALERT_AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [hostRosterError]);

  useEffect(() => {
    if (!addPlayerError) return;
    const id = window.setTimeout(() => setAddPlayerError(null), ALERT_AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [addPlayerError]);

  useEffect(() => {
    if (!reportError) return;
    const id = window.setTimeout(() => setReportError(null), ALERT_AUTO_DISMISS_MS);
    return () => window.clearTimeout(id);
  }, [reportError]);

  const roster = useMemo(
    () => (selectedGameId ? signupsByGameId[selectedGameId] ?? [] : []),
    [selectedGameId, signupsByGameId]
  );

  const totals = useMemo(() => {
    let paid = 0;
    let sent = 0;
    let owes = 0;
    for (const row of roster) {
      if (row.payment_status === "paid") paid += 1;
      else if (row.payment_status === "sent") sent += 1;
      else owes += 1;
    }
    return { paid, sent, owes };
  }, [roster]);

  const filteredRoster = useMemo(() => {
    if (filter === "all") return roster;
    if (filter === "paid") return roster.filter((r) => r.payment_status === "paid");
    if (filter === "sent") return roster.filter((r) => r.payment_status === "sent");
    return roster.filter((r) => r.payment_status === "owes");
  }, [filter, roster]);
  const visibleRosterRows = useMemo<(SignupRow | null)[]>(() => {
    const capacity = selectedGame?.capacity ?? 0;
    const placeholders = Math.max(capacity - filteredRoster.length, 0);
    return [...filteredRoster, ...Array.from({ length: placeholders }, () => null)];
  }, [filteredRoster, selectedGame?.capacity]);
  const displayedRosterRows = useMemo(
    () => visibleRosterRows.slice(0, rosterRowsVisible),
    [visibleRosterRows, rosterRowsVisible]
  );

  useEffect(() => {
    setRosterRowsVisible(10);
  }, [selectedGameId, filter]);

  const amountPerPlayer = selectedGame ? Math.max(1, Math.round(selectedGame.price_cents / 100)) : 0;
  const collected = totals.paid * amountPerPlayer;
  const pendingPaymentCount = totals.sent + totals.owes;
  const outstandingEstimate = pendingPaymentCount * amountPerPlayer;
  const expected = roster.length * amountPerPlayer;

  function requestPaymentStatus(player: SignupRow, paymentStatus: SignupPaymentStatus): void {
    if (!selectedGameId || rosterSavingSignupId) return;
    setHostRosterError(null);
    setRosterSavingSignupId(player.id);
    startHostRosterTransition(async () => {
      try {
        const { setSignupPaymentStatusForHost } = await import("@/server/actions/host-signup");
        const fd = new FormData();
        fd.set("gameId", selectedGameId);
        fd.set("signupId", player.id);
        fd.set("paymentStatus", paymentStatus);
        const res = await setSignupPaymentStatusForHost(fd);
        if (!res.ok) {
          setHostRosterError(res.error);
          return;
        }
        router.refresh();
      } finally {
        setRosterSavingSignupId(null);
      }
    });
  }

  function copyEmails(): void {
    const text = roster.map((r) => r.player_email).join("\n");
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    void navigator.clipboard.writeText(text);
  }

  function copyReminderMessage(): void {
    const msg = `Hey! Quick reminder for ${selectedGame?.title ?? "the run"}. Send $${amountPerPlayer} to ${selectedGame?.host_email ?? ""} and include your reference code.`;
    void navigator.clipboard?.writeText(msg);
  }

  function openAddPlayerModal(): void {
    setAddPlayerOpen(true);
    setAddPlayerError(null);
  }

  function resetAddPlayerModal(): void {
    setAddPlayerOpen(false);
    setAddPlayerError(null);
    setAddPlayerName("");
    setAddPlayerEmail("");
  }

  function closeAddPlayerModal(): void {
    if (addPlayerPending) return;
    resetAddPlayerModal();
  }

  function submitManualPlayerAdd(): void {
    if (!selectedGameId) return;
    const playerName = addPlayerName.trim();
    const playerEmail = addPlayerEmail.trim().toLowerCase();

    if (!playerName || !playerEmail) {
      setAddPlayerError("Enter player name and email.");
      return;
    }

    setAddPlayerError(null);
    startAddPlayerTransition(async () => {
      const { signupForGame } = await import("@/server/actions/signup");
      const fd = new FormData();
      fd.set("gameId", selectedGameId);
      fd.set("playerName", playerName);
      fd.set("playerEmail", playerEmail);
      const res = await signupForGame(fd);
      if (!res.ok) {
        setAddPlayerError(res.error);
        return;
      }
      resetAddPlayerModal();
      router.refresh();
    });
  }

  function openRemovePlayerModal(player: SignupRow): void {
    setRemovePlayerTarget(player);
  }

  function closeRemovePlayerModal(): void {
    if (removePlayerPending) return;
    setRemovePlayerTarget(null);
  }

  function submitRemovePlayer(): void {
    if (!selectedGameId || !removePlayerTarget || rosterSavingSignupId) return;
    setHostRosterError(null);
    setRosterSavingSignupId(removePlayerTarget.id);
    startRemovePlayerTransition(async () => {
      try {
        const { setSignupRosterStatusForHost } = await import("@/server/actions/host-signup");
        const fd = new FormData();
        fd.set("gameId", selectedGameId);
        fd.set("signupId", removePlayerTarget.id);
        fd.set("status", "cancelled");
        const res = await setSignupRosterStatusForHost(fd);
        if (!res.ok) {
          setHostRosterError(res.error);
          return;
        }
        setRemovePlayerTarget(null);
        router.refresh();
      } finally {
        setRosterSavingSignupId(null);
      }
    });
  }

  function openReportPlayerModal(player: SignupRow): void {
    setReportPlayerTarget(player);
    setReportReason("");
    setReportDetails("");
    setReportError(null);
  }

  function closeReportPlayerModal(): void {
    if (reportPending) return;
    setReportPlayerTarget(null);
    setReportReason("");
    setReportDetails("");
    setReportError(null);
  }

  function submitReportPlayer(): void {
    if (!reportPlayerTarget) return;
    const reason = reportReason.trim();
    if (!reason) {
      setReportError("Please provide a reason.");
      return;
    }
    startReportTransition(async () => {
      const extra = reportDetails.trim();
      setHostRosterError(
        `Report submitted for ${reportPlayerTarget.player_name}: ${reason}${extra ? ` (${extra})` : ""}`
      );
      closeReportPlayerModal();
    });
  }

  function saveInteracEmail(): void {
    if (!selectedGame) return;
    setInteracError(null);
    const fd = new FormData();
    fd.set("gameId", selectedGame.id);
    fd.set("hostEmail", interacDraft.trim());
    startInteracTransition(async () => {
      const { updateHostInteracEmail } = await import("@/server/actions/host");
      const res = await updateHostInteracEmail(fd);
      if (!res.ok) {
        setInteracError(res.error);
        return;
      }
      router.refresh();
    });
  }

  function exportCsv(): void {
    const header = ["name", "email", "payment_code", "payment_status", "roster_status", "created_at"];
    const lines = [
      header.join(","),
      ...roster.map((r) =>
        [r.player_name, r.player_email, r.payment_code, r.payment_status, r.status, r.created_at].map((cell) =>
          `"${String(cell).replace(/"/g, '""')}"`
        ).join(",")
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roster-${selectedGame?.id ?? "export"}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!games.length) {
    return (
      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 18px 60px" }}>
        {gmailFlash ? (
          <HostGmailNotice tone={gmailFlash.tone} message={gmailFlash.text} style={{ marginBottom: 18 }} />
        ) : null}
        <div className="card" style={{ padding: 28, marginBottom: 18 }}>
          <div className="label" style={{ marginBottom: 8 }}>
            Host dashboard
          </div>
          <h2 className="display" style={{ fontSize: 28, margin: "0 0 12px", letterSpacing: "-.02em" }}>
            No games yet
          </h2>
          <p style={{ margin: "0 0 20px", color: "var(--ink-2)", lineHeight: 1.55, fontSize: 15 }}>
            When you publish a game, it appears here with sign-ups and payment tracking.
          </p>
          <Link href="/host/new" className="btn accent">
            Host a new game
          </Link>
        </div>
        <HostPayoutAndGmailCard hostGmailConnected={hostGmailConnected} variant="no-games" />
      </section>
    );
  }

  return (
    <>
      <section style={{ borderBottom: "2px solid var(--ink)", background: "var(--ink)", color: "var(--paper)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "40px 18px" }}>
          <div className="label" style={{ marginBottom: 10, color: "rgba(251,248,241,.5)" }}>Host dashboard</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 20, flexWrap: "wrap", marginBottom: 32 }}>
            <div style={{ display: "grid", gap: 12, minWidth: 0 }}>
              <h1 className="display" style={{ fontSize: "clamp(40px, 7vw, 76px)", margin: 0, letterSpacing: "-.03em" }}>
                My{" "}
                <span className="serif-display" style={{ fontStyle: "italic", color: "var(--accent)", textTransform: "lowercase" }}>
                  roster.
                </span>
              </h1>
              <select
                className="input xl select-input-invert browse-roster-game-select"
                aria-label="Select game"
                value={selectedGameId}
                onChange={(event) => setPickedGameId(event.target.value)}
              >
                {games.map((game) => (
                  <option key={game.id} value={game.id}>
                    {game.title}
                  </option>
                ))}
              </select>
            </div>
            <Link href="/host/new" className="btn lg accent" style={{ height: 56, minHeight: 56 }}>
              Host a new game
            </Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 10 }}>
            <Stat label="Signed up" value={`${roster.length}/${selectedGame?.capacity ?? 0}`} accent />
            <Stat label="Paid" value={String(totals.paid)} sub={`$${collected} collected`} />
            <Stat label="Sent" value={String(totals.sent)} sub="Awaiting confirm" />
            <Stat label="Owes" value={String(totals.owes)} sub={`~$${totals.owes * amountPerPlayer} est`} />
            <Stat label="Waitlist" value={String(selectedGame?.waitlist_count ?? 0)} sub="Across this game" />
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 18px 34px" }}>
        {gmailFlash ? (
          <HostGmailNotice tone={gmailFlash.tone} message={gmailFlash.text} style={{ marginBottom: 18 }} />
        ) : null}
        <div
          className="host-roster-content-grid"
          style={{ display: "grid", gridTemplateColumns: "minmax(0,4fr) minmax(280px,2fr)", gap: 16, alignItems: "start" }}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18, flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {[
                  { id: "all" as const, label: "All", n: roster.length },
                  { id: "paid" as const, label: "Paid", n: totals.paid },
                  { id: "sent" as const, label: "Sent", n: totals.sent },
                  { id: "owes" as const, label: "Owes", n: totals.owes },
                ].map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    className="roster-filter-btn"
                    style={{
                      background: filter === entry.id ? "var(--ink)" : "transparent",
                      color: filter === entry.id ? "var(--paper)" : "var(--ink)",
                    }}
                    onClick={() => setFilter(entry.id)}
                  >
                    {entry.label}{" "}
                    <span style={{ opacity: 0.6, fontWeight: 500 }}>{entry.n}</span>
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn sm accent" onClick={openAddPlayerModal}>
                  Add player
                </button>
                <button type="button" className="btn sm ghost" onClick={copyEmails} disabled={roster.length === 0}>
                  Copy emails
                </button>
              </div>
            </div>

            {hostRosterError ? (
              <div
                role="alert"
                className="card"
                style={{
                  padding: "12px 16px",
                  marginBottom: 14,
                  borderLeft: "4px solid var(--warn, #b45309)",
                  background: "rgba(180, 83, 9, 0.1)",
                }}
              >
                <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{hostRosterError}</p>
              </div>
            ) : null}

            <div className="card roster-table" style={{ padding: 0, overflow: "hidden" }}>
          <div
            className="mono roster-table-head"
            style={{
              display: "grid",
              gridTemplateColumns:
                "36px minmax(0, 2.25fr) minmax(84px, 0.9fr) minmax(140px, 1fr)",
              padding: "12px 18px",
              background: "var(--bg)",
              borderBottom: "2px solid var(--ink)",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".08em",
              textTransform: "uppercase",
              color: "var(--ink-2)",
            }}
          >
            <div>#</div>
            <div>Player</div>
            <div>Reference</div>
            <div style={{ textAlign: "right" }}>Status</div>
          </div>
          {displayedRosterRows.length === 0 ? (
            <div style={{ padding: "24px 18px", color: "var(--ink-2)", fontSize: 14 }}>
              No players in this view yet.
            </div>
          ) : (
            displayedRosterRows.map((player, index) => (
              <div
                key={player ? player.id : `placeholder-${index}`}
                className="roster-row"
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "36px minmax(0, 2.25fr) minmax(84px, 0.9fr) minmax(140px, 1fr)",
                  alignItems: "center",
                  padding: "14px 18px",
                  borderBottom: index === displayedRosterRows.length - 1 ? "none" : "1px dashed var(--ink-3)",
                  gap: 12,
                }}
              >
                <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 700 }}>
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, opacity: player ? 1 : 0.45 }}>
                  {player ? (
                    <>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          background: "var(--accent)",
                          border: "2px solid var(--ink)",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: 900,
                          fontSize: 11,
                        }}
                      >
                        {initials(player.player_name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {player.player_name}
                        </div>
                        <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: ".06em" }}>
                          signed {formatSignedAgo(player.created_at)}
                        </div>
                        <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: ".04em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {player.player_email}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: ".08em" }}>
                      OPEN SPOT
                    </div>
                  )}
                </div>
                <div className="mono" style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".06em", opacity: player ? 1 : 0.35 }}>
                  {player ? player.payment_code : "—"}
                </div>
                <div
                  aria-busy={player ? rosterSavingSignupId === player.id : false}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    gap: 6,
                    flexWrap: "wrap",
                    minWidth: 0,
                    opacity: player ? 1 : 0.35,
                  }}
                >
                  {player ? (
                    rosterSavingSignupId === player.id ? (
                      <span className="mono" style={{ fontSize: 10, letterSpacing: ".08em", color: "var(--ink-2)" }}>
                        Saving...
                      </span>
                    ) : (
                      <HostPaymentActionsDropdown
                        player={player}
                        status={player.payment_status}
                        disabled={hostRosterPending}
                        onSelect={(next) => requestPaymentStatus(player, next)}
                        onRemove={() => openRemovePlayerModal(player)}
                        onReport={() => openReportPlayerModal(player)}
                      />
                    )
                  ) : (
                    <span className="mono">—</span>
                  )}
                </div>
              </div>
            ))
          )}
          </div>
          {rosterRowsVisible < visibleRosterRows.length ? (
            <div style={{ marginTop: 10, display: "flex", justifyContent: "center" }}>
              <button
                type="button"
                className="btn sm ghost"
                onClick={() => setRosterRowsVisible((current) => current + 10)}
              >
                Load more
              </button>
            </div>
          ) : null}
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            <HostPayoutAndGmailCard
              hostGmailConnected={hostGmailConnected}
              variant="with-games"
              interacDraft={interacDraft}
              onInteracDraftChange={setInteracDraft}
              interacPending={interacPending}
              interacError={interacError}
              onSaveInterac={saveInteracEmail}
            />
            <div className="card" style={{ padding: 16 }}>
              <div className="label">Auto-reminder template</div>
              <p style={{ margin: "4px 0 14px", fontSize: 14, lineHeight: 1.55, color: "var(--ink-2)" }}>
                Friendly nudge for players who still owe payment before game time.
              </p>
              <div className="card" style={{ padding: 12, boxShadow: "none", background: "var(--bg)" }}>
                <div className="mono" style={{ fontSize: 10.5, letterSpacing: ".08em", lineHeight: 1.5 }}>
                  Hey! Quick reminder for {selectedGame?.title ?? "the run"}. Send ${amountPerPlayer} to {selectedGame?.host_email ?? ""}{" "}
                  and include your reference code.
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                <button type="button" className="btn sm ghost" onClick={copyReminderMessage}>
                  Copy message
                </button>
              </div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div className="label">This game&apos;s intake</div>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  ["Paid", `$${collected}`],
                  ["Expected", `$${expected}`],
                  ["Outstanding (est.)", `$${outstandingEstimate}`],
                  ["Waitlist", `${selectedGame?.waitlist_count ?? 0} players`],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--ink-3)", paddingBottom: 8 }}>
                    <span className="mono" style={{ fontSize: 11, letterSpacing: ".08em", color: "var(--ink-3)" }}>
                      {label}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 14 }}>{value}</span>
                  </div>
                ))}
              </div>
              <button type="button" className="btn sm ghost" style={{ marginTop: 12 }} onClick={exportCsv} disabled={roster.length === 0}>
                Export CSV
              </button>
            </div>
          </div>
        </div>
        {addPlayerOpen ? (
          <div
            role="dialog"
            aria-modal
            aria-label="Add player manually"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(17,17,20,.55)",
              zIndex: 60,
              display: "grid",
              placeItems: "center",
              padding: 18,
            }}
            onClick={closeAddPlayerModal}
          >
            <div
              className="card"
              style={{ width: "min(540px, 100%)", padding: 18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="label" style={{ marginBottom: 8 }}>
                Host roster
              </div>
              <h3 className="display" style={{ fontSize: "clamp(24px, 5vw, 34px)", margin: "0 0 14px" }}>
                Add player
              </h3>
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  className="input"
                  type="text"
                  value={addPlayerName}
                  onChange={(e) => setAddPlayerName(e.target.value)}
                  placeholder="Player name"
                  autoFocus
                  disabled={addPlayerPending}
                />
                <input
                  className="input"
                  type="email"
                  value={addPlayerEmail}
                  onChange={(e) => setAddPlayerEmail(e.target.value)}
                  placeholder="Player email"
                  autoComplete="email"
                  disabled={addPlayerPending}
                />
                {addPlayerError ? (
                  <p role="alert" style={{ margin: "2px 0 0", color: "var(--warn)", fontSize: 13, fontWeight: 600 }}>
                    {addPlayerError}
                  </p>
                ) : null}
              </div>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn sm ghost" onClick={closeAddPlayerModal} disabled={addPlayerPending}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn sm accent"
                  onClick={submitManualPlayerAdd}
                  disabled={addPlayerPending}
                  aria-busy={addPlayerPending}
                >
                  {addPlayerPending ? "Adding..." : "Add player"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {removePlayerTarget ? (
          <div
            role="dialog"
            aria-modal
            aria-label="Remove player"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(17,17,20,.55)",
              zIndex: 60,
              display: "grid",
              placeItems: "center",
              padding: 18,
            }}
            onClick={closeRemovePlayerModal}
          >
            <div className="card" style={{ width: "min(480px, 100%)", padding: 18 }} onClick={(e) => e.stopPropagation()}>
              <div className="label" style={{ marginBottom: 8 }}>
                Host roster
              </div>
              <h3 className="display" style={{ fontSize: "clamp(22px, 4vw, 30px)", margin: "0 0 10px" }}>
                Remove player
              </h3>
              <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.45 }}>
                Remove <strong>{removePlayerTarget.player_name}</strong> from this roster?
              </p>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn sm ghost" onClick={closeRemovePlayerModal} disabled={removePlayerPending}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn sm accent"
                  onClick={submitRemovePlayer}
                  disabled={removePlayerPending}
                  aria-busy={removePlayerPending}
                >
                  {removePlayerPending ? "Removing..." : "Remove"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {reportPlayerTarget ? (
          <div
            role="dialog"
            aria-modal
            aria-label="Report player"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(17,17,20,.55)",
              zIndex: 60,
              display: "grid",
              placeItems: "center",
              padding: 18,
            }}
            onClick={closeReportPlayerModal}
          >
            <div className="card" style={{ width: "min(560px, 100%)", padding: 18 }} onClick={(e) => e.stopPropagation()}>
              <div className="label" style={{ marginBottom: 8 }}>
                Host roster
              </div>
              <h3 className="display" style={{ fontSize: "clamp(22px, 4vw, 30px)", margin: "0 0 10px" }}>
                Report player
              </h3>
              <p style={{ margin: "0 0 10px", color: "var(--ink-2)", fontSize: 14, lineHeight: 1.45 }}>
                Report <strong>{reportPlayerTarget.player_name}</strong>. Include at least one reason.
              </p>
              <div style={{ display: "grid", gap: 10 }}>
                <input
                  className="input"
                  type="text"
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Reason (required)"
                  disabled={reportPending}
                />
                <textarea
                  className="input"
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Details (optional)"
                  rows={4}
                  disabled={reportPending}
                  style={{ resize: "vertical", minHeight: 110 }}
                />
                {reportError ? (
                  <p role="alert" style={{ margin: "2px 0 0", color: "var(--warn)", fontSize: 13, fontWeight: 600 }}>
                    {reportError}
                  </p>
                ) : null}
              </div>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn sm ghost" onClick={closeReportPlayerModal} disabled={reportPending}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn sm accent"
                  onClick={submitReportPlayer}
                  disabled={reportPending}
                  aria-busy={reportPending}
                >
                  {reportPending ? "Submitting..." : "Submit report"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}

function Stat({ label, value, sub, accent = false }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div style={{ borderTop: `3px solid ${accent ? "var(--accent)" : "var(--paper)"}`, paddingTop: 12 }}>
      <div className="mono" style={{ fontSize: 10.5, letterSpacing: ".12em", color: "rgba(251,248,241,.55)", marginBottom: 6, fontWeight: 700 }}>
        {label.toUpperCase()}
      </div>
      <div className="display" style={{ fontSize: "clamp(30px, 4.5vw, 44px)", lineHeight: 0.9, color: accent ? "var(--accent)" : "var(--paper)" }}>
        {value}
      </div>
      {sub ? (
        <div className="mono" style={{ fontSize: 10.5, color: "rgba(251,248,241,.55)", marginTop: 6, letterSpacing: ".06em" }}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function IcoCheck(props: { size?: number }) {
  const s = props.size ?? 16;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M20 7L10 17l-5-5" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IcoSent(props: { size?: number }) {
  const s = props.size ?? 15;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M3 12l18-8-8 18-2-8-8-2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function IcoOwes(props: { size?: number }) {
  const s = props.size ?? 15;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.85" />
      <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

function HostPaymentStatusBadge({ status }: { status: SignupPaymentStatus }) {
  if (status === "paid") {
    return (
      <span className="chip" style={{ background: "var(--ok)", borderColor: "var(--ok)", color: "var(--paper)" }}>
        Paid
      </span>
    );
  }
  if (status === "sent") {
    return (
      <span className="chip" style={{ background: "var(--payment-sent)", borderColor: "var(--ink)", color: "var(--paper)" }}>
        Sent
      </span>
    );
  }
  return (
    <span className="chip" style={{ background: "var(--warn)", borderColor: "var(--warn)", color: "var(--paper)" }}>
      Owes
    </span>
  );
}

function HostPaymentActionsDropdown({
  player,
  status,
  disabled,
  onSelect,
  onRemove,
  onReport,
}: {
  player: SignupRow;
  status: SignupPaymentStatus;
  disabled: boolean;
  onSelect: (next: SignupPaymentStatus) => void;
  onRemove: () => void;
  onReport: () => void;
}) {
  const options: SignupPaymentStatus[] = ["paid", "sent", "owes"];
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent): void {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div className="host-payment-actions-dropdown" ref={rootRef}>
      <button
        type="button"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: 0,
          border: "none",
          background: "transparent",
          boxShadow: "none",
          listStyle: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          opacity: disabled ? 0.6 : 1,
        }}
        disabled={disabled}
        onClick={() => setOpen((s) => !s)}
      >
        <HostPaymentStatusBadge status={status} />
        <svg width={12} height={12} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="sr-only">Open payment status actions</span>
      </button>
      {open ? (
        <div className="host-payment-actions-panel">
          <div style={{ display: "grid", gap: 6 }}>
            {options.map((next) => (
              <button
                key={next}
                type="button"
                className="btn sm ghost"
                disabled={disabled || next === status}
                onClick={() => {
                  onSelect(next);
                  setOpen(false);
                }}
                style={{ justifyContent: "flex-start", textTransform: "capitalize" }}
              >
                {next}
              </button>
            ))}
            <div role="presentation" style={{ height: 1, background: "var(--ink-3)", opacity: 0.35, margin: "2px 0" }} />
            <button
              type="button"
              className="btn sm ghost"
              disabled={disabled}
              onClick={() => {
                onRemove();
                setOpen(false);
              }}
              style={{ justifyContent: "flex-start" }}
            >
              Remove player
            </button>
            <button
              type="button"
              className="btn sm ghost"
              disabled={disabled}
              onClick={() => {
                onReport();
                setOpen(false);
              }}
              style={{ justifyContent: "flex-start" }}
            >
              Report player
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

