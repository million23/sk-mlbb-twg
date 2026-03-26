import { GeneratedAvatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TeamMembersByAgeGroup } from "@/components/teams/team-members-by-age-group";
import { summarizeTeamAgeBracketCounts } from "@/lib/age";
import { cn } from "@/lib/utils";
import { getTeamAvatarUrl } from "@/lib/avatar";
import { getTeamStatusStyle } from "@/lib/team-status";
import type { Collections } from "@/types/pocketbase-types";
import {
  CalendarDays,
  ChevronDown,
  Pencil,
  Archive,
  UserCircle2,
  UserPlus,
  Users,
} from "lucide-react";

type Team = Collections["teams"] & { id: string };

type TeamMember = { id: string; name?: string; gameID?: string; birthdate?: string };

function InfoRow({
  icon: Icon,
  value,
}: {
  icon: React.ElementType;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{value ?? "-"}</span>
    </div>
  );
}

export function TeamCard({
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
  return (
    <Card className="overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <GeneratedAvatar
              size="lg"
              className="shrink-0"
              src={getTeamAvatarUrl(t.id)}
              alt={t.name ?? ""}
            />
            <div className="min-w-0 flex-1">
              <CardTitle className="text-base truncate">{t.name ?? "-"}</CardTitle>
              <CardDescription className="mt-0.5">
                <Badge
                  variant="outline"
                  className={cn(
                    "font-normal",
                    getTeamStatusStyle(t.status).className
                  )}
                >
                  {getTeamStatusStyle(t.status).label}
                </Badge>
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-0.5 shrink-0">
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
        </div>
      </CardHeader>
      <CardContent className="space-y-2.5 pt-0">
        <InfoRow icon={UserCircle2} value={captainName} />
        <InfoRow icon={Users} value={`${memberCount} member${memberCount !== 1 ? "s" : ""}`} />
        {members.length > 0 && (
          <InfoRow
            icon={CalendarDays}
            value={summarizeTeamAgeBracketCounts(members)}
          />
        )}
        {members.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger
              render={
                <Button
                  variant="ghost"
                  size="sm"
                  className="group/members w-full justify-between -ml-2"
                >
                  View members
                  <ChevronDown className="size-4 shrink-0 transition-transform group-aria-expanded/members:rotate-180" />
                </Button>
              }
            />
            <CollapsibleContent>
              <div className="mt-2 pl-1">
                <TeamMembersByAgeGroup members={members} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        {onAddMembers && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-2"
            onClick={() => onAddMembers(t)}
          >
            <UserPlus className="size-4" />
            Add members
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
