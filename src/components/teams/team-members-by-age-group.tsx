import { GeneratedAvatar } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/avatar";
import { groupParticipantsByTournamentAge } from "@/lib/age";
import { cn, formatParticipantNameDisplay } from "@/lib/utils";

export type TeamMemberWithBirthdate = {
  id: string;
  name?: string;
  gameID?: string;
  birthdate?: string;
};

export function TeamMembersByAgeGroup({
  members,
  className,
}: {
  members: TeamMemberWithBirthdate[];
  className?: string;
}) {
  const groups = groupParticipantsByTournamentAge(members);
  if (groups.length === 0) return null;

  return (
    <div className={cn("space-y-4", className)}>
      {groups.map((g) => (
        <div key={g.key} className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground">{g.label}</p>
          <ul className="space-y-1.5">
            {g.items.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
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
      ))}
    </div>
  );
}
