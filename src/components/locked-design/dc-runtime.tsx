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

/** Boots the exact Design Component runtime supplied in the approved ZIP. */
export function DcRuntime() {
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
