import Image from "next/image";
import type { ReactNode } from "react";

type HomeHeroParallaxProps = {
  children: ReactNode;
};

/** Full-viewport hero with static background → same treatment as the featured venue (no scroll parallax). */
export function HomeHeroParallax({ children }: HomeHeroParallaxProps) {
  return (
    <section className="relative -mt-14 min-h-dvh pt-14 sm:-mt-16 sm:pt-16">
      <div className="relative min-h-[calc(100dvh-3.5rem)] sm:min-h-[calc(100dvh-4rem)]">
        <Image
          src="/hero.jpg"
          alt="Indoor volleyball game in motion"
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/92 via-black/62 to-black/95" />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_12%,rgba(0,0,0,0.72)_100%)]"
          aria-hidden
        />

        <div className="relative flex min-h-[calc(100dvh-3.5rem)] flex-col justify-center px-3 py-10 sm:min-h-[calc(100dvh-4rem)] sm:px-6 sm:py-14 lg:px-8">
          {children}
        </div>
      </div>
    </section>
  );
}
