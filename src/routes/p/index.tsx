import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Radio, Swords, Trophy, Users, UsersRound } from "lucide-react";

export const Route = createFileRoute("/p/")({
  component: PublicHubPage,
});

const sections = [
  {
    to: "/p/tournaments" as const,
    title: "Tournaments",
    blurb: "Schedules, venues, and event status.",
    icon: Trophy,
    featured: true,
  },
  {
    to: "/p/matches" as const,
    title: "Matches",
    blurb: "Bracket rows, scores, and live status.",
    icon: Swords,
    featured: true,
  },
  {
    to: "/p/teams" as const,
    title: "Teams",
    blurb: "Registered squads and readiness.",
    icon: UsersRound,
    featured: false,
  },
  {
    to: "/p/participants" as const,
    title: "Participants",
    blurb: "Players and roster assignments.",
    icon: Users,
    featured: false,
  },
];

function PublicHubPage() {
  const primary = sections.filter((s) => s.featured);
  const secondary = sections.filter((s) => !s.featured);

  return (
    <div className="flex flex-col gap-12">
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/30 p-6 shadow-[0_0_0_1px] shadow-primary/10 sm:p-10">
        <div
          className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-primary/15 blur-3xl"
          aria-hidden
        />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end">
          <div className="flex flex-col gap-5">
            <p className="inline-flex items-center gap-2 font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
              <Radio className="size-3.5" aria-hidden />
              Live desk · Barangay 176-E
            </p>
            <h1 className="max-w-xl font-serif text-4xl leading-[1.08] tracking-tight sm:text-5xl">
              Everything the crowd can see—no login required.
            </h1>
            <p className="max-w-lg text-muted-foreground text-sm leading-relaxed sm:text-base">
              Browse tournaments, matches, teams, and participants. Staff workflows
              live behind{" "}
              <Link
                to="/app/auth/login"
                className="font-medium text-primary underline decoration-primary/40 underline-offset-4 transition-colors hover:decoration-primary"
              >
                admin login
              </Link>
              .
            </p>
          </div>
          <div className="flex flex-col gap-3 lg:text-right">
            <p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.2em]">
              Jump in
            </p>
            <div className="flex flex-wrap gap-2 lg:justify-end">
              {primary.map(({ to, title, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    buttonVariants({ variant: "default", size: "lg" }),
                    "gap-2 rounded-2xl px-5 shadow-[0_12px_40px_-18px] shadow-primary/60",
                  )}
                >
                  <Icon className="size-4" aria-hidden />
                  {title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-2xl tracking-tight sm:text-3xl">Directory</h2>
          <p className="max-w-md text-right text-muted-foreground text-sm">
            Two headline boards for what changes nightly, plus roster intel below.
          </p>
        </div>

        <ul className="grid gap-4 lg:grid-cols-2">
          {primary.map(({ to, title, blurb, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className={cn(
                  "group flex h-full min-h-[8.5rem] flex-col justify-between rounded-2xl border border-border/80 bg-linear-to-br from-card/95 via-primary/[0.08] to-card/95 p-5 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/25 sm:p-6",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-primary">
                    <Icon className="size-6" strokeWidth={1.35} aria-hidden />
                  </span>
                  <ArrowRight
                    className="size-5 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-primary"
                    aria-hidden
                  />
                </div>
                <div className="flex flex-col gap-1.5 pt-4">
                  <span className="block font-serif text-xl tracking-tight sm:text-2xl">
                    {title}
                  </span>
                  <span className="block text-muted-foreground text-sm leading-snug">
                    {blurb}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <ul className="grid gap-3 sm:grid-cols-2">
          {secondary.map(({ to, title, blurb, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex items-start gap-4 rounded-xl border border-border/80 bg-card/40 p-4 transition-[transform,box-shadow,border-color,background-color] duration-300 ease-out hover:-translate-y-0.5 hover:border-primary/25 hover:bg-card/70 hover:shadow-md hover:shadow-primary/10"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-foreground">
                  <Icon className="size-5 opacity-90" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 flex flex-col gap-1">
                  <span className="flex items-center gap-2 font-semibold tracking-tight">
                    {title}
                    <ArrowRight className="size-4 shrink-0 opacity-40" aria-hidden />
                  </span>
                  <span className="block text-muted-foreground text-sm">{blurb}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Link
        to="/"
        className={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "px-0 text-muted-foreground hover:text-foreground",
        )}
      >
        ← Back to home
      </Link>
    </div>
  );
}
