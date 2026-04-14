"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { updateGame } from "@/actions/admin-games";
import { AdminGameFormFields } from "@/components/admin/admin-game-form-fields";
import { Button } from "@/components/ui/button";
import { SubmitSpinner } from "@/components/ui/submit-spinner";
import { Card } from "@/components/ui/card";
import { useGooglePlacesAutocomplete } from "@/hooks/use-google-places-autocomplete";
import type { Game, Venue } from "@/types/vbnym";

export function EditGameForm({
  game,
  venues = [],
  adminAlreadySignedUp = false,
}: {
  game: Game;
  venues?: Venue[];
  /** True when the signed-in admin already has a signup row for this game. */
  adminAlreadySignedUp?: boolean;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [fieldVersion, setFieldVersion] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);

  const locationRef = useRef<HTMLInputElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const latRef = useRef<HTMLInputElement>(null);
  const lngRef = useRef<HTMLInputElement>(null);

  const { mapsKeyMissing, placesLoadError } = useGooglePlacesAutocomplete({
    addressRef,
    locationRef,
    latRef,
    lngRef,
  });

  function resetForm() {
    formRef.current?.reset();
    setFieldVersion((v) => v + 1);
    setMsg(null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setMsg(null);
    setPending(true);
    const fd = new FormData(form);
    const res = await updateGame(fd);
    setPending(false);
    if (!res.ok) {
      setMsg(res.error);
      return;
    }
    setMsg("Game saved.");
  }

  return (
    <Card className="flex max-h-[min(85vh,calc(100dvh-6rem))] flex-col gap-0 overflow-hidden p-0">
      <form
        ref={formRef}
        onSubmit={onSubmit}
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <input type="hidden" name="id" value={game.id} />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          <div className="grid min-w-0 gap-4 sm:grid-cols-2">
            <AdminGameFormFields
              key={fieldVersion}
              defaults={game}
              venues={venues}
              locationRef={locationRef}
              addressRef={addressRef}
              latRef={latRef}
              lngRef={lngRef}
              mapsKeyMissing={mapsKeyMissing}
              placesLoadError={placesLoadError}
              adminAlreadySignedUp={adminAlreadySignedUp}
            />
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
              <Link href="/admin/games">Back to games</Link>
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
