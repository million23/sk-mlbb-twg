import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Spinner } from "@/components/ui/spinner";
import { useTeams } from "@/hooks/use-teams";
import { getTeamStatusStyle } from "@/lib/team-status";
import { cn } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";
import { UsersRound } from "lucide-react";

export const Route = createFileRoute("/p/teams")({
  component: PublicTeamsPage,
});

function PublicTeamsPage() {
  const { data: teams, isLoading, isError, error } = useTeams();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
        <Spinner className="size-8" />
        <p className="text-muted-foreground text-sm">Loading teams…</p>
      </div>
    );
  }

  if (isError) {
    return (
      <Empty className="min-h-[40vh] border border-dashed">
        <EmptyHeader>
          <EmptyTitle>Could not load teams</EmptyTitle>
          <EmptyDescription>
            {error instanceof Error ? error.message : "Something went wrong."}
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const list = teams ?? [];

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

  const sorted = [...list].sort((a, b) =>
    (a.name ?? "").localeCompare(b.name ?? "", undefined, {
      sensitivity: "base",
    }),
  );

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <UsersRound className="size-7 text-primary" aria-hidden />
          Teams
        </h1>
        <p className="text-muted-foreground text-sm">
          Registered teams and their readiness status.
        </p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((t) => {
          const st = getTeamStatusStyle(t.status);
          return (
            <li key={t.id}>
              <Card className="h-full border-border/80 bg-card/50">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <CardTitle className="text-base leading-snug">
                      {t.name?.trim() || "Unnamed team"}
                    </CardTitle>
                    <Badge
                      variant="outline"
                      className={cn("shrink-0", st.className)}
                    >
                      {st.label}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
