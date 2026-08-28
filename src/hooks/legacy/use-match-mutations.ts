import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toMatchWritePayload } from "@/lib/admin/match-write";
import { withCreatedAuditFields, withUpdatedAuditField } from "@/lib/legacy/mutation-authors";
import { supabase } from "@/lib/supabase/client";
import { emptyToNull, throwIfError } from "@/lib/supabase/errors";
import { queryKeys } from "@/lib/legacy/query-keys";
import type { MatchRecord } from "@/hooks/legacy/use-matches";
import type { Collections } from "@/types/__pocketbase-types";

type MatchInput = Partial<
  Omit<Collections["matches"], "id" | "created" | "updated">
>;
type CreateManyMatchesInput = {
  tournamentId: string;
  matches: MatchInput[];
};

function matchDbPayload(data: Record<string, unknown>) {
  const body = { ...data };
  for (const key of ["team_a", "team_b", "winner"] as const) {
    if (key in body) body[key] = emptyToNull(body[key] as string | null | undefined);
  }
  return body;
}

function invalidateMatches(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.matches });
}

function sortMatchList(list: MatchRecord[]) {
  return [...list].sort((a, b) => {
    const r = (a.round ?? "").localeCompare(b.round ?? "");
    if (r !== 0) return r;
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

export function useMatchMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: MatchInput) => {
      const payload = matchDbPayload(
        withCreatedAuditFields(toMatchWritePayload(data, "create")),
      );
      return throwIfError(
        await supabase.from("matches").insert(payload as never).select("*").single(),
      );
    },
    onMutate: async (data) => {
      const tid = data.tournament;
      if (!tid) return {};
      const qk = [...queryKeys.matches, tid] as const;
      await queryClient.cancelQueries({ queryKey: qk });
      const previous = queryClient.getQueryData<MatchRecord[]>(qk);
      const teamList =
        queryClient.getQueryData<Collections["teams"][]>(queryKeys.teams) ??
        [];
      const expand: NonNullable<MatchRecord["expand"]> = {};
      if (data.teamA) {
        const team = teamList.find((x) => x.id === data.teamA);
        if (team) expand.teamA = team;
      }
      if (data.teamB) {
        const team = teamList.find((x) => x.id === data.teamB);
        if (team) expand.teamB = team;
      }
      const optimistic: MatchRecord = {
        id: `optimistic-${crypto.randomUUID()}`,
        tournament: tid,
        matchLabel: data.matchLabel,
        round: data.round,
        order: data.order ?? 0,
        bestOf: data.bestOf ?? 3,
        teamA: data.teamA,
        teamB: data.teamB,
        status: data.status ?? "scheduled",
        notes: data.notes,
        scheduledAt: data.scheduledAt,
        scoreA: data.scoreA ?? 0,
        scoreB: data.scoreB ?? 0,
        winner: data.winner,
        expand,
      };
      queryClient.setQueryData(qk, (old: MatchRecord[] | undefined) =>
        sortMatchList([...(old ?? []), optimistic]),
      );
      return { previous, qk };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined && ctx.qk) {
        queryClient.setQueryData(ctx.qk, ctx.previous);
      }
    },
    onSettled: (_d, _e, variables) => {
      const tid = variables?.tournament;
      if (tid) {
        queryClient.invalidateQueries({ queryKey: [...queryKeys.matches, tid] });
      } else {
        invalidateMatches(queryClient);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: MatchInput & { id: string }) => {
      const { id, ...patch } = data;
      const payload = matchDbPayload(
        withUpdatedAuditField(toMatchWritePayload(patch, "update")),
      );
      return throwIfError(
        await supabase.from("matches").update(payload as never).eq("id", id).select("*").single(),
      );
    },
    onMutate: async (data) => {
      const { id, ...patch } = data;
      await queryClient.cancelQueries({ queryKey: queryKeys.matches });
      const snapshots: {
        queryKey: readonly unknown[];
        previous: MatchRecord[];
      }[] = [];
      const teamList =
        queryClient.getQueryData<Collections["teams"][]>(queryKeys.teams) ??
        [];
      const queries = queryClient.getQueriesData<MatchRecord[]>({
        queryKey: queryKeys.matches,
      });
      for (const [queryKey, list] of queries) {
        if (!list?.some((m) => m.id === id)) continue;
        snapshots.push({ queryKey, previous: list });
        queryClient.setQueryData(
          queryKey,
          list.map((m) => {
            if (m.id !== id) return m;
            const merged = { ...m, ...patch } as MatchRecord;
            const expand = { ...m.expand };
            if ("teamA" in patch) {
              expand.teamA = patch.teamA
                ? teamList.find((t) => t.id === patch.teamA)
                : undefined;
            }
            if ("teamB" in patch) {
              expand.teamB = patch.teamB
                ? teamList.find((t) => t.id === patch.teamB)
                : undefined;
            }
            if ("winner" in patch) {
              expand.winner = patch.winner
                ? teamList.find((t) => t.id === patch.winner)
                : undefined;
            }
            merged.expand = expand;
            return merged;
          }),
        );
      }
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots?.forEach(({ queryKey, previous }) => {
        queryClient.setQueryData(queryKey, previous);
      });
    },
    onSettled: () => invalidateMatches(queryClient),
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return throwIfError(
        await supabase
          .from("matches")
          .update(withUpdatedAuditField({ archived: true }) as never)
          .eq("id", id),
      );
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.matches });
      const snapshots: {
        queryKey: readonly unknown[];
        previous: MatchRecord[];
      }[] = [];
      const queries = queryClient.getQueriesData<MatchRecord[]>({
        queryKey: queryKeys.matches,
      });
      for (const [queryKey, list] of queries) {
        if (!list?.some((m) => m.id === id)) continue;
        snapshots.push({ queryKey, previous: list });
        queryClient.setQueryData(
          queryKey,
          list.filter((m) => m.id !== id),
        );
      }
      return { snapshots };
    },
    onError: (_err, _vars, ctx) => {
      ctx?.snapshots?.forEach(({ queryKey, previous }) => {
        queryClient.setQueryData(queryKey, previous);
      });
    },
    onSettled: () => invalidateMatches(queryClient),
  });

  const restoreMutation = useMutation({
    mutationFn: async (id: string) => {
      return throwIfError(
        await supabase
          .from("matches")
          .update(withUpdatedAuditField({ archived: false }) as never)
          .eq("id", id),
      );
    },
    onSettled: () => invalidateMatches(queryClient),
  });

  const createManyMutation = useMutation({
    mutationFn: async ({ tournamentId, matches }: CreateManyMatchesInput) => {
      const rows = matches.map((payload) =>
        matchDbPayload(
          withCreatedAuditFields(
            toMatchWritePayload(
              {
                ...payload,
                tournament: tournamentId,
              },
              "create",
            ),
          ),
        ),
      );
      const data = throwIfError(
        await supabase.from("matches").insert(rows as never).select("*"),
      );
      return (data ?? []) as unknown as MatchRecord[];
    },
    onSettled: (_data, _error, variables) => {
      const tid = variables?.tournamentId;
      if (tid) {
        queryClient.invalidateQueries({ queryKey: [...queryKeys.matches, tid] });
      } else {
        invalidateMatches(queryClient);
      }
    },
  });

  const publishDraftsMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      if (ids.length === 0) return;
      throwIfError(
        await supabase
          .from("matches")
          .update(withUpdatedAuditField({ status: "scheduled" }) as never)
          .in("id", ids),
      );
    },
    onSettled: () => invalidateMatches(queryClient),
  });

  return {
    create: {
      mutate: createMutation.mutate,
      mutateAsync: createMutation.mutateAsync,
      isPending: createMutation.isPending,
    },
    update: {
      mutate: updateMutation.mutate,
      mutateAsync: updateMutation.mutateAsync,
      isPending: updateMutation.isPending,
    },
    archive: {
      mutate: archiveMutation.mutate,
      mutateAsync: archiveMutation.mutateAsync,
      isPending: archiveMutation.isPending,
    },
    restore: {
      mutate: restoreMutation.mutate,
      mutateAsync: restoreMutation.mutateAsync,
      isPending: restoreMutation.isPending,
    },
    createMany: {
      mutate: createManyMutation.mutate,
      mutateAsync: createManyMutation.mutateAsync,
      isPending: createManyMutation.isPending,
    },
    publishDrafts: {
      mutate: publishDraftsMutation.mutate,
      mutateAsync: publishDraftsMutation.mutateAsync,
      isPending: publishDraftsMutation.isPending,
    },
  };
}
