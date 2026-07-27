import { Badge } from "@/components/ui/badge";
import type { TournamentsRecordStatus } from "@/hooks/orval/model/tournamentsRecordStatus";
import { getTournamentStatusLabel } from "@/lib/legacy/tournament-status";
import { cn } from "@/lib/utils";

const CLASSES: Record<TournamentsRecordStatus, string> = {
  draft: "border-muted-foreground/30 bg-muted text-muted-foreground",
  upcoming: "border-primary/30 bg-primary/10 text-primary",
  live: "border-success/30 bg-success/10 text-success",
  completed: "border-border bg-muted/60 text-foreground",
  archived: "border-muted-foreground/20 bg-muted text-muted-foreground",
};

export function TournamentStatusBadge({
  status,
  className,
}: {
  status: TournamentsRecordStatus | string | undefined;
  className?: string;
}) {
  const key = (
    status && status in CLASSES ? status : "draft"
  ) as TournamentsRecordStatus;

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 rounded-full px-3 text-[0.7rem] tracking-wide uppercase",
        CLASSES[key],
        className,
      )}
    >
      {getTournamentStatusLabel(key)}
    </Badge>
  );
}
