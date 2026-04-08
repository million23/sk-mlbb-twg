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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  type MatchRecord,
  useMatchesForTournament,
} from "@/hooks/use-matches";
import { useTournaments } from "@/hooks/use-tournaments";
import { getMatchStatusStyle } from "@/lib/match-status";
import { tournamentLabel } from "@/lib/tournament-label";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { format } from "date-fns";
import { Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/p/matches")({
  component: PublicMatchesPage,
});

function teamName(m: MatchRecord, side: "A" | "B"): string {
  const key = side === "A" ? "teamA" : "teamB";
  const id = side === "A" ? m.teamA : m.teamB;
  const expanded = m.expand?.[key];
  return expanded?.name ?? id ?? "TBD";
}

function winnerName(m: MatchRecord): string {
  const id = m.winner;
  if (!id) return "";
  return m.expand?.winner?.name ?? id;
}

function formatScheduled(iso: string | undefined) {
  if (!iso) return null;
  try {
    return format(new Date(iso), "MMM d, yyyy · h:mm a");
  } catch {
    return null;
  }
}

function PublicMatchesPage() {
  const { data: tournaments, isLoading: tournamentsLoading } = useTournaments();
  const [tournamentId, setTournamentId] = useState<string>("");

  const sortedTournaments = useMemo(
    () =>
      [...(tournaments ?? [])].sort((a, b) => {
        const order = (s: string | undefined) =>
          s === "live" ? 0 : s === "upcoming" ? 1 : s === "draft" ? 2 : 3;
        return order(a.status) - order(b.status);
      }),
    [tournaments],
  );

  useEffect(() => {
    const first = sortedTournaments[0];
    if (!tournamentId && first) {
      setTournamentId(first.id);
    }
  }, [sortedTournaments, tournamentId]);

  const selectedTournament = useMemo(
    () => sortedTournaments.find((t) => t.id === tournamentId),
    [sortedTournaments, tournamentId],
  );

  const tournamentEligible =
    Boolean(selectedTournament) && selectedTournament?.archived !== true;

  const {
    data: matches,
    isLoading: matchesLoading,
    isError,
    error,
  } = useMatchesForTournament(tournamentId || undefined, {
    enabled: tournamentEligible,
  });

  if (tournamentsLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-8" />
        <p className="text-muted-foreground text-sm">Loading tournaments…</p>
      </div>
    );
  }

  if (!sortedTournaments.length) {
    return (
      <Empty className="min-h-[40vh] border border-dashed">
        <EmptyHeader>
          <EmptyTitle>No tournaments</EmptyTitle>
          <EmptyDescription>
            Matches are organized by tournament. Create a tournament in admin
            first.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Swords className="size-7 text-primary" aria-hidden />
          Matches
        </h1>
        <p className="text-muted-foreground text-sm">
          Read-only bracket rows for the selected tournament.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="public-match-tournament">Tournament</Label>
        <Select
          value={tournamentId}
          onValueChange={setTournamentId}
        >
          <SelectTrigger id="public-match-tournament" className="max-w-md">
            <SelectValue placeholder="Select tournament" />
          </SelectTrigger>
          <SelectContent>
            {sortedTournaments.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {tournamentLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!tournamentEligible ? (
        <p className="text-muted-foreground text-sm">
          This tournament is not available for public match listing.
        </p>
      ) : matchesLoading ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3">
          <Spinner className="size-8" />
          <p className="text-muted-foreground text-sm">Loading matches…</p>
        </div>
      ) : isError ? (
        <Empty className="border border-dashed">
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
            <EmptyTitle>No matches in this tournament</EmptyTitle>
            <EmptyDescription>
              Schedule rows will show here once they are added.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ul className="space-y-3">
          {(matches ?? []).map((m) => {
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

            return (
              <li key={m.id}>
                <Card className="border-border/80 bg-card/50">
                  <CardHeader className="pb-2">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {m.matchLabel?.trim() || "Match"}
                          {m.round ? (
                            <span className="ml-2 font-normal text-muted-foreground text-sm">
                              · {m.round}
                            </span>
                          ) : null}
                        </CardTitle>
                        {scheduled ? (
                          <CardDescription>{scheduled}</CardDescription>
                        ) : null}
                      </div>
                      <Badge variant="outline" className={cn("shrink-0", st.className)}>
                        {st.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 flex-1 font-medium">
                        {teamName(m, "A")}
                      </span>
                      {scoreKnown ? (
                        <span className="shrink-0 font-mono tabular-nums">
                          {scoreA} – {scoreB}
                        </span>
                      ) : (
                        <span className="shrink-0 text-muted-foreground">vs</span>
                      )}
                      <span className="min-w-0 flex-1 text-right font-medium">
                        {teamName(m, "B")}
                      </span>
                    </div>
                    {win ? (
                      <p className="text-muted-foreground text-xs">
                        Winner: <span className="text-foreground">{win}</span>
                      </p>
                    ) : null}
                    {m.notes?.trim() ? (
                      <p className="border-border/60 border-t pt-2 text-muted-foreground text-xs">
                        {m.notes}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
