import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useTournaments } from "@/hooks/legacy/use-tournaments";
import { setActiveTournamentId } from "@/lib/admin/active-tournament";
import { tournamentLabel } from "@/lib/legacy/tournament-label";
import { useNavigate } from "@tanstack/react-router";

type AdminTournamentSelectorProps = {
  value?: string;
  onSelected?: () => void;
  className?: string;
};

export function AdminTournamentSelector({
  value = "",
  onSelected,
  className,
}: AdminTournamentSelectorProps) {
  const navigate = useNavigate();
  const { data: tournaments, isLoading, isError } = useTournaments();
  const items = (tournaments ?? []).filter((t) => Boolean(t.id));

  const selectTournament = (id: string | null) => {
    if (!id) return;
    setActiveTournamentId(id);
    onSelected?.();
    void navigate({
      to: "/app/tournaments/$tournamentId",
      params: { tournamentId: id },
    });
  };

  if (isLoading) {
    return <Skeleton className="h-9 w-full rounded-3xl" />;
  }

  if (isError) {
    return (
      <p className="px-1 text-destructive text-xs">
        Could not load tournaments.
      </p>
    );
  }

  if (items.length === 0) {
    return (
      <p className="px-1 text-muted-foreground text-xs text-pretty">
        No active tournaments yet. Add one under Tournaments.
      </p>
    );
  }

  return (
    <Select
      value={value || null}
      onValueChange={selectTournament}
    >
      <SelectTrigger
        className={className ?? "w-full min-w-0 max-w-full"}
        aria-label="Select tournament"
      >
        <SelectValue placeholder="Select tournament">
          {(selected) => {
            if (selected == null || selected === "") return null;
            const t = items.find((row) => row.id === selected);
            return t ? tournamentLabel(t) : String(selected);
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false} align="start" side="bottom">
        <SelectGroup>
          {items.map((t) => {
            const id = t.id;
            if (!id) return null;
            return (
              <SelectItem key={id} value={id}>
                <span className="truncate">{tournamentLabel(t)}</span>
              </SelectItem>
            );
          })}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

/** Prefer URL param, else a stored id that still exists in the active list. */
export function resolveAdminTournamentId(
  urlId: string | undefined,
  storedId: string,
  tournamentIds: string[],
): string {
  if (urlId) return urlId;
  if (storedId && tournamentIds.includes(storedId)) return storedId;
  return "";
}
