"use client";

import { MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function MapViewPlaceholder() {
  return (
    <Card
      size="sm"
      className="flex min-h-[320px] flex-col items-center justify-center border-dashed border-muted-foreground/25 shadow-none"
    >
      <CardContent className="flex flex-col items-center gap-3 py-16 text-center text-muted-foreground">
        <MapPin className="size-10 opacity-40" aria-hidden />
        <p className="max-w-sm text-sm">
          Map view will show run pins here. List view has full details for now.
        </p>
      </CardContent>
    </Card>
  );
}
