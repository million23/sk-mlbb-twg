import { GeneratedAvatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatBirthdateDisplay, getAge } from "@/lib/age";
import { cn, formatParticipantNameDisplay } from "@/lib/utils";
import { ParticipantContactWithBadge } from "@/components/participants/participant-contact-with-badge";
import { StatusBadge } from "./status-badge";
import { getAvatarUrl } from "@/lib/avatar";
import type { Collections, PlayerRole } from "@/types/pocketbase-types";
import {
  Archive,
  Cake,
  Gamepad2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  UserMinus,
  Users,
  UserCircle2,
} from "lucide-react";

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

function InfoRow({
  icon: Icon,
  value,
  valueClassName,
}: {
  icon: React.ElementType;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className={cn("truncate", valueClassName)}>{value || "-"}</span>
    </div>
  );
}

export function ParticipantCard({
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
  const age = getAge(p.birthdate);
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <GeneratedAvatar
              size="lg"
              className="shrink-0"
              src={getAvatarUrl(p.id)}
              alt={formatParticipantNameDisplay(p.name) || p.gameID || ""}
            />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">
                {formatParticipantNameDisplay(p.name) || p.gameID || "-"}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                ID{" "}
                <span className="font-mono tabular-nums">{p.gameID ?? "-"}</span>
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0">
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
              aria-label="Archive participant"
            >
              <Archive className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <div className="flex items-center gap-2 text-sm min-w-0">
          <Phone className="size-4 shrink-0 text-muted-foreground" />
          <ParticipantContactWithBadge
            contactNumber={p.contactNumber}
            className="min-w-0 flex-1"
          />
        </div>
        <InfoRow icon={MapPin} value={p.area ?? ""} />
        <div className="flex items-center gap-2 text-sm">
          <Cake className="size-4 shrink-0 text-muted-foreground" />
          <span className="tabular-nums">
            {formatBirthdateDisplay(p.birthdate) ?? "-"}
            {age !== null && (
              <span className="text-muted-foreground ml-1.5">({age} yrs)</span>
            )}
          </span>
        </div>
        <InfoRow
          icon={Gamepad2}
          value={formatPreferredRoles(p.preferredRoles)}
        />
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <UserCircle2 className="size-4 shrink-0 text-muted-foreground" />
            <StatusBadge status={p.status ?? "unassigned"} className="font-normal" />
          </div>
          <div className="flex items-center gap-1.5">
            {p.team && onRemoveFromTeam && (
              <Button
                variant="ghost"
                size="icon-sm"
                className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                onClick={() => onRemoveFromTeam(p)}
                aria-label="Remove from team"
              >
                <UserMinus className="size-3.5" />
              </Button>
            )}
            <Users className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-sm">{teamName}</span>
          </div>
        </div>
        {!p.team && suggestions.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t">
            <p className="text-xs font-medium text-muted-foreground">
              Suggested teams
            </p>
            <div className="flex flex-wrap gap-1.5">
              {suggestions.slice(0, 3).map((s) => (
                <div
                  key={s.suggestedTeamId}
                  className="flex items-center gap-1 rounded-md border bg-muted/30 px-2 py-1 text-sm"
                >
                  <span className="truncate max-w-24">
                    {s.suggestedTeamName ?? "-"}
                  </span>
                  {s.suggestedTeamId && onJoinTeam && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 gap-1 px-1.5 text-xs"
                      onClick={() => onJoinTeam(p.id, s.suggestedTeamId ?? "")}
                    >
                      <Plus className="size-3" />
                      Join
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
