import { cn } from "@/lib/utils";
import { sanitizePhilippineMobileInput } from "@/lib/philippine-mobile";
import { NetworkProviderBadge } from "@/lib/mobile-network-provider";

export function ParticipantContactWithBadge({
  contactNumber,
  className,
}: {
  contactNumber?: string;
  className?: string;
}) {
  const raw = contactNumber ?? "";
  const formatted = sanitizePhilippineMobileInput(raw);
  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <span className="tabular-nums truncate">{formatted || "-"}</span>
      {formatted ? <NetworkProviderBadge phone={raw} /> : null}
    </div>
  );
}
