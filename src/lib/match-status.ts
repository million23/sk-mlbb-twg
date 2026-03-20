import type { Collections } from "@/types/pocketbase-types";

export type MatchStatusValue = NonNullable<Collections["matches"]["status"]>;

const STYLES: Record<
  MatchStatusValue,
  { className: string; label: string }
> = {
  scheduled: {
    className:
      "border-muted-foreground/30 bg-muted/40 text-muted-foreground",
    label: "Scheduled",
  },
  live: {
    className:
      "border-primary/40 bg-primary/15 text-primary dark:text-primary",
    label: "Live",
  },
  completed: {
    className:
      "border-emerald-500/50 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
    label: "Completed",
  },
  walkover: {
    className:
      "border-amber-500/50 bg-amber-500/10 text-amber-800 dark:text-amber-400",
    label: "Walkover",
  },
  cancelled: {
    className: "border-destructive/40 bg-destructive/10 text-destructive",
    label: "Cancelled",
  },
};

export function getMatchStatusStyle(
  status: Collections["matches"]["status"] | undefined
): { className: string; label: string } {
  const key = status ?? "scheduled";
  return STYLES[key] ?? STYLES.scheduled;
}
