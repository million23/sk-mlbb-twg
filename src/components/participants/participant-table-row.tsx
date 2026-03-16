import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { getAvatarUrl } from "@/lib/avatar";
import type { Collections, PlayerRole } from "@/types/pocketbase-types";
import { CircleHelp, Pencil, Plus, Trash2, UserMinus } from "lucide-react";

type Participant = Collections["participants"] & { id: string };

type TeamSuggestion = {
  suggestedTeamId?: string;
  suggestedTeamName?: string;
  suggestionPriority?: string;
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

function getInitials(name?: string, gameID?: string) {
  if (name?.trim()) {
    return name
      .split(/\s+/)
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return gameID?.slice(0, 2).toUpperCase() ?? "??";
}

export function ParticipantTableRow({
  participant,
  teamName,
  suggestions = [],
  onEdit,
  onDelete,
  onRemoveFromTeam,
  onJoinTeam,
}: {
  participant: Participant;
  teamName: string;
  suggestions?: TeamSuggestion[];
  onEdit: (p: Participant) => void;
  onDelete: (id: string) => void;
  onRemoveFromTeam?: (p: Participant) => void;
  onJoinTeam?: (participantId: string, teamId: string) => void;
}) {
  const p = participant;
  return (
    <TableRow>
      <TableCell>
        <Avatar size="sm">
          <AvatarImage src={getAvatarUrl(p.id)} alt={p.name} />
          <AvatarFallback>{getInitials(p.name, p.gameID)}</AvatarFallback>
        </Avatar>
      </TableCell>
      <TableCell className="font-mono">{p.gameID ?? "-"}</TableCell>
      <TableCell>{p.name ?? "-"}</TableCell>
      <TableCell>{p.contactNumber ?? "-"}</TableCell>
      <TableCell>
        <Badge variant="outline">{p.status ?? "unassigned"}</Badge>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatPreferredRoles(p.preferredRoles)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <span>{teamName}</span>
          {p.team && onRemoveFromTeam && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveFromTeam(p)}
              aria-label="Remove from team"
            >
              <UserMinus className="size-4" />
            </Button>
          )}
          {!p.team && suggestions.length > 0 && onJoinTeam && (
            <Popover>
              <PopoverTrigger
                asChild
                aria-label="Team suggestions"
              >
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <CircleHelp className="size-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="min-w-80 w-(--anchor-width) max-w-[calc(100vw-2rem)] p-2"
                align="start"
              >
                <p className="text-xs font-medium text-muted-foreground mb-2">
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
                        onClick={() => onJoinTeam(p.id, s.suggestedTeamId ?? "")}
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
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {p.team && onRemoveFromTeam && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onRemoveFromTeam(p)}
              aria-label="Remove from team"
            >
              <UserMinus className="size-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(p)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(p.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
