import type { TenantConfig, Locale } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";
import { Section, Container, Eyebrow, SectionHeading } from "@/components/ui/section";
import { BookNowButton } from "@/components/booking/book-now-button";
import { ArrowRight, buttonClass } from "@/components/ui/button";

/**
 * Numbered steps rather than icons. The eight icons here were the weakest
 * visual element on the page — a mix of glyph styles at 22px that read as
 * clip-art. Numerals in the display face carry the same "this is a simple
 * process" message and match the editorial typography elsewhere.
 */
export function BookingStrip({ tenant, dict, locale }: { tenant: TenantConfig; dict: Dictionary; locale: Locale }) {
  // The strip previews the first four steps; the full flow lives at /book.
  const steps = Object.values(dict.bookingStrip.steps).slice(0, 4);

  return (
    <Section tone="contrast" id="book" label="09 Booking strip" rhythm="standard">
      <Container>
        <div className="grid grid-cols-1 gap-x-16 gap-y-10 lg:grid-cols-[minmax(0,26ch)_1fr] lg:items-center">
          <div>
            <Eyebrow>{dict.bookingStrip.eyebrow}</Eyebrow>
            <SectionHeading>{dict.bookingStrip.heading}</SectionHeading>
          </div>

          <div>
            <ol className="mb-9 grid grid-cols-2 gap-x-8 gap-y-6 sm:grid-cols-4">
              {steps.map((label, i) => (
                <li key={label} className="border-t border-[var(--color-border)] pt-4">
                  <div className="font-[var(--font-display)] text-caption font-bold tracking-[0.14em] text-[var(--color-ink-faint)] tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="mt-2 text-small leading-[1.4] font-medium">{label}</div>
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap items-center gap-x-7 gap-y-4">
              <BookNowButton tenant={tenant} label={dict.bookingStrip.cta} variant="primary-on-light" size="lg" />
              <a href={`/${locale}/book`} className={`group ${buttonClass("text-on-light")}`}>
                {dict.configurator.title}
                <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
