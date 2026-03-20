import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { DataTable } from "@/components/ui/data-table";
import { getTournamentColumns } from "@/components/tables/tournament-columns";
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
import { useTournaments, useTournamentMutations } from "@/hooks/use-tournaments";
import type { Collections } from "@/types/pocketbase-types";
import { LayoutGrid, LayoutList, MapPin, Plus, Pencil, Trash2, Trophy } from "lucide-react";
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

function TournamentForm({
  form,
  setForm,
  editingId,
  onClose,
  onSubmit,
}: {
  form: TournamentFormData;
  setForm: React.Dispatch<React.SetStateAction<TournamentFormData>>;
  editingId: string | null;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="w-full space-y-4 px-4 pb-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={form.title ?? ""}
          onChange={(e) => {
            const title = e.target.value;
            const slug = title
              .toLowerCase()
              .replace(/\s+/g, "-")
              .replace(/[^a-z0-9-]/g, "");
            setForm((f) => ({ ...f, title, slug }));
          }}
          placeholder="Tournament name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={form.slug ?? ""}
          readOnly
          className="bg-muted"
          placeholder="url-friendly-name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={form.description ?? ""}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          placeholder="Event details"
          rows={3}
          className="resize-none"
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
        <DateTimePicker
          id="startAt"
          value={form.startAt ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, startAt: v }))}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="endAt">End date</Label>
        <DateTimePicker
          id="endAt"
          value={form.endAt ?? ""}
          onChange={(v) => setForm((f) => ({ ...f, endAt: v }))}
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
          <SelectTrigger className="w-full">
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

function TournamentPage() {
  const { data: tournaments, isLoading } = useTournaments();
  const mutations = useTournamentMutations();
  const isMobile = useIsMobile();
  const [view, setView] = useState<"table" | "cards">("table");
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

  const openEdit = (t: NonNullable<typeof tournaments>[number]) => {
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
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Tournaments</h1>
          <p className="text-muted-foreground">
            Manage tournament events
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
            Add tournament
          </Button>
        </div>
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
          ) : (isMobile ? "cards" : view) === "table" ? (
            <DataTable
              columns={getTournamentColumns({
                onEdit: openEdit,
                onDelete: setDeleteId,
              })}
              data={tournaments ?? []}
              filterColumn="title"
              filterPlaceholder="Filter by title..."
              emptyMessage="No tournaments."
              pageSize={10}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {tournaments.map((t) => (
                <Card
                  key={t.id}
                  className="overflow-hidden transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Trophy className="size-5 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-medium truncate">{t.title ?? "-"}</h3>
                            {t.venue && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1">
                                <MapPin className="size-3.5 shrink-0" />
                                <span className="truncate">{t.venue}</span>
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            {formatDate(t.startAt)}
                          </span>
                          <Badge variant="outline" className="capitalize">
                            {t.status ?? "draft"}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1 shrink-0">
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isMobile ? (
        <Drawer open={sheetOpen} onOpenChange={setSheetOpen} direction="bottom">
          <DrawerContent className="max-h-[85vh] flex w-full flex-col overflow-hidden">
            <DrawerHeader className="shrink-0 px-4">
              <DrawerTitle>
                {editingId ? "Edit tournament" : "Add tournament"}
              </DrawerTitle>
            </DrawerHeader>
            <div className="min-h-0 w-full overflow-y-auto overscroll-contain">
              <TournamentForm
                key={editingId ?? "create"}
                form={form}
                setForm={setForm}
                editingId={editingId}
                onClose={() => setSheetOpen(false)}
                onSubmit={handleSubmit}
              />
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
          <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit tournament" : "Add tournament"}
              </DialogTitle>
            </DialogHeader>
            <TournamentForm
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
