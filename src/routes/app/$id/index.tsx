import { createFileRoute } from "@tanstack/react-router";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useParticipants } from "@/hooks/use-participants";
import { useTeams } from "@/hooks/use-teams";
import { useUpcomingTournaments } from "@/hooks/use-tournaments";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UsersRound, Trophy } from "lucide-react";

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
  const { data: participants, isLoading: participantsLoading } =
    useParticipants();
  const { data: teams, isLoading: teamsLoading } = useTeams();
  const { data: upcomingTournaments, isLoading: tournamentsLoading } =
    useUpcomingTournaments();

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
