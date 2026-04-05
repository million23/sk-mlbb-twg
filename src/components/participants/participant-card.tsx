import { ParticipantContactWithBadge } from "@/components/participants/participant-contact-with-badge";
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
import { getAvatarUrl } from "@/lib/avatar";
import { effectiveParticipantStatus } from "@/lib/participant-display-status";
import { RegisteredDateCell } from "@/components/ui/registered-date-cell";
import { cn, formatParticipantNameDisplay } from "@/lib/utils";
import type { Collections } from "@/types/pocketbase-types";
import { PreferredLaneIcons } from "@/components/participants/preferred-lane-icons";
import {
  Archive,
  Cake,
  Clock,
  Gamepad2,
  MapPin,
  Pencil,
  Phone,
  Plus,
  UserCircle2,
  UserMinus,
  Users,
} from "lucide-react";
import { StatusBadge } from "./status-badge";

type Participant = Collections["participants"] & { id: string };

type TeamSuggestion = {
  suggestedTeamId?: string;
  suggestedTeamName?: string;
  suggestionPriority?: string;
};

function InfoRow({
  icon: Icon,
  value,
  valueClassName,
  children,
}: {
  icon: React.ElementType;
  value?: string;
  valueClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      {children ?? (
        <span className={cn("truncate", valueClassName)}>{value || "-"}</span>
      )}
    </div>
  );
}

export function ParticipantCard({
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
  teams?: (Collections["teams"] & { id: string })[];
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
    <Card className="overflow-hidden transition-shadow hover:shadow-md h-fit borderpi">
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
                <span className="font-mono tabular-nums">
                  {p.gameID ?? "-"}
                </span>
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
        <InfoRow icon={Clock}>
          <RegisteredDateCell
            created={p.created}
            announceLabel
            className="min-w-0 truncate"
          />
        </InfoRow>
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
        <div className="flex items-center gap-2 text-sm min-w-0">
          <Gamepad2 className="size-4 shrink-0 text-muted-foreground self-start mt-0.5" />
          <PreferredLaneIcons roles={p.preferredRoles} className="min-w-0 flex-wrap" />
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex items-center gap-1.5">
            <UserCircle2 className="size-4 shrink-0 text-muted-foreground" />
            <StatusBadge status={displayStatus} className="font-normal" />
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
                  className="flex min-w-0 max-w-full flex-col gap-0.5 rounded-md border bg-muted/30 px-2 py-1.5 text-sm"
                >
                  <div className="flex items-center gap-1">
                    <span className="truncate max-w-[10rem]">
                      {s.suggestedTeamName ?? "-"}
                    </span>
                    {s.suggestedTeamId && onJoinTeam && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 shrink-0 gap-1 px-1.5 text-xs"
                        onClick={() => onJoinTeam(p.id, s.suggestedTeamId ?? "")}
                      >
                        <Plus className="size-3" />
                        Join
                      </Button>
                    )}
                  </div>
                  {s.suggestionPriority ? (
                    <span className="text-xs text-muted-foreground line-clamp-2">
                      {s.suggestionPriority}
                    </span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
