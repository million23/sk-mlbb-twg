import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import {
  LANDING_HEADLINE,
  LANDING_SITE_TITLE,
  LANDING_STEPS,
  LANDING_SUPPORT,
  LANDING_WHO,
} from "./content";
import { LandingShell } from "./shell";

/** Classic marketing stack: full-bleed hero → how it works → who can join → CTA. */
export function HomePage() {
  return (
    <LandingShell transparentNav>
      <section className="relative flex min-h-svh flex-col justify-center overflow-hidden bg-background px-5 pb-12 pt-24 text-foreground sm:justify-end sm:px-8 sm:pb-20 sm:pt-28 lg:px-12">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_70%_20%,color-mix(in_oklch,var(--primary)_28%,transparent),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_10%_80%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_50%)]"
          aria-hidden
        />

        <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-5 animate-in fade-in slide-in-from-bottom-3 duration-700 sm:gap-6">
          <p className="max-w-5xl text-balance font-serif text-[clamp(2.125rem,8.5vw,5rem)] leading-[1.02] tracking-tight">
            {LANDING_SITE_TITLE}
          </p>
          <h1 className="max-w-2xl text-pretty text-base font-medium leading-snug sm:text-xl lg:text-2xl">
            {LANDING_HEADLINE}
          </h1>
          <p className="max-w-xl text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base lg:text-lg">
            {LANDING_SUPPORT}
          </p>
          <div className="flex w-full flex-col gap-3 pt-2 sm:w-auto sm:flex-row sm:flex-wrap">
            <Button
              size="lg"
              className="w-full shadow-[0_12px_40px_-18px] shadow-primary/60 sm:w-auto"
              render={<Link to="/register" />}
            >
              Register now
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              render={<Link to="/legacy/p/tournaments" />}
            >
              View tournaments
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-5 py-14 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="flex max-w-2xl flex-col gap-3">
          <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
            How it works
          </p>
          <h2 className="text-balance font-serif text-2xl tracking-tight sm:text-3xl lg:text-4xl">
            Three steps from form to pending review.
          </h2>
        </div>
        <ol className="mt-8 flex flex-col gap-0 sm:mt-12">
          {LANDING_STEPS.map((step, i) => (
            <li key={step.title}>
              {i > 0 ? <Separator className="my-0" /> : null}
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

      <section className="border-y border-border/70 bg-muted/30">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-14 sm:grid-cols-2 sm:gap-10 sm:px-8 sm:py-20 lg:grid-cols-3 lg:px-12">
          {LANDING_WHO.map((item) => (
            <div key={item.title} className="flex flex-col gap-2">
              <h3 className="font-serif text-xl tracking-tight sm:text-2xl">
                {item.title}
              </h3>
              <p className="text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
                {item.blurb}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-col items-stretch gap-6 px-5 py-14 sm:flex-row sm:items-end sm:justify-between sm:px-8 sm:py-20 lg:px-12 lg:py-24">
        <div className="flex max-w-xl flex-col gap-2">
          <h2 className="text-balance font-serif text-2xl tracking-tight sm:text-3xl lg:text-4xl">
            Ready when the window opens.
          </h2>
          <p className="text-pretty text-muted-foreground text-sm sm:text-base">
            Start registration and choose an open tournament. Committee review
            follows after you submit.
          </p>
        </div>
        <Button
          size="lg"
          className="w-full shrink-0 sm:w-auto"
          render={<Link to="/register" />}
        >
          Start registration
          <ArrowRight data-icon="inline-end" />
        </Button>
      </section>
    </LandingShell>
  );
}
