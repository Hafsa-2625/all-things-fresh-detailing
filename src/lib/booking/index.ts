export type { BookingProvider } from "./types";
export { trackBookingEvent } from "./types";

// The provider-resolution logic itself lives in use-booking-provider.ts —
// it needs the ConfiguratorModalProvider context for "inline"/"modal" mode
// (see that file's comment), so it's a hook, not a plain export from here.
