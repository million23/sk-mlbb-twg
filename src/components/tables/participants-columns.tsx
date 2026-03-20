"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { GeneratedAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatBirthdateDisplay, getAge } from "@/lib/age";
import { StatusBadge } from "@/components/participants/status-badge";
import { getAvatarUrl } from "@/lib/avatar";
import type { Collections, PlayerRole } from "@/types/pocketbase-types";
import { CircleHelp, Pencil, Plus, Trash2, UserMinus } from "lucide-react";

type Participant = Collections["participants"] & { id: string };

type TeamSuggestion = {
  suggestedTeamId?: string;
  suggestedTeamName?: string;
  suggestionPriority?: string;
};

export type ParticipantsTableMeta = {
  getTeamName: (teamId: string | undefined) => string;
  suggestionsByParticipant: Map<string, TeamSuggestion[]>;
  onEdit: (p: Participant) => void;
  onDelete: (id: string) => void;
  onRemoveFromTeam?: (p: Participant) => void;
  onJoinTeam?: (participantId: string, teamId: string) => void;
};

const ROLE_LABELS: Record<PlayerRole, string> = {
  mid: "Mid",
  gold: "Gold",
  exp: "Exp",
  support: "Support",
  jungle: "Jungle",
};

function formatPreferredRoles(roles?: PlayerRole[]): string {
  if (!roles?.length) return "-";
  return roles
    .filter(Boolean)
    .map((r) => ROLE_LABELS[r] ?? r)
    .join(", ");
}

export function getParticipantsColumns(
  meta: ParticipantsTableMeta
): ColumnDef<Participant>[] {
  return [
    {
      accessorKey: "id",
      header: () => null,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <GeneratedAvatar
            size="sm"
            src={getAvatarUrl(p.id)}
            alt={p.name ?? ""}
          />
        );
      },
      meta: { className: "w-12" },
    },
    {
      accessorKey: "gameID",
      header: "Game ID",
      cell: ({ row }) => (
        <span className="font-mono">{row.original.gameID ?? "-"}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => row.original.name ?? "-",
    },
    {
      accessorKey: "contactNumber",
      header: "Contact",
      cell: ({ row }) => row.original.contactNumber ?? "-",
    },
    {
      accessorKey: "birthdate",
      header: "Birthday",
      cell: ({ row }) => {
        const p = row.original;
        const age = getAge(p.birthdate);
        return (
          <span className="text-sm tabular-nums">
            {formatBirthdateDisplay(p.birthdate) ?? "-"}
            {age !== null && (
              <span className="ml-1.5 text-muted-foreground">({age} yrs)</span>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge status={row.original.status ?? "unassigned"} />
      ),
    },
    {
      accessorKey: "preferredRoles",
      header: "Preferred lanes",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatPreferredRoles(row.original.preferredRoles)}
        </span>
      ),
    },
    {
      accessorKey: "team",
      header: "Team",
      cell: ({ row }) => {
        const p = row.original;
        const teamName = meta.getTeamName(p.team);
        const suggestions = meta.suggestionsByParticipant.get(p.id) ?? [];
        return (
          <div className="flex items-center gap-1">
            {p.team && meta.onRemoveFromTeam && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => meta.onRemoveFromTeam?.(p)}
                aria-label="Remove from team"
              >
                <UserMinus className="size-4" />
              </Button>
            )}
            <span>{teamName}</span>
            {!p.team && suggestions.length > 0 && meta.onJoinTeam && (
              <Popover>
                <PopoverTrigger
                  aria-label="Team suggestions"
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <CircleHelp className="size-4" />
                    </Button>
                  }
                />
                <PopoverContent
                  className="min-w-80 w-(--anchor-width) max-w-[calc(100vw-2rem)] p-2"
                  align="start"
                >
                  <p className="mb-2 text-xs font-medium text-muted-foreground">
                    Suggested teams
                  </p>
                  <div className="flex flex-col gap-1">
                    {suggestions
                      .filter((s) => s.suggestedTeamId)
                      .map((s) => (
                        <Button
                          key={s.suggestedTeamId}
                          variant="secondary"
                          size="sm"
                          className="h-auto justify-between gap-2 py-2 pl-3 pr-2 text-left font-normal"
                          onClick={() =>
                            meta.onJoinTeam?.(p.id, s.suggestedTeamId ?? "")
                          }
                        >
                          <span className="truncate">
                            {s.suggestedTeamName ?? "-"}
                          </span>
                          <Plus className="size-3 shrink-0" />
                        </Button>
                      ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => null,
      cell: ({ row }) => {
        const p = row.original;
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => meta.onEdit(p)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              onClick={() => meta.onDelete(p.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        );
      },
      meta: { className: "w-[120px]" },
    },
  ];
}
