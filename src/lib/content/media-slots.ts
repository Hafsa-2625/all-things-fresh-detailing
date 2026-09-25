/**
 * The image slots the approved design exposes (`<image-slot id="…">` in
 * design-source/current-zip/ATF Detail Site.dc.html). Nothing else on a public page can be
 * replaced from the admin, and no slot can be added without a design change.
 *
 * Each slot renders into a fixed box with `object-fit: cover`, so an upload of any size fills it
 * without moving the layout; what a wrong size costs is crop quality, not stability. `minWidth`
 * and `minHeight` are therefore advisory minimums (2× the rendered box for high-density screens),
 * and `aspect` is the shape the crop is judged against.
 */
export interface MediaSlot {
  id: string;
  label: string;
  /** Where it appears, shown in the admin. */
  context: string;
  renderedWidth: number;
  renderedHeight: number;
  minWidth: number;
  minHeight: number;
}

export const MEDIA_SLOTS: MediaSlot[] = [
  { id: "svc-interior-media", label: "Interior detail card", context: "Homepage services, first card", renderedWidth: 349, renderedHeight: 190, minWidth: 700, minHeight: 380 },
  { id: "svc-exterior-media", label: "Exterior detail card", context: "Homepage services, second card", renderedWidth: 349, renderedHeight: 190, minWidth: 700, minHeight: 380 },
  { id: "svc-full-media", label: "Full detail card", context: "Homepage services, third card", renderedWidth: 349, renderedHeight: 190, minWidth: 700, minHeight: 380 },
];

export const MEDIA_SLOT_IDS = MEDIA_SLOTS.map((slot) => slot.id);

export function findMediaSlot(id: string): MediaSlot | undefined {
  return MEDIA_SLOTS.find((slot) => slot.id === id);
}

/** Aspect ratio of the rendered box, e.g. 1.84 for the homepage cards. */
export function slotAspect(slot: MediaSlot): number {
  return slot.renderedWidth / slot.renderedHeight;
}
