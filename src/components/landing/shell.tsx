import { PublicFooter } from "@/components/public/public-footer";
import { PublicThemeToggle } from "@/components/public/public-theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { LANDING_SITE_TITLE, stubRegister, stubVerify } from "./content";

type LandingShellProps = {
  children: ReactNode;
  /** Overlay nav on hero (uses theme foreground tokens) */
  transparentNav?: boolean;
};

export function LandingShell({
  children,
  transparentNav = false,
}: LandingShellProps) {
  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header
        className={cn(
          "relative z-20",
          transparentNav
            ? "absolute inset-x-0 top-0 border-transparent bg-transparent"
            : "border-b border-border/70 bg-background/80 backdrop-blur-md",
        )}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3 sm:px-6 sm:py-4">
          <Link
            to="/"
            className="min-w-0 truncate font-semibold tracking-tight text-sm text-foreground sm:text-base"
          >
            {LANDING_SITE_TITLE}
          </Link>

          <nav
            className="flex flex-wrap items-center justify-end gap-1 sm:gap-2"
            aria-label="Primary"
          >
            <Link
              to="/legacy/p/tournaments"
              className={buttonVariants({ variant: "ghost", size: "sm" })}
            >
              Tournaments
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={stubVerify}
            >
              <span className="sm:hidden">Verify</span>
              <span className="hidden sm:inline">Verify registration</span>
            </Button>
            <Button type="button" size="sm" onClick={stubRegister}>
              Register
            </Button>
            <PublicThemeToggle />
          </nav>
        </div>
      </header>

      <div className="flex flex-1 flex-col">{children}</div>

      <PublicFooter siteTitle={LANDING_SITE_TITLE} />
    </div>
  );
}
