import { PublicPageHeader } from "@/components/public/public-page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
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
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
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
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ListOrdered } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type StandingSearch = { tournament?: string };

export const Route = createFileRoute("/p/standing")({
  validateSearch: (search: Record<string, unknown>): StandingSearch => ({
    tournament:
      typeof search.tournament === "string" && search.tournament.length > 0
        ? search.tournament
        : undefined,
  }),
  component: PublicStandingPage,
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

const AGE_FILTERS: { value: StandingAgeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "under18", label: "Under 18" },
  { value: "18+", label: "18 and above" },
  { value: "mixed", label: "Mixed" },
];

function PublicStandingPage() {
  const navigate = useNavigate();
  const { tournament: tidSearch } = Route.useSearch();
  const { data: tournaments, isLoading: tournamentsLoading } = useTournaments();
  const { data: teams } = useTeams();
  const { data: participants } = useParticipants();
  const [ageFilter, setAgeFilter] = useState<StandingAgeFilter>("all");
  const [roundFilter, setRoundFilter] = useState<string>("all");
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

  const tournamentId = useMemo(() => {
    if (!sortedTournaments.length) return "";
    const valid = tidSearch && sortedTournaments.some((t) => t.id === tidSearch);
    if (valid) return tidSearch;
    const live = sortedTournaments.find((t) => t.status === "live");
    const upcoming = sortedTournaments.find((t) => t.status === "upcoming");
    return live?.id ?? upcoming?.id ?? sortedTournaments[0]?.id ?? "";
  }, [sortedTournaments, tidSearch]);

  useEffect(() => {
    if (!sortedTournaments.length || !tournamentId) return;
    const valid = tidSearch && sortedTournaments.some((t) => t.id === tidSearch);
    if (!valid) {
      navigate({
        to: "/p/standing",
        search: { tournament: tournamentId },
        replace: true,
      });
    }
  }, [sortedTournaments, tidSearch, tournamentId, navigate]);

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

  // Reset round filter when the tournament changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional reset on tournamentId change
  useEffect(() => { setRoundFilter("all"); }, [tournamentId]);

  const availableRounds = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    for (const m of matches ?? []) {
      const r = m.round?.trim() || "Bracket";
      if (!seen.has(r)) { seen.add(r); ordered.push(r); }
    }
    return ordered.sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  }, [matches]);

  const matchesForRound = useMemo(
    () =>
      roundFilter === "all"
        ? (matches ?? [])
        : (matches ?? []).filter((m) => (m.round?.trim() || "Bracket") === roundFilter),
    [matches, roundFilter],
  );

  const standings = useMemo(() => {
    const membersByTeam = new Map<
      string,
      { under18: number; adults: number; total: number }
    >();
    for (const p of participants ?? []) {
      const tid = p.team?.trim();
      if (!tid) continue;
      const current = membersByTeam.get(tid) ?? { under18: 0, adults: 0, total: 0 };
      current.total += 1;
      const ag = tournamentAgeGroupFromBirthdate(p.birthdate);
      if (ag === "under18") current.under18 += 1;
      else if (ag === "18+") current.adults += 1;
      membersByTeam.set(tid, current);
    }

    const resolveAgeGroup = (id: string): StandingRow["ageGroup"] => {
      const counts = membersByTeam.get(id);
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
        played: 0, matchWins: 0, matchLosses: 0,
        gameWins: 0, gameLosses: 0, gameDiff: 0, winRate: 0,
      };
      map.set(teamId, created);
      return created;
    };

    for (const m of matchesForRound) {
      if (!m.teamA || !m.teamB) continue;
      const hasResult =
        m.status === "completed" || m.status === "walkover" || Boolean(m.winner);
      if (!hasResult) continue;
      const a = ensureTeam(m.teamA, m.expand?.teamA?.name);
      const b = ensureTeam(m.teamB, m.expand?.teamB?.name);
      const scoreA = Math.max(0, m.scoreA ?? 0);
      const scoreB = Math.max(0, m.scoreB ?? 0);
      a.played += 1; b.played += 1;
      a.gameWins += scoreA; a.gameLosses += scoreB;
      b.gameWins += scoreB; b.gameLosses += scoreA;
      if (m.winner === m.teamA) { a.matchWins += 1; b.matchLosses += 1; }
      else if (m.winner === m.teamB) { b.matchWins += 1; a.matchLosses += 1; }
    }

    const rows = [...map.values()].map((row) => ({
      ...row,
      gameDiff: row.gameWins - row.gameLosses,
      winRate: row.played > 0 ? (row.matchWins / row.played) * 100 : 0,
    }));

    rows.sort((a, b) => {
      if (b.matchWins !== a.matchWins) return b.matchWins - a.matchWins;
      if (b.gameDiff !== a.gameDiff) return b.gameDiff - a.gameDiff;
      if (b.gameWins !== a.gameWins) return b.gameWins - a.gameWins;
      return a.teamName.localeCompare(b.teamName);
    });
    return rows;
  }, [matchesForRound, participants, teams]);

  const filteredStandings = useMemo(() => {
    if (ageFilter === "all") return standings;
    return standings.filter((row) => row.ageGroup === ageFilter);
  }, [ageFilter, standings]);

  const standingsByTeamId = useMemo(
    () => new Map(standings.map((row) => [row.teamId, row])),
    [standings],
  );

  const bestLaners = useMemo(() => {
    if (!matchesForRound.length || !matchResults?.length) return [] as BestLanerRow[];
    const eligibleMatchIds = new Set(
      matchesForRound.filter((m) => Boolean(m.teamA) && Boolean(m.teamB)).map((m) => m.id),
    );
    type Candidate = {
      lane: LaneKey; playerId: string; playerLabel: string;
      teamId: string; teamName: string;
      teamWins: number; teamLosses: number; teamWinRate: number;
      playerMatchResults: number;
      perfTotal: number; perfCount: number;
      kdaTotal: number; kdaCount: number;
      goldTotal: number; goldCount: number;
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
      const playerLabel = gameId && name ? `${gameId} - ${name}` : gameId || name || result.player;
      let laneMap = grouped.get(lane);
      if (!laneMap) { laneMap = new Map(); grouped.set(lane, laneMap); }
      const current = laneMap.get(result.player) ?? {
        lane, playerId: result.player, playerLabel,
        teamId, teamName: teamStats.teamName,
        teamWins: teamStats.matchWins, teamLosses: teamStats.matchLosses,
        teamWinRate: teamStats.winRate, playerMatchResults: 0,
        perfTotal: 0, perfCount: 0, kdaTotal: 0, kdaCount: 0, goldTotal: 0, goldCount: 0,
      };
      current.playerMatchResults += 1;
      if (result.game_performance_rating != null) {
        current.perfTotal += result.game_performance_rating; current.perfCount += 1;
      }
      if (result.kills != null || result.assists != null || result.deaths != null) {
        const kills = result.kills ?? 0;
        const assists = result.assists ?? 0;
        const deaths = Math.max(1, result.deaths ?? 0);
        current.kdaTotal += (kills + assists) / deaths; current.kdaCount += 1;
      }
      if (result.accumulated_gold != null) {
        current.goldTotal += result.accumulated_gold; current.goldCount += 1;
      }
      laneMap.set(result.player, current);
    }

    const rows: BestLanerRow[] = [];
    for (const lane of LANE_ORDER) {
      const candidates = [...(grouped.get(lane)?.values() ?? [])];
      if (!candidates.length) continue;
      const maxSamples = candidates.reduce((max, c) => Math.max(max, c.playerMatchResults), 1);
      const laneRows = candidates.map((c) => {
        const avgPerformanceRating = c.perfCount > 0 ? c.perfTotal / c.perfCount : 0;
        const avgKda = c.kdaCount > 0 ? c.kdaTotal / c.kdaCount : 0;
        const avgGold = c.goldCount > 0 ? c.goldTotal / c.goldCount : 0;
        const score =
          avgPerformanceRating * BEST_LANER_SCORE_WEIGHTS.performanceRating +
          avgKda * BEST_LANER_SCORE_WEIGHTS.kda +
          (c.teamWinRate / 100) * BEST_LANER_SCORE_WEIGHTS.teamWinRate +
          (c.playerMatchResults / maxSamples) * BEST_LANER_SCORE_WEIGHTS.sampleSize;
        return {
          lane: c.lane, laneLabel: LANE_LABELS[c.lane],
          playerId: c.playerId, playerLabel: c.playerLabel,
          teamName: c.teamName, teamWins: c.teamWins, teamLosses: c.teamLosses,
          teamWinRate: c.teamWinRate, playerMatchResults: c.playerMatchResults,
          avgPerformanceRating, avgKda, avgGold, score,
        } satisfies BestLanerRow;
      });
      laneRows.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.avgPerformanceRating !== a.avgPerformanceRating) return b.avgPerformanceRating - a.avgPerformanceRating;
        if (b.avgKda !== a.avgKda) return b.avgKda - a.avgKda;
        if (b.teamWinRate !== a.teamWinRate) return b.teamWinRate - a.teamWinRate;
        if (b.teamWins !== a.teamWins) return b.teamWins - a.teamWins;
        if (a.teamLosses !== b.teamLosses) return a.teamLosses - b.teamLosses;
        if (b.playerMatchResults !== a.playerMatchResults) return b.playerMatchResults - a.playerMatchResults;
        return a.playerLabel.localeCompare(b.playerLabel);
      });
      rows.push(...laneRows);
    }
    return rows;
  }, [ageFilter, matchResults, matchesForRound, participants, standingsByTeamId]);

  const filteredBestLaners = useMemo(
    () => bestLaneFilter === "all" ? bestLaners : bestLaners.filter((r) => r.lane === bestLaneFilter),
    [bestLaneFilter, bestLaners],
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

  if (tournamentsLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-8 text-primary" />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!sortedTournaments.length) {
    return (
      <Empty className="min-h-[40vh] border border-dashed">
        <EmptyHeader>
          <EmptyTitle>No tournaments yet</EmptyTitle>
          <EmptyDescription>
            Standings will appear once a tournament is available.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const isLoading = matchesLoading || matchResultsLoading;

  return (
    <div className="flex flex-col gap-10">
      <PublicPageHeader
        eyebrow="Leaderboard"
        title="Team Standing"
        description="Standings ranked by match wins, game difference, then game wins."
        icon={ListOrdered}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex min-w-[220px] flex-1 flex-col gap-1.5">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
            Tournament
          </span>
          <Select
            value={tournamentId}
            onValueChange={(id) =>
              navigate({ to: "/p/standing", search: { tournament: id }, replace: true })
            }
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-border/80 bg-card/40 shadow-inner">
              <SelectValue placeholder="Select tournament">
                {(value: string | null) => {
                  const t = sortedTournaments.find((x) => x.id === value);
                  return t ? tournamentLabel(t) : "Select tournament";
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {sortedTournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {tournamentLabel(t)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
          <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
            Round
          </span>
          <Select
            value={roundFilter}
            onValueChange={setRoundFilter}
            disabled={!availableRounds.length}
          >
            <SelectTrigger className="h-11 w-full rounded-xl border-border/80 bg-card/40 shadow-inner">
              <SelectValue placeholder="All rounds">
                {(value: string | null) => (value && value !== "all" ? value : "All rounds")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="all">All rounds</SelectItem>
                {availableRounds.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!tournamentEligible ? (
        <p className="text-sm text-muted-foreground">
          This tournament is not available for public standings.
        </p>
      ) : isLoading ? (
        <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3">
          <Spinner className="size-8 text-primary" />
          <p className="text-sm text-muted-foreground">Loading standings…</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* Standings table */}
          <Card className="overflow-hidden border-border/80 bg-card/50">
            <CardHeader className="pb-3">
              <CardTitle className="font-serif text-xl">Standings</CardTitle>
              {/* Age group filter */}
              <fieldset className="flex flex-wrap gap-2 border-0 m-0 p-0 pt-1">
                <legend className="sr-only">Filter by age group</legend>
                {AGE_FILTERS.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setAgeFilter(value)}
                    aria-pressed={ageFilter === value}
                    className={cn(
                      "rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-wider transition-[color,background-color,border-color]",
                      ageFilter === value
                        ? "border-primary/40 bg-primary/15 text-primary"
                        : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </fieldset>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              {filteredStandings.filter(
                (r) =>
                  r.played > 0 || r.matchWins > 0 || r.gameWins > 0,
              ).length === 0 ? (
                <Empty className="border-0 py-10">
                  <EmptyHeader>
                    <EmptyTitle>No standings yet</EmptyTitle>
                    <EmptyDescription>
                      {ageFilter === "all"
                        ? "Complete matches with winners to populate team standings."
                        : "No teams found for this age group."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50">
                      <TableHead className="w-14 pl-6">Rank</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Age group</TableHead>
                      <TableHead className="text-right">{headerWithTooltip("P", "Matches played")}</TableHead>
                      <TableHead className="text-right">{headerWithTooltip("W", "Match wins")}</TableHead>
                      <TableHead className="text-right">{headerWithTooltip("L", "Match losses")}</TableHead>
                      <TableHead className="text-right">{headerWithTooltip("GW", "Game wins")}</TableHead>
                      <TableHead className="text-right">{headerWithTooltip("GL", "Game losses")}</TableHead>
                      <TableHead className="text-right">{headerWithTooltip("GD", "Game difference")}</TableHead>
                      <TableHead className="text-right pr-6">{headerWithTooltip("Win %", "Match win rate")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStandings.map((row, index) => {
                      const hasActivity =
                        row.played > 0 || row.matchWins > 0 || row.gameWins > 0;
                      return (
                        <TableRow key={row.teamId} className="border-border/40">
                          <TableCell className="pl-6">
                            {hasActivity ? (
                              <Badge variant={index < 3 ? "default" : "outline"} className="font-mono text-xs">
                                #{index + 1}
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell className="font-medium">{row.teamName}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-[0.6rem] uppercase tracking-wider">
                              {row.ageGroup === "under18"
                                ? "Under 18"
                                : row.ageGroup === "18+"
                                  ? "18 and above"
                                  : "Mixed"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{row.played}</TableCell>
                          <TableCell className="text-right tabular-nums text-primary">{row.matchWins}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.matchLosses}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.gameWins}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.gameLosses}</TableCell>
                          <TableCell className={cn("text-right tabular-nums", row.gameDiff > 0 ? "text-primary" : row.gameDiff < 0 ? "text-destructive" : "")}>
                            {row.gameDiff > 0 ? `+${row.gameDiff}` : row.gameDiff}
                          </TableCell>
                          <TableCell className="text-right tabular-nums pr-6">
                            {row.winRate.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Best Laners */}
          {bestLaners.length > 0 && (
            <Card className="overflow-hidden border-border/80 bg-card/50">
              <CardHeader className="pb-3">
                <CardTitle className="font-serif text-xl">Best Laners</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Ranked by performance rating, KDA, team win rate, and lane match count.
                </p>
                {/* Lane filter */}
                <fieldset className="flex flex-wrap gap-2 border-0 m-0 p-0 pt-1">
                  <legend className="sr-only">Filter by lane</legend>
                  {(["all", ...LANE_ORDER] as ("all" | LaneKey)[]).map((lane) => (
                    <button
                      key={lane}
                      type="button"
                      onClick={() => setBestLaneFilter(lane)}
                      aria-pressed={bestLaneFilter === lane}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-mono uppercase tracking-wider transition-[color,background-color,border-color]",
                        bestLaneFilter === lane
                          ? "border-primary/40 bg-primary/15 text-primary"
                          : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      {lane !== "all" && (
                        <img
                          src={LANE_ICON_SRC[lane]}
                          alt={LANE_ROLE_LABELS[lane]}
                          className="size-3 shrink-0"
                        />
                      )}
                      {lane === "all" ? "All" : LANE_LABELS[lane]}
                    </button>
                  ))}
                </fieldset>
              </CardHeader>
              <CardContent className="overflow-x-auto p-0">
                {filteredBestLaners.length === 0 ? (
                  <p className="px-6 pb-6 text-sm text-muted-foreground">
                    No lane results yet for this filter.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50">
                        <TableHead className="pl-6">Lane</TableHead>
                        <TableHead>Player</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead className="text-right">{headerWithTooltip("Avg Perf", "Average performance rating")}</TableHead>
                        <TableHead className="text-right">{headerWithTooltip("Avg KDA", "Average KDA ratio")}</TableHead>
                        <TableHead className="text-right">{headerWithTooltip("Avg Gold", "Average accumulated gold")}</TableHead>
                        <TableHead className="text-right">Team W</TableHead>
                        <TableHead className="text-right">Team L</TableHead>
                        <TableHead className="text-right">{headerWithTooltip("Win %", "Team match win rate")}</TableHead>
                        <TableHead className="text-right pr-6">{headerWithTooltip("Matches", "Lane match count")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBestLaners.map((row) => (
                        <TableRow key={`${row.lane}-${row.playerId}`} className="border-border/40">
                          <TableCell className="pl-6">
                            <div className="flex items-center gap-1.5">
                              <img
                                src={LANE_ICON_SRC[row.lane]}
                                alt={LANE_ROLE_LABELS[row.lane]}
                                className="size-4 shrink-0"
                              />
                              <Badge variant="outline" className="font-mono text-[0.6rem] uppercase tracking-wider">
                                {row.laneLabel}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{row.playerLabel}</TableCell>
                          <TableCell className="text-muted-foreground">{row.teamName}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.avgPerformanceRating.toFixed(2)}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.avgKda.toFixed(2)}</TableCell>
                          <TableCell className="text-right tabular-nums">{Math.round(row.avgGold).toLocaleString()}</TableCell>
                          <TableCell className="text-right tabular-nums text-primary">{row.teamWins}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.teamLosses}</TableCell>
                          <TableCell className="text-right tabular-nums">{row.teamWinRate.toFixed(1)}%</TableCell>
                          <TableCell className="text-right tabular-nums pr-6">{row.playerMatchResults}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
