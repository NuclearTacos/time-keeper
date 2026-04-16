"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useEffect } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// After this many minutes of inactivity, reload the page so the WebSocket
// reconnects cleanly instead of waiting through exponential back-off.
const RELOAD_AFTER_MS = 30 * 60 * 1000;

const NON_BLUR_INPUT_TYPES = new Set([
  "button",
  "submit",
  "reset",
  "checkbox",
  "radio",
  "image",
  "file",
  "range",
  "color",
  "hidden",
]);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    let hiddenAt: number | null = null;

    function handleVisibility() {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
      } else if (document.visibilityState === "visible" && hiddenAt !== null) {
        const hiddenMs = Date.now() - hiddenAt;
        hiddenAt = null;
        if (hiddenMs >= RELOAD_AFTER_MS) {
          window.location.reload();
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Global: Escape blurs the focused input/textarea, unless a tag-suggestion
  // dropdown is open (it has its own Escape handler to dismiss itself).
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (document.querySelector('[role="listbox"]')) return;

      const active = document.activeElement as HTMLElement | null;
      if (!active) return;

      const tag = active.tagName;
      if (tag === "TEXTAREA") {
        active.blur();
        return;
      }
      if (tag === "INPUT") {
        const type = (active as HTMLInputElement).type.toLowerCase();
        if (!NON_BLUR_INPUT_TYPES.has(type)) active.blur();
        return;
      }
      if (active.isContentEditable) active.blur();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
