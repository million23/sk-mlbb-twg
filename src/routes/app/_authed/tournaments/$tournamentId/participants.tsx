import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStagger } from "@/components/admin/admin-stagger";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useAdminRbac } from "@/hooks/admin/use-admin-rbac";
import {
  participantMutationErrorMessage,
  useParticipantMutations,
  useTournamentParticipants,
} from "@/hooks/admin/use-tournament-participants";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import { useListedTeams } from "@/hooks/registration/use-listed-teams";
import { useTournaments } from "@/hooks/legacy/use-tournaments";
import { TEAM_INTENT_LABELS, hasPurokEndorsement, isConditionalApproval } from "@/lib/admin/participant-approval";
import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import * as XLSX from "xlsx";
import { tournamentDayFromStartAt } from "@/lib/registration/orval";
import type { TeamIntent } from "@/lib/registration/flow";
import { createFileRoute } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Download, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type StatusTab = "pending" | "approved" | "rejected" | "all";

type StatusCounts = Record<StatusTab, number>;

const STATUS_TAB_OPTIONS: {
  value: StatusTab;
  label: (counts: StatusCounts) => string;
}[] = [
  { value: "pending", label: (c) => `Pending (${c.pending})` },
  { value: "approved", label: (c) => `Approved (${c.approved})` },
  { value: "rejected", label: (c) => `Rejected (${c.rejected})` },
  { value: "all", label: (c) => `All (${c.all})` },
];

function createParticipantWorksheet(
  participants: ParticipantsRecord[],
  teamNameById: Map<string, string>,
) {
  const rows = participants.map((p) => {
    const intent = (p.team_intent ?? "open_matching") as TeamIntent;
    const preferredLanes = p.preferred_roles?.length
      ? p.preferred_roles
      : p.preferred_lane
        ? [p.preferred_lane]
        : [];

    return {
      Name: formatParticipantNameDisplay(p.name),
      Email: p.email ?? "",
      IGN: p.ign ?? "",
      "User ID": p.user_id ?? "",
      "Server ID": p.server_id ?? "",
      Contact: p.contact_number ?? "",
      Phase: p.address_phase ?? "",
      Package: p.address_package ?? "",
      Block: p.address_block ?? "",
      Lot: p.address_lot ?? "",
      "Preferred Lane": p.preferred_lane ?? "",
      "Preferred Lanes": preferredLanes.join(", "),
      "Team Intent": TEAM_INTENT_LABELS[intent] ?? intent,
      "Preferred Team":
        p.preferred_team_name ??
        (p.preferred_team
          ? teamNameById.get(p.preferred_team) ?? p.preferred_team
          : ""),
      Team: p.team ? teamNameById.get(p.team) ?? p.team : "",
      Status: isConditionalApproval(p)
        ? "conditionally approved"
        : (p.registration_status ?? ""),
      Endorsement: hasPurokEndorsement(p) ? "on file" : "present at tournament",
      "Registration Status Code": p.registration_status_code ?? "",
      "Rejection Reason": p.registration_reject_reason ?? "",
      Registered: p.created ?? "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: [
      "Name",
      "Email",
      "IGN",
      "User ID",
      "Server ID",
      "Contact",
      "Phase",
      "Package",
      "Block",
      "Lot",
      "Preferred Lane",
      "Preferred Lanes",
      "Team Intent",
      "Preferred Team",
      "Team",
      "Status",
      "Endorsement",
      "Registration Status Code",
      "Rejection Reason",
      "Registered",
    ],
  });
  const worksheetRef = worksheet["!ref"];
  const headerRange = worksheetRef
    ? XLSX.utils.decode_range(worksheetRef)
    : null;
  if (headerRange && worksheetRef) {
    for (let column = headerRange.s.c; column <= headerRange.e.c; column += 1) {
      const cellAddress = XLSX.utils.encode_cell({ r: headerRange.s.r, c: column });
      const headerCell = worksheet[cellAddress];
      if (!headerCell) continue;
      headerCell.s = {
        fill: { fgColor: { rgb: "1F4E78" } },
        font: { bold: true, color: { rgb: "FFFFFF" } },
        alignment: { horizontal: "center", vertical: "center", wrapText: true },
        border: {
          top: { style: "thin", color: { rgb: "17365D" } },
          bottom: { style: "thin", color: { rgb: "17365D" } },
          left: { style: "thin", color: { rgb: "17365D" } },
          right: { style: "thin", color: { rgb: "17365D" } },
        },
      };
    }
    worksheet["!rows"] = [{ hpt: 28 }];
    worksheet["!autofilter"] = { ref: worksheetRef };
  }
  worksheet["!cols"] = [
    { wch: 24 },
    { wch: 30 },
    { wch: 18 },
    { wch: 14 },
    { wch: 12 },
    { wch: 16 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
    { wch: 16 },
    { wch: 24 },
    { wch: 18 },
    { wch: 24 },
    { wch: 24 },
    { wch: 14 },
    { wch: 24 },
    { wch: 30 },
    { wch: 24 },
  ];

  return worksheet;
}

function exportParticipants(
  participants: ParticipantsRecord[],
  teamNameById: Map<string, string>,
  tournamentName: string,
) {
  const workbook = XLSX.utils.book_new();
  const sheets: { name: string; rows: ParticipantsRecord[] }[] = [
    { name: "All", rows: participants },
    {
      name: "Pending",
      rows: participants.filter((p) => p.registration_status === "pending"),
    },
    {
      name: "Approved",
      rows: participants.filter((p) => p.registration_status === "approved"),
    },
    {
      name: "Rejected",
      rows: participants.filter((p) => p.registration_status === "rejected"),
    },
  ];

  for (const sheet of sheets) {
    XLSX.utils.book_append_sheet(
      workbook,
      createParticipantWorksheet(sheet.rows, teamNameById),
      sheet.name,
    );
  }

  const safeTournamentName = tournamentName
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "") || "tournament";
  XLSX.writeFile(
    workbook,
    `${safeTournamentName}-participants-${new Date().toISOString().slice(0, 10)}.xlsx`,
    { cellStyles: true },
  );
}

export const Route = createFileRoute(
  "/app/_authed/tournaments/$tournamentId/participants",
)({
  component: TournamentParticipantsPage,
});

function TournamentParticipantsPage() {
  const { tournamentId } = Route.useParams();
  const { canManageParticipants } = useAdminRbac();
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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <AdminStagger index={0}>
        <AdminPageHeader
          eyebrow="Tournament workspace"
          title="Participants"
          description="Review registrants, view documents, approve or reject, and manage the roster."
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={participants.length === 0}
                onClick={() =>
                  exportParticipants(
                    participants,
                    teamNameById,
                    tournament?.title ?? "tournament",
                  )
                }
              >
                <Download className="size-4" />
                Export Excel
              </Button>
              {canManageParticipants ? (
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
              ) : null}
            </div>
          }
        />
      </AdminStagger>

      <AdminStagger index={1}>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab((v as StatusTab) ?? "pending")}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <Select
              value={tab}
              onValueChange={(v) => setTab((v as StatusTab) ?? "pending")}
            >
              <SelectTrigger className="w-full md:hidden">
                <SelectValue>
                  {(value) => {
                    const opt = STATUS_TAB_OPTIONS.find((o) => o.value === value);
                    return opt ? opt.label(counts) : "Filter participants";
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {STATUS_TAB_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label(counts)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <TabsList className="hidden w-fit md:inline-flex">
              {STATUS_TAB_OPTIONS.map((opt) => (
                <TabsTrigger key={opt.value} value={opt.value}>
                  {opt.label(counts)}
                </TabsTrigger>
              ))}
            </TabsList>

            <InputGroup className="w-full md:max-w-xs">
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => refetch()}
                >
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
                              hasPurokEndorsement={hasPurokEndorsement(p)}
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
      </AdminStagger>


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
        canManage={canManageParticipants}
        approvePending={mutations.approve.isPending}
        rejectPending={mutations.reject.isPending}
        archivePending={mutations.archive.isPending}
        formTeamPending={
          mutations.formCreateTeam.isPending || mutations.formJoinTeam.isPending
        }
        onApprove={async () => {
          if (!selected?.id || !canManageParticipants) return;
          try {
            const { joinResult, teamResult } =
              await mutations.approve.mutateAsync(selected.id);
            const conditional = !hasPurokEndorsement(selected);
            const suffix = conditional
              ? " Present purok endorsement at the tournament."
              : "";
            if (joinResult.assigned && !joinResult.alreadyAssigned) {
              toast.success(
                `Approved. Joined team "${joinResult.teamName || "preferred team"}".${suffix}`,
              );
            } else if (teamResult.formed) {
              toast.success(
                teamResult.createdNew
                  ? `Approved. Created team "${teamResult.teamName}" with ${teamResult.memberCount} members.${suffix}`
                  : `Approved. Assigned to team "${teamResult.teamName}" (${teamResult.memberCount} members).${suffix}`,
              );
            } else if (teamResult.reason === "still_pending") {
              toast.success(
                `Registration approved. Team will appear when all teammates with this name are approved.${suffix}`,
              );
            } else if (
              joinResult.assigned === false &&
              joinResult.reason === "team_not_found"
            ) {
              toast.success(
                `Registration approved. Preferred team was missing. Assign manually.${suffix}`,
              );
            } else {
              toast.success(
                conditional
                  ? "Conditionally approved. Present purok endorsement at the tournament."
                  : "Registration approved",
              );
            }
          } catch (err) {
            toast.error(participantMutationErrorMessage(err));
          }
        }}
        onFormCreateTeam={async () => {
          if (!selected || !canManageParticipants) return;
          try {
            if (selected.team_intent === "join_team") {
              const joinResult =
                await mutations.formJoinTeam.mutateAsync(selected);
              if (joinResult.assigned && !joinResult.alreadyAssigned) {
                toast.success(
                  `Joined team "${joinResult.teamName || "preferred team"}"`,
                );
              } else if (joinResult.assigned && joinResult.alreadyAssigned) {
                toast.success("Already on preferred team");
              } else if (joinResult.reason === "team_not_found") {
                toast.error("Preferred team not found or archived");
              } else if (joinResult.reason === "missing_team") {
                toast.error("No preferred team on this registrant");
              } else {
                toast.error("Could not assign to preferred team");
              }
              return;
            }
            const teamResult =
              await mutations.formCreateTeam.mutateAsync(selected);
            if (teamResult.formed) {
              toast.success(
                teamResult.createdNew
                  ? `Created team "${teamResult.teamName}" with ${teamResult.memberCount} members`
                  : `Assigned to team "${teamResult.teamName}" (${teamResult.memberCount} members)`,
              );
            } else if (teamResult.reason === "still_pending") {
              toast.error(
                "Still waiting — approve every teammate with this preferred name first",
              );
            } else {
              toast.error("Could not form team from this registrant");
            }
          } catch (err) {
            toast.error(participantMutationErrorMessage(err));
          }
        }}
        onReject={async (reason) => {
          if (!selected?.id || !canManageParticipants) return;
          try {
            await mutations.reject.mutateAsync({ id: selected.id, reason });
            toast.success("Registration rejected");
          } catch (err) {
            toast.error(participantMutationErrorMessage(err));
          }
        }}
        onEdit={() => {
          if (!selected || !canManageParticipants) return;
          setEditing(selected);
          setFormOpen(true);
        }}
        onArchive={async () => {
          if (!selected?.id || !canManageParticipants) return;
          try {
            await mutations.archive.mutateAsync(selected.id);
            setSelectedId(null);
            toast.success("Participant archived");
          } catch (err) {
            toast.error(participantMutationErrorMessage(err));
          }
        }}
      />

      {canManageParticipants ? (
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
      ) : null}
    </div>
  );
}
