import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, RotateCcw, Swords } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMatchMutations } from "@/hooks/use-match-mutations";
import {
  type MatchRecord,
  useArchivedMatchesForTournament,
} from "@/hooks/use-matches";
import { useTournaments } from "@/hooks/use-tournaments";
import { humanizeSlug } from "@/lib/humanize-slug";
import { getMatchStatusStyle } from "@/lib/match-status";
import { cn } from "@/lib/utils";
import type { Collections } from "@/types/pocketbase-types";
import { ClientResponseError } from "pocketbase";

export const Route = createFileRoute("/app/$id/matches/archived")({
  component: ArchivedMatchesPage,
});

function formatArchivedAt(iso?: string) {
  if (!iso) return "—";
  try {
    return format(new Date(iso), "MMM d, yyyy HH:mm");
  } catch {
    return iso;
  }
}

function teamName(m: MatchRecord, side: "A" | "B"): string {
  const key = side === "A" ? "teamA" : "teamB";
  const id = side === "A" ? m.teamA : m.teamB;
  const expanded = m.expand?.[key];
  return expanded?.name ?? id ?? "TBD";
}

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

function ArchivedMatchesPage() {
  const params = useParams({ strict: false });
  const appId = (params as { id?: string })?.id ?? "";
  const { data: tournaments, isLoading: tournamentsLoading } = useTournaments();
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
    data: archivedMatches,
    isLoading: matchesLoading,
    isError,
    error,
  } = useArchivedMatchesForTournament(tournamentId || undefined, {
    enabled: tournamentEligible,
  });
  const mutations = useMatchMutations();

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

  const tournamentIds = useMemo(
    () => sortedTournaments.map((t) => t.id),
    [sortedTournaments],
  );

  const handleRestore = (matchId: string) => {
    mutations.restore.mutate(matchId, {
      onSuccess: () => toast.success("Match restored"),
      onError: () => toast.error("Could not restore match"),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 space-y-1">
          <Link
            to="/app/$id/matches"
            params={{ id: appId }}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "-ml-2 gap-2",
            )}
          >
            <ArrowLeft className="size-4 shrink-0" aria-hidden />
            Back to matches
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Archived matches
          </h1>
          <p className="text-muted-foreground">
            Soft-deleted matches for the selected tournament. Archived time uses
            last modified (<code className="text-xs">updated</code>).
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tournament</CardTitle>
          <CardDescription>
            Choose which event&apos;s archived matches to list.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tournamentsLoading ? (
            <Skeleton className="h-9 w-full max-w-sm" />
          ) : sortedTournaments.length === 0 ? (
            <p className="text-sm text-muted-foreground">Add a tournament first.</p>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Swords className="size-5 text-muted-foreground" />
            Archived list
          </CardTitle>
          <CardDescription>
            {!tournamentEligible
              ? "—"
              : matchesLoading
                ? "Loading…"
                : `${archivedMatches?.length ?? 0} archived`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError ? (
            <p className="font-mono text-xs text-destructive">{errMsg}</p>
          ) : tournamentId && !tournamentEligible ? (
            <p className="text-sm text-muted-foreground">
              This tournament is archived or no longer in your list. Select
              another tournament above.
            </p>
          ) : !tournamentId ? null : tournamentEligible && matchesLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : tournamentEligible && !archivedMatches?.length ? (
            <p className="text-sm text-muted-foreground">
              No archived matches for this tournament.
            </p>
          ) : tournamentEligible ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Match</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Archived (last modified)</TableHead>
                    <TableHead className="w-[120px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivedMatches.map((m) => {
                    const st = getMatchStatusStyle(m.status);
                    const headline =
                      m.matchLabel?.trim() ||
                      `${teamName(m, "A")} vs ${teamName(m, "B")}`;
                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">
                          <span className="line-clamp-2">{headline}</span>
                          <span className="mt-0.5 block text-xs font-normal text-muted-foreground">
                            {teamName(m, "A")} · {teamName(m, "B")}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono tabular-nums text-sm">
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
                        <TableCell className="text-muted-foreground tabular-nums text-sm">
                          {formatArchivedAt(m.updated)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            disabled={mutations.restore.isPending}
                            onClick={() => handleRestore(m.id)}
                          >
                            <RotateCcw className="size-4 shrink-0" aria-hidden />
                            Restore
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
