import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStagger } from "@/components/admin/admin-stagger";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MatchRecord } from "@/hooks/legacy/use-matches";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";
import {
  computeTeamStandings,
  filterStandingsByAge,
  hasRankedStandings,
  standingAgeGroupLabel,
  type StandingAgeFilter,
  type StandingRow,
} from "@/lib/admin/team-standings";
import { ListOrdered } from "lucide-react";
import { useMemo, useState } from "react";

type AgeCounts = Record<StandingAgeFilter, number>;

const AGE_FILTER_OPTIONS: {
  value: StandingAgeFilter;
  label: (counts: AgeCounts) => string;
}[] = [
  { value: "all", label: (c) => `All (${c.all})` },
  { value: "under18", label: (c) => `Under 18 (${c.under18})` },
  { value: "18+", label: (c) => `18 and above (${c["18+"]})` },
  { value: "mixed", label: (c) => `Mixed (${c.mixed})` },
];

export type TeamStandingPageProps = {
  tournamentTitle?: string;
  teams: TeamsRecord[];
  participants: ParticipantsRecord[];
  matches: MatchRecord[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
};

function headerWithTooltip(label: string, description: string) {
  return (
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
}

function hasStandingStats(row: StandingRow): boolean {
  return !(
    row.played === 0 &&
    row.matchWins === 0 &&
    row.matchLosses === 0 &&
    row.gameWins === 0 &&
    row.gameLosses === 0 &&
    row.gameDiff === 0
  );
}

export function TeamStandingPage({
  tournamentTitle,
  teams,
  participants,
  matches,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: TeamStandingPageProps) {
  const [ageFilter, setAgeFilter] = useState<StandingAgeFilter>("all");

  const standings = useMemo(
    () =>
      computeTeamStandings({
        teams,
        participants,
        matches,
      }),
    [teams, participants, matches],
  );

  const filteredStandings = useMemo(
    () => filterStandingsByAge(standings, ageFilter),
    [ageFilter, standings],
  );

  const ageCounts = useMemo(() => {
    const counts = { all: standings.length, under18: 0, "18+": 0, mixed: 0 };
    for (const row of standings) {
      counts[row.ageGroup] += 1;
    }
    return counts;
  }, [standings]);

  const hasTeams = teams.length > 0;
  const hasRankedData = hasRankedStandings(standings);
  const showEmpty =
    !isLoading &&
    !isError &&
    (!hasTeams || !hasRankedData || filteredStandings.length === 0);

  const description = tournamentTitle
    ? `Read-only standings for ${tournamentTitle} based on completed match results.`
    : "Read-only standings based on completed match results.";

  return (
    <TooltipProvider>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <AdminStagger index={0}>
          <AdminPageHeader
            eyebrow="Tournament workspace"
            title="Team Standing"
            description={description}
          />
        </AdminStagger>

        <AdminStagger index={1}>
          <Tabs
            value={ageFilter}
            onValueChange={(v) => setAgeFilter((v as StandingAgeFilter) ?? "all")}
          >
            <Select
              value={ageFilter}
              onValueChange={(v) =>
                setAgeFilter((v as StandingAgeFilter) ?? "all")
              }
            >
              <SelectTrigger className="w-full md:hidden">
                <SelectValue>
                  {(value) => {
                    const opt = AGE_FILTER_OPTIONS.find((o) => o.value === value);
                    return opt ? opt.label(ageCounts) : "Filter by age";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {AGE_FILTER_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label(ageCounts)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <TabsList className="hidden w-fit md:inline-flex">
              {AGE_FILTER_OPTIONS.map((opt) => (
                <TabsTrigger key={opt.value} value={opt.value}>
                  {opt.label(ageCounts)}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={ageFilter} className="mt-4">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : isError ? (
                <Empty className="border border-border">
                  <EmptyHeader>
                    <EmptyTitle>Could not load standings</EmptyTitle>
                    <EmptyDescription>
                      {errorMessage || "Unknown error"}
                    </EmptyDescription>
                  </EmptyHeader>
                  <Button type="button" variant="outline" onClick={onRetry}>
                    Retry
                  </Button>
                </Empty>
              ) : showEmpty ? (
                <Empty className="border border-border">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <ListOrdered />
                    </EmptyMedia>
                    <EmptyTitle>
                      {!hasTeams
                        ? "No teams yet"
                        : !hasRankedData
                          ? "No standings yet"
                          : "No teams in this age group"}
                    </EmptyTitle>
                    <EmptyDescription>
                      {!hasTeams
                        ? "Add teams before standings can be calculated."
                        : !hasRankedData
                          ? "Complete matches with winners to populate team standings."
                          : "Try another age filter or check team rosters."}
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-14">Rank</TableHead>
                        <TableHead>Team</TableHead>
                        <TableHead>Age</TableHead>
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
                            {hasStandingStats(row) ? (
                              <Badge variant={index < 3 ? "default" : "outline"}>
                                #{index + 1}
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell className="font-medium">
                            {row.teamName}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {standingAgeGroupLabel(row.ageGroup)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.played}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.matchWins}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.matchLosses}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.gameWins}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.gameLosses}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.gameDiff}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">
                            {row.winRate.toFixed(1)}%
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </AdminStagger>
      </div>
    </TooltipProvider>
  );
}
