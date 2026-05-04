"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";

import { HostGameDetailsCard } from "@/components/features/host-dashboard/HostGameDetailsCard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { gameOrganizationDisplayName } from "@/lib/game-organization";
import type { GameRow, OrganizationRow, SignupPaymentStatus, SignupRow } from "@/types/domain";

type PaymentFilter = "all" | "paid" | "pending" | "refund" | "canceled";
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
    <div className="card host-dashboard-payout-card" style={{ padding: 0, marginBottom: 18, overflow: "hidden" }}>
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
            <div
              className="host-dashboard-payout-interac-row"
              style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 44px", gap: 10, width: "100%", minWidth: 0 }}
            >
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
  activeGames,
  pastDropinGames,
  signupsByGameId,
  hostGmailConnected,
  organizations,
}: {
  activeGames: GameRow[];
  pastDropinGames: GameRow[];
  signupsByGameId: Record<string, SignupRow[]>;
  hostGmailConnected: boolean;
  organizations: OrganizationRow[];
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
  const [deletePlayerTarget, setDeletePlayerTarget] = useState<SignupRow | null>(null);
  const [deletePlayerPending, startDeletePlayerTransition] = useTransition();
  const [reportPlayerTarget, setReportPlayerTarget] = useState<SignupRow | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reportDetails, setReportDetails] = useState("");
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportPending, startReportTransition] = useTransition();
  const [pastGamesModalOpen, setPastGamesModalOpen] = useState(false);

  const mergedGames = useMemo(
    () => [...activeGames, ...pastDropinGames],
    [activeGames, pastDropinGames]
  );

  const pastDropinsSorted = useMemo(
    () => [...pastDropinGames].sort((a, b) => Date.parse(b.starts_at) - Date.parse(a.starts_at)),
    [pastDropinGames]
  );

  const selectedGameId = useMemo(() => {
    if (mergedGames.length === 0) return "";
    if (pickedGameId && mergedGames.some((g) => g.id === pickedGameId)) return pickedGameId;
    if (activeGames.length > 0) return activeGames[0].id;
    return pastDropinsSorted[0]!.id;
  }, [mergedGames, activeGames, pastDropinsSorted, pickedGameId]);

  const selectedGame = useMemo(
    () => mergedGames.find((game) => game.id === selectedGameId) ?? mergedGames[0],
    [mergedGames, selectedGameId]
  );

  const gameSelectOptions = useMemo(() => {
    if (activeGames.length === 0) return pastDropinsSorted;
    const list = [...activeGames];
    const sel = mergedGames.find((g) => g.id === selectedGameId);
    if (
      sel &&
      !list.some((g) => g.id === sel.id) &&
      pastDropinGames.some((g) => g.id === sel.id)
    ) {
      list.push(sel);
    }
    return list;
  }, [activeGames, mergedGames, pastDropinGames, pastDropinsSorted, selectedGameId]);

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
  const rosterActiveRows = useMemo(
    () => roster.filter((row) => row.status === "active" || row.status === "waitlist"),
    [roster]
  );
  const rosterArchivedRows = useMemo(
    () => roster.filter((row) => row.payment_status === "refund" || row.payment_status === "canceled"),
    [roster]
  );

  const totals = useMemo(() => {
    let paid = 0;
    let pending = 0;
    let refund = 0;
    let canceled = 0;
    for (const row of rosterActiveRows) {
      if (row.payment_status === "paid") paid += 1;
      else if (row.payment_status === "pending") pending += 1;
      else if (row.payment_status === "refund") refund += 1;
      else canceled += 1;
    }
    return { paid, pending, refund, canceled };
  }, [rosterActiveRows]);

  const filteredRoster = useMemo(() => {
    if (filter === "all") return rosterActiveRows;
    if (filter === "paid") return rosterActiveRows.filter((r) => r.payment_status === "paid");
    if (filter === "pending") return rosterActiveRows.filter((r) => r.payment_status === "pending");
    if (filter === "refund") return rosterArchivedRows.filter((r) => r.payment_status === "refund");
    return rosterArchivedRows.filter((r) => r.payment_status === "canceled");
  }, [filter, rosterActiveRows, rosterArchivedRows]);
  /** Desktop table: pad with null rows up to capacity (open spots). */
  const paddedRosterRows = useMemo<(SignupRow | null)[]>(() => {
    if (filter === "refund" || filter === "canceled") return filteredRoster;
    const capacity = selectedGame?.capacity ?? 0;
    const placeholders = Math.max(capacity - filteredRoster.length, 0);
    return [...filteredRoster, ...Array.from({ length: placeholders }, () => null)];
  }, [filter, filteredRoster, selectedGame?.capacity]);
  const displayedPaddedRows = useMemo(
    () => paddedRosterRows.slice(0, rosterRowsVisible),
    [paddedRosterRows, rosterRowsVisible]
  );
  /** Mobile: only real signups — no per-slot placeholder cards (avoids long OPEN SPOT scroll). */
  const displayedMobilePlayers = useMemo(
    () => filteredRoster.slice(0, rosterRowsVisible),
    [filteredRoster, rosterRowsVisible]
  );
  const isNarrowViewport = useMediaQuery("(max-width: 920px)");
  const rosterPagerTotal = isNarrowViewport ? filteredRoster.length : paddedRosterRows.length;

  /** Desktop can show OPEN SPOT placeholder rows; mobile only lists real signups. Avoid treating padded rows as “has content” for the empty state. */
  const showHostRosterSection = useMemo(() => {
    if (filteredRoster.length > 0) return true;
    if (filter === "refund" || filter === "canceled") return false;
    return (selectedGame?.capacity ?? 0) > 0;
  }, [filteredRoster.length, filter, selectedGame?.capacity]);

  useEffect(() => {
    setRosterRowsVisible(10);
  }, [selectedGameId, filter]);

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
        fd.set("status", "removed");
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

  function openDeletePlayerModal(player: SignupRow): void {
    setDeletePlayerTarget(player);
  }

  function closeDeletePlayerModal(): void {
    if (deletePlayerPending) return;
    setDeletePlayerTarget(null);
  }

  function submitDeletePlayer(): void {
    if (!selectedGameId || !deletePlayerTarget || rosterSavingSignupId) return;
    setHostRosterError(null);
    setRosterSavingSignupId(deletePlayerTarget.id);
    startDeletePlayerTransition(async () => {
      try {
        const { setSignupRosterStatusForHost } = await import("@/server/actions/host-signup");
        const fd = new FormData();
        fd.set("gameId", selectedGameId);
        fd.set("signupId", deletePlayerTarget.id);
        fd.set("status", "deleted");
        const res = await setSignupRosterStatusForHost(fd);
        if (!res.ok) {
          setHostRosterError(res.error);
          return;
        }
        setDeletePlayerTarget(null);
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

  if (!mergedGames.length) {
    return (
      <section className="host-dashboard-main host-dashboard-empty">
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
      <section className="host-dashboard-hero" style={{ borderBottom: "2px solid var(--ink)", background: "var(--ink)", color: "var(--paper)" }}>
        <div className="host-dashboard-hero-inner">
          <div className="label" style={{ color: "rgba(251,248,241,.5)" }}>Host dashboard</div>
          <h1 className="display host-dashboard-hero-title" style={{ fontSize: "clamp(40px, 7vw, 76px)", margin: 0, letterSpacing: "-.03em" }}>
            My{" "}
            <span className="serif-display" style={{ fontStyle: "italic", color: "var(--accent)", textTransform: "lowercase" }}>
              roster.
            </span>
          </h1>
          <div className="host-dashboard-hero-actions">
            <select
              className="input xl select-input-invert browse-roster-game-select host-dashboard-game-select"
              aria-label="Select game"
              value={selectedGameId}
              onChange={(event) => setPickedGameId(event.target.value)}
            >
              {gameSelectOptions.map((game) => {
                const isPastOnlyRow =
                  activeGames.length > 0 && pastDropinGames.some((g) => g.id === game.id);
                return (
                  <option key={game.id} value={game.id}>
                    {isPastOnlyRow ? `Past · ${game.title}` : game.title}
                  </option>
                );
              })}
            </select>
            {pastDropinGames.length > 0 ? (
              <button
                type="button"
                className="btn sm ghost"
                style={{ height: 44, minHeight: 44, flexShrink: 0 }}
                onClick={() => setPastGamesModalOpen(true)}
              >
                Past games
              </button>
            ) : null}
            <Link href="/host/new" className="btn lg accent host-dashboard-hero-cta" style={{ height: 56, minHeight: 56 }}>
              Host a new game
            </Link>
          </div>
          {activeGames.length === 0 && pastDropinGames.length > 0 ? (
            <p
              className="mono"
              style={{
                margin: "12px 0 0",
                fontSize: 12,
                letterSpacing: ".04em",
                color: "rgba(251,248,241,.72)",
                maxWidth: 560,
                lineHeight: 1.45,
              }}
            >
              All upcoming sessions have ended. Open Past games to switch sessions, or use the menu above.
            </p>
          ) : null}
          {selectedGame ? (
            <div className="mono host-dashboard-hero-organizer" style={{ fontSize: 11, letterSpacing: ".06em", color: "rgba(251,248,241,.65)" }}>
              Presenting organizer · {gameOrganizationDisplayName(selectedGame)}
            </div>
          ) : null}
        </div>
      </section>

      <section className="host-dashboard-main">
        {gmailFlash ? (
          <HostGmailNotice tone={gmailFlash.tone} message={gmailFlash.text} style={{ marginBottom: 18 }} />
        ) : null}
        <div className="host-roster-content-grid">
          <div>
            <div className="host-roster-toolbar">
              <div className="host-roster-filters" role="tablist" aria-label="Roster views">
                {[
                  { id: "all" as const, label: "All", n: rosterActiveRows.length },
                  { id: "paid" as const, label: "Paid", n: totals.paid },
                  { id: "pending" as const, label: "Pending", n: totals.pending },
                  { id: "refund" as const, label: "Refund", n: totals.refund },
                  { id: "canceled" as const, label: "Canceled", n: totals.canceled },
                ].map((entry) => (
                  <button
                    key={entry.id}
                    type="button"
                    role="tab"
                    aria-selected={filter === entry.id}
                    className="roster-filter-btn"
                    title={`${entry.label} (${entry.n})`}
                    style={{
                      background: filter === entry.id ? "var(--ink)" : "transparent",
                      color: filter === entry.id ? "var(--paper)" : "var(--ink)",
                    }}
                    onClick={() => setFilter(entry.id)}
                  >
                    <span className="roster-filter-btn-icon" aria-hidden>
                      <RosterFilterIcon filterId={entry.id} />
                    </span>
                    <span className="roster-filter-btn-label">{entry.label}</span>
                    <span className="mono roster-filter-btn-count">{entry.n}</span>
                  </button>
                ))}
              </div>
              <div className="host-roster-toolbar-actions">
                <button type="button" className="btn sm accent" onClick={openAddPlayerModal}>
                  Add player
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

            {!showHostRosterSection ? (
              <div className="card" style={{ padding: "24px 18px", color: "var(--ink-2)", fontSize: 14 }}>
                No players in this view yet.
              </div>
            ) : (
              <>
                <div className="card roster-table host-roster-desktop-only" style={{ padding: 0, overflow: "hidden" }}>
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
                  {displayedPaddedRows.map((player, index) => (
                    <div
                      key={player ? player.id : `placeholder-${index}`}
                      className="host-dashboard-roster-row"
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "36px minmax(0, 2.25fr) minmax(84px, 0.9fr) minmax(140px, 1fr)",
                        alignItems: "center",
                        padding: "14px 18px",
                        borderBottom: index === displayedPaddedRows.length - 1 ? "none" : "1px dashed var(--ink-3)",
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
                              <div style={{ fontWeight: 700, fontSize: 14, overflowWrap: "anywhere" }}>
                                {player.player_name}
                              </div>
                              <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: ".06em" }}>
                                signed {formatSignedAgo(player.created_at)}
                              </div>
                              <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: ".04em", overflowWrap: "anywhere" }}>
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
                              onDelete={() => openDeletePlayerModal(player)}
                              onReport={() => openReportPlayerModal(player)}
                            />
                          )
                        ) : (
                          <span className="mono">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="host-roster-mobile-only" aria-label="Roster">
                  {displayedMobilePlayers.map((player, index) => (
                    <div key={player.id} className="card host-roster-mobile-card">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              flexShrink: 0,
                              borderRadius: "50%",
                              background: "var(--accent)",
                              border: "2px solid var(--ink)",
                              display: "grid",
                              placeItems: "center",
                              fontWeight: 900,
                              fontSize: 12,
                            }}
                          >
                            {initials(player.player_name)}
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.25, overflowWrap: "anywhere" }}>
                              {player.player_name}
                            </div>
                            <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: ".06em", marginTop: 4 }}>
                              signed {formatSignedAgo(player.created_at)}
                            </div>
                            <div className="mono" style={{ fontSize: 10.5, color: "var(--ink-3)", letterSpacing: ".04em", overflowWrap: "anywhere", marginTop: 2 }}>
                              {player.player_email}
                            </div>
                          </div>
                        </div>
                        <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)", fontWeight: 800, flexShrink: 0 }}>
                          #{String(index + 1).padStart(2, "0")}
                        </span>
                      </div>
                      <div
                        style={{
                          marginTop: 14,
                          paddingTop: 14,
                          borderTop: "2px dashed var(--ink-3)",
                        }}
                      >
                        <div className="label" style={{ marginBottom: 6 }}>
                          Reference
                        </div>
                        <div className="mono" style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".06em" }}>
                          {player.payment_code}
                        </div>
                      </div>
                      <div style={{ marginTop: 14 }}>
                        <div className="label" style={{ marginBottom: 8 }}>
                          Payment status
                        </div>
                        {rosterSavingSignupId === player.id ? (
                          <span className="mono" style={{ fontSize: 11, letterSpacing: ".08em", color: "var(--ink-2)" }}>
                            Saving...
                          </span>
                        ) : (
                          <HostPaymentActionsDropdown
                            player={player}
                            status={player.payment_status}
                            disabled={hostRosterPending}
                            onSelect={(next) => requestPaymentStatus(player, next)}
                            onRemove={() => openRemovePlayerModal(player)}
                            onDelete={() => openDeletePlayerModal(player)}
                            onReport={() => openReportPlayerModal(player)}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                  {filter !== "refund" && filter !== "canceled" ? (
                    (() => {
                      const capacity = selectedGame?.capacity ?? 0;
                      const openSlots = Math.max(capacity - filteredRoster.length, 0);
                      if (openSlots <= 0) return null;
                      return (
                        <div className="card host-roster-mobile-card host-roster-open-spots-summary">
                          <div className="label" style={{ marginBottom: 6 }}>
                            Open roster spots
                          </div>
                          <p style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: "-.02em" }}>{openSlots}</p>
                          <p className="mono" style={{ margin: "8px 0 0", fontSize: 11, letterSpacing: ".06em", color: "var(--ink-3)" }}>
                            Capacity {capacity} · {filteredRoster.length} filled in this view
                          </p>
                        </div>
                      );
                    })()
                  ) : null}
                </div>
              </>
            )}
          {filteredRoster.length > 10 && rosterRowsVisible < rosterPagerTotal ? (
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
          {filter === "all" && rosterArchivedRows.length > 0 ? (
            <div className="card" style={{ marginTop: 12, padding: 14 }}>
              <div className="label" style={{ marginBottom: 8 }}>
                Archived players
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                {rosterArchivedRows.map((player) => (
                  <div
                    key={`archived-${player.id}`}
                    className="host-dashboard-archived-row"
                  >
                    <span style={{ fontSize: 14, minWidth: 0, overflowWrap: "anywhere" }}>
                      {player.player_name} ({player.player_email})
                    </span>
                    <HostPaymentActionsDropdown
                      player={player}
                      status={player.payment_status}
                      disabled={hostRosterPending}
                      onSelect={(next) => requestPaymentStatus(player, next)}
                      onRemove={() => openRemovePlayerModal(player)}
                      onDelete={() => openDeletePlayerModal(player)}
                      onReport={() => openReportPlayerModal(player)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          </div>
          <div style={{ display: "grid", gap: 14 }}>
            {selectedGame ? (
              <HostGameDetailsCard key={selectedGame.id} game={selectedGame} organizations={organizations} />
            ) : null}
            <HostPayoutAndGmailCard
              hostGmailConnected={hostGmailConnected}
              variant="with-games"
              interacDraft={interacDraft}
              onInteracDraftChange={setInteracDraft}
              interacPending={interacPending}
              interacError={interacError}
              onSaveInterac={saveInteracEmail}
            />
          </div>
        </div>
        {pastGamesModalOpen ? (
          <div
            role="dialog"
            className="motion-fade-in"
            aria-modal
            aria-label="Past games"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(17,17,20,.55)",
              zIndex: 60,
              display: "grid",
              placeItems: "center",
              padding: 18,
            }}
            onClick={() => setPastGamesModalOpen(false)}
          >
            <div
              className="card motion-sheet-panel"
              style={{ width: "min(520px, 100%)", padding: 18 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="label" style={{ marginBottom: 8 }}>
                Host dashboard
              </div>
              <h3 className="display" style={{ fontSize: "clamp(22px, 4vw, 32px)", margin: "0 0 14px" }}>
                Past games
              </h3>
              <div
                style={{
                  display: "grid",
                  gap: 8,
                  maxHeight: "min(52vh, 360px)",
                  overflowY: "auto",
                }}
              >
                {pastDropinsSorted.map((game) => (
                  <button
                    key={game.id}
                    type="button"
                    className="btn sm ghost"
                    onClick={() => {
                      setPickedGameId(game.id);
                      setPastGamesModalOpen(false);
                    }}
                    style={{
                      justifyContent: "space-between",
                      textAlign: "left",
                      width: "100%",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontWeight: 700, overflowWrap: "anywhere" }}>{game.title}</span>
                    <span className="mono" style={{ fontSize: 11, flexShrink: 0, letterSpacing: ".04em" }}>
                      {new Date(game.starts_at).toLocaleDateString("en-CA", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </button>
                ))}
              </div>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                <button type="button" className="btn sm ghost" onClick={() => setPastGamesModalOpen(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {addPlayerOpen ? (
          <div
            role="dialog"
            className="motion-fade-in"
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
              className="card motion-sheet-panel"
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
            className="motion-fade-in"
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
            <div className="card motion-sheet-panel" style={{ width: "min(480px, 100%)", padding: 18 }} onClick={(e) => e.stopPropagation()}>
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
            className="motion-fade-in"
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
            <div className="card motion-sheet-panel" style={{ width: "min(560px, 100%)", padding: 18 }} onClick={(e) => e.stopPropagation()}>
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
        {deletePlayerTarget ? (
          <div
            role="dialog"
            className="motion-fade-in"
            aria-modal
            aria-label="Delete player"
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(17,17,20,.55)",
              zIndex: 60,
              display: "grid",
              placeItems: "center",
              padding: 18,
            }}
            onClick={closeDeletePlayerModal}
          >
            <div className="card motion-sheet-panel" style={{ width: "min(480px, 100%)", padding: 18 }} onClick={(e) => e.stopPropagation()}>
              <div className="label" style={{ marginBottom: 8 }}>
                Host roster
              </div>
              <h3 className="display" style={{ fontSize: "clamp(22px, 4vw, 30px)", margin: "0 0 10px" }}>
                Delete player
              </h3>
              <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.45 }}>
                Permanently delete <strong>{deletePlayerTarget.player_name}</strong> from this roster?
              </p>
              <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 8, flexWrap: "wrap" }}>
                <button type="button" className="btn sm ghost" onClick={closeDeletePlayerModal} disabled={deletePlayerPending}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn sm accent"
                  onClick={submitDeletePlayer}
                  disabled={deletePlayerPending}
                  aria-busy={deletePlayerPending}
                >
                  {deletePlayerPending ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </>
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

function IcoRefund(props: { size?: number }) {
  const s = props.size ?? 15;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="1.85" />
      <path d="M12 8v5M12 16h.01" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" />
    </svg>
  );
}

function RosterFilterIcon({ filterId }: { filterId: PaymentFilter }) {
  const s = 16;
  switch (filterId) {
    case "all":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "paid":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "pending":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "refund":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 14l-4-4 4-4M5 10h11a4 4 0 014 4 4 4 0 01-4 4h-2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "canceled":
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
          <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
  }
}

function HostPaymentStatusBadge({ status }: { status: SignupPaymentStatus }) {
  if (status === "paid") {
    return (
      <span className="chip" style={{ background: "var(--ok)", borderColor: "var(--ok)", color: "var(--paper)" }}>
        Paid
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className="chip" style={{ background: "var(--payment-sent)", borderColor: "var(--ink)", color: "var(--paper)" }}>
        Pending
      </span>
    );
  }
  if (status === "refund") {
    return (
      <span className="chip" style={{ background: "var(--warn)", borderColor: "var(--warn)", color: "var(--paper)" }}>
        Refund
      </span>
    );
  }
  return (
    <span className="chip" style={{ background: "var(--ink-2)", borderColor: "var(--ink-2)", color: "var(--paper)" }}>
      Canceled
    </span>
  );
}

function HostPaymentActionsDropdown({
  player,
  status,
  disabled,
  onSelect,
  onRemove,
  onDelete,
  onReport,
}: {
  player: SignupRow;
  status: SignupPaymentStatus;
  disabled: boolean;
  onSelect: (next: SignupPaymentStatus) => void;
  onRemove: () => void;
  onDelete: () => void;
  onReport: () => void;
}) {
  const options: SignupPaymentStatus[] = ["paid", "pending", "refund", "canceled"];
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
          padding: "8px 10px",
          border: "none",
          background: "transparent",
          boxShadow: "none",
          listStyle: "none",
          minHeight: 40,
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
        <div className="host-payment-actions-panel motion-pop-panel">
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
                onDelete();
                setOpen(false);
              }}
              style={{ justifyContent: "flex-start" }}
            >
              Delete player
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

