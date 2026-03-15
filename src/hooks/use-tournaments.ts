import { useLiveQuery, eq } from "@tanstack/react-db";
import { tournamentsCollection } from "@/lib/collections";
import type { Collections } from "@/types/pocketbase-types";

type TournamentInput = Partial<
  Omit<Collections["tournaments"], "id" | "created" | "updated">
>;

export function useTournaments() {
  const result = useLiveQuery((q) =>
    q.from({ tournament: tournamentsCollection }).select(({ tournament }) => tournament)
  );
  return {
    ...result,
    data: result.data ?? [],
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.isError ? (result as { status?: unknown }).status : undefined,
    refetch: () => tournamentsCollection.utils.refetch(),
  };
}

export function useUpcomingTournaments() {
  const result = useLiveQuery((q) =>
    q
      .from({ tournament: tournamentsCollection })
      .where(({ tournament }) => eq(tournament.status, "upcoming"))
      .orderBy(({ tournament }) => tournament.startAt ?? "", "asc")
      .select(({ tournament }) => tournament)
  );
  return {
    ...result,
    data: result.data ?? [],
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.isError ? (result as { status?: unknown }).status : undefined,
    refetch: () => tournamentsCollection.utils.refetch(),
  };
}

export function useCurrentTournaments() {
  const result = useLiveQuery((q) =>
    q
      .from({ tournament: tournamentsCollection })
      .where(({ tournament }) => eq(tournament.status, "live"))
      .orderBy(({ tournament }) => tournament.startAt ?? "", "asc")
      .select(({ tournament }) => tournament)
  );
  return {
    ...result,
    data: result.data ?? [],
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.isError ? (result as { status?: unknown }).status : undefined,
    refetch: () => tournamentsCollection.utils.refetch(),
  };
}

export function useTournamentMutations() {
  return {
    create: {
      mutate: (data: TournamentInput) => {
        tournamentsCollection.insert({
          id: crypto.randomUUID(),
          ...data,
        } as Parameters<typeof tournamentsCollection.insert>[0]);
      },
      mutateAsync: async (data: TournamentInput) => {
        const tx = tournamentsCollection.insert({
          id: crypto.randomUUID(),
          ...data,
        } as Parameters<typeof tournamentsCollection.insert>[0]);
        return tx.isPersisted.promise;
      },
    },
    update: {
      mutate: ({ id, ...patch }: TournamentInput & { id: string }) => {
        tournamentsCollection.update(id, (draft) => Object.assign(draft, patch));
      },
      mutateAsync: async ({ id, ...patch }: TournamentInput & { id: string }) => {
        const tx = tournamentsCollection.update(id, (draft) =>
          Object.assign(draft, patch)
        );
        return tx.isPersisted.promise;
      },
    },
    delete: {
      mutate: (id: string) => {
        tournamentsCollection.delete(id);
      },
      mutateAsync: async (id: string) => {
        const tx = tournamentsCollection.delete(id);
        return tx.isPersisted.promise;
      },
    },
  };
}
