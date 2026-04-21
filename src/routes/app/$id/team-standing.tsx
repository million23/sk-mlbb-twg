import { Badge } from "@/components/ui/badge";
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
import { useMatchesForTournament } from "@/hooks/use-matches";
import { useParticipants } from "@/hooks/use-participants";
import { useTeams } from "@/hooks/use-teams";
import { useTournaments } from "@/hooks/use-tournaments";
import { tournamentAgeGroupFromBirthdate } from "@/lib/age";
import { tournamentLabel } from "@/lib/tournament-label";
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

function TeamStandingPage() {
  const { data: tournaments, isLoading: tournamentsLoading } = useTournaments();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: participants } = useParticipants();
  const [tournamentId, setTournamentId] = useState<string>("");
  const [ageFilter, setAgeFilter] = useState<StandingAgeFilter>("all");

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

      {!tournamentId || !tournamentEligible ? null : teamsLoading || matchesLoading ? (
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
      )}
    </div>
  );
}
