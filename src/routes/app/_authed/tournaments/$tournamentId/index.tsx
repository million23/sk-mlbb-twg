import { TournamentOverview } from "@/components/admin/overview/tournament-overview";
import { useTournamentParticipants } from "@/hooks/admin/use-tournament-participants";
import type { TournamentsRecord } from "@/hooks/orval/model/tournamentsRecord";
import { useTournaments } from "@/hooks/legacy/use-tournaments";
import { useListedTeams } from "@/hooks/registration/use-listed-teams";
import { isRegistrationWindowOpen } from "@/lib/registration/orval";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";

export const Route = createFileRoute(
  "/app/_authed/tournaments/$tournamentId/",
)({
  component: TournamentOverviewPage,
});

type TournamentFields = {
  title?: string;
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

function pickField(
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

function TournamentOverviewPage() {
  const { tournamentId } = Route.useParams();
  const tournamentsQuery = useTournaments();
  const participantsQuery = useTournamentParticipants(tournamentId);
  const teamsQuery = useListedTeams(tournamentId);

  const tournament = tournamentsQuery.data?.find((t) => t.id === tournamentId) as
    | TournamentFields
    | undefined;

  const fields = useMemo(() => {
    if (!tournament) return null;
    const startAt = pickField(tournament, "start_at", "startAt");
    const endAt = pickField(tournament, "end_at", "endAt");
    const registrationOpenAt = pickField(
      tournament,
      "registration_open_at",
      "registrationOpenAt",
    );
    const registrationCloseAt = pickField(
      tournament,
      "registration_close_at",
      "registrationCloseAt",
    );
    const registrationEnabled =
      tournament.registration_enabled ??
      tournament.registrationEnabled ??
      false;

    const forWindow: TournamentsRecord = {
      title: tournament.title ?? "",
      status: (tournament.status ?? "draft") as TournamentsRecord["status"],
      registration_enabled: registrationEnabled,
      registration_open_at: registrationOpenAt,
      registration_close_at: registrationCloseAt,
      archived: tournament.archived ?? false,
      min_team_size: 1,
      max_team_size: 1,
      bracket_count: 4,
      bracket_format: "single_elimination",
      match_best_of: 1,
    };

    return {
      title: tournament.title,
      status: tournament.status,
      venue: tournament.venue,
      startAt,
      endAt,
      registrationEnabled,
      registrationOpen: isRegistrationWindowOpen(forWindow),
      registrationOpenAt,
      registrationCloseAt,
    };
  }, [tournament]);

  const counts = useMemo(() => {
    const participants = participantsQuery.data ?? [];
    let pending = 0;
    let approved = 0;
    for (const p of participants) {
      if (p.registration_status === "pending") pending += 1;
      else if (p.registration_status === "approved") approved += 1;
    }
    return {
      pending,
      approved,
      teams: teamsQuery.data?.length ?? 0,
    };
  }, [participantsQuery.data, teamsQuery.data]);

  const isLoading =
    tournamentsQuery.isLoading ||
    participantsQuery.isLoading ||
    teamsQuery.isLoading;

  const isError =
    tournamentsQuery.isError ||
    participantsQuery.isError ||
    teamsQuery.isError;

  const notFound =
    !isLoading && !isError && tournamentsQuery.isSuccess && !tournament;

  const onRetry = () => {
    void tournamentsQuery.refetch();
    void participantsQuery.refetch();
    void teamsQuery.refetch();
  };

  return (
    <TournamentOverview
      tournamentId={tournamentId}
      title={fields?.title}
      status={fields?.status}
      venue={fields?.venue}
      startAt={fields?.startAt}
      endAt={fields?.endAt}
      registrationEnabled={fields?.registrationEnabled ?? false}
      registrationOpen={fields?.registrationOpen ?? false}
      registrationOpenAt={fields?.registrationOpenAt}
      registrationCloseAt={fields?.registrationCloseAt}
      pendingCount={counts.pending}
      approvedCount={counts.approved}
      teamCount={counts.teams}
      participants={participantsQuery.data ?? []}
      isLoading={isLoading}
      isError={isError}
      notFound={notFound}
      onRetry={onRetry}
    />
  );
}
