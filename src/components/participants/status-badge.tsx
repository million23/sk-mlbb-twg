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
  assigned: "border-success/30 bg-success/10 text-success",
  unassigned:
    "border-muted-foreground/25 bg-muted/50 text-muted-foreground",
  suggested: "border-warning/30 bg-warning/10 text-warning",
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
