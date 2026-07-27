import { Badge } from "@/components/ui/badge";
import {
  ADMIN_ROLE_LABELS,
  type AdminRole,
} from "@/lib/admin/permissions";
import { cn } from "@/lib/utils";

const CLASSES: Record<AdminRole, string> = {
  superadmin: "border-primary/30 bg-primary/10 text-primary",
  staff: "border-border bg-muted/60 text-foreground",
};

export function AdminRoleBadge({
  role,
  className,
}: {
  role: AdminRole | string | undefined;
  className?: string;
}) {
  const key = (role === "superadmin" || role === "staff" ? role : "staff") as AdminRole;

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-7 rounded-full px-3 text-[0.7rem] tracking-wide uppercase",
        CLASSES[key],
        className,
      )}
    >
      {ADMIN_ROLE_LABELS[key]}
    </Badge>
  );
}
