import { RegisterPage } from "@/components/registration/register-page";
import {
  openRegistrationTournamentsQueryOptions,
  registrationTournamentQueryOptions,
  listedTeamsQueryOptions,
} from "@/hooks/registration";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const registerSearchSchema = z.object({
  tournament: z.string().optional(),
});

export const Route = createFileRoute("/register")({
  validateSearch: registerSearchSchema,
  loaderDeps: ({ search }) => ({ tournament: search.tournament }),
  loader: async ({ context, deps }) => {
    const open = await context.queryClient.ensureQueryData(
      openRegistrationTournamentsQueryOptions(),
    );
    // Only tournaments with an open registration window are selectable.
    // Do not default to the first open tournament — registrant picks first.
    const id =
      deps.tournament && open.some((t) => t.id === deps.tournament)
        ? deps.tournament
        : undefined;
    if (!id) return;
    await Promise.all([
      context.queryClient.ensureQueryData(registrationTournamentQueryOptions(id)),
      context.queryClient.ensureQueryData(listedTeamsQueryOptions(id)),
    ]);
  },
  component: RegisterRoute,
});

function RegisterRoute() {
  const { tournament } = Route.useSearch();
  return <RegisterPage tournamentId={tournament} />;
}
