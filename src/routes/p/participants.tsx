import { PreferredLaneIcons } from "@/components/participants/preferred-lane-icons";
import { StatusBadge } from "@/components/participants/status-badge";
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
import { Spinner } from "@/components/ui/spinner";
import { useParticipants } from "@/hooks/use-participants";
import { useTeams } from "@/hooks/use-teams";
import { effectiveParticipantStatus } from "@/lib/participant-display-status";
import { createFileRoute } from "@tanstack/react-router";
import type { PlayerRole } from "@/types/pocketbase-types";
import { Users } from "lucide-react";
import { useMemo } from "react";

export const Route = createFileRoute("/p/participants")({
  component: PublicParticipantsPage,
});

function PublicParticipantsPage() {
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

  const isLoading = participantsLoading || teamsLoading;

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-8" />
        <p className="text-muted-foreground text-sm">Loading participants…</p>
      </div>
    );
  }

  if (participantsError) {
    return (
      <Empty className="min-h-[40vh] border border-dashed">
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

  const list = participants ?? [];

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

  const sorted = [...list].sort((a, b) => {
    const ga = a.gameID?.toLowerCase() ?? "";
    const gb = b.gameID?.toLowerCase() ?? "";
    if (ga !== gb) return ga.localeCompare(gb);
    return (a.name ?? "").localeCompare(b.name ?? "", undefined, {
      sensitivity: "base",
    });
  });

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Users className="size-7 text-primary" aria-hidden />
          Participants
        </h1>
        <p className="text-muted-foreground text-sm">
          Public roster view — contact details are not shown here.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2">
        {sorted.map((p) => {
          const eff = effectiveParticipantStatus(p, teams);
          const roles = p.preferredRoles?.filter(Boolean) as
            | PlayerRole[]
            | undefined;
          const tid = p.team;
          const teamLabel = tid
            ? (teamNameById.get(tid) ?? null)
            : null;

          return (
            <li key={p.id}>
              <Card className="h-full border-border/80 bg-card/50">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 space-y-0.5">
                      <CardTitle className="truncate text-base">
                        {p.name?.trim() || "Unnamed"}
                      </CardTitle>
                      <CardDescription className="font-mono text-xs">
                        {p.gameID?.trim() || "—"}
                      </CardDescription>
                    </div>
                    <StatusBadge status={eff} className="shrink-0" />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-3 text-sm">
                  <span className="text-muted-foreground">Lanes</span>
                  <PreferredLaneIcons roles={roles} iconClassName="size-4" />
                  {teamLabel ? (
                    <Badge variant="secondary" className="ml-auto max-w-full truncate">
                      {teamLabel}
                    </Badge>
                  ) : null}
                </CardContent>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
