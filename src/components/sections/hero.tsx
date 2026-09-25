import type { TenantConfig } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";
import { Section, Container } from "@/components/ui/section";
import { AdaptiveMedia } from "@/components/media/adaptive-media";
import { BookNowButton } from "@/components/booking/book-now-button";
import { buttonClass, ArrowRight } from "@/components/ui/button";

export function Hero({ tenant, dict }: { tenant: TenantConfig; dict: Dictionary }) {
  const vehiclesStat = tenant.trustStats.find((s) => s.id === "vehiclesPerMonth");

  return (
    <Section
      tone="cinematic"
      id="top"
      label="01 Hero"
      rhythm="none"
      className="relative flex min-h-[min(100svh,940px)] items-center overflow-hidden pt-[76px]"
    >
      {/* Media occupies the right ~62% on desktop and the full frame on mobile,
          where the gradient carries legibility instead of a hard split. */}
      <div className="absolute inset-y-0 right-0 left-0 lg:left-[38%]">
        <AdaptiveMedia
          media={tenant.media.heroDesktop}
          placeholderLabel="Hero vehicle photo or video — add via Media Library"
          priority
          sizes="(max-width: 1024px) 100vw, 62vw"
        />
      </div>

      {/* Two-stop scrim: a horizontal wash for desktop legibility over the
          split, plus a bottom-up wash so mobile (where media is full-bleed)
          keeps text readable regardless of the photo behind it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, var(--color-cinematic) 72%, transparent) 0%, color-mix(in srgb, var(--color-cinematic) 40%, transparent) 45%, var(--color-cinematic) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 hidden lg:block"
        style={{
          background:
            "linear-gradient(100deg, var(--color-cinematic) 0%, var(--color-cinematic) 30%, color-mix(in srgb, var(--color-cinematic) 82%, transparent) 46%, transparent 72%)",
        }}
      />

      <Container className="relative py-[clamp(72px,9vw,132px)]">
        <div className="max-w-[620px] motion-safe:animate-[atf-rise_0.9s_cubic-bezier(0.2,0.7,0.2,1)_both]">
          <p className="mb-7 font-[var(--font-display)] text-caption font-semibold uppercase tracking-[0.3em] text-[var(--color-ink-inverse-faint)]">
            {dict.hero.eyebrow}
          </p>

          <h1 className="mb-7 font-[var(--font-display)] text-[clamp(44px,6.6vw,104px)] font-bold uppercase leading-[0.93] tracking-[-0.04em] text-[var(--color-ink-inverse)] text-balance">
            {dict.hero.headlineLine1}
            <br />
            {dict.hero.headlineLine2}
          </h1>

          <p className="mb-10 max-w-[40ch] text-[clamp(15px,1.15vw,17px)] leading-[1.65] text-[var(--color-ink-inverse-muted)]">
            {dict.hero.subhead}
          </p>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <BookNowButton tenant={tenant} label={dict.hero.ctaBook} variant="primary-on-dark" size="lg" />
            <a href="#work" className={`group ${buttonClass("text-on-dark")}`}>
              {dict.hero.ctaWork}
              <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
            </a>
          </div>
        </div>

        {/* A single restrained trust marker — deliberately not a row of badges. */}
        {vehiclesStat && (
          <div className="absolute right-5 bottom-[clamp(28px,4vw,56px)] hidden text-right sm:right-8 lg:right-13 lg:block">
            <div className="flex items-baseline justify-end gap-3">
              <span className="font-[var(--font-display)] text-[clamp(26px,2.4vw,34px)] font-bold tracking-[-0.03em] text-[var(--color-ink-inverse)] tabular-nums">
                {vehiclesStat.value}
              </span>
              <span className="text-caption uppercase tracking-[0.18em] text-[var(--color-ink-inverse-faint)]">
                {dict.trust.stats.vehiclesPerMonth}
              </span>
            </div>
          </div>
        )}
      </Container>
    </Section>
  );
}
