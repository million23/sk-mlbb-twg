import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
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
import { DateTimeRangePicker } from "@/components/ui/date-time-range-picker";
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
import { FxAppCardBodyLg } from "@/lib/loading-placeholders";
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
import {
  getTournamentStatusLabel,
  TOURNAMENT_STATUS_OPTIONS,
} from "@/lib/tournament-status";
import { cn } from "@/lib/utils";
import type { Collections } from "@/types/pocketbase-types";
import { Archive, LayoutGrid, LayoutList, MapPin, Plus, Pencil, Trophy } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export const Route = createFileRoute("/app/$id/tournament/")({
  component: TournamentPage,
});

type TournamentFormData = Partial<
  Omit<Collections["tournaments"], "id" | "created" | "updated">
>;

const TOURNAMENT_STATUS_VALUES = new Set(
  TOURNAMENT_STATUS_OPTIONS.map((o) => o.value),
);

function requiredLabel(text: string) {
  return (
    <>
      {text}
      <span className="text-destructive" aria-hidden>
        {" "}
        *
      </span>
    </>
  );
}

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
    <div className="w-full flex flex-col gap-4 px-4 pb-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">{requiredLabel("Title")}</Label>
        <Input
          id="title"
          value={form.title ?? ""}
          aria-required
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          value={form.slug ?? ""}
          readOnly
          className="bg-muted"
          placeholder="url-friendly-name"
        />
      </div>
      <div className="flex flex-col gap-2">
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
      <div className="flex flex-col gap-2">
        <Label htmlFor="venue">{requiredLabel("Venue")}</Label>
        <Input
          id="venue"
          value={form.venue ?? ""}
          aria-required
          onChange={(e) => setForm((f) => ({ ...f, venue: e.target.value }))}
          placeholder="Venue / location"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="tournament-date-range">
          {requiredLabel("Start & end")}
        </Label>
        <DateTimeRangePicker
          id="tournament-date-range"
          startValue={form.startAt}
          endValue={form.endAt}
          onChange={({ startAt, endAt }) =>
            setForm((f) => ({ ...f, startAt, endAt }))
          }
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="tournament-status">{requiredLabel("Status")}</Label>
        <Select
          value={form.status ?? "draft"}
          onValueChange={(v) =>
            setForm((f) => ({
              ...f,
              status: v as Collections["tournaments"]["status"],
            }))
          }
        >
          <SelectTrigger id="tournament-status" className="w-full" aria-required>
            <SelectValue placeholder="Select status">
              {(value) =>
                value != null && value !== ""
                  ? getTournamentStatusLabel(
                      value as Collections["tournaments"]["status"],
                    )
                  : null
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {TOURNAMENT_STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectGroup>
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
  )
}

function TournamentPage() {
  const params = useParams({ strict: false });
  const appId = (params as { id?: string })?.id ?? "";
  const { data: tournaments, isLoading } = useTournaments();
  const mutations = useTournamentMutations();
  const isMobile = useIsMobile();
  const [view, setView] = useState<"table" | "cards">("table");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [archiveConfirmId, setArchiveConfirmId] = useState<string | null>(
    null,
  );
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
    const title = (form.title ?? "").trim();
    const venue = (form.venue ?? "").trim();
    const startAt = (form.startAt ?? "").trim();
    const endAt = (form.endAt ?? "").trim();
    const status = form.status;

    const missing: string[] = [];
    if (!title) missing.push("title");
    if (!venue) missing.push("venue");
    if (!startAt) missing.push("start date");
    if (!endAt) missing.push("end date");
    if (!status || !TOURNAMENT_STATUS_VALUES.has(status)) {
      missing.push("status");
    }

    if (missing.length > 0) {
      toast.error(
        missing.length === 1
          ? `Please enter ${missing[0]}.`
          : `Please enter: ${missing.join(", ")}.`,
      );
      return;
    }

    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();
    if (Number.isNaN(startMs)) {
      toast.error("Start date is invalid.");
      return;
    }
    if (Number.isNaN(endMs)) {
      toast.error("End date is invalid.");
      return;
    }
    if (endMs < startMs) {
      toast.error("End date and time must be on or after the start.");
      return;
    }

    const slug = title
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    const payload = {
      ...form,
      title,
      slug,
      venue,
      startAt,
      endAt,
      status,
    };

    if (editingId) {
      mutations.update.mutate({ id: editingId, ...payload });
      toast.success("Tournament updated");
    } else {
      mutations.create.mutate(payload);
      toast.success("Tournament added");
    }
    setSheetOpen(false);
  };

  const handleArchiveConfirm = () => {
    if (archiveConfirmId) {
      mutations.archive.mutate(archiveConfirmId);
      toast.success("Tournament archived");
      setArchiveConfirmId(null);
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            Tournaments
          </h1>
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
          <Link
            to="/app/$id/tournament/archived"
            params={{ id: appId }}
            className={cn(
              buttonVariants({ variant: "outline", size: "default" }),
              "gap-2",
            )}
          >
            <Archive className="size-4 shrink-0" aria-hidden />
            Archived
          </Link>
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
            <Skeleton className="block bg-transparent p-0 shadow-none ring-0">
              <FxAppCardBodyLg />
            </Skeleton>
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
                onDelete: setArchiveConfirmId,
              })}
              data={tournaments ?? []}
              filterColumn="title"
              filterPlaceholder="Filter by title..."
              emptyMessage="No tournaments."
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
                      <div className="min-w-0 flex-1 flex flex-col gap-2">
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
                          <Badge variant="outline">
                            {getTournamentStatusLabel(t.status)}
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
                          onClick={() => setArchiveConfirmId(t.id)}
                          aria-label="Archive tournament"
                        >
                          <Archive className="size-4" />
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

      <AlertDialog
        open={!!archiveConfirmId}
        onOpenChange={(o) => !o && setArchiveConfirmId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive tournament?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide the tournament from active lists. The record stays
              in the database with archived set to true. You can restore from
              the Archived tournaments page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchiveConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
