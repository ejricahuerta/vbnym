import Link from "next/link";

import type { FacilitySpotlight } from "@/types/schemas/facility-spotlight";

import { FacilitySpotlightImage } from "./FacilitySpotlightImage";

function googleMapsHref(spot: FacilitySpotlight): string {
  if (spot.resolvedPlaceId) {
    return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(spot.resolvedPlaceId)}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(spot.findQuery)}`;
}

function areaLabel(area: FacilitySpotlight["area"]): string {
  if (area === "markham") return "Markham";
  return "North York";
}

export function LandingFacilitiesSection({ facilities }: { facilities: FacilitySpotlight[] }) {
  return (
    <section className="landing-section-fade" style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div className="label" style={{ marginBottom: 10 }}>
            04 → Where we play
          </div>
          <h2 className="display landing-text-rise" style={{ fontSize: "clamp(36px, 6vw, 64px)", margin: 0, letterSpacing: "-.03em", maxWidth: 720 }}>
            Courts across{" "}
            <span className="serif-display" style={{ fontStyle: "italic" }}>
              North York
            </span>
            {" "}and{" "}
            <span className="serif-display" style={{ fontStyle: "italic" }}>
              Markham.
            </span>
          </h2>
        </div>
        <p style={{ margin: 0, maxWidth: 380, fontSize: 14, color: "var(--ink-2)", lineHeight: 1.55 }}>
          Indoor co-ed 6s on hardwood → gyms hosts use across North York and Markham.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }} className="landing-week-grid">
        {facilities.map((spot, index) => (
          <article
            key={spot.slug}
            className="card liftable landing-week-card"
            style={{
              padding: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animationDelay: `${index * 0.06}s`,
            }}
          >
            <div style={{ position: "relative", aspectRatio: "16 / 10", background: "var(--bg)", borderBottom: "2px solid var(--ink)" }}>
              <FacilitySpotlightImage
                src={spot.photoUrl}
                alt={`${spot.displayName} (venue photo)`}
                sizes="(max-width: 920px) 100vw, 33vw"
                priority={index === 0}
              />
              <div style={{ position: "absolute", left: 12, top: 12 }}>
                <span className="chip outline" style={{ background: "rgba(251,248,241,.92)", borderColor: "var(--ink)" }}>
                  {areaLabel(spot.area)}
                </span>
              </div>
            </div>
            <div style={{ padding: 18, flex: 1, display: "flex", flexDirection: "column", gap: 10 }}>
              <h3 className="display landing-card-title" style={{ margin: 0, fontSize: 20, letterSpacing: "-.02em", lineHeight: 1.15 }}>
                {spot.displayName}
              </h3>
              <p style={{ margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5, flex: 1 }}>{spot.teaser}</p>
              <div style={{ fontSize: 12, color: "var(--ink-3)", lineHeight: 1.45 }}>
                {spot.formattedAddress ?? spot.findQuery}
              </div>
              <Link
                href={googleMapsHref(spot)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn sm"
                style={{ alignSelf: "flex-start", marginTop: 4 }}
              >
                Open in Google Maps
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
