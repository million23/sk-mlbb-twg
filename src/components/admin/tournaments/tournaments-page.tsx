import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStagger } from "@/components/admin/admin-stagger";
import { TournamentStatusBadge } from "@/components/admin/overview/tournament-status-badge";
import {
  TournamentFormDialog,
  type TournamentFormRecord,
  type TournamentFormValues,
} from "@/components/admin/tournaments/tournament-form-dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setActiveTournamentId } from "@/lib/admin/active-tournament";
import { tournamentLabel } from "@/lib/legacy/tournament-label";
import type { Collections } from "@/lib/pocketbase.types";
import { isRegistrationWindowOpen } from "@/lib/registration/orval";
import type { TournamentsRecord } from "@/hooks/orval/model/tournamentsRecord";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { format, isValid, parseISO } from "date-fns";
import {
  Archive,
  CalendarDays,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Trophy,
} from "lucide-react";
import type { ReactNode } from "react";

type TournamentRow = Collections["tournaments"] & {
  startAt?: string;
  endAt?: string;
  registrationEnabled?: boolean;
  registrationOpenAt?: string;
  registrationCloseAt?: string;
};

export type TournamentsPageProps = {
  canManage?: boolean;
  active: TournamentRow[];
  archived: TournamentRow[];
  activeLoading: boolean;
  archivedLoading: boolean;
  activeError: boolean;
  archivedError: boolean;
  formOpen: boolean;
  formMode: "create" | "edit";
  editing: TournamentFormRecord | null;
  formPending: boolean;
  archiveConfirmId: string | null;
  onRetryActive: () => void;
  onRetryArchived: () => void;
  onFormOpenChange: (open: boolean) => void;
  onCreate: () => void;
  onEdit: (tournament: TournamentRow) => void;
  onFormSubmit: (values: TournamentFormValues) => Promise<void> | void;
  onArchiveRequest: (id: string) => void;
  onArchiveConfirmOpenChange: (open: boolean) => void;
  onArchiveConfirm: () => void;
  onRestore: (id: string) => void;
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

function pickDate(t: TournamentRow, snake: "start_at" | "end_at"): string | undefined {
  if (snake === "start_at") return t.start_at || t.startAt;
  return t.end_at || t.endAt;
}

function registrationOpen(t: TournamentRow): boolean {
  const forWindow: TournamentsRecord = {
    title: t.title ?? "",
    status: t.status ?? "draft",
    registration_enabled:
      t.registration_enabled ?? t.registrationEnabled ?? false,
    registration_open_at: t.registration_open_at || t.registrationOpenAt,
    registration_close_at: t.registration_close_at || t.registrationCloseAt,
    archived: t.archived ?? false,
    min_team_size: t.min_team_size ?? 1,
    max_team_size: t.max_team_size ?? 1,
    bracket_count: t.bracket_count ?? 1,
    bracket_format: t.bracket_format ?? "single_elimination",
    match_best_of: t.match_best_of ?? 1,
  };
  return isRegistrationWindowOpen(forWindow);
}

function PageShell({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-6xl">{children}</div>;
}

export function TournamentsPage({
  canManage = true,
  active,
  archived,
  activeLoading,
  archivedLoading,
  activeError,
  archivedError,
  formOpen,
  formMode,
  editing,
  formPending,
  archiveConfirmId,
  onRetryActive,
  onRetryArchived,
  onFormOpenChange,
  onCreate,
  onEdit,
  onFormSubmit,
  onArchiveRequest,
  onArchiveConfirmOpenChange,
  onArchiveConfirm,
  onRestore,
}: TournamentsPageProps) {
  return (
    <PageShell>
      <div className="flex flex-col gap-8">
        <AdminStagger index={0}>
          <AdminPageHeader
            eyebrow="Platform"
            title="Tournaments"
            description="All events live here. Open one to manage its roster and bracket — multiple tournaments can be active at once."
            actions={
              canManage ? (
                <Button type="button" onClick={onCreate} className="gap-1.5">
                  <Plus className="size-4" />
                  Add tournament
                </Button>
              ) : undefined
            }
          />
        </AdminStagger>

        <AdminStagger index={1}>
          <Tabs defaultValue="active" className="gap-4">
            <TabsList>
              <TabsTrigger value="active">
                Active
                <span className="ml-1.5 font-mono text-[0.65rem] tabular-nums text-muted-foreground">
                  {activeLoading ? "…" : active.length}
                </span>
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived
                <span className="ml-1.5 font-mono text-[0.65rem] tabular-nums text-muted-foreground">
                  {archivedLoading ? "…" : archived.length}
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="flex flex-col gap-3">
              {activeLoading ? (
                <ListSkeleton />
              ) : activeError ? (
                <ErrorEmpty
                  title="Could not load tournaments"
                  description="Something went wrong fetching active events."
                  onRetry={onRetryActive}
                />
              ) : active.length === 0 ? (
                <Empty className="border border-border bg-background/60 backdrop-blur-sm">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Trophy />
                    </EmptyMedia>
                    <EmptyTitle>No active tournaments</EmptyTitle>
                    <EmptyDescription>
                      Create an event to start managing participants, teams, and
                      matches.
                    </EmptyDescription>
                  </EmptyHeader>
                  {canManage ? (
                    <Button type="button" onClick={onCreate}>
                      <Plus className="size-4" />
                      Add first tournament
                    </Button>
                  ) : null}
                </Empty>
              ) : (
                active.map((tournament) => (
                  <ActiveTournamentRow
                    key={tournament.id}
                    tournament={tournament}
                    canManage={canManage}
                    onEdit={() => onEdit(tournament)}
                    onArchive={() => onArchiveRequest(tournament.id)}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="archived" className="flex flex-col gap-3">
              {archivedLoading ? (
                <ListSkeleton />
              ) : archivedError ? (
                <ErrorEmpty
                  title="Could not load archived tournaments"
                  description="Something went wrong fetching soft-deleted events."
                  onRetry={onRetryArchived}
                />
              ) : archived.length === 0 ? (
                <Empty className="border border-border bg-background/60 backdrop-blur-sm">
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Archive />
                    </EmptyMedia>
                    <EmptyTitle>No archived tournaments</EmptyTitle>
                    <EmptyDescription>
                      Archived events show up here so you can restore them later.
                    </EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                archived.map((tournament) => (
                  <ArchivedTournamentRow
                    key={tournament.id}
                    tournament={tournament}
                    canManage={canManage}
                    onRestore={() => onRestore(tournament.id)}
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </AdminStagger>
      </div>

      {canManage ? (
        <TournamentFormDialog
          open={formOpen}
          onOpenChange={onFormOpenChange}
          mode={formMode}
          record={editing}
          pending={formPending}
          onSubmit={onFormSubmit}
        />
      ) : null}

      <AlertDialog
        open={canManage && Boolean(archiveConfirmId)}
        onOpenChange={onArchiveConfirmOpenChange}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              It will leave the active list and can be restored from the Archived
              tab. Workspace data stays intact.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onArchiveConfirm}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
      <Skeleton className="h-28 rounded-2xl" />
    </div>
  );
}

function ErrorEmpty({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry: () => void;
}) {
  return (
    <Empty className="border border-border bg-background/60 backdrop-blur-sm">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Trophy />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <Button type="button" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </Empty>
  );
}

function ActiveTournamentRow({
  tournament,
  canManage,
  onEdit,
  onArchive,
}: {
  tournament: TournamentRow;
  canManage: boolean;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const startAt = pickDate(tournament, "start_at");
  const endAt = pickDate(tournament, "end_at");
  const dateRange = formatDateRange(startAt, endAt);
  const isOpen = registrationOpen(tournament);
  const regEnabled =
    tournament.registration_enabled ?? tournament.registrationEnabled ?? false;
  const registrationLabel = !regEnabled
    ? "Registration disabled"
    : isOpen
      ? "Registration open"
      : "Registration closed";

  return (
    <article
      className="group flex flex-col gap-4 rounded-2xl border border-border/80 bg-background/70 p-5 shadow-xs backdrop-blur-sm transition-[transform,border-color,background-color] duration-200 hover:-translate-y-px hover:border-primary/25 hover:bg-background sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-heading text-lg font-semibold tracking-tight">
            {tournamentLabel(tournament)}
          </h2>
          <TournamentStatusBadge status={tournament.status} />
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {tournament.venue ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/80 bg-background/70 px-2.5 py-1 text-muted-foreground text-xs">
              <MapPin className="size-3 shrink-0 text-primary/80" />
              <span className="truncate">{tournament.venue}</span>
            </span>
          ) : null}
          <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/80 bg-background/70 px-2.5 py-1 text-muted-foreground text-xs">
            <CalendarDays className="size-3 shrink-0 text-primary/80" />
            <span className="truncate">{dateRange ?? "Dates not set yet"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className={cn(
                "size-1.5 rounded-full",
                isOpen
                  ? "bg-success shadow-[0_0_0_3px] shadow-success/20 animate-pulse"
                  : "bg-muted-foreground/40",
              )}
              aria-hidden
            />
            {registrationLabel}
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 sm:justify-end">
        {canManage ? (
          <>
            <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={onArchive}
            >
              <Archive className="size-3.5" />
              Archive
            </Button>
          </>
        ) : null}
        <Link
          to="/app/tournaments/$tournamentId"
          params={{ tournamentId: tournament.id }}
          onClick={() => setActiveTournamentId(tournament.id)}
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "gap-1.5",
          )}
        >
          Open workspace
          <ChevronRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}

function ArchivedTournamentRow({
  tournament,
  canManage,
  onRestore,
}: {
  tournament: TournamentRow;
  canManage: boolean;
  onRestore: () => void;
}) {
  const updatedLabel = formatWhen(tournament.updated);

  return (
    <article
      className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-background/60 p-5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-heading text-lg font-semibold tracking-tight">
            {tournamentLabel(tournament)}
          </h2>
          <TournamentStatusBadge status={tournament.status} />
        </div>
        <p className="mt-1.5 font-mono text-[0.7rem] text-muted-foreground uppercase tracking-wider">
          Archived{" "}
          <span className="normal-case tracking-normal text-foreground/70">
            {updatedLabel ?? "—"}
          </span>
        </p>
      </div>
      {canManage ? (
        <Button type="button" variant="outline" size="sm" onClick={onRestore}>
          <RotateCcw className="size-3.5" />
          Restore
        </Button>
      ) : null}
    </article>
  );
}
