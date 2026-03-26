"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { TeamMembersByAgeGroup } from "@/components/teams/team-members-by-age-group";
import { GeneratedAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { summarizeTeamAgeBracketCounts } from "@/lib/age";
import { getTeamAvatarUrl } from "@/lib/avatar";
import { getTeamStatusStyle } from "@/lib/team-status";
import { cn } from "@/lib/utils";
import type { Collections } from "@/types/pocketbase-types";
import { Archive, ChevronDown, Pencil, UserPlus } from "lucide-react";

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

export function getTeamsColumns(
  meta: TeamsTableMeta
): ColumnDef<Team>[] {
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
        const ageSummary = summarizeTeamAgeBracketCounts(members);
        return (
          <div className="flex min-w-0 max-w-[min(22rem,100%)] flex-nowrap items-center gap-2">
            {members.length > 0 ? (
              <>
                <Popover>
                  <PopoverTrigger
                    aria-label="View team members"
                    render={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto shrink-0 py-1 -ml-1"
                      >
                        {count} members
                        <ChevronDown className="ml-0.5 size-4 shrink-0" />
                      </Button>
                    }
                  />
                  <PopoverContent
                    align="start"
                    className="w-[min(calc(100vw-2rem),22rem)] max-h-[min(70vh,24rem)] overflow-y-auto p-3"
                  >
                    <p className="mb-2 text-xs font-medium text-muted-foreground">
                      Team members
                    </p>
                    <TeamMembersByAgeGroup members={members} />
                  </PopoverContent>
                </Popover>
                <span
                  className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
                  title={ageSummary}
                >
                  {ageSummary}
                </span>
              </>
            ) : (
              count
            )}
          </div>
        );
      },
      meta: {
        tdClassName: "align-middle min-w-0",
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
              aria-label="Archive team"
            >
              <Archive className="size-4" />
            </Button>
          </div>
        );
      },
      meta: { className: "w-[100px]" },
    },
  ];
}
