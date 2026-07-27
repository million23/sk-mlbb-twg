import { setActiveTournamentId } from "@/lib/admin/active-tournament";
import { canAccessTournamentOps } from "@/lib/admin/permissions";
import { requirePermission } from "@/lib/admin/require-permission";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/app/_authed/tournaments/$tournamentId")({
  beforeLoad: requirePermission(canAccessTournamentOps),
  component: TournamentWorkspaceLayout,
});

function TournamentWorkspaceLayout() {
  const { tournamentId } = Route.useParams();

  useEffect(() => {
    setActiveTournamentId(tournamentId);
  }, [tournamentId]);

  return <Outlet />;
}
