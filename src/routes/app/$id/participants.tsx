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
import { ParticipantCard } from "@/components/participants/participant-card";
import { ParticipantTableRow } from "@/components/participants/participant-table-row";
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
import { useIsMobile } from "@/hooks/use-mobile";
import {
  useParticipantMutations,
  useParticipants,
} from "@/hooks/use-participants";
import { useTeamSuggestions } from "@/hooks/use-team-suggestions";
import { useTeams } from "@/hooks/use-teams";
import type { Collections, PlayerRole } from "@/types/pocketbase-types";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, LayoutList, Plus, Search, Users } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$id/participants")({
  component: ParticipantsPage,
});

type ParticipantFormData = Partial<
  Omit<Collections["participants"], "id" | "created" | "updated">
>;

const PREFERRED_ROLES: { value: PlayerRole; label: string }[] = [
  { value: "mid", label: "Mid" },
  { value: "gold", label: "Gold" },
  { value: "exp", label: "Exp" },
  { value: "support", label: "Support" },
  { value: "jungle", label: "Jungle" },
];

function ParticipantForm({
  form,
  setForm,
  editingId,
  onClose,
  onSubmit,
}: {
  form: ParticipantFormData;
  setForm: React.Dispatch<React.SetStateAction<ParticipantFormData>>;
  editingId: string | null;
  onClose: () => void;
  onSubmit: () => void;
  isMobile?: boolean;
}) {
  return (
    <div className="w-full space-y-4 px-4 pb-4">
      <div className="space-y-2">
        <Label htmlFor="gameID">Game ID</Label>
        <Input
          id="gameID"
          value={form.gameID ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, gameID: e.target.value }))}
          placeholder="e.g. 123456789"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={form.name ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Full name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact">Contact number</Label>
        <Input
          id="contact"
          value={form.contactNumber ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, contactNumber: e.target.value }))
          }
          placeholder="09XX XXX XXXX"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="area">Area</Label>
        <Input
          id="area"
          value={form.area ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
          placeholder="Barangay / area"
        />
      </div>
      <div className="space-y-2">
        <Label>Preferred lanes (1st, 2nd, 3rd)</Label>
        <div className="grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => {
            const roles = form.preferredRoles ?? [];
            const used = roles.filter((r, j) => j !== i && r);
            return (
              <Select
                key={i}
                value={roles[i] ?? ""}
                onValueChange={(v) => {
                  const next = [...roles];
                  next[i] = (v || "") as PlayerRole;
                  setForm((f) => ({ ...f, preferredRoles: next }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="—">
                    {(value: string | null) =>
                      value
                        ? PREFERRED_ROLES.find((r) => r.value === value)?.label ??
                          value
                        : null
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {PREFERRED_ROLES.filter((r) => !used.includes(r.value)).map(
                    (r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            );
          })}
        </div>
      </div>
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

type TeamSuggestion = {
  suggestedTeamId?: string;
  suggestedTeamName?: string;
  suggestionPriority?: string;
};

function ParticipantsPage() {
  const { data: participants, isLoading } = useParticipants();
  const { data: teams } = useTeams();
  const { data: teamSuggestions } = useTeamSuggestions();

  const suggestionsByParticipant = useMemo(() => {
    const map = new Map<string, TeamSuggestion[]>();
    for (const s of teamSuggestions ?? []) {
      const participantRef = s.participantId as unknown;
      const pid =
        typeof participantRef === "string"
          ? participantRef
          : participantRef &&
              typeof participantRef === "object" &&
              "id" in participantRef &&
              typeof (participantRef as { id?: unknown }).id === "string"
            ? (participantRef as { id: string }).id
            : undefined;
      if (!pid) continue;
      const list = map.get(pid) ?? [];
      list.push({
        suggestedTeamId: s.suggestedTeamId,
        suggestedTeamName: s.suggestedTeamName,
        suggestionPriority: s.suggestionPriority,
      });
      map.set(pid, list);
    }
    return map;
  }, [teamSuggestions]);
  const mutations = useParticipantMutations();
  const isMobile = useIsMobile();
  const [view, setView] = useState<"table" | "cards">("table");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<ParticipantFormData>({
    gameID: "",
    name: "",
    contactNumber: "",
    area: "",
    preferredRoles: [],
    status: "unassigned",
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({
      gameID: "",
      name: "",
      contactNumber: "",
      area: "",
      preferredRoles: [],
      status: "unassigned",
      team: undefined,
    });
    setSheetOpen(true);
  };

  const openEdit = (p: Collections["participants"] & { id: string }) => {
    setEditingId(p.id);
    setForm({
      gameID: p.gameID ?? "",
      name: p.name ?? "",
      contactNumber: p.contactNumber ?? "",
      area: p.area ?? "",
      preferredRoles: p.preferredRoles ?? [],
      status: p.status ?? "unassigned",
      team: p.team,
    });
    setSheetOpen(true);
  };

  const handleSubmit = () => {
    const name = (form.name ?? "").trim();
    const gameID = (form.gameID ?? "").trim();
    if (!name && !gameID) {
      toast.error("Enter at least a name or Game ID");
      return;
    }
    const payload = {
      ...form,
      preferredRoles: (form.preferredRoles ?? [])
        .filter((r): r is PlayerRole => Boolean(r))
        .slice(0, 3),
    };
    if (editingId) {
      mutations.update.mutate({ id: editingId, ...payload });
      toast.success("Participant updated");
    } else {
      mutations.create.mutate(payload);
      toast.success("Participant added");
    }
    setSheetOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      mutations.delete.mutate(deleteId);
      toast.success("Participant removed");
      setDeleteId(null);
    }
  };

  const handleRemoveFromTeam = (p: Collections["participants"] & { id: string }) => {
    mutations.update.mutate({ id: p.id, team: "" });
    toast.success("Removed from team");
  };

  const handleJoinTeam = (participantId: string, teamId: string) => {
    mutations.update.mutateQueued({ id: participantId, team: teamId });
    toast.success("Added to team");
  };

  const getTeamName = useCallback(
    (teamId: string | undefined) =>
      teams?.find((t) => t.id === teamId)?.name ?? "-",
    [teams]
  );

  const [search, setSearch] = useState("");
  const filteredParticipants = useMemo(() => {
    if (!search.trim()) return participants ?? [];
    const q = search.toLowerCase().trim();
    return (participants ?? []).filter((p) => {
      const name = (p.name ?? "").toLowerCase();
      const gameID = (p.gameID ?? "").toLowerCase();
      const contact = (p.contactNumber ?? "").toLowerCase();
      const area = (p.area ?? "").toLowerCase();
      const teamName = getTeamName(p.team).toLowerCase();
      return (
        name.includes(q) ||
        gameID.includes(q) ||
        contact.includes(q) ||
        area.includes(q) ||
        teamName.includes(q)
      );
    });
  }, [participants, search, getTeamName]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Participants</h1>
          <p className="text-muted-foreground">
            Manage registered players for the tournament
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
            Add participant
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All participants</CardTitle>
          <CardDescription>
            {participants?.length ?? 0} registered
          </CardDescription>
          {participants && participants.length > 0 && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, Game ID, contact, area..."
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
          ) : !participants?.length ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Users className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No participants yet</EmptyTitle>
                <EmptyDescription>
                  Add participants to start building teams
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={openCreate} variant="outline">
                Add first participant
              </Button>
            </Empty>
          ) : (isMobile ? "cards" : view) === "table" ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12" />
                    <TableHead>Game ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Preferred lanes</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead className="w-[120px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((p) => (
                  <ParticipantTableRow
                    key={p.id}
                    participant={p}
                    teamName={getTeamName(p.team)}
                    suggestions={suggestionsByParticipant.get(p.id) ?? []}
                    onEdit={openEdit}
                    onDelete={setDeleteId}
                    onRemoveFromTeam={handleRemoveFromTeam}
                    onJoinTeam={handleJoinTeam}
                  />
                ))}
                </TableBody>
              </Table>
              {filteredParticipants.length === 0 && search && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No participants match &quot;{search}&quot;
                </p>
              )}
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredParticipants.map((p) => (
                <ParticipantCard
                  key={p.id}
                  participant={p}
                  teamName={getTeamName(p.team)}
                  suggestions={suggestionsByParticipant.get(p.id) ?? []}
                  onEdit={openEdit}
                  onDelete={setDeleteId}
                  onRemoveFromTeam={handleRemoveFromTeam}
                  onJoinTeam={handleJoinTeam}
                />
              ))}
              </div>
              {filteredParticipants.length === 0 && search && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No participants match &quot;{search}&quot;
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
                {editingId ? "Edit participant" : "Add participant"}
              </DrawerTitle>
            </DrawerHeader>
            <div className="min-h-0 w-full overflow-y-auto overscroll-contain">
              <ParticipantForm
                key={editingId ?? "create"}
                form={form}
                setForm={setForm}
                editingId={editingId}
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
                {editingId ? "Edit participant" : "Add participant"}
              </DialogTitle>
            </DialogHeader>
            <ParticipantForm
              key={editingId ?? "create"}
              form={form}
              setForm={setForm}
              editingId={editingId}
              onClose={() => setSheetOpen(false)}
              onSubmit={handleSubmit}
            />
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove participant?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the participant from the list. This action cannot
              be undone.
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
