import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStagger } from "@/components/admin/admin-stagger";
import { AutoMatchDialog } from "@/components/admin/matches/auto-match-dialog";
import {
  MatchFormDialog,
  type MatchFormValues,
  type TeamOption,
} from "@/components/admin/matches/match-form-dialog";
import {
  MatchResultsDialog,
  type MatchResultsValues,
} from "@/components/admin/matches/match-results-dialog";
import { MatchStatsSheet } from "@/components/admin/matches/match-stats-sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type { MatchRecord } from "@/hooks/legacy/use-matches";
import type {
  AutoMatchPreview,
  AutoMatchTeam,
} from "@/lib/admin/auto-matches";
import {
  buildAdvanceRoundPreview,
  findAdvanceSourceRound,
  toBracketMatchInput,
} from "@/lib/admin/bracket-rounds";
import { getMatchStatusStyle } from "@/lib/legacy/match-status";
import { cn } from "@/lib/utils";
import {
  Archive,
  BarChart3,
  ChevronRight,
  Medal,
  Pencil,
  Plus,
  Shuffle,
  Swords,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export type MatchesPageProps = {
  tournamentTitle?: string;
  canManage?: boolean;
  matches: MatchRecord[];
  teams: TeamOption[];
  /** Active teams eligible for auto-pairing (non-archived, non-inactive). */
  autoMatchTeams: AutoMatchTeam[];
  participants: ParticipantsRecord[];
  defaultBestOf?: number;
  /** Equal elimination brackets (SK default 4). */
  bracketCount?: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  formPending?: boolean;
  resultsPending?: boolean;
  archivePending?: boolean;
  autoMatchPending?: boolean;
  onCreateMatch: (values: MatchFormValues) => Promise<void>;
  onUpdateMatch: (id: string, values: MatchFormValues) => Promise<void>;
  onSaveResults: (id: string, values: MatchResultsValues) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  onAutoGenerate: (preview: AutoMatchPreview) => Promise<void>;
};

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

function groupMatchesByRound(
  matches: MatchRecord[],
): [string, MatchRecord[]][] {
  const map = new Map<string, MatchRecord[]>();
  for (const m of matches) {
    const round = (m.round ?? "").trim() || "Bracket";
    const existing = map.get(round);
    if (existing) existing.push(m);
    else map.set(round, [m]);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

function MatchTeamsCell({ match }: { match: MatchRecord }) {
  const teamAName = teamName(match, "A");
  const teamBName = teamName(match, "B");
  return (
    <div className="min-w-0">
      <p className="truncate font-medium">{teamAName}</p>
      <p className="text-muted-foreground text-xs">vs {teamBName}</p>
      {match.winner ? (
        <p className="text-emerald-700 text-xs dark:text-emerald-400">
          Winner · {winnerName(match)}
        </p>
      ) : null}
    </div>
  );
}

function MatchActions({
  canManage,
  resultsPending,
  archivePending,
  onResults,
  onStats,
  onEdit,
  onArchive,
}: {
  canManage: boolean;
  resultsPending?: boolean;
  archivePending?: boolean;
  onResults: () => void;
  onStats: () => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  if (!canManage) return null;
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title="Score & winner"
        disabled={resultsPending}
        onClick={onResults}
      >
        <Medal className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title="Player results"
        onClick={onStats}
      >
        <BarChart3 className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        title="Edit match"
        disabled={resultsPending}
        onClick={onEdit}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="text-destructive hover:text-destructive"
        title="Archive match"
        disabled={archivePending}
        onClick={onArchive}
      >
        <Archive className="size-4" />
      </Button>
    </div>
  );
}

export function MatchesPage({
  tournamentTitle,
  canManage = false,
  matches,
  teams,
  autoMatchTeams,
  participants,
  defaultBestOf = 3,
  bracketCount,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  formPending,
  resultsPending,
  archivePending,
  autoMatchPending,
  onCreateMatch,
  onUpdateMatch,
  onSaveResults,
  onArchive,
  onAutoGenerate,
}: MatchesPageProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MatchRecord | null>(null);
  const [resultsMatch, setResultsMatch] = useState<MatchRecord | null>(null);
  const [statsMatch, setStatsMatch] = useState<MatchRecord | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [autoMatchOpen, setAutoMatchOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advancePreview, setAdvancePreview] = useState<AutoMatchPreview | null>(
    null,
  );
  const [advanceKind, setAdvanceKind] = useState<
    "next_round" | "playoffs_ready" | null
  >(null);
  const [advanceSourceRound, setAdvanceSourceRound] = useState("Round 1");

  const highestOrder = useMemo(
    () => matches.reduce((max, row) => Math.max(max, row.order ?? 0), 0),
    [matches],
  );

  const bracketInputs = useMemo(
    () => matches.map(toBracketMatchInput),
    [matches],
  );

  const groupedMatches = useMemo(
    () => groupMatchesByRound(matches),
    [matches],
  );

  const openAdvancePreview = () => {
    const source = findAdvanceSourceRound(bracketInputs);
    if (!source.ok) {
      toast.error(source.error);
      return;
    }
    const result = buildAdvanceRoundPreview({
      matches: bracketInputs,
      sourceRound: source.sourceRound,
      highestOrder,
      defaultBestOf,
    });
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setAdvanceSourceRound(source.sourceRound);
    setAdvanceKind(result.kind);
    setAdvancePreview(result.preview);
    setAdvanceOpen(true);
  };

  const reshuffleAdvance = () =>
    buildAdvanceRoundPreview({
      matches: bracketInputs,
      sourceRound: advanceSourceRound,
      highestOrder,
      defaultBestOf,
    });

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <AdminStagger index={0}>
        <AdminPageHeader
          eyebrow="Tournament workspace"
          title="Matches"
          description={
            tournamentTitle
              ? `Bracket slots, scores, and match status for ${tournamentTitle}.`
              : "Bracket slots, scores, and match status for this tournament."
          }
          actions={
            canManage ? (
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAutoMatchOpen(true)}
                  disabled={autoMatchPending}
                >
                  <Shuffle className="size-4" />
                  Auto matches
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={openAdvancePreview}
                  disabled={autoMatchPending || matches.length === 0}
                >
                  <ChevronRight className="size-4" />
                  Advance winners
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Add match
                </Button>
              </div>
            ) : null
          }
        />
      </AdminStagger>

      <AdminStagger index={1}>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : isError ? (
          <Empty className="border border-border">
            <EmptyHeader>
              <EmptyTitle>Could not load matches</EmptyTitle>
              <EmptyDescription>
                {errorMessage || "Unknown error"}
              </EmptyDescription>
            </EmptyHeader>
            <Button type="button" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          </Empty>
        ) : groupedMatches.length === 0 ? (
          <Empty className="border border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Swords />
              </EmptyMedia>
              <EmptyTitle>No matches yet</EmptyTitle>
              <EmptyDescription>
                {canManage
                  ? "Add a match manually or generate Round 1 pairings."
                  : "Matches will appear here once staff add them."}
              </EmptyDescription>
            </EmptyHeader>
            {canManage && matches.length === 0 ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAutoMatchOpen(true)}
                >
                  <Shuffle className="size-4" />
                  Auto matches
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Add first match
                </Button>
              </div>
            ) : null}
          </Empty>
        ) : (
          <div className="flex flex-col gap-8">
            {groupedMatches.map(([round, rows]) => (
              <section key={round}>
                <h2 className="mb-3 font-medium text-muted-foreground text-sm">
                  {round}
                </h2>

                <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Label</TableHead>
                        <TableHead>Teams</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead>Status</TableHead>
                        {canManage ? (
                          <TableHead className="text-right">Actions</TableHead>
                        ) : null}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((m) => {
                        const st = getMatchStatusStyle(m.status);
                        const label =
                          m.matchLabel?.trim() ||
                          `${teamName(m, "A")} vs ${teamName(m, "B")}`;
                        return (
                          <TableRow key={m.id}>
                            <TableCell className="max-w-[200px]">
                              <div className="min-w-0">
                                <p className="truncate font-medium">{label}</p>
                                <p className="text-muted-foreground text-xs">
                                  {m.bracket?.trim()
                                    ? `${m.bracket.trim()} · `
                                    : ""}
                                  Order {m.order ?? 0}
                                  {m.bestOf != null ? ` · Bo${m.bestOf}` : ""}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <MatchTeamsCell match={m} />
                            </TableCell>
                            <TableCell className="font-mono tabular-nums">
                              {m.scoreA ?? 0} – {m.scoreB ?? 0}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn("font-normal", st.className)}
                              >
                                {st.label}
                              </Badge>
                            </TableCell>
                            {canManage ? (
                              <TableCell className="text-right">
                                <MatchActions
                                  canManage={canManage}
                                  resultsPending={resultsPending}
                                  archivePending={archivePending}
                                  onResults={() => setResultsMatch(m)}
                                  onStats={() => setStatsMatch(m)}
                                  onEdit={() => {
                                    setEditing(m);
                                    setFormOpen(true);
                                  }}
                                  onArchive={() =>
                                    m.id && setArchiveId(m.id)
                                  }
                                />
                              </TableCell>
                            ) : null}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="divide-y divide-border overflow-hidden rounded-lg border border-border md:hidden">
                  {rows.map((m) => {
                    const st = getMatchStatusStyle(m.status);
                    const label =
                      m.matchLabel?.trim() ||
                      `${teamName(m, "A")} vs ${teamName(m, "B")}`;
                    return (
                      <div
                        key={m.id}
                        className="flex flex-col gap-3 px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm">{label}</p>
                            <p className="text-muted-foreground text-xs">
                              {m.bracket?.trim()
                                ? `${m.bracket.trim()} · `
                                : ""}
                              Order {m.order ?? 0}
                              {m.bestOf != null ? ` · Bo${m.bestOf}` : ""}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn("shrink-0 font-normal", st.className)}
                          >
                            {st.label}
                          </Badge>
                        </div>
                        <MatchTeamsCell match={m} />
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-sm tabular-nums">
                            {m.scoreA ?? 0} – {m.scoreB ?? 0}
                          </span>
                          <MatchActions
                            canManage={canManage}
                            resultsPending={resultsPending}
                            archivePending={archivePending}
                            onResults={() => setResultsMatch(m)}
                            onStats={() => setStatsMatch(m)}
                            onEdit={() => {
                              setEditing(m);
                              setFormOpen(true);
                            }}
                            onArchive={() => m.id && setArchiveId(m.id)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </AdminStagger>

      {canManage ? (
        <MatchFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          mode={editing ? "edit" : "create"}
          record={editing}
          teams={teams}
          pending={formPending}
          onSubmit={async (values) => {
            if (editing?.id) {
              await onUpdateMatch(editing.id, values);
            } else {
              await onCreateMatch(values);
            }
            setFormOpen(false);
            setEditing(null);
          }}
        />
      ) : null}

      {canManage ? (
        <MatchResultsDialog
          open={Boolean(resultsMatch)}
          onOpenChange={(open) => {
            if (!open) setResultsMatch(null);
          }}
          match={resultsMatch}
          pending={resultsPending}
          onSubmit={async (values) => {
            if (!resultsMatch?.id) return;
            await onSaveResults(resultsMatch.id, values);
            setResultsMatch(null);
          }}
        />
      ) : null}

      {canManage ? (
        <MatchStatsSheet
          open={Boolean(statsMatch)}
          onOpenChange={(open) => {
            if (!open) setStatsMatch(null);
          }}
          match={statsMatch}
          participants={participants}
        />
      ) : null}

      {canManage ? (
        <AutoMatchDialog
          open={autoMatchOpen}
          onOpenChange={setAutoMatchOpen}
          teams={autoMatchTeams}
          highestOrder={highestOrder}
          defaultBestOf={defaultBestOf}
          bracketCount={bracketCount}
          pending={autoMatchPending}
          onConfirm={onAutoGenerate}
        />
      ) : null}

      {canManage ? (
        <AutoMatchDialog
          open={advanceOpen}
          onOpenChange={(open) => {
            setAdvanceOpen(open);
            if (!open) {
              setAdvancePreview(null);
              setAdvanceKind(null);
            }
          }}
          teams={autoMatchTeams}
          highestOrder={highestOrder}
          defaultBestOf={defaultBestOf}
          bracketCount={bracketCount}
          pending={autoMatchPending}
          seedPreview={advancePreview}
          title={
            advanceKind === "playoffs_ready"
              ? "Playoff quarterfinals preview"
              : "Advance winners preview"
          }
          description={
            advanceKind === "playoffs_ready"
              ? `Each bracket is down to 2 teams from ${advanceSourceRound}. Pairings avoid same-bracket rematches.`
              : `Winners from ${advanceSourceRound}, paired inside each bracket for the next elimination round.`
          }
          onShufflePreview={() => {
            const next = reshuffleAdvance();
            if (!next.ok) return next;
            setAdvanceKind(next.kind);
            setAdvancePreview(next.preview);
            return { ok: true as const, preview: next.preview };
          }}
          onConfirm={onAutoGenerate}
        />
      ) : null}

      {canManage ? (
        <AlertDialog
          open={Boolean(archiveId)}
          onOpenChange={(open) => {
            if (!open) setArchiveId(null);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive match?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes the match from the active bracket. You can restore
                it later from archived matches.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={archivePending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                disabled={archivePending}
                onClick={(e) => {
                  e.preventDefault();
                  if (!archiveId) return;
                  void onArchive(archiveId).then(() => setArchiveId(null));
                }}
              >
                {archivePending ? "Archiving…" : "Archive"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : null}
    </div>
  );
}
