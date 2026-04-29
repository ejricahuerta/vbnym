import { ImageResponse } from "next/og";

import { getGameWithRoster } from "@/server/queries/games";

export const runtime = "edge";
export const alt = "6ix Back Volleyball game preview";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

function formatDateTime(iso: string): string {
  const date = new Date(iso);
  const dateText = date.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
  const timeText = date.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", hour12: true });
  return `${dateText} at ${timeText}`;
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getGameWithRoster(id);

  if (!data) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#101820",
            color: "#FBF8F1",
            padding: 48,
            justifyContent: "space-between",
            border: "8px solid #F2C84B",
          }}
        >
          <div style={{ fontSize: 24, letterSpacing: 2, fontWeight: 700 }}>6IX BACK VOLLEYBALL</div>
          <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1 }}>Game unavailable</div>
          <div style={{ fontSize: 28, opacity: 0.85 }}>Browse live listings on 6ix Back.</div>
        </div>
      ),
      size
    );
  }

  const { game } = data;
  const venueLine = [game.venue_name, game.venue_area].filter(Boolean).join(" → ");
  const filledSpots = `${game.signed_count}/${game.capacity} spots filled`;
  const kindLabel = game.kind === "dropin" ? "DROP-IN" : game.kind === "league" ? "LEAGUE" : "TOURNAMENT";
  const darkTheme = game.kind === "league";
  const background = darkTheme ? "#101820" : "#FBF8F1";
  const foreground = darkTheme ? "#FBF8F1" : "#101820";
  const subtle = darkTheme ? "rgba(251,248,241,0.8)" : "rgba(16,24,32,0.75)";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background,
          color: foreground,
          padding: 44,
          border: `8px solid ${darkTheme ? "#FBF8F1" : "#101820"}`,
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1.8 }}>6IX BACK VOLLEYBALL</div>
          <div
            style={{
              border: `3px solid ${foreground}`,
              padding: "6px 16px",
              fontSize: 20,
              letterSpacing: 2,
              fontWeight: 800,
            }}
          >
            {kindLabel}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ fontSize: 70, fontWeight: 900, lineHeight: 1 }}>{game.title}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 28, color: subtle }}>
            <div>{formatDateTime(game.starts_at)}</div>
            <div>{venueLine}</div>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 26 }}>
          <div style={{ fontWeight: 700 }}>{game.skill_level}</div>
          <div style={{ fontWeight: 700 }}>{filledSpots}</div>
        </div>
      </div>
    ),
    size
  );
}
