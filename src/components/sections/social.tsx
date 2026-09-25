import type { TenantConfig } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";
import { Section, Container, Eyebrow, SectionHeading } from "@/components/ui/section";
import { AdaptiveMedia } from "@/components/media/adaptive-media";
import { ArrowRight } from "@/components/ui/button";

const BRAND: Record<"instagram" | "tiktok" | "youtube", { label: string; path: string; ratio: string }> = {
  instagram: {
    label: "Instagram",
    path: "M12 2c2.7 0 3 0 4.1.1 1.1 0 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.3 1.1.4 2.2.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c0 1.1-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1.1.3-2.2.4-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-1.1 0-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.3-1.1-.4-2.2C2 15 2 14.7 2 12s0-3 .1-4.1c0-1.1.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1.1-.3 2.2-.4C9 2 9.3 2 12 2zm0 5a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zm5.2-8.4a1.2 1.2 0 1 0 0-2.4 1.2 1.2 0 0 0 0 2.4z",
    // Reels are vertical — the frame reflects the real content shape.
    ratio: "aspect-[9/16]",
  },
  tiktok: {
    label: "TikTok",
    path: "M16.5 2h-3.2v13.6a2.9 2.9 0 1 1-2.9-2.9c.3 0 .6 0 .9.1V9.5a6.2 6.2 0 1 0 5.2 6.1V8.7c1.2.9 2.7 1.4 4.2 1.4V6.9c-1.9-.1-3.5-1.1-4.2-2.5V2z",
    ratio: "aspect-[9/16]",
  },
  youtube: {
    label: "YouTube",
    path: "M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 23.5 12a31 31 0 0 0-.5-4.8zM9.8 15.3V8.7l6 3.3z",
    ratio: "aspect-video",
  },
};

/**
 * Presents each connected platform as a media panel in its true aspect ratio
 * (9:16 for Reels/TikTok, 16:9 for YouTube) rather than as a row of link
 * cards, so the section reads as an extension of the portfolio. Real post
 * previews replace the placeholder frames once the APIs are connected —
 * no third-party embed JS loads today.
 */
export function Social({ tenant, dict }: { tenant: TenantConfig; dict: Dictionary }) {
  const platforms = (["instagram", "tiktok", "youtube"] as const).filter((p) => tenant.social[p].enabled);
  if (platforms.length === 0) return null;

  return (
    <Section tone="cinematic" label="07 Social" rhythm="standard">
      <Container>
        <div className="mb-10 max-w-[24ch]">
          <Eyebrow tone="inverse">{dict.social.followCta}</Eyebrow>
          <SectionHeading>{dict.social.heading}</SectionHeading>
        </div>

        <div
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          style={{ gridTemplateColumns: `repeat(${Math.min(platforms.length, 3)}, minmax(0, 1fr))` }}
        >
          {platforms.map((p) => {
            const source = tenant.social[p];
            const brand = BRAND[p];
            return (
              <a
                key={p}
                href={source.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border-inverse)] bg-[var(--color-cinematic-raised)] ${brand.ratio} max-h-[70vh]`}
              >
                <div className="absolute inset-0 opacity-70 transition-transform duration-[900ms] ease-[cubic-bezier(0.2,0.7,0.2,1)] group-hover:scale-[1.04]">
                  <AdaptiveMedia placeholderLabel={`${brand.label} — connects once the integration is configured`} sizes="(max-width: 640px) 100vw, 33vw" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/25" />

                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0 text-white">
                        <path d={brand.path} />
                      </svg>
                      <span className="font-[var(--font-display)] text-small font-bold text-white">{brand.label}</span>
                    </div>
                    {source.handle && (
                      <div className="mt-1 truncate text-caption text-white/60">{source.handle}</div>
                    )}
                  </div>
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/40 text-white transition-[background-color,border-color,color] duration-300 group-hover:border-white group-hover:bg-white group-hover:text-[var(--color-cinematic)]">
                    <ArrowRight />
                  </span>
                </div>
              </a>
            );
          })}
        </div>

        <p className="mt-7 text-caption text-[var(--color-ink-inverse-faint)]">{dict.social.emptyState}</p>
      </Container>
    </Section>
  );
}
