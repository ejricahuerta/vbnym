"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseGameDateString } from "@/lib/game-date-input";
import {
  addMinutesToTimeParts,
  gameTimeToTimeInputValue,
  parseGameTimeToParts,
  timePartsToHHmm,
  type TimeParts,
} from "@/lib/game-time-input";
import {
  localDateTimeToISO,
  parseRegistrationOpensForPicker,
} from "@/lib/registration-opens-input";
import { cn } from "@/lib/utils";
import type { Game, Venue } from "@/types/vbnym";

const HOURS_0_23 = Array.from({ length: 24 }, (_, h) => h);
const MINUTES_0_59 = Array.from({ length: 60 }, (_, m) => m);

export type AdminGameFormDefaults = Partial<
  Pick<
    Game,
    | "venue_id"
    | "location"
    | "address"
    | "lat"
    | "lng"
    | "date"
    | "time"
    | "end_time"
    | "cap"
    | "price"
    | "etransfer"
    | "listed"
    | "registration_opens_at"
    | "entry_instructions"
    | "court"
  >
>;

type Props = {
  defaults?: AdminGameFormDefaults;
  /** Saved venues for the “apply to form” picker (create/edit game). */
  venues?: Venue[];
  locationRef: React.RefObject<HTMLInputElement | null>;
  addressRef: React.RefObject<HTMLInputElement | null>;
  latRef: React.RefObject<HTMLInputElement | null>;
  lngRef: React.RefObject<HTMLInputElement | null>;
  mapsKeyMissing: boolean;
  placesLoadError: string | null;
  /** Edit flow: hide self-add when this admin is already a signup for the game. */
  adminAlreadySignedUp?: boolean;
};

function AdminFormCollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50"
      >
        <span>{title}</span>
        <ChevronDown
          aria-hidden
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="grid gap-4 bg-muted/15 px-4 py-4 sm:grid-cols-2 [&_*]:min-w-0">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

const VENUE_NONE = "__none__";

function AdminGameTimePicker({
  id,
  label,
  hiddenName,
  required,
  parts,
  setParts,
  open,
  setOpen,
}: {
  id: string;
  label: string;
  hiddenName: string;
  required?: boolean;
  parts: TimeParts;
  setParts: React.Dispatch<React.SetStateAction<TimeParts>>;
  open: boolean;
  setOpen: (o: boolean) => void;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <input
        type="hidden"
        name={hiddenName}
        value={timePartsToHHmm(parts)}
        required={required}
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            className="h-9 w-full min-w-0 justify-start rounded-3xl text-left font-normal"
          >
            <Clock className="size-4 shrink-0 opacity-70" />
            {format(new Date(2020, 0, 1, parts.hour, parts.minute), "h:mm a")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-3" align="start">
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Hour</span>
              <Select
                value={String(parts.hour)}
                onValueChange={(v) =>
                  setParts((p) => ({
                    ...p,
                    hour: Number.parseInt(v, 10),
                  }))
                }
              >
                <SelectTrigger className="w-[6.5rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {HOURS_0_23.map((h) => (
                    <SelectItem key={h} value={String(h)}>
                      {format(new Date(2020, 0, 1, h, 0), "h a")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-muted-foreground">Minute</span>
              <Select
                value={String(parts.minute)}
                onValueChange={(v) =>
                  setParts((p) => ({
                    ...p,
                    minute: Number.parseInt(v, 10),
                  }))
                }
              >
                <SelectTrigger className="w-[4.5rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {MINUTES_0_59.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {String(m).padStart(2, "0")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function AdminGameFormFields({
  defaults,
  venues,
  locationRef,
  addressRef,
  latRef,
  lngRef,
  mapsKeyMissing,
  placesLoadError,
  adminAlreadySignedUp = false,
}: Props) {
  const d = defaults ?? {};
  const visibilityDefault = d.listed === false ? "invite" : "public";
  const initialRegOpens = parseRegistrationOpensForPicker(
    d.registration_opens_at
  );
  const [visibility, setVisibility] = useState(visibilityDefault);
  const [gameDate, setGameDate] = useState<Date | undefined>(() =>
    parseGameDateString(d.date)
  );
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [timeParts, setTimeParts] = useState(() => parseGameTimeToParts(d.time));
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [endTimeParts, setEndTimeParts] = useState<TimeParts>(() => {
    const raw = d.end_time?.trim();
    if (raw && gameTimeToTimeInputValue(raw)) {
      return parseGameTimeToParts(raw);
    }
    return addMinutesToTimeParts(parseGameTimeToParts(d.time), 180);
  });
  const [endTimePickerOpen, setEndTimePickerOpen] = useState(false);
  const [regOpensDate, setRegOpensDate] = useState<Date | undefined>(
    () => initialRegOpens.date
  );
  const [regOpensTime, setRegOpensTime] = useState<TimeParts>(
    () => initialRegOpens.time
  );
  const [regDatePickerOpen, setRegDatePickerOpen] = useState(false);
  const [regTimePickerOpen, setRegTimePickerOpen] = useState(false);
  const [appliedVenueId, setAppliedVenueId] = useState(
    () => (d.venue_id && String(d.venue_id).trim()) || ""
  );

  function applySavedVenue(id: string) {
    if (!id) {
      setAppliedVenueId("");
      return;
    }
    const v = venues?.find((x) => x.id === id);
    if (!v) return;
    setAppliedVenueId(id);
    if (locationRef.current) locationRef.current.value = v.name;
    if (addressRef.current) addressRef.current.value = v.address ?? "";
    if (latRef.current) latRef.current.value = v.lat != null ? String(v.lat) : "";
    if (lngRef.current) lngRef.current.value = v.lng != null ? String(v.lng) : "";
  }

  return (
    <div className="sm:col-span-2 divide-y rounded-2xl border border-border">
      <AdminFormCollapsibleSection title="Venue" defaultOpen={true}>
        <input type="hidden" name="venue_id" value={appliedVenueId} />
        {venues && venues.length > 0 ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="apply-saved-venue">Saved venue</Label>
            <Select
              value={appliedVenueId || VENUE_NONE}
              onValueChange={(v) => {
                if (v === VENUE_NONE) applySavedVenue("");
                else applySavedVenue(v);
              }}
            >
              <SelectTrigger id="apply-saved-venue" className="w-full">
                <SelectValue placeholder="None — type manually" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VENUE_NONE}>None (type manually)</SelectItem>
                {venues.map((v) => (
                  <SelectItem key={v.id} value={v.id}>
                    {v.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Pick a saved venue to fill location and address, then adjust if needed.
            </p>
          </div>
        ) : null}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="location">Location</Label>
          <Input
            ref={locationRef}
            id="location"
            name="location"
            required
            placeholder="Court or venue name"
            defaultValue={d.location ?? ""}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Input
            ref={addressRef}
            id="address"
            name="address"
            placeholder="Start typing for Google suggestions..."
            autoComplete="off"
            defaultValue={d.address ?? ""}
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
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="court">Court number or letter (optional)</Label>
          <Input
            id="court"
            name="court"
            placeholder="e.g. 3, A, B2"
            defaultValue={d.court ?? ""}
            maxLength={32}
          />
          <p className="text-xs text-muted-foreground">
            Shown on the public schedule and game page so players know which court to use.
          </p>
        </div>
      </AdminFormCollapsibleSection>

      <AdminFormCollapsibleSection title="Schedule & spots">
        <div className="space-y-2 sm:col-span-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="game-date-trigger">Date</Label>
              <input
                type="hidden"
                name="date"
                value={gameDate ? format(gameDate, "yyyy-MM-dd") : ""}
                required
              />
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="game-date-trigger"
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-9 w-full min-w-0 justify-start rounded-3xl text-left font-normal",
                      !gameDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="size-4 shrink-0 opacity-70" />
                    {gameDate ? (
                      format(gameDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={gameDate}
                    onSelect={(next) => {
                      setGameDate(next);
                      setDatePickerOpen(false);
                    }}
                    defaultMonth={gameDate ?? new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid min-w-0 grid-cols-2 gap-4">
              <AdminGameTimePicker
                id="game-time-trigger"
                label="Start"
                hiddenName="time"
                required
                parts={timeParts}
                setParts={setTimeParts}
                open={timePickerOpen}
                setOpen={setTimePickerOpen}
              />
              <AdminGameTimePicker
                id="game-end-time-trigger"
                label="End"
                hiddenName="end_time"
                required
                parts={endTimeParts}
                setParts={setEndTimeParts}
                open={endTimePickerOpen}
                setOpen={setEndTimePickerOpen}
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cap">Cap (people)</Label>
          <Input
            id="cap"
            name="cap"
            type="number"
            min={2}
            required
            defaultValue={d.cap ?? 18}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price (CAD)</Label>
          <Input
            id="price"
            name="price"
            type="number"
            step="0.01"
            min={0}
            required
            defaultValue={d.price ?? 15}
          />
        </div>
        {adminAlreadySignedUp ? (
          <p className="text-sm text-muted-foreground sm:col-span-2">
            You are already on the player list for this game.
          </p>
        ) : (
          <div className="flex items-start gap-3 sm:col-span-2">
            <input
              type="checkbox"
              id="admin-will-play"
              name="admin_will_play"
              value="on"
              className="mt-1 size-4 shrink-0 rounded border border-input accent-primary"
            />
            <div className="min-w-0 space-y-1">
              <label
                htmlFor="admin-will-play"
                className="cursor-pointer text-sm font-medium leading-snug text-foreground"
              >
                I&apos;m playing — add me to the player list
              </label>
              <p className="text-xs text-muted-foreground">
                One spot under your login email, marked paid (organizer). Waiver is
                recorded as accepted for this entry.
              </p>
            </div>
          </div>
        )}
      </AdminFormCollapsibleSection>

      <AdminFormCollapsibleSection title="Payment & listing">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="etransfer">E-transfer email</Label>
          <Input
            id="etransfer"
            name="etransfer"
            type="email"
            required
            defaultValue={d.etransfer ?? ""}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="visibility">Listing</Label>
          <input type="hidden" name="visibility" value={visibility} />
          <Select value={visibility} onValueChange={setVisibility}>
            <SelectTrigger id="visibility" className="w-full">
              <SelectValue placeholder="Choose visibility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="public">Public (on home map & list)</SelectItem>
              <SelectItem value="invite">Invite-only (hidden from public)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="registration-date-trigger">
              Registration opens (optional)
            </Label>
            {regOpensDate ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-muted-foreground"
                onClick={() => {
                  setRegOpensDate(undefined);
                  setRegDatePickerOpen(false);
                  setRegTimePickerOpen(false);
                }}
              >
                Clear
              </Button>
            ) : null}
          </div>
          <input
            type="hidden"
            name="registration_opens_at"
            value={
              regOpensDate
                ? localDateTimeToISO(regOpensDate, regOpensTime)
                : ""
            }
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Popover open={regDatePickerOpen} onOpenChange={setRegDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="registration-date-trigger"
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-9 w-full min-w-0 justify-start rounded-3xl text-left font-normal",
                      !regOpensDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="size-4 shrink-0 opacity-70" />
                    {regOpensDate ? (
                      format(regOpensDate, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={regOpensDate}
                    onSelect={(next) => {
                      setRegOpensDate(next);
                      setRegDatePickerOpen(false);
                    }}
                    defaultMonth={regOpensDate ?? new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Popover
                open={regTimePickerOpen}
                onOpenChange={setRegTimePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    id="registration-time-trigger"
                    type="button"
                    variant="outline"
                    disabled={!regOpensDate}
                    className={cn(
                      "h-9 w-full min-w-0 justify-start rounded-3xl text-left font-normal",
                      !regOpensDate && "text-muted-foreground"
                    )}
                  >
                    <Clock className="size-4 shrink-0 opacity-70" />
                    {regOpensDate ? (
                      format(
                        new Date(
                          2020,
                          0,
                          1,
                          regOpensTime.hour,
                          regOpensTime.minute
                        ),
                        "h:mm a"
                      )
                    ) : (
                      <span>Pick a date first</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-3" align="start">
                  <div className="flex gap-3">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-muted-foreground">Hour</span>
                      <Select
                        value={String(regOpensTime.hour)}
                        onValueChange={(v) =>
                          setRegOpensTime((p) => ({
                            ...p,
                            hour: Number.parseInt(v, 10),
                          }))
                        }
                      >
                        <SelectTrigger className="w-[6.5rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-56">
                          {HOURS_0_23.map((h) => (
                            <SelectItem key={h} value={String(h)}>
                              {format(new Date(2020, 0, 1, h, 0), "h a")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        Minute
                      </span>
                      <Select
                        value={String(regOpensTime.minute)}
                        onValueChange={(v) =>
                          setRegOpensTime((p) => ({
                            ...p,
                            minute: Number.parseInt(v, 10),
                          }))
                        }
                      >
                        <SelectTrigger className="w-[4.5rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-56">
                          {MINUTES_0_59.map((m) => (
                            <SelectItem key={m} value={String(m)}>
                              {String(m).padStart(2, "0")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Leave date unset to open immediately. When set in the future, join is
            disabled until that time (coming-soon cards).
          </p>
        </div>
      </AdminFormCollapsibleSection>

      <AdminFormCollapsibleSection title="Directions & map pin">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="entry_instructions">How to enter (optional)</Label>
          <Textarea
            id="entry_instructions"
            name="entry_instructions"
            placeholder="e.g. Side door by the tennis courts, court 4 upstairs. Parking lot B."
            rows={4}
            defaultValue={d.entry_instructions ?? ""}
          />
          <p className="text-xs text-muted-foreground">
            Shown on the public game page so players know which door, gate code, or
            court to use.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lat">Lat (optional)</Label>
          <Input
            ref={latRef}
            id="lat"
            name="lat"
            type="text"
            placeholder="43.637"
            defaultValue={d.lat != null ? String(d.lat) : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lng">Lng (optional)</Label>
          <Input
            ref={lngRef}
            id="lng"
            name="lng"
            type="text"
            placeholder="-79.45"
            defaultValue={d.lng != null ? String(d.lng) : ""}
          />
        </div>
      </AdminFormCollapsibleSection>
    </div>
  );
}
