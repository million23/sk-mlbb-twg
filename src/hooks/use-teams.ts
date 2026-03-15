import { useLiveQuery } from "@tanstack/react-db";
import { teamsCollection } from "@/lib/collections";
import type { Collections } from "@/types/pocketbase-types";

type TeamInput = Partial<Omit<Collections["teams"], "id" | "created" | "updated">>;

export function useTeams() {
  const result = useLiveQuery((q) =>
    q.from({ team: teamsCollection }).select(({ team }) => team)
  );
  return {
    ...result,
    data: result.data ?? [],
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.isError ? (result as { status?: unknown }).status : undefined,
    refetch: () => teamsCollection.utils.refetch(),
  };
}

export function useTeamMutations() {
  return {
    create: {
      mutate: (data: TeamInput) => {
        teamsCollection.insert({
          id: crypto.randomUUID(),
          ...data,
        } as Parameters<typeof teamsCollection.insert>[0]);
      },
      mutateAsync: async (data: TeamInput) => {
        const tx = teamsCollection.insert({
          id: crypto.randomUUID(),
          ...data,
        } as Parameters<typeof teamsCollection.insert>[0]);
        return tx.isPersisted.promise;
      },
    },
    update: {
      mutate: ({ id, ...patch }: TeamInput & { id: string }) => {
        teamsCollection.update(id, (draft) => Object.assign(draft, patch));
      },
      mutateAsync: async ({ id, ...patch }: TeamInput & { id: string }) => {
        const tx = teamsCollection.update(id, (draft) =>
          Object.assign(draft, patch)
        );
        return tx.isPersisted.promise;
      },
    },
    delete: {
      mutate: (id: string) => {
        teamsCollection.delete(id);
      },
      mutateAsync: async (id: string) => {
        const tx = teamsCollection.delete(id);
        return tx.isPersisted.promise;
      },
    },
  };
}
