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
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
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
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  FxAppMatchesList,
  FxAppMatchesTournamentSelect,
} from "@/lib/loading-placeholders";
import { Textarea } from "@/components/ui/textarea";
import { useMatchResultMutations } from "@/hooks/use-match-result-mutations";
import { useMatchResultsForMatch } from "@/hooks/use-match-results";
import { useMatchMutations } from "@/hooks/use-match-mutations";
import {
  type MatchRecord,
  useMatchesForTournament,
} from "@/hooks/use-matches";
import { useParticipants } from "@/hooks/use-participants";
import { useTeams } from "@/hooks/use-teams";
import { useTournaments } from "@/hooks/use-tournaments";
import { tournamentAgeGroupFromBirthdate } from "@/lib/age";
import { getMatchStatusStyle } from "@/lib/match-status";
import { tournamentLabel } from "@/lib/tournament-label";
import { cn } from "@/lib/utils";
import type { Collections } from "@/types/pocketbase-types";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ClientResponseError } from "pocketbase";
import {
  Archive,
  BarChart3,
  Check,
  Medal,
  Pencil,
  Plus,
  Shuffle,
  Swords,
} from "lucide-react";
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";

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

function shuffledCopy<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type AutoMatchBracket = "under18" | "18+";
type AutoMatchPreviewRow = {
  teamA: Collections["teams"];
  teamB: Collections["teams"];
  round: string;
  order: number;
  bestOf: number;
};
type AutoMatchPreview = {
  rows: AutoMatchPreviewRow[];
  leftOut: Collections["teams"] | null;
};
type MatchesAgeCategory = "all" | "under18" | "18+";

function MatchesPage() {
  const params = useParams({ strict: false });
  const appId = (params as { id?: string })?.id ?? "";
  const isMobile = useIsMobile();
  const { data: tournaments, isLoading: tournamentsLoading } = useTournaments();
  const { data: teams } = useTeams();
  const { data: participants } = useParticipants();
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
  const [matchStatsMatch, setMatchStatsMatch] = useState<MatchRecord | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [autoMatchOpen, setAutoMatchOpen] = useState(false);
  const [autoMatchPreviewOpen, setAutoMatchPreviewOpen] = useState(false);
  const [autoMatchBracket, setAutoMatchBracket] =
    useState<AutoMatchBracket>("under18");
  const [autoMatchPreview, setAutoMatchPreview] =
    useState<AutoMatchPreview | null>(null);
  const [matchesAgeCategory, setMatchesAgeCategory] =
    useState<MatchesAgeCategory>("all");

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

  const tournamentIds = useMemo(
    () => sortedTournaments.map((t) => t.id),
    [sortedTournaments],
  );

  const teamsForAutoMatches = useMemo(
    () =>
      (teams ?? []).filter((t) => t.archived !== true && t.status !== "inactive"),
    [teams],
  );

  const teamMajorityBracket = useMemo(() => {
    const membersByTeam = new Map<
      string,
      {
        under18: number;
        adults: number;
        total: number;
      }
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

    const map = new Map<string, AutoMatchBracket | null>();
    for (const team of teamsForAutoMatches) {
      const counts = membersByTeam.get(team.id);
      if (!counts || counts.total < 1) {
        map.set(team.id, null);
        continue;
      }
      if (counts.under18 > counts.total / 2) {
        map.set(team.id, "under18");
        continue;
      }
      if (counts.adults > counts.total / 2) {
        map.set(team.id, "18+");
        continue;
      }
      map.set(team.id, null);
    }
    return map;
  }, [participants, teamsForAutoMatches]);

  const autoMatchBracketTeams = useMemo(
    () =>
      teamsForAutoMatches.filter(
        (team) => teamMajorityBracket.get(team.id) === autoMatchBracket,
      ),
    [autoMatchBracket, teamMajorityBracket, teamsForAutoMatches],
  );

  const filteredMatchesByAge = useMemo(() => {
    if (!matches?.length || matchesAgeCategory === "all") return matches ?? [];
    return matches.filter((m) => {
      const teamABracket = m.teamA ? teamMajorityBracket.get(m.teamA) : null;
      const teamBBracket = m.teamB ? teamMajorityBracket.get(m.teamB) : null;
      return (
        teamABracket === matchesAgeCategory && teamBBracket === matchesAgeCategory
      );
    });
  }, [matches, matchesAgeCategory, teamMajorityBracket]);

  const groupedMatches = useMemo(() => {
    if (!tournamentEligible || !filteredMatchesByAge.length) return [];
    const map = new Map<string, MatchRecord[]>();
    for (const m of filteredMatchesByAge) {
      const r = (m.round ?? "").trim() || "General";
      const existing = map.get(r);
      if (existing) existing.push(m);
      else map.set(r, [m]);
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filteredMatchesByAge, tournamentEligible]);

  const buildAutoMatchPreview = useCallback(
    (bracket: AutoMatchBracket): AutoMatchPreview | null => {
      const bracketTeams = teamsForAutoMatches.filter(
        (team) => teamMajorityBracket.get(team.id) === bracket,
      );
      if (bracketTeams.length < 2) return null;
      const shuffledTeams = shuffledCopy(bracketTeams);
      const pairCount = Math.floor(shuffledTeams.length / 2);
      if (pairCount < 1) return null;
      const highestOrder = (matches ?? []).reduce(
        (max, row) => Math.max(max, row.order ?? 0),
        0,
      );
      const rows = Array.from({ length: pairCount }, (_, index) => ({
        teamA: shuffledTeams[index * 2],
        teamB: shuffledTeams[index * 2 + 1],
        round: "Round 1",
        order: highestOrder + index + 1,
        bestOf: 3,
      }));
      return {
        rows,
        leftOut:
          shuffledTeams.length % 2 === 1
            ? shuffledTeams[shuffledTeams.length - 1]
            : null,
      };
    },
    [matches, teamMajorityBracket, teamsForAutoMatches],
  );

  const openAutoMatchesDialog = useCallback(() => {
    setAutoMatchPreview(null);
    setAutoMatchPreviewOpen(false);
    setAutoMatchOpen(true);
  }, []);

  const openAutoMatchPreview = useCallback(() => {
    const preview = buildAutoMatchPreview(autoMatchBracket);
    if (!preview) {
      toast.error("Need at least 2 teams in this age bracket");
      return;
    }
    setAutoMatchPreview(preview);
    setAutoMatchOpen(false);
    setAutoMatchPreviewOpen(true);
  }, [autoMatchBracket, buildAutoMatchPreview]);

  const handleAutoMatches = useCallback(() => {
    if (!tournamentId || !tournamentEligible) {
      toast.error("Select an active tournament first");
      return;
    }
    if (!autoMatchPreview || autoMatchPreview.rows.length < 1) {
      toast.error("Generate a valid preview first");
      return;
    }
    const pairCount = autoMatchPreview.rows.length;
    const leftOutTeam = autoMatchPreview.leftOut;
    const payload = autoMatchPreview.rows.map((preview, index) => {
      const { teamA, teamB } = preview;
      return {
        teamA: teamA.id,
        teamB: teamB.id,
        round: preview.round.trim() || "Round 1",
        order: Number.isFinite(preview.order) ? preview.order : index + 1,
        bestOf: Math.max(1, Number.isFinite(preview.bestOf) ? preview.bestOf : 3),
        status: "scheduled" as const,
        matchLabel: `${teamA.name ?? teamA.id} vs ${teamB.name ?? teamB.id}`,
      };
    });

    const work = mutations.createMany.mutateAsync({
      tournamentId,
      matches: payload,
    });
    void toast.promise(work, {
      loading: `Generating ${pairCount} random match${pairCount === 1 ? "" : "es"}…`,
      success: () =>
        leftOutTeam
          ? `Created ${pairCount} matches. ${leftOutTeam.name ?? "One team"} has no opponent this round.`
          : `Created ${pairCount} matches.`,
      error: "Could not auto-generate matches",
    });
    setAutoMatchPreviewOpen(false);
  }, [
    autoMatchPreview,
    mutations.createMany,
    tournamentEligible,
    tournamentId,
  ]);

  const updateAutoMatchPreviewRow = useCallback(
    (
      index: number,
      patch: Partial<Pick<AutoMatchPreviewRow, "round" | "order" | "bestOf">>,
    ) => {
      setAutoMatchPreview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          rows: prev.rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
        };
      });
    },
    [],
  );

  const updateAllAutoMatchPreviewRows = useCallback(
    (patch: Partial<Pick<AutoMatchPreviewRow, "round" | "bestOf">>) => {
      setAutoMatchPreview((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          rows: prev.rows.map((row) => ({ ...row, ...patch })),
        };
      });
    },
    [],
  );

  const autoPreviewRoundValue = useMemo(() => {
    if (!autoMatchPreview || autoMatchPreview.rows.length < 1) return "";
    const first = autoMatchPreview.rows[0]?.round ?? "";
    return autoMatchPreview.rows.every((row) => row.round === first)
      ? first
      : "-";
  }, [autoMatchPreview]);

  const autoPreviewBestOfValue = useMemo(() => {
    if (!autoMatchPreview || autoMatchPreview.rows.length < 1) return "";
    const first = autoMatchPreview.rows[0]?.bestOf ?? 3;
    return autoMatchPreview.rows.every((row) => row.bestOf === first)
      ? String(first)
      : "-";
  }, [autoMatchPreview]);

  return (
    <div className="flex flex-col gap-6">
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
            variant="outline"
            onClick={openAutoMatchesDialog}
            disabled={
              !tournamentEligible ||
              collectionMissing ||
              teamsForAutoMatches.length < 2 ||
              mutations.createMany.isPending
            }
          >
            <Shuffle className="size-4" />
            Auto matches
          </Button>
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
            <Skeleton className="block bg-transparent p-0 shadow-none ring-0">
              <FxAppMatchesTournamentSelect />
            </Skeleton>
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

      {tournamentId && tournamentEligible && !isError ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Age group category</CardTitle>
            <CardDescription>
              Toggle matches by team age bracket category.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant={matchesAgeCategory === "all" ? "default" : "outline"}
                onClick={() => setMatchesAgeCategory("all")}
              >
                All
              </Button>
              <Button
                type="button"
                size="sm"
                variant={matchesAgeCategory === "under18" ? "default" : "outline"}
                onClick={() => setMatchesAgeCategory("under18")}
              >
                Under 18
              </Button>
              <Button
                type="button"
                size="sm"
                variant={matchesAgeCategory === "18+" ? "default" : "outline"}
                onClick={() => setMatchesAgeCategory("18+")}
              >
                18 and above
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

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
      ) : !tournamentId ? null : tournamentEligible ? (
        matchesLoading ? (
          <Skeleton className="block bg-transparent p-0 shadow-none ring-0">
            <FxAppMatchesList />
          </Skeleton>
        ) : groupedMatches.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Swords className="size-4" />
            </EmptyMedia>
            <EmptyTitle>No matches in this category</EmptyTitle>
            <EmptyDescription>
              {matchesAgeCategory === "all"
                ? "Create matches for this tournament or seed them from your bracket tool."
                : "No matches currently fit this age-group category. Switch category or generate new matches."}
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
          <Button
            onClick={openAutoMatchesDialog}
            disabled={
              !tournamentEligible ||
              teamsForAutoMatches.length < 2 ||
              mutations.createMany.isPending
            }
          >
            <Shuffle className="size-4" />
            Auto matches
          </Button>
        </Empty>
          ) : (
        <div className="flex flex-col gap-6">
          {groupedMatches.map(([round, rows]) => (
            <div key={round}>
              <h2 className="mb-2 text-sm font-medium text-muted-foreground">
                {round}
              </h2>
              <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                {rows.map((m) => {
                  const st = getMatchStatusStyle(m.status);
                  const teamAName = teamName(m, "A");
                  const teamBName = teamName(m, "B");
                  return (
                    <div
                      key={m.id}
                      className="flex flex-col gap-2 px-3 py-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:gap-3"
                    >
                      <div className="min-w-0 flex-1 flex flex-col gap-1">
                        <p className="font-medium text-sm">
                          {m.matchLabel?.trim() ? (
                            m.matchLabel.trim()
                          ) : (
                            <span className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                              <span className="truncate text-right">
                                {teamAName}
                              </span>
                              <Badge
                                variant="outline"
                                className="h-5 px-1.5 text-[10px] tracking-wide uppercase"
                              >
                                VS
                              </Badge>
                              <span className="truncate text-left">
                                {teamBName}
                              </span>
                            </span>
                          )}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {(m.round?.trim() || "General") +
                            " · " +
                            `Order ${m.order ?? 0}` +
                            (m.bestOf != null ? ` · Bo${m.bestOf}` : "")}
                        </p>
                        {m.winner ? (
                          <p className="text-xs font-medium text-success">
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
                          onClick={() => setMatchStatsMatch(m)}
                          title="Add/edit match result stats"
                        >
                          <BarChart3 className="size-4" />
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
        )
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

      <MatchStatsDialog
        open={!!matchStatsMatch}
        onOpenChange={(o) => !o && setMatchStatsMatch(null)}
        match={matchStatsMatch}
        participants={participants ?? []}
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

      {isMobile ? (
        <Drawer open={autoMatchOpen} onOpenChange={setAutoMatchOpen} direction="bottom">
          <DrawerContent className="max-h-[85vh] flex w-full flex-col overflow-hidden">
            <DrawerHeader className="shrink-0 px-4 text-left">
              <DrawerTitle>Auto matches</DrawerTitle>
              <DrawerDescription>
                Pick an age bracket. Teams are included only if more than half of
                their members are in that bracket.
              </DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <div className="flex flex-col gap-2">
                <Label>Age bracket</Label>
                <RadioGroup
                  value={autoMatchBracket}
                  onValueChange={(v) =>
                    setAutoMatchBracket(v as AutoMatchBracket)
                  }
                  className="grid grid-cols-1 gap-3 sm:grid-cols-2"
                >
                  <Label
                    htmlFor="auto-bracket-under18"
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors",
                      autoMatchBracket === "under18"
                        ? "border-primary bg-primary/10"
                        : "border-input bg-transparent hover:bg-muted/40",
                    )}
                  >
                    <RadioGroupItem id="auto-bracket-under18" value="under18" />
                    <span className="flex flex-col leading-tight">
                      <span className="font-medium">Under 18</span>
                      <span className="text-sm text-muted-foreground">
                        Majority minors
                      </span>
                    </span>
                  </Label>
                  <Label
                    htmlFor="auto-bracket-18plus"
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors",
                      autoMatchBracket === "18+"
                        ? "border-primary bg-primary/10"
                        : "border-input bg-transparent hover:bg-muted/40",
                    )}
                  >
                    <RadioGroupItem id="auto-bracket-18plus" value="18+" />
                    <span className="flex flex-col leading-tight">
                      <span className="font-medium">18 and above</span>
                      <span className="text-sm text-muted-foreground">
                        Majority adults
                      </span>
                    </span>
                  </Label>
                </RadioGroup>
                <p className="text-xs text-muted-foreground">
                  Eligible teams: {autoMatchBracketTeams.length}. Teams without a
                  strict majority are skipped.
                </p>
              </div>
            </div>
            <DrawerFooter className="shrink-0 border-t border-border px-4 pt-3 pb-4">
              <Button
                onClick={openAutoMatchPreview}
                disabled={mutations.createMany.isPending || autoMatchBracketTeams.length < 2}
              >
                Preview matches
              </Button>
              <Button
                variant="outline"
                onClick={() => setAutoMatchOpen(false)}
                disabled={mutations.createMany.isPending}
              >
                Cancel
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={autoMatchOpen} onOpenChange={setAutoMatchOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Auto matches</DialogTitle>
              <DialogDescription>
                Pick an age bracket. Teams are included only if more than half of
                their members are in that bracket.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-2">
              <Label>Age bracket</Label>
              <RadioGroup
                value={autoMatchBracket}
                onValueChange={(v) =>
                  setAutoMatchBracket(v as AutoMatchBracket)
                }
                className="grid grid-cols-1 gap-3 sm:grid-cols-2"
              >
                <Label
                  htmlFor="auto-bracket-under18"
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors",
                    autoMatchBracket === "under18"
                      ? "border-primary bg-primary/10"
                      : "border-input bg-transparent hover:bg-muted/40",
                  )}
                >
                  <RadioGroupItem id="auto-bracket-under18" value="under18" />
                  <span className="flex flex-col leading-tight">
                    <span className="font-medium">Under 18</span>
                    <span className="text-sm text-muted-foreground">
                      Majority minors
                    </span>
                  </span>
                </Label>
                <Label
                  htmlFor="auto-bracket-18plus"
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-3 transition-colors",
                    autoMatchBracket === "18+"
                      ? "border-primary bg-primary/10"
                      : "border-input bg-transparent hover:bg-muted/40",
                  )}
                >
                  <RadioGroupItem id="auto-bracket-18plus" value="18+" />
                  <span className="flex flex-col leading-tight">
                    <span className="font-medium">18 and above</span>
                    <span className="text-sm text-muted-foreground">
                      Majority adults
                    </span>
                  </span>
                </Label>
              </RadioGroup>
              <p className="text-xs text-muted-foreground">
                Eligible teams: {autoMatchBracketTeams.length}. Teams without a
                strict majority are skipped.
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAutoMatchOpen(false)}
                disabled={mutations.createMany.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={openAutoMatchPreview}
                disabled={mutations.createMany.isPending || autoMatchBracketTeams.length < 2}
              >
                Preview matches
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {isMobile ? (
        <Drawer
          open={autoMatchPreviewOpen}
          onOpenChange={setAutoMatchPreviewOpen}
          direction="bottom"
        >
          <DrawerContent className="flex max-h-[92vh] w-full flex-col overflow-hidden">
            <DrawerHeader className="shrink-0 px-4 text-left">
              <DrawerTitle>Auto match preview</DrawerTitle>
              <DrawerDescription>
                Review the generated pairings before creating matches.
              </DrawerDescription>
            </DrawerHeader>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              {!autoMatchPreview ? (
                <p className="text-sm text-muted-foreground">No preview available.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-2 rounded-lg border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Round (apply to all)
                      </Label>
                      <Input
                        value={autoPreviewRoundValue}
                        onChange={(e) =>
                          updateAllAutoMatchPreviewRows({
                            round: e.target.value,
                          })
                        }
                        placeholder="Round 1"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Best of (apply to all)
                      </Label>
                      <Input
                        inputMode="numeric"
                        value={autoPreviewBestOfValue}
                        onChange={(e) => {
                          const next = e.target.value.trim();
                          if (next === "-" || next === "") return;
                          const parsed = Number.parseInt(next, 10);
                          if (!Number.isFinite(parsed)) return;
                          updateAllAutoMatchPreviewRows({
                            bestOf: Math.max(1, parsed),
                          });
                        }}
                        placeholder="3"
                      />
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border/70 divide-y divide-border">
                    {autoMatchPreview.rows.map((row, index) => (
                      <div
                        key={`${row.teamA.id}-${row.teamB.id}-${index}`}
                        className="flex flex-col gap-3 px-3 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            M{index + 1}
                          </Badge>
                          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-sm">
                            <span className="truncate text-right font-medium">
                              {row.teamA.name ?? row.teamA.id}
                            </span>
                            <Badge
                              variant="outline"
                              className="h-6 px-2 text-[10px] tracking-wide uppercase text-muted-foreground"
                            >
                              VS
                            </Badge>
                            <span className="truncate text-left font-medium">
                              {row.teamB.name ?? row.teamB.id}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div className="flex flex-col gap-1">
                            <Label className="text-xs text-muted-foreground">
                              Round
                            </Label>
                            <Input
                              value={row.round}
                              onChange={(e) =>
                                updateAutoMatchPreviewRow(index, {
                                  round: e.target.value,
                                })
                              }
                              placeholder="Round 1"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label className="text-xs text-muted-foreground">
                              Order
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              value={String(row.order)}
                              onChange={(e) =>
                                updateAutoMatchPreviewRow(index, {
                                  order: Number.parseInt(e.target.value, 10) || 1,
                                })
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label className="text-xs text-muted-foreground">
                              Best of
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              value={String(row.bestOf)}
                              onChange={(e) =>
                                updateAutoMatchPreviewRow(index, {
                                  bestOf: Number.parseInt(e.target.value, 10) || 1,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {autoMatchPreview.leftOut ? (
                    <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Unpaired team:</span>{" "}
                      <span className="font-medium">
                        {autoMatchPreview.leftOut.name ?? autoMatchPreview.leftOut.id}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <DrawerFooter className="shrink-0 border-t border-border px-4 pt-3 pb-4">
              <Button
                onClick={handleAutoMatches}
                disabled={
                  mutations.createMany.isPending ||
                  !autoMatchPreview ||
                  autoMatchPreview.rows.length < 1
                }
              >
                {mutations.createMany.isPending ? "Generating…" : "Confirm & generate"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAutoMatchPreview(buildAutoMatchPreview(autoMatchBracket))}
                disabled={mutations.createMany.isPending}
              >
                <Shuffle className="size-4" />
                Shuffle
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setAutoMatchPreviewOpen(false);
                  setAutoMatchOpen(true);
                }}
                disabled={mutations.createMany.isPending}
              >
                Back
              </Button>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={autoMatchPreviewOpen} onOpenChange={setAutoMatchPreviewOpen}>
          <DialogContent className="flex max-h-[min(90vh,720px)] flex-col overflow-hidden sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>Auto match preview</DialogTitle>
              <DialogDescription>
                Review the generated pairings before creating matches.
              </DialogDescription>
            </DialogHeader>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {!autoMatchPreview ? (
                <p className="text-sm text-muted-foreground">No preview available.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 gap-2 rounded-lg border border-border/70 bg-muted/20 p-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Round (apply to all)
                      </Label>
                      <Input
                        value={autoPreviewRoundValue}
                        onChange={(e) =>
                          updateAllAutoMatchPreviewRows({
                            round: e.target.value,
                          })
                        }
                        placeholder="Round 1"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-xs text-muted-foreground">
                        Best of (apply to all)
                      </Label>
                      <Input
                        inputMode="numeric"
                        value={autoPreviewBestOfValue}
                        onChange={(e) => {
                          const next = e.target.value.trim();
                          if (next === "-" || next === "") return;
                          const parsed = Number.parseInt(next, 10);
                          if (!Number.isFinite(parsed)) return;
                          updateAllAutoMatchPreviewRows({
                            bestOf: Math.max(1, parsed),
                          });
                        }}
                        placeholder="3"
                      />
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-border/70 divide-y divide-border">
                    {autoMatchPreview.rows.map((row, index) => (
                      <div
                        key={`${row.teamA.id}-${row.teamB.id}-${index}`}
                        className="flex flex-col gap-3 px-3 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="font-mono text-xs">
                            M{index + 1}
                          </Badge>
                          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 text-sm">
                            <span className="truncate text-right font-medium">
                              {row.teamA.name ?? row.teamA.id}
                            </span>
                            <Badge
                              variant="outline"
                              className="h-6 px-2 text-[10px] tracking-wide uppercase text-muted-foreground"
                            >
                              VS
                            </Badge>
                            <span className="truncate text-left font-medium">
                              {row.teamB.name ?? row.teamB.id}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <div className="flex flex-col gap-1">
                            <Label className="text-xs text-muted-foreground">
                              Round
                            </Label>
                            <Input
                              value={row.round}
                              onChange={(e) =>
                                updateAutoMatchPreviewRow(index, {
                                  round: e.target.value,
                                })
                              }
                              placeholder="Round 1"
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label className="text-xs text-muted-foreground">
                              Order
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              value={String(row.order)}
                              onChange={(e) =>
                                updateAutoMatchPreviewRow(index, {
                                  order: Number.parseInt(e.target.value, 10) || 1,
                                })
                              }
                            />
                          </div>
                          <div className="flex flex-col gap-1">
                            <Label className="text-xs text-muted-foreground">
                              Best of
                            </Label>
                            <Input
                              type="number"
                              min={1}
                              value={String(row.bestOf)}
                              onChange={(e) =>
                                updateAutoMatchPreviewRow(index, {
                                  bestOf: Number.parseInt(e.target.value, 10) || 1,
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {autoMatchPreview.leftOut ? (
                    <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2 text-sm">
                      <span className="text-muted-foreground">Unpaired team:</span>{" "}
                      <span className="font-medium">
                        {autoMatchPreview.leftOut.name ?? autoMatchPreview.leftOut.id}
                      </span>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setAutoMatchPreviewOpen(false);
                  setAutoMatchOpen(true);
                }}
                disabled={mutations.createMany.isPending}
              >
                Back
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAutoMatchPreview(buildAutoMatchPreview(autoMatchBracket))}
                disabled={mutations.createMany.isPending}
              >
                <Shuffle className="size-4" />
                Shuffle
              </Button>
              <Button
                onClick={handleAutoMatches}
                disabled={
                  mutations.createMany.isPending ||
                  !autoMatchPreview ||
                  autoMatchPreview.rows.length < 1
                }
              >
                {mutations.createMany.isPending ? "Generating…" : "Confirm & generate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
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
  const isMobile = useIsMobile();
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

  const formBody = (
    <>
      <div className="flex flex-col gap-2">
        <Label htmlFor="m-label">Label</Label>
        <Input
          id="m-label"
          value={matchLabel}
          onChange={(e) => setMatchLabel(e.target.value)}
          placeholder="e.g. Upper bracket — semifinal"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="m-round">Round</Label>
          <Input
            id="m-round"
            value={round}
            onChange={(e) => setRound(e.target.value)}
            placeholder="Round 1"
          />
        </div>
        <div className="flex flex-col gap-2">
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

      <div className="flex flex-col gap-2">
        <Label htmlFor="m-bo">Best of</Label>
        <Input
          id="m-bo"
          type="number"
          min={1}
          value={bestOf}
          onChange={(e) => setBestOf(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-4">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Teams
        </p>
        <div className="flex flex-col gap-2">
          <Label>Team A</Label>
          <Select
            value={teamA || "__none__"}
            onValueChange={(v) => setTeamA(v === "__none__" || v == null ? "" : v)}
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
            <SelectContent disablePortal={isMobile}>
              <SelectGroup>
                <SelectItem value="__none__">TBD</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name ?? t.id}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <Label>Team B</Label>
          <Select
            value={teamB || "__none__"}
            onValueChange={(v) => setTeamB(v === "__none__" || v == null ? "" : v)}
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
            <SelectContent disablePortal={isMobile}>
              <SelectGroup>
                <SelectItem value="__none__">TBD</SelectItem>
                {teams.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name ?? t.id}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {initial ? (
        <div className="flex flex-col gap-2 border-t border-border pt-4">
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
            <SelectContent disablePortal={isMobile}>
              <SelectGroup>
                {MATCH_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 border-t border-border pt-4">
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
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
        <DrawerContent className="flex max-h-[92vh] w-full flex-col overflow-hidden">
          <DrawerHeader className="shrink-0 px-4 text-left">
            <DrawerTitle>{initial ? "Edit match" : "Add match"}</DrawerTitle>
            <DrawerDescription>
              {initial
                ? "Bracket slot, teams, and schedule metadata. Use the medal button on the list for scores and winner."
                : "Create a bracket row for the selected tournament."}
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex flex-col gap-5">{formBody}</div>
          </div>
          <DrawerFooter className="shrink-0 border-t border-border px-4 pt-3 pb-4">
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : initial ? "Save" : "Create"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
        <DialogHeader className="flex flex-col gap-1 border-b border-border px-6 py-4 text-left">
          <DialogTitle>{initial ? "Edit match" : "Add match"}</DialogTitle>
          <DialogDescription>
            {initial
              ? "Bracket slot, teams, and schedule metadata. Use the medal button on the list for scores and winner."
              : "Create a bracket row for the selected tournament."}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 flex flex-col gap-5 overflow-y-auto px-6 py-4">
          {formBody}
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
  const isMobile = useIsMobile();
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
  const bestOfLimit = match?.bestOf ?? 0;
  const headline =
    match?.matchLabel?.trim() ||
    (match ? `${teamALabel} vs ${teamBLabel}` : "");

  const handleSave = () => {
    if (isSubmitting) return;
    const parsedScoreA = Math.max(0, Number.parseInt(scoreA, 10) || 0);
    const parsedScoreB = Math.max(0, Number.parseInt(scoreB, 10) || 0);
    if (
      bestOfLimit > 0 &&
      (parsedScoreA > bestOfLimit || parsedScoreB > bestOfLimit)
    ) {
      toast.error(`Score cannot exceed Best of ${bestOfLimit}`);
      return;
    }
    onSubmit({
      scoreA: parsedScoreA,
      scoreB: parsedScoreB,
      winner: winner || undefined,
      status: "completed",
    });
  };

  const resultsBody = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="r-sa">{teamALabel} — wins</Label>
          <Input
            id="r-sa"
            type="number"
            min={0}
            max={bestOfLimit > 0 ? bestOfLimit : undefined}
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="r-sb">{teamBLabel} — wins</Label>
          <Input
            id="r-sb"
            type="number"
            min={0}
            max={bestOfLimit > 0 ? bestOfLimit : undefined}
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Winner</Label>
        <Select
          value={winner || "__none__"}
          onValueChange={(v) => setWinner(v === "__none__" || v == null ? "" : v)}
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
          <SelectContent disablePortal={isMobile}>
            <SelectGroup>
              <SelectItem value="__none__">None</SelectItem>
              {match?.teamA ? (
                <SelectItem value={match.teamA}>{teamALabel}</SelectItem>
              ) : null}
              {match?.teamB ? (
                <SelectItem value={match.teamB}>{teamBLabel}</SelectItem>
              ) : null}
            </SelectGroup>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Only the two sides in this match are listed. Clear winner with
          &quot;None&quot;.
        </p>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} direction="bottom">
        <DrawerContent className="flex max-h-[85vh] w-full flex-col overflow-hidden">
          <DrawerHeader className="shrink-0 px-4 text-left">
            <DrawerTitle>Score & winner</DrawerTitle>
            <DrawerDescription className="line-clamp-2">
              {headline || "Match result"}
            </DrawerDescription>
          </DrawerHeader>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            <div className="flex flex-col gap-5">{resultsBody}</div>
          </div>
          <DrawerFooter className="shrink-0 border-t border-border px-4 pt-3 pb-4">
            <Button onClick={handleSave} disabled={isSubmitting || !match}>
              {isSubmitting ? "Saving…" : "Save result"}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,560px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="flex flex-col gap-1 border-b border-border px-6 py-4 text-left">
          <DialogTitle>Score & winner</DialogTitle>
          <DialogDescription className="line-clamp-2">
            {headline || "Match result"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5 px-6 py-4">{resultsBody}</div>
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

function MatchStatsDialog({
  open,
  onOpenChange,
  match,
  participants,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: MatchRecord | null;
  participants: Collections["participants"][];
}) {
  const mutations = useMatchResultMutations();
  const { data: matchResults, isLoading } = useMatchResultsForMatch(match?.id, {
    enabled: open,
  });
  const headline =
    match?.matchLabel?.trim() ||
    (match ? `${teamName(match, "A")} vs ${teamName(match, "B")}` : "");
  const [rows, setRows] = useState<
    Array<{
      playerId: string;
      playerLabel: string;
      teamLabel: string;
      resultId?: string;
      lane: string;
      kda: string;
      rating: string;
      gold: string;
      isEditing: boolean;
      dirty: boolean;
    }>
  >([]);
  const [isSaving, setIsSaving] = useState(false);

  const laneLabelByValue = useMemo(
    () =>
      new Map(
        MATCH_RESULT_LANES.map((laneOption) => [laneOption.value, laneOption.label]),
      ),
    [],
  );

  const initialRows = useMemo(() => {
    if (!match) return [];
    const matchedTeamIds = new Set([match.teamA, match.teamB].filter(Boolean));
    const resultsByPlayer = new Map(
      (matchResults ?? [])
        .filter((result) => Boolean(result.player))
        .map((result) => [result.player as string, result]),
    );

    return [...participants]
      .filter(
        (p) =>
          p.archived !== true &&
          matchedTeamIds.size > 0 &&
          Boolean(p.team) &&
          matchedTeamIds.has(p.team),
      )
      .sort((a, b) => {
        const gameA = a.gameID?.trim() ?? "";
        const gameB = b.gameID?.trim() ?? "";
        const byGameId = gameA.localeCompare(gameB);
        if (byGameId !== 0) return byGameId;
        return (a.name?.trim() ?? "").localeCompare(b.name?.trim() ?? "");
      })
      .map((participant) => {
        const existing = resultsByPlayer.get(participant.id);
        const gameId = participant.gameID?.trim();
        const name = participant.name?.trim();
        const playerLabel =
          gameId && name ? `${gameId} - ${name}` : gameId || name || participant.id;
        return {
          playerId: participant.id,
          playerLabel,
          teamLabel:
            participant.team === match.teamA
              ? teamName(match, "A")
              : participant.team === match.teamB
                ? teamName(match, "B")
                : participant.team ?? "-",
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
            existing?.accumulated_gold != null ? String(existing.accumulated_gold) : "",
          isEditing: false,
          dirty: false,
        };
      });
  }, [match, matchResults, participants]);

  useEffect(() => {
    if (!open) return;
    setRows(initialRows);
  }, [open, initialRows]);

  const hasDirtyRows = rows.some((row) => row.dirty);
  const groupedRows = useMemo(() => {
    const grouped = new Map<string, typeof rows>();
    for (const row of rows) {
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
  }, [rows, match]);

  const updateRow = (
    playerId: string,
    patch: Partial<(typeof rows)[number]>,
    markDirty = true,
  ) => {
    setRows((prev) =>
      prev.map((row) =>
        row.playerId === playerId
          ? { ...row, ...patch, dirty: markDirty ? true : row.dirty }
          : row,
      ),
    );
  };

  const parseKda = (
    value: string,
  ): { kills?: number; deaths?: number; assists?: number } | null => {
    const text = value.trim();
    if (!text) return {};
    const parts = text.split("/").map((part) => part.trim());
    if (parts.length !== 3) return null;
    const [kills, deaths, assists] = parts.map((part) => Number.parseInt(part, 10));
    if ([kills, deaths, assists].some((n) => Number.isNaN(n) || n < 0)) {
      return null;
    }
    return { kills, deaths, assists };
  };

  const normalizeKdaInput = (value: string) => {
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
  };

  const normalizeIntegerInput = (value: string) => value.replace(/\D+/g, "");

  const normalizeDecimalInput = (value: string) => {
    const cleaned = value.replace(/[^\d.]/g, "");
    const [whole, ...rest] = cleaned.split(".");
    if (rest.length < 1) return whole;
    return `${whole}.${rest.join("")}`;
  };

  const handleSubmit = async () => {
    if (!match || isSaving) return;
    const changedRowsByTeam = groupedRows
      .map((group) => ({
        team: group.team,
        rows: group.players.filter((row) => row.dirty),
      }))
      .filter((group) => group.rows.length > 0);
    const changedRows = changedRowsByTeam.flatMap((group) => group.rows);
    if (changedRows.length < 1) {
      toast.message("No edited players to submit");
      return;
    }

    setIsSaving(true);
    let savedCount = 0;
    try {
      const createdIds = new Map<string, string>();
      for (const group of changedRowsByTeam) {
        for (const row of group.rows) {
          const kda = parseKda(row.kda);
          if (!kda) {
            throw new Error(`Invalid KDA for ${row.playerLabel}. Use k/d/a format.`);
          }

          const parsedRating =
            row.rating.trim() === "" ? undefined : Number.parseFloat(row.rating);
          if (parsedRating != null && Number.isNaN(parsedRating)) {
            throw new Error(`Invalid performance rating for ${row.playerLabel}.`);
          }

          const parsedGold =
            row.gold.trim() === ""
              ? undefined
              : Math.max(0, Number.parseInt(row.gold, 10) || 0);

          const payload: Partial<Collections["match_result"]> = {
            match: match.id,
            player: row.playerId,
            lane: (row.lane || undefined) as Collections["match_result"]["lane"] | undefined,
            kills: kda.kills,
            deaths: kda.deaths,
            assists: kda.assists,
            game_performance_rating: parsedRating,
            accumulated_gold: parsedGold,
          };

          if (row.resultId) {
            await mutations.update.mutateAsync({ id: row.resultId, ...payload });
          } else {
            const created = await mutations.create.mutateAsync(payload);
            createdIds.set(row.playerId, created.id);
          }
          savedCount += 1;
        }
      }

      setRows((prev) =>
        prev.map((row) => {
          if (!row.dirty) return row;
          return {
            ...row,
            resultId: row.resultId ?? createdIds.get(row.playerId),
            isEditing: false,
            dirty: false,
          };
        }),
      );

      toast.success(`Saved ${savedCount} player result${savedCount > 1 ? "s" : ""}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not submit results");
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
          {isLoading ? (
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
              {[
                "row-1",
                "row-2",
                "row-3",
                "row-4",
                "row-5",
                "row-6",
                "row-7",
                "row-8",
              ].map((rowKey) => (
                <div
                  key={`match-stats-skeleton-${rowKey}`}
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
            <div className="rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
              No players found for this match. Assign teams and team members first.
            </div>
          ) : (
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
                        className="py-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground"
                      >
                        {group.team}
                      </TableCell>
                    </TableRow>
                    {group.players.map((row) => (
                      <TableRow key={row.playerId}>
                        <TableCell className="font-medium">{row.playerLabel}</TableCell>
                        <TableCell>{row.teamLabel}</TableCell>
                        <TableCell>
                          <Select
                            value={row.lane || "__none__"}
                            onValueChange={(value) =>
                              updateRow(row.playerId, {
                                lane:
                                  value === "__none__" || value == null
                                    ? ""
                                    : value,
                              })
                            }
                            disabled={!row.isEditing}
                          >
                            <SelectTrigger className="h-8 min-w-[124px]">
                              <SelectValue placeholder="Lane">
                                {(value) =>
                                  value && value !== "__none__"
                                    ? (laneLabelByValue.get(
                                        value as NonNullable<
                                          Collections["match_result"]["lane"]
                                        >,
                                      ) ?? value)
                                    : "None"
                                }
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectGroup>
                                <SelectItem value="__none__">None</SelectItem>
                                {MATCH_RESULT_LANES.map((laneOption) => (
                                  <SelectItem key={laneOption.value} value={laneOption.value}>
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
                              updateRow(row.playerId, {
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
                            updateRow(row.playerId, { kda: nextValue });
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
                              updateRow(row.playerId, {
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
                              updateRow(row.playerId, {
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
                              updateRow(row.playerId, { isEditing: !row.isEditing }, false)
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
            onClick={handleSubmit}
            disabled={!match || isSaving || !hasDirtyRows}
          >
            {isSaving ? "Submitting one by one..." : "Submit player results"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
