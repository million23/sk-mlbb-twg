import { useLiveQuery } from "@tanstack/react-db";
import { participantsCollection } from "@/lib/collections";
import type { Collections } from "@/types/pocketbase-types";

type ParticipantInput = Partial<
  Omit<Collections["participants"], "id" | "created" | "updated">
>;

export function useParticipants() {
  const result = useLiveQuery((q) =>
    q.from({ participant: participantsCollection }).select(({ participant }) => participant)
  );
  return {
    ...result,
    data: result.data ?? [],
    isLoading: result.isLoading,
    isError: result.isError,
    error: result.isError ? (result as { status?: unknown }).status : undefined,
    refetch: () => participantsCollection.utils.refetch(),
  };
}

export function useParticipantMutations() {
  return {
    create: {
      mutate: (data: ParticipantInput) => {
        participantsCollection.insert({
          id: crypto.randomUUID(),
          ...data,
        } as Parameters<typeof participantsCollection.insert>[0]);
      },
      mutateAsync: async (data: ParticipantInput) => {
        const tx = participantsCollection.insert({
          id: crypto.randomUUID(),
          ...data,
        } as Parameters<typeof participantsCollection.insert>[0]);
        return tx.isPersisted.promise;
      },
    },
    update: {
      mutate: ({ id, ...patch }: ParticipantInput & { id: string }) => {
        participantsCollection.update(id, (draft) => Object.assign(draft, patch));
      },
      mutateAsync: async ({ id, ...patch }: ParticipantInput & { id: string }) => {
        const tx = participantsCollection.update(id, (draft) =>
          Object.assign(draft, patch)
        );
        return tx.isPersisted.promise;
      },
    },
    delete: {
      mutate: (id: string) => {
        participantsCollection.delete(id);
      },
      mutateAsync: async (id: string) => {
        const tx = participantsCollection.delete(id);
        return tx.isPersisted.promise;
      },
    },
  };
}
