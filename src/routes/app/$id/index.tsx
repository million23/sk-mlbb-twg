import { Badge } from "@/components/ui/badge";
import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
} from "@/components/ui/chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/participants/status-badge";
import { useParticipants } from "@/hooks/use-participants";
import { useTeams } from "@/hooks/use-teams";
import { useUpcomingTournaments } from "@/hooks/use-tournaments";
import { getTeamStatusStyle } from "@/lib/team-status";
import { effectiveParticipantStatus } from "@/lib/participant-display-status";
import { cn, formatParticipantNameDisplay } from "@/lib/utils";
import type { Collections } from "@/types/pocketbase-types";
import {
  createFileRoute,
  Link,
  type ToPathOption,
  useParams,
} from "@tanstack/react-router";
import {
  eachDayOfInterval,
  format,
  isValid,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";
import {
  ChevronRight,
  Swords,
  Trophy,
  User,
  Users,
  UsersRound,
} from "lucide-react";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/app/$id/")({
  component: DashboardPage,
});

const registrationsChartConfig = {
  count: {
    label: "Registered",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

function dayOverDayChange(
  current: number,
  previous: number,
): { label: string; tone: "positive" | "negative" | "neutral" } | null {
  if (previous === 0) {
    if (current === 0) return null;
    return {
      label: "New (0 previous day)",
      tone: "positive",
    };
  }
  const pct = ((current - previous) / previous) * 100;
  const rounded =
    Math.abs(pct) >= 10 ? Math.round(pct) : Math.round(pct * 10) / 10;
  if (rounded === 0) {
    return { label: "0% vs previous day", tone: "neutral" };
  }
  const sign = rounded > 0 ? "+" : "";
  return {
    label: `${sign}${rounded}% vs previous day`,
    tone: rounded > 0 ? "positive" : "negative",
  };
}

function dailyRegistrationsLastWeek(
  participants: Collections["participants"][] | undefined,
) {
  const end = startOfDay(new Date());
  const start = subDays(end, 6);
  const days = eachDayOfInterval({ start, end });
  const dayBeforeWindow = subDays(start, 1);
  const countKeys = new Set(
    eachDayOfInterval({ start: dayBeforeWindow, end }).map((d) =>
      format(d, "yyyy-MM-dd"),
    ),
  );
  const counts = new Map<string, number>();
  for (const k of countKeys) counts.set(k, 0);

  for (const p of participants ?? []) {
    if (!p.created) continue;
    const parsed = parseISO(p.created);
    if (!isValid(parsed)) continue;
    const key = format(startOfDay(parsed), "yyyy-MM-dd");
    if (!countKeys.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return days.map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const prevKey = format(subDays(d, 1), "yyyy-MM-dd");
    const count = counts.get(key) ?? 0;
    const prevCount = counts.get(prevKey) ?? 0;
    const change = dayOverDayChange(count, prevCount);
    return {
      label: format(d, "EEE"),
      fullLabel: format(d, "MMM d"),
      count,
      prevCount,
      changeLabel: change?.label ?? null,
      changeTone: change?.tone ?? null,
    };
  });
}

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

  const registrationSeries = useMemo(
    () => dailyRegistrationsLastWeek(participants),
    [participants],
  );

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
          <CardTitle>Participant registrations</CardTitle>
          <CardDescription>
            New registrations per day over the last 7 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {participantsLoading ? (
            <Skeleton className="h-[220px] w-full rounded-lg" />
          ) : (
            <ChartContainer
              config={registrationsChartConfig}
              className="aspect-auto h-[220px] w-full"
            >
              <LineChart
                data={registrationSeries}
                margin={{ left: 4, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                />
                <YAxis
                  allowDecimals={false}
                  width={36}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const row = payload[0]?.payload as {
                      fullLabel?: string;
                      count?: number;
                      changeLabel?: string | null;
                      changeTone?: "positive" | "negative" | "neutral" | null;
                    };
                    return (
                      <div className="grid min-w-40 gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-2 text-xs shadow-xl">
                        <div className="font-medium">{row.fullLabel}</div>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-muted-foreground">Registered</span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {row.count}
                          </span>
                        </div>
                        {row.changeLabel ? (
                          <p
                            className={cn(
                              "text-[11px] leading-snug",
                              row.changeTone === "positive" &&
                                "text-emerald-600 dark:text-emerald-400",
                              row.changeTone === "negative" &&
                                "text-rose-600 dark:text-rose-400",
                              row.changeTone === "neutral" &&
                                "text-muted-foreground",
                            )}
                          >
                            {row.changeLabel}
                          </p>
                        ) : null}
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="var(--color-count)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

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
                      status={effectiveParticipantStatus(p, teams)}
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
            Jump to common tasks without using the sidebar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                {
                  to: "/app/$id/participants",
                  title: "Participants",
                  hint: "Register or edit players",
                  icon: Users,
                },
                {
                  to: "/app/$id/teams",
                  title: "Teams",
                  hint: "Form and manage teams",
                  icon: UsersRound,
                },
                {
                  to: "/app/$id/tournament",
                  title: "Tournament",
                  hint: "Schedule and brackets",
                  icon: Trophy,
                },
                {
                  to: "/app/$id/matches",
                  title: "Matches",
                  hint: "Record and review games",
                  icon: Swords,
                },
              ] as const
            ).map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to as ToPathOption}
                  params={{ id }}
                  className={cn(
                    buttonVariants({ variant: "outline", size: "default" }),
                    "h-auto min-h-14 w-full flex-row justify-between gap-3 py-3 pr-3 pl-3 text-left font-normal",
                  )}
                >
                  <span className="flex min-w-0 flex-1 items-start gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/50">
                      <Icon className="size-4 text-muted-foreground" aria-hidden />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-medium text-foreground">
                        {action.title}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {action.hint}
                      </span>
                    </span>
                  </span>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
