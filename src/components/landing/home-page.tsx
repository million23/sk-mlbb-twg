import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useResolvedTheme } from "@/hooks/use-resolved-theme";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import {
  LANDING_CTA_HEADLINE,
  LANDING_CTA_SUPPORT,
  LANDING_STEPS,
  LANDING_WHO,
  LANDING_WHO_EYEBROW,
  LANDING_WHO_HEADLINE,
  LANDING_WHO_SUPPORT,
} from "./content";
import { LandingHero } from "./hero";
import { LandingShell } from "./shell";

/** Full-bleed starfield landing: hero → steps → eligibility → CTA. */
export function HomePage() {
  const theme = useResolvedTheme();
  const isDark = theme === "dark";

  return (
    <LandingShell transparentNav>
      <div className="relative isolate">
        <StarsBackground
          className={cn(
            "absolute inset-0 size-auto min-h-full",
            isDark
              ? "bg-[radial-gradient(ellipse_at_bottom,color-mix(in_oklch,var(--primary)_22%,#1a1210)_0%,#090808_45%,#050505_100%)]"
              : "bg-[radial-gradient(ellipse_at_bottom,color-mix(in_oklch,var(--primary)_14%,#f3ebe4)_0%,#faf6f2_48%,#f7f3ef_100%)]",
          )}
          starColor={isDark ? "#f0d0c4" : "#b08978"}
          pointerEvents={false}
          factor={0.04}
          speed={60}
          aria-hidden
        />

        <LandingHero />

        {/* How it works */}
        <section className="relative z-10 mx-auto w-full max-w-7xl px-5 pb-16 pt-4 sm:px-8 sm:pb-24 sm:pt-6 lg:px-12 lg:pb-28">
          <div className="flex max-w-2xl flex-col gap-3">
            <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
              How it works
            </p>
            <h2 className="text-balance font-serif text-2xl tracking-tight sm:text-3xl lg:text-4xl">
              How to register in three steps.
            </h2>
          </div>
          <ol className="mt-8 flex flex-col gap-0 sm:mt-12">
            {LANDING_STEPS.map((step, i) => (
              <li key={step.title}>
                {i > 0 ? (
                  <Separator className="my-0 bg-border/40" />
                ) : null}
                <div className="grid gap-3 py-7 sm:grid-cols-[5rem_1fr] sm:gap-8 sm:py-10">
                  <span className="font-mono text-2xl text-primary/80 tabular-nums sm:text-3xl">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className="font-serif text-xl tracking-tight sm:text-2xl">
                      {step.title}
                    </h3>
                    <p className="max-w-2xl text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
                      {step.blurb}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Eligibility — stacked manifesto chapters */}
        <section className="relative z-10 mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-12">
          <header className="mx-auto flex max-w-2xl flex-col items-center gap-3 text-center">
            <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
              {LANDING_WHO_EYEBROW}
            </p>
            <h2 className="text-balance font-serif text-3xl tracking-tight sm:text-5xl">
              {LANDING_WHO_HEADLINE}
            </h2>
            <p className="text-pretty text-muted-foreground text-sm sm:text-base">
              {LANDING_WHO_SUPPORT}
            </p>
          </header>

          <ol className="mt-14 flex flex-col sm:mt-20">
            {LANDING_WHO.map((item, i) => (
              <li
                key={item.title}
                className="relative overflow-hidden border-t border-border/40 py-12 last:border-b sm:py-16"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute -right-2 top-6 select-none font-mono text-[clamp(4rem,14vw,9rem)] font-bold leading-none text-primary/10 tabular-nums"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="relative flex max-w-3xl flex-col gap-4">
                  <p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.2em]">
                    {item.title}
                  </p>
                  <p className="font-serif text-3xl tracking-tight text-foreground sm:text-5xl">
                    {item.mark}
                  </p>
                  <p className="max-w-xl text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
                    {item.blurb}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Closing CTA — coral slab */}
        <section className="relative z-10 px-5 pb-28 sm:px-8 sm:pb-36 lg:px-12">
          <div className="relative mx-auto w-full max-w-7xl overflow-hidden border border-primary/30 bg-primary/10 px-6 py-14 sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute -bottom-16 -left-10 select-none font-serif text-[clamp(6rem,22vw,14rem)] leading-none text-primary/15"
            >
              Join
            </div>
            <div className="relative flex max-w-2xl flex-col gap-6">
              <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
                Open registration
              </p>
              <h2 className="text-balance font-serif text-4xl tracking-tight sm:text-6xl">
                {LANDING_CTA_HEADLINE}
              </h2>
              <p className="text-pretty text-foreground/80 text-sm leading-relaxed sm:text-base">
                {LANDING_CTA_SUPPORT}
              </p>
              <div className="flex flex-col gap-4 pt-2">
                <Button
                  size="lg"
                  className="w-full sm:w-fit"
                  render={<Link to="/register" />}
                >
                  Start registration
                  <ArrowRight data-icon="inline-end" />
                </Button>
                <Link
                  to="/verify"
                  className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.16em] transition-colors hover:text-foreground"
                >
                  Already registered? Check status
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Soft handoff into the footer */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-1 h-28 bg-linear-to-t from-background to-transparent"
          aria-hidden
        />
      </div>
    </LandingShell>
  );
}
