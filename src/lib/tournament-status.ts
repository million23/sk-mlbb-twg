import type { Collections } from "@/types/pocketbase-types";

export type TournamentStatus = NonNullable<
  Collections["tournaments"]["status"]
>;

export const TOURNAMENT_STATUS_OPTIONS: {
  value: TournamentStatus;
  label: string;
}[] = [
  { value: "draft", label: "Draft" },
  { value: "upcoming", label: "Upcoming" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "archived", label: "Archived" },
];

export function getTournamentStatusLabel(
  status: Collections["tournaments"]["status"] | undefined
): string {
  const key = status ?? "draft";
  return (
    TOURNAMENT_STATUS_OPTIONS.find((o) => o.value === key)?.label ?? key
  );
}
