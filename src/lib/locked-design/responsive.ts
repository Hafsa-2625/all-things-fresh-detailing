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

/** Section rules both design sources share (same inline styles in each). */
export const SHARED_RESPONSIVE_RULES = `
@media (max-width: 900px) {
  #top [style*="grid-template-columns: 1.1fr 1fr"] { grid-template-columns: minmax(0, 1fr) !important; }
  #top [style*="grid-template-columns: minmax(260px, 360px) 1fr"] {
    grid-template-columns: minmax(0, 1fr) !important;
    justify-items: center !important;
    padding: 90px 30px !important;
    text-align: center;
  }
  /* Booking dialog: scroll instead of clipping when it is taller than a phone screen. */
  #top [style*="position: fixed"]:has(> [role="dialog"]) { overflow-y: auto !important; place-items: start center !important; }
  /* The dialog is content-box, so width: 100% plus its padding overflowed narrow screens. 556px is
     the approved 480px content + 2 x 38px padding, so it is no larger than before where it fitted. */
  #top [role="dialog"][style*="width: min(100%, 480px)"] {
    box-sizing: border-box;
    width: min(100%, 556px) !important;
    margin: auto 0 !important;
  }
}
@media (max-width: 600px) {
  #top [style*="grid-template-columns: 1fr 1fr"],
  #top [style*="grid-template-columns: 1fr 1.2fr"],
  #top [style*="grid-template-columns: 0.8fr 1fr"] {
    grid-template-columns: minmax(0, 1fr) !important;
    gap: 24px !important;
  }
  #top [style*="repeat(3"]:not([style*="gap: 18px"]) { grid-template-columns: minmax(0, 1fr) !important; }
  #top [style*="repeat(3"][style*="gap: 18px"] {
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: 12px !important;
    padding: 20px !important;
  }
  #top [style*="height: 520px"] { height: 360px !important; }
  #top article[style*="min-height: 250px"] { min-height: 0 !important; }
  #top [style*="justify-content: space-between; gap: 40px"],
  #top [style*="justify-content: space-between; margin-bottom: 65px"] {
    flex-direction: column !important;
    align-items: flex-start !important;
    gap: 20px !important;
  }
  #top [style*="justify-content: space-between; gap: 20px; margin-top: 36px"] { flex-wrap: wrap !important; }
  #top [role="dialog"][style*="width: min(100%, 480px)"] { padding: 30px 22px !important; }
}
`;
