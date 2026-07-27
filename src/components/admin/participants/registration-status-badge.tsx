import { Badge } from "@/components/ui/badge";
import type { ParticipantsRecordRegistrationStatus } from "@/hooks/orval/model/participantsRecordRegistrationStatus";
import { cn } from "@/lib/utils";

const LABELS: Record<ParticipantsRecordRegistrationStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

const CLASSES: Record<ParticipantsRecordRegistrationStatus, string> = {
  pending: "border-warning/30 bg-warning/10 text-warning",
  approved: "border-success/30 bg-success/10 text-success",
  rejected: "border-destructive/30 bg-destructive/10 text-destructive",
};

export function RegistrationStatusBadge({
  status,
  className,
}: {
  status: ParticipantsRecordRegistrationStatus | string | undefined;
  className?: string;
}) {
  const key = (
    status && status in LABELS ? status : "pending"
  ) as ParticipantsRecordRegistrationStatus;

  return (
    <Badge variant="outline" className={cn(CLASSES[key], className)}>
      {LABELS[key]}
    </Badge>
  );
}
