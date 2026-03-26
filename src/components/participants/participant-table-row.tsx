import { GeneratedAvatar } from "@/components/ui/avatar";
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
import { formatParticipantNameDisplay } from "@/lib/utils";
import { formatBirthdateDisplay, getAge } from "@/lib/age";
import { ParticipantContactWithBadge } from "@/components/participants/participant-contact-with-badge";
import { StatusBadge } from "./status-badge";
import { getAvatarUrl } from "@/lib/avatar";
import { effectiveParticipantStatus } from "@/lib/participant-display-status";
import type { Collections, PlayerRole } from "@/types/pocketbase-types";
import { Archive, CircleHelp, Pencil, Plus, UserMinus } from "lucide-react";

type Participant = Collections["participants"] & { id: string };
type Team = Collections["teams"] & { id: string };

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

export function ParticipantTableRow({
  participant,
  teamName,
  teams,
  suggestions = [],
  onEdit,
  onDelete,
  onRemoveFromTeam,
  onJoinTeam,
}: {
  participant: Participant;
  teamName: string;
  teams?: Team[];
  suggestions?: TeamSuggestion[];
  onEdit: (p: Participant) => void;
  onDelete: (id: string) => void;
  onRemoveFromTeam?: (p: Participant) => void;
  onJoinTeam?: (participantId: string, teamId: string) => void;
}) {
  const p = participant;
  const age = getAge(p.birthdate);
  const displayStatus = effectiveParticipantStatus(p, teams);
  return (
    <TableRow>
      <TableCell>
        <GeneratedAvatar
          size="sm"
          src={getAvatarUrl(p.id)}
          alt={formatParticipantNameDisplay(p.name) || p.gameID || ""}
        />
      </TableCell>
      <TableCell className="font-mono tabular-nums">{p.gameID ?? "-"}</TableCell>
      <TableCell>
        {formatParticipantNameDisplay(p.name) || p.gameID || "-"}
      </TableCell>
      <TableCell>
        <ParticipantContactWithBadge contactNumber={p.contactNumber} />
      </TableCell>
      <TableCell className="text-sm tabular-nums">
        {formatBirthdateDisplay(p.birthdate) ?? "-"}
        {age !== null && (
          <span className="text-muted-foreground ml-1.5">({age} yrs)</span>
        )}
      </TableCell>
      <TableCell>
        <StatusBadge status={displayStatus} />
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {formatPreferredRoles(p.preferredRoles)}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          {p.team && onRemoveFromTeam && (
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => onRemoveFromTeam(p)}
              aria-label="Remove from team"
            >
              <UserMinus className="size-4" />
            </Button>
          )}
          <span>{teamName}</span>
          {!p.team && suggestions.length > 0 && onJoinTeam && (
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
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(p)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(p.id)}
            aria-label="Archive participant"
          >
            <Archive className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
