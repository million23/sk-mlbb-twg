"use client";

import { Button } from "@/components/ui/button";
import { useRouterState } from "@tanstack/react-router";
import { Cookie } from "lucide-react";
import * as React from "react";

const STORAGE_KEY = "sk-mlbb-twg-public-cookie-notice";

function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  return pathname === "/p" || pathname.startsWith("/p/");
}

/**
 * Renders only on `/` and `/p/*`. Fixed bottom-right; dismissed state in localStorage.
 */
export function PublicCookieBannerGate() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!isPublicPath(pathname)) return null;
  return <PublicCookieBanner />;
}

function PublicCookieBanner() {
  const [dismissed, setDismissed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    try {
      setDismissed(window.localStorage.getItem(STORAGE_KEY) === "dismissed");
    } catch {
      setDismissed(false);
    }
  }, []);

  const dismiss = React.useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "dismissed");
    } catch {
      /* ignore quota / private mode */
    }
    setDismissed(true);
  }, []);

  if (dismissed === null || dismissed) return null;

  return (
    <section
      aria-labelledby="public-cookie-banner-title"
      aria-describedby="public-cookie-banner-desc"
      className="fixed right-4 bottom-4 z-100 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border/80 bg-popover/95 p-4 text-popover-foreground shadow-lg ring-1 ring-foreground/10 backdrop-blur-md supports-backdrop-filter:bg-popover/90 sm:right-6 sm:bottom-6 sm:max-w-sm sm:p-5"
    >
      <div className="flex gap-3">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary"
          aria-hidden
        >
          <Cookie className="size-5" strokeWidth={1.75} />
        </span>
        <div className="min-w-0 flex-1 space-y-3">
          <div className="space-y-1.5">
            <h2
              id="public-cookie-banner-title"
              className="font-semibold text-foreground text-sm leading-tight"
            >
              Cookies &amp; public information
            </h2>
            <p
              id="public-cookie-banner-desc"
              className="text-muted-foreground text-xs leading-relaxed"
            >
              We use essential cookies where needed (for example staff sign-in
              and display settings). On these public pages, viewing tournaments,
              teams, or players only uses that browsing to show you the same
              information—no extra tracking beyond normal site operation.
            </p>
          </div>
          <Button
            type="button"
            size="sm"
            className="w-full sm:w-auto"
            onClick={dismiss}
          >
            Got it
          </Button>
        </div>
      </div>
    </section>
  );
}
