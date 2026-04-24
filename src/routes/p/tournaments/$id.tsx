import { PublicPageHeader } from "@/components/public/public-page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  type MatchResultRecord,
  useMatchResultsForMatch,
} from "@/hooks/use-match-results";
import {
  type MatchRecord,
  useMatchesForTournament,
} from "@/hooks/use-matches";
import { usePublicTournaments } from "@/hooks/use-tournaments";
import { getMatchStatusStyle } from "@/lib/match-status";
import { LANE_ICON_SRC, LANE_ROLE_LABELS } from "@/lib/lane-role-icons";
import { tournamentLabel } from "@/lib/tournament-label";
import { cn } from "@/lib/utils";
import { createFileRoute, Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowLeft, Crown, Swords } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/p/tournaments/$id")({
  component: TournamentMatchesPage,
});

type LaneKey = NonNullable<MatchResultRecord["lane"]>;

const LANE_ORDER: LaneKey[] = ["gold", "exp", "mid", "jungle", "support"];
const LANE_LABEL: Record<LaneKey, string> = {
  gold: "Gold", exp: "Exp", mid: "Mid", jungle: "Jungle", support: "Support",
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

function formatScheduled(iso: string | undefined) {
  if (!iso) return null;
  try {
    return format(new Date(iso), "MMM d, yyyy · h:mm a");
  } catch {
    return null;
  }
}

function kda(r: MatchResultRecord): string {
  if (r.kills == null && r.deaths == null && r.assists == null) return "—";
  const k = r.kills ?? 0;
  const d = Math.max(1, r.deaths ?? 0);
  const a = r.assists ?? 0;
  return ((k + a) / d).toFixed(2);
}

function playerLabel(r: MatchResultRecord): string {
  const p = r.expand?.player;
  if (!p) return "Unknown";
  const gameId = p.gameID?.trim();
  const name = p.name?.trim();
  if (gameId && name) return `${gameId} · ${name}`;
  return gameId || name || "Unknown";
}

/* ── Match result sheet ──────────────────────────────────────── */

function MatchResultModal({
  match,
  open,
  onOpenChange,
}: {
  match: MatchRecord | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: results, isLoading } = useMatchResultsForMatch(
    match?.id,
    { enabled: open && Boolean(match?.id) },
  );

  const tA = match ? teamName(match, "A") : "";
  const tB = match ? teamName(match, "B") : "";
  const win = match ? winnerName(match) : "";

  const byTeam = useMemo(() => {
    if (!match || !results) return { a: [] as MatchResultRecord[], b: [] as MatchResultRecord[] };
    const sort = (rows: MatchResultRecord[]) =>
      [...rows].sort((x, y) => {
        const li = LANE_ORDER.indexOf(x.lane as LaneKey);
        const lj = LANE_ORDER.indexOf(y.lane as LaneKey);
        return (li === -1 ? 99 : li) - (lj === -1 ? 99 : lj);
      });
    const aIds = new Set(
      results
        .filter((r) => r.expand?.player?.team === match.teamA)
        .map((r) => r.id),
    );
    const a = sort(results.filter((r) => aIds.has(r.id)));
    const b = sort(results.filter((r) => !aIds.has(r.id)));
    return { a, b };
  }, [results, match]);

  const hasResults = (byTeam.a.length + byTeam.b.length) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] w-full max-w-[calc(100%-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-border/50 px-6 pt-6 pb-4">
          <DialogTitle className="font-serif text-xl pr-6">
            {match?.matchLabel?.trim() || "Match Results"}
          </DialogTitle>
          {match && (
            <DialogDescription className="flex flex-wrap items-center gap-3 pt-1">
              <span className={cn("font-medium text-sm", win === tA && "text-primary")}>{tA}</span>
              <span className="font-mono text-muted-foreground text-sm">
                {match.scoreA ?? 0} : {match.scoreB ?? 0}
              </span>
              <span className={cn("font-medium text-sm", win === tB && "text-primary")}>{tB}</span>
              {win && (
                <span className="flex items-center gap-1.5 text-primary text-xs">
                  <Crown className="size-3" aria-hidden />
                  {win} wins
                </span>
              )}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {isLoading ? (
            <div className="flex min-h-[16vh] flex-col items-center justify-center gap-3">
              <Spinner className="size-6 text-primary" />
              <p className="text-sm text-muted-foreground">Loading results…</p>
            </div>
          ) : !hasResults ? (
            <div className="flex min-h-[16vh] flex-col items-center justify-center gap-2 text-center">
              <p className="text-sm text-muted-foreground">No player results recorded for this match yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {([["a", tA], ["b", tB]] as const).map(([side, name]) => {
                const rows = byTeam[side];
                if (!rows.length) return null;
                const isWinner = win && win === name;
                return (
                  <div key={side} className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className={cn("font-serif text-base font-medium", isWinner && "text-primary")}>
                        {name}
                      </span>
                      {isWinner && <Crown className="size-3.5 text-primary" aria-hidden />}
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
                            <TableHead className="text-right pr-4">Gold</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rows.map((r) => (
                            <TableRow key={r.id} className="border-border/30">
                              <TableCell className="pl-4 font-medium text-sm">{playerLabel(r)}</TableCell>
                              <TableCell>
                                {r.lane ? (
                                  <div className="flex items-center gap-1.5">
                                    <img
                                      src={LANE_ICON_SRC[r.lane as LaneKey]}
                                      alt={LANE_ROLE_LABELS[r.lane as LaneKey]}
                                      className="size-4 shrink-0"
                                    />
                                    <span className="font-mono text-xs text-muted-foreground">
                                      {LANE_LABEL[r.lane as LaneKey]}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{r.kills ?? "—"}</TableCell>
                              <TableCell className="text-right tabular-nums">{r.deaths ?? "—"}</TableCell>
                              <TableCell className="text-right tabular-nums">{r.assists ?? "—"}</TableCell>
                              <TableCell className="text-right tabular-nums font-mono text-xs">{kda(r)}</TableCell>
                              <TableCell className="text-right tabular-nums">
                                {r.game_performance_rating != null ? r.game_performance_rating.toFixed(1) : "—"}
                              </TableCell>
                              <TableCell className="text-right tabular-nums pr-4 text-muted-foreground text-xs">
                                {r.accumulated_gold != null ? Math.round(r.accumulated_gold).toLocaleString() : "—"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ── Page ───────────────────────────────────────────────────── */

function TournamentMatchesPage() {
  const { id } = Route.useParams();
  const { data: tournaments, isLoading: tournamentsLoading } =
    usePublicTournaments();
  const [selectedMatch, setSelectedMatch] = useState<MatchRecord | null>(null);

  const tournament = useMemo(
    () => (tournaments ?? []).find((t) => t.id === id),
    [tournaments, id],
  );

  const eligible = Boolean(tournament) && tournament?.archived !== true;

  const {
    data: matches,
    isLoading: matchesLoading,
    isError,
    error,
  } = useMatchesForTournament(id, { enabled: eligible });

  const matchesByRound = useMemo(() => {
    const rows = matches ?? [];
    const map = new Map<string, MatchRecord[]>();
    for (const m of rows) {
      const key = m.round?.trim() || "Bracket";
      const bucket = map.get(key);
      if (bucket) bucket.push(m);
      else map.set(key, [m]);
    }
    return [...map.entries()].sort(([a], [b]) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );
  }, [matches]);

  const backLink = (
    <Link
      to="/p/tournaments"
      className="flex w-fit items-center gap-1.5 font-mono text-[0.7rem] uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="size-3 shrink-0" aria-hidden />
      All Tournaments
    </Link>
  );

  if (tournamentsLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-8 text-primary" />
        <p className="text-muted-foreground text-sm">Loading…</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="flex flex-col gap-6">
        {backLink}
        <Empty className="min-h-[40vh] border border-dashed">
          <EmptyHeader>
            <EmptyTitle>Tournament not found</EmptyTitle>
            <EmptyDescription>
              This tournament doesn't exist or is no longer available.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-10">
        {backLink}

        <PublicPageHeader
          eyebrow={tournamentLabel(tournament)}
          title="Matches"
          description="Tap any match card to view player results."
          icon={Swords}
        />

        {!eligible ? (
          <p className="text-muted-foreground text-sm">
            This tournament is not available for public match listing.
          </p>
        ) : matchesLoading ? (
          <div className="flex min-h-[30vh] flex-col items-center justify-center gap-3">
            <Spinner className="size-8 text-primary" />
            <p className="text-muted-foreground text-sm">Loading matches…</p>
          </div>
        ) : isError ? (
          <Empty className="border border-dashed border-destructive/30 bg-destructive/5">
            <EmptyHeader>
              <EmptyTitle>Could not load matches</EmptyTitle>
              <EmptyDescription>
                {error instanceof Error ? error.message : "Something went wrong."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : !(matches ?? []).length ? (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyTitle>No matches yet</EmptyTitle>
              <EmptyDescription>
                Schedule rows will appear here once they are added.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="flex flex-col gap-10">
            {matchesByRound.map(([roundLabel, roundMatches]) => (
              <section key={roundLabel} className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <span className="font-serif text-xl tracking-tight sm:text-2xl">
                    {roundLabel}
                  </span>
                  <span className="h-px flex-1 bg-linear-to-r from-border to-transparent" />
                  <span className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-wider">
                    {roundMatches.length} match
                    {roundMatches.length === 1 ? "" : "es"}
                  </span>
                </div>
                <ul className="flex flex-col gap-3">
                  {roundMatches.map((m) => {
                    const st = getMatchStatusStyle(m.status);
                    const scheduled = formatScheduled(m.scheduledAt);
                    const scoreKnown =
                      m.status === "completed" ||
                      m.status === "walkover" ||
                      typeof m.scoreA === "number" ||
                      typeof m.scoreB === "number";
                    const scoreA = m.scoreA ?? 0;
                    const scoreB = m.scoreB ?? 0;
                    const win = winnerName(m);
                    const tA = teamName(m, "A");
                    const tB = teamName(m, "B");

                    return (
                      <li key={m.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedMatch(m)}
                          className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-2xl"
                        >
                          <Card className="overflow-hidden border-border/80 bg-card/50 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/20 cursor-pointer">
                            <CardHeader className="pb-2">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <CardTitle className="font-serif text-lg">
                                    {m.matchLabel?.trim() || "Match"}
                                  </CardTitle>
                                  {scheduled ? (
                                    <CardDescription className="font-mono text-xs tracking-wide">
                                      {scheduled}
                                    </CardDescription>
                                  ) : null}
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "shrink-0 font-mono text-[0.65rem] uppercase tracking-wider",
                                    st.className,
                                  )}
                                >
                                  {st.label}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="flex flex-col gap-3">
                              <div className="flex flex-wrap items-stretch justify-between gap-3 rounded-2xl border border-border/60 bg-muted/25 p-3 sm:items-center">
                                <span
                                  className={cn(
                                    "min-w-0 flex-1 self-center font-medium leading-snug",
                                    win && win === tA && "text-primary",
                                  )}
                                >
                                  {tA}
                                </span>
                                {scoreKnown ? (
                                  <span className="flex shrink-0 items-center gap-2 rounded-xl border border-border/70 bg-background/80 px-4 py-2 font-mono text-lg tabular-nums tracking-tight shadow-inner">
                                    <span className={cn(win && win === tA && "text-primary")}>
                                      {scoreA}
                                    </span>
                                    <span className="text-muted-foreground">:</span>
                                    <span className={cn(win && win === tB && "text-primary")}>
                                      {scoreB}
                                    </span>
                                  </span>
                                ) : (
                                  <span className="flex shrink-0 items-center rounded-full border border-dashed border-border px-4 py-1.5 font-mono text-muted-foreground text-sm uppercase tracking-widest">
                                    vs
                                  </span>
                                )}
                                <span
                                  className={cn(
                                    "min-w-0 flex-1 self-center text-right font-medium leading-snug",
                                    win && win === tB && "text-primary",
                                  )}
                                >
                                  {tB}
                                </span>
                              </div>
                              {win ? (
                                <p className="flex items-center gap-2 text-primary text-sm">
                                  <Crown className="size-4 shrink-0 opacity-90" aria-hidden />
                                  <span className="font-medium">{win}</span>
                                  <span className="text-muted-foreground">takes the W</span>
                                </p>
                              ) : null}
                              {m.notes?.trim() ? (
                                <p className="border-border/60 border-t pt-2 text-muted-foreground text-xs leading-relaxed">
                                  {m.notes}
                                </p>
                              ) : null}
                            </CardContent>
                          </Card>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <MatchResultModal
        match={selectedMatch}
        open={Boolean(selectedMatch)}
        onOpenChange={(v) => { if (!v) setSelectedMatch(null); }}
      />
    </>
  );
}
