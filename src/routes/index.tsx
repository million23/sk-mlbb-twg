import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useParticipants } from "@/hooks/use-participants";
import { useTournaments } from "@/hooks/use-tournaments";
import { useTeams } from "@/hooks/use-teams";
import { pb } from "@/lib/pocketbase";
import { cn } from "@/lib/utils";
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { ArrowRight, Swords, Trophy, Users, UsersRound } from "lucide-react";

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
  const navigate = useNavigate();
  const { data: tournaments, isLoading: tLoading } = useTournaments();
  const { data: teams, isLoading: tmLoading } = useTeams();
  const { data: participants, isLoading: pLoading } = useParticipants();

  const countsLoading = tLoading || tmLoading || pLoading;
  const tournamentCount = tournaments?.length ?? 0;
  const teamCount = teams?.length ?? 0;
  const participantCount = participants?.length ?? 0;

  return (
    <main className="min-h-svh bg-linear-to-b from-background via-background to-muted/25">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-16">
        <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-3">
            <p className="font-medium text-primary text-sm uppercase tracking-widest">
              Barangay 176-E
            </p>
            <h1 className="text-balance font-bold text-3xl tracking-tight sm:text-4xl">
              SK MLBB Tournament Tracker
            </h1>
            <p className="max-w-xl text-muted-foreground text-pretty sm:text-lg">
              Follow tournaments, matches, teams, and participants — no account
              needed.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <button
                type="button"
                className={cn(buttonVariants({ size: "lg" }))}
                onClick={() => navigate({ to: "/p/tournaments" })}
              >
                View tournaments
                <ArrowRight className="size-4" aria-hidden />
              </button>
            </div>
          </div>
          <Card className="w-full shrink-0 border-border/80 bg-card/60 sm:max-w-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">At a glance</CardTitle>
              <CardDescription>Active records (non-archived)</CardDescription>
            </CardHeader>
            <div className="grid grid-cols-3 gap-2 px-6 pb-6">
              {countsLoading ? (
                <div className="col-span-3 flex justify-center py-6">
                  <Spinner className="size-6" />
                </div>
              ) : (
                <>
                  <Stat label="Tournaments" value={tournamentCount} />
                  <Stat label="Teams" value={teamCount} />
                  <Stat label="Players" value={participantCount} />
                </>
              )}
            </div>
          </Card>
        </header>

        <section aria-labelledby="browse-heading" className="space-y-4">
          <h2 id="browse-heading" className="font-semibold text-lg">
            Browse
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2">
            {sections.map(({ to, title, blurb, icon: Icon }) => (
              <li key={to}>
                <Link
                  to={to}
                  className="group block h-full rounded-2xl border border-border/80 bg-card/40 p-5 shadow-sm transition-all hover:border-primary/35 hover:bg-card hover:shadow-md"
                >
                  <span className="flex items-start gap-4">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary transition-colors group-hover:bg-primary/18">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1 space-y-1">
                      <span className="flex items-center gap-2 font-semibold text-base">
                        {title}
                        <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                      <span className="block text-muted-foreground text-sm">
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
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-muted/40 px-2 py-3 text-center">
      <p className="font-bold text-2xl tabular-nums">{value}</p>
      <p className="text-muted-foreground text-xs">{label}</p>
    </div>
  );
}
