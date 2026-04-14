import Link from "next/link";
import { ArrowRight, Calendar, ExternalLink, Navigation, Video } from "lucide-react";
import { getUpcomingGamesWithSignups } from "@/lib/data/games";
import { getVenues } from "@/lib/data/venues";
import { copyableVenueLineForClipboard, hasDistinctGameAddress } from "@/lib/game-display";
import { Button } from "@/components/ui/button";
import { CopyTextButton } from "@/components/ui/copy-text-button";
import { googleDirectionsUrlFromPlace } from "@/lib/maps-links";
import { venueImageOrPlaceholder } from "@/lib/venue-placeholder-image";
import { SiteHeader } from "@/components/layout/site-header";
import { FooterPoliciesModalTrigger } from "@/components/layout/footer-policies-modal-trigger";
import { HomeHeroParallax } from "@/components/marketing/home-hero-parallax";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { WhatsAppRosterMock } from "@/components/marketing/whatsapp-roster-mock";
import { FindMyGamesDialog } from "@/components/games/find-my-games-dialog";
import { FadeUp } from "@/components/shared/FadeUp";
import type { Venue } from "@/types/vbnym";

/** https://www.youtube.com/@jptrg3657 — uploads playlist (UU…) for embed */
const JPTRG_YOUTUBE_UPLOADS_PLAYLIST_ID = "UU6ycsD5o9ZyMgQrnueuDGrQ";
const JPTRG_YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@jptrg3657";

export default async function HomePage() {
  const [{ games }, { venues: venueRows, error: venuesFetchError }] = await Promise.all([
    getUpcomingGamesWithSignups(),
    getVenues(),
  ]);

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
    ? `/app?venue=${featuredVenue.id}`
    : firstGame?.venue_id
      ? `/app?venue=${firstGame.venue_id}`
      : "/app";

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
        {/* ── Hero — full viewport, imagery runs under the glass header ── */}
        <HomeHeroParallax>
          <FadeUp className="mx-auto w-full max-w-7xl text-center sm:text-left">
            <h1 className="mb-4 w-full text-4xl font-black leading-[0.92] tracking-tight text-white/90 sm:mb-5 sm:text-6xl lg:text-7xl">
              North York &amp; Markham
              <br />
              Volleyball Community
            </h1>
            <p className="max-w-4xl text-sm leading-relaxed text-white/65 sm:max-w-5xl sm:text-lg sm:leading-relaxed sm:text-white/68">
              Whether you&apos;re looking to sharpen your skills or just enjoy some
              quality volleyball, you&apos;ll fit right in. We run balanced drop-ins
              with real team-style 5–1 gameplay and the occasional mini tournament.
              Competitive enough to be meaningful, friendly enough to feel like home.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
              <Button asChild size="lg" className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/app">
                  <Calendar className="size-4 shrink-0" aria-hidden />
                  Browse upcoming games
                </Link>
              </Button>
              <FindMyGamesDialog>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="border-white/25 bg-white/10 text-white/80 hover:bg-white/15 hover:text-white/92"
                >
                  My saved games
                </Button>
              </FindMyGamesDialog>
            </div>
          </FadeUp>
        </HomeHeroParallax>

        <HowItWorksSection />

        {/* ── Venues: one featured hero, then the rest ─────────── */}
        <section id="venue" className="relative isolate">
          <div className="relative z-0 h-[520px] overflow-hidden sm:h-[600px]">
            <img
              className="h-full w-full object-cover"
              alt={venueHeroAlt}
              src={venueHeroSrc}
            />
            <div className="absolute inset-0 flex items-center bg-gradient-to-b from-black/75 via-black/55 to-black/80">
              <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
                <FadeUp className="mx-auto max-w-4xl rounded-2xl border border-white/15 bg-white/10 p-8 text-center backdrop-blur-xl sm:p-12">
                  <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-accent">
                    Featured venue
                  </p>
                  <h2 className="mb-6 text-balance text-4xl font-black uppercase italic tracking-tight text-white/88 sm:text-6xl">
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
                      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
                        Location
                      </h4>
                      <CopyTextButton
                        text={venueClipboardText}
                        label="Copy address"
                        variant="ghost"
                        className="justify-center text-center text-white/75 hover:bg-white/10 hover:text-white/88"
                      >
                        <span className="text-xl font-bold leading-snug text-white/82">{venueLocationLabel}</span>
                      </CopyTextButton>
                    </div>
                    <div>
                      <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/50">
                        Games &amp; directions
                      </h4>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Button
                          asChild
                          variant="outline"
                          className="gap-2 border-white/25 bg-white/10 text-white/80 hover:bg-white/18 hover:text-white/92"
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
                            className="gap-2 border-white/25 bg-white/10 text-white/80 hover:bg-white/18 hover:text-white/92"
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
                </FadeUp>
              </div>
            </div>
          </div>

          {otherVenues.length > 0 ? (
            <div className="relative z-10 -mt-12 mx-auto w-full max-w-7xl px-3 sm:-mt-16 sm:px-6 lg:-mt-20 lg:px-8">
              <FadeUp className="w-full rounded-t-3xl border border-border/80 bg-muted/95 px-3 py-12 shadow-lg backdrop-blur-md sm:px-6 lg:px-8">
                <h3 className="mb-2 text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
                  More venues
                </h3>
                <p className="mb-8 max-w-2xl text-sm text-muted-foreground sm:text-base">
                  We run games across the area. Jump to the schedule for a venue or open directions
                  in Google Maps.
                </p>
                <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {otherVenues.map((v, index) => {
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
                        <FadeUp className="flex h-full flex-col" delayMs={index * 90}>
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
                                <Link href={`/app?venue=${v.id}`}>
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
                        </FadeUp>
                      </li>
                    );
                  })}
                </ul>
              </FadeUp>
            </div>
          ) : null}
        </section>

        {/* ── About / Our Story ────────────────────────────────── */}
        <section id="about" className="bg-primary pt-20 pb-24 text-primary-foreground sm:pt-28 sm:pb-28">
          <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
              <FadeUp>
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
              </FadeUp>
              <FadeUp className="flex flex-col justify-center" delayMs={100}>
                <WhatsAppRosterMock />
                <p className="mt-3 text-center text-xs text-primary-foreground/50">
                  How games were managed before — numbered lists in WhatsApp. Sample mock-up
                  for illustration (not a real chat).
                </p>
              </FadeUp>
            </div>
          </div>
        </section>

        {/* ── YouTube ───────────────────────────────────────────── */}
        <section id="youtube" className="border-y border-border/60 bg-muted/20 py-16 sm:py-20">
          <div className="mx-auto w-full max-w-7xl space-y-8 px-3 sm:px-6 lg:px-8">
            <FadeUp>
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
            </FadeUp>
            <FadeUp delayMs={90}>
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
            </FadeUp>
            <FadeUp delayMs={160}>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <a href={JPTRG_YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" aria-hidden />
                  Open channel on YouTube
                </a>
              </Button>
            </FadeUp>
          </div>
        </section>

        {/* ── Final CTA (floating blue card) ───────────────────── */}
        <section id="connect" className="relative z-10 -mt-8 pb-16 sm:-mt-10 sm:pb-20">
          <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8">
            <FadeUp className="w-full rounded-2xl border border-primary/15 bg-primary px-6 py-10 text-center text-primary-foreground shadow-2xl shadow-primary/35 ring-1 ring-primary-foreground/10 sm:px-10 sm:py-12">
              <h2 className="mb-3 text-2xl font-extrabold tracking-tight sm:text-3xl">
                Connect with us
              </h2>
              <p className="mx-auto mb-8 max-w-lg text-sm leading-relaxed text-primary-foreground/85 sm:text-base">
                Share feedback, ideas, bug reports, or partnership ideas — we read everything on the
                community board.
              </p>
              <Button
                asChild
                size="lg"
                className="gap-2 bg-accent font-semibold text-accent-foreground shadow-md hover:bg-accent/92"
              >
                <Link href="/community">
                  Visit the community hub
                  <ArrowRight className="size-4 shrink-0" aria-hidden />
                </Link>
              </Button>
            </FadeUp>
          </div>
        </section>
      </main>

      <footer className="border-t border-footer-foreground/10 bg-footer text-footer-foreground">
        <FadeUp className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-8 px-3 py-14 sm:px-6 md:grid-cols-2 lg:px-8">
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
              <Link
                className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground"
                href="/app"
              >
                Games
              </Link>
              <a className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground" href="#how-it-works">
                How it works
              </a>
              <a className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground" href="#venue">
                Venues
              </a>
              <a className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground" href="#about">
                About
              </a>
              <a className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground" href="#youtube">
                YouTube
              </a>
              <Link
                className="block text-sm tracking-wide text-footer-foreground/60 transition hover:text-footer-foreground"
                href="/app/my-games"
              >
                My saved games
              </Link>
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
        </FadeUp>
        <FadeUp className="border-t border-footer-foreground/5 py-6 text-xs uppercase tracking-widest text-footer-foreground/40">
          <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
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
        </FadeUp>
      </footer>
    </div>
  );
}
