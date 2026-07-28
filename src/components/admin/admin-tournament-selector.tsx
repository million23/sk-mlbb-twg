import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
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
  const itemIds = items.map((t) => t.id).filter((id): id is string => Boolean(id));

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
    <Combobox
      items={itemIds}
      value={value || null}
      onValueChange={selectTournament}
      itemToStringLabel={(id: string) => {
        const t = items.find((row) => row.id === id);
        return t ? tournamentLabel(t) : "";
      }}
      filter={(itemId, query) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        const t = items.find((row) => row.id === itemId);
        if (!t) return false;
        const label = tournamentLabel(t).toLowerCase();
        const slug = t.slug?.trim().toLowerCase() ?? "";
        const rawTitle = t.title?.trim().toLowerCase() ?? "";
        return label.includes(q) || slug.includes(q) || rawTitle.includes(q);
      }}
    >
      <ComboboxInput
        className={className ?? "w-full min-w-0 max-w-full"}
        placeholder="Search tournaments…"
        aria-label="Select tournament"
      />
      <ComboboxContent align="start" side="bottom">
        <ComboboxList>
          {(id: string) => {
            const t = items.find((row) => row.id === id);
            if (!t) return null;
            return (
              <ComboboxItem key={id} value={id}>
                <span className="flex w-full min-w-0 flex-col gap-0.5 text-left">
                  <span className="truncate font-medium">
                    {tournamentLabel(t)}
                  </span>
                  {t.status ? (
                    <span className="truncate text-xs text-muted-foreground capitalize">
                      {t.status}
                    </span>
                  ) : null}
                </span>
              </ComboboxItem>
            );
          }}
        </ComboboxList>
        <ComboboxEmpty>No tournaments match your search.</ComboboxEmpty>
      </ComboboxContent>
    </Combobox>
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
