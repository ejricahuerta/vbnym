import Image from "next/image";
import Link from "next/link";
import { Calendar, ExternalLink, Navigation, Video } from "lucide-react";
import { getUpcomingGamesWithSignups } from "@/lib/data/games";
import { getVenues } from "@/lib/data/venues";
import { copyableVenueLineForClipboard, hasDistinctGameAddress } from "@/lib/game-display";
import { Button } from "@/components/ui/button";
import { CopyTextButton } from "@/components/ui/copy-text-button";
import { googleDirectionsUrlFromPlace } from "@/lib/maps-links";
import { venueImageOrPlaceholder } from "@/lib/venue-placeholder-image";
import { SiteHeader } from "@/components/layout/site-header";
import { MobileDock } from "@/components/layout/mobile-dock";
import { FooterPoliciesModalTrigger } from "@/components/layout/footer-policies-modal-trigger";
import { WhatsAppRosterMock } from "@/components/marketing/whatsapp-roster-mock";
import { GamesHome, GamesHomeSkeleton } from "@/components/games/games-home";
import { FindMyGamesDialog } from "@/components/games/find-my-games-dialog";
import { Suspense } from "react";
import type { Venue } from "@/types/vbnym";

/** https://www.youtube.com/@jptrg3657 — uploads playlist (UU…) for embed */
const JPTRG_YOUTUBE_UPLOADS_PLAYLIST_ID = "UU6ycsD5o9ZyMgQrnueuDGrQ";
const JPTRG_YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@jptrg3657";

export default async function HomePage() {
  const [{ games, signupsByGameId, usingMock, fetchError }, { venues: venueRows, error: venuesFetchError }] =
    await Promise.all([getUpcomingGamesWithSignups(), getVenues()]);

  const firstGame = games[0];

  const featuredVenue: Venue | null =
    venueRows.length === 0
      ? null
      : (venueRows.find((v) => v.is_featured) ?? venueRows[0] ?? null);

  const otherVenues =
    featuredVenue != null ? venueRows.filter((v) => v.id !== featuredVenue.id) : [];

  const useSavedVenues = featuredVenue != null;

  const venueHeroSrc = useSavedVenues
    ? venueImageOrPlaceholder(featuredVenue.image_url, featuredVenue.id)
    : firstGame
      ? venueImageOrPlaceholder(
          firstGame.venue_image_url,
          firstGame.venue_id ?? firstGame.id
        )
      : venueImageOrPlaceholder(null, "nym-home-venue-hero");

  const venueHeroAlt = useSavedVenues
    ? `${featuredVenue.name}. Venue photo`
    : firstGame
      ? `${firstGame.location}. Venue photo`
      : "Featured volleyball venue";

  const venueDisplayName = useSavedVenues
    ? featuredVenue.name
    : (firstGame?.location ?? "Featured venue");

  const venueLocationLabel = useSavedVenues
    ? hasDistinctGameAddress(featuredVenue.name, featuredVenue.address)
      ? String(featuredVenue.address).trim()
      : featuredVenue.name
    : firstGame && hasDistinctGameAddress(firstGame.location, firstGame.address)
      ? String(firstGame.address).trim()
      : (firstGame?.location ?? "Markham");

  const venueClipboardText = useSavedVenues
    ? copyableVenueLineForClipboard(featuredVenue.name, featuredVenue.address)
    : firstGame
      ? copyableVenueLineForClipboard(firstGame.location, firstGame.address)
      : "Markham";

  const featuredSeeGamesHref = useSavedVenues
    ? `/?venue=${featuredVenue.id}#games`
    : firstGame?.venue_id
      ? `/?venue=${firstGame.venue_id}#games`
      : "/#games";

  const featuredDirectionsUrl = useSavedVenues
    ? googleDirectionsUrlFromPlace({
        lat: featuredVenue.lat,
        lng: featuredVenue.lng,
        address: featuredVenue.address,
        label: featuredVenue.name,
      })
    : firstGame
      ? googleDirectionsUrlFromPlace({
          lat: firstGame.lat,
          lng: firstGame.lng,
          address: firstGame.address,
          label: firstGame.location,
        })
      : null;

  return (
    <div className="bg-background text-foreground">
      <SiteHeader />

      <main>
        {/* ── Hero + Schedule (merged) ─────────────────────────── */}
        <section id="games" className="relative">
          {/* Hero background */}
          <div className="relative min-h-[52vh] sm:min-h-[56vh]">
            <Image
              src="/hero.jpg"
              alt="Indoor volleyball game in motion"
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/65 to-black/92" />

            {/* Hero content */}
            <div className="relative flex min-h-[52vh] flex-col justify-end px-4 pb-16 pt-28 sm:min-h-[56vh] sm:px-6 sm:pb-20 lg:px-8">
              <div className="mx-auto w-full max-w-6xl">
                <h1 className="mb-4 max-w-3xl text-4xl font-black leading-[0.92] tracking-tight text-white sm:mb-5 sm:text-6xl lg:text-7xl">
                  North York &amp; Markham Volleyball Community
                </h1>
                <p className="max-w-xl text-sm leading-relaxed text-white/80 sm:text-lg">
                  Whether you&apos;re looking to sharpen your skills or just enjoy some
                  quality volleyball, you&apos;ll fit right in. We run balanced drop-ins
                  with real team-style 5–1 gameplay and the occasional mini tournament.
                  Competitive enough to be meaningful, friendly enough to feel like home.
                </p>
              </div>
            </div>
          </div>

          {/* Schedule card — overlaps hero */}
          <div className="relative z-10 -mt-8 px-3 pb-12 sm:-mt-12 sm:px-5 sm:pb-16 lg:px-8">
            <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl border border-border/70 bg-background shadow-xl sm:rounded-3xl">
              <div className="border-b border-border/50 bg-muted/40 px-4 py-4 sm:px-6 sm:py-5">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <h2 className="text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
                    Upcoming games
                  </h2>
                  <FindMyGamesDialog>
                    <button
                      type="button"
                      className="text-xs font-bold text-accent underline decoration-accent/60 underline-offset-4 transition hover:opacity-80 sm:text-sm"
                    >
                      My saved games
                    </button>
                  </FindMyGamesDialog>
                </div>
              </div>
              <Suspense fallback={<GamesHomeSkeleton />}>
                <GamesHome
                  embedded
                  games={games}
                  signupsByGameId={signupsByGameId}
                  usingMock={usingMock}
                  fetchError={fetchError}
                />
              </Suspense>
            </div>
          </div>
        </section>

        {/* ── Venues: one featured hero, then the rest ─────────── */}
        <section id="venue" className="relative">
          <div className="relative h-[520px] overflow-hidden sm:h-[600px]">
            <img
              className="h-full w-full object-cover"
              alt={venueHeroAlt}
              src={venueHeroSrc}
            />
            <div className="absolute inset-0 flex items-center bg-gradient-to-b from-black/75 via-black/55 to-black/80">
              <div className="w-full px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl rounded-2xl border border-white/15 bg-white/10 p-8 backdrop-blur-xl sm:p-12">
                  <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent">
                    Featured venue
                  </p>
                  <h2 className="mb-6 text-4xl font-black uppercase italic tracking-tight text-white sm:text-6xl">
                    {venueDisplayName}
                  </h2>
                  {venuesFetchError && venueRows.length === 0 ? (
                    <p className="mb-4 text-sm text-amber-200/90">
                      Could not load saved venues ({venuesFetchError}). Showing schedule location
                      when available.
                    </p>
                  ) : null}
                  <div className="mt-8 grid grid-cols-1 gap-6 border-t border-white/20 pt-8 sm:grid-cols-2 sm:gap-10">
                    <div>
                      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
                        Location
                      </h4>
                      <CopyTextButton
                        text={venueClipboardText}
                        label="Copy address"
                        variant="ghost"
                        className="text-white hover:bg-white/10 hover:text-white"
                      >
                        <span className="text-xl font-bold leading-snug text-white">{venueLocationLabel}</span>
                      </CopyTextButton>
                    </div>
                    <div>
                      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/60">
                        Games &amp; directions
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          asChild
                          variant="outline"
                          className="gap-2 border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                        >
                          <Link href={featuredSeeGamesHref}>
                            <Calendar className="size-4" aria-hidden />
                            See games
                          </Link>
                        </Button>
                        {featuredDirectionsUrl ? (
                          <Button
                            asChild
                            variant="outline"
                            className="gap-2 border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                          >
                            <a href={featuredDirectionsUrl} target="_blank" rel="noopener noreferrer">
                              <Navigation className="size-4" aria-hidden />
                              Get directions
                            </a>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {otherVenues.length > 0 ? (
            <div className="border-t border-border bg-muted/25 px-4 py-12 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-6xl">
                <h3 className="mb-2 text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
                  More venues
                </h3>
                <p className="mb-8 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  We run games across the area. Jump to the schedule for a venue or open directions
                  in Google Maps.
                </p>
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {otherVenues.map((v) => {
                    const img = venueImageOrPlaceholder(v.image_url, v.id);
                    const locLabel = hasDistinctGameAddress(v.name, v.address)
                      ? String(v.address).trim()
                      : v.name;
                    const clip = copyableVenueLineForClipboard(v.name, v.address);
                    const directionsUrl = googleDirectionsUrlFromPlace({
                      lat: v.lat,
                      lng: v.lng,
                      address: v.address,
                      label: v.name,
                    });
                    return (
                      <li
                        key={v.id}
                        className="flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
                      >
                        <img alt="" src={img} className="aspect-[5/3] w-full object-cover" />
                        <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
                          <h4 className="text-lg font-bold leading-snug text-foreground">{v.name}</h4>
                          <CopyTextButton
                            text={clip}
                            label="Copy address"
                            variant="ghost"
                            size="sm"
                            className="max-w-full text-sm font-normal leading-relaxed text-muted-foreground hover:text-foreground"
                          >
                            <span className="min-w-0">{locLabel}</span>
                          </CopyTextButton>
                          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
                            <Button asChild size="sm" className="gap-1.5">
                              <Link href={`/?venue=${v.id}#games`}>
                                <Calendar className="size-3.5" aria-hidden />
                                See games
                              </Link>
                            </Button>
                            {directionsUrl ? (
                              <Button asChild size="sm" variant="outline" className="gap-1.5">
                                <a href={directionsUrl} target="_blank" rel="noopener noreferrer">
                                  <Navigation className="size-3.5" aria-hidden />
                                  Get directions
                                </a>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          ) : null}
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section id="how-it-works" className="bg-background py-20 sm:py-28">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 sm:mb-14">
              <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                How it works
              </h2>
              <p className="max-w-xl text-base text-muted-foreground">
                No accounts, no card fees. Pick a game, pay by Interac e-Transfer,
                and your spot is confirmed automatically.
              </p>
            </div>

            <ol className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              <li className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
                <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
                  1
                </span>
                <h3 className="mb-2 text-lg font-bold text-foreground">Pick a game</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Browse the schedule, check spots and who&apos;s signed up, then enter
                  your name and email to claim a spot.
                </p>
              </li>
              <li className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
                <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
                  2
                </span>
                <h3 className="mb-2 text-lg font-bold text-foreground">Pay by e-Transfer</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Send an Interac e-Transfer with the payment code you receive.
                  Your spot is held for 15 minutes while you pay.
                </p>
              </li>
              <li className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm sm:p-8">
                <span className="mb-4 flex size-10 items-center justify-center rounded-full bg-accent text-lg font-bold text-accent-foreground">
                  3
                </span>
                <h3 className="mb-2 text-lg font-bold text-foreground">Show up &amp; play</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Payment is verified automatically. You&apos;ll get a confirmation email,
                  and you&apos;re on the roster. Just show up on time.
                </p>
              </li>
            </ol>
          </div>
        </section>

        {/* ── YouTube ───────────────────────────────────────────── */}
        <section id="youtube" className="border-y border-border/60 bg-muted/20 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl">
              <span className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                <Video className="size-4 text-red-600 dark:text-red-500" aria-hidden />
                YouTube
              </span>
              <h2 className="mb-3 text-3xl font-extrabold tracking-tight text-primary sm:text-4xl">
                Highlights &amp; updates
              </h2>
              <p className="text-base leading-relaxed text-muted-foreground">
                Catch game footage, announcements, and community moments on our channel.
              </p>
            </div>
            <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border/80 bg-black shadow-lg">
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/videoseries?list=${JPTRG_YOUTUBE_UPLOADS_PLAYLIST_ID}`}
                title="JPtr G — latest videos on YouTube"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
                loading="lazy"
              />
            </div>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <a href={JPTRG_YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="size-4" aria-hidden />
                Open channel on YouTube
              </a>
            </Button>
          </div>
        </section>

        {/* ── About / Our Story ────────────────────────────────── */}
        <section
          id="about"
          className="bg-primary pt-20 pb-24 text-primary-foreground sm:pt-28 sm:pb-28"
        >
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
              <div>
                <span className="mb-3 block text-xs font-bold uppercase tracking-[0.2em] text-primary-foreground/50">
                  Our story
                </span>
                <h2 className="mb-6 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Why we built this
                </h2>
                <div className="space-y-4 text-sm leading-relaxed text-primary-foreground/80 sm:text-base">
                  <p>
                    Games and rosters used to live in WhatsApp. Someone would post game
                    details, players replied with numbers to claim spots, and e-transfers
                    were sent on the honour system. It worked when the group was small.
                  </p>
                  <p>
                    As more players joined, tracking who paid got harder. Copy-pasting
                    numbered lists, chasing transfers, and manually updating rosters
                    every week turned into real admin work for the organizers.
                  </p>
                  <p>
                    We built this site so sign-ups, spot holds, and payment verification
                    happen automatically. We kept Interac e-Transfer to avoid card fees
                    and keep game prices low. The organizer&apos;s inbox is synced so
                    payments are matched in minutes, not hours.
                  </p>
                  <p>
                    The goal is simple: less admin, more volleyball.
                  </p>
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <div className="overflow-hidden rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.07] p-1 sm:p-1.5">
                  <WhatsAppRosterMock />
                </div>
                <p className="mt-3 text-center text-xs text-primary-foreground/50">
                  How games were managed before — numbered lists in WhatsApp. Sample mock-up
                  for illustration (not a real chat).
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-footer-foreground/10 bg-footer pb-24 text-footer-foreground md:pb-0">
        <div className="grid w-full grid-cols-1 gap-8 px-4 py-14 sm:px-6 md:grid-cols-2 lg:px-8">
          <div>
            <p className="mb-6 text-xl font-bold uppercase tracking-tight">North York | Markham Volleyball</p>
            <p className="mb-8 max-w-xs text-sm tracking-wide text-footer-foreground/60">
              Defining a new standard of metropolitan volleyball where athletic excellence meets community.
            </p>
            <div className="flex flex-wrap gap-6 text-footer-foreground/60">
              <a
                className="transition hover:text-footer-foreground"
                href="https://www.instagram.com/vb.ny.mrkhm"
                target="_blank"
                rel="noopener noreferrer"
              >
                Instagram
              </a>
              <a
                className="transition hover:text-footer-foreground"
                href={JPTRG_YOUTUBE_CHANNEL_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                YouTube
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-footer-foreground/40">Community</h5>
              <a className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground" href="#games">
                Games
              </a>
              <a className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground" href="#venue">
                Venues
              </a>
              <a className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground" href="#how-it-works">
                How it works
              </a>
              <a className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground" href="#youtube">
                YouTube
              </a>
              <a className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground" href="#about">
                About
              </a>
              <FindMyGamesDialog>
                <button type="button" className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground">
                  My saved games
                </button>
              </FindMyGamesDialog>
              <Link
                className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground"
                href="/community"
              >
                Bugs, ideas &amp; partners
              </Link>
            </div>
            <div className="space-y-4">
              <h5 className="text-[10px] font-bold uppercase tracking-[0.3em] text-footer-foreground/40">Legal</h5>
              <Link className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground" href="/terms">
                Terms of Service
              </Link>
              <Link className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground" href="/privacy">
                Privacy Policy
              </Link>
              <FooterPoliciesModalTrigger />
              <Link className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground" href="/community">
                Contact &amp; feedback
              </Link>
              <a className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground" href="/admin">
                Organizer login
              </a>
            </div>
          </div>
        </div>
        <div className="border-t border-footer-foreground/5 px-4 py-6 text-xs uppercase tracking-widest text-footer-foreground/40 sm:px-6 lg:px-8">
          <div className="flex w-full flex-wrap items-center justify-between gap-2">
            <p>
              © 2026 North York | Markham Volleyball. Made by{" "}
              <a
                href="https://ednsy.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-4 hover:text-footer-foreground/80"
              >
                Ed & Sy
              </a>
              .
            </p>
            <p>EST. 2024</p>
          </div>
        </div>
      </footer>
      <Suspense fallback={null}>
        <MobileDock />
      </Suspense>
    </div>
  );
}
