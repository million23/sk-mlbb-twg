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
import {
  MapPin,
  Pencil,
  Phone,
  Trash2,
  UserMinus,
  Users,
  UserCircle2,
} from "lucide-react";

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

function InfoRow({
  icon: Icon,
  value,
}: {
  icon: React.ElementType;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{value || "-"}</span>
    </div>
  );
}

export function ParticipantCard({
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
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar size="lg" className="shrink-0">
              <AvatarImage src={getAvatarUrl(p.id)} alt={p.name} />
              <AvatarFallback>{getInitials(p.name, p.gameID)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">{p.name ?? "-"}</CardTitle>
              <CardDescription className="font-mono text-xs mt-0.5">
                ID {p.gameID ?? "-"}
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0">
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
      <CardContent className="space-y-2.5 pt-0">
        <InfoRow icon={Phone} value={p.contactNumber ?? ""} />
        <InfoRow icon={MapPin} value={p.area ?? ""} />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <UserCircle2 className="size-4 shrink-0 text-muted-foreground" />
            <Badge variant="outline" className="font-normal">
              {p.status ?? "unassigned"}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm">{teamName}</span>
            {p.team && onRemoveFromTeam && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-6 text-muted-foreground hover:text-destructive"
                onClick={() => onRemoveFromTeam(p)}
                aria-label="Remove from team"
              >
                <UserMinus className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
