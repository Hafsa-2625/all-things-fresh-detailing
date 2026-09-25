"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionary";
import { Section, Container, Eyebrow, SectionHeading } from "@/components/ui/section";
import { AdaptiveMedia } from "@/components/media/adaptive-media";
import { track } from "@/lib/analytics/track";

/**
 * Full-bleed cinematic break. Previously a 50/50 split with the copy in a
 * padded column, which read like a generic feature block; the film now runs
 * edge-to-edge with the copy overlaid, so it functions as the dark visual
 * pause between the two light sections either side of it.
 */
export function CinematicFilm({ dict, videoSrc }: { dict: Dictionary; videoSrc?: string }) {
  const [playing, setPlaying] = useState(false);

  return (
    <Section tone="cinematic" label="05 Cinematic film" rhythm="none" className="relative">
      <div className="relative min-h-[clamp(460px,62vw,760px)] w-full overflow-hidden">
        {videoSrc && playing ? (
          <video
            src={videoSrc}
            controls
            autoPlay
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <>
            <AdaptiveMedia
              placeholderLabel="Brand film — add via Media Library"
              sizes="100vw"
            />
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--color-cinematic) 60%, transparent) 0%, color-mix(in srgb, var(--color-cinematic) 30%, transparent) 40%, color-mix(in srgb, var(--color-cinematic) 88%, transparent) 100%)",
              }}
            />

            <Container className="relative flex h-full min-h-[clamp(460px,62vw,760px)] flex-col justify-end py-[clamp(48px,6vw,88px)]">
              <div className="max-w-[46ch]">
                <Eyebrow tone="inverse">{dict.film.cta}</Eyebrow>
                <SectionHeading className="mb-6">{dict.film.heading}</SectionHeading>
                <p className="mb-9 max-w-[42ch] text-body leading-[1.7] text-[var(--color-ink-inverse-muted)]">
                  {dict.film.body}
                </p>
              </div>
            </Container>

            {/* Centred play control — the single focal interaction. */}
            <button
              type="button"
              aria-label={dict.film.cta}
              onClick={() => {
                track("video_engagement", { action: "play" });
                setPlaying(true);
              }}
              disabled={!videoSrc}
              className="group absolute top-1/2 left-1/2 grid h-[clamp(72px,7vw,92px)] w-[clamp(72px,7vw,92px)] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/50 bg-black/25 text-white backdrop-blur-sm transition-[background-color,border-color,transform] duration-300 hover:scale-105 hover:border-white hover:bg-white hover:text-[var(--color-cinematic)] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:scale-100 disabled:hover:bg-black/25 disabled:hover:text-white"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="ml-1">
                <path d="M7 4l13 8-13 8z" />
              </svg>
            </button>
          </>
        )}
      </div>
    </Section>
  );
}
