import { GeneratedAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { cn, formatParticipantNameDisplay } from "@/lib/utils";
import { getAvatarUrl, getTeamAvatarUrl } from "@/lib/avatar";
import { getTeamStatusStyle } from "@/lib/team-status";
import type { Collections } from "@/types/pocketbase-types";
import { Archive, ChevronDown, Pencil, UserPlus } from "lucide-react";
import { useState } from "react";

type Team = Collections["teams"] & { id: string };

type TeamMember = { id: string; name?: string; gameID?: string };

export function TeamTableRow({
  team,
  captainName,
  memberCount,
  members,
  onEdit,
  onDelete,
  onAddMembers,
}: {
  team: Team;
  captainName: string;
  memberCount: number;
  members: TeamMember[];
  onEdit: (t: Team) => void;
  onDelete: (id: string) => void;
  onAddMembers?: (t: Team) => void;
}) {
  const t = team;
  const [expanded, setExpanded] = useState(false);
  return (
    <>
      <TableRow>
        <TableCell>
          <GeneratedAvatar
            size="sm"
            src={getTeamAvatarUrl(t.id)}
            alt={t.name ?? ""}
          />
        </TableCell>
        <TableCell className="font-medium">{t.name ?? "-"}</TableCell>
        <TableCell>{captainName}</TableCell>
        <TableCell>
          {members.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 -ml-1"
              onClick={() => setExpanded(!expanded)}
            >
              {memberCount} members
              <ChevronDown
                className={cn(
                  "size-4 ml-0.5 transition-transform",
                  expanded && "rotate-180"
                )}
              />
            </Button>
          ) : (
            memberCount
          )}
        </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={cn(getTeamStatusStyle(t.status).className)}
        >
          {getTeamStatusStyle(t.status).label}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex gap-1">
          {onAddMembers && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => onAddMembers(t)}
              title="Add members"
            >
              <UserPlus className="size-4" />
            </Button>
          )}
          <Button variant="ghost" size="icon-sm" onClick={() => onEdit(t)}>
            <Pencil className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(t.id)}
            aria-label="Archive team"
          >
            <Archive className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
    {expanded && members.length > 0 && (
      <TableRow>
        <TableCell colSpan={6} className="bg-muted/30 p-0">
          <div className="px-4 py-3">
            <ul className="flex flex-wrap gap-2">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-sm"
                >
                  <GeneratedAvatar
                    size="sm"
                    src={getAvatarUrl(m.id)}
                    alt={
                      formatParticipantNameDisplay(m.name) || m.gameID || ""
                    }
                  />
                  <span className="truncate">
                    {(formatParticipantNameDisplay(m.name) || m.gameID) ?? m.id}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </TableCell>
      </TableRow>
    )}
  </>
  );
}
