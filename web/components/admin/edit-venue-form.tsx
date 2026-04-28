"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { updateVenue } from "@/server/actions/admin-venues";
import { Button } from "@/components/ui/button";
import { SubmitSpinner } from "@/components/ui/submit-spinner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGooglePlacesAutocomplete } from "@/hooks/use-google-places-autocomplete";
import { venueImageOrPlaceholder } from "@/lib/venue-placeholder-image";
import type { Venue } from "@/types/vbnym";

export function EditVenueForm({ venue }: { venue: Venue }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fieldVersion, setFieldVersion] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const nameRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);
  const imageUrlRef = useRef<HTMLInputElement>(null);

  const [previewUrl, setPreviewUrl] = useState(venue.image_url?.trim() ?? "");

  const { mapsKeyMissing, placesLoadError } = useGooglePlacesAutocomplete({
    addressRef,
    locationRef: nameRef,
    latRef,
    lngRef,
    imageUrlRef,
  });

  const syncPreview = useCallback(() => {
    setPreviewUrl(imageUrlRef.current?.value.trim() ?? "");
  }, []);

  useEffect(() => {
    const el = imageUrlRef.current;
    if (!el) return;
    const obs = new MutationObserver(() => syncPreview());
    obs.observe(el, { attributes: true, attributeFilter: ["value"] });
    el.addEventListener("input", syncPreview);
    el.addEventListener("change", syncPreview);
    return () => {
      obs.disconnect();
      el.removeEventListener("input", syncPreview);
      el.removeEventListener("change", syncPreview);
    };
  }, [syncPreview]);

  function resetForm() {
    formRef.current?.reset();
    setFieldVersion((v) => v + 1);
    setMsg(null);
    setPreviewUrl(venue.image_url?.trim() ?? "");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setMsg(null);
    setPending(true);
    const fd = new FormData(form);
    const res = await updateVenue(fd);
    setPending(false);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    setMsg("Venue saved.");
  }

  const v = venue;

  return (
    <Card className="flex max-h-[min(85vh,calc(100dvh-6rem))] flex-col gap-0 overflow-hidden p-0">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <input type="hidden" name="id" value={v.id} />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div key={fieldVersion} className="grid min-w-0 gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-venue-name">Venue name</Label>
              <Input
                ref={nameRef}
                id="edit-venue-name"
                name="name"
                required
                defaultValue={v.name}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-venue-address">Address</Label>
              <Input
                ref={addressRef}
                id="edit-venue-address"
                name="address"
                placeholder="Start typing for Google suggestions..."
                autoComplete="off"
                defaultValue={v.address ?? ""}
              />
              {mapsKeyMissing ? (
                <p className="text-xs text-muted-foreground">
                  Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable address autocomplete.
                </p>
              ) : placesLoadError ? (
                <p className="text-xs text-destructive">{placesLoadError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Pick a suggestion to fill the map pin (latitude / longitude).
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-venue-lat">Latitude (optional)</Label>
              <Input
                ref={latRef}
                id="edit-venue-lat"
                name="lat"
                type="text"
                placeholder="43.637"
                defaultValue={v.lat != null ? String(v.lat) : ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-venue-lng">Longitude (optional)</Label>
              <Input
                ref={lngRef}
                id="edit-venue-lng"
                name="lng"
                type="text"
                placeholder="-79.45"
                defaultValue={v.lng != null ? String(v.lng) : ""}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="edit-venue-image-url">Venue photo URL (optional)</Label>
              <Input
                ref={imageUrlRef}
                id="edit-venue-image-url"
                name="image_url"
                type="url"
                placeholder="From Google address pick or paste an image link"
                defaultValue={v.image_url ?? ""}
                onChange={syncPreview}
              />
              <p className="text-xs text-muted-foreground">
                Shown on the public home when games use this saved venue.
              </p>
              {(() => {
                const src = previewUrl || venueImageOrPlaceholder(null, v.id);
                return (
                  <div className="overflow-hidden rounded-lg border border-border/60">
                    <img
                      alt="Venue photo preview"
                      src={src}
                      className="aspect-[5/3] w-full object-cover"
                    />
                    {!previewUrl && (
                      <p className="px-3 py-1.5 text-xs text-muted-foreground">
                        Placeholder → add a URL above to preview the actual photo
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
            <div className="flex items-start gap-3 sm:col-span-2">
              <input
                id="edit-venue-featured"
                name="is_featured"
                type="checkbox"
                value="on"
                defaultChecked={v.is_featured === true}
                className="mt-1 size-4 shrink-0 rounded border-input accent-primary"
              />
              <div className="min-w-0 space-y-1">
                <Label htmlFor="edit-venue-featured" className="font-medium leading-snug">
                  Feature on public home page
                </Label>
                <p className="text-xs text-muted-foreground">
                  Only one venue can be featured; saving this clears the flag on other venues.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="sticky bottom-[4.5rem] z-10 flex shrink-0 flex-wrap items-center gap-3 border-t border-border bg-popover px-4 py-4 shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.12)] sm:px-6 md:bottom-0 dark:shadow-[0_-8px_24px_-8px_rgba(0,0,0,0.35)]">
          <Button type="button" variant="outline" onClick={resetForm}>
            Reset
          </Button>
          {msg ? (
            <p
              className={
                msg.includes("saved")
                  ? "text-sm text-green-600"
                  : "text-sm text-destructive"
              }
            >
              {msg}
            </p>
          ) : null}
          <div className="ms-auto flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={pending} className="gap-2">
              {pending ? (
                <>
                  <SubmitSpinner />
                  Saving…
                </>
              ) : (
                "Save changes"
              )}
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/admin/venues">Back to venues</Link>
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
