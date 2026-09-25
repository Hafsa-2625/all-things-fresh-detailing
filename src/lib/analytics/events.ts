/**
 * Every semantic event this platform emits (Section 52 of the brief).
 * Components call `track()` with one of these — they never talk to GA4/GTM/
 * Meta Pixel directly, so adding or swapping an analytics provider later is
 * a change to `providers.ts` alone, not a find-and-replace across every
 * component that has a button in it.
 */
export type AnalyticsEvent =
  | "book_now_click"
  | "booking_start"
  | "booking_step"
  | "booking_complete"
  | "booking_error"
  | "quote_start"
  | "quote_complete"
  | "phone_click"
  | "sms_click"
  | "whatsapp_click"
  | "service_view"
  | "project_view"
  | "location_view"
  | "guide_view"
  | "social_click"
  | "video_engagement"
  | "form_submit"
  | "language_switch"
  | "theme_switch";

export interface AnalyticsEventPayload {
  [key: string]: string | number | boolean | undefined;
}
