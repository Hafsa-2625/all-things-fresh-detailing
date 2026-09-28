import "server-only";

/*
 * Mobile / tablet support for the locked design. Desktop must stay pixel-identical, so every rule
 * here sits inside a max-width media query and the only markup added (the menu toggle) is
 * display:none above the menu breakpoint (see public.css).
 *
 * The design's layout lives in inline styles, so rules target them by attribute substring and
 * need !important. The substrings are chosen to match both the server markup (shown before the
 * design runtime boots) and the runtime's re-serialised styles, which turn `0` into `0px` and
 * `minmax(0, 1fr)` into `minmax(0px, 1fr)`.
 */

// The header nav exactly as both approved design sources ship it.
const HEADER_NAV =
  '<nav style="display: flex; align-items: center; gap: 4px; padding: 12px 14px 15px 24px; border-radius: 0 20px 0 28px; background: #fffefc; box-shadow: -6px 6px 20px rgba(20,26,40,0.06);">';

// Opened and closed by DcRuntime (Escape, link click, tap or focus outside).
const MENU_TOGGLE = `<button type="button" class="atf-menu-toggle" aria-expanded="false" aria-controls="atf-site-nav" aria-label="Menu">
          <svg class="atf-menu-toggle__open" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
          <svg class="atf-menu-toggle__close" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>`;

/** Gives the approved header nav an id and the hamburger button it collapses into on small screens. */
export function addMenuToggle(markup: string): string {
  if (!markup.includes(HEADER_NAV)) throw new Error("Approved header nav was not found; the mobile menu cannot be attached");
  return markup.replace(HEADER_NAV, `${HEADER_NAV.replace("<nav ", '<nav id="atf-site-nav" ')}\n        ${MENU_TOGGLE}`);
}
