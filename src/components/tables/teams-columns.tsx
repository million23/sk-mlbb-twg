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
import { RegisteredDateCell } from "@/components/ui/registered-date-cell";
import { registeredAtMs } from "@/lib/registered-date";
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
      meta: {
        className: "w-12 max-w-12",
        thClassName: "w-12 max-w-12 px-2",
        tdClassName: "w-12 max-w-12 px-2 align-middle",
      },
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => {
        const name = row.original.name ?? "-";
        return (
          <span className="block truncate font-medium" title={name}>
            {name}
          </span>
        );
      },
      meta: {
        thClassName: "w-[14%] min-w-[5.5rem]",
        tdClassName: "w-[14%] min-w-[5.5rem] align-middle overflow-hidden",
      },
    },
    {
      accessorKey: "created",
      header: "Date registered",
      sortingFn: (rowA, rowB, columnId) =>
        registeredAtMs(rowA.getValue(columnId) as string | undefined) -
        registeredAtMs(rowB.getValue(columnId) as string | undefined),
      cell: ({ row }) => (
        <RegisteredDateCell created={row.original.created} />
      ),
      meta: {
        thClassName: "w-[11rem] whitespace-normal",
        tdClassName:
          "w-[11rem] max-w-[11rem] whitespace-normal align-middle",
      },
    },
    {
      accessorKey: "captain",
      header: "Captain",
      cell: ({ row }) => {
        const label = meta.getCaptainName(row.original.captain);
        return (
          <span className="block truncate" title={label}>
            {label}
          </span>
        );
      },
      meta: {
        thClassName: "w-[18%] min-w-[7rem]",
        tdClassName: "w-[18%] min-w-[7rem] align-middle overflow-hidden",
      },
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
          <div className="flex min-w-0 max-w-full flex-nowrap items-center justify-start gap-1.5">
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
                  className="min-w-0 max-w-[min(12rem,calc(100%-7rem))] shrink truncate text-xs text-muted-foreground"
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
        thClassName: "w-[26%] min-w-[10rem]",
        tdClassName: "w-[26%] min-w-[10rem] align-middle overflow-hidden",
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
      meta: {
        thClassName: "w-[6.5rem]",
        tdClassName: "w-[6.5rem] align-middle",
      },
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const t = row.original;
        return (
          <div className="flex justify-end gap-1">
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
      meta: {
        className: "w-[104px]",
        thClassName: "w-[104px] px-1 text-right",
        tdClassName: "w-[104px] px-1 text-right align-middle",
      },
    },
  ];
}
