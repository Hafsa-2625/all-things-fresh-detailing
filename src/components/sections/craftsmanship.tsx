import type { TenantConfig } from "@/tenant/schema";
import type { Dictionary } from "@/i18n/dictionary";
import { Section, Container, Eyebrow, SectionHeading } from "@/components/ui/section";
import { AdaptiveMedia } from "@/components/media/adaptive-media";

/**
 * Story section, not an "About us" block: an offset editorial composition
 * with a tall primary frame and a smaller secondary one, so it reads as
 * craftsmanship documentation rather than a stock team photo pair.
 */
export function Craftsmanship({ tenant, dict }: { tenant: TenantConfig; dict: Dictionary }) {
  if (!tenant.features.craftsmanship) return null;

  return (
    <Section tone="cinematic" id="about" label="10 Craftsmanship" rhythm="standard">
      <Container>
        <div className="grid grid-cols-1 items-center gap-x-16 gap-y-12 lg:grid-cols-2">
          <div className="max-w-[46ch]">
            <Eyebrow tone="inverse">{dict.craftsmanship.eyebrow}</Eyebrow>
            <SectionHeading className="mb-7">{dict.craftsmanship.heading}</SectionHeading>
            <p className="text-body leading-[1.8] text-[var(--color-ink-inverse-muted)]">
              {dict.craftsmanship.body}
            </p>
          </div>

          <div className="grid grid-cols-5 gap-3.5">
            <div className="relative col-span-3 aspect-[3/4] overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-cinematic-raised)]">
              <AdaptiveMedia
                media={tenant.media.heroPoster}
                placeholderLabel="Owner at work — add via Media Library"
                sizes="(max-width: 1024px) 60vw, 30vw"
              />
            </div>
            {/* Offset downward so the pair reads as a composition, not a grid. */}
            <div className="relative col-span-2 mt-[18%] aspect-[3/4] self-start overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-cinematic-raised)]">
              <AdaptiveMedia
                placeholderLabel="Shop and equipment — add via Media Library"
                sizes="(max-width: 1024px) 40vw, 20vw"
              />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}
