import { PublicPageHeader } from "@/components/public/public-page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import {
  type MatchRecord,
  useMatchesForTournament,
} from "@/hooks/use-matches";
import { usePublicTournaments } from "@/hooks/use-tournaments";
import { getMatchStatusStyle } from "@/lib/match-status";
import { tournamentLabel } from "@/lib/tournament-label";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, Crown, Swords } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/p/tournaments/$id")({
  component: TournamentMatchesPage,
});

function teamName(m: MatchRecord, side: "A" | "B"): string {
  const key = side === "A" ? "teamA" : "teamB";
  const rawId = side === "A" ? m.teamA : m.teamB;
  return m.expand?.[key]?.name ?? rawId ?? "TBD";
}

function winnerName(m: MatchRecord): string {
  if (!m.winner) return "";
  return m.expand?.winner?.name ?? m.winner;
}

function formatScheduled(iso: string | undefined) {
  if (!iso) return null;
  try {
    return format(new Date(iso), "MMM d, yyyy · h:mm a");
  } catch {
    return null;
  }
}

function TournamentMatchesPage() {
  const { id } = Route.useParams();
  const { data: tournaments, isLoading: tournamentsLoading } =
    usePublicTournaments();

  const tournament = useMemo(
    () => (tournaments ?? []).find((t) => t.id === id),
    [tournaments, id],
  );

  const eligible = Boolean(tournament) && tournament?.archived !== true;

  const {
    data: matches,
    isLoading: matchesLoading,
    isError,
    error,
  } = useMatchesForTournament(id, { enabled: eligible });

  const matchesByRound = useMemo(() => {
    const rows = matches ?? [];
    const map = new Map<string, MatchRecord[]>();
    for (const m of rows) {
      const key = m.round?.trim() || "Bracket";
      const bucket = map.get(key);
      if (bucket) bucket.push(m);
      else map.set(key, [m]);
    }
    return [...map.entries()].sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  }, [matches]);

  const backLink = (
    <Link
      to="/p/tournaments"
      className="flex w-fit items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3 shrink-0" aria-hidden />
      All Tournaments
    </Link>
  );

  if (tournamentsLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-8 text-primary" />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <Empty className="min-h-[40vh] border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Tournament not found</EmptyTitle>
            <EmptyDescription>
              This tournament doesn't exist or is no longer available.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-10">
      {backLink}

      <PublicPageHeader
        eyebrow={tournamentLabel(tournament)}
        title="Matches"
        description="Read-only bracket rows for this tournament. Share the URL to link directly to this feed."
        icon={Swords}
      />

      {!eligible ? (
        <p className="text-muted-foreground text-sm">
          This tournament is not available for public match listing.
        </p>
      ) : matchesLoading ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3">
          <Spinner className="size-8 text-primary" />
          <p className="text-muted-foreground text-sm">Loading matches…</p>
        </div>
      ) : isError ? (
        <Empty className="border border-dashed border-destructive/30 bg-destructive/5">
          <EmptyHeader>
            <EmptyTitle>Could not load matches</EmptyTitle>
            <EmptyDescription>
              {error instanceof Error ? error.message : "Something went wrong."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : !(matches ?? []).length ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyTitle>No matches yet</EmptyTitle>
            <EmptyDescription>
              Schedule rows will appear here once they are added.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-10">
          {matchesByRound.map(([roundLabel, roundMatches]) => (
            <section key={roundLabel} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="font-serif text-xl tracking-tight sm:text-2xl">
                  {roundLabel}
                </span>
                <span className="h-px flex-1 bg-linear-to-r from-border to-transparent" />
                <span className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-wider">
                  {roundMatches.length} match
                  {roundMatches.length === 1 ? "" : "es"}
                </span>
              </div>
              <ul className="flex flex-col gap-3">
                {roundMatches.map((m) => {
                  const st = getMatchStatusStyle(m.status);
                  const scheduled = formatScheduled(m.scheduledAt);
                  const scoreKnown =
                    m.status === "completed" ||
                    m.status === "walkover" ||
                    typeof m.scoreA === "number" ||
                    typeof m.scoreB === "number";
                  const scoreA = m.scoreA ?? 0;
                  const scoreB = m.scoreB ?? 0;
                  const win = winnerName(m);
                  const teamA = teamName(m, "A");
                  const teamB = teamName(m, "B");

                  return (
                    <li key={m.id}>
                      <Card className="overflow-hidden border-border/80 bg-card/50 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/20">
                        <CardHeader className="pb-2">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <CardTitle className="font-serif text-lg">
                                {m.matchLabel?.trim() || "Match"}
                              </CardTitle>
                              {scheduled ? (
                                <CardDescription className="font-mono text-xs tracking-wide">
                                  {scheduled}
                                </CardDescription>
                              ) : null}
                            </div>
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0 font-mono text-[0.65rem] uppercase tracking-wider",
                                st.className,
                              )}
                            >
                              {st.label}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-3">
                          <div className="flex flex-wrap items-stretch justify-between gap-3 rounded-2xl border border-border/60 bg-muted/25 p-3 sm:items-center">
                            <span
                              className={cn(
                                "min-w-0 flex-1 self-center font-medium leading-snug",
                                win && win === teamA && "text-primary",
                              )}
                            >
                              {teamA}
                            </span>
                            {scoreKnown ? (
                              <span className="flex shrink-0 items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-4 py-2 font-mono text-lg tabular-nums tracking-tight shadow-inner">
                                <span className={cn(win && win === teamA && "text-primary")}>
                                  {scoreA}
                                </span>
                                <span className="text-muted-foreground">:</span>
                                <span className={cn(win && win === teamB && "text-primary")}>
                                  {scoreB}
                                </span>
                              </span>
                            ) : (
                              <span className="flex shrink-0 items-center rounded-full border border-dashed border-border px-4 py-1.5 font-mono text-muted-foreground text-sm uppercase tracking-widest">
                                vs
                              </span>
                            )}
                            <span
                              className={cn(
                                "min-w-0 flex-1 self-center text-right font-medium leading-snug",
                                win && win === teamB && "text-primary",
                              )}
                            >
                              {teamB}
                            </span>
                          </div>
                          {win ? (
                            <p className="flex items-center gap-2 text-primary text-sm">
                              <Crown className="size-4 shrink-0 opacity-90" aria-hidden />
                              <span className="font-medium">{win}</span>
                              <span className="text-muted-foreground">takes the W</span>
                            </p>
                          ) : null}
                          {m.notes?.trim() ? (
                            <p className="border-border/60 border-t pt-2 text-muted-foreground text-xs leading-relaxed">
                              {m.notes}
                            </p>
                          ) : null}
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
