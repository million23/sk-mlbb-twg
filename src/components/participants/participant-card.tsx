import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAvatarUrl } from "@/lib/avatar";
import type { Collections } from "@/types/pocketbase-types";
import { Pencil, Trash2 } from "lucide-react";

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

export function ParticipantCard({
  participant,
  teamName,
  onEdit,
  onDelete,
}: {
  participant: Participant;
  teamName: string;
  onEdit: (p: Participant) => void;
  onDelete: (id: string) => void;
}) {
  const p = participant;
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage src={getAvatarUrl(p.id)} alt={p.name} />
              <AvatarFallback>{getInitials(p.name, p.gameID)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{p.name ?? "-"}</CardTitle>
              <CardDescription className="font-mono text-xs">
                {p.gameID ?? "-"}
              </CardDescription>
            </div>
          </div>
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
        </div>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">Contact:</span>{" "}
          {p.contactNumber ?? "-"}
        </p>
        <p>
          <span className="text-muted-foreground">Area:</span> {p.area ?? "-"}
        </p>
        <div className="flex items-center gap-2 pt-2">
          <Badge variant="outline">{p.status ?? "unassigned"}</Badge>
          <span className="text-muted-foreground">·</span>
          <span>Team: {teamName}</span>
        </div>
      </CardContent>
    </Card>
  );
}
