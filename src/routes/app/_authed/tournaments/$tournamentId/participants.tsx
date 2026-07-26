import { ParticipantDetailSheet } from "@/components/admin/participants/participant-detail-sheet";
import { ParticipantFormDialog } from "@/components/admin/participants/participant-form-dialog";
import { RegistrationStatusBadge } from "@/components/admin/participants/registration-status-badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  participantMutationErrorMessage,
  useParticipantMutations,
  useTournamentParticipants,
} from "@/hooks/admin/use-tournament-participants";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import { useListedTeams } from "@/hooks/registration/use-listed-teams";
import { useTournaments } from "@/hooks/legacy/use-tournaments";
import { TEAM_INTENT_LABELS } from "@/lib/admin/participant-approval";
import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import { tournamentDayFromStartAt } from "@/lib/registration/orval";
import type { TeamIntent } from "@/lib/registration/flow";
import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type StatusTab = "pending" | "approved" | "rejected" | "all";

export const Route = createFileRoute(
  "/app/_authed/tournaments/$tournamentId/participants",
)({
  component: TournamentParticipantsPage,
});

function TournamentParticipantsPage() {
  const { tournamentId } = Route.useParams();
  const { data: participants = [], isLoading, isError, error, refetch } =
    useTournamentParticipants(tournamentId);
  const { data: listedTeams = [] } = useListedTeams(tournamentId);
  const { data: tournaments } = useTournaments();
  const mutations = useParticipantMutations(tournamentId);

  const tournament = tournaments?.find((t) => t.id === tournamentId);
  const tournamentDay = useMemo(() => {
    if (!tournament) return "";
    const t = tournament as {
      start_at?: string;
      startAt?: string;
      registration_close_at?: string;
      registrationCloseAt?: string;
      registration_open_at?: string;
      registrationOpenAt?: string;
    };
    return (
      tournamentDayFromStartAt(t.start_at || t.startAt) ||
      tournamentDayFromStartAt(t.registration_close_at || t.registrationCloseAt) ||
      tournamentDayFromStartAt(t.registration_open_at || t.registrationOpenAt) ||
      ""
    );
  }, [tournament]);

  const teamNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of listedTeams) map.set(t.id, t.name);
    for (const p of participants) {
      const expand = (
        p as ParticipantsRecord & {
          expand?: { preferred_team?: { name?: string; id?: string } };
        }
      ).expand?.preferred_team;
      if (expand?.id && expand.name) map.set(expand.id, expand.name);
    }
    return map;
  }, [listedTeams, participants]);

  const [tab, setTab] = useState<StatusTab>("pending");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ParticipantsRecord | null>(null);

  const selected =
    participants.find((p) => p.id === selectedId) ?? null;

  const counts = useMemo(() => {
    const c = { pending: 0, approved: 0, rejected: 0, all: participants.length };
    for (const p of participants) {
      if (p.registration_status === "pending") c.pending += 1;
      else if (p.registration_status === "approved") c.approved += 1;
      else if (p.registration_status === "rejected") c.rejected += 1;
    }
    return c;
  }, [participants]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return participants.filter((p) => {
      if (tab !== "all" && p.registration_status !== tab) return false;
      if (!q) return true;
      const hay = [
        p.name,
        p.email,
        p.ign,
        p.user_id,
        p.contact_number,
        p.registration_status_code,
        p.preferred_team_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [participants, tab, search]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Participants
          </h1>
          <p className="mt-1 text-muted-foreground text-sm text-pretty">
            Review registrants, view documents, approve or reject, and manage
            the roster.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus className="size-4" />
          Add participant
        </Button>
      </div>

      <Tabs
        value={tab}
        onValueChange={(v) => setTab((v as StatusTab) ?? "pending")}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="pending">
              Pending ({counts.pending})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({counts.approved})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              Rejected ({counts.rejected})
            </TabsTrigger>
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
          </TabsList>
          <InputGroup className="w-full sm:max-w-xs">
            <InputGroupAddon>
              <Search className="size-4" />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search name, IGN, email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </InputGroup>
        </div>

        <TabsContent value={tab} className="mt-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <Empty className="border border-border">
              <EmptyHeader>
                <EmptyTitle>Could not load participants</EmptyTitle>
                <EmptyDescription>
                  {error instanceof Error ? error.message : "Unknown error"}
                </EmptyDescription>
              </EmptyHeader>
              <Button type="button" variant="outline" onClick={() => refetch()}>
                Retry
              </Button>
            </Empty>
          ) : filtered.length === 0 ? (
            <Empty className="border border-border">
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users />
                </EmptyMedia>
                <EmptyTitle>
                  {tab === "pending"
                    ? "No pending registrants"
                    : "No participants here"}
                </EmptyTitle>
                <EmptyDescription>
                  {search.trim()
                    ? "Try a different search."
                    : tab === "pending"
                      ? "New public registrations will show up here for committee review."
                      : "Nothing matches this filter yet."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>IGN</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Phase
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Team intent
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Registered
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const intent = (p.team_intent ??
                      "open_matching") as TeamIntent;
                    return (
                      <TableRow
                        key={p.id}
                        className="cursor-pointer"
                        onClick={() => setSelectedId(p.id ?? null)}
                      >
                        <TableCell className="font-medium">
                          <div className="min-w-0">
                            <p className="truncate">
                              {formatParticipantNameDisplay(p.name)}
                            </p>
                            <p className="truncate text-muted-foreground text-xs md:hidden">
                              {p.email}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {p.ign}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {p.address_phase}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {TEAM_INTENT_LABELS[intent]}
                        </TableCell>
                        <TableCell>
                          <RegistrationStatusBadge
                            status={p.registration_status}
                          />
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground text-sm sm:table-cell">
                          {p.created
                            ? format(parseISO(p.created), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <ParticipantDetailSheet
        record={selected}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        listedTeams={listedTeams}
        peers={participants}
        tournamentDay={tournamentDay}
        teamNameById={teamNameById}
        approvePending={mutations.approve.isPending}
        rejectPending={mutations.reject.isPending}
        archivePending={mutations.archive.isPending}
        onApprove={async () => {
          if (!selected?.id) return;
          try {
            await mutations.approve.mutateAsync(selected.id);
            toast.success("Registration approved");
          } catch (err) {
            toast.error(participantMutationErrorMessage(err));
          }
        }}
        onReject={async (reason) => {
          if (!selected?.id) return;
          try {
            await mutations.reject.mutateAsync({ id: selected.id, reason });
            toast.success("Registration rejected");
          } catch (err) {
            toast.error(participantMutationErrorMessage(err));
          }
        }}
        onEdit={() => {
          if (!selected) return;
          setEditing(selected);
          setFormOpen(true);
        }}
        onArchive={async () => {
          if (!selected?.id) return;
          try {
            await mutations.archive.mutateAsync(selected.id);
            setSelectedId(null);
            toast.success("Participant archived");
          } catch (err) {
            toast.error(participantMutationErrorMessage(err));
          }
        }}
      />

      <ParticipantFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        mode={editing ? "edit" : "create"}
        record={editing}
        listedTeams={listedTeams}
        pending={mutations.create.isPending || mutations.update.isPending}
        onSubmit={async ({ values, uploads }) => {
          try {
            if (editing?.id) {
              await mutations.update.mutateAsync({
                id: editing.id,
                values,
                uploads,
              });
              toast.success("Participant updated");
            } else {
              await mutations.create.mutateAsync({ values, uploads });
              toast.success("Participant created");
            }
            setFormOpen(false);
            setEditing(null);
          } catch (err) {
            toast.error(participantMutationErrorMessage(err));
          }
        }}
      />
    </div>
  );
}
