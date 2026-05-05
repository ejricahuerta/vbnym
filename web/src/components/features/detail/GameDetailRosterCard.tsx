"use client";

import type { ReactElement } from "react";

import { useRequestGameDetailSignup } from "@/components/features/detail/GameDetailSignupOpener";

export type GameDetailRosterRow = {
  id: string;
  player_name: string;
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function GameDetailRosterCard(props: {
  rosterLength: number;
  rosterPreview: GameDetailRosterRow[];
  moreCount: number;
  ghostSlots: number;
  showGhosts: boolean;
  dark: boolean;
  fg: string;
  fgMuted: string;
}): ReactElement {
  const requestOpen = useRequestGameDetailSignup();
  const { rosterLength, rosterPreview, moreCount, ghostSlots, showGhosts, dark, fg, fgMuted } = props;
  const ghosts = showGhosts ? ghostSlots : 0;

  type Segment = "empty" | "player" | "more" | "ghost";
  const segments: Segment[] = [];
  if (rosterLength === 0) segments.push("empty");
  for (let i = 0; i < rosterPreview.length; i++) segments.push("player");
  if (moreCount > 0) segments.push("more");
  for (let g = 0; g < ghosts; g++) segments.push("ghost");
  const lastIndex = segments.length - 1;

  let playerIndex = 0;

  return (
    <>
      {segments.map((kind, i) => {
        const borderBottom = i === lastIndex ? "none" : "1px dashed var(--ink-3)";
        if (kind === "empty") {
          return (
            <div key="empty" style={{ padding: 14, fontSize: 13, color: fgMuted, borderBottom }}>
              No one yet.
            </div>
          );
        }
        if (kind === "player") {
          const row = rosterPreview[playerIndex]!;
          playerIndex += 1;
          return (
            <div
              key={row.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 14px",
                borderBottom,
                color: fg,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: "50%",
                  background: dark ? "rgba(251,248,241,.12)" : "var(--bg)",
                  border: "1.5px solid var(--ink)",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 900,
                  fontSize: 11,
                  fontFamily: "var(--display)",
                  flexShrink: 0,
                }}
              >
                {initials(row.player_name)}
              </div>
              <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{row.player_name}</div>
            </div>
          );
        }
        if (kind === "more") {
          return (
            <div
              key="more"
              className="mono"
              style={{
                padding: "12px 14px",
                textAlign: "center",
                fontSize: 11,
                color: fgMuted,
                background: dark ? "rgba(251,248,241,.06)" : "var(--bg)",
                letterSpacing: ".12em",
                fontWeight: 700,
                borderBottom,
              }}
            >
              + {moreCount} MORE
            </div>
          );
        }
        return (
          <button
            key={`ghost-${i}`}
            type="button"
            onClick={() => requestOpen()}
            aria-label="Sign up for this game"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderBottom,
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              width: "100%",
              textAlign: "left",
              cursor: "pointer",
              background: dark ? "rgba(251,248,241,.04)" : "var(--bg)",
              color: fg,
              font: "inherit",
            }}
          >
            <div
              aria-hidden
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "transparent",
                border: "1.5px dashed var(--ink-3)",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
                fontSize: 11,
                fontFamily: "var(--display)",
                flexShrink: 0,
                color: fgMuted,
              }}
            >
              +
            </div>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: fgMuted }}>Open spot</span>
          </button>
        );
      })}
    </>
  );
}
