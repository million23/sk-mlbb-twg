import { setActiveTournamentId } from "@/lib/admin/active-tournament";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/app/_authed/tournaments/$tournamentId")({
  component: TournamentWorkspaceLayout,
});

function TournamentWorkspaceLayout() {
  const { tournamentId } = Route.useParams();

  useEffect(() => {
    setActiveTournamentId(tournamentId);
  }, [tournamentId]);

  return <Outlet />;
}
