import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStagger } from "@/components/admin/admin-stagger";
import { AddMembersDialog } from "@/components/admin/teams/add-members-dialog";
import { QuickTeamDialog } from "@/components/admin/teams/quick-team-dialog";
import { TeamDetailSheet } from "@/components/admin/teams/team-detail-sheet";
import {
  TeamFormDialog,
  type TeamFormDialogValues,
} from "@/components/admin/teams/team-form-dialog";
import { TeamStatusBadge } from "@/components/admin/teams/team-status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";
import type { TeamsRecordStatus } from "@/hooks/orval/model/teamsRecordStatus";
import { summarizeTeamAgeBracketCounts } from "@/lib/legacy/age";
import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import { compareRegisteredDesc } from "@/lib/legacy/registered-date";
import {
  downloadStructuredSpreadsheet,
  type SpreadsheetColumn,
} from "@/lib/legacy/spreadsheet-export";
import { getTeamStatusStyle } from "@/lib/legacy/team-status";
import { format, isValid, parseISO } from "date-fns";
import {
  FileSpreadsheet,
  Plus,
  RotateCcw,
  Search,
  UsersRound,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

type StatusTab =
  | "forming"
  | "ready"
  | "incomplete"
  | "inactive"
  | "all"
  | "archived";

type ExportRow = {
  name: string;
  created?: string;
  status: string;
  captain: string;
  memberCount: number;
  members: string;
  archived?: string;
};

export type TeamsPageProps = {
  tournamentTitle?: string;
  teams: TeamsRecord[];
  archivedTeams: TeamsRecord[];
  participants: ParticipantsRecord[];
  minReady: number;
  maxTeamSize: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  onRetry: () => void;
  formPending?: boolean;
  quickPending?: boolean;
  assignPending?: boolean;
  archivePending?: boolean;
  removePending?: boolean;
  restorePending?: boolean;
  onCreateTeam: (values: TeamFormDialogValues) => Promise<void>;
  onUpdateTeam: (
    id: string,
    values: TeamFormDialogValues,
  ) => Promise<void>;
  onQuickCreate: (input: {
    name: string;
    captain: string;
    participantIds: string[];
  }) => Promise<void>;
  onAssignMembers: (
    teamId: string,
    participantIds: string[],
  ) => Promise<void>;
  onRemoveMember: (
    teamId: string,
    participantId: string,
  ) => Promise<void>;
  onArchive: (teamId: string) => Promise<void>;
  onRestore: (teamId: string) => Promise<void>;
};

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = parseISO(iso);
  if (!isValid(d)) return "—";
  return format(d, "MMM d, yyyy");
}

function memberOfTeam(
  participants: ParticipantsRecord[],
  teamId: string,
) {
  return participants.filter((p) => p.team === teamId);
}

function captainLabel(
  team: TeamsRecord,
  participants: ParticipantsRecord[],
) {
  const fromExpand = (
    team as TeamsRecord & {
      expand?: { captain?: { name?: string; ign?: string } };
    }
  ).expand?.captain;
  if (fromExpand?.name || fromExpand?.ign) {
    return (
      formatParticipantNameDisplay(fromExpand.name) || fromExpand.ign || "—"
    );
  }
  const p = participants.find((x) => x.id === team.captain);
  if (!p) return "—";
  return formatParticipantNameDisplay(p.name) || p.ign || "—";
}

export function TeamsPage({
  tournamentTitle,
  teams,
  archivedTeams,
  participants,
  maxTeamSize,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  formPending,
  quickPending,
  assignPending,
  archivePending,
  removePending,
  restorePending,
  onCreateTeam,
  onUpdateTeam,
  onQuickCreate,
  onAssignMembers,
  onRemoveMember,
  onArchive,
  onRestore,
}: TeamsPageProps) {
  const [tab, setTab] = useState<StatusTab>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<TeamsRecord | null>(null);
  const [quickOpen, setQuickOpen] = useState(false);
  const [addMembersTeamId, setAddMembersTeamId] = useState<string | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [exportIncludeArchived, setExportIncludeArchived] = useState(false);

  const approvedUnassigned = useMemo(
    () =>
      participants.filter(
        (p) =>
          p.registration_status === "approved" &&
          (!p.team || p.team === "") &&
          p.status !== "inactive",
      ),
    [participants],
  );

  const counts = useMemo(() => {
    const c = {
      forming: 0,
      ready: 0,
      incomplete: 0,
      inactive: 0,
      all: teams.length,
      archived: archivedTeams.length,
    };
    for (const t of teams) {
      if (t.status === "forming") c.forming += 1;
      else if (t.status === "ready") c.ready += 1;
      else if (t.status === "incomplete") c.incomplete += 1;
      else if (t.status === "inactive") c.inactive += 1;
    }
    return c;
  }, [teams, archivedTeams.length]);

  const selectedTeam =
    teams.find((t) => t.id === selectedId) ??
    archivedTeams.find((t) => t.id === selectedId) ??
    null;

  const selectedMembers = selectedTeam?.id
    ? memberOfTeam(participants, selectedTeam.id)
    : [];

  const filtered = useMemo(() => {
    const source = tab === "archived" ? archivedTeams : teams;
    const q = search.trim().toLowerCase();
    const list = source.filter((t) => {
      if (
        tab !== "all" &&
        tab !== "archived" &&
        (t.status as StatusTab) !== tab
      ) {
        return false;
      }
      if (!q) return true;
      const captain = captainLabel(t, participants).toLowerCase();
      const name = (t.name ?? "").toLowerCase();
      const memberHit = memberOfTeam(participants, t.id ?? "").some((m) =>
        [m.name, m.ign, m.user_id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(q),
      );
      return name.includes(q) || captain.includes(q) || memberHit;
    });
    return [...list].sort(compareRegisteredDesc);
  }, [tab, teams, archivedTeams, search, participants]);

  const addMembersTeam = addMembersTeamId
    ? teams.find((t) => t.id === addMembersTeamId)
    : null;
  const addMembersCurrentCount = addMembersTeamId
    ? memberOfTeam(participants, addMembersTeamId).length
    : 0;
  const addMembersSlotsLeft = Math.max(
    0,
    maxTeamSize - addMembersCurrentCount,
  );

  const runExport = () => {
    const toRow = (t: TeamsRecord, archived: boolean): ExportRow => {
      const members = memberOfTeam(participants, t.id ?? "");
      return {
        name: t.name ?? "",
        created: t.created,
        status: getTeamStatusStyle(t.status).label,
        captain: captainLabel(t, participants),
        memberCount: members.length,
        members: members
          .map((m) => formatParticipantNameDisplay(m.name) || m.ign || m.id)
          .join("; "),
        archived: archived ? "Yes" : "No",
      };
    };

    let rows: ExportRow[] =
      tab === "archived"
        ? filtered.map((t) => toRow(t, true))
        : filtered.map((t) => toRow(t, false));

    if (exportIncludeArchived && tab !== "archived") {
      rows = [
        ...rows,
        ...archivedTeams.map((t) => toRow(t, true)),
      ];
    }

    const columns: SpreadsheetColumn<ExportRow>[] = [
      { header: "Team", widthChars: 24, type: "text", get: (r) => r.name },
      {
        header: "Date registered",
        widthChars: 18,
        type: "date",
        get: (r) => r.created,
      },
      { header: "Status", widthChars: 12, type: "text", get: (r) => r.status },
      {
        header: "Captain",
        widthChars: 22,
        type: "text",
        get: (r) => r.captain,
      },
      {
        header: "Member count",
        widthChars: 12,
        type: "number",
        get: (r) => r.memberCount,
      },
      {
        header: "Members",
        widthChars: 48,
        type: "text",
        get: (r) => r.members,
      },
    ];
    if (exportIncludeArchived || tab === "archived") {
      columns.push({
        header: "Archived",
        widthChars: 10,
        type: "text",
        get: (r) => r.archived ?? (tab === "archived" ? "Yes" : "No"),
      });
    }

    downloadStructuredSpreadsheet({
      fileBasename: `teams-${tournamentTitle || "tournament"}`,
      sheetName: "Teams",
      workbookTitle: `${tournamentTitle || "Tournament"} teams`,
      columns,
      rows,
      emptyMessage: "No teams to export",
    });
    setExportOpen(false);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <AdminStagger index={0}>
        <AdminPageHeader
          eyebrow="Tournament workspace"
          title="Teams"
          description="Build rosters, set captains, and keep team status in sync with member counts."
          actions={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setExportOpen(true)}
              >
                <FileSpreadsheet className="size-4" />
                Export
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setQuickOpen(true)}
                disabled={approvedUnassigned.length === 0}
              >
                <Zap className="size-4" />
                Quick team
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                Add team
              </Button>
            </>
          }
        />
      </AdminStagger>

      <AdminStagger index={1}>
        <Tabs
          value={tab}
          onValueChange={(v) => setTab((v as StatusTab) ?? "all")}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <TabsList className="flex h-auto w-full flex-wrap justify-start lg:w-fit">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              <TabsTrigger value="forming">
                Forming ({counts.forming})
              </TabsTrigger>
              <TabsTrigger value="ready">Ready ({counts.ready})</TabsTrigger>
              <TabsTrigger value="incomplete">
                Incomplete ({counts.incomplete})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inactive ({counts.inactive})
              </TabsTrigger>
              <TabsTrigger value="archived">
                Archived ({counts.archived})
              </TabsTrigger>
            </TabsList>
            <InputGroup className="w-full lg:max-w-xs">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search team, captain, member…"
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
                  <EmptyTitle>Could not load teams</EmptyTitle>
                  <EmptyDescription>
                    {errorMessage || "Unknown error"}
                  </EmptyDescription>
                </EmptyHeader>
                <Button type="button" variant="outline" onClick={onRetry}>
                  Retry
                </Button>
              </Empty>
            ) : filtered.length === 0 ? (
              <Empty className="border border-border">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <UsersRound />
                  </EmptyMedia>
                  <EmptyTitle>
                    {search.trim()
                      ? "No teams match"
                      : tab === "archived"
                        ? "No archived teams"
                        : "No teams yet"}
                  </EmptyTitle>
                  <EmptyDescription>
                    {search.trim()
                      ? "Try a different search."
                      : tab === "archived"
                        ? "Archived teams show up here for restore."
                        : "Add a team or use Quick team to assemble from unassigned players."}
                  </EmptyDescription>
                </EmptyHeader>
                {!search.trim() && tab !== "archived" ? (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditing(null);
                        setFormOpen(true);
                      }}
                    >
                      <Plus className="size-4" />
                      Add team
                    </Button>
                    <Button
                      type="button"
                      onClick={() => setQuickOpen(true)}
                      disabled={approvedUnassigned.length === 0}
                    >
                      <Zap className="size-4" />
                      Quick team
                    </Button>
                  </div>
                ) : null}
              </Empty>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Team</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Captain
                      </TableHead>
                      <TableHead>Members</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden sm:table-cell">
                        Registered
                      </TableHead>
                      {tab === "archived" ? (
                        <TableHead className="text-right">Actions</TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => {
                      const members = memberOfTeam(participants, t.id ?? "");
                      const ageLine = summarizeTeamAgeBracketCounts(members);
                      return (
                        <TableRow
                          key={t.id}
                          className={
                            tab === "archived" ? undefined : "cursor-pointer"
                          }
                          onClick={() => {
                            if (tab === "archived") return;
                            setSelectedId(t.id ?? null);
                          }}
                        >
                          <TableCell className="font-medium">
                            <div className="min-w-0">
                              <p className="truncate">{t.name}</p>
                              <p className="truncate text-muted-foreground text-xs md:hidden">
                                {captainLabel(t, participants)}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {captainLabel(t, participants)}
                          </TableCell>
                          <TableCell>
                            <div className="min-w-0">
                              <p className="tabular-nums">{members.length}</p>
                              {ageLine ? (
                                <p className="text-muted-foreground text-xs text-pretty">
                                  {ageLine}
                                </p>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell>
                            <TeamStatusBadge status={t.status} />
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground text-sm sm:table-cell">
                            {formatDate(t.created)}
                          </TableCell>
                          {tab === "archived" ? (
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={restorePending}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (t.id) void onRestore(t.id);
                                }}
                              >
                                <RotateCcw className="size-3.5" />
                                Restore
                              </Button>
                            </TableCell>
                          ) : null}
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

      <TeamDetailSheet
        team={selectedTeam}
        members={selectedMembers}
        open={Boolean(selectedTeam) && tab !== "archived"}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        archivePending={archivePending}
        removePending={removePending}
        onEdit={() => {
          if (!selectedTeam) return;
          setEditing(selectedTeam);
          setFormOpen(true);
        }}
        onAddMembers={() => {
          if (selectedTeam?.id) setAddMembersTeamId(selectedTeam.id);
        }}
        onRemoveMember={async (participantId) => {
          if (!selectedTeam?.id) return;
          await onRemoveMember(selectedTeam.id, participantId);
        }}
        onArchive={async () => {
          if (!selectedTeam?.id) return;
          await onArchive(selectedTeam.id);
          setSelectedId(null);
        }}
      />

      <TeamFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditing(null);
        }}
        mode={editing ? "edit" : "create"}
        record={editing}
        members={
          editing?.id ? memberOfTeam(participants, editing.id) : []
        }
        pending={formPending}
        onSubmit={async (values) => {
          if (editing?.id) {
            await onUpdateTeam(editing.id, values);
          } else {
            await onCreateTeam(values);
          }
          setFormOpen(false);
          setEditing(null);
        }}
      />

      <QuickTeamDialog
        open={quickOpen}
        onOpenChange={setQuickOpen}
        unassigned={approvedUnassigned}
        pending={quickPending}
        onCreate={async (input) => {
          await onQuickCreate(input);
          setQuickOpen(false);
        }}
      />

      <AddMembersDialog
        open={Boolean(addMembersTeam)}
        onOpenChange={(open) => {
          if (!open) setAddMembersTeamId(null);
        }}
        teamName={addMembersTeam?.name ?? "Team"}
        unassigned={approvedUnassigned}
        maxSelectable={addMembersSlotsLeft}
        pending={assignPending}
        onSubmit={async (ids) => {
          if (!addMembersTeam?.id) return;
          await onAssignMembers(addMembersTeam.id, ids);
          setAddMembersTeamId(null);
        }}
      />

      <Dialog open={exportOpen} onOpenChange={setExportOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export teams</DialogTitle>
            <DialogDescription>
              Downloads a spreadsheet using the current search
              {tab !== "all" && tab !== "archived"
                ? ` and “${getTeamStatusStyle(tab as TeamsRecordStatus).label}” filter`
                : ""}
              .
            </DialogDescription>
          </DialogHeader>
          {tab !== "archived" ? (
            <label
              htmlFor="export-include-archived"
              className="flex items-center gap-2 text-sm"
            >
              <Checkbox
                id="export-include-archived"
                checked={exportIncludeArchived}
                onCheckedChange={(v) => setExportIncludeArchived(v === true)}
              />
              Include archived teams
            </label>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExportOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" onClick={runExport}>
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
