import { LandingShell } from "@/components/landing/shell";
import { PublicSquadsSection } from "@/components/landing/public-squads-section";
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
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MatchPlayerResultsBody } from "@/components/public/match-player-results";
import { Skeleton } from "@/components/ui/skeleton";
import { useMatchResultsForMatch } from "@/hooks/legacy/use-match-results";
import {
  type MatchRecord,
  useMatchesForTournament,
} from "@/hooks/legacy/use-matches";
import { usePublicTournaments } from "@/hooks/legacy/use-tournaments";
import { usePublicRoster } from "@/hooks/public/use-public-roster";
import { getMatchStatusStyle } from "@/lib/legacy/match-status";
import { tournamentLabel } from "@/lib/legacy/tournament-label";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, Crown, Swords, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

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

function MatchResultModal({
  match,
  open,
  onOpenChange,
}: {
  match: MatchRecord | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: results, isLoading } = useMatchResultsForMatch(match?.id, {
    enabled: open && Boolean(match?.id),
  });

  const tA = match ? teamName(match, "A") : "";
  const tB = match ? teamName(match, "B") : "";
  const win = match ? winnerName(match) : "";

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <ResponsiveModalHeader className="border-b border-border/50 px-6 pt-6 pb-4">
          <ResponsiveModalTitle className="pr-6 font-serif text-xl">
            {match?.matchLabel?.trim() || "Match Results"}
          </ResponsiveModalTitle>
          {match ? (
            <ResponsiveModalDescription className="flex flex-wrap items-center gap-3 pt-1">
              <span
                className={cn(
                  "font-medium text-sm",
                  win === tA && "text-primary",
                )}
              >
                {tA}
              </span>
              <span className="font-mono text-muted-foreground text-sm">
                {match.scoreA ?? 0} : {match.scoreB ?? 0}
              </span>
              <span
                className={cn(
                  "font-medium text-sm",
                  win === tB && "text-primary",
                )}
              >
                {tB}
              </span>
              {win ? (
                <span className="flex items-center gap-1.5 text-primary text-xs">
                  <Crown className="size-3" aria-hidden />
                  {win} wins
                </span>
              ) : null}
            </ResponsiveModalDescription>
          ) : null}
        </ResponsiveModalHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {match ? (
            <MatchPlayerResultsBody
              key={match.id}
              match={match}
              results={results}
              isLoading={isLoading}
            />
          ) : null}
        </div>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}

/* ── Page ───────────────────────────────────────────────────── */

export type TournamentDeskTab = "matchups" | "teams";

function MatchCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/80 bg-card/50">
      <div className="flex items-start justify-between gap-2 p-6 pb-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Skeleton className="h-5 w-40 max-w-full rounded-md" />
          <Skeleton className="h-3 w-44 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-5 w-16 shrink-0 rounded-full" />
      </div>
      <div className="px-6 pb-6 pt-2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/25 p-3">
          <Skeleton className="h-4 w-[28%] max-w-32 rounded-md" />
          <Skeleton className="h-10 w-20 shrink-0 rounded-xl" />
          <Skeleton className="h-4 w-[28%] max-w-32 rounded-md" />
        </div>
      </div>
    </div>
  );
}

function MatchupsSkeleton() {
  return (
    <div className="flex flex-col gap-10" aria-busy="true">
      <span className="sr-only">Loading matches</span>
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-28 rounded-md sm:h-8" />
          <span className="h-px flex-1 bg-linear-to-r from-border to-transparent" />
          <Skeleton className="h-3 w-16 rounded-md" />
        </div>
        <ul className="flex flex-col gap-3">
          <li>
            <MatchCardSkeleton />
          </li>
          <li>
            <MatchCardSkeleton />
          </li>
          <li>
            <MatchCardSkeleton />
          </li>
        </ul>
      </section>
    </div>
  );
}

function MatchupsPanel({
  matchesLoading,
  isError,
  error,
  matches,
  matchesByRound,
  onSelectMatch,
}: {
  matchesLoading: boolean;
  isError: boolean;
  error: unknown;
  matches: MatchRecord[] | undefined;
  matchesByRound: [string, MatchRecord[]][];
  onSelectMatch: (match: MatchRecord) => void;
}) {
  if (matchesLoading) {
    return <MatchupsSkeleton />;
  }

  if (isError) {
    return (
      <Empty className="border border-dashed border-destructive/30 bg-destructive/5">
        <EmptyHeader>
          <EmptyTitle>Could not load matches</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error ? error.message : "Something went wrong."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (!(matches ?? []).length) {
    return (
      <Empty className="border border-dashed">
        <EmptyHeader>
          <EmptyTitle>No matches yet</EmptyTitle>
          <EmptyDescription>
            Schedule rows will appear here once they are added.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
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
              const tA = teamName(m, "A");
              const tB = teamName(m, "B");

              return (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onSelectMatch(m)}
                    className="block w-full rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  >
                    <Card className="cursor-pointer overflow-hidden border-border/80 bg-card/50 transition-[transform,box-shadow,border-color] duration-200 ease-out hover:border-primary/30 hover:shadow-lg hover:shadow-primary/20 [@media(hover:hover)_and_(pointer:fine)]:hover:-translate-y-1">
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
                              win && win === tA && "text-primary",
                            )}
                          >
                            {tA}
                          </span>
                          {scoreKnown ? (
                            <span className="flex shrink-0 items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-4 py-2 font-mono text-lg tabular-nums tracking-tight shadow-inner">
                              <span className={cn(win && win === tA && "text-primary")}>
                                {scoreA}
                              </span>
                              <span className="text-muted-foreground">:</span>
                              <span className={cn(win && win === tB && "text-primary")}>
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
                              win && win === tB && "text-primary",
                            )}
                          >
                            {tB}
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
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

type TournamentMatchesPageProps = {
  id: string;
  tab: TournamentDeskTab;
};

export function TournamentMatchesPage({ id, tab }: TournamentMatchesPageProps) {
  const navigate = useNavigate({ from: "/tournaments/$id" });
  const { data: tournaments, isLoading: tournamentsLoading } =
    usePublicTournaments();
  const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);

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
  } = useMatchesForTournament(id, { enabled: eligible, publicOnly: true });

  const { data: rosterTeams, isLoading: rosterLoading } = usePublicRoster(
    id,
    eligible,
  );

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
      to="/tournaments"
      className="flex w-fit items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3 shrink-0" aria-hidden />
      All Tournaments
    </Link>
  );

  if (tournamentsLoading) {
    return (
      <LandingShell>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
          <div className="flex flex-col gap-10" aria-busy="true">
            <span className="sr-only">Loading tournament</span>
            <Skeleton className="h-4 w-36 rounded-md" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-3 w-24 rounded-md" />
              <Skeleton className="h-10 w-48 max-w-full rounded-md sm:h-12" />
              <Skeleton className="h-4 w-full max-w-md rounded-md" />
            </div>
            <Skeleton className="mx-auto h-10 w-full max-w-md rounded-lg" />
            <MatchupsSkeleton />
          </div>
        </main>
      </LandingShell>
    );
  }

  if (!tournament) {
    return (
      <LandingShell>
        <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
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
        </main>
      </LandingShell>
    );
  }

  return (
    <LandingShell>
      <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
      <div className="flex flex-col gap-10">
        {backLink}

        <PublicPageHeader
          eyebrow={tournamentLabel(tournament)}
          title={tab === "teams" ? "Teams" : "Matchups"}
          description={
            tab === "teams"
              ? "Player names and preferred lanes only. Open a team to see the roster."
              : "Tap a match card to view player results."
          }
          icon={tab === "teams" ? UsersRound : Swords}
        />

        {!eligible ? (
          <p className="text-muted-foreground text-sm">
            This tournament is not available for public listing.
          </p>
        ) : (
          <Tabs
            value={tab}
            onValueChange={(value) => {
              const next: TournamentDeskTab =
                value === "teams" ? "teams" : "matchups";
              setSelectedMatch(null);
              void navigate({
                search: { tab: next },
                replace: true,
              });
            }}
            className="gap-6"
          >
            <TabsList className="mx-auto w-full max-w-md">
              <TabsTrigger value="matchups" className="active:scale-[0.97] transition-transform duration-160 ease-out">
                Matchups
                <span className="font-mono text-[0.65rem] tabular-nums text-muted-foreground">
                  {(matches ?? []).length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="teams" className="active:scale-[0.97] transition-transform duration-160 ease-out">
                Teams
                <span className="font-mono text-[0.65rem] tabular-nums text-muted-foreground">
                  {(rosterTeams ?? []).length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="matchups" className="mt-0">
              <MatchupsPanel
                matchesLoading={matchesLoading}
                isError={isError}
                error={error}
                matches={matches}
                matchesByRound={matchesByRound}
                onSelectMatch={setSelectedMatch}
              />
            </TabsContent>

            <TabsContent value="teams" className="mt-0">
              <PublicSquadsSection
                teams={rosterTeams ?? []}
                isLoading={rosterLoading}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <MatchResultModal
        match={selectedMatch}
        open={Boolean(selectedMatch)}
        onOpenChange={(v) => { if (!v) setSelectedMatch(null); }}
      />
      </main>
    </LandingShell>
  );
}
