import { TournamentsPage } from "@/components/admin/tournaments/tournaments-page";
import type {
  TournamentFormRecord,
  TournamentFormValues,
} from "@/components/admin/tournaments/tournament-form-dialog";
import {
  useArchivedTournaments,
  useTournamentMutations,
  useTournaments,
} from "@/hooks/legacy/use-tournaments";
import type { Collections } from "@/lib/pocketbase.types";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/_authed/tournaments/")({
  component: TournamentsListPage,
});

function toPayload(
  values: TournamentFormValues,
  existing?: TournamentFormRecord | null,
) {
  const maxTeams = values.max_teams.trim()
    ? Number(values.max_teams)
    : null;

  return {
    title: values.title,
    slug: values.slug,
    description: values.description || null,
    venue: values.venue,
    start_at: values.start_at,
    end_at: values.end_at,
    status: values.status,
    registration_enabled: values.registration_enabled,
    registration_open_at: values.registration_open_at || null,
    registration_close_at: values.registration_close_at || null,
    max_teams: maxTeams,
    min_team_size: Number(values.min_team_size),
    max_team_size: Number(values.max_team_size),
    bracket_count: existing?.bracket_count ?? 1,
    bracket_format: (existing?.bracket_format ??
      "single_elimination") as Collections["tournaments"]["bracket_format"],
    match_best_of: Number(values.match_best_of),
    archived: existing?.archived ?? false,
  };
}

function mutationErrorMessage(err: unknown): string {
  if (err && typeof err === "object") {
    const pb = err as {
      message?: string;
      response?: { message?: string; data?: Record<string, { message?: string }> };
    };
    const fieldErrors = pb.response?.data;
    if (fieldErrors) {
      const first = Object.values(fieldErrors).find((v) => v?.message)?.message;
      if (first) return first;
    }
    if (pb.response?.message) return pb.response.message;
    if (pb.message) return pb.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return "Could not save tournament";
}

function TournamentsListPage() {
  const activeQuery = useTournaments();
  const archivedQuery = useArchivedTournaments();
  const mutations = useTournamentMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editing, setEditing] = useState<TournamentFormRecord | null>(null);
  const [formPending, setFormPending] = useState(false);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(null);

  const openCreate = () => {
    setFormMode("create");
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (tournament: TournamentFormRecord) => {
    setFormMode("edit");
    setEditing(tournament);
    setFormOpen(true);
  };

  const handleFormSubmit = async (values: TournamentFormValues) => {
    // null clears optional PocketBase fields; cast keeps mutation input flexible.
    const payload = toPayload(values, editing) as Parameters<
      typeof mutations.create.mutateAsync
    >[0];
    setFormPending(true);
    try {
      if (formMode === "edit" && editing?.id) {
        await mutations.update.mutateAsync({ id: editing.id, ...payload });
        toast.success("Tournament updated");
      } else {
        await mutations.create.mutateAsync(payload);
        toast.success("Tournament added");
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      toast.error(mutationErrorMessage(err));
      throw err;
    } finally {
      setFormPending(false);
    }
  };

  const handleArchiveConfirm = () => {
    if (!archiveConfirmId) return;
    const id = archiveConfirmId;
    setArchiveConfirmId(null);
    mutations.archive.mutate(id, {
      onSuccess: () => toast.success("Tournament archived"),
      onError: (err: unknown) => toast.error(mutationErrorMessage(err)),
    });
  };

  const handleRestore = (id: string) => {
    mutations.restore.mutate(id, {
      onSuccess: () => toast.success("Tournament restored"),
      onError: (err: unknown) => toast.error(mutationErrorMessage(err)),
    });
  };

  return (
    <TournamentsPage
      active={activeQuery.data ?? []}
      archived={archivedQuery.data ?? []}
      activeLoading={activeQuery.isLoading}
      archivedLoading={archivedQuery.isLoading}
      activeError={activeQuery.isError}
      archivedError={archivedQuery.isError}
      formOpen={formOpen}
      formMode={formMode}
      editing={editing}
      formPending={formPending}
      archiveConfirmId={archiveConfirmId}
      onRetryActive={() => {
        void activeQuery.refetch();
      }}
      onRetryArchived={() => {
        void archivedQuery.refetch();
      }}
      onFormOpenChange={setFormOpen}
      onCreate={openCreate}
      onEdit={openEdit}
      onFormSubmit={handleFormSubmit}
      onArchiveRequest={setArchiveConfirmId}
      onArchiveConfirmOpenChange={(open) => {
        if (!open) setArchiveConfirmId(null);
      }}
      onArchiveConfirm={handleArchiveConfirm}
      onRestore={handleRestore}
    />
  );
}
