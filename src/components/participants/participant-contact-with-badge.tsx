import { NetworkProviderBadge } from "@/lib/mobile-network-provider";
import { sanitizePhilippineMobileInput } from "@/lib/philippine-mobile";
import { cn } from "@/lib/utils";

export function ParticipantContactWithBadge({
  contactNumber,
  className,
}: {
  contactNumber?: string;
  className?: string;
}) {
  const formatted = sanitizePhilippineMobileInput(contactNumber ?? "");
  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <span className="tabular-nums truncate">{formatted ?? "-"}</span>
      {formatted ? <NetworkProviderBadge phone={formatted} /> : null}
    </div>
  );
}
