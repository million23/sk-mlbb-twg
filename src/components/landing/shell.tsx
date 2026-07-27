import { PublicFooter } from "@/components/public/public-footer";
import { PublicThemeToggle } from "@/components/public/public-theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { LANDING_SITE_TITLE } from "./content";

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
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-5 py-3 sm:px-8 sm:py-4 lg:px-12">
          <Link
            to="/"
            className="min-w-0 flex-1 truncate font-semibold tracking-tight text-sm text-foreground sm:flex-none sm:text-base"
          >
            <span className="sm:hidden">SK 176-E MLBB</span>
            <span className="hidden sm:inline">{LANDING_SITE_TITLE}</span>
          </Link>

          <nav
            className="flex shrink-0 items-center gap-0.5 sm:gap-2"
            aria-label="Primary"
          >
            <Link
              to="/tournaments"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "px-2 sm:px-3",
              )}
            >
              Tournaments
            </Link>
            <Link
              to="/verify"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "px-2 sm:px-3",
              )}
            >
              <span className="sm:hidden">Verify</span>
              <span className="hidden sm:inline">Verify registration</span>
            </Link>
            <Button size="sm" className="px-3" render={<Link to="/register" />}>
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
