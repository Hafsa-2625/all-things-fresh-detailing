export const THEME_STORAGE_KEY = "atf-theme";

/**
 * Blocking inline script, inlined into <head> before any paint. The server
 * already renders `data-theme` from tenantConfig.theme.default (deterministic,
 * hydration-safe). This script only overrides it — before first paint, so no
 * flash — when the visitor previously chose "light" or "dark" explicitly and
 * the tenant allows switching. It never sets an attribute for "system": the
 * CSS `prefers-color-scheme` block already handles that case with no JS at all.
 */
export function themeInitScript(allowSwitch: boolean): string {
  if (!allowSwitch) return "";
  return `(function(){try{var v=localStorage.getItem(${JSON.stringify(
    THEME_STORAGE_KEY,
  )});if(v==="light"||v==="dark"){document.documentElement.setAttribute("data-theme",v);}else if(v==="system"){document.documentElement.removeAttribute("data-theme");}}catch(e){}})();`;
}
