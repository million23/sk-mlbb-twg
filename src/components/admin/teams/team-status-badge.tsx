import { Badge } from "@/components/ui/badge";
import type { TeamsRecordStatus } from "@/hooks/orval/model/teamsRecordStatus";
import { getTeamStatusStyle } from "@/lib/legacy/team-status";
import { cn } from "@/lib/utils";

export function TeamStatusBadge({
  status,
  className,
}: {
  status: TeamsRecordStatus | string | undefined;
  className?: string;
}) {
  const style = getTeamStatusStyle(
    status as Parameters<typeof getTeamStatusStyle>[0],
  );

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 rounded-full px-3 text-[0.7rem] tracking-wide uppercase",
        style.className,
        className,
      )}
    >
      {style.label}
    </Badge>
  );
}
