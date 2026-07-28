import { Button } from "@/components/ui/button";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { AdminFormValues } from "@/hooks/admin/use-committee-admins";
import type { CommitteeAdmin } from "@/hooks/admin/use-committee-admins";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_OPTIONS,
  type AdminRole,
} from "@/lib/admin/permissions";
import { useEffect, useState } from "react";

function emptyValues(): AdminFormValues {
  return {
    email: "",
    password: "",
    passwordConfirm: "",
    name: "",
    role: "staff",
    is_active: true,
  };
}

function fromRecord(record: CommitteeAdmin): AdminFormValues {
  return {
    email: record.email ?? "",
    password: "",
    passwordConfirm: "",
    name: record.name ?? "",
    role: (record.role as AdminRole) ?? "staff",
    is_active: record.is_active ?? true,
  };
}

export function AdminFormDialog({
  open,
  onOpenChange,
  mode,
  record,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  record?: CommitteeAdmin | null;
  pending?: boolean;
  onSubmit: (values: AdminFormValues) => Promise<void> | void;
}) {
  const [values, setValues] = useState<AdminFormValues>(emptyValues);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setValues(record ? fromRecord(record) : emptyValues());
  }, [open, record]);

  const patch = (partial: Partial<AdminFormValues>) =>
    setValues((prev) => ({ ...prev, ...partial }));

  const validate = (): string | null => {
    if (mode === "create") {
      if (!values.email.trim() || !values.email.includes("@")) {
        return "Valid email is required";
      }
      if (values.password.length < 8) {
        return "Password must be at least 8 characters";
      }
      if (values.password !== values.passwordConfirm) {
        return "Passwords do not match";
      }
    } else if (values.password || values.passwordConfirm) {
      if (values.password.length < 8) {
        return "Password must be at least 8 characters";
      }
      if (values.password !== values.passwordConfirm) {
        return "Passwords do not match";
      }
    }
    if (!values.name.trim()) return "Name is required";
    return null;
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="max-w-md">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>
            {mode === "create" ? "Add admin" : "Edit admin"}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {mode === "create"
              ? "Create a committee account. Superadmins can manage admins and audit logs."
              : "Update name, role, or active status. Leave password blank to keep it unchanged."}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const message = validate();
            if (message) {
              setError(message);
              return;
            }
            setError(null);
            void Promise.resolve(
              onSubmit({
                ...values,
                email: values.email.trim(),
                name: values.name.trim(),
              }),
            ).catch((err: unknown) => {
              setError(
                err instanceof Error ? err.message : "Could not save admin",
              );
            });
          }}
        >
          {mode === "create" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="admin-email">Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={values.email}
                  onChange={(e) => patch({ email: e.target.value })}
                  placeholder="admin@example.com"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password">Password</Label>
                <Input
                  id="admin-password"
                  type="password"
                  value={values.password}
                  onChange={(e) => patch({ password: e.target.value })}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password-confirm">Confirm password</Label>
                <Input
                  id="admin-password-confirm"
                  type="password"
                  value={values.passwordConfirm}
                  onChange={(e) => patch({ passwordConfirm: e.target.value })}
                  autoComplete="new-password"
                />
              </div>
            </>
          ) : (
            <div className="space-y-1.5">
              <Label>Email</Label>
              <p className="text-muted-foreground text-sm">
                {values.email || "—"}
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="admin-name">Name</Label>
            <Input
              id="admin-name"
              value={values.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Display name"
            />
          </div>

          {mode === "edit" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="admin-password-edit">New password</Label>
                <Input
                  id="admin-password-edit"
                  type="password"
                  value={values.password}
                  onChange={(e) => patch({ password: e.target.value })}
                  placeholder="Optional"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="admin-password-confirm-edit">Confirm</Label>
                <Input
                  id="admin-password-confirm-edit"
                  type="password"
                  value={values.passwordConfirm}
                  onChange={(e) => patch({ passwordConfirm: e.target.value })}
                  placeholder="Optional"
                  autoComplete="new-password"
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="min-w-0 flex-1 space-y-1.5">
              <Label htmlFor="admin-role">Role</Label>
              <Select
                value={values.role}
                onValueChange={(v) =>
                  patch({ role: (v as AdminRole) ?? "staff" })
                }
              >
                <SelectTrigger id="admin-role" className="w-full">
                  <SelectValue>
                    {(selected) =>
                      selected
                        ? ADMIN_ROLE_LABELS[selected as AdminRole] ?? selected
                        : null
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {ADMIN_ROLE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 pb-0.5">
              <Label htmlFor="admin-active" className="cursor-pointer font-normal">
                Active
              </Label>
              <Switch
                id="admin-active"
                checked={values.is_active}
                onCheckedChange={(checked) =>
                  patch({ is_active: checked === true })
                }
              />
            </div>
          </div>

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          <ResponsiveModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending
                ? "Saving…"
                : mode === "create"
                  ? "Add admin"
                  : "Save changes"}
            </Button>
          </ResponsiveModalFooter>
        </form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
