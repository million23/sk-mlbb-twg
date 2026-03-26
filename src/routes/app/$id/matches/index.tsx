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
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useMatchMutations } from "@/hooks/use-match-mutations";
import {
  type MatchRecord,
  useMatchesForTournament,
} from "@/hooks/use-matches";
import { useTeams } from "@/hooks/use-teams";
import { useTournaments } from "@/hooks/use-tournaments";
import { humanizeSlug } from "@/lib/humanize-slug";
import { getMatchStatusStyle } from "@/lib/match-status";
import { cn } from "@/lib/utils";
import type { Collections } from "@/types/pocketbase-types";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ClientResponseError } from "pocketbase";
import { Archive, Medal, Pencil, Plus, Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$id/matches/")({
  component: MatchesPage,
});

const MATCH_STATUSES: {
  value: NonNullable<Collections["matches"]["status"]>;
  label: string;
}[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "walkover", label: "Walkover" },
  { value: "cancelled", label: "Cancelled" },
];

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

/**
 * Prefer a real title; if title is missing or identical to slug (common when
 * people paste the slug into title), show a readable name instead of raw slug.
 */
function tournamentLabel(t: Collections["tournaments"]): string {
  const title = t.title?.trim();
  const slug = t.slug?.trim();
  if (title && slug && title.toLowerCase() === slug.toLowerCase()) {
    return humanizeSlug(slug);
  }
  if (title) return title;
  if (slug) return humanizeSlug(slug);
  return "Untitled tournament";
}

function MatchesPage() {
  const params = useParams({ strict: false });
  const appId = (params as { id?: string })?.id ?? "";
  const { data: tournaments, isLoading: tournamentsLoading } = useTournaments();
  const { data: teams } = useTeams();
  const [tournamentId, setTournamentId] = useState<string>("");

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

  const {
    data: matches,
    isLoading: matchesLoading,
    isError,
    error,
  } = useMatchesForTournament(tournamentId || undefined, {
    enabled: tournamentEligible,
  });
  const mutations = useMatchMutations();

  const [addOpen, setAddOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<MatchRecord | null>(null);
  const [resultsMatch, setResultsMatch] = useState<MatchRecord | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);

  useEffect(() => {
    if (tournamentId || !tournaments?.length) return;
    const live = tournaments.find((t) => t.status === "live");
    const upcoming = tournaments.find((t) => t.status === "upcoming");
    const first = tournaments[0];
    const pick = live?.id ?? upcoming?.id ?? first?.id;
    if (pick) setTournamentId(pick);
  }, [tournaments, tournamentId]);

  useEffect(() => {
    if (!tournaments || !tournamentId) return;
    if (!tournaments.some((t) => t.id === tournamentId)) {
      setTournamentId("");
    }
  }, [tournaments, tournamentId]);

  const errMsg =
    error instanceof ClientResponseError
      ? (error.response?.message as string) || error.message
      : error instanceof Error
        ? error.message
        : String(error);
  const collectionMissing =
    isError &&
    (errMsg.toLowerCase().includes("collection") ||
      errMsg.toLowerCase().includes("wasn't found") ||
      (error instanceof ClientResponseError && error.status === 404));

  const groupedMatches = useMemo(() => {
    if (!tournamentEligible || !matches?.length) return [];
    const map = new Map<string, MatchRecord[]>();
    for (const m of matches) {
      const r = (m.round ?? "").trim() || "General";
      const existing = map.get(r);
      if (existing) existing.push(m);
      else map.set(r, [m]);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [matches, tournamentEligible]);

  const tournamentIds = useMemo(
    () => sortedTournaments.map((t) => t.id),
    [sortedTournaments],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Matches
          </h1>
          <p className="text-muted-foreground">
            Bracket and schedule for each tournament
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/app/$id/matches/archived"
            params={{ id: appId }}
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "gap-2",
            )}
          >
            <Archive className="size-4 shrink-0" aria-hidden />
            Archived
          </Link>
          <Button
            onClick={() => setAddOpen(true)}
            disabled={!tournamentEligible || collectionMissing}
          >
            <Plus className="size-4" />
            Add match
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournament</CardTitle>
          <CardDescription>
            Filter matches by event. Create the{" "}
            <code className="rounded bg-muted px-1 text-xs">matches</code>{" "}
            collection in PocketBase if this page errors (see{" "}
            <code className="rounded bg-muted px-1 text-xs">
              POCKETBASE_TABLES.md
            </code>
            ).
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournamentsLoading ? (
            <Skeleton className="h-9 w-full max-w-sm" />
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
              autoHighlight
            >
              <ComboboxInput
                className="w-full max-w-md"
                placeholder="Search tournaments…"
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

      {isError && collectionMissing ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Collection not found
            </CardTitle>
            <CardDescription>
              Add the <strong>matches</strong> collection to your PocketBase
              project (fields and rules in{" "}
              <code className="text-xs">POCKETBASE_TABLES.md</code> and import
              snippet in <code className="text-xs">pocketbase/</code>
              ). Then refresh this page.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : isError ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              Could not load matches
            </CardTitle>
            <CardDescription className="font-mono text-xs">
              {errMsg}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : tournamentId && !tournamentEligible ? (
        <Card className="border-muted">
          <CardHeader>
            <CardTitle className="text-base">Tournament unavailable</CardTitle>
            <CardDescription>
              This tournament is archived or no longer in your list. Choose
              another tournament above, or restore the event from archived
              tournaments.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : !tournamentId ? null : tournamentEligible && matchesLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : tournamentEligible && matches?.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Swords className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No matches yet</EmptyTitle>
            <EmptyDescription>
              Create matches for this tournament or seed them from your bracket
              tool.
            </EmptyDescription>
          </EmptyHeader>
          <Button
            variant="outline"
            onClick={() => setAddOpen(true)}
            disabled={!tournamentEligible}
          >
            <Plus className="size-4" />
            Add first match
          </Button>
        </Empty>
      ) : tournamentEligible ? (
        <div className="space-y-6">
          {groupedMatches.map(([round, rows]) => (
            <div key={round}>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                {round}
              </h2>
              <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                {rows.map((m) => {
                  const st = getMatchStatusStyle(m.status);
                  return (
                    <div
                      key={m.id}
                      className="flex flex-col gap-2 px-3 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="font-medium text-sm">
                          {m.matchLabel?.trim() ||
                            `${teamName(m, "A")} vs ${teamName(m, "B")}`}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {teamName(m, "A")} · {teamName(m, "B")}
                          {m.bestOf != null ? ` · Bo${m.bestOf}` : ""}
                        </p>
                        {m.winner ? (
                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Winner · {winnerName(m)}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
                        <span className="font-mono text-sm tabular-nums">
                          {m.scoreA ?? 0} – {m.scoreB ?? 0}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn("font-normal", st.className)}
                        >
                          {st.label}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setResultsMatch(m)}
                          title="Score & winner"
                        >
                          <Medal className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditMatch(m)}
                          title="Edit match details"
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setArchiveId(m.id)}
                          title="Archive"
                        >
                          <Archive className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <MatchFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        tournamentId={tournamentId}
        teams={teams ?? []}
        isSubmitting={mutations.create.isPending}
        onSubmit={(payload) => {
          mutations.create.mutate(payload, {
            onSuccess: () => {
              toast.success("Match created");
              setAddOpen(false);
            },
            onError: () => toast.error("Could not save match"),
          });
        }}
      />

      <MatchFormDialog
        open={!!editMatch}
        onOpenChange={(o) => !o && setEditMatch(null)}
        tournamentId={tournamentId}
        teams={teams ?? []}
        initial={editMatch ?? undefined}
        isSubmitting={mutations.update.isPending}
        onSubmit={(payload) => {
          if (!editMatch) return;
          mutations.update.mutate(
            { id: editMatch.id, ...payload },
            {
              onSuccess: () => {
                toast.success("Match updated");
                setEditMatch(null);
              },
              onError: () => toast.error("Could not save match"),
            },
          );
        }}
      />

      <MatchResultsDialog
        open={!!resultsMatch}
        onOpenChange={(o) => !o && setResultsMatch(null)}
        match={resultsMatch}
        teams={teams ?? []}
        isSubmitting={mutations.update.isPending}
        onSubmit={(payload) => {
          if (!resultsMatch) return;
          mutations.update.mutate(
            { id: resultsMatch.id, ...payload },
            {
              onSuccess: () => {
                toast.success("Result saved · match marked completed");
                setResultsMatch(null);
              },
              onError: () => toast.error("Could not save result"),
            },
          );
        }}
      />

      <AlertDialog open={!!archiveId} onOpenChange={() => setArchiveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive match?</AlertDialogTitle>
            <AlertDialogDescription>
              The match will be hidden from the schedule until you restore it from
              Archived matches. Related{" "}
              <code className="text-xs">match_drafts</code> rows are not
              deleted automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!archiveId) return;
                const id = archiveId;
                setArchiveId(null);
                mutations.archive.mutate(id, {
                  onSuccess: () => toast.success("Match archived"),
                  onError: () => {
                    toast.error("Could not archive match");
                    setArchiveId(id);
                  },
                });
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MatchFormDialog({
  open,
  onOpenChange,
  tournamentId,
  teams,
  initial,
  isSubmitting = false,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tournamentId: string;
  teams: Collections["teams"][];
  initial?: MatchRecord;
  isSubmitting?: boolean;
  onSubmit: (data: Partial<Collections["matches"]>) => void;
}) {
  const [matchLabel, setMatchLabel] = useState("");
  const [round, setRound] = useState("");
  const [order, setOrder] = useState("0");
  const [bestOf, setBestOf] = useState("3");
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [status, setStatus] =
    useState<NonNullable<Collections["matches"]["status"]>>("scheduled");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setMatchLabel(initial.matchLabel ?? "");
      setRound(initial.round ?? "");
      setOrder(String(initial.order ?? 0));
      setBestOf(String(initial.bestOf ?? 3));
      setTeamA(initial.teamA ?? "");
      setTeamB(initial.teamB ?? "");
      setStatus(initial.status ?? "scheduled");
      setNotes(initial.notes ?? "");
    } else {
      setMatchLabel("");
      setRound("");
      setOrder("0");
      setBestOf("3");
      setTeamA("");
      setTeamB("");
      setStatus("scheduled");
      setNotes("");
    }
  }, [open, initial]);

  const handleSave = () => {
    if (!tournamentId && !initial) {
      toast.error("Select a tournament");
      return;
    }
    if (isSubmitting) return;
    onSubmit({
      ...(initial ? {} : { tournament: tournamentId }),
      matchLabel: matchLabel.trim() || undefined,
      round: round.trim() || undefined,
      order: Number.parseInt(order, 10) || 0,
      bestOf: Number.parseInt(bestOf, 10) || 3,
      teamA: teamA || undefined,
      teamB: teamB || undefined,
      ...(initial ? { status } : { status: "scheduled" as const }),
      notes: notes.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="space-y-1 border-b border-border px-6 py-4 text-left">
          <DialogTitle>{initial ? "Edit match" : "Add match"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Bracket slot, teams, and schedule metadata. Use the medal button on the list for scores and winner."
              : "Create a bracket row for the selected tournament."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="m-label">Label</Label>
            <Input
              id="m-label"
              value={matchLabel}
              onChange={(e) => setMatchLabel(e.target.value)}
              placeholder="e.g. Upper bracket — semifinal"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
            <div className="space-y-2">
              <Label htmlFor="m-round">Round</Label>
              <Input
                id="m-round"
                value={round}
                onChange={(e) => setRound(e.target.value)}
                placeholder="Round 1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="m-order">Order</Label>
              <Input
                id="m-order"
                type="number"
                min={0}
                value={order}
                onChange={(e) => setOrder(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="m-bo">Best of</Label>
            <Input
              id="m-bo"
              type="number"
              min={1}
              value={bestOf}
              onChange={(e) => setBestOf(e.target.value)}
            />
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Teams
            </p>
            <div className="space-y-2">
              <Label>Team A</Label>
              <Select
                value={teamA || "__none__"}
                onValueChange={(v) => setTeamA(v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select team">
                    {(value) =>
                      value && value !== "__none__"
                        ? (teams.find((t) => t.id === value)?.name ?? value)
                        : "TBD"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">TBD</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name ?? t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Team B</Label>
              <Select
                value={teamB || "__none__"}
                onValueChange={(v) => setTeamB(v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select team">
                    {(value) =>
                      value && value !== "__none__"
                        ? (teams.find((t) => t.id === value)?.name ?? value)
                        : "TBD"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">TBD</SelectItem>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name ?? t.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {initial ? (
            <div className="space-y-2 border-t border-border pt-4">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) =>
                  setStatus(v as NonNullable<Collections["matches"]["status"]>)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Status">
                    {(value) =>
                      value
                        ? (MATCH_STATUSES.find((x) => x.value === value)
                            ?.label ?? String(value))
                        : null
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MATCH_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div className="space-y-2 border-t border-border pt-4">
            <Label htmlFor="m-notes">Notes</Label>
            <Textarea
              id="m-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional staff notes"
              rows={3}
              className="min-h-18 resize-y"
            />
          </div>
        </div>

        <DialogFooter className="mx-0! mb-0! mt-auto shrink-0 flex-col-reverse gap-3 border-t border-border bg-muted/40 px-6 pt-4 pb-5 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving…" : initial ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MatchResultsDialog({
  open,
  onOpenChange,
  match,
  teams,
  isSubmitting = false,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchRecord | null;
  teams: Collections["teams"][];
  isSubmitting?: boolean;
  onSubmit: (
    data: Pick<
      Partial<Collections["matches"]>,
      "scoreA" | "scoreB" | "winner" | "status"
    >
  ) => void;
}) {
  const [scoreA, setScoreA] = useState("0");
  const [scoreB, setScoreB] = useState("0");
  const [winner, setWinner] = useState("");

  useEffect(() => {
    if (!open || !match) return;
    setScoreA(String(match.scoreA ?? 0));
    setScoreB(String(match.scoreB ?? 0));
    setWinner(match.winner ?? "");
  }, [open, match]);

  const teamALabel = match ? teamName(match, "A") : "Team A";
  const teamBLabel = match ? teamName(match, "B") : "Team B";
  const headline =
    match?.matchLabel?.trim() ||
    (match ? `${teamALabel} vs ${teamBLabel}` : "");

  const handleSave = () => {
    if (isSubmitting) return;
    onSubmit({
      scoreA: Number.parseInt(scoreA, 10) || 0,
      scoreB: Number.parseInt(scoreB, 10) || 0,
      winner: winner || undefined,
      status: "completed",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,560px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="space-y-1 border-b border-border px-6 py-4 text-left">
          <DialogTitle>Score & winner</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {headline || "Match result"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="r-sa">{teamALabel} — wins</Label>
              <Input
                id="r-sa"
                type="number"
                min={0}
                value={scoreA}
                onChange={(e) => setScoreA(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-sb">{teamBLabel} — wins</Label>
              <Input
                id="r-sb"
                type="number"
                min={0}
                value={scoreB}
                onChange={(e) => setScoreB(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Winner</Label>
            <Select
              value={winner || "__none__"}
              onValueChange={(v) => setWinner(v === "__none__" ? "" : v)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Winner">
                  {(value) =>
                    value && value !== "__none__"
                      ? (teams.find((t) => t.id === value)?.name ?? value)
                      : "None"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {match?.teamA ? (
                  <SelectItem value={match.teamA}>{teamALabel}</SelectItem>
                ) : null}
                {match?.teamB ? (
                  <SelectItem value={match.teamB}>{teamBLabel}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only the two sides in this match are listed. Clear winner with
              &quot;None&quot;.
            </p>
          </div>
        </div>

        <DialogFooter className="mx-0! mb-0! mt-auto shrink-0 flex-col-reverse gap-3 border-t border-border bg-muted/40 px-6 pt-4 pb-5 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting || !match}>
            {isSubmitting ? "Saving…" : "Save result"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
