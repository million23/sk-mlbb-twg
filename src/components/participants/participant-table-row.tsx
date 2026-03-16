import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TableCell,
  TableRow,
} from "@/components/ui/table";
import { getAvatarUrl } from "@/lib/avatar";
import type { Collections } from "@/types/pocketbase-types";
import { Pencil, Trash2, UserMinus } from "lucide-react";

type Participant = Collections["participants"] & { id: string };

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
  onEdit,
  onDelete,
  onRemoveFromTeam,
}: {
  participant: Participant;
  teamName: string;
  onEdit: (p: Participant) => void;
  onDelete: (id: string) => void;
  onRemoveFromTeam?: (p: Participant) => void;
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
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
