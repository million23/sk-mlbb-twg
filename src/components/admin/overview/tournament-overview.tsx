import { TournamentAnalyticsCharts } from "@/components/admin/analytics/tournament-analytics-charts";
import { TournamentStatusBadge } from "@/components/admin/overview/tournament-status-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { format, isValid, parseISO } from "date-fns";
import {
  CalendarDays,
  ChevronRight,
  MapPin,
  Swords,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type { ReactNode } from "react";

export type TournamentOverviewProps = {
  tournamentId: string;
  title?: string;
  status?: string;
  venue?: string;
  startAt?: string;
  endAt?: string;
  registrationEnabled: boolean;
  registrationOpen: boolean;
  registrationOpenAt?: string;
  registrationCloseAt?: string;
  pendingCount: number;
  approvedCount: number;
  teamCount: number;
  participants: ParticipantsRecord[];
  isLoading: boolean;
  isError: boolean;
  notFound: boolean;
  onRetry: () => void;
};

function formatWhen(iso?: string): string | null {
  if (!iso?.trim()) return null;
  const d = parseISO(iso);
  if (!isValid(d)) return null;
  return format(d, "MMM d, yyyy · h:mm a");
}

function formatDateRange(startAt?: string, endAt?: string): string | null {
  const start = formatWhen(startAt);
  const end = formatWhen(endAt);
  if (start && end) return `${start} – ${end}`;
  return start ?? end;
}

function OverviewShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl", className)}>{children}</div>
  );
}

function Stagger({
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn(className)}>{children}</div>;
}

export function TournamentOverview({
  tournamentId,
  title,
  status,
  venue,
  startAt,
  endAt,
  registrationEnabled,
  registrationOpen,
  registrationOpenAt,
  registrationCloseAt,
  pendingCount,
  approvedCount,
  teamCount,
  participants,
  isLoading,
  isError,
  notFound,
  onRetry,
}: TournamentOverviewProps) {
  if (isLoading) {
    return (
      <OverviewShell>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-72 max-w-full" />
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-8 w-36 rounded-full" />
              <Skeleton className="h-8 w-52 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
            <Skeleton className="h-28 rounded-2xl" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        </div>
      </OverviewShell>
    );
  }

  if (isError) {
    return (
      <OverviewShell>
        <Empty className="border border-border bg-background/60 backdrop-blur-sm">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trophy />
            </EmptyMedia>
            <EmptyTitle>Could not load overview</EmptyTitle>
            <EmptyDescription>
              Something went wrong fetching this tournament’s workspace data.
            </EmptyDescription>
          </EmptyHeader>
          <Button type="button" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </Empty>
      </OverviewShell>
    );
  }

  if (notFound) {
    return (
      <OverviewShell>
        <Empty className="border border-border bg-background/60 backdrop-blur-sm">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Trophy />
            </EmptyMedia>
            <EmptyTitle>Tournament not found</EmptyTitle>
            <EmptyDescription>
              This tournament may be archived or the link is invalid. Pick
              another from the sidebar.
            </EmptyDescription>
          </EmptyHeader>
          <Link
            to="/app/tournaments"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Browse tournaments
          </Link>
        </Empty>
      </OverviewShell>
    );
  }

  const dateRange = formatDateRange(startAt, endAt);
  const regOpenLabel = formatWhen(registrationOpenAt);
  const regCloseLabel = formatWhen(registrationCloseAt);
  const isOpen = registrationEnabled && registrationOpen;

  const registrationSummary = !registrationEnabled
    ? "Registration disabled"
    : registrationOpen
      ? "Registration open"
      : "Registration closed";

  const registrationDetail = !registrationEnabled
    ? "Public signup is turned off for this event."
    : registrationOpen
      ? "New registrants can submit through the public form."
      : "The public form is not accepting new entries.";

  return (
    <OverviewShell>
      <div className="flex flex-col gap-8">
        <Stagger index={0}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
                Tournament workspace
              </p>
              <h1 className="mt-2 max-w-3xl text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
                {title?.trim() || "Tournament overview"}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {venue ? (
                  <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/80 bg-background/70 px-3 py-1.5 text-muted-foreground text-sm backdrop-blur-sm">
                    <MapPin className="size-3.5 shrink-0 text-primary/80" />
                    <span className="truncate text-pretty">{venue}</span>
                  </span>
                ) : null}
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/80 bg-background/70 px-3 py-1.5 text-muted-foreground text-sm backdrop-blur-sm">
                  <CalendarDays className="size-3.5 shrink-0 text-primary/80" />
                  <span className="truncate text-pretty">
                    {dateRange ?? "Dates not set yet"}
                  </span>
                </span>
              </div>
            </div>
            <TournamentStatusBadge
              status={status}
              className="mt-1 shrink-0 self-start"
            />
          </div>
        </Stagger>

        <Stagger index={1}>
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border px-5 py-4 sm:px-6 sm:py-5",
              isOpen
                ? "border-success/35 bg-success/6"
                : "border-border bg-background/70 backdrop-blur-sm",
            )}
          >
            <div
              className={cn(
                "absolute inset-y-0 left-0 w-1",
                isOpen ? "bg-success" : "bg-muted-foreground/35",
              )}
              aria-hidden
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0 pl-2">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={cn(
                      "size-2.5 shrink-0 rounded-full",
                      isOpen
                        ? "bg-success shadow-[0_0_0_4px] shadow-success/20 animate-pulse"
                        : "bg-muted-foreground/45",
                    )}
                    aria-hidden
                  />
                  <p className="font-heading text-lg font-semibold tracking-tight">
                    {registrationSummary}
                  </p>
                </div>
                <p className="mt-1 max-w-xl text-muted-foreground text-sm text-pretty">
                  {registrationDetail}
                </p>
              </div>
              {(regOpenLabel || regCloseLabel) && (
                <dl className="grid shrink-0 gap-1 pl-2 font-mono text-[0.7rem] text-muted-foreground uppercase tracking-wider sm:text-right">
                  {regOpenLabel ? (
                    <div className="flex flex-wrap gap-x-2 sm:justify-end">
                      <dt className="text-muted-foreground/70">Opens</dt>
                      <dd className="normal-case tracking-normal text-foreground/80">
                        {regOpenLabel}
                      </dd>
                    </div>
                  ) : null}
                  {regCloseLabel ? (
                    <div className="flex flex-wrap gap-x-2 sm:justify-end">
                      <dt className="text-muted-foreground/70">Closes</dt>
                      <dd className="normal-case tracking-normal text-foreground/80">
                        {regCloseLabel}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              )}
            </div>
          </div>
        </Stagger>

        <Stagger index={2}>
          <div className="grid gap-3 sm:grid-cols-3">
            <CountChip
              to="/app/tournaments/$tournamentId/participants"
              tournamentId={tournamentId}
              label="Pending review"
              hint="Needs committee action"
              value={pendingCount}
              accent="warning"
            />
            <CountChip
              to="/app/tournaments/$tournamentId/participants"
              tournamentId={tournamentId}
              label="Approved"
              hint="On the roster"
              value={approvedCount}
              accent="success"
            />
            <CountChip
              to="/app/tournaments/$tournamentId/teams"
              tournamentId={tournamentId}
              label="Teams"
              hint="Active listings"
              value={teamCount}
              accent="primary"
            />
          </div>
        </Stagger>

        <Stagger index={3}>
          <TournamentAnalyticsCharts participants={participants} />
        </Stagger>

        <Stagger index={4}>
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.22em]">
                Jump to
              </h2>
              <p className="text-muted-foreground text-xs">
                Core workspace pages
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <ShortcutLink
                to="/app/tournaments/$tournamentId/participants"
                tournamentId={tournamentId}
                index="01"
                icon={Users}
                title="Participants"
                description="Review registrants, documents, and approvals."
              />
              <ShortcutLink
                to="/app/tournaments/$tournamentId/teams"
                tournamentId={tournamentId}
                index="02"
                icon={UsersRound}
                title="Teams"
                description="Build rosters, captains, and quick teams."
              />
              <ShortcutLink
                to="/app/tournaments/$tournamentId/matches"
                tournamentId={tournamentId}
                index="03"
                icon={Swords}
                title="Matches"
                description="Bracket slots, scores, and player results."
              />
            </div>
          </section>
        </Stagger>
      </div>
    </OverviewShell>
  );
}

const ACCENT = {
  warning: {
    bar: "bg-warning",
    value: "text-foreground",
    glow: "group-hover:border-warning/40",
  },
  success: {
    bar: "bg-success",
    value: "text-foreground",
    glow: "group-hover:border-success/40",
  },
  primary: {
    bar: "bg-primary",
    value: "text-foreground",
    glow: "group-hover:border-primary/40",
  },
} as const;

function CountChip({
  to,
  tournamentId,
  label,
  hint,
  value,
  accent,
}: {
  to:
    | "/app/tournaments/$tournamentId/participants"
    | "/app/tournaments/$tournamentId/teams";
  tournamentId: string;
  label: string;
  hint: string;
  value: number;
  accent: keyof typeof ACCENT;
}) {
  const tone = ACCENT[accent];
  return (
    <Link
      to={to}
      params={{ tournamentId }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/80 bg-background/75 px-4 py-4 shadow-xs backdrop-blur-sm transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:bg-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
        tone.glow,
      )}
    >
      <span
        className={cn("absolute inset-x-0 top-0 h-0.5", tone.bar)}
        aria-hidden
      />
      <p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.18em]">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-heading text-3xl font-semibold tracking-tight tabular-nums",
          tone.value,
        )}
      >
        {value}
      </p>
      <p className="mt-1 text-muted-foreground text-xs">{hint}</p>
    </Link>
  );
}

function ShortcutLink({
  to,
  tournamentId,
  index,
  icon: Icon,
  title,
  description,
}: {
  to:
    | "/app/tournaments/$tournamentId/participants"
    | "/app/tournaments/$tournamentId/teams"
    | "/app/tournaments/$tournamentId/matches";
  tournamentId: string;
  index: string;
  icon: typeof Users;
  title: string;
  description: string;
}) {
  return (
    <Link
      to={to}
      params={{ tournamentId }}
      className="group flex items-center gap-3 rounded-2xl border border-border/80 bg-background/60 px-4 py-3.5 backdrop-blur-sm transition-[transform,background-color,border-color] duration-200 hover:-translate-y-px hover:border-primary/30 hover:bg-background focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 sm:gap-4"
    >
      <span className="font-mono text-sm text-primary/70 tabular-nums">
        {index}
      </span>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-heading font-medium tracking-tight">
          {title}
        </span>
        <span className="block text-muted-foreground text-sm text-pretty">
          {description}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
