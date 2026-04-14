"use client";

import { useMemo } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import type { Game } from "@/types/vbnym";
import {
  copyableVenueLineForClipboard,
  formatGameCourtLine,
  formatGameTimeRangeLabel,
  hasDistinctGameAddress,
} from "@/lib/game-display";
import { Button } from "@/components/ui/button";
import { CopyTextButton } from "@/components/ui/copy-text-button";
import { Card } from "@/components/ui/card";
import "leaflet/dist/leaflet.css";

type Props = {
  games: Game[];
};

export function GamesMap({ games }: Props) {
  const withCoords = useMemo(
    () => games.filter((g) => g.lat != null && g.lng != null),
    [games]
  );

  const center = useMemo((): [number, number] => {
    if (withCoords.length === 0) return [43.7, -79.38];
    const lat = withCoords.reduce((s, g) => s + (g.lat as number), 0) / withCoords.length;
    const lng = withCoords.reduce((s, g) => s + (g.lng as number), 0) / withCoords.length;
    return [lat, lng];
  }, [withCoords]);

  if (withCoords.length === 0) {
    return (
      <Card
        size="sm"
        className="flex min-h-[320px] flex-col items-center justify-center gap-0 border-dashed bg-muted/20 px-6 py-12 text-center text-sm text-muted-foreground shadow-none md:min-h-[360px] lg:min-h-[420px]"
      >
        No pinned locations yet. Add latitude and longitude to games in admin to
        show them on the map.
      </Card>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={11}
      scrollWheelZoom
      className="z-0 h-[min(52vh,480px)] w-full overflow-hidden rounded-xl ring-1 ring-border/80 md:h-[min(55vh,520px)] lg:h-[min(60vh,600px)]"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {withCoords.map((game) => {
        const court = formatGameCourtLine(game.court);
        return (
          <CircleMarker
            key={game.id}
            center={[game.lat as number, game.lng as number]}
            radius={11}
            pathOptions={{
              color: "#003DA5",
              fillColor: "#D4A200",
              fillOpacity: 0.9,
              weight: 2,
            }}
          >
            <Popup>
              <div className="min-w-[170px] space-y-2 p-1">
                <p className="text-sm font-semibold leading-tight">{game.location}</p>
                {court ? <p className="text-xs font-medium text-accent">{court}</p> : null}
                {hasDistinctGameAddress(game.location, game.address) ? (
                  <CopyTextButton
                    text={copyableVenueLineForClipboard(game.location, game.address)}
                    label="Copy address"
                    variant="ghost"
                    size="icon-xs"
                    className="max-w-full text-xs font-normal text-muted-foreground hover:text-foreground"
                  >
                    <span className="min-w-0 break-words">{game.address}</span>
                  </CopyTextButton>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {game.date} · {formatGameTimeRangeLabel(game)}
                </p>
                <Button variant="link" className="h-auto p-0 text-sm font-medium" asChild>
                  <Link href={`/games/${game.id}`}>View & join</Link>
                </Button>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
