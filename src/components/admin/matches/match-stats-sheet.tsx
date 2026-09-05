import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import { useMatchResultMutations } from "@/hooks/legacy/use-match-result-mutations";
import { useMatchResultsForMatch } from "@/hooks/legacy/use-match-results";
import type { MatchRecord } from "@/hooks/legacy/use-matches";
import { shouldReplaceMatchStatsRows } from "@/lib/admin/match-stats-rows";
import {
  findMatchResultIdForGame,
  resultGameNumber,
  resultPlayerId,
  seriesGameNumbers,
} from "@/lib/legacy/match-result-game";
import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import type { Collections } from "@/types/__pocketbase-types";
import { Check, Pencil } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const MATCH_RESULT_LANES: {
  value: NonNullable<Collections["match_result"]["lane"]>;
  label: string;
}[] = [
  { value: "mid", label: "Mid" },
  { value: "gold", label: "Gold" },
  { value: "exp", label: "Exp" },
  { value: "support", label: "Support" },
  { value: "jungle", label: "Jungle" },
];

type StatsRow = {
  playerId: string;
  gameNumber: number;
  playerLabel: string;
  teamLabel: string;
  resultId?: string;
  lane: string;
  kda: string;
  rating: string;
  gold: string;
  isEditing: boolean;
  dirty: boolean;
};

function statsRowKey(playerId: string, gameNumber: number) {
  return `${playerId}:${gameNumber}`;
}

function teamName(m: MatchRecord, side: "A" | "B"): string {
  const key = side === "A" ? "teamA" : "teamB";
  const id = side === "A" ? m.teamA : m.teamB;
  const expanded = m.expand?.[key];
  return expanded?.name ?? id ?? "TBD";
}

function parseKda(
  value: string,
): { kills?: number; deaths?: number; assists?: number } | null {
  const text = value.trim();
  if (!text) return {};
  const parts = text.split("/").map((part) => part.trim());
  if (parts.length !== 3) return null;
  const [kills, deaths, assists] = parts.map((part) =>
    Number.parseInt(part, 10),
  );
  if ([kills, deaths, assists].some((n) => Number.isNaN(n) || n < 0)) {
    return null;
  }
  return { kills, deaths, assists };
}

function normalizeKdaInput(value: string) {
  const cleaned = value.replace(/[^\d/\s]/g, "");
  const condensed = cleaned.replace(/\s+/g, "/").replace(/\/{2,}/g, "/");
  let slashCount = 0;
  let result = "";
  for (const ch of condensed) {
    if (ch === "/") {
      if (slashCount >= 2) continue;
      slashCount += 1;
    }
    result += ch;
  }
  return result;
}

function normalizeIntegerInput(value: string) {
  return value.replace(/\D+/g, "");
}

function normalizeDecimalInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  if (rest.length < 1) return whole;
  return `${whole}.${rest.join("")}`;
}

function MatchStatsTable({
  groupedRows,
  laneLabelByValue,
  updateRow,
}: {
  groupedRows: Array<{ team: string; players: StatsRow[] }>;
  laneLabelByValue: Map<string, string>;
  updateRow: (
    playerId: string,
    gameNumber: number,
    patch: Partial<StatsRow>,
    markDirty?: boolean,
  ) => void;
}) {
  return (
    <Table className="min-w-[900px]">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>Player</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Lane</TableHead>
          <TableHead>KDA</TableHead>
          <TableHead>Perf rating</TableHead>
          <TableHead>Gold</TableHead>
          <TableHead className="w-[110px] text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groupedRows.map((group, groupIdx) => (
          <Fragment key={`team-group-${group.team}`}>
            {groupIdx > 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="h-3 bg-transparent p-0">
                  <div className="h-px w-full bg-border/70" />
                </TableCell>
              </TableRow>
            ) : null}
            <TableRow className="bg-muted/20 hover:bg-muted/20">
              <TableCell
                colSpan={7}
                className="py-2 font-semibold text-muted-foreground text-xs tracking-wide uppercase"
              >
                {group.team}
              </TableCell>
            </TableRow>
            {group.players.map((row) => (
              <TableRow key={statsRowKey(row.playerId, row.gameNumber)}>
                <TableCell className="font-medium">{row.playerLabel}</TableCell>
                <TableCell>{row.teamLabel}</TableCell>
                <TableCell>
                  <Select
                    value={row.lane || "__none__"}
                    onValueChange={(value) =>
                      updateRow(row.playerId, row.gameNumber, {
                        lane:
                          value === "__none__" || value == null ? "" : value,
                      })
                    }
                    disabled={!row.isEditing}
                  >
                    <SelectTrigger className="h-8 min-w-[124px]">
                      <SelectValue placeholder="Lane">
                        {(value) =>
                          value && value !== "__none__"
                            ? (laneLabelByValue.get(value) ?? value)
                            : "None"
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="__none__">None</SelectItem>
                        {MATCH_RESULT_LANES.map((laneOption) => (
                          <SelectItem
                            key={laneOption.value}
                            value={laneOption.value}
                          >
                            {laneOption.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Input
                    value={row.kda}
                    onChange={(e) =>
                      updateRow(row.playerId, row.gameNumber, {
                        kda: normalizeKdaInput(e.target.value),
                      })
                    }
                    onKeyDown={(e) => {
                      if (e.key !== " " && e.code !== "Space") return;
                      e.preventDefault();
                      const input = e.currentTarget;
                      const start = input.selectionStart ?? input.value.length;
                      const end = input.selectionEnd ?? input.value.length;
                      const nextValue = normalizeKdaInput(
                        `${input.value.slice(0, start)}/${input.value.slice(end)}`,
                      );
                      updateRow(row.playerId, row.gameNumber, {
                        kda: nextValue,
                      });
                    }}
                    placeholder="0/0/0"
                    className="h-8 min-w-[112px]"
                    disabled={!row.isEditing}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.rating}
                    onChange={(e) =>
                      updateRow(row.playerId, row.gameNumber, {
                        rating: normalizeDecimalInput(e.target.value),
                      })
                    }
                    placeholder="e.g. 7.8"
                    type="number"
                    step="0.01"
                    min={0}
                    className="h-8 min-w-[112px]"
                    disabled={!row.isEditing}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    value={row.gold}
                    onChange={(e) =>
                      updateRow(row.playerId, row.gameNumber, {
                        gold: normalizeIntegerInput(e.target.value),
                      })
                    }
                    placeholder="e.g. 12000"
                    type="number"
                    min={0}
                    className="h-8 min-w-[112px]"
                    disabled={!row.isEditing}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() =>
                      updateRow(
                        row.playerId,
                        row.gameNumber,
                        { isEditing: !row.isEditing },
                        false,
                      )
                    }
                  >
                    {row.isEditing ? (
                      <>
                        <Check className="size-3.5" />
                        Done
                      </>
                    ) : (
                      <>
                        <Pencil className="size-3.5" />
                        Edit
                      </>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </Fragment>
        ))}
      </TableBody>
    </Table>
  );
}

export function MatchStatsSheet({
  open,
  onOpenChange,
  match,
  participants,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchRecord | null;
  participants: ParticipantsRecord[];
}) {
  const mutations = useMatchResultMutations();
  const {
    data: matchResults,
    isPending: resultsPending,
    isFetching,
  } = useMatchResultsForMatch(match?.id, {
    enabled: open,
  });
  const headline =
    match?.matchLabel?.trim() ||
    (match ? `${teamName(match, "A")} vs ${teamName(match, "B")}` : "");
  const [rows, setRows] = useState<StatsRow[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [activeGame, setActiveGame] = useState("1");
  const gameNumbers = seriesGameNumbers(match?.bestOf);
  const selectedGame = Number.parseInt(activeGame, 10) || 1;

  const laneLabelByValue = useMemo(
    () =>
      new Map(
        MATCH_RESULT_LANES.map((laneOption) => [
          laneOption.value,
          laneOption.label,
        ]),
      ),
    [],
  );

  const initialRows = useMemo(() => {
    if (!match) return [];
    const matchedTeamIds = new Set(
      [match.teamA, match.teamB].filter(Boolean) as string[],
    );
    const resultsByPlayerGame = new Map(
      (matchResults ?? []).flatMap((result) => {
        const playerId = resultPlayerId(result);
        if (!playerId) return [];
        return [
          [
            statsRowKey(playerId, resultGameNumber(result)),
            result,
          ] as const,
        ];
      }),
    );

    const roster = [...participants]
      .filter(
        (p) =>
          p.archived !== true &&
          Boolean(p.id) &&
          matchedTeamIds.size > 0 &&
          Boolean(p.team) &&
          matchedTeamIds.has(p.team as string),
      )
      .sort((a, b) => {
        const ignA = a.ign?.trim() ?? "";
        const ignB = b.ign?.trim() ?? "";
        const byIgn = ignA.localeCompare(ignB);
        if (byIgn !== 0) return byIgn;
        return (a.name?.trim() ?? "").localeCompare(b.name?.trim() ?? "");
      });

    return seriesGameNumbers(match.bestOf).flatMap((gameNumber) =>
      roster.map((participant) => {
        const existing = resultsByPlayerGame.get(
          statsRowKey(participant.id as string, gameNumber),
        );
        const ign = participant.ign?.trim();
        const name = formatParticipantNameDisplay(participant.name);
        const playerLabel =
          ign && name ? `${ign} - ${name}` : ign || name || participant.id || "";
        return {
          playerId: participant.id as string,
          gameNumber,
          playerLabel,
          teamLabel:
            participant.team === match.teamA
              ? teamName(match, "A")
              : participant.team === match.teamB
                ? teamName(match, "B")
                : (participant.team ?? "-"),
          resultId: existing?.id,
          lane: existing?.lane ?? "",
          kda:
            existing?.kills != null ||
            existing?.deaths != null ||
            existing?.assists != null
              ? `${existing.kills ?? 0}/${existing.deaths ?? 0}/${existing.assists ?? 0}`
              : "",
          rating:
            existing?.game_performance_rating != null
              ? String(existing.game_performance_rating)
              : "",
          gold:
            existing?.accumulated_gold != null
              ? String(existing.accumulated_gold)
              : "",
          isEditing: false,
          dirty: false,
        } satisfies StatsRow;
      }),
    );
  }, [match, matchResults, participants]);

  const hasDirtyRows = rows.some((row) => row.dirty);

  useEffect(() => {
    if (!open) return;
    if (
      !shouldReplaceMatchStatsRows({
        open,
        matchId: match?.id,
        resultsPending,
        isFetching,
        isSaving,
        hasDirtyRows,
        hasLocalRows: rows.length > 0,
      })
    ) {
      return;
    }
    setRows(initialRows);
  }, [
    open,
    match?.id,
    resultsPending,
    isFetching,
    isSaving,
    hasDirtyRows,
    rows.length,
    initialRows,
  ]);

  useEffect(() => {
    if (!open) return;
    setActiveGame("1");
  }, [open]);

  const visibleRows = useMemo(
    () => rows.filter((row) => row.gameNumber === selectedGame),
    [rows, selectedGame],
  );
  const groupedRows = useMemo(() => {
    const grouped = new Map<string, StatsRow[]>();
    for (const row of visibleRows) {
      const key = row.teamLabel || "Unassigned";
      const list = grouped.get(key) ?? [];
      list.push(row);
      grouped.set(key, list);
    }

    const preferredTeamOrder = match
      ? [teamName(match, "A"), teamName(match, "B")]
      : [];

    return [...grouped.entries()]
      .sort(([teamA], [teamB]) => {
        const aIdx = preferredTeamOrder.indexOf(teamA);
        const bIdx = preferredTeamOrder.indexOf(teamB);
        const aRank = aIdx === -1 ? Number.MAX_SAFE_INTEGER : aIdx;
        const bRank = bIdx === -1 ? Number.MAX_SAFE_INTEGER : bIdx;
        if (aRank !== bRank) return aRank - bRank;
        return teamA.localeCompare(teamB);
      })
      .map(([team, players]) => ({ team, players }));
  }, [visibleRows, match]);

  const updateRow = (
    playerId: string,
    gameNumber: number,
    patch: Partial<StatsRow>,
    markDirty = true,
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.playerId === playerId && row.gameNumber === gameNumber
          ? { ...row, ...patch, dirty: markDirty ? true : row.dirty }
          : row,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!match || isSaving) return;
    const changedRows = rows.filter((row) => row.dirty);
    if (changedRows.length < 1) {
      toast.message("No edited players to submit");
      return;
    }

    setIsSaving(true);
    let savedCount = 0;
    try {
      const createdIds = new Map<string, string>();
      for (const row of changedRows) {
          const kda = parseKda(row.kda);
          if (!kda) {
            throw new Error(
              `Invalid KDA for ${row.playerLabel}. Use k/d/a format.`,
            );
          }

          const parsedRating =
            row.rating.trim() === ""
              ? undefined
              : Number.parseFloat(row.rating);
          if (parsedRating != null && Number.isNaN(parsedRating)) {
            throw new Error(
              `Invalid performance rating for ${row.playerLabel}.`,
            );
          }

          const parsedGold =
            row.gold.trim() === ""
              ? undefined
              : Math.max(0, Number.parseInt(row.gold, 10) || 0);

          const payload: Partial<Collections["match_result"]> = {
            match: match.id,
            player: row.playerId,
            game_number: row.gameNumber,
            lane: (row.lane || undefined) as
              | Collections["match_result"]["lane"]
              | undefined,
            kills: kda.kills,
            deaths: kda.deaths,
            assists: kda.assists,
            game_performance_rating: parsedRating,
            accumulated_gold: parsedGold,
          };

          const existingId =
            row.resultId ??
            findMatchResultIdForGame(
              matchResults ?? [],
              row.playerId,
              row.gameNumber,
            );

          if (existingId) {
            await mutations.update.mutateAsync({
              id: existingId,
              ...payload,
            });
            createdIds.set(
              statsRowKey(row.playerId, row.gameNumber),
              existingId,
            );
          } else {
            const created = await mutations.create.mutateAsync(payload);
            createdIds.set(statsRowKey(row.playerId, row.gameNumber), created.id);
          }
          savedCount += 1;
      }

      setRows((prev) =>
        prev.map((row) => {
          if (!row.dirty) return row;
          return {
            ...row,
            resultId:
              row.resultId ??
              createdIds.get(statsRowKey(row.playerId, row.gameNumber)),
            isEditing: false,
            dirty: false,
          };
        }),
      );

      toast.success(
        `Saved ${savedCount} player result${savedCount > 1 ? "s" : ""}`,
      );
      mutations.invalidate(match.id);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not submit results",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="data-[side=right]:w-[98vw] data-[side=right]:max-w-[98vw] data-[side=right]:sm:w-[92vw] data-[side=right]:sm:max-w-[1500px] flex h-full flex-col gap-0 p-0">
        <SheetHeader className="shrink-0 border-b border-border px-4 py-4 text-left sm:px-6">
          <SheetTitle>Match player results</SheetTitle>
          <SheetDescription className="line-clamp-2">
            {headline || "Match result stats"}
          </SheetDescription>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-4 sm:px-6">
          {resultsPending && rows.length < 1 ? (
            <div className="rounded-lg border border-border/70">
              <div className="grid min-w-[900px] grid-cols-[1.3fr_1fr_0.9fr_0.9fr_0.9fr_0.9fr_110px] gap-2 border-b border-border/70 px-3 py-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="ml-auto h-4 w-12" />
              </div>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                <div
                  key={`match-stats-skeleton-${n}`}
                  className="grid min-w-[900px] grid-cols-[1.3fr_1fr_0.9fr_0.9fr_0.9fr_0.9fr_110px] gap-2 border-b border-border/50 px-3 py-2 last:border-b-0"
                >
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="ml-auto h-8 w-16" />
                </div>
              ))}
            </div>
          ) : rows.length < 1 ? (
            <div className="rounded-md border border-border border-dashed px-4 py-6 text-muted-foreground text-sm">
              No players found for this match. Assign teams and team members
              first.
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {gameNumbers.length > 1 ? (
                <Tabs
                  value={activeGame}
                  onValueChange={(v) => setActiveGame(String(v ?? "1"))}
                >
                  <TabsList className="w-fit max-w-full flex-wrap justify-start">
                    {gameNumbers.map((gameNumber) => {
                      const dirty = rows.some(
                        (row) => row.gameNumber === gameNumber && row.dirty,
                      );
                      return (
                        <TabsTrigger
                          key={gameNumber}
                          value={String(gameNumber)}
                        >
                          Game {gameNumber}
                          {dirty ? (
                            <span className="size-1.5 rounded-full bg-primary" />
                          ) : null}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  <TabsContent value={activeGame} className="mt-4">
                    <MatchStatsTable
                      groupedRows={groupedRows}
                      laneLabelByValue={laneLabelByValue}
                      updateRow={updateRow}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <MatchStatsTable
                  groupedRows={groupedRows}
                  laneLabelByValue={laneLabelByValue}
                  updateRow={updateRow}
                />
              )}
            </div>
          )}
        </div>

        <SheetFooter className="shrink-0 border-t border-border px-4 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Close
          </Button>
          <Button
            onClick={() => void handleSubmit()}
            disabled={!match || isSaving || !hasDirtyRows}
          >
            {isSaving ? "Submitting…" : "Submit player results"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
