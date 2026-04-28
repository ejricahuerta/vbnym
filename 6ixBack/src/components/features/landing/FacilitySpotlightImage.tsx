"use client";

import { useState } from "react";

/**
 * Venue photos live in `public/facilities/` as plain JPEGs. Use a native <img> so the
 * browser requests `/facilities/...` directly. `next/image` optimization can 404 or
 * trip onError (e.g. deploy missing files, extensions, or /_next/image quirks) and
 * show the gradient fallback even when static files exist.
 */
export function FacilitySpotlightImage(props: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, var(--accent) 0%, var(--paper) 45%, var(--bg) 100%)",
          opacity: 0.85,
        }}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- local public JPEGs; avoid /_next/image so loads match static files on disk and deploy
    <img
      src={props.src}
      alt={props.alt}
      sizes={props.sizes}
      decoding="async"
      loading={props.priority ? "eager" : "lazy"}
      {...(props.priority ? { fetchPriority: "high" as const } : {})}
      onError={() => setFailed(true)}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  );
}
