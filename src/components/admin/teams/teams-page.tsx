import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStagger } from "@/components/admin/admin-stagger";
import { AddMembersDialog } from "@/components/admin/teams/add-members-dialog";
import { AutoOpenTeamsDialog } from "@/components/admin/teams/auto-open-teams-dialog";
import { QuickTeamDialog } from "@/components/admin/teams/quick-team-dialog";
import { TeamDetailSheet } from "@/components/admin/teams/team-detail-sheet";
import type { AutoOpenTeamsPlan } from "@/lib/admin/auto-open-teams";
import { openMatchingPool } from "@/lib/admin/auto-open-teams";
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
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";
import type { TeamsRecordStatus } from "@/hooks/orval/model/teamsRecordStatus";
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
  Shuffle,
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

const STATUS_TAB_OPTIONS: {
  value: StatusTab;
  label: (counts: Record<StatusTab, number>) => string;
}[] = [
  { value: "all", label: (c) => `All (${c.all})` },
  { value: "forming", label: (c) => `Forming (${c.forming})` },
  { value: "ready", label: (c) => `Ready (${c.ready})` },
  { value: "incomplete", label: (c) => `Incomplete (${c.incomplete})` },
  { value: "inactive", label: (c) => `Inactive (${c.inactive})` },
  { value: "archived", label: (c) => `Archived (${c.archived})` },
];

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
  canManage?: boolean;
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
  autoOpenPending?: boolean;
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
  onAutoOpenTeams: (plan: AutoOpenTeamsPlan) => Promise<void>;
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
  canManage = true,
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
  autoOpenPending,
  assignPending,
  archivePending,
  removePending,
  restorePending,
  onCreateTeam,
  onUpdateTeam,
  onQuickCreate,
  onAutoOpenTeams,
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
  const [autoOpenOpen, setAutoOpenOpen] = useState(false);
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

  const openMatchPool = useMemo(
    () => openMatchingPool(participants),
    [participants],
  );

  const existingTeamNames = useMemo(
    () =>
      [...teams, ...archivedTeams]
        .map((t) => t.name?.trim() ?? "")
        .filter(Boolean),
    [teams, archivedTeams],
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
              {canManage ? (
                <>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setAutoOpenOpen(true)}
                    disabled={openMatchPool.length < 5}
                  >
                    <Shuffle className="size-4" />
                    Auto teams
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
              ) : null}
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
            <Select
              value={tab}
              onValueChange={(v) => setTab((v as StatusTab) ?? "all")}
            >
              <SelectTrigger className="w-full md:hidden">
                <SelectValue>
                  {(value) => {
                    const opt = STATUS_TAB_OPTIONS.find((o) => o.value === value);
                    return opt ? opt.label(counts) : "Filter teams";
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
                {!search.trim() && tab !== "archived" && canManage ? (
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
                      {tab === "archived" && canManage ? (
                        <TableHead className="text-right">Actions</TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => {
                      const members = memberOfTeam(participants, t.id ?? "");
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
                            <p className="tabular-nums">{members.length}</p>
                          </TableCell>
                          <TableCell>
                            <TeamStatusBadge status={t.status} />
                          </TableCell>
                          <TableCell className="hidden text-muted-foreground text-sm sm:table-cell">
                            {formatDate(t.created)}
                          </TableCell>
                          {tab === "archived" && canManage ? (
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
        canManage={canManage}
        archivePending={archivePending}
        removePending={removePending}
        onEdit={() => {
          if (!selectedTeam || !canManage) return;
          setEditing(selectedTeam);
          setFormOpen(true);
        }}
        onAddMembers={() => {
          if (!canManage) return;
          if (selectedTeam?.id) setAddMembersTeamId(selectedTeam.id);
        }}
        onRemoveMember={async (participantId) => {
          if (!selectedTeam?.id || !canManage) return;
          await onRemoveMember(selectedTeam.id, participantId);
        }}
        onArchive={async () => {
          if (!selectedTeam?.id || !canManage) return;
          await onArchive(selectedTeam.id);
          setSelectedId(null);
        }}
      />

      {canManage ? (
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
      ) : null}

      {canManage ? (
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
      ) : null}

      {canManage ? (
        <AutoOpenTeamsDialog
          open={autoOpenOpen}
          onOpenChange={setAutoOpenOpen}
          participants={participants}
          existingTeamNames={existingTeamNames}
          pending={autoOpenPending}
          onConfirm={async (plan) => {
            await onAutoOpenTeams(plan);
            setAutoOpenOpen(false);
          }}
        />
      ) : null}

      {canManage ? (
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
      ) : null}

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
