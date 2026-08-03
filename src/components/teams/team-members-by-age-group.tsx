import { GeneratedAvatar } from "@/components/ui/avatar";
import { getAvatarUrl } from "@/lib/legacy/avatar";
import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import { cn } from "@/lib/utils";

export type TeamMemberWithBirthdate = {
  id: string;
  name?: string;
  gameID?: string;
  birthdate?: string;
};

/** Flat roster list (age brackets are not used). */
export function TeamMembersByAgeGroup({
  members,
  className,
}: {
  members: TeamMemberWithBirthdate[];
  className?: string;
}) {
  if (members.length === 0) return null;

  return (
    <ul className={cn("flex flex-col gap-1.5", className)}>
      {members.map((m) => (
        <li
          key={m.id}
          className="flex items-center gap-2 rounded-md border px-2 py-1.5 text-sm"
        >
          <GeneratedAvatar
            size="sm"
            src={getAvatarUrl(m.id)}
            alt={formatParticipantNameDisplay(m.name) || m.gameID || ""}
          />
          <span className="truncate">
            {(formatParticipantNameDisplay(m.name) || m.gameID) ?? m.id}
          </span>
        </li>
      ))}
    </ul>
  );
}
