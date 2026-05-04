"use client";

import { useRouter } from "next/navigation";
import { type ReactElement, useEffect, useMemo, useState, useTransition } from "react";

import { KindBadge } from "@/components/shared/UiPrimitives";
import { buildStartsAtIso, isoToLocalDateAndTime } from "@/lib/host-datetime";
import type { GameRow, OrganizationRow } from "@/types/domain";

const SKILL_LEVELS = ["Beginner", "Intermediate", "Advanced", "Competitive"] as const;

export function HostGameDetailsCard({
  game,
  organizations,
}: {
  game: GameRow;
  organizations: OrganizationRow[];
}): ReactElement {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(game.title);
  const [venueName, setVenueName] = useState(game.venue_name);
  const [venueArea, setVenueArea] = useState(game.venue_area ?? "");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(String(game.duration_minutes));
  const [skillLevel, setSkillLevel] = useState(game.skill_level);
  const [capacity, setCapacity] = useState(String(game.capacity));
  const [priceDollars, setPriceDollars] = useState(String(Math.max(0, Math.round(game.price_cents / 100))));
  const [formatNotes, setFormatNotes] = useState(game.notes ?? "");
  const [hostName, setHostName] = useState(game.host_name);
  const [organizationId, setOrganizationId] = useState(game.organization_id);

  useEffect(() => {
    const local = isoToLocalDateAndTime(game.starts_at);
    setTitle(game.title);
    setVenueName(game.venue_name);
    setVenueArea(game.venue_area ?? "");
    setDate(local.date);
    setTime(local.time || "19:00");
    setDurationMinutes(String(game.duration_minutes));
    setSkillLevel(game.skill_level);
    setCapacity(String(game.capacity));
    setPriceDollars(String(Math.max(0, Math.round(game.price_cents / 100))));
    setFormatNotes(game.notes ?? "");
    setHostName(game.host_name);
    setOrganizationId(game.organization_id);
    setError(null);
  }, [game]);

  useEffect(() => {
    if (organizations.length === 0) return;
    const stillValid = organizations.some((o) => o.id === organizationId);
    if (!stillValid) {
      setOrganizationId(organizations[0]?.id ?? organizationId);
    }
  }, [organizations, organizationId]);

  function save(): void {
    const startsAt = buildStartsAtIso(date, time);
    if (!startsAt) {
      setError("Pick a valid date and time.");
      return;
    }
    const fd = new FormData();
    fd.set("gameId", game.id);
    fd.set("title", title);
    fd.set("venueName", venueName);
    fd.set("venueArea", venueArea);
    fd.set("startsAt", startsAt);
    fd.set("durationMinutes", durationMinutes);
    fd.set("skillLevel", skillLevel);
    fd.set("capacity", capacity);
    fd.set("priceCents", String(Math.round((Number(priceDollars) || 0) * 100)));
    fd.set("format", formatNotes);
    fd.set("hostName", hostName);
    fd.set("organizationId", organizationId);

    setError(null);
    startTransition(async () => {
      const { updateHostLiveGameDetails } = await import("@/server/actions/host");
      const res = await updateHostLiveGameDetails(fd);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  const minCapacity = game.signed_count;
  const skillOptions = useMemo(() => {
    const base = [...SKILL_LEVELS] as string[];
    if (skillLevel.trim() && !base.includes(skillLevel)) {
      return [skillLevel, ...base];
    }
    return base;
  }, [skillLevel]);

  if (game.status === "cancelled") {
    return (
      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
          <div className="label">Game details</div>
          <KindBadge kind={game.kind} />
        </div>
        <p style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.45, color: "var(--ink-2)" }}>
          This game was cancelled. Listing edits are closed → you can still use the roster for refunds and records.
        </p>
        <p className="mono" style={{ margin: 0, fontSize: 12, letterSpacing: ".04em", color: "var(--ink-3)" }}>
          {game.title} · {game.venue_name}
        </p>
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 12 }}>
        <div className="label">Game details</div>
        <KindBadge kind={game.kind} />
      </div>
      <p style={{ margin: "0 0 14px", fontSize: 13, lineHeight: 1.45, color: "var(--ink-2)" }}>
        Listing for this game. Interac payout email stays in Host payouts below.
      </p>
      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gap: 4 }}>
          <span className="label" style={{ fontSize: 11 }}>
            Title
          </span>
          <input className="input" type="text" value={title} onChange={(e) => setTitle(e.target.value)} disabled={pending} />
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span className="label" style={{ fontSize: 11 }}>
            Venue
          </span>
          <input className="input" type="text" value={venueName} onChange={(e) => setVenueName(e.target.value)} disabled={pending} />
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span className="label" style={{ fontSize: 11 }}>
            Area (optional)
          </span>
          <input className="input" type="text" value={venueArea} onChange={(e) => setVenueArea(e.target.value)} disabled={pending} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <span className="label" style={{ fontSize: 11 }}>
              Date
            </span>
            <input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={pending} />
          </div>
          <div style={{ display: "grid", gap: 4 }}>
            <span className="label" style={{ fontSize: 11 }}>
              Time
            </span>
            <input className="input" type="time" value={time} onChange={(e) => setTime(e.target.value)} disabled={pending} />
          </div>
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span className="label" style={{ fontSize: 11 }}>
            Duration (minutes)
          </span>
          <input
            className="input"
            type="number"
            min={30}
            step={15}
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            disabled={pending}
          />
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span className="label" style={{ fontSize: 11 }}>
            Skill level
          </span>
          <select className="input" value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} disabled={pending}>
            {skillOptions.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span className="label" style={{ fontSize: 11 }}>
            Capacity
          </span>
          <input
            className="input"
            type="number"
            min={Math.max(2, minCapacity)}
            step={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            disabled={pending}
          />
          <span className="mono" style={{ fontSize: 10, color: "var(--ink-3)", letterSpacing: ".04em" }}>
            At least {minCapacity} (current roster size).
          </span>
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span className="label" style={{ fontSize: 11 }}>
            Price per player ($)
          </span>
          <input className="input" type="number" min={0} step={1} value={priceDollars} onChange={(e) => setPriceDollars(e.target.value)} disabled={pending} />
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span className="label" style={{ fontSize: 11 }}>
            Format and notes
          </span>
          <textarea
            className="input"
            rows={3}
            value={formatNotes}
            onChange={(e) => setFormatNotes(e.target.value)}
            disabled={pending}
            style={{ resize: "vertical", minHeight: 72 }}
          />
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span className="label" style={{ fontSize: 11 }}>
            Host display name
          </span>
          <input className="input" type="text" value={hostName} onChange={(e) => setHostName(e.target.value)} disabled={pending} />
        </div>
        <div style={{ display: "grid", gap: 4 }}>
          <span className="label" style={{ fontSize: 11 }}>
            Presenting organizer
          </span>
          <select className="input" value={organizationId} onChange={(e) => setOrganizationId(e.target.value)} disabled={pending || organizations.length === 0}>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>
        {error ? (
          <p role="alert" style={{ margin: 0, fontSize: 13, color: "var(--warn)", fontWeight: 600 }}>
            {error}
          </p>
        ) : null}
        <button type="button" className="btn sm accent" onClick={save} disabled={pending} aria-busy={pending} style={{ justifySelf: "start" }}>
          {pending ? "Saving…" : "Save game details"}
        </button>
      </div>
    </div>
  );
}
