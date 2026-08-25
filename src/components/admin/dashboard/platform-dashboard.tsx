import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStagger } from "@/components/admin/admin-stagger";
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
import { setActiveTournamentId } from "@/lib/admin/active-tournament";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { format, isValid, parseISO } from "date-fns";
import {
  CalendarDays,
  ChevronRight,
  LayoutDashboard,
  MapPin,
  Radio,
  Trophy,
} from "lucide-react";
import type { ReactNode } from "react";

export type PlatformTournamentCard = {
  id: string;
  title: string;
  status?: string;
  venue?: string;
  startAt?: string;
  endAt?: string;
  registrationEnabled: boolean;
  registrationOpen: boolean;
};

export type PlatformDashboardProps = {
  tournaments: PlatformTournamentCard[];
  resumeTournamentId?: string;
  isLoading: boolean;
  isError: boolean;
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

function DashboardShell({
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

const STATUS_ORDER: Record<string, number> = {
  live: 0,
  upcoming: 1,
  draft: 2,
  completed: 3,
  archived: 4,
};

function sortTournaments(items: PlatformTournamentCard[]) {
  return [...items].sort((a, b) => {
    const rankA = STATUS_ORDER[a.status ?? "draft"] ?? 9;
    const rankB = STATUS_ORDER[b.status ?? "draft"] ?? 9;
    if (rankA !== rankB) return rankA - rankB;
    const startA = a.startAt ? Date.parse(a.startAt) : Number.POSITIVE_INFINITY;
    const startB = b.startAt ? Date.parse(b.startAt) : Number.POSITIVE_INFINITY;
    return startA - startB;
  });
}

export function PlatformDashboard({
  tournaments,
  resumeTournamentId,
  isLoading,
  isError,
  onRetry,
}: PlatformDashboardProps) {
  if (isLoading) {
    return (
      <DashboardShell>
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-10 w-56 max-w-full" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <Skeleton className="h-44 rounded-2xl" />
            <Skeleton className="h-44 rounded-2xl" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (isError) {
    return (
      <DashboardShell>
        <Empty className="border border-border bg-background/60 backdrop-blur-sm">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <LayoutDashboard />
            </EmptyMedia>
            <EmptyTitle>Could not load dashboard</EmptyTitle>
            <EmptyDescription>
              Something went wrong fetching active tournaments.
            </EmptyDescription>
          </EmptyHeader>
          <Button type="button" variant="outline" onClick={onRetry}>
            Retry
          </Button>
        </Empty>
      </DashboardShell>
    );
  }

  const sorted = sortTournaments(tournaments);
  const liveCount = tournaments.filter((t) => t.status === "live").length;
  const upcomingCount = tournaments.filter((t) => t.status === "upcoming").length;
  const openRegCount = tournaments.filter(
    (t) => t.registrationEnabled && t.registrationOpen,
  ).length;
  const resume = resumeTournamentId
    ? sorted.find((t) => t.id === resumeTournamentId)
    : undefined;

  return (
    <DashboardShell>
      <div className="flex flex-col gap-8">
        <AdminStagger index={0}>
          <AdminPageHeader
            eyebrow="Platform"
            title="Dashboard"
            description="Pick a tournament to work in. Several can run in parallel — each has its own participants, teams, and matches."
            actions={
              <Link
                to="/app/tournaments"
                className={cn(buttonVariants({ variant: "outline" }))}
              >
                Browse tournaments
              </Link>
            }
          />
        </AdminStagger>

        <AdminStagger index={1}>
          <div className="grid gap-3 sm:grid-cols-3">
            <SummaryChip
              label="Live"
              hint="Running now"
              value={liveCount}
              accent="success"
            />
            <SummaryChip
              label="Upcoming"
              hint="Scheduled next"
              value={upcomingCount}
              accent="primary"
            />
            <SummaryChip
              label="Registration open"
              hint="Accepting signups"
              value={openRegCount}
              accent="warning"
            />
          </div>
        </AdminStagger>

        {resume ? (
          <AdminStagger index={2}>
            <ResumeBanner tournament={resume} />
          </AdminStagger>
        ) : null}

        <AdminStagger index={resume ? 3 : 2}>
          <section className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.22em]">
                Active tournaments
              </h2>
              <p className="text-muted-foreground text-xs tabular-nums">
                {sorted.length} {sorted.length === 1 ? "event" : "events"}
              </p>
            </div>

            {sorted.length === 0 ? (
              <Empty className="border border-border bg-background/60 backdrop-blur-sm">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <Trophy />
                  </EmptyMedia>
                  <EmptyTitle>No active tournaments</EmptyTitle>
                  <EmptyDescription>
                    Create or restore an event under Tournaments to start
                    managing participants and matches.
                  </EmptyDescription>
                </EmptyHeader>
                <Link
                  to="/app/tournaments"
                  className={cn(buttonVariants({ variant: "default" }))}
                >
                  Go to tournaments
                </Link>
              </Empty>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {sorted.map((tournament) => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                  />
                ))}
              </div>
            )}
          </section>
        </AdminStagger>
      </div>
    </DashboardShell>
  );
}

const CHIP_ACCENT = {
  warning: {
    bar: "bg-warning",
    glow: "border-warning/25",
  },
  success: {
    bar: "bg-success",
    glow: "border-success/25",
  },
  primary: {
    bar: "bg-primary",
    glow: "border-primary/25",
  },
} as const;

function SummaryChip({
  label,
  hint,
  value,
  accent,
}: {
  label: string;
  hint: string;
  value: number;
  accent: keyof typeof CHIP_ACCENT;
}) {
  const tone = CHIP_ACCENT[accent];
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border/80 bg-background/75 px-4 py-4 shadow-xs backdrop-blur-sm",
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
      <p className="mt-2 font-heading text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-muted-foreground text-xs">{hint}</p>
    </div>
  );
}

function ResumeBanner({ tournament }: { tournament: PlatformTournamentCard }) {
  return (
    <Link
      to="/app/tournaments/$tournamentId"
      params={{ tournamentId: tournament.id }}
      onClick={() => setActiveTournamentId(tournament.id)}
      className="group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-primary/30 bg-primary/8 px-5 py-4 backdrop-blur-sm transition-[transform,background-color,border-color] duration-200 hover:-translate-y-px hover:border-primary/45 hover:bg-primary/12 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/30 sm:gap-4 sm:px-6"
    >
      <span
        className="absolute inset-y-0 left-0 w-1 bg-primary"
        aria-hidden
      />
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
        <Radio className="size-4" />
      </span>
      <span className="min-w-0 flex-1 pl-1">
        <span className="block font-mono text-[0.65rem] text-primary uppercase tracking-[0.18em]">
          Resume workspace
        </span>
        <span className="mt-0.5 block truncate font-heading text-lg font-semibold tracking-tight">
          {tournament.title}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-primary/70 transition-transform duration-200 group-hover:translate-x-0.5" />
    </Link>
  );
}

function TournamentCard({
  tournament,
}: {
  tournament: PlatformTournamentCard;
}) {
  const dateRange = formatDateRange(tournament.startAt, tournament.endAt);
  const isOpen = tournament.registrationEnabled && tournament.registrationOpen;
  const registrationLabel = !tournament.registrationEnabled
    ? "Registration disabled"
    : isOpen
      ? "Registration open"
      : "Registration closed";

  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/80 bg-background/70 shadow-xs backdrop-blur-sm transition-[transform,border-color,background-color] duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:bg-background"
    >
      <div className="flex flex-1 flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-heading text-xl font-semibold tracking-tight">
              {tournament.title}
            </h3>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              {tournament.venue ? (
                <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/80 bg-background/70 px-2.5 py-1 text-muted-foreground text-xs">
                  <MapPin className="size-3 shrink-0 text-primary/80" />
                  <span className="truncate">{tournament.venue}</span>
                </span>
              ) : null}
              <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/80 bg-background/70 px-2.5 py-1 text-muted-foreground text-xs">
                <CalendarDays className="size-3 shrink-0 text-primary/80" />
                <span className="truncate">
                  {dateRange ?? "Dates not set yet"}
                </span>
              </span>
            </div>
          </div>
          <TournamentStatusBadge
            status={tournament.status}
            className="shrink-0"
          />
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span
            className={cn(
              "size-2 shrink-0 rounded-full",
              isOpen
                ? "bg-success shadow-[0_0_0_3px] shadow-success/20 animate-pulse"
                : "bg-muted-foreground/40",
            )}
            aria-hidden
          />
          <span
            className={cn(
              "text-sm",
              isOpen ? "text-foreground" : "text-muted-foreground",
            )}
          >
            {registrationLabel}
          </span>
        </div>
      </div>

      <div className="border-border/70 border-t px-5 py-3">
        <Link
          to="/app/tournaments/$tournamentId"
          params={{ tournamentId: tournament.id }}
          onClick={() => setActiveTournamentId(tournament.id)}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "-ml-2 gap-1.5 text-primary hover:text-primary",
          )}
        >
          Open workspace
          <ChevronRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
