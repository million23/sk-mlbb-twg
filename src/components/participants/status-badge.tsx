import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type ParticipantStatus = "unassigned" | "suggested" | "assigned" | "inactive";

const STATUS_LABELS: Record<ParticipantStatus, string> = {
  assigned: "Assigned",
  unassigned: "Unassigned",
  suggested: "Suggested",
  inactive: "Inactive",
};

const STATUS_CLASSES: Record<ParticipantStatus, string> = {
  assigned:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  unassigned:
    "border-muted-foreground/25 bg-muted/50 text-muted-foreground",
  suggested:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  inactive:
    "border-destructive/30 bg-destructive/10 text-destructive",
};

export function StatusBadge({
  status,
  className,
}: {
  status: ParticipantStatus;
  className?: string;
}) {
  const statusKey = status in STATUS_CLASSES ? status : "unassigned";
  return (
    <Badge
      variant="outline"
      className={cn(STATUS_CLASSES[statusKey as ParticipantStatus], className)}
    >
      {STATUS_LABELS[statusKey as ParticipantStatus]}
    </Badge>
  );
}
