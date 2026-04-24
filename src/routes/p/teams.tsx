import { PublicPageHeader } from "@/components/public/public-page-header";
import { usePublicTeamRosterModal } from "@/components/public/public-team-roster-modal";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useParticipants } from "@/hooks/use-participants";
import { useTeams } from "@/hooks/use-teams";
import {
  teamMajorityTournamentAgeGroup,
  type TournamentAgeGroupKey,
} from "@/lib/age";
import { getTeamStatusStyle } from "@/lib/team-status";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { Search, UsersRound } from "lucide-react";
import { useMemo, useState } from "react";

type AgeFilter = "all" | Exclude<TournamentAgeGroupKey, "unknown">;

const AGE_FILTERS: { value: AgeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "under18", label: "Under 18" },
  { value: "18+", label: "18 and above" },
];

export const Route = createFileRoute("/p/teams")({
  component: PublicTeamsPage,
});

function PublicTeamsPage() {
  const [query, setQuery] = useState("");
  const [ageFilter, setAgeFilter] = useState<AgeFilter>("all");
  const { data: teams, isLoading, isError, error } = useTeams();
  const { data: participants } = useParticipants();
  const { openTeamRoster } = usePublicTeamRosterModal();

  const list = teams ?? [];
  const sorted = useMemo(
    () =>
      [...list].sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", undefined, {
          sensitivity: "base",
        }),
      ),
    [list],
  );

  const teamAgeGroupMap = useMemo(() => {
    const map = new Map<string, Exclude<TournamentAgeGroupKey, "unknown"> | null>();
    for (const team of sorted) {
      const members = (participants ?? []).filter((p) => p.team === team.id);
      map.set(team.id, teamMajorityTournamentAgeGroup(members));
    }
    return map;
  }, [sorted, participants]);

  const needle = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    return sorted.filter((t) => {
      if (ageFilter !== "all") {
        const group = teamAgeGroupMap.get(t.id);
        if (group !== ageFilter) return false;
      }
      if (!needle) return true;
      const name = (t.name ?? "").toLowerCase();
      const st = getTeamStatusStyle(t.status).label.toLowerCase();
      return name.includes(needle) || st.includes(needle);
    });
  }, [sorted, needle, ageFilter, teamAgeGroupMap]);

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-8 text-primary" />
        <p className="text-muted-foreground text-sm">Loading teams…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Empty className="min-h-[40vh] border border-dashed border-destructive/30 bg-destructive/5">
        <EmptyHeader>
          <EmptyTitle>Could not load teams</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error ? error.message : "Something went wrong."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (list.length === 0) {
    return (
      <Empty className="min-h-[40vh] border border-dashed">
        <EmptyHeader>
          <EmptyTitle>No teams yet</EmptyTitle>
          <EmptyDescription>
            Teams will show here once they are registered.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <PublicPageHeader
        eyebrow="Roster wall"
        title="Teams"
        description="Registered squads and readiness—each tile is a quick scan for who cleared check-in."
        icon={UsersRound}
      />
      <div className="flex flex-col items-center gap-4">
        <div className="w-full max-w-lg">
          <InputGroup className="h-9">
            <InputGroupAddon aria-hidden>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              type="search"
              placeholder="Search by team name or status…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search teams"
              autoComplete="off"
              spellCheck={false}
            />
          </InputGroup>
        </div>
        <fieldset className="flex gap-2 border-0 p-0 m-0"><legend className="sr-only">Filter by age group</legend>
          {AGE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setAgeFilter(value)}
              aria-pressed={ageFilter === value}
              className={cn(
                "rounded-full border px-4 py-2 text-sm transition-[color,background-color,border-color]",
                ageFilter === value
                  ? "border-primary/40 bg-primary/15 text-primary shadow-[0_0_20px_-8px] shadow-primary/50"
                  : "border-border/60 bg-muted/20 text-muted-foreground hover:border-border hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </fieldset>
      </div>
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm">
          No teams match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
          const st = getTeamStatusStyle(t.status);
          return (
            <li key={t.id}>
              <button
                type="button"
                onClick={() => openTeamRoster(t.id)}
                className="block w-full cursor-pointer rounded-xl border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <Card
                  className={cn(
                    "group relative h-full overflow-hidden border-border/80 bg-card/50 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:border-primary/30 hover:shadow-lg hover:shadow-primary/20",
                    "before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_0%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent_55%)] before:opacity-0 before:transition-opacity before:duration-500 group-hover:before:opacity-100",
                  )}
                >
                  <CardHeader className="relative pb-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <CardTitle className="font-serif text-lg leading-snug">
                        {t.name?.trim() || "Unnamed team"}
                      </CardTitle>
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
                    <p className="pt-2 text-muted-foreground text-xs">
                      Squad file · public snapshot · tap for roster
                    </p>
                  </CardHeader>
                </Card>
              </button>
            </li>
          );
          })}
        </ul>
      )}
    </div>
  );
}
