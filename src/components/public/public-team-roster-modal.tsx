import { LaneRoleIcon } from "@/components/participants/preferred-lane-icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useParticipants } from "@/hooks/use-participants";
import { useTeams } from "@/hooks/use-teams";
import { getAvatarUrl, getRosterCardBackgroundDataUri } from "@/lib/avatar";
import { LANE_ROLE_LABELS } from "@/lib/lane-role-icons";
import { cn } from "@/lib/utils";
import type { PlayerRole } from "@/types/pocketbase-types";
import { UsersRound } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type PublicTeamRosterContextValue = {
  openTeamRoster: (teamId: string) => void;
  closeTeamRoster: () => void;
};

const PublicTeamRosterContext = createContext<PublicTeamRosterContextValue | null>(
  null,
);

function normalizedRoles(roles: PlayerRole[] | undefined) {
  return (roles?.filter(Boolean) ?? []).filter(
    (r): r is PlayerRole => Object.hasOwn(LANE_ROLE_LABELS, r),
  );
}

export function usePublicTeamRosterModal(): PublicTeamRosterContextValue {
  const ctx = useContext(PublicTeamRosterContext);
  if (!ctx) {
    throw new Error(
      "usePublicTeamRosterModal must be used within PublicTeamRosterModalProvider",
    );
  }
  return ctx;
}

export function PublicTeamRosterModalProvider({ children }: { children: ReactNode }) {
  const [teamId, setTeamId] = useState<string | null>(null);
  const { data: teams } = useTeams();
  const { data: participants } = useParticipants();

  const openTeamRoster = useCallback((id: string) => {
    setTeamId(id);
  }, []);

  const closeTeamRoster = useCallback(() => {
    setTeamId(null);
  }, []);

  const team = useMemo(
    () => teams?.find((t) => t.id === teamId) ?? null,
    [teams, teamId],
  );

  const roster = useMemo(() => {
    if (!teamId) return [];
    const rows = (participants ?? []).filter(
      (p) => p.team === teamId && p.archived !== true,
    );
    return [...rows].sort((a, b) =>
      (a.name ?? "").localeCompare(b.name ?? "", undefined, {
        sensitivity: "base",
      }),
    );
  }, [participants, teamId]);

  const teamTitle = team?.name?.trim() || "Squad";

  const onOpenChange = (open: boolean) => {
    if (!open) setTeamId(null);
  };

  const contextValue = useMemo(
    () => ({ openTeamRoster, closeTeamRoster }),
    [openTeamRoster, closeTeamRoster],
  );

  return (
    <PublicTeamRosterContext.Provider value={contextValue}>
      {children}
      <Dialog open={teamId !== null} onOpenChange={onOpenChange}>
        <DialogContent
          showCloseButton
          className={cn(
            "fixed inset-0 z-50 box-border flex h-dvh max-h-dvh min-h-0 w-full min-w-0 translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none border-0 bg-background p-0 shadow-none ring-0 max-w-none! sm:rounded-none",
            "data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
          )}
        >
          <DialogHeader className="w-full min-w-0 shrink-0 space-y-1 border-b border-border/80 bg-card/40 px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
                <UsersRound className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 space-y-1 pr-10 text-left">
                <DialogTitle className="font-serif text-2xl leading-tight sm:text-3xl">
                  {teamTitle}
                </DialogTitle>
                <DialogDescription className="text-left text-muted-foreground text-sm">
                  Public roster — preferred lanes only. {roster.length} player
                  {roster.length === 1 ? "" : "s"}.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-muted/15">
            {roster.length === 0 ? (
              <div className="flex flex-1 items-center justify-center px-4">
                <p className="text-center text-muted-foreground text-sm">
                  No players assigned to this squad yet.
                </p>
              </div>
            ) : (
              <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col self-stretch overflow-y-auto overflow-x-hidden overscroll-y-contain md:block md:h-full md:overflow-x-auto md:overflow-y-hidden md:overscroll-x-contain md:snap-x md:snap-mandatory">
                <ul
                  className={cn(
                    "box-border flex min-h-0 w-full min-w-0 max-w-full flex-1 flex-col items-stretch gap-2 px-2 py-2 sm:px-3 sm:py-3",
                    "md:grid md:h-full md:min-h-0 md:flex-none md:auto-rows-fr md:items-stretch md:gap-px",
                    roster.length > 10 ? "md:w-max md:min-w-full" : "md:w-full",
                  )}
                  style={{
                    gridTemplateColumns:
                      roster.length > 10
                        ? `repeat(${roster.length}, minmax(11rem, 11rem))`
                        : `repeat(${roster.length}, minmax(0, 1fr))`,
                  }}
                >
                  {roster.map((p) => {
                    const roles = p.preferredRoles?.filter(Boolean) as
                      | PlayerRole[]
                      | undefined;
                    const laneList = normalizedRoles(roles);
                    const bgUri = getRosterCardBackgroundDataUri(p.id);
                    const faceUri = getAvatarUrl(p.id);
                    return (
                      <li
                        key={p.id}
                        className="flex min-h-14 w-full min-w-0 max-w-full flex-1 basis-0 self-stretch md:h-full md:min-h-0 md:min-w-0 md:flex-none md:basis-auto md:snap-start"
                      >
                        <div
                          className={cn(
                            "relative flex h-full min-h-0 w-full max-w-full flex-col overflow-hidden rounded-xl border border-border/70 shadow-sm ring-1 ring-border/40",
                          )}
                          style={{
                            backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.32), rgba(0,0,0,0.82)), url("${bgUri}")`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        >
                          <div className="relative z-10 flex shrink-0 flex-row flex-wrap items-baseline gap-x-2 gap-y-0 border-b border-white/10 bg-background/75 px-3 py-2 backdrop-blur-sm md:flex-col md:items-center md:gap-x-0 md:gap-y-1 md:py-3">
                            <p className="min-w-0 flex-1 text-left font-semibold text-foreground text-xs uppercase leading-snug tracking-wide line-clamp-2 md:line-clamp-4 md:flex-none md:text-center sm:text-sm">
                              {p.name?.trim() || "Unnamed"}
                            </p>
                          </div>
                          <div className="relative z-20 flex min-h-0 flex-1 items-center justify-center px-2 py-2 md:py-4">
                            <div className="aspect-square size-20 shrink-0 overflow-hidden rounded-full border-2 border-primary/40 bg-card/90 p-0.5 shadow-md ring-2 ring-background/80 sm:size-24 sm:p-1 md:size-28">
                              <img
                                src={faceUri}
                                alt=""
                                width={112}
                                height={112}
                                className="pointer-events-none size-full rounded-full object-contain object-center select-none"
                                draggable={false}
                                decoding="async"
                                aria-hidden
                              />
                            </div>
                          </div>
                          <div className="relative z-10 flex shrink-0 flex-col items-center justify-center border-t border-white/10 bg-background/80 px-3 py-3 backdrop-blur-sm md:min-h-36 md:justify-center md:px-3 md:py-3">
                            {laneList.length ? (
                              <div className="-mx-1 w-full overflow-x-auto overflow-y-hidden overscroll-x-contain px-1 [-ms-overflow-style:none] [scrollbar-width:none] md:mx-0 md:flex md:min-h-0 md:flex-1 md:flex-col md:items-center md:justify-center md:overflow-visible md:px-0 [&::-webkit-scrollbar]:hidden">
                                <div className="mx-auto flex w-max min-w-full flex-row flex-nowrap items-center justify-center gap-2 py-0.5 md:mx-0 md:min-h-0 md:w-full md:max-w-full md:flex-col md:items-center md:justify-center md:gap-2 md:py-0">
                                  {laneList.map((r) => (
                                    <span
                                      key={r}
                                      className="grid shrink-0 grid-cols-[2.25rem_minmax(0,6.75rem)] items-center gap-x-2 md:mx-auto md:w-full md:max-w-44 md:shrink md:grid-cols-[2.25rem_minmax(0,1fr)]"
                                    >
                                      <span className="flex w-full shrink-0 items-center justify-center md:items-center md:justify-center">
                                        <LaneRoleIcon
                                          role={r}
                                          className="size-5 shrink-0 md:size-5"
                                        />
                                      </span>
                                      <span className="min-w-0 text-balance text-left text-foreground/95 text-xs font-medium leading-snug md:text-center">
                                        {LANE_ROLE_LABELS[r]}
                                      </span>
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-center text-muted-foreground text-xs md:w-full md:text-center">
                                No lanes set
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </PublicTeamRosterContext.Provider>
  );
}
