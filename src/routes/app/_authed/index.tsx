import {
  PlatformDashboard,
  type PlatformTournamentCard,
} from "@/components/admin/dashboard/platform-dashboard";
import type { TournamentsRecord } from "@/hooks/orval/model/tournamentsRecord";
import { useTournaments } from "@/hooks/legacy/use-tournaments";
import { useActiveTournamentId } from "@/lib/admin/active-tournament";
import { canViewDashboard } from "@/lib/admin/permissions";
import { requirePermission } from "@/lib/admin/require-permission";
import { tournamentLabel } from "@/lib/legacy/tournament-label";
import { isRegistrationWindowOpen } from "@/lib/registration/orval";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute("/app/_authed/")({
  beforeLoad: requirePermission(canViewDashboard),
  component: DashboardPage,
});

type TournamentFields = {
  id?: string;
  title?: string;
  slug?: string;
  status?: string;
  venue?: string;
  start_at?: string;
  startAt?: string;
  end_at?: string;
  endAt?: string;
  registration_enabled?: boolean;
  registrationEnabled?: boolean;
  registration_open_at?: string;
  registrationOpenAt?: string;
  registration_close_at?: string;
  registrationCloseAt?: string;
  archived?: boolean;
};

function pickString(
  t: TournamentFields,
  snake: keyof TournamentFields,
  camel: keyof TournamentFields,
): string | undefined {
  const a = t[snake];
  const b = t[camel];
  if (typeof a === "string" && a) return a;
  if (typeof b === "string" && b) return b;
  return undefined;
}

function toCard(t: TournamentFields): PlatformTournamentCard | null {
  if (!t.id) return null;

  const startAt = pickString(t, "start_at", "startAt");
  const endAt = pickString(t, "end_at", "endAt");
  const registrationOpenAt = pickString(
    t,
    "registration_open_at",
    "registrationOpenAt",
  );
  const registrationCloseAt = pickString(
    t,
    "registration_close_at",
    "registrationCloseAt",
  );
  const registrationEnabled =
    t.registration_enabled ?? t.registrationEnabled ?? false;

  const forWindow: TournamentsRecord = {
    title: t.title ?? "",
    status: (t.status ?? "draft") as TournamentsRecord["status"],
    registration_enabled: registrationEnabled,
    registration_open_at: registrationOpenAt,
    registration_close_at: registrationCloseAt,
    archived: t.archived ?? false,
    min_team_size: 1,
    max_team_size: 1,
    bracket_count: 1,
    bracket_format: "single_elimination",
    match_best_of: 1,
  };

  return {
    id: t.id,
    title: tournamentLabel({
      id: t.id,
      title: t.title,
      slug: t.slug,
    }),
    status: t.status,
    venue: t.venue,
    startAt,
    endAt,
    registrationEnabled,
    registrationOpen: isRegistrationWindowOpen(forWindow),
  };
}

function DashboardPage() {
  const tournamentsQuery = useTournaments();
  const activeTournamentId = useActiveTournamentId();

  const tournaments = useMemo(() => {
    const rows = (tournamentsQuery.data ?? []) as TournamentFields[];
    return rows
      .map(toCard)
      .filter((card): card is PlatformTournamentCard => card != null);
  }, [tournamentsQuery.data]);

  const resumeTournamentId = useMemo(() => {
    if (!activeTournamentId) return undefined;
    return tournaments.some((t) => t.id === activeTournamentId)
      ? activeTournamentId
      : undefined;
  }, [activeTournamentId, tournaments]);

  return (
    <PlatformDashboard
      tournaments={tournaments}
      resumeTournamentId={resumeTournamentId}
      isLoading={tournamentsQuery.isLoading}
      isError={tournamentsQuery.isError}
      onRetry={() => {
        void tournamentsQuery.refetch();
      }}
    />
  );
}
