"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import type { Collections } from "@/types/pocketbase-types";
import { Pencil, Trash2 } from "lucide-react";

type Admin = Collections["admins"] & { id: string };

export type AdminsTableMeta = {
  isSuperadmin: boolean;
  currentUserId?: string;
  onEdit: (a: Admin) => void;
  onDelete: (id: string) => void;
  canDelete: (admin: Admin) => boolean;
};

export function getAdminsColumns(
  meta: AdminsTableMeta
): ColumnDef<Admin>[] {
  const baseColumns: ColumnDef<Admin>[] = [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.email ?? "-"}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => row.original.name ?? "-",
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className="capitalize">{row.original.role ?? "staff"}</span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const a = row.original;
        return (
          <span
            className={
              a.isActive ? "text-foreground" : "text-muted-foreground"
            }
          >
            {a.isActive ? "Active" : "Inactive"}
          </span>
        );
      },
    },
  ];

  if (meta.isSuperadmin) {
    baseColumns.push({
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const a = row.original;
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => meta.onEdit(a)}
            >
              <Pencil className="size-4" />
            </Button>
            {meta.canDelete(a) && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                onClick={() => meta.onDelete(a.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            )}
          </div>
        );
      },
      meta: { className: "w-[100px]" },
    });
  }

  return baseColumns;
}
