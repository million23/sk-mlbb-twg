import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MatchResultRecord } from "@/hooks/legacy/use-match-results";
import type { MatchRecord } from "@/hooks/legacy/use-matches";
import { LANE_ICON_SRC, LANE_ROLE_LABELS } from "@/lib/legacy/lane-role-icons";
import {
  bestResultIdByLane,
  kdaRatio,
  matchResultTabNumbers,
  storedGameNumber,
  visibleMatchResultRows,
} from "@/lib/legacy/match-result-game";
import { cn } from "@/lib/utils";
import { Crown, Medal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type LaneKey = NonNullable<MatchResultRecord["lane"]>;

const LANE_ORDER: LaneKey[] = ["gold", "exp", "mid", "jungle", "support"];
const LANE_LABEL: Record<LaneKey, string> = {
  gold: "Gold",
  exp: "Exp",
  mid: "Mid",
  jungle: "Jungle",
  support: "Support",
};

function teamName(m: MatchRecord, side: "A" | "B"): string {
  const key = side === "A" ? "teamA" : "teamB";
  const rawId = side === "A" ? m.teamA : m.teamB;
  return m.expand?.[key]?.name ?? rawId ?? "TBD";
}

function winnerName(m: MatchRecord): string {
  if (!m.winner) return "";
  return m.expand?.winner?.name ?? m.winner;
}

function kda(r: MatchResultRecord): string {
  if (r.kills == null && r.deaths == null && r.assists == null) return "—";
  return kdaRatio(r).toFixed(2);
}

function playerLabel(r: MatchResultRecord): string {
  const p = r.expand?.player as
    | (NonNullable<MatchResultRecord["expand"]>["player"] & { ign?: string })
    | undefined;
  if (!p) return "Unknown";
  const ign = p.ign?.trim() || p.gameID?.trim();
  const name = p.name?.trim();
  if (ign && name && ign !== name) return `${ign} · ${name}`;
  return ign || name || "Unknown";
}

function sortByLane(rows: MatchResultRecord[]): MatchResultRecord[] {
  return [...rows].sort((x, y) => {
    const li = LANE_ORDER.indexOf(x.lane as LaneKey);
    const lj = LANE_ORDER.indexOf(y.lane as LaneKey);
    return (li === -1 ? 99 : li) - (lj === -1 ? 99 : lj);
  });
}

function splitByTeam(
  results: MatchResultRecord[],
  match: MatchRecord,
): { a: MatchResultRecord[]; b: MatchResultRecord[] } {
  const aIds = new Set(
    results
      .filter((r) => r.expand?.player?.team === match.teamA)
      .map((r) => r.id),
  );
  return {
    a: sortByLane(results.filter((r) => aIds.has(r.id))),
    b: sortByLane(results.filter((r) => !aIds.has(r.id))),
  };
}

function TeamResultTable({
  name,
  rows,
  isWinner,
  bestByLane,
}: {
  name: string;
  rows: MatchResultRecord[];
  isWinner: boolean;
  bestByLane: Map<string, string>;
}) {
  if (!rows.length) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "font-serif text-base font-medium",
            isWinner && "text-primary",
          )}
        >
          {name}
        </span>
        {isWinner ? (
          <Crown className="size-3.5 text-primary" aria-hidden />
        ) : null}
        <span className="h-px flex-1 bg-linear-to-r from-border to-transparent" />
      </div>
      <div className="overflow-x-auto rounded-xl border border-border/60 bg-card/40">
        <Table>
          <TableHeader>
            <TableRow className="border-border/40">
              <TableHead className="pl-4">Player</TableHead>
              <TableHead>Lane</TableHead>
              <TableHead className="text-right">K</TableHead>
              <TableHead className="text-right">D</TableHead>
              <TableHead className="text-right">A</TableHead>
              <TableHead className="text-right">KDA</TableHead>
              <TableHead className="text-right">Perf</TableHead>
              <TableHead className="pr-4 text-right">Gold</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const isBestLane =
                Boolean(r.lane) &&
                Boolean(r.id) &&
                bestByLane.get(r.lane as string) === r.id;
              return (
                <TableRow
                  key={r.id}
                  className={cn(
                    "border-border/30",
                    isBestLane && "bg-primary/10",
                  )}
                >
                  <TableCell className="pl-4 font-medium text-sm">
                    <span className="inline-flex flex-wrap items-center gap-1.5">
                      {playerLabel(r)}
                      {isBestLane ? (
                        <Badge variant="default" className="h-5 gap-1">
                          <Medal className="size-3" />
                          Best {LANE_LABEL[r.lane as LaneKey] ?? r.lane}
                        </Badge>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell>
                    {r.lane ? (
                      <div className="flex items-center gap-1.5">
                        <img
                          src={LANE_ICON_SRC[r.lane as LaneKey]}
                          alt={LANE_ROLE_LABELS[r.lane as LaneKey]}
                          className="size-4 shrink-0"
                        />
                        <span className="font-mono text-muted-foreground text-xs">
                          {LANE_LABEL[r.lane as LaneKey]}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.kills ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.deaths ?? "—"}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.assists ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {kda(r)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.game_performance_rating != null
                      ? r.game_performance_rating.toFixed(1)
                      : "—"}
                  </TableCell>
                  <TableCell className="pr-4 text-right text-muted-foreground text-xs tabular-nums">
                    {r.accumulated_gold != null
                      ? Math.round(r.accumulated_gold).toLocaleString()
                      : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function GameTeamTables({
  match,
  results,
}: {
  match: MatchRecord;
  results: MatchResultRecord[];
}) {
  const tA = teamName(match, "A");
  const tB = teamName(match, "B");
  const win = winnerName(match);
  const byTeam = splitByTeam(results, match);
  const bestByLane = useMemo(() => bestResultIdByLane(results), [results]);
  return (
    <div className="flex flex-col gap-6">
      <TeamResultTable
        name={tA}
        rows={byTeam.a}
        isWinner={Boolean(win && win === tA)}
        bestByLane={bestByLane}
      />
      <TeamResultTable
        name={tB}
        rows={byTeam.b}
        isWinner={Boolean(win && win === tB)}
        bestByLane={bestByLane}
      />
    </div>
  );
}

export function MatchPlayerResultsBody({
  match,
  results,
  isLoading,
}: {
  match: MatchRecord;
  results: MatchResultRecord[] | undefined;
  isLoading: boolean;
}) {
  const cleanResults = useMemo(
    () => visibleMatchResultRows(results ?? [], match.bestOf),
    [results, match.bestOf],
  );
  const tabNumbers = useMemo(
    () => matchResultTabNumbers(cleanResults, match.bestOf),
    [cleanResults, match.bestOf],
  );
  const games = useMemo(() => {
    const grouped = new Map<number, MatchResultRecord[]>();
    for (const n of tabNumbers) grouped.set(n, []);
    for (const row of cleanResults) {
      const game = storedGameNumber(row);
      if (game == null) continue;
      const list = grouped.get(game) ?? [];
      list.push(row);
      grouped.set(game, list);
    }
    return tabNumbers.map((gameNumber) => ({
      gameNumber,
      rows: grouped.get(gameNumber) ?? [],
    }));
  }, [cleanResults, tabNumbers]);

  const [activeGame, setActiveGame] = useState(() =>
    String(tabNumbers[0] ?? 1),
  );

  useEffect(() => {
    if (!tabNumbers.includes(Number.parseInt(activeGame, 10))) {
      setActiveGame(String(tabNumbers[0] ?? 1));
    }
  }, [tabNumbers, activeGame]);

  const selected =
    games.find((g) => String(g.gameNumber) === activeGame) ?? games[0];

  if (isLoading) {
    return (
      <div className="flex flex-col gap-8" aria-busy="true">
        <span className="sr-only">Loading results</span>
        {["a", "b"].map((side) => (
          <div key={side} className="flex flex-col gap-2">
            <Skeleton className="h-5 w-32 rounded-md" />
            <div className="overflow-hidden rounded-xl border border-border/60 bg-card/40 p-3">
              <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-full rounded-md" />
                <Skeleton className="h-8 w-[92%] rounded-md" />
                <Skeleton className="h-8 w-[88%] rounded-md" />
                <Skeleton className="h-8 w-[94%] rounded-md" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (cleanResults.length < 1) {
    return (
      <div className="flex min-h-[16vh] flex-col items-center justify-center gap-2 text-center">
        <p className="text-muted-foreground text-sm">
          No usable player results for this match yet.
        </p>
      </div>
    );
  }

  if (tabNumbers.length <= 1 && selected) {
    return <GameTeamTables match={match} results={selected.rows} />;
  }

  return (
    <Tabs
      value={selected ? String(selected.gameNumber) : activeGame}
      onValueChange={(v) => setActiveGame(String(v ?? "1"))}
      className="gap-4"
    >
      <TabsList
        variant="line"
        className="mb-1 h-auto min-h-9 w-full max-w-full flex-wrap justify-start gap-1"
      >
        {games.map((game) => (
          <TabsTrigger key={game.gameNumber} value={String(game.gameNumber)}>
            Game {game.gameNumber}
          </TabsTrigger>
        ))}
      </TabsList>
      {games.map((game) => (
        <TabsContent key={game.gameNumber} value={String(game.gameNumber)}>
          {game.rows.length < 1 ? (
            <p className="text-muted-foreground text-sm">
              No player results recorded for this game yet.
            </p>
          ) : (
            <GameTeamTables match={match} results={game.rows} />
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
