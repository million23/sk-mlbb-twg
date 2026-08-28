import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  assertPermission,
  canManageTournaments,
} from "@/lib/admin/permissions";
import { getCommitteeAdminRecord } from "@/lib/supabase/committee-auth";
import { supabase } from "@/lib/supabase/client";
import { throwIfError } from "@/lib/supabase/errors";
import { withCreatedAuditFields, withUpdatedAuditField } from "@/lib/legacy/mutation-authors";
import { pocketbaseListQueryOptions } from "@/lib/legacy/pocketbase-list-query-options";
import type { Collections } from "@/lib/pocketbase.types";
import { queryKeys } from "@/lib/legacy/query-keys";

function assertCanManageTournaments() {
  assertPermission(
    canManageTournaments(getCommitteeAdminRecord()),
    "You do not have permission to manage tournaments.",
  );
}

type TournamentInput = Partial<
  Omit<Collections["tournaments"], "id" | "created" | "updated">
>;
type Tournament = Collections["tournaments"];

function invalidateTournamentQueries(
  queryClient: ReturnType<typeof useQueryClient>,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.tournaments });
  queryClient.invalidateQueries({ queryKey: queryKeys.tournamentsArchived });
  queryClient.invalidateQueries({ queryKey: queryKeys.publicUpcoming });
  queryClient.invalidateQueries({ queryKey: queryKeys.publicCurrent });
  queryClient.invalidateQueries({ queryKey: queryKeys.publicTournaments });
  queryClient.invalidateQueries({ queryKey: queryKeys.draftSuggestions });
}

export function useTournaments() {
  return useQuery({
    ...pocketbaseListQueryOptions,
    queryKey: queryKeys.tournaments,
    queryFn: async () => {
      const data = throwIfError(
        await supabase
          .from("tournaments")
          .select("*")
          .eq("archived", false)
          .order("created", { ascending: false }),
      );
      return (data ?? []) as Tournament[];
    },
  });
}

export function usePublicTournaments() {
  return useQuery({
    ...pocketbaseListQueryOptions,
    queryKey: queryKeys.publicTournaments,
    queryFn: async () => {
      const data = throwIfError(
        await supabase
          .from("tournaments")
          .select("*")
          .eq("archived", false)
          .in("status", ["upcoming", "live"])
          .order("created", { ascending: false }),
      );
      return (data ?? []) as Tournament[];
    },
  });
}

export function useUpcomingTournaments() {
  return useQuery({
    queryKey: [...queryKeys.tournaments, "upcoming"],
    queryFn: async () => {
      const data = throwIfError(
        await supabase
          .from("tournaments")
          .select("*")
          .eq("archived", false)
          .eq("status", "upcoming")
          .order("start_at", { ascending: true }),
      );
      return (data ?? []) as Tournament[];
    },
  });
}

export function useCurrentTournaments() {
  return useQuery({
    queryKey: [...queryKeys.tournaments, "current"],
    queryFn: async () => {
      const data = throwIfError(
        await supabase
          .from("tournaments")
          .select("*")
          .eq("archived", false)
          .eq("status", "live")
          .order("start_at", { ascending: true }),
      );
      return (data ?? []) as Tournament[];
    },
  });
}

export function useArchivedTournaments() {
  return useQuery({
    queryKey: queryKeys.tournamentsArchived,
    queryFn: async () => {
      const data = throwIfError(
        await supabase
          .from("tournaments")
          .select("*")
          .eq("archived", true)
          .order("updated", { ascending: false }),
      );
      return (data ?? []) as Tournament[];
    },
  });
}

export function useTournamentMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: TournamentInput) => {
      assertCanManageTournaments();
      return throwIfError(
        await supabase
          .from("tournaments")
          .insert(withCreatedAuditFields(data) as never)
          .select("*")
          .single(),
      );
    },
    onSettled: () => {
      invalidateTournamentQueries(queryClient);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: TournamentInput & { id: string }) => {
      assertCanManageTournaments();
      const { id, ...patch } = data;
      return throwIfError(
        await supabase
          .from("tournaments")
          .update(withUpdatedAuditField(patch) as never)
          .eq("id", id)
          .select("*")
          .single(),
      );
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tournaments });
      const prev = queryClient.getQueryData<Tournament[]>(queryKeys.tournaments);
      const { id, ...patch } = data;
      queryClient.setQueryData<Tournament[]>(queryKeys.tournaments, (old) =>
        old?.map((t) =>
          t.id === id
            ? { ...t, ...patch, updated: new Date().toISOString() }
            : t,
        ) ?? old,
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev != null) {
        queryClient.setQueryData(queryKeys.tournaments, ctx.prev);
      }
    },
    onSettled: () => {
      invalidateTournamentQueries(queryClient);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      assertCanManageTournaments();
      return throwIfError(
        await supabase
          .from("tournaments")
          .update(withUpdatedAuditField({ archived: true }) as never)
          .eq("id", id),
      );
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.tournaments });
      const prev = queryClient.getQueryData<Tournament[]>(queryKeys.tournaments);
      queryClient.setQueryData<Tournament[]>(queryKeys.tournaments, (old) =>
        old?.filter((t) => t.id !== id) ?? old,
      );
      return { prev };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.prev != null) {
        queryClient.setQueryData(queryKeys.tournaments, ctx.prev);
      }
    },
    onSettled: () => {
      invalidateTournamentQueries(queryClient);
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      assertCanManageTournaments();
      return throwIfError(
        await supabase
          .from("tournaments")
          .update(withUpdatedAuditField({ archived: false }) as never)
          .eq("id", id),
      );
    },
    onSettled: () => {
      invalidateTournamentQueries(queryClient);
    },
  });

  return {
    create: createMutation,
    update: updateMutation,
    archive: archiveMutation,
    restore: restoreMutation,
  };
}
