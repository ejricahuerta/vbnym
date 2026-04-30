"use client";

import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { PlayerCancelAction } from "@/components/features/player/PlayerCancelAction";
import type { PlayerSignupWithGame } from "@/server/queries/player-signups-by-email";

type PaymentFilter = "all" | "paid" | "pending" | "refund" | "canceled";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

function formatMoney(cents: number): string {
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(cents / 100);
}

function formatStart(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-CA", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "America/Toronto",
    });
  } catch {
    return iso;
  }
}

function canPlayerCancelSignup(startsAtIso: string, paymentStatus: string, signupStatus: string): boolean {
  if (!["active", "waitlist"].includes(signupStatus)) return false;
  if (!["paid", "pending"].includes(paymentStatus)) return false;
  const msUntilStart = Date.parse(startsAtIso) - Date.now();
  return Number.isFinite(msUntilStart) && msUntilStart > TWO_HOURS_MS;
}

function isActiveRosterStatus(status: string): boolean {
  return status === "active" || status === "waitlist";
}

function matchesFilter(row: PlayerSignupWithGame, filter: PaymentFilter): boolean {
  const rosterActive = isActiveRosterStatus(row.signup.status);
  if (filter === "all") return rosterActive;
  if (filter === "paid") return rosterActive && row.signup.payment_status === "paid";
  if (filter === "pending") return rosterActive && row.signup.payment_status === "pending";
  if (filter === "refund") return row.signup.payment_status === "refund";
  return row.signup.payment_status === "canceled";
}

export function PlayerPortalTable({ rows }: { rows: PlayerSignupWithGame[] }): ReactElement {
  const router = useRouter();
  const [filter, setFilter] = useState<PaymentFilter>("all");

  const counts = useMemo(() => {
    const activeRows = rows.filter((row) => isActiveRosterStatus(row.signup.status));
    return {
      all: activeRows.length,
      paid: activeRows.filter((row) => row.signup.payment_status === "paid").length,
      pending: activeRows.filter((row) => row.signup.payment_status === "pending").length,
      refund: rows.filter((row) => row.signup.payment_status === "refund").length,
      canceled: rows.filter((row) => row.signup.payment_status === "canceled").length,
    };
  }, [rows]);

  const filteredRows = useMemo(() => rows.filter((row) => matchesFilter(row, filter)), [rows, filter]);

  const emptyLabel =
    filter === "all"
      ? "No active signups found."
      : filter === "paid"
        ? "No paid signups found."
        : filter === "pending"
          ? "No pending signups found."
          : filter === "refund"
            ? "No refund signups found."
            : "No canceled signups found.";

  return (
    <>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {([
          { id: "all" as const, label: "Active", n: counts.all },
          { id: "paid" as const, label: "Paid", n: counts.paid },
          { id: "pending" as const, label: "Pending", n: counts.pending },
          { id: "refund" as const, label: "Refund", n: counts.refund },
          { id: "canceled" as const, label: "Canceled", n: counts.canceled },
        ]).map((entry) => (
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
            <span className="roster-filter-btn-label">{entry.label}</span>
            <span className="mono roster-filter-btn-count">{entry.n}</span>
          </button>
        ))}
      </div>

      {filteredRows.length === 0 ? (
        <div className="card" style={{ padding: "22px 24px", border: "2px solid var(--ink)" }}>
          <p style={{ margin: 0, fontSize: 15 }}>{emptyLabel}</p>
        </div>
      ) : (
        <>
          <div className="player-mobile-list">
            {filteredRows.map(({ signup, game }) => (
              <article
                key={`mobile-${signup.id}`}
                className="card"
                role="button"
                tabIndex={0}
                aria-label={`Open ${game.title}`}
                onClick={() => router.push(`/games/${game.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/games/${game.id}`);
                  }
                }}
                style={{ padding: 14, cursor: "pointer" }}
              >
                <h2 className="display" style={{ fontSize: 24, margin: "0 0 8px", letterSpacing: "-.02em" }}>
                  {game.title}
                </h2>
                <p style={{ margin: "0 0 10px", color: "var(--ink-2)", fontSize: 14 }}>{formatStart(game.starts_at)}</p>
                <p style={{ margin: "0 0 10px", color: "var(--ink-2)", fontSize: 14 }}>
                  {game.venue_name}
                  {game.venue_area ? ` · ${game.venue_area}` : ""}
                </p>
                <div className="mono" style={{ display: "grid", gap: 6, fontSize: 11, letterSpacing: ".08em" }}>
                  <div>PRICE · {formatMoney(game.price_cents)}</div>
                  <div>PLAYER · {signup.player_name}</div>
                  <div>CODE · {signup.payment_code}</div>
                  <div style={{ textTransform: "capitalize" }}>PAYMENT · {signup.payment_status}</div>
                  <div style={{ textTransform: "capitalize" }}>ROSTER · {signup.status}</div>
                </div>
                {canPlayerCancelSignup(game.starts_at, signup.payment_status, signup.status) ? (
                  <div
                    style={{ marginTop: 12 }}
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <PlayerCancelAction
                      gameId={game.id}
                      signupId={signup.id}
                      playerName={signup.player_name}
                      paymentStatus={signup.payment_status}
                      fullWidth
                    />
                  </div>
                ) : (
                  <div className="mono" style={{ marginTop: 12, fontSize: 11, color: "var(--ink-3)", letterSpacing: ".08em" }}>
                    ACTION · VIEW ONLY
                  </div>
                )}
              </article>
            ))}
          </div>
          <div className="player-desktop-table" style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "2px solid var(--ink)",
                fontSize: 14,
              }}
            >
              <thead>
                <tr style={{ background: "var(--ink)", color: "var(--paper)", textAlign: "left" }}>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Game</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>When</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Venue</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Price</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>You</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Code</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Payment</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Roster</th>
                  <th style={{ padding: "12px 14px", fontWeight: 700 }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map(({ signup, game }) => (
                  <tr
                    key={signup.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Open ${game.title}`}
                    onClick={() => router.push(`/games/${game.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        router.push(`/games/${game.id}`);
                      }
                    }}
                    style={{ borderTop: "2px solid var(--ink)", cursor: "pointer" }}
                  >
                    <td style={{ padding: "12px 14px", fontWeight: 600 }}>{game.title}</td>
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>{formatStart(game.starts_at)}</td>
                    <td
                      style={{ padding: "12px 14px" }}
                      onClick={(event) => event.stopPropagation()}
                      onKeyDown={(event) => event.stopPropagation()}
                    >
                      {game.venue_name}
                      {game.venue_area ? ` · ${game.venue_area}` : ""}
                    </td>
                    <td style={{ padding: "12px 14px" }}>{formatMoney(game.price_cents)}</td>
                    <td style={{ padding: "12px 14px" }}>{signup.player_name}</td>
                    <td className="mono" style={{ padding: "12px 14px", fontSize: 12 }}>
                      {signup.payment_code}
                    </td>
                    <td style={{ padding: "12px 14px", textTransform: "capitalize" }}>{signup.payment_status}</td>
                    <td style={{ padding: "12px 14px", textTransform: "capitalize" }}>{signup.status}</td>
                    <td style={{ padding: "12px 14px" }}>
                      {canPlayerCancelSignup(game.starts_at, signup.payment_status, signup.status) ? (
                        <PlayerCancelAction
                          gameId={game.id}
                          signupId={signup.id}
                          playerName={signup.player_name}
                          paymentStatus={signup.payment_status}
                        />
                      ) : (
                        <span className="mono" style={{ color: "var(--ink-3)", fontSize: 11, letterSpacing: ".08em" }}>
                          View only
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
