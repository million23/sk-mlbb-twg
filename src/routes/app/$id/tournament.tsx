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
import {
  useTournaments,
  useUpcomingTournaments,
  useTournamentMutations,
} from "@/hooks/use-tournaments";
import type { Collections } from "@/types/pocketbase-types";
import { Plus, Pencil, Trash2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/app/$id/tournament")({
  component: TournamentPage,
});

const STATUS_OPTIONS: {
  value: Collections["tournaments"]["status"];
  label: string;
}[] = [
  { value: "draft", label: "Draft" },
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

type TournamentFormData = Partial<
  Omit<Collections["tournaments"], "id" | "created" | "updated">
>;

function TournamentPage() {
  const { data: tournaments, isLoading } = useTournaments();
  const mutations = useTournamentMutations();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<TournamentFormData>({
    title: "",
    slug: "",
    description: "",
    venue: "",
    startAt: "",
    endAt: "",
    status: "draft",
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({
      title: "",
      slug: "",
      description: "",
      venue: "",
      startAt: "",
      endAt: "",
      status: "draft",
    });
    setSheetOpen(true);
  };

  const openEdit = (t: (typeof tournaments)[number]) => {
    setEditingId(t.id);
    setForm({
      title: t.title ?? "",
      slug: t.slug ?? "",
      description: t.description ?? "",
      venue: t.venue ?? "",
      startAt: t.startAt ?? "",
      endAt: t.endAt ?? "",
      status: t.status ?? "draft",
    });
    setSheetOpen(true);
  };

  const handleSubmit = () => {
    if (editingId) {
      mutations.update.mutate({ id: editingId, ...form });
      toast.success("Tournament updated");
    } else {
      mutations.create.mutate(form);
      toast.success("Tournament added");
    }
    setSheetOpen(false);
  };

  const handleDelete = () => {
    if (deleteId) {
      mutations.delete.mutate(deleteId);
      toast.success("Tournament removed");
      setDeleteId(null);
    }
  };

  const formatDate = (d: string | undefined) => {
    if (!d) return "-";
    try {
      return format(new Date(d), "MMM d, yyyy HH:mm");
    } catch {
      return d;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tournaments</h1>
          <p className="text-muted-foreground">
            Manage tournament events
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          Add tournament
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All tournaments</CardTitle>
          <CardDescription>{tournaments?.length ?? 0} tournaments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !tournaments?.length ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <Trophy className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No tournaments yet</EmptyTitle>
                <EmptyDescription>
                  Add tournaments to schedule events
                </EmptyDescription>
              </EmptyHeader>
              <Button onClick={openCreate} variant="outline">
                Add first tournament
              </Button>
            </Empty>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.title ?? "-"}</TableCell>
                    <TableCell>{t.venue ?? "-"}</TableCell>
                    <TableCell>{formatDate(t.startAt)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{t.status ?? "draft"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(t)}
                        >
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
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>
              {editingId ? "Edit tournament" : "Add tournament"}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={form.title ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Tournament name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={form.slug ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                placeholder="url-friendly-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="venue">Venue</Label>
              <Input
                id="venue"
                value={form.venue ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
                placeholder="Venue / location"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startAt">Start date</Label>
              <Input
                id="startAt"
                type="datetime-local"
                value={
                  form.startAt
                    ? new Date(form.startAt).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    startAt: e.target.value ? new Date(e.target.value).toISOString() : "",
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endAt">End date</Label>
              <Input
                id="endAt"
                type="datetime-local"
                value={
                  form.endAt
                    ? new Date(form.endAt).toISOString().slice(0, 16)
                    : ""
                }
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    endAt: e.target.value ? new Date(e.target.value).toISOString() : "",
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status ?? "draft"}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    status: v as Collections["tournaments"]["status"],
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
            <AlertDialogTitle>Remove tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the tournament. This action cannot be undone.
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
