import type { Collections } from "@/types/pocketbase-types";

export type TeamStatus = Collections["teams"]["status"];

const STATUS_STYLES: Record<
  NonNullable<TeamStatus>,
  { className: string; label: string }
> = {
  forming: {
    className:
      "border-amber-500/50 bg-amber-500/10 text-amber-700 dark:text-amber-400 dark:bg-amber-500/20",
    label: "Forming",
  },
  ready: {
    className:
      "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 dark:bg-emerald-500/20",
    label: "Ready",
  },
  incomplete: {
    className:
      "border-orange-500/50 bg-orange-500/10 text-orange-700 dark:text-orange-400 dark:bg-orange-500/20",
    label: "Incomplete",
  },
  inactive: {
    className: "border-muted bg-muted/50 text-muted-foreground",
    label: "Inactive",
  },
};

export function getTeamStatusStyle(
  status: TeamStatus | undefined
): { className: string; label: string } {
  const s = status ?? "forming";
  return STATUS_STYLES[s] ?? STATUS_STYLES.forming;
}
