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
  stubRegister,
} from "./content";
import { LandingShell } from "./shell";

/** Classic marketing stack: full-bleed hero → how it works → who can join → CTA. */
export function HomePage() {
  return (
    <LandingShell transparentNav>
      <section className="relative flex min-h-svh flex-col justify-end overflow-hidden bg-background px-4 pb-16 pt-28 text-foreground sm:px-6 sm:pb-20">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_70%_at_70%_20%,color-mix(in_oklch,var(--primary)_28%,transparent),transparent_55%)]"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_10%_80%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_50%)]"
          aria-hidden
        />

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-700">
          <p className="max-w-4xl font-serif text-[clamp(2.5rem,7vw,4.75rem)] leading-[0.95] tracking-tight">
            {LANDING_SITE_TITLE}
          </p>
          <h1 className="max-w-xl text-lg font-medium leading-snug sm:text-xl">
            {LANDING_HEADLINE}
          </h1>
          <p className="max-w-md text-muted-foreground text-sm leading-relaxed sm:text-base">
            {LANDING_SUPPORT}
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button
              type="button"
              size="lg"
              onClick={stubRegister}
              className="shadow-[0_12px_40px_-18px] shadow-primary/60"
            >
              Register now
              <ArrowRight data-icon="inline-end" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              render={<Link to="/legacy/p/tournaments" />}
            >
              View tournaments
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="flex max-w-xl flex-col gap-3">
          <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
            How it works
          </p>
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            Three steps from form to pending review.
          </h2>
        </div>
        <ol className="mt-12 flex flex-col gap-0">
          {LANDING_STEPS.map((step, i) => (
            <li key={step.title}>
              {i > 0 ? <Separator className="my-0" /> : null}
              <div className="grid gap-4 py-8 sm:grid-cols-[4rem_1fr] sm:gap-8">
                <span className="font-mono text-3xl text-primary/80 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-serif text-xl tracking-tight sm:text-2xl">
                    {step.title}
                  </h3>
                  <p className="max-w-xl text-muted-foreground text-sm leading-relaxed sm:text-base">
                    {step.blurb}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="border-y border-border/70 bg-muted/30">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-3">
          {LANDING_WHO.map((item) => (
            <div key={item.title} className="flex flex-col gap-2">
              <h3 className="font-serif text-xl tracking-tight">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.blurb}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col items-start gap-5 px-4 py-16 sm:flex-row sm:items-end sm:justify-between sm:px-6 sm:py-24">
        <div className="flex max-w-lg flex-col gap-2">
          <h2 className="font-serif text-3xl tracking-tight sm:text-4xl">
            Ready when the window opens.
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base">
            Start registration and choose an open tournament. Committee review
            follows after you submit.
          </p>
        </div>
        <Button type="button" size="lg" onClick={stubRegister}>
          Start registration
          <ArrowRight data-icon="inline-end" />
        </Button>
      </section>
    </LandingShell>
  );
}
