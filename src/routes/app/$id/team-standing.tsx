import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMatchResultsForTournament } from "@/hooks/use-match-results";
import { useMatchesForTournament } from "@/hooks/use-matches";
import { useParticipants } from "@/hooks/use-participants";
import { useTeams } from "@/hooks/use-teams";
import { useTournaments } from "@/hooks/use-tournaments";
import { tournamentAgeGroupFromBirthdate } from "@/lib/age";
import { LANE_ICON_SRC, LANE_ROLE_LABELS } from "@/lib/lane-role-icons";
import { tournamentLabel } from "@/lib/tournament-label";
import { cn } from "@/lib/utils";
import type { Collections } from "@/types/pocketbase-types";
import { createFileRoute } from "@tanstack/react-router";
import { ListOrdered } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/app/$id/team-standing")({
  component: TeamStandingPage,
});

type StandingRow = {
  teamId: string;
  teamName: string;
  ageGroup: "under18" | "18+" | "mixed";
  played: number;
  matchWins: number;
  matchLosses: number;
  gameWins: number;
  gameLosses: number;
  gameDiff: number;
  winRate: number;
};
type StandingAgeFilter = "all" | "under18" | "18+" | "mixed";
type LaneKey = NonNullable<Collections["match_result"]["lane"]>;
type BestLanerRow = {
  lane: LaneKey;
  laneLabel: string;
  playerId: string;
  playerLabel: string;
  teamName: string;
  teamWins: number;
  teamLosses: number;
  teamWinRate: number;
  playerMatchResults: number;
  avgPerformanceRating: number;
  avgKda: number;
  avgGold: number;
  score: number;
};

const LANE_LABELS: Record<LaneKey, string> = {
  mid: "Mid",
  gold: "Gold",
  exp: "Exp",
  support: "Support",
  jungle: "Jungle",
};
const LANE_ORDER: LaneKey[] = ["gold", "exp", "mid", "jungle", "support"];
const BEST_LANER_SCORE_WEIGHTS = {
  performanceRating: 0.4,
  kda: 0.35,
  teamWinRate: 0.15,
  sampleSize: 0.1,
} as const;

function TeamStandingPage() {
  const { data: tournaments, isLoading: tournamentsLoading } = useTournaments();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: participants } = useParticipants();
  const [tournamentId, setTournamentId] = useState<string>("");
  const [ageFilter, setAgeFilter] = useState<StandingAgeFilter>("all");
  const [bestLanersOpen, setBestLanersOpen] = useState(false);
  const [bestLaneFilter, setBestLaneFilter] = useState<"all" | LaneKey>("all");

  const sortedTournaments = useMemo(
    () =>
      [...(tournaments ?? [])].sort((a, b) => {
        const order = (s: string | undefined) =>
          s === "live" ? 0 : s === "upcoming" ? 1 : s === "draft" ? 2 : 3;
        return order(a.status) - order(b.status);
      }),
    [tournaments],
  );

  const selectedTournament = useMemo(
    () => sortedTournaments.find((t) => t.id === tournamentId),
    [sortedTournaments, tournamentId],
  );

  const tournamentEligible =
    Boolean(selectedTournament) && selectedTournament?.archived !== true;

  const { data: matches, isLoading: matchesLoading } = useMatchesForTournament(
    tournamentId || undefined,
    { enabled: tournamentEligible },
  );
  const { data: matchResults, isLoading: matchResultsLoading } =
    useMatchResultsForTournament(tournamentId || undefined, {
      enabled: tournamentEligible,
    });

  useEffect(() => {
    if (tournamentId || !tournaments?.length) return;
    const live = tournaments.find((t) => t.status === "live");
    const upcoming = tournaments.find((t) => t.status === "upcoming");
    const first = tournaments[0];
    const pick = live?.id ?? upcoming?.id ?? first?.id;
    if (pick) setTournamentId(pick);
  }, [tournamentId, tournaments]);

  useEffect(() => {
    if (!tournaments || !tournamentId) return;
    if (!tournaments.some((t) => t.id === tournamentId)) setTournamentId("");
  }, [tournaments, tournamentId]);

  const standings = useMemo(() => {
    const membersByTeam = new Map<
      string,
      { under18: number; adults: number; total: number }
    >();
    for (const p of participants ?? []) {
      const teamId = p.team?.trim();
      if (!teamId) continue;
      const current = membersByTeam.get(teamId) ?? {
        under18: 0,
        adults: 0,
        total: 0,
      };
      current.total += 1;
      const ageGroup = tournamentAgeGroupFromBirthdate(p.birthdate);
      if (ageGroup === "under18") current.under18 += 1;
      else if (ageGroup === "18+") current.adults += 1;
      membersByTeam.set(teamId, current);
    }

    const resolveAgeGroup = (teamId: string): StandingRow["ageGroup"] => {
      const counts = membersByTeam.get(teamId);
      if (!counts || counts.total < 1) return "mixed";
      if (counts.under18 > counts.total / 2) return "under18";
      if (counts.adults > counts.total / 2) return "18+";
      return "mixed";
    };

    const map = new Map<string, StandingRow>();
    for (const t of teams ?? []) {
      map.set(t.id, {
        teamId: t.id,
        teamName: t.name?.trim() || t.id,
        ageGroup: resolveAgeGroup(t.id),
        played: 0,
        matchWins: 0,
        matchLosses: 0,
        gameWins: 0,
        gameLosses: 0,
        gameDiff: 0,
        winRate: 0,
      });
    }

    const ensureTeam = (teamId: string, fallback?: string) => {
      const existing = map.get(teamId);
      if (existing) return existing;
      const created: StandingRow = {
        teamId,
        teamName: fallback?.trim() || teamId,
        ageGroup: resolveAgeGroup(teamId),
        played: 0,
        matchWins: 0,
        matchLosses: 0,
        gameWins: 0,
        gameLosses: 0,
        gameDiff: 0,
        winRate: 0,
      };
      map.set(teamId, created);
      return created;
    };

    for (const m of matches ?? []) {
      if (!m.teamA || !m.teamB) continue;
      const hasResultData =
        m.status === "completed" || m.status === "walkover" || Boolean(m.winner);
      if (!hasResultData) continue;
      const a = ensureTeam(m.teamA, m.expand?.teamA?.name);
      const b = ensureTeam(m.teamB, m.expand?.teamB?.name);
      const scoreA = Math.max(0, m.scoreA ?? 0);
      const scoreB = Math.max(0, m.scoreB ?? 0);

      a.played += 1;
      b.played += 1;
      a.gameWins += scoreA;
      a.gameLosses += scoreB;
      b.gameWins += scoreB;
      b.gameLosses += scoreA;

      if (m.winner === m.teamA) {
        a.matchWins += 1;
        b.matchLosses += 1;
      } else if (m.winner === m.teamB) {
        b.matchWins += 1;
        a.matchLosses += 1;
      }
    }

    const rows = [...map.values()].map((row) => {
      const gameDiff = row.gameWins - row.gameLosses;
      const winRate = row.played > 0 ? (row.matchWins / row.played) * 100 : 0;
      return { ...row, gameDiff, winRate };
    });

    rows.sort((a, b) => {
      if (b.matchWins !== a.matchWins) return b.matchWins - a.matchWins;
      if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
      if (b.gameWins !== a.gameWins) return b.gameWins - a.gameWins;
      return a.teamName.localeCompare(b.teamName);
    });
    return rows;
  }, [matches, participants, teams]);

  const filteredStandings = useMemo(() => {
    if (ageFilter === "all") return standings;
    return standings.filter((row) => row.ageGroup === ageFilter);
  }, [ageFilter, standings]);
  const standingsByTeamId = useMemo(
    () => new Map(standings.map((row) => [row.teamId, row])),
    [standings],
  );

  const bestLaners = useMemo(() => {
    if (!matches?.length || !matchResults?.length) return [] as BestLanerRow[];

    const eligibleMatchIds = new Set(
      matches
        .filter(
          (m) => Boolean(m.teamA) && Boolean(m.teamB),
        )
        .map((m) => m.id),
    );

    type Candidate = {
      lane: LaneKey;
      playerId: string;
      playerLabel: string;
      teamId: string;
      teamName: string;
      teamWins: number;
      teamLosses: number;
      teamWinRate: number;
      playerMatchResults: number;
      perfTotal: number;
      perfCount: number;
      kdaTotal: number;
      kdaCount: number;
      goldTotal: number;
      goldCount: number;
    };
    const grouped = new Map<LaneKey, Map<string, Candidate>>();
    const participantsById = new Map((participants ?? []).map((p) => [p.id, p]));

    for (const result of matchResults) {
      const lane = result.lane;
      if (!lane || !result.player || !result.match) continue;
      if (!eligibleMatchIds.has(result.match)) continue;

      const participant = participantsById.get(result.player);
      const teamId = participant?.team?.trim();
      if (!teamId) continue;

      const teamStats = standingsByTeamId.get(teamId);
      if (!teamStats) continue;
      if (ageFilter !== "all" && teamStats.ageGroup !== ageFilter) continue;

      const gameId = participant?.gameID?.trim();
      const name = participant?.name?.trim();
      const playerLabel =
        gameId && name ? `${gameId} - ${name}` : gameId || name || result.player;

      let laneMap = grouped.get(lane);
      if (!laneMap) {
        laneMap = new Map<string, Candidate>();
        grouped.set(lane, laneMap);
      }
      const current = laneMap.get(result.player) ?? {
        lane,
        playerId: result.player,
        playerLabel,
        teamId,
        teamName: teamStats.teamName,
        teamWins: teamStats.matchWins,
        teamLosses: teamStats.matchLosses,
        teamWinRate: teamStats.winRate,
        playerMatchResults: 0,
        perfTotal: 0,
        perfCount: 0,
        kdaTotal: 0,
        kdaCount: 0,
        goldTotal: 0,
        goldCount: 0,
      };

      current.playerMatchResults += 1;
      if (result.game_performance_rating != null) {
        current.perfTotal += result.game_performance_rating;
        current.perfCount += 1;
      }
      if (
        result.kills != null ||
        result.assists != null ||
        result.deaths != null
      ) {
        const kills = result.kills ?? 0;
        const assists = result.assists ?? 0;
        const deaths = Math.max(1, result.deaths ?? 0);
        current.kdaTotal += (kills + assists) / deaths;
        current.kdaCount += 1;
      }
      if (result.accumulated_gold != null) {
        current.goldTotal += result.accumulated_gold;
        current.goldCount += 1;
      }
      laneMap.set(result.player, current);
    }

    const rows: BestLanerRow[] = [];
    for (const lane of LANE_ORDER) {
      const candidates = [...(grouped.get(lane)?.values() ?? [])];
      if (candidates.length < 1) continue;
      const maxSamples = candidates.reduce(
        (max, current) => Math.max(max, current.playerMatchResults),
        1,
      );
      const laneRows = candidates.map((candidate) => {
        const avgPerformanceRating =
          candidate.perfCount > 0 ? candidate.perfTotal / candidate.perfCount : 0;
        const avgKda = candidate.kdaCount > 0 ? candidate.kdaTotal / candidate.kdaCount : 0;
        const avgGold =
          candidate.goldCount > 0 ? candidate.goldTotal / candidate.goldCount : 0;
        const score =
          avgPerformanceRating * BEST_LANER_SCORE_WEIGHTS.performanceRating +
          avgKda * BEST_LANER_SCORE_WEIGHTS.kda +
          (candidate.teamWinRate / 100) * BEST_LANER_SCORE_WEIGHTS.teamWinRate +
          (candidate.playerMatchResults / maxSamples) *
            BEST_LANER_SCORE_WEIGHTS.sampleSize;
        return {
          lane: candidate.lane,
          laneLabel: LANE_LABELS[candidate.lane],
          playerId: candidate.playerId,
          playerLabel: candidate.playerLabel,
          teamName: candidate.teamName,
          teamWins: candidate.teamWins,
          teamLosses: candidate.teamLosses,
          teamWinRate: candidate.teamWinRate,
          playerMatchResults: candidate.playerMatchResults,
          avgPerformanceRating,
          avgKda,
          avgGold,
          score,
        } satisfies BestLanerRow;
      });
      laneRows.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.avgPerformanceRating !== a.avgPerformanceRating) {
          return b.avgPerformanceRating - a.avgPerformanceRating;
        }
        if (b.avgKda !== a.avgKda) return b.avgKda - a.avgKda;
        if (b.teamWinRate !== a.teamWinRate) return b.teamWinRate - a.teamWinRate;
        if (b.teamWins !== a.teamWins) return b.teamWins - a.teamWins;
        if (a.teamLosses !== b.teamLosses) return a.teamLosses - b.teamLosses;
        if (b.playerMatchResults !== a.playerMatchResults) {
          return b.playerMatchResults - a.playerMatchResults;
        }
        return a.playerLabel.localeCompare(b.playerLabel);
      });
      rows.push(...laneRows);
    }
    return rows;
  }, [ageFilter, matchResults, matches, participants, standingsByTeamId]);
  const filteredBestLaners = useMemo(
    () =>
      bestLaneFilter === "all"
        ? bestLaners
        : bestLaners.filter((row) => row.lane === bestLaneFilter),
    [bestLaneFilter, bestLaners],
  );

  const tournamentIds = useMemo(
    () => sortedTournaments.map((t) => t.id),
    [sortedTournaments],
  );

  const headerWithTooltip = (label: string, description: string) => (
    <Tooltip>
      <TooltipTrigger
        className="cursor-help underline decoration-dotted underline-offset-3"
        render={<span />}
      >
        {label}
      </TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-balance">
          Team Standing
        </h1>
        <p className="text-muted-foreground">
          Read-only standings based on completed match results.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Tournament</CardTitle>
            <CardDescription>
              Pick a tournament to view standings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tournamentsLoading ? (
              <Skeleton className="h-10 w-full max-w-md" />
            ) : sortedTournaments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Add a tournament first.
              </p>
            ) : (
              <Combobox
                items={tournamentIds}
                value={tournamentId || null}
                onValueChange={(id) => {
                  if (id != null && id !== "") setTournamentId(id);
                }}
                itemToStringLabel={(id: string) => {
                  const t = sortedTournaments.find((x) => x.id === id);
                  return t ? tournamentLabel(t) : "";
                }}
                filter={(itemId, query) => {
                  const q = query.trim().toLowerCase();
                  if (!q) return true;
                  const t = sortedTournaments.find((x) => x.id === itemId);
                  if (!t) return false;
                  const label = tournamentLabel(t).toLowerCase();
                  const slug = t.slug?.trim().toLowerCase() ?? "";
                  const rawTitle = t.title?.trim().toLowerCase() ?? "";
                  return (
                    label.includes(q) ||
                    slug.includes(q) ||
                    rawTitle.includes(q)
                  );
                }}
              >
                <ComboboxInput
                  className="w-full max-w-md"
                  placeholder="Search tournaments..."
                  aria-label="Tournament"
                />
                <ComboboxContent align="start" side="bottom">
                  <ComboboxList>
                    {(id: string) => {
                      const t = sortedTournaments.find((x) => x.id === id);
                      if (!t) return null;
                      return (
                        <ComboboxItem key={id} value={id}>
                          <span className="flex w-full min-w-0 flex-col gap-0.5 text-left sm:flex-row sm:items-baseline sm:gap-2">
                            <span className="truncate font-medium">
                              {tournamentLabel(t)}
                            </span>
                            {t.status ? (
                              <span className="shrink-0 text-xs text-muted-foreground capitalize">
                                {t.status}
                              </span>
                            ) : null}
                          </span>
                        </ComboboxItem>
                      );
                    }}
                  </ComboboxList>
                  <ComboboxEmpty>No tournaments match your search.</ComboboxEmpty>
                </ComboboxContent>
              </Combobox>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Best Laners</CardTitle>
            <CardDescription>
              See lane leaders for this tournament in a sheet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => setBestLanersOpen(true)}
              disabled={!tournamentId || !tournamentEligible}
            >
              Open best laners
            </Button>
          </CardContent>
        </Card>
      </div>

      {!tournamentId || !tournamentEligible ? null : teamsLoading || matchesLoading || matchResultsLoading ? (
        <Card>
          <CardContent className="py-6">
            <Skeleton className="h-52 w-full" />
          </CardContent>
        </Card>
      ) : filteredStandings.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <ListOrdered className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No standings yet</EmptyTitle>
            <EmptyDescription>
              {ageFilter === "all"
                ? "Complete matches with winners to populate team standings."
                : "No teams found for this age group."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Standings</CardTitle>
              <CardDescription>
                Ranking is based on match wins, game difference, then game wins.
              </CardDescription>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge
                  variant={ageFilter === "all" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setAgeFilter("all")}
                >
                  All
                </Badge>
                <Badge
                  variant={ageFilter === "under18" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setAgeFilter("under18")}
                >
                  Under 18
                </Badge>
                <Badge
                  variant={ageFilter === "18+" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setAgeFilter("18+")}
                >
                  18 and above
                </Badge>
                <Badge
                  variant={ageFilter === "mixed" ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => setAgeFilter("mixed")}
                >
                  Mixed / no majority
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Rank</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Age group</TableHead>
                    <TableHead className="text-right">
                      {headerWithTooltip("P", "Matches played")}
                    </TableHead>
                    <TableHead className="text-right">
                      {headerWithTooltip("W", "Match wins")}
                    </TableHead>
                    <TableHead className="text-right">
                      {headerWithTooltip("L", "Match losses")}
                    </TableHead>
                    <TableHead className="text-right">
                      {headerWithTooltip("GW", "Game wins")}
                    </TableHead>
                    <TableHead className="text-right">
                      {headerWithTooltip("GL", "Game losses")}
                    </TableHead>
                    <TableHead className="text-right">
                      {headerWithTooltip("GD", "Game difference (GW - GL)")}
                    </TableHead>
                    <TableHead className="text-right">
                      {headerWithTooltip("Win %", "Match win rate percentage")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStandings.map((row, index) => (
                    <TableRow key={row.teamId}>
                      <TableCell>
                        {row.played === 0 &&
                        row.matchWins === 0 &&
                        row.matchLosses === 0 &&
                        row.gameWins === 0 &&
                        row.gameLosses === 0 &&
                        row.gameDiff === 0 ? null : (
                          <Badge variant={index < 3 ? "default" : "outline"}>
                            #{index + 1}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{row.teamName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {row.ageGroup === "under18"
                            ? "Under 18"
                            : row.ageGroup === "18+"
                              ? "18 and above"
                              : "Mixed / no majority"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{row.played}</TableCell>
                      <TableCell className="text-right">{row.matchWins}</TableCell>
                      <TableCell className="text-right">{row.matchLosses}</TableCell>
                      <TableCell className="text-right">{row.gameWins}</TableCell>
                      <TableCell className="text-right">{row.gameLosses}</TableCell>
                      <TableCell className="text-right">{row.gameDiff}</TableCell>
                      <TableCell className="text-right">
                        {row.winRate.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>
      )}

      <Sheet open={bestLanersOpen} onOpenChange={setBestLanersOpen}>
        <SheetContent className="data-[side=right]:w-[96vw] data-[side=right]:max-w-[96vw] data-[side=right]:sm:w-[900px] data-[side=right]:sm:max-w-[900px] overflow-auto">
          <SheetHeader className="pb-2">
            <SheetTitle>Best Laners</SheetTitle>
            <SheetDescription>
              Ranked lane players based on match results, team W/L, and team win
              rate.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-3">
            <RadioGroup
              value={bestLaneFilter}
              onValueChange={(v) => setBestLaneFilter((v ?? "all") as "all" | LaneKey)}
              className="flex flex-wrap gap-2"
            >
              <label
                htmlFor="best-lane-all"
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors",
                  bestLaneFilter === "all"
                    ? "border-primary bg-primary/10"
                    : "border-input bg-transparent hover:bg-muted/40",
                )}
              >
                <RadioGroupItem id="best-lane-all" value="all" />
                <span className="text-sm font-medium">All</span>
              </label>
              {LANE_ORDER.map((lane) => (
                <label
                  key={lane}
                  htmlFor={`best-lane-${lane}`}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 transition-colors",
                    bestLaneFilter === lane
                      ? "border-primary bg-primary/10"
                      : "border-input bg-transparent hover:bg-muted/40",
                  )}
                >
                  <RadioGroupItem id={`best-lane-${lane}`} value={lane} />
                  <img
                    src={LANE_ICON_SRC[lane]}
                    alt={LANE_ROLE_LABELS[lane]}
                    className="size-4"
                  />
                  <span className="text-sm font-medium">{LANE_LABELS[lane]}</span>
                </label>
              ))}
            </RadioGroup>
          </div>
          {filteredBestLaners.length < 1 ? (
            <p className="px-4 pb-4 text-sm text-muted-foreground">
              No lane results yet for this lane and filter.
            </p>
          ) : (
            <div className="px-4 pb-4">
              <div className="mb-3 rounded-md border border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
                Rank score per lane = (avg performance rating x{" "}
                {BEST_LANER_SCORE_WEIGHTS.performanceRating}) + (avg KDA x{" "}
                {BEST_LANER_SCORE_WEIGHTS.kda}) + (normalized team win rate x{" "}
                {BEST_LANER_SCORE_WEIGHTS.teamWinRate}) + (normalized lane sample size x{" "}
                {BEST_LANER_SCORE_WEIGHTS.sampleSize}). Higher score ranks first.
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lane</TableHead>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="text-right">Avg perf</TableHead>
                    <TableHead className="text-right">Avg KDA</TableHead>
                    <TableHead className="text-right">Avg gold</TableHead>
                    <TableHead className="text-right">Team W</TableHead>
                    <TableHead className="text-right">Team L</TableHead>
                    <TableHead className="text-right">Team Win %</TableHead>
                    <TableHead className="text-right">Lane matches</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBestLaners.map((row) => (
                    <TableRow key={`${row.lane}-${row.playerId}`}>
                      <TableCell>
                        <Badge variant="outline">{row.laneLabel}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{row.playerLabel}</TableCell>
                      <TableCell>{row.teamName}</TableCell>
                      <TableCell className="text-right">
                        {row.avgPerformanceRating.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">{row.avgKda.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        {Math.round(row.avgGold).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">{row.teamWins}</TableCell>
                      <TableCell className="text-right">{row.teamLosses}</TableCell>
                      <TableCell className="text-right">
                        {row.teamWinRate.toFixed(1)}%
                      </TableCell>
                      <TableCell className="text-right">
                        {row.playerMatchResults}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {row.score.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
