import { TeamStatusBadge } from "@/components/admin/teams/team-status-badge";
import { PreferredLaneIcons } from "@/components/participants/preferred-lane-icons";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";
import {
  groupParticipantsByTournamentAge,
  summarizeTeamAgeBracketCounts,
} from "@/lib/legacy/age";
import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import type { PlayerRole } from "@/types/__pocketbase-types";
import { format, isValid, parseISO } from "date-fns";
import { Archive, Pencil, UserMinus, UserPlus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

function formatWhen(iso?: string) {
  if (!iso) return "—";
  const d = parseISO(iso);
  if (!isValid(d)) return "—";
  return format(d, "MMM d, yyyy · h:mm a");
}

function laneRoles(p: ParticipantsRecord): PlayerRole[] {
  const roles = p.preferred_roles?.length
    ? p.preferred_roles
    : p.preferred_lane
      ? [p.preferred_lane]
      : [];
  return roles as PlayerRole[];
}

export function TeamDetailSheet({
  team,
  members,
  open,
  onOpenChange,
  archivePending,
  removePending,
  onEdit,
  onAddMembers,
  onRemoveMember,
  onArchive,
}: {
  team: TeamsRecord | null;
  members: ParticipantsRecord[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  archivePending?: boolean;
  removePending?: boolean;
  onEdit: () => void;
  onAddMembers: () => void;
  onRemoveMember: (participantId: string) => Promise<void> | void;
  onArchive: () => Promise<void> | void;
}) {
  const [display, setDisplay] = useState<TeamsRecord | null>(team);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (team) setDisplay(team);
  }, [team]);

  const ageGroups = useMemo(
    () => groupParticipantsByTournamentAge(members),
    [members],
  );
  const ageSummary = summarizeTeamAgeBracketCounts(members);
  const captain = members.find((m) => m.id === display?.captain);

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
          <SheetHeader className="border-border/70 border-b pb-4">
            <SheetTitle className="pr-8 font-heading text-xl">
              {display?.name?.trim() || "Team"}
            </SheetTitle>
            <SheetDescription className="flex flex-wrap items-center gap-2">
              <TeamStatusBadge status={display?.status} />
              <span className="text-muted-foreground text-xs">
                {members.length} member{members.length === 1 ? "" : "s"}
              </span>
            </SheetDescription>
          </SheetHeader>

          <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4">
            <dl className="grid gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground text-xs">Captain</dt>
                <dd className="mt-0.5">
                  {captain
                    ? formatParticipantNameDisplay(captain.name) || captain.ign
                    : "No captain"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs">Registered</dt>
                <dd className="mt-0.5">{formatWhen(display?.created)}</dd>
              </div>
              {ageSummary ? (
                <div>
                  <dt className="text-muted-foreground text-xs">Age mix</dt>
                  <dd className="mt-0.5 text-pretty">{ageSummary}</dd>
                </div>
              ) : null}
            </dl>

            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.18em]">
                  Roster
                </h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onAddMembers}
                >
                  <UserPlus className="size-3.5" />
                  Add
                </Button>
              </div>

              {members.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No members yet. Add unassigned players or use Quick team.
                </p>
              ) : (
                ageGroups.map((group) => (
                  <div key={group.key} className="space-y-1.5">
                    <p className="text-muted-foreground text-xs">{group.label}</p>
                    <ul className="space-y-1.5">
                      {group.items.map((p) =>
                        p.id ? (
                          <li
                            key={p.id}
                            className="flex items-center gap-2 rounded-xl border border-border/70 bg-background/60 px-3 py-2"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-sm">
                                {formatParticipantNameDisplay(p.name)}
                                {p.id === display?.captain ? (
                                  <span className="ml-1.5 font-mono text-[0.65rem] text-primary uppercase tracking-wider">
                                    Captain
                                  </span>
                                ) : null}
                              </p>
                              <p className="truncate font-mono text-muted-foreground text-xs">
                                {p.ign}
                              </p>
                            </div>
                            <PreferredLaneIcons roles={laneRoles(p)} />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              className="text-destructive hover:text-destructive"
                              disabled={removePending && removingId === p.id}
                              aria-label="Remove from team"
                              onClick={() => {
                                setRemovingId(p.id!);
                                void Promise.resolve(onRemoveMember(p.id!)).finally(
                                  () => setRemovingId(null),
                                );
                              }}
                            >
                              <UserMinus className="size-3.5" />
                            </Button>
                          </li>
                        ) : null,
                      )}
                    </ul>
                  </div>
                ))
              )}
            </section>
          </div>

          <SheetFooter className="border-border/70 border-t sm:flex-row">
            <Button type="button" variant="outline" onClick={onEdit}>
              <Pencil className="size-3.5" />
              Edit
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setArchiveOpen(true)}
              disabled={archivePending}
            >
              <Archive className="size-3.5" />
              Archive
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this team?</AlertDialogTitle>
            <AlertDialogDescription>
              Members will be unassigned and the team moves to Archived. You can
              restore it later (members stay unassigned).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setArchiveOpen(false);
                void onArchive();
              }}
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
