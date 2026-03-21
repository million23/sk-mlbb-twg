import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/participants/status-badge";
import { useParticipants } from "@/hooks/use-participants";
import { useTeams } from "@/hooks/use-teams";
import { useUpcomingTournaments } from "@/hooks/use-tournaments";
import { getTeamStatusStyle } from "@/lib/team-status";
import { cn, formatParticipantNameDisplay } from "@/lib/utils";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ChevronRight, Trophy, User, Users, UsersRound } from "lucide-react";

export const Route = createFileRoute("/app/$id/")({
  component: DashboardPage,
});

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  isLoading,
}: {
  title: string;
  value: number;
  description?: string;
  icon: React.ElementType;
  isLoading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="size-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-16" />
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
              <CardDescription className="mt-1">{description}</CardDescription>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function DashboardPage() {
  const params = useParams({ strict: false });
  const id = (params as { id?: string })?.id ?? "";
  const { data: participants, isLoading: participantsLoading } =
    useParticipants();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: upcomingTournaments, isLoading: tournamentsLoading } =
    useUpcomingTournaments();

  const recentParticipants = (participants ?? []).slice(0, 5);
  const recentTeams = (teams ?? []).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your tournament management
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Participants"
          value={participants?.length ?? 0}
          description="Registered players"
          icon={Users}
          isLoading={participantsLoading}
        />
        <StatCard
          title="Teams"
          value={teams?.length ?? 0}
          description="Formed teams"
          icon={UsersRound}
          isLoading={teamsLoading}
        />
        <StatCard
          title="Upcoming"
          value={upcomingTournaments?.length ?? 0}
          description="Tournaments scheduled"
          icon={Trophy}
          isLoading={tournamentsLoading}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recently added participants</CardTitle>
              <CardDescription>Latest 5 registered players</CardDescription>
            </div>
            <Link
              to="/app/$id/participants"
              params={{ id }}
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              View all
              <ChevronRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {participantsLoading ? (
              <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-3">
                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentParticipants.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No participants yet
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                {recentParticipants.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60">
                      <User
                        className="size-5 text-muted-foreground"
                        aria-hidden
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">
                        {(formatParticipantNameDisplay(p.name) || p.gameID) ??
                          "-"}
                      </p>
                      <p className="truncate text-muted-foreground font-mono text-xs">
                        {p.gameID ?? "—"}
                      </p>
                    </div>
                    <StatusBadge
                      status={p.status ?? "unassigned"}
                      className="shrink-0 font-normal"
                    />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recently added teams</CardTitle>
              <CardDescription>Latest 5 formed teams</CardDescription>
            </div>
            <Link
              to="/app/$id/teams"
              params={{ id }}
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              View all
              <ChevronRight className="size-4" />
            </Link>
          </CardHeader>
          <CardContent>
            {teamsLoading ? (
              <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-3">
                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-36" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
                  </div>
                ))}
              </div>
            ) : recentTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground">No teams yet</p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-border divide-y divide-border">
                {recentTeams.map((t) => {
                  const memberCount =
                    participants?.filter((p) => p.team === t.id).length ?? 0;
                  const statusStyle = getTeamStatusStyle(t.status);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center gap-3 px-3 py-3 transition-colors hover:bg-muted/40"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/60">
                        <UsersRound
                          className="size-5 text-muted-foreground"
                          aria-hidden
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-sm">
                          {t.name ?? "-"}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {memberCount} member
                          {memberCount !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "shrink-0 font-normal",
                          statusStyle.className,
                        )}
                      >
                        {statusStyle.label}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>
            Manage participants, teams, and tournaments from the sidebar
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
