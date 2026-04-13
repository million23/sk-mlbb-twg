import { PreferredLaneIcons } from "@/components/participants/preferred-lane-icons";
import { StatusBadge } from "@/components/participants/status-badge";
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
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useParticipants } from "@/hooks/use-participants";
import { useTeams } from "@/hooks/use-teams";
import { effectiveParticipantStatus } from "@/lib/participant-display-status";
import { createFileRoute } from "@tanstack/react-router";
import type { PlayerRole } from "@/types/pocketbase-types";
import { Search, Users } from "lucide-react";
import { useMemo, useState } from "react";

export const Route = createFileRoute("/p/participants")({
  component: PublicParticipantsPage,
});

function PublicParticipantsPage() {
  const [query, setQuery] = useState("");
  const {
    data: participants,
    isLoading: participantsLoading,
    isError: participantsError,
    error: participantsErr,
  } = useParticipants();
  const { data: teams, isLoading: teamsLoading } = useTeams();

  const teamNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of teams ?? []) {
      m.set(t.id, t.name?.trim() || "Unnamed team");
    }
    return m;
  }, [teams]);

  const list = participants ?? [];
  const sorted = useMemo(
    () =>
      [...list].sort((a, b) => {
        const ga = a.gameID?.toLowerCase() ?? "";
        const gb = b.gameID?.toLowerCase() ?? "";
        if (ga !== gb) return ga.localeCompare(gb);
        return (a.name ?? "").localeCompare(b.name ?? "", undefined, {
          sensitivity: "base",
        });
      }),
    [list],
  );

  const needle = query.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!needle) return sorted;
    return sorted.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const gid = (p.gameID ?? "").toLowerCase();
      const tid = p.team;
      const team = tid ? (teamNameById.get(tid) ?? "").toLowerCase() : "";
      return (
        name.includes(needle) ||
        gid.includes(needle) ||
        team.includes(needle)
      );
    });
  }, [sorted, needle, teamNameById]);

  const isLoading = participantsLoading || teamsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-8 text-primary" />
        <p className="text-muted-foreground text-sm">Loading participants…</p>
      </div>
    );
  }

  if (participantsError) {
    return (
      <Empty className="min-h-[40vh] border border-dashed border-destructive/30 bg-destructive/5">
        <EmptyHeader>
          <EmptyTitle>Could not load participants</EmptyTitle>
          <EmptyDescription>
            {participantsErr instanceof Error
              ? participantsErr.message
              : "Something went wrong."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (list.length === 0) {
    return (
      <Empty className="min-h-[40vh] border border-dashed">
        <EmptyHeader>
          <EmptyTitle>No participants yet</EmptyTitle>
          <EmptyDescription>
            Player registrations will appear here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-8">
      <PublicPageHeader
        eyebrow="Player intel"
        title="Participants"
        description="Public roster view — contact details stay off the broadcast floor. Lanes and assignment badges update as staff confirms players."
        icon={Users}
      />
      <div className="mx-auto w-full max-w-lg">
        <InputGroup className="h-9">
          <InputGroupAddon aria-hidden>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            type="search"
            placeholder="Search by name, game ID, or team…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search participants"
            autoComplete="off"
            spellCheck={false}
          />
        </InputGroup>
      </div>
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm">
          No participants match &ldquo;{query.trim()}&rdquo;.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {filtered.map((p) => {
          const eff = effectiveParticipantStatus(p, teams);
          const roles = p.preferredRoles?.filter(Boolean) as
            | PlayerRole[]
            | undefined;
          const tid = p.team;
          const teamLabel = tid ? (teamNameById.get(tid) ?? null) : null;

          return (
            <li key={p.id}>
              <Card className="h-full overflow-hidden border-border/80 bg-card/50 transition-[transform,box-shadow,border-color] duration-300 ease-out hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/20">
                <CardHeader className="relative pb-2">
                  <div className="absolute right-4 top-4 size-16 rounded-full bg-primary/[0.07] blur-2xl" aria-hidden />
                  <div className="relative flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <CardTitle className="truncate font-serif text-lg">
                        {p.name?.trim() || "Unnamed"}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs tracking-wide">
                        {p.gameID?.trim() || "—"}
                      </CardDescription>
                    </div>
                    <StatusBadge status={eff} className="shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2 border-border/60 border-t border-dashed pt-3 text-sm">
                  <span className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-wider">
                    Lanes
                  </span>
                  <PreferredLaneIcons roles={roles} iconClassName="size-4" />
                  {teamLabel ? (
                    <Badge
                      variant="secondary"
                      className="ml-auto max-w-full truncate font-normal"
                    >
                      {teamLabel}
                    </Badge>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          );
          })}
        </ul>
      )}
    </div>
  );
}
