import { StarsBackground } from "@/components/animate-ui/components/backgrounds/stars";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
  return (
    <LandingShell transparentNav>
      <div className="relative isolate">
        <StarsBackground
          className="absolute inset-0 size-auto min-h-full bg-[radial-gradient(ellipse_at_bottom,color-mix(in_oklch,var(--primary)_22%,#1a1210)_0%,#090808_45%,#050505_100%)]"
          starColor="#f0d0c4"
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

        {/* Eligibility — editorial checklist, not a card grid */}
        <section className="relative z-10 mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 lg:items-start">
            <div className="flex max-w-md flex-col gap-3 lg:sticky lg:top-28">
              <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
                {LANDING_WHO_EYEBROW}
              </p>
              <h2 className="text-balance font-serif text-3xl tracking-tight sm:text-4xl lg:text-5xl">
                {LANDING_WHO_HEADLINE}
              </h2>
              <p className="text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
                {LANDING_WHO_SUPPORT}
              </p>
            </div>

            <ul className="flex flex-col">
              {LANDING_WHO.map((item, i) => (
                <li
                  key={item.title}
                  className={cn(
                    "group grid gap-3 border-border/40 py-8 sm:grid-cols-[9.5rem_1fr] sm:gap-8 sm:py-10",
                    i === 0 ? "border-t border-b" : "border-b",
                  )}
                >
                  <span className="whitespace-nowrap font-mono text-2xl font-medium tracking-tight text-primary transition-transform duration-500 ease-out group-hover:translate-x-1 sm:text-3xl">
                    {item.mark}
                  </span>
                  <div className="flex min-w-0 flex-col gap-1.5">
                    <h3 className="font-heading text-lg font-medium tracking-tight sm:text-xl">
                      {item.title}
                    </h3>
                    <p className="max-w-md text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
                      {item.blurb}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing CTA — one job, one action */}
        <section className="relative z-10 px-5 pb-28 pt-8 sm:px-8 sm:pb-36 sm:pt-12 lg:px-12">
          <div className="relative mx-auto flex w-full max-w-7xl flex-col items-start gap-8 border-t border-border/50 pt-14 sm:gap-10 sm:pt-20">
            <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
              Open registration
            </p>
            <h2 className="max-w-4xl text-balance font-serif text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.02] tracking-tight">
              {LANDING_CTA_HEADLINE}
            </h2>
            <p className="max-w-xl text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base lg:text-lg">
              {LANDING_CTA_SUPPORT}
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <Button
                size="lg"
                className="w-full sm:w-auto"
                render={<Link to="/register" />}
              >
                Start registration
                <ArrowRight data-icon="inline-end" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full text-muted-foreground sm:w-auto"
                render={<Link to="/verify" />}
              >
                Already registered? Check status
              </Button>
            </div>
          </div>
        </section>

        {/* Soft handoff into the footer */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-28 bg-linear-to-t from-background to-transparent"
          aria-hidden
        />
      </div>
    </LandingShell>
  );
}
