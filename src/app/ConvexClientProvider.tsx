"use client";

import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ReactNode, useEffect } from "react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// After this many minutes of inactivity, reload the page so the WebSocket
// reconnects cleanly instead of waiting through exponential back-off.
const RELOAD_AFTER_MS = 30 * 60 * 1000;

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

  return (
    <ConvexAuthNextjsProvider client={convex}>
      {children}
    </ConvexAuthNextjsProvider>
  );
}
