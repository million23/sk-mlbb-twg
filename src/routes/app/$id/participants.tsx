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
import { useTeams } from "@/hooks/use-teams";
import type { Collections } from "@/types/pocketbase-types";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, LayoutList, Plus, Search, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$id/participants")({
  component: ParticipantsPage,
});

type ParticipantFormData = Partial<
  Omit<Collections["participants"], "id" | "created" | "updated">
>;

function ParticipantForm({
  form,
  setForm,
  editingId,
  teams,
  onClose,
  onSubmit,
}: {
  form: ParticipantFormData;
  setForm: React.Dispatch<React.SetStateAction<ParticipantFormData>>;
  editingId: string | null;
  teams: { id: string; name?: string }[] | undefined;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4 px-4 pb-4">
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
      {editingId && (
        <div className="space-y-2">
          <Label>Team</Label>
          <Select
            value={form.team ?? ""}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, team: v || undefined }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="No team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No team</SelectItem>
              {teams?.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name ?? t.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
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

function ParticipantsPage() {
  const { data: participants, isLoading } = useParticipants();
  const { data: teams } = useTeams();
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
    if (editingId) {
      mutations.update.mutate({ id: editingId, ...form });
      toast.success("Participant updated");
    } else {
      mutations.create.mutate(form);
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

  const getTeamName = (teamId: string | undefined) =>
    teams?.find((t) => t.id === teamId)?.name ?? "-";

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
  }, [participants, search, teams]);

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
                    <TableHead>Team</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((p) => (
                  <ParticipantTableRow
                    key={p.id}
                    participant={p}
                    teamName={getTeamName(p.team)}
                    onEdit={openEdit}
                    onDelete={setDeleteId}
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
                  onEdit={openEdit}
                  onDelete={setDeleteId}
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
          <DrawerContent className="max-h-[75vh] flex flex-col overflow-hidden">
            <DrawerHeader className="shrink-0">
              <DrawerTitle>
                {editingId ? "Edit participant" : "Add participant"}
              </DrawerTitle>
            </DrawerHeader>
            <div className="min-h-0 overflow-y-auto overscroll-contain">
              <ParticipantForm
                key={editingId ?? "create"}
                form={form}
                setForm={setForm}
                editingId={editingId}
                teams={teams}
                onClose={() => setSheetOpen(false)}
                onSubmit={handleSubmit}
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
              teams={teams}
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
