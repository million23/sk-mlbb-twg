import { AdminFormDialog } from "@/components/admin/admins/admin-form-dialog";
import { AdminRoleBadge } from "@/components/admin/admins/admin-role-badge";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AdminStagger } from "@/components/admin/admin-stagger";
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
import { Badge } from "@/components/ui/badge";
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
import { AdminTableSkeleton } from "@/components/admin/admin-table-skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  AdminFormValues,
  CommitteeAdmin,
} from "@/hooks/admin/use-committee-admins";
import { format, isValid, parseISO } from "date-fns";
import { Pencil, Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export type AdminsPageProps = {
  admins: CommitteeAdmin[];
  currentUserId?: string;
  canManage: boolean;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  formPending?: boolean;
  deletePending?: boolean;
  onRetry: () => void;
  onCreate: (values: AdminFormValues) => Promise<void>;
  onUpdate: (id: string, values: AdminFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  canDelete: (id: string) => boolean;
};

function formatWhen(iso?: string) {
  if (!iso) return "—";
  const d = parseISO(iso);
  if (!isValid(d)) return "—";
  return format(d, "MMM d, yyyy");
}

export function AdminsPage({
  admins,
  currentUserId,
  canManage,
  isLoading,
  isError,
  errorMessage,
  formPending,
  deletePending,
  onRetry,
  onCreate,
  onUpdate,
  onDelete,
  canDelete,
}: AdminsPageProps) {
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CommitteeAdmin | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return admins;
    return admins.filter((a) =>
      [a.name, a.email, a.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [admins, search]);

  const deleteTarget = admins.find((a) => a.id === deleteId) ?? null;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <AdminStagger index={0}>
        <AdminPageHeader
          eyebrow="Committee"
          title="Admins"
          description={
            canManage
              ? "Manage committee accounts and roles. Only superadmins can create or change access."
              : "Committee accounts with access to the tournament management system. Contact a superadmin to make changes."
          }
          actions={
            canManage ? (
              <Button
                type="button"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Plus className="size-4" />
                Add admin
              </Button>
            ) : null
          }
        />
      </AdminStagger>

      <AdminStagger index={1}>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.18em]">
              {admins.length} account{admins.length === 1 ? "" : "s"}
            </p>
            <InputGroup className="w-full sm:max-w-xs">
              <InputGroupAddon>
                <Search className="size-4" />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search name, email, role…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </InputGroup>
          </div>

          {isLoading ? (
            <AdminTableSkeleton
              columns={[
                {
                  key: "name",
                  label: "Name",
                  boneClassName: [
                    "h-4 w-36",
                    "h-4 w-28",
                    "h-4 w-44",
                    "h-4 w-32",
                    "h-4 w-40",
                    "h-4 w-24",
                    "h-4 w-36",
                    "h-4 w-48",
                  ],
                  stacked: true,
                },
                {
                  key: "email",
                  label: "Email",
                  headClassName: "hidden md:table-cell",
                  cellClassName: "hidden md:table-cell",
                  boneClassName: ["h-4 w-44", "h-4 w-36", "h-4 w-52", "h-4 w-40"],
                },
                {
                  key: "role",
                  label: "Role",
                  boneClassName: "h-5 w-24 rounded-full",
                },
                {
                  key: "status",
                  label: "Status",
                  boneClassName: "h-5 w-16 rounded-full",
                },
                {
                  key: "login",
                  label: "Last login",
                  headClassName: "hidden sm:table-cell",
                  cellClassName: "hidden sm:table-cell",
                  boneClassName: "h-4 w-28",
                },
                ...(canManage
                  ? [
                      {
                        key: "actions",
                        label: "Actions",
                        headClassName: "text-right",
                        cellClassName: "text-right",
                        boneClassName: "ml-auto size-8 rounded-md",
                      },
                    ]
                  : []),
              ]}
            />
          ) : isError ? (
            <Empty className="border border-border">
              <EmptyHeader>
                <EmptyTitle>Could not load admins</EmptyTitle>
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
                  <ShieldCheck />
                </EmptyMedia>
                <EmptyTitle>
                  {search.trim() ? "No admins match" : "No admins"}
                </EmptyTitle>
                <EmptyDescription>
                  {search.trim()
                    ? "Try a different search."
                    : canManage
                      ? "Add admin accounts to grant access to the system."
                      : "Admin accounts will appear here when configured."}
                </EmptyDescription>
              </EmptyHeader>
              {canManage && !search.trim() ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditing(null);
                    setFormOpen(true);
                  }}
                >
                  <Plus className="size-4" />
                  Add first admin
                </Button>
              ) : null}
            </Empty>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Last login
                    </TableHead>
                    {canManage ? (
                      <TableHead className="text-right">Actions</TableHead>
                    ) : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((a) => {
                    const isSelf = a.id === currentUserId;
                    return (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">
                          <div className="min-w-0">
                            <p className="truncate">
                              {a.name?.trim() || "—"}
                              {isSelf ? (
                                <span className="ml-1.5 font-mono text-[0.65rem] text-primary uppercase tracking-wider">
                                  You
                                </span>
                              ) : null}
                            </p>
                            <p className="truncate text-muted-foreground text-xs md:hidden">
                              {a.email || "—"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {a.email || "—"}
                        </TableCell>
                        <TableCell>
                          <AdminRoleBadge role={a.role} />
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              a.is_active
                                ? "border-success/30 bg-success/10 text-success"
                                : "border-muted-foreground/30 bg-muted text-muted-foreground"
                            }
                          >
                            {a.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground text-sm sm:table-cell">
                          {formatWhen(a.last_login_at)}
                        </TableCell>
                        {canManage ? (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="Edit admin"
                                onClick={() => {
                                  setEditing(a);
                                  setFormOpen(true);
                                }}
                              >
                                <Pencil className="size-3.5" />
                              </Button>
                              {canDelete(a.id) ? (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-destructive hover:text-destructive"
                                  aria-label="Remove admin"
                                  onClick={() => setDeleteId(a.id)}
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        ) : null}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </AdminStagger>

      {canManage ? (
        <AdminFormDialog
          open={formOpen}
          onOpenChange={(open) => {
            setFormOpen(open);
            if (!open) setEditing(null);
          }}
          mode={editing ? "edit" : "create"}
          record={editing}
          pending={formPending}
          onSubmit={async (values) => {
            if (editing?.id) {
              await onUpdate(editing.id, values);
            } else {
              await onCreate(values);
            }
            setFormOpen(false);
            setEditing(null);
          }}
        />
      ) : null}

      <AlertDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove admin?</AlertDialogTitle>
            <AlertDialogDescription>
              This revokes access for{" "}
              <span className="font-medium text-foreground">
                {deleteTarget?.name || deleteTarget?.email || "this admin"}
              </span>
              . They will no longer be able to log in. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePending}
              onClick={() => {
                if (!deleteId) return;
                void onDelete(deleteId).then(() => setDeleteId(null));
              }}
            >
              {deletePending ? "Removing…" : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
