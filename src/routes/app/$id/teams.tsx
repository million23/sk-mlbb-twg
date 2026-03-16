import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TeamCard } from "@/components/teams/team-card";
import { TeamTableRow } from "@/components/teams/team-table-row";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useParticipantMutations,
  useParticipants,
} from "@/hooks/use-participants";
import { useTeams, useTeamMutations } from "@/hooks/use-teams";
import type { Collections } from "@/types/pocketbase-types";
import { createFileRoute } from "@tanstack/react-router";
import {
  ChevronDown,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$id/teams")({
  component: TeamsPage,
});

type TeamFormData = Partial<
  Omit<Collections["teams"], "id" | "created" | "updated">
>;

type ParticipantSummary = {
  id: string;
  name?: string;
  gameID?: string;
};

function AddMembersContent({
  unassignedParticipants,
  teamId,
  onAdd,
  onClose,
}: {
  unassignedParticipants: ParticipantSummary[];
  teamId: string;
  onAdd: (participantId: string, teamId: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search.trim()) return unassignedParticipants;
    const q = search.toLowerCase().trim();
    return unassignedParticipants.filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const gameID = (p.gameID ?? "").toLowerCase();
      return name.includes(q) || gameID.includes(q);
    });
  }, [unassignedParticipants, search]);

  if (unassignedParticipants.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          No unassigned participants. Assign participants to teams from the
          Participants page first.
        </p>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 min-h-0">
      <div className="relative shrink-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search by name or Game ID..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="min-h-[280px] max-h-[50vh] overflow-y-auto overscroll-contain">
        <ul className="space-y-1">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2"
            >
              <span className="truncate">
                {p.name ?? p.gameID ?? p.id}
              </span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onAdd(p.id, teamId)}
              >
                <UserPlus className="size-4" />
                Add
              </Button>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No participants match &quot;{search}&quot;
          </p>
        )}
      </div>
      <Button variant="outline" onClick={onClose} className="w-full shrink-0">
        Close
      </Button>
    </div>
  );
}

function CaptainPopover({
  onChange,
  teamMembers,
  triggerLabel,
}: {
  value: string;
  onChange: (v: string) => void;
  teamMembers: { id: string; name?: string; gameID?: string }[];
  triggerLabel: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-left text-sm font-normal ring-offset-background hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-expanded={open}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className="size-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="min-w-80 w-(--anchor-width) max-w-[calc(100vw-2rem)] p-2" align="start">
        <div className="flex max-h-[min(var(--available-height,280px),70vh)] flex-col gap-0.5 overflow-y-auto">
          <Button
            type="button"
            variant="ghost"
            className="h-auto w-full justify-start py-3 pl-3 text-left font-normal"
            onClick={() => {
              onChange("");
              setOpen(false);
            }}
          >
            No captain
          </Button>
          {teamMembers.map((p) => (
            <Button
              type="button"
              key={p.id}
              variant="ghost"
              className="h-auto w-full justify-start py-3 pl-3 text-left font-normal"
              onClick={() => {
                onChange(p.id);
                setOpen(false);
              }}
            >
              {p.name ?? p.gameID ?? p.id}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TeamForm({
  form,
  setForm,
  editingId,
  teamMembers,
  onClose,
  onSubmit,
  isMobile = false,
}: {
  form: TeamFormData;
  setForm: React.Dispatch<React.SetStateAction<TeamFormData>>;
  editingId: string | null;
  teamMembers: { id: string; name?: string; gameID?: string }[] | undefined;
  onClose: () => void;
  onSubmit: () => void;
  isMobile?: boolean;
}) {
  const captainLabel =
    form.captain === ""
      ? "Select captain (team members only)"
      : teamMembers?.find((p) => p.id === form.captain)?.name ??
        teamMembers?.find((p) => p.id === form.captain)?.gameID ??
        "Select captain (team members only)";

  return (
    <div className="w-full space-y-4 px-4 pb-4">
      <div className="space-y-2">
        <Label htmlFor="name">Team name</Label>
        <Input
          id="name"
          value={form.name ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Team name"
        />
      </div>
      {editingId &&
        (isMobile ? (
          <div className="space-y-2">
            <Label>Captain</Label>
            <CaptainPopover
              value={form.captain ?? ""}
              onChange={(v) =>
                setForm((f) => ({ ...f, captain: v || "" }))
              }
              teamMembers={teamMembers ?? []}
              triggerLabel={captainLabel}
            />
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Captain</Label>
            <Select
              value={form.captain ?? ""}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, captain: v || "" }))
              }
              items={{
                "": "No captain",
                ...Object.fromEntries(
                  (teamMembers ?? []).map((p) => [
                    p.id,
                    p.name ?? p.gameID ?? p.id,
                  ]),
                ),
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select captain (team members only)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No captain</SelectItem>
                {teamMembers?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name ?? p.gameID ?? p.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      <div className="flex gap-2 pt-4">
        <Button onClick={onSubmit} className="flex-1">
          {editingId ? "Save" : "Add"}
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function TeamsPage() {
  const { data: teams, isLoading } = useTeams();
  const { data: participants } = useParticipants();
  const mutations = useTeamMutations();
  const participantMutations = useParticipantMutations();
  const isMobile = useIsMobile();
  const [view, setView] = useState<"table" | "cards">("table");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addMembersTeamId, setAddMembersTeamId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<TeamFormData>({
    name: "",
    captain: "",
    status: "forming",
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ name: "", captain: "", status: "forming" });
    setSheetOpen(true);
  };

  const openEdit = (t: (typeof teams)[number]) => {
    setEditingId(t.id);
    setForm({
      name: t.name ?? "",
      captain: t.captain ?? "",
      status: t.status ?? "forming",
    });
    setSheetOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      mutations.update.mutate({ id: editingId, ...form });
      toast.success("Team updated");
    } else {
      mutations.create.mutate(form);
      toast.success("Team added");
    }
    setSheetOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      mutations.delete.mutate(deleteId);
      toast.success("Team removed");
      setDeleteId(null);
    }
  };

  const getCaptainName = (captainId: string | undefined) =>
    participants?.find((p) => p.id === captainId)?.name ?? "-";

  const getTeamMemberCount = (teamId: string) =>
    participants?.filter((p) => p.team === teamId).length ?? 0;

  const getTeamMembers = (teamId: string) =>
    participants?.filter((p) => p.team === teamId) ?? [];

  const unassignedParticipants =
    participants?.filter((p) => !p.team || p.team === "") ?? [];

  const updatedForReady = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!teams || !participants) return;
    for (const team of teams) {
      const count = participants.filter((p) => p.team === team.id).length;
      if (
        count >= 5 &&
        (team.status === "forming" || team.status === "incomplete") &&
        !updatedForReady.current.has(team.id)
      ) {
        updatedForReady.current.add(team.id);
        mutations.update.mutate({ id: team.id, status: "ready" });
      }
    }
  }, [teams, participants, mutations.update]);

  const handleAddMember = (participantId: string, teamId: string) => {
    const currentCount = getTeamMemberCount(teamId);
    const newCount = currentCount + 1;
    participantMutations.update.mutate({ id: participantId, team: teamId });
    if (newCount >= 5) {
      updatedForReady.current.add(teamId);
      mutations.update.mutate({ id: teamId, status: "ready" });
      toast.success("Member added. Team status set to Ready (5+ members).");
    } else {
      toast.success("Member added to team");
    }
  };

  const addMembersTeam = addMembersTeamId
    ? teams?.find((t) => t.id === addMembersTeamId)
    : null;

  const [search, setSearch] = useState("");
  const filteredTeams = useMemo(() => {
    if (!search.trim()) return teams ?? [];
    const q = search.toLowerCase().trim();
    return (teams ?? []).filter((t) => {
      const name = (t.name ?? "").toLowerCase();
      const captainName = getCaptainName(t.captain).toLowerCase();
      return name.includes(q) || captainName.includes(q);
    });
  }, [teams, search, participants]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage teams for the tournament
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex rounded-lg border border-input p-0.5">
            <Button
              variant={view === "table" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("table")}
              aria-pressed={view === "table"}
              aria-label="Table view"
            >
              <LayoutList className="size-4" />
            </Button>
            <Button
              variant={view === "cards" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("cards")}
              aria-pressed={view === "cards"}
              aria-label="Card view"
            >
              <LayoutGrid className="size-4" />
            </Button>
          </div>
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add team
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All teams</CardTitle>
          <CardDescription>{teams?.length ?? 0} teams</CardDescription>
          {teams && teams.length > 0 && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by team name or captain..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !teams?.length ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <UsersRound className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No teams yet</EmptyTitle>
                <EmptyDescription>
                  Add teams to organize participants
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={openCreate} variant="outline">
                Add first team
              </Button>
            </Empty>
          ) : (isMobile ? "cards" : view) === "table" ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead>Name</TableHead>
                    <TableHead>Captain</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeams.map((t) => (
                  <TeamTableRow
                    key={t.id}
                    team={t}
                    captainName={getCaptainName(t.captain)}
                    memberCount={getTeamMemberCount(t.id)}
                    members={getTeamMembers(t.id)}
                    onEdit={openEdit}
                    onDelete={setDeleteId}
                    onAddMembers={(team) => setAddMembersTeamId(team.id)}
                  />
                ))}
                </TableBody>
              </Table>
              {filteredTeams.length === 0 && search && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No teams match &quot;{search}&quot;
                </p>
              )}
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTeams.map((t) => (
                <TeamCard
                  key={t.id}
                  team={t}
                  captainName={getCaptainName(t.captain)}
                  memberCount={getTeamMemberCount(t.id)}
                  members={getTeamMembers(t.id)}
                  onEdit={openEdit}
                  onDelete={setDeleteId}
                  onAddMembers={(team) => setAddMembersTeamId(team.id)}
                />
              ))}
              </div>
              {filteredTeams.length === 0 && search && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No teams match &quot;{search}&quot;
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {isMobile ? (
        <Drawer open={sheetOpen} onOpenChange={setSheetOpen} direction="bottom">
          <DrawerContent className="max-h-[75vh] flex w-full flex-col overflow-hidden">
            <DrawerHeader className="shrink-0 px-4">
              <DrawerTitle>
                {editingId ? "Edit team" : "Add team"}
              </DrawerTitle>
            </DrawerHeader>
            <div className="min-h-0 w-full overflow-y-auto overscroll-contain">
              <TeamForm
                key={editingId ?? "create"}
                form={form}
                setForm={setForm}
                editingId={editingId}
                teamMembers={editingId ? getTeamMembers(editingId) : []}
                onClose={() => setSheetOpen(false)}
                onSubmit={handleSubmit}
                isMobile
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit team" : "Add team"}
              </DialogTitle>
            </DialogHeader>
            <TeamForm
              key={editingId ?? "create"}
              form={form}
              setForm={setForm}
              editingId={editingId}
              teamMembers={editingId ? getTeamMembers(editingId) : []}
              onClose={() => setSheetOpen(false)}
              onSubmit={handleSubmit}
            />
          </DialogContent>
        </Dialog>
      )}

      {isMobile ? (
        <Drawer
          open={!!addMembersTeamId}
          onOpenChange={(o) => !o && setAddMembersTeamId(null)}
          direction="bottom"
        >
          <DrawerContent className="max-h-[85vh] flex w-full flex-col overflow-hidden">
            <DrawerHeader className="shrink-0">
              <DrawerTitle>
                Add members to {addMembersTeam?.name ?? "team"}
              </DrawerTitle>
            </DrawerHeader>
            <div className="min-h-0 flex-1 w-full overflow-y-auto overscroll-contain px-4 pb-4">
              {addMembersTeamId && (
                <AddMembersContent
                  unassignedParticipants={unassignedParticipants}
                  teamId={addMembersTeamId}
                  onAdd={handleAddMember}
                  onClose={() => setAddMembersTeamId(null)}
                />
              )}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog
          open={!!addMembersTeamId}
          onOpenChange={(o) => !o && setAddMembersTeamId(null)}
        >
          <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            <DialogHeader className="shrink-0">
              <DialogTitle>
                Add members to {addMembersTeam?.name ?? "team"}
              </DialogTitle>
            </DialogHeader>
            <div className="min-h-0 overflow-y-auto px-1">
              {addMembersTeamId && (
                <AddMembersContent
                  unassignedParticipants={unassignedParticipants}
                  teamId={addMembersTeamId}
                  onAdd={handleAddMember}
                  onClose={() => setAddMembersTeamId(null)}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the team. Participants assigned to this team will
              become unassigned. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
