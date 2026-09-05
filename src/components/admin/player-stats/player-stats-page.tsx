import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStagger } from "@/components/admin/admin-stagger";
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
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
import type { MatchResultRecord } from "@/hooks/legacy/use-match-results";
import type { MatchRecord } from "@/hooks/legacy/use-matches";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";
import {
  computePlayerStats,
  PLAYER_STAT_LANE_LABELS,
  PLAYER_STAT_LANES,
  type PlayerStatLane,
  type PlayerStatRow,
} from "@/lib/admin/player-stats";
import { LANE_ICON_SRC, LANE_ROLE_LABELS } from "@/lib/legacy/lane-role-icons";
import { Medal, Users } from "lucide-react";
import { useMemo } from "react";

export type PlayerStatsPageProps = {
  tournamentTitle?: string;
  teams: TeamsRecord[];
  matches: MatchRecord[];
  matchResults: MatchResultRecord[];
  participants: ParticipantsRecord[];
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

function laneImg(lane: PlayerStatLane) {
  return (
    <img
      src={LANE_ICON_SRC[lane]}
      alt={LANE_ROLE_LABELS[lane]}
      className="size-4 shrink-0"
    />
  );
}

function kdaCell(row: PlayerStatRow) {
  return `${row.kills}/${row.deaths}/${row.assists}`;
}

export function PlayerStatsPage({
  tournamentTitle,
  teams,
  matches,
  matchResults,
  participants,
  isLoading,
  isError,
  errorMessage,
  onRetry,
}: PlayerStatsPageProps) {
  const stats = useMemo(
    () =>
      computePlayerStats({
        teams,
        matches,
        matchResults,
        participants,
      }),
    [teams, matches, matchResults, participants],
  );

  const description = tournamentTitle
    ? `Per-player averages and lane leaders for ${tournamentTitle}.`
    : "Per-player averages and lane leaders from recorded match stats.";

  return (
    <TooltipProvider>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <AdminStagger index={0}>
          <AdminPageHeader
            eyebrow="Tournament workspace"
            title="Player stats"
            description={description}
          />
        </AdminStagger>

        {isLoading ? (
          <>
            <AdminStagger index={1}>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {PLAYER_STAT_LANES.map((lane) => (
                  <div
                    key={lane}
                    className="h-28 rounded-lg border border-border bg-muted/20"
                  />
                ))}
              </div>
            </AdminStagger>
            <AdminStagger index={2}>
              <AdminTableSkeleton
                rows={6}
                columns={[
                  {
                    key: "player",
                    label: "Player",
                    boneClassName: ["h-4 w-40", "h-4 w-32", "h-4 w-44"],
                  },
                  {
                    key: "team",
                    label: "Team",
                    boneClassName: "h-4 w-24",
                  },
                  {
                    key: "lane",
                    label: "Lane",
                    boneClassName: "h-4 w-16",
                  },
                  {
                    key: "g",
                    label: "G",
                    headClassName: "text-right",
                    cellClassName: "text-right",
                    boneClassName: "ml-auto h-4 w-6",
                  },
                  {
                    key: "kda",
                    label: "KDA",
                    headClassName: "text-right",
                    cellClassName: "text-right",
                    boneClassName: "ml-auto h-4 w-16",
                  },
                ]}
              />
            </AdminStagger>
          </>
        ) : isError ? (
          <Empty className="border border-border">
            <EmptyHeader>
              <EmptyTitle>Could not load player stats</EmptyTitle>
              <EmptyDescription>
                {errorMessage || "Unknown error"}
              </EmptyDescription>
            </EmptyHeader>
            <Button type="button" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </Empty>
        ) : stats.players.length === 0 ? (
          <Empty className="border border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Users />
              </EmptyMedia>
              <EmptyTitle>No player stats yet</EmptyTitle>
              <EmptyDescription>
                Record match stats (lane, KDA, gold, performance) to fill this
                page.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <AdminStagger index={1} className="flex flex-col gap-3">
              <div>
                <h2 className="font-heading text-lg font-medium">
                  Best player in each lane
                </h2>
                <p className="text-muted-foreground text-sm">
                  Ranked by average performance, KDA, team win rate, and games
                  in that lane.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {PLAYER_STAT_LANES.map((lane) => {
                  const leader = stats.bestByLane[lane];
                  return (
                    <div
                      key={lane}
                      className="flex flex-col gap-3 rounded-lg border border-border p-4"
                    >
                      <div className="flex items-center gap-2">
                        {laneImg(lane)}
                        <p className="font-medium text-sm">
                          {PLAYER_STAT_LANE_LABELS[lane]}
                        </p>
                      </div>
                      {leader ? (
                        <>
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {leader.playerLabel}
                            </p>
                            <p className="truncate text-muted-foreground text-sm">
                              {leader.teamName}
                            </p>
                          </div>
                          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                            <dt className="text-muted-foreground">Avg perf</dt>
                            <dd className="text-right tabular-nums">
                              {leader.avgPerformanceRating.toFixed(2)}
                            </dd>
                            <dt className="text-muted-foreground">Avg KDA</dt>
                            <dd className="text-right tabular-nums">
                              {leader.avgKda.toFixed(2)}
                            </dd>
                            <dt className="text-muted-foreground">Games</dt>
                            <dd className="text-right tabular-nums">
                              {leader.playerMatchResults}
                            </dd>
                          </dl>
                        </>
                      ) : (
                        <p className="text-muted-foreground text-sm">
                          No results in this lane yet.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </AdminStagger>

            <AdminStagger index={2} className="flex flex-col gap-3">
              <div>
                <h2 className="font-heading text-lg font-medium">
                  Individual stats
                </h2>
                <p className="text-muted-foreground text-sm">
                  Averages across every recorded game for the player.
                </p>
              </div>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-14">Rank</TableHead>
                      <TableHead>Player</TableHead>
                      <TableHead>Team</TableHead>
                      <TableHead>Lane</TableHead>
                      <TableHead className="text-right">
                        {headerWithTooltip("G", "Recorded games")}
                      </TableHead>
                      <TableHead className="text-right">
                        {headerWithTooltip("K/D/A", "Total kills / deaths / assists")}
                      </TableHead>
                      <TableHead className="text-right">
                        {headerWithTooltip("Avg KDA", "Average KDA ratio per game")}
                      </TableHead>
                      <TableHead className="text-right">
                        {headerWithTooltip("Avg gold", "Average accumulated gold")}
                      </TableHead>
                      <TableHead className="text-right">
                        {headerWithTooltip(
                          "Avg perf",
                          "Average game performance rating",
                        )}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.players.map((row, index) => (
                      <TableRow key={row.playerId}>
                        <TableCell>
                          <Badge variant={index < 3 ? "default" : "outline"}>
                            {index === 0 ? (
                              <Medal className="size-3" />
                            ) : null}
                            #{index + 1}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {row.playerLabel}
                        </TableCell>
                        <TableCell>{row.teamName}</TableCell>
                        <TableCell>
                          {row.primaryLane ? (
                            <span className="inline-flex items-center gap-1.5">
                              {laneImg(row.primaryLane)}
                              {PLAYER_STAT_LANE_LABELS[row.primaryLane]}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.games}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {kdaCell(row)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.avgKda.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {Math.round(row.avgGold).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.avgPerformanceRating.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AdminStagger>
          </>
        )}
      </div>
    </TooltipProvider>
  );
}
