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
    const id = deps.tournament || open[0]?.id;
    if (!id) return { tournamentId: undefined as string | undefined };
    await Promise.all([
      context.queryClient.ensureQueryData(registrationTournamentQueryOptions(id)),
      context.queryClient.ensureQueryData(listedTeamsQueryOptions(id)),
    ]);
    return { tournamentId: id };
  },
  component: RegisterRoute,
});

function RegisterRoute() {
  const { tournament } = Route.useSearch();
  const { tournamentId } = Route.useLoaderData();
  return <RegisterPage tournamentId={tournament || tournamentId} />;
}
