import { PublicFooter } from "@/components/public/public-footer";
import { PublicThemeToggle } from "@/components/public/public-theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useParticipants } from "@/hooks/use-participants";
import { useTournaments } from "@/hooks/use-tournaments";
import { useTeams } from "@/hooks/use-teams";
import { pb } from "@/lib/pocketbase";
import { PUBLIC_SITE_TITLE } from "@/lib/public-site";
import { cn } from "@/lib/utils";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  Swords,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";

export const Route = createFileRoute("/")({
  component: HomePage,
  beforeLoad: () => {
    if (typeof window !== "undefined" && pb.authStore.isValid) {
      const id = pb.authStore.record?.id;
      if (id) throw redirect({ to: "/app/$id/", params: { id } } as never);
    }
  },
});

const sections = [
  {
    to: "/p/tournaments" as const,
    title: "Tournaments",
    blurb: "Event details, venues, and status.",
    icon: Trophy,
  },
  {
    to: "/p/matches" as const,
    title: "Matches",
    blurb: "Scores, schedule, and results.",
    icon: Swords,
  },
  {
    to: "/p/teams" as const,
    title: "Teams",
    blurb: "Squad list and readiness.",
    icon: UsersRound,
  },
  {
    to: "/p/participants" as const,
    title: "Participants",
    blurb: "Players and lane preferences.",
    icon: Users,
  },
] as const;

function HomePage() {
  const { data: tournaments, isLoading: tLoading } = useTournaments();
  const { data: teams, isLoading: tmLoading } = useTeams();
  const { data: participants, isLoading: pLoading } = useParticipants();

  const countsLoading = tLoading || tmLoading || pLoading;
  const tournamentCount = tournaments?.length ?? 0;
  const teamCount = teams?.length ?? 0;
  const participantCount = participants?.length ?? 0;

  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden bg-background">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,color-mix(in_oklch,var(--primary)_18%,transparent),transparent)]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute top-1/3 right-[-20%] size-[min(55vw,28rem)] rounded-full bg-primary/6 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-[-10%] size-[min(45vw,22rem)] rounded-full bg-primary/5 blur-3xl"
        aria-hidden
      />

      <main className="relative z-10 flex-1">
        <div className="pointer-events-none fixed top-[max(0.75rem,env(safe-area-inset-top))] right-[max(0.75rem,env(safe-area-inset-right))] z-30">
          <div className="pointer-events-auto">
            <PublicThemeToggle />
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20 md:max-w-4xl">
        <header className="text-center">
          <p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.22em]">
            Barangay 176-E
          </p>
          <div className="mx-auto mt-5 flex max-w-2xl flex-col items-center gap-5 md:mt-6 md:gap-6">
            <span
              className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-primary/35 bg-linear-to-br from-primary/20 to-primary/5 text-primary shadow-[0_0_32px_-8px] shadow-primary/35"
              aria-hidden
            >
              <Trophy className="size-7" strokeWidth={1.5} />
            </span>
            <div className="min-w-0 flex flex-col gap-3 px-1">
              <h1 className="font-serif text-3xl leading-[1.12] tracking-tight text-balance sm:text-4xl md:text-[2.5rem]">
                SK MLBB Tournament Tracker
              </h1>
              <p className="mx-auto max-w-lg text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
                Follow tournaments, matches, teams, and participants — no
                account needed.
              </p>
            </div>
            <Link
              to="/p/tournaments"
              className={cn(
                buttonVariants({ size: "lg" }),
                "group gap-2 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/15",
              )}
            >
              View tournaments
              <ArrowRight
                className="size-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
          </div>
        </header>

        <section
          className="mx-auto mt-12 max-w-xl overflow-hidden rounded-2xl border border-border/70 bg-card/45 shadow-sm backdrop-blur-sm sm:max-w-none"
          aria-label="Active record counts"
        >
          <div className="border-border/50 border-b px-4 py-3 text-center sm:px-5 sm:text-left">
            <p className="font-medium text-foreground text-sm">At a glance</p>
            <p className="text-muted-foreground text-xs">
              Active records (non-archived)
            </p>
          </div>
          <div className="grid divide-border/60 sm:grid-cols-3 sm:divide-x">
            {countsLoading ? (
              <div className="col-span-full flex justify-center py-10">
                <Spinner className="size-6 text-primary" />
              </div>
            ) : (
              <>
                <Stat label="Tournaments" value={tournamentCount} />
                <Stat label="Teams" value={teamCount} />
                <Stat label="Players" value={participantCount} />
              </>
            )}
          </div>
        </section>

        <section
          aria-labelledby="browse-heading"
          className="mt-16 flex flex-col gap-5 sm:mt-20"
        >
          <div className="text-center sm:text-left">
            <h2
              id="browse-heading"
              className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.22em]"
            >
              Browse
            </h2>
            <p className="mt-1 text-muted-foreground text-sm">
              Public pages — read-only spectator views
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            {sections.map(({ to, title, blurb, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className={cn(
                    "group relative block h-full overflow-hidden rounded-2xl border border-border/80 bg-card/40 p-5 shadow-sm transition-[transform,border-color,box-shadow,background-color] duration-300 ease-out",
                    "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_0%_0%,color-mix(in_oklch,var(--primary)_12%,transparent),transparent_55%)] before:opacity-0 before:transition-opacity before:duration-500 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-card/70 hover:shadow-lg hover:shadow-primary/10 hover:before:opacity-100",
                  )}
                >
                  <span className="relative flex items-start gap-4">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary transition-colors group-hover:border-primary/35 group-hover:bg-primary/15">
                      <Icon className="size-[1.35rem]" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 flex flex-col gap-1.5">
                      <span className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-base leading-tight">
                          {title}
                        </span>
                        <ChevronRight
                          className="size-4 shrink-0 text-muted-foreground transition-[color,transform] group-hover:translate-x-0.5 group-hover:text-primary"
                          aria-hidden
                        />
                      </span>
                      <span className="block text-muted-foreground text-sm leading-snug">
                        {blurb}
                      </span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        </div>
      </main>
      <PublicFooter siteTitle={PUBLIC_SITE_TITLE} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-4 py-6 sm:py-7">
      <p className="font-bold text-3xl tabular-nums tracking-tight sm:text-4xl">
        {value}
      </p>
      <p className="text-muted-foreground text-[0.65rem] uppercase tracking-wider">
        {label}
      </p>
    </div>
  );
}
