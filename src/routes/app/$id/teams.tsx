import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useTeams, useTeamMutations } from "@/hooks/use-teams";
import { useParticipants } from "@/hooks/use-participants";
import type { Collections } from "@/types/pocketbase-types";
import { Plus, Pencil, Trash2, UsersRound } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$id/teams")({
  component: TeamsPage,
});

const STATUS_OPTIONS: { value: Collections["teams"]["status"]; label: string }[] = [
  { value: "forming", label: "Forming" },
  { value: "ready", label: "Ready" },
  { value: "incomplete", label: "Incomplete" },
  { value: "inactive", label: "Inactive" },
];

type TeamFormData = Partial<Omit<Collections["teams"], "id" | "created" | "updated">>;

function TeamsPage() {
  const { data: teams, isLoading } = useTeams();
  const { data: participants } = useParticipants();
  const mutations = useTeamMutations();
  const [sheetOpen, setSheetOpen] = useState(false);
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">Manage teams for the tournament</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add team
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All teams</CardTitle>
          <CardDescription>{teams?.length ?? 0} teams</CardDescription>
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
                <EmptyDescription>Add teams to organize participants</EmptyDescription>
              </EmptyHeader>
              <Button onClick={openCreate} variant="outline">
                Add first team
              </Button>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Captain</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.name ?? "-"}</TableCell>
                    <TableCell>{getCaptainName(t.captain)}</TableCell>
                    <TableCell>{getTeamMemberCount(t.id)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.status ?? "forming"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => openEdit(t)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(t.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? "Edit team" : "Add team"}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team name</Label>
              <Input
                id="name"
                value={form.name ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Team name"
              />
            </div>
            <div className="space-y-2">
              <Label>Captain</Label>
              <Select
                value={form.captain ?? ""}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, captain: v || undefined }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select captain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No captain</SelectItem>
                  {participants?.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name ?? p.gameID ?? p.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status ?? "forming"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    status: v as Collections["teams"]["status"],
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button onClick={handleSubmit} className="flex-1">
                {editingId ? "Save" : "Add"}
              </Button>
              <Button variant="outline" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
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
