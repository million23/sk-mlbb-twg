import { LandingShell } from "@/components/landing/shell";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublicTournaments } from "@/hooks/legacy/use-tournaments";
import { getTournamentStatusLabel } from "@/lib/legacy/tournament-status";
import { tournamentLabel } from "@/lib/legacy/tournament-label";
import type { Collections } from "@/lib/pocketbase.types";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { format } from "date-fns";
import { ArrowRight } from "lucide-react";

type PublicTournament = Collections["tournaments"];

function formatWhen(iso: string | undefined) {
  if (!iso) return null;
  try {
    return format(new Date(iso), "MMM d, yyyy · h:mm a");
  } catch {
    return null;
  }
}

function formatRange(
  startIso: string | undefined,
  endIso: string | undefined,
): string | null {
  const start = formatWhen(startIso);
  const end = formatWhen(endIso);
  if (start && end) return `${start} → ${end}`;
  if (start) return `From ${start}`;
  if (end) return `Until ${end}`;
  return null;
}

function registrationSummary(t: PublicTournament): string {
  if (!t.registration_enabled) return "Closed";
  return (
    formatRange(t.registration_open_at, t.registration_close_at) ??
    "Dates not set"
  );
}

function tournamentSummary(t: PublicTournament): string {
  return formatRange(t.start_at, t.end_at) ?? "Dates not set";
}

function statusMarkClass(status: PublicTournament["status"] | undefined) {
  switch (status) {
    case "live":
      return "text-primary";
    case "upcoming":
      return "text-primary/75";
    default:
      return "text-muted-foreground";
  }
}

function sortPublicTournaments(list: PublicTournament[]) {
  const order = (s: PublicTournament["status"] | undefined) =>
    s === "live" ? 0 : s === "upcoming" ? 1 : s === "draft" ? 2 : 3;
  return [...list].sort((a, b) => order(a.status) - order(b.status));
}

function ScheduleLine({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <p className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 text-sm leading-relaxed sm:grid-cols-[7.25rem_minmax(0,1fr)]">
      <span className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.16em]">
        {label}
      </span>
      <span className="min-w-0 text-pretty text-foreground/80 transition-colors group-hover:text-foreground/90">
        {value}
      </span>
    </p>
  );
}

function TournamentListItemSkeleton({ index }: { index: number }) {
  return (
    <li
      className={cn(
        "border-border/40",
        index === 0 ? "border-t border-b" : "border-b",
      )}
      aria-hidden
    >
      <div className="grid gap-4 px-0 py-7 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-start sm:gap-x-8 sm:py-9">
        <Skeleton className="h-4 w-16 rounded-md" />
        <div className="min-w-0 flex flex-col gap-3">
          <Skeleton className="h-8 w-[85%] max-w-sm rounded-md sm:h-10" />
          <Skeleton className="h-4 w-40 max-w-full rounded-md" />
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[7.25rem_minmax(0,1fr)]">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-4 w-[70%] max-w-xs rounded-md" />
            </div>
            <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 sm:grid-cols-[7.25rem_minmax(0,1fr)]">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-4 w-[60%] max-w-xs rounded-md" />
            </div>
          </div>
        </div>
        <Skeleton className="h-9 w-32 rounded-md sm:mt-1 sm:justify-self-end" />
      </div>
    </li>
  );
}

function TournamentsPageSkeleton() {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-16">
      <span className="sr-only">Loading tournaments</span>
      <header className="flex max-w-md flex-col gap-3 lg:sticky lg:top-28">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="h-12 w-full max-w-sm rounded-md sm:h-14 lg:h-16" />
        <Skeleton className="h-4 w-full max-w-xs rounded-md" />
        <Skeleton className="h-4 w-3/4 max-w-56 rounded-md" />
      </header>

      <ul className="flex flex-col">
        <TournamentListItemSkeleton index={0} />
        <TournamentListItemSkeleton index={1} />
        <TournamentListItemSkeleton index={2} />
      </ul>
    </div>
  );
}

export function TournamentsPage() {
  const {
    data: tournaments,
    isLoading,
    isError,
    error,
  } = usePublicTournaments();

  return (
    <LandingShell>
      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-8 sm:py-16 lg:px-12 lg:py-20">
        {isLoading ? (
          <TournamentsPageSkeleton />
        ) : isError ? (
          <Empty className="min-h-[40vh] border-0">
            <EmptyHeader>
              <EmptyTitle>Could not load tournaments</EmptyTitle>
              <EmptyDescription>
                {error instanceof Error
                  ? error.message
                  : "Something went wrong."}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : !(tournaments ?? []).length ? (
          <Empty className="min-h-[40vh] border-0">
            <EmptyHeader>
              <EmptyTitle>No upcoming or live tournaments</EmptyTitle>
              <EmptyDescription>
                Check back when the next event is announced or goes live.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-12 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start lg:gap-16">
            <header className="flex max-w-md flex-col gap-3 lg:sticky lg:top-28">
              <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
                Schedule
              </p>
              <h1 className="text-balance font-serif text-3xl tracking-tight sm:text-4xl lg:text-5xl">
                Upcoming and live events.
              </h1>
              <p className="text-pretty text-muted-foreground text-sm leading-relaxed sm:text-base">
                Open a tournament to see the match board for{" "}
                <span className="whitespace-nowrap">Barangay 176‑E</span>.
              </p>
            </header>

            <ul className="flex flex-col">
              {sortPublicTournaments(tournaments ?? []).map((t, i) => {
                const status = getTournamentStatusLabel(t.status);
                const venue = t.venue?.trim();

                return (
                  <li
                    key={t.id}
                    className={cn(
                      "border-border/40",
                      i === 0 ? "border-t border-b" : "border-b",
                    )}
                  >
                    <Link
                      to="/tournaments/$id"
                      params={{ id: t.id }}
                      className="group relative -mx-3 grid cursor-pointer gap-4 rounded-xl px-3 py-7 outline-none transition-[background-color,box-shadow] duration-300 hover:bg-primary/8 focus-visible:bg-primary/8 focus-visible:ring-2 focus-visible:ring-primary/50 sm:-mx-4 sm:grid-cols-[7.5rem_minmax(0,1fr)_auto] sm:items-start sm:gap-x-8 sm:px-4 sm:py-9"
                    >
                      <span
                        className={cn(
                          "pt-1 font-mono text-sm font-medium uppercase tracking-[0.18em] transition-colors group-hover:text-primary",
                          statusMarkClass(t.status),
                        )}
                      >
                        {status}
                      </span>

                      <div className="min-w-0 flex flex-col gap-3">
                        <h2 className="text-balance font-serif text-2xl tracking-tight underline decoration-transparent decoration-2 underline-offset-[0.2em] transition-[color,text-decoration-color] duration-300 group-hover:text-primary group-hover:decoration-primary/50 sm:text-3xl">
                          {tournamentLabel(
                            t as Parameters<typeof tournamentLabel>[0],
                          )}
                        </h2>
                        {venue ? (
                          <p className="text-pretty text-muted-foreground text-sm leading-relaxed">
                            {venue}
                          </p>
                        ) : null}
                        <div className="flex flex-col gap-1.5">
                          <ScheduleLine
                            label="Registration"
                            value={registrationSummary(t)}
                          />
                          <ScheduleLine
                            label="Tournament"
                            value={tournamentSummary(t)}
                          />
                        </div>
                      </div>

                      <span className="inline-flex w-fit items-center gap-2 border border-primary/35 bg-primary/10 px-3 py-2 font-mono text-[0.65rem] text-primary uppercase tracking-[0.18em] transition-[background-color,border-color,transform] duration-300 group-hover:border-primary/60 group-hover:bg-primary/20 group-active:translate-x-0.5 sm:mt-1 sm:justify-self-end">
                        View matches
                        <ArrowRight
                          className="size-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
                          aria-hidden
                        />
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </main>
    </LandingShell>
  );
}
