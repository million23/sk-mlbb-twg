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
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
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
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { MatchRecord } from "@/hooks/legacy/use-matches";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";
import {
  computeTeamStandings,
  hasRankedStandings,
  type StandingRow,
} from "@/lib/admin/team-standings";
import { ListOrdered } from "lucide-react";
import { useMemo } from "react";

export type TeamStandingPageProps = {
  tournamentTitle?: string;
  teams: TeamsRecord[];
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
  matches,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: TeamStandingPageProps) {
  const standings = useMemo(
    () =>
      computeTeamStandings({
        teams,
        matches,
      }),
    [teams, matches],
  );

  const hasTeams = teams.length > 0;
  const hasRankedData = hasRankedStandings(standings);
  const showEmpty =
    !isLoading && !isError && (!hasTeams || !hasRankedData);

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
          {isLoading ? (
            <AdminTableSkeleton
              rows={6}
              columns={[
                {
                  key: "rank",
                  label: "Rank",
                  headClassName: "w-14",
                  boneClassName: "h-5 w-8 rounded-full",
                },
                {
                  key: "team",
                  label: "Team",
                  boneClassName: [
                    "h-4 w-36",
                    "h-4 w-28",
                    "h-4 w-44",
                    "h-4 w-32",
                    "h-4 w-40",
                    "h-4 w-24",
                  ],
                },
                {
                  key: "p",
                  label: "P",
                  headClassName: "text-right",
                  cellClassName: "text-right",
                  boneClassName: "ml-auto h-4 w-6",
                },
                {
                  key: "w",
                  label: "W",
                  headClassName: "text-right",
                  cellClassName: "text-right",
                  boneClassName: "ml-auto h-4 w-6",
                },
                {
                  key: "l",
                  label: "L",
                  headClassName: "text-right",
                  cellClassName: "text-right",
                  boneClassName: "ml-auto h-4 w-6",
                },
                {
                  key: "gw",
                  label: "GW",
                  headClassName: "text-right",
                  cellClassName: "text-right",
                  boneClassName: "ml-auto h-4 w-6",
                },
                {
                  key: "gl",
                  label: "GL",
                  headClassName: "text-right",
                  cellClassName: "text-right",
                  boneClassName: "ml-auto h-4 w-6",
                },
                {
                  key: "gd",
                  label: "GD",
                  headClassName: "text-right",
                  cellClassName: "text-right",
                  boneClassName: "ml-auto h-4 w-8",
                },
                {
                  key: "win",
                  label: "Win %",
                  headClassName: "text-right",
                  cellClassName: "text-right",
                  boneClassName: "ml-auto h-4 w-10",
                },
              ]}
            />
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
                  {!hasTeams ? "No teams yet" : "No standings yet"}
                </EmptyTitle>
                <EmptyDescription>
                  {!hasTeams
                    ? "Add teams before standings can be calculated."
                    : "Complete matches with winners to populate team standings."}
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
                  {standings.map((row, index) => (
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
        </AdminStagger>
      </div>
    </TooltipProvider>
  );
}
