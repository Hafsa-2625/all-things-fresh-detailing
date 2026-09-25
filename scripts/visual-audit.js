/**
 * Measured visual audit, run in the page via the browser tool.
 * Returns objectively checkable design facts: contrast ratios, tap-target
 * sizes, overflow, type-scale usage, spacing rhythm, and radius consistency.
 *
 * This does NOT replace human pixel review of aesthetic quality — it catches
 * the measurable defects (unreadable contrast, too-small touch targets,
 * inconsistent scales, overflow) that are the usual cause of a site feeling
 * unpolished.
 */
window.__visualAudit = function () {
  const parseRgb = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(",").map((v) => parseFloat(v));
    return { r, g, b, a };
  };
  const lum = ({ r, g, b }) => {
    const f = (c) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const contrast = (fg, bg) => {
    const L1 = lum(fg), L2 = lum(bg);
    return (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
  };
  // Walk up to find the first non-transparent background.
  const effectiveBg = (el) => {
    let node = el;
    while (node && node !== document.documentElement) {
      const bg = parseRgb(getComputedStyle(node).backgroundColor);
      if (bg && bg.a > 0.5) return bg;
      node = node.parentElement;
    }
    return parseRgb(getComputedStyle(document.body).backgroundColor) || { r: 255, g: 255, b: 255 };
  };

  const contrastFailures = [];
  const smallTapTargets = [];
  const fontSizes = new Map();
  const radii = new Map();
  const overflowing = [];

  document.querySelectorAll("h1,h2,h3,h4,p,span,a,button,li,dt,dd,label,div").forEach((el) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (ownText) {
      const fg = parseRgb(cs.color);
      const bg = effectiveBg(el);
      if (fg && bg && fg.a > 0.3) {
        const ratio = contrast(fg, bg);
        const size = parseFloat(cs.fontSize);
        const bold = parseInt(cs.fontWeight, 10) >= 700;
        const large = size >= 24 || (size >= 18.66 && bold);
        const required = large ? 3 : 4.5;
        if (ratio < required) {
          contrastFailures.push({
            text: el.textContent.trim().slice(0, 45),
            ratio: +ratio.toFixed(2),
            required,
            size: +size.toFixed(1),
            color: cs.color,
          });
        }
      }
      const fs = cs.fontSize;
      fontSizes.set(fs, (fontSizes.get(fs) || 0) + 1);
    }

    if ((el.tagName === "BUTTON" || el.tagName === "A") && rect.width > 0) {
      const interactive = el.tagName === "BUTTON" || el.getAttribute("href");
      const isInline = cs.display === "inline";
      if (interactive && !isInline && (rect.height < 44 || rect.width < 44)) {
        smallTapTargets.push({
          text: (el.textContent || el.getAttribute("aria-label") || "").trim().slice(0, 35),
          w: Math.round(rect.width),
          h: Math.round(rect.height),
        });
      }
    }

    const r = cs.borderRadius;
    if (r && r !== "0px" && rect.width > 30) radii.set(r, (radii.get(r) || 0) + 1);

    if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 40 && cs.overflowX === "visible") {
      overflowing.push({ tag: el.tagName, text: el.textContent.trim().slice(0, 35), sw: el.scrollWidth, cw: el.clientWidth });
    }
  });

  const sectionPadding = [...document.querySelectorAll("[data-section]")].map((s) => ({
    label: s.getAttribute("data-section"),
    pt: getComputedStyle(s).paddingTop,
    pb: getComputedStyle(s).paddingBottom,
    h: Math.round(s.getBoundingClientRect().height),
  }));

  return {
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    theme: document.documentElement.getAttribute("data-theme") || "system",
    lang: document.documentElement.lang,
    docOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    contrastFailures: contrastFailures.slice(0, 12),
    contrastFailureCount: contrastFailures.length,
    smallTapTargets: smallTapTargets.slice(0, 10),
    smallTapTargetCount: smallTapTargets.length,
    distinctFontSizes: [...fontSizes.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14),
    distinctRadii: [...radii.entries()].sort((a, b) => b[1] - a[1]),
    overflowing: overflowing.slice(0, 6),
    sectionPadding,
  };
};
"visual audit loaded";
