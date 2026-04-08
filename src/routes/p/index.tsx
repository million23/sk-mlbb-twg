import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Swords, Trophy, Users, UsersRound } from "lucide-react";

export const Route = createFileRoute("/p/")({
  component: PublicHubPage,
});

const sections = [
  {
    to: "/p/tournaments" as const,
    title: "Tournaments",
    blurb: "Schedules, venues, and event status.",
    icon: Trophy,
  },
  {
    to: "/p/matches" as const,
    title: "Matches",
    blurb: "Bracket rows, scores, and live status.",
    icon: Swords,
  },
  {
    to: "/p/teams" as const,
    title: "Teams",
    blurb: "Registered squads and readiness.",
    icon: UsersRound,
  },
  {
    to: "/p/participants" as const,
    title: "Participants",
    blurb: "Players and roster assignments.",
    icon: Users,
  },
];

function PublicHubPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Public directory
        </h1>
        <p className="max-w-xl text-muted-foreground text-sm sm:text-base">
          Browse tournaments, matches, teams, and participants. For staff tools,
          use{" "}
          <Link
            to="/app/auth/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            admin login
          </Link>
          .
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {sections.map(({ to, title, blurb, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              className={cn(
                "flex items-start gap-4 rounded-xl border border-border/80 bg-card/40 p-4 transition-colors hover:border-primary/30 hover:bg-card",
              )}
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1 space-y-1">
                <span className="flex items-center gap-2 font-semibold">
                  {title}
                  <ArrowRight
                    className="size-4 shrink-0 opacity-50"
                    aria-hidden
                  />
                </span>
                <span className="block text-muted-foreground text-sm">
                  {blurb}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link
        to="/"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "px-0")}
      >
        ← Back to home
      </Link>
    </div>
  );
}
