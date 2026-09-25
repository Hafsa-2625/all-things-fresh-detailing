export interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

/**
 * Data-driven redirect registry (Section 43/62). Empty today — nothing has
 * moved yet — but this is where a slug change goes when one happens, wired
 * into next.config.ts's `redirects()` below. Centralizing it here (instead
 * of editing next.config.ts by hand each time) is what makes it possible to
 * build an actual Redirect Manager UI in /admin later without touching the
 * routing config.
 *
 * READY FOR BACKEND WIRING: once the CMS database exists, this array moves
 * to a `redirects` table and /admin gets a real editor over it — the shape
 * stays identical, so next.config.ts doesn't change.
 */
export const redirectRules: RedirectRule[] = [];
