"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Collections } from "@/types/pocketbase-types";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";

type Tournament = Collections["tournaments"] & { id: string };

export type TournamentTableMeta = {
  onEdit: (t: Tournament) => void;
  onDelete: (id: string) => void;
};

function formatDate(d: string | undefined) {
  if (!d) return "-";
  try {
    return format(new Date(d), "MMM d, yyyy HH:mm");
  } catch {
    return d;
  }
}

export function getTournamentColumns(
  meta: TournamentTableMeta
): ColumnDef<Tournament>[] {
  return [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title ?? "-"}</span>
      ),
    },
    {
      accessorKey: "venue",
      header: "Venue",
      cell: ({ row }) => row.original.venue ?? "-",
    },
    {
      accessorKey: "startAt",
      header: "Start",
      cell: ({ row }) => formatDate(row.original.startAt),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.status ?? "draft"}</Badge>
      ),
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="flex gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => meta.onEdit(t)}>
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={() => meta.onDelete(t.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        );
      },
      meta: { className: "w-[100px]" },
    },
  ];
}
