import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import {
  LANDING_HEADLINE,
  LANDING_SITE_TITLE,
  LANDING_SUPPORT,
} from "./content";

/**
 * Hero copy only — starfield plane lives on the parent so the
 * next section can share the same continuous background.
 */
export function LandingHero() {
  return (
    <section className="relative z-10 flex min-h-svh flex-col justify-end text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-5 pb-12 pt-28 sm:gap-6 sm:px-8 sm:pb-16 sm:pt-32 lg:px-12 lg:pb-20">
        <p className="landing-hero-enter max-w-5xl text-balance font-serif text-[clamp(2.25rem,9vw,5.25rem)] leading-[0.98] tracking-tight">
          <span className="block">{LANDING_SITE_TITLE}</span>
        </p>

        <h1
          className="landing-hero-enter max-w-2xl text-pretty font-heading text-lg font-medium leading-snug tracking-tight sm:text-2xl lg:text-3xl"
          style={{ animationDelay: "140ms" }}
        >
          {LANDING_HEADLINE}
        </h1>

        <p
          className="landing-hero-enter max-w-xl text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base lg:text-lg"
          style={{ animationDelay: "240ms" }}
        >
          {LANDING_SUPPORT}
        </p>

        <div
          className="landing-hero-enter flex w-full flex-col gap-3 pt-1 sm:w-auto sm:flex-row sm:flex-wrap"
          style={{ animationDelay: "340ms" }}
        >
          <Button
            size="lg"
            className="w-full sm:w-auto"
            render={<Link to="/register" />}
          >
            Register now
            <ArrowRight data-icon="inline-end" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full border-foreground/15 bg-background/40 backdrop-blur-sm sm:w-auto"
            render={<Link to="/tournaments" />}
          >
            View tournaments
          </Button>
        </div>
      </div>
    </section>
  );
}
