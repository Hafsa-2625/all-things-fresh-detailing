"use client";

import * as ReactRuntime from "react";
import * as ReactDomRuntime from "react-dom";
import { createRoot } from "react-dom/client";
import { useEffect } from "react";

declare global {
  interface Window {
    React?: typeof ReactRuntime;
    ReactDOM?: typeof ReactDomRuntime & { createRoot: typeof createRoot };
    __dcBoot?: () => void;
    __resources?: Record<string, string>;
  }
}

function openMenuToggles(): HTMLElement[] {
  return [...document.querySelectorAll<HTMLElement>('.atf-menu-toggle[aria-expanded="true"]')];
}

function setMenuOpen(toggle: HTMLElement, open: boolean) {
  toggle.setAttribute("aria-expanded", String(open));
}

/** Boots the exact Design Component runtime supplied in the approved ZIP. */
export function DcRuntime() {
  // The header's menu toggle below 900px (markup: src/lib/locked-design/responsive.ts). Listens on
  // the document because the runtime replaces the server-rendered header when it boots.
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const toggle = target?.closest<HTMLElement>(".atf-menu-toggle");
      if (toggle) {
        setMenuOpen(toggle, toggle.getAttribute("aria-expanded") !== "true");
        return;
      }
      // A link, or the Contact button, chosen from the open menu.
      if (!target?.closest("a, button")) return;
      for (const open of openMenuToggles()) {
        if (open.closest("nav")?.contains(target)) setMenuOpen(open, false);
      }
    };
    // Tap or focus anywhere outside the menu closes it. pointerdown, not click: iOS Safari does
    // not send click events to the document for taps on non-interactive elements.
    const closeIfOutside = (event: Event) => {
      const target = event.target instanceof Node ? event.target : null;
      for (const open of openMenuToggles()) {
        if (!open.closest("nav")?.contains(target)) setMenuOpen(open, false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      for (const open of openMenuToggles()) {
        setMenuOpen(open, false);
        open.focus();
      }
    };

    document.addEventListener("click", onClick);
    document.addEventListener("pointerdown", closeIfOutside);
    document.addEventListener("focusin", closeIfOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("pointerdown", closeIfOutside);
      document.removeEventListener("focusin", closeIfOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    window.React = ReactRuntime;
    window.ReactDOM = { ...ReactDomRuntime, createRoot };
    // Non-empty map skips the runtime's location.href refetch, which recompiled
    // the template and flashed the page a second time after first paint.
    window.__resources ??= {};

    const existing = document.querySelector<HTMLScriptElement>('script[data-atf-dc-runtime="true"]');
    if (existing) {
      window.__dcBoot?.();
      return;
    }

    const runtime = document.createElement("script");
    runtime.src = "/support.js";
    runtime.async = false;
    runtime.dataset.atfDcRuntime = "true";
    document.head.appendChild(runtime);

    if (!document.querySelector('script[data-atf-image-slots="true"]')) {
      const imageSlots = document.createElement("script");
      imageSlots.src = "/image-slot.js";
      imageSlots.async = true;
      imageSlots.dataset.atfImageSlots = "true";
      document.head.appendChild(imageSlots);
    }
  }, []);

  return null;
}
