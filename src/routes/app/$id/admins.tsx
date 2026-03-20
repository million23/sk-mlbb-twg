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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import { getAdminsColumns } from "@/components/tables/admins-columns";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePocketBaseAuth } from "@/hooks/use-pocketbase-auth";
import { useAdminMutations } from "@/hooks/use-admin-mutations";
import { useAdmins } from "@/hooks/use-admins";
import type { AdminRole, Collections } from "@/types/pocketbase-types";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/app/$id/admins")({
  component: AdminsPage,
});

type Admin = Collections["admins"] & { id: string };

type AdminFormData = {
  email: string;
  password: string;
  passwordConfirm: string;
  name: string;
  role: AdminRole;
  isActive: boolean;
};

const ADMIN_ROLES: { value: AdminRole; label: string }[] = [
  { value: "superadmin", label: "Superadmin" },
  { value: "staff", label: "Staff" },
];

function AdminForm({
  form,
  setForm,
  editingId,
  onClose,
  onSubmit,
}: {
  form: AdminFormData;
  setForm: React.Dispatch<React.SetStateAction<AdminFormData>>;
  editingId: string | null;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="w-full space-y-4 px-4 pb-4">
      {!editingId ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="admin-email">Email</Label>
            <Input
              id="admin-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="admin@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Password</Label>
            <Input
              id="admin-password"
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="Minimum 8 characters"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password-confirm">Confirm password</Label>
            <Input
              id="admin-password-confirm"
              type="password"
              value={form.passwordConfirm}
              onChange={(e) =>
                setForm((f) => ({ ...f, passwordConfirm: e.target.value }))
              }
              placeholder="••••••••"
            />
          </div>
        </>
      ) : (
        <div className="space-y-2">
          <Label>Email</Label>
          <p className="text-sm text-muted-foreground">{form.email || "-"}</p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="admin-name">Name</Label>
        <Input
          id="admin-name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Display name"
        />
      </div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6">
        <div className="flex-1 min-w-0 space-y-2">
          <Label htmlFor="admin-role">Role</Label>
          <Select
            value={form.role}
            onValueChange={(v) =>
              setForm((f) => ({ ...f, role: v as AdminRole }))
            }
          >
            <SelectTrigger id="admin-role" className="w-full sm:w-auto sm:min-w-[160px]">
              <SelectValue placeholder="Select role">
                {(value) =>
                  value != null && value !== ""
                    ? (ADMIN_ROLES.find((r) => r.value === value)?.label ??
                      String(value))
                    : null
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {ADMIN_ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="admin-active" className="cursor-pointer font-normal shrink-0">
            Active
          </Label>
          <Switch
            id="admin-active"
            checked={form.isActive}
            onCheckedChange={(checked) =>
              setForm((f) => ({ ...f, isActive: checked === true }))
            }
          />
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

function AdminsPage() {
  const { data: admins, isLoading } = useAdmins();
  const { record } = usePocketBaseAuth();
  const mutations = useAdminMutations();
  const isMobile = useIsMobile();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<AdminFormData>({
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    role: "staff",
    isActive: true,
  });

  const currentRole = (record as { role?: string } | null)?.role;
  const isSuperadmin = currentRole === "superadmin";

  const openCreate = () => {
    setEditingId(null);
    setForm({
      email: "",
      password: "",
      passwordConfirm: "",
      name: "",
      role: "staff",
      isActive: true,
    });
    setSheetOpen(true);
  };

  const openEdit = (a: Admin) => {
    setEditingId(a.id);
    setForm({
      email: a.email ?? "",
      password: "",
      passwordConfirm: "",
      name: a.name ?? "",
      role: (a.role as AdminRole) ?? "staff",
      isActive: a.isActive ?? true,
    });
    setSheetOpen(true);
  };

  const handleSubmit = async () => {
    if (!isSuperadmin) return;
    const email = form.email.trim();
    if (!email) {
      toast.error("Email is required");
      return;
    }
    if (!editingId) {
      if (form.password.length < 8) {
        toast.error("Password must be at least 8 characters");
        return;
      }
      if (form.password !== form.passwordConfirm) {
        toast.error("Passwords do not match");
        return;
      }
      try {
        await mutations.create.mutateAsync({
          email,
          password: form.password,
          passwordConfirm: form.passwordConfirm,
          name: form.name || undefined,
          role: form.role,
          isActive: form.isActive,
        });
        toast.success("Admin added");
        setSheetOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add admin");
      }
    } else {
      const payload: {
        id: string;
        name?: string;
        role?: AdminRole;
        isActive?: boolean;
        password?: string;
        passwordConfirm?: string;
      } = {
        id: editingId,
        name: form.name || undefined,
        role: form.role,
        isActive: form.isActive,
      };
      if (form.password) {
        if (form.password.length < 8) {
          toast.error("Password must be at least 8 characters");
          return;
        }
        if (form.password !== form.passwordConfirm) {
          toast.error("Passwords do not match");
          return;
        }
        payload.password = form.password;
        payload.passwordConfirm = form.passwordConfirm;
      }
      try {
        await mutations.update.mutateAsync(payload);
        toast.success("Admin updated");
        setSheetOpen(false);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update admin");
      }
    }
  };

  const handleDelete = () => {
    if (deleteId && isSuperadmin) {
      mutations.delete.mutate(deleteId, {
        onSuccess: () => {
          toast.success("Admin removed");
          setDeleteId(null);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Failed to remove admin");
        },
      });
    }
  };

  const currentUserId = (record as { id?: string } | null)?.id;
  const canDelete = (admin: Admin) =>
    isSuperadmin && admin.id !== currentUserId;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admins</h1>
          <p className="text-muted-foreground">
            Admin accounts with access to the tournament management system
          </p>
        </div>
        {isSuperadmin && (
          <Button onClick={openCreate}>
            <Plus className="size-4" />
            Add admin
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin accounts</CardTitle>
          <CardDescription>
            {admins?.length ?? 0} admins with access
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : !admins?.length ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ShieldCheck className="size-4" />
                </EmptyMedia>
                <EmptyTitle>No admins</EmptyTitle>
                <EmptyDescription>
                  {isSuperadmin
                    ? "Add admin accounts to grant access to the system"
                    : "Admin accounts will appear here when configured"}
                </EmptyDescription>
              </EmptyHeader>
              {isSuperadmin && (
                <Button onClick={openCreate} variant="outline">
                  Add first admin
                </Button>
              )}
            </Empty>
          ) : (
            <DataTable
              columns={getAdminsColumns({
                isSuperadmin,
                currentUserId: currentUserId,
                onEdit: openEdit,
                onDelete: setDeleteId,
                canDelete,
              })}
              data={admins ?? []}
              filterColumn="email"
              filterPlaceholder="Filter by email..."
              emptyMessage="No admins."
              pageSize={10}
            />
          )}
        </CardContent>
      </Card>

      {isMobile ? (
        <Drawer open={sheetOpen} onOpenChange={setSheetOpen} direction="bottom">
          <DrawerContent className="max-h-[85vh] flex w-full flex-col overflow-hidden">
            <DrawerHeader className="shrink-0 px-4">
              <DrawerTitle>
                {editingId ? "Edit admin" : "Add admin"}
              </DrawerTitle>
            </DrawerHeader>
            <div className="min-h-0 w-full overflow-y-auto overscroll-contain">
              <AdminForm
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
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Edit admin" : "Add admin"}
              </DialogTitle>
            </DialogHeader>
            <AdminForm
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
            <AlertDialogTitle>Remove admin?</AlertDialogTitle>
            <AlertDialogDescription>
              This will revoke this admin&apos;s access to the system. They will
              no longer be able to log in. This action cannot be undone.
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
