"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { TeamMembersByAgeGroup } from "@/components/teams/team-members-by-age-group";
import { GeneratedAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { summarizeTeamAgeBracketCounts } from "@/lib/age";
import { getTeamAvatarUrl } from "@/lib/avatar";
import { getTeamStatusStyle } from "@/lib/team-status";
import { cn } from "@/lib/utils";
import type { Collections } from "@/types/pocketbase-types";
import { ChevronDown, Pencil, Trash2, UserPlus } from "lucide-react";

type Team = Collections["teams"] & { id: string };

type TeamMember = { id: string; name?: string; gameID?: string; birthdate?: string };

export type TeamsTableMeta = {
  getCaptainName: (captainId: string | undefined) => string;
  getMemberCount: (teamId: string) => number;
  getMembers: (teamId: string) => TeamMember[];
  onEdit: (t: Team) => void;
  onDelete: (id: string) => void;
  onAddMembers?: (t: Team) => void;
};

export type TeamWithSubRows = Team & {
  subRows?: { _expandedContent: true; members: TeamMember[] }[];
};

export function getTeamsColumns(
  meta: TeamsTableMeta
): ColumnDef<TeamWithSubRows>[] {
  return [
    {
      accessorKey: "id",
      header: () => null,
      cell: ({ row }) => {
        const t = row.original;
        return (
          <GeneratedAvatar
            size="sm"
            src={getTeamAvatarUrl(t.id)}
            alt={t.name ?? ""}
          />
        );
      },
      meta: { className: "w-12" },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.name ?? "-"}</span>
      ),
    },
    {
      accessorKey: "captain",
      header: "Captain",
      cell: ({ row }) =>
        meta.getCaptainName(row.original.captain),
    },
    {
      accessorKey: "members",
      header: "Members",
      cell: ({ row }) => {
        const t = row.original;
        const members = meta.getMembers(t.id);
        const count = meta.getMemberCount(t.id);
        return (
          <div className="flex flex-col items-start gap-0.5">
            {members.length > 0 ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto py-1 -ml-1"
                  onClick={() => row.toggleExpanded()}
                >
                  {count} members
                  <ChevronDown
                    className={cn(
                      "ml-0.5 size-4 transition-transform",
                      row.getIsExpanded() && "rotate-180"
                    )}
                  />
                </Button>
                <span className="max-w-56 text-xs text-muted-foreground">
                  {summarizeTeamAgeBracketCounts(members)}
                </span>
              </>
            ) : (
              count
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const style = getTeamStatusStyle(row.original.status);
        return (
          <Badge
            variant="outline"
            className={cn(style.className)}
          >
            {style.label}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="flex gap-1">
            {meta.onAddMembers && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => meta.onAddMembers?.(t)}
                title="Add members"
              >
                <UserPlus className="size-4" />
              </Button>
            )}
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

export function renderTeamsExpandedRow(row: TeamWithSubRows | { _expandedContent: true; members: TeamMember[] }) {
  const expanded = row as { _expandedContent?: true; members?: TeamMember[] };
  const members = expanded.members ?? [];
  if (members.length === 0) return null;
  return (
    <div className="px-4 py-3">
      <TeamMembersByAgeGroup members={members} />
    </div>
  );
}
