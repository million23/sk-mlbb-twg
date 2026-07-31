import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import {
  openMatchingPool,
  planAutoOpenTeams,
  type AutoOpenTeamsPlan,
} from "@/lib/admin/auto-open-teams";
import { LANE_ROLE_LABELS } from "@/lib/legacy/lane-role-icons";
import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import type { PlayerRole } from "@/types/__pocketbase-types";
import { Shuffle, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function laneLabel(p: ParticipantsRecord): string {
  const lane = (p.preferred_lane || p.preferred_roles?.[0] || "") as PlayerRole;
  return (LANE_ROLE_LABELS[lane] ?? lane) || "—";
}

function memberLabel(p: ParticipantsRecord | undefined, id: string): string {
  if (!p) return id;
  return formatParticipantNameDisplay(p.name) || p.ign || id;
}

export type AutoOpenTeamsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  participants: ParticipantsRecord[];
  existingTeamNames: string[];
  pending?: boolean;
  onConfirm: (plan: AutoOpenTeamsPlan) => Promise<void> | void;
};

export function AutoOpenTeamsDialog({
  open,
  onOpenChange,
  participants,
  existingTeamNames,
  pending,
  onConfirm,
}: AutoOpenTeamsDialogProps) {
  const pool = useMemo(
    () => openMatchingPool(participants),
    [participants],
  );
  const byId = useMemo(() => {
    const map = new Map<string, ParticipantsRecord>();
    for (const p of pool) map.set(p.id, p);
    return map;
  }, [pool]);

  const [plan, setPlan] = useState<AutoOpenTeamsPlan | null>(null);

  useEffect(() => {
    if (!open) {
      setPlan(null);
      return;
    }
    setPlan(
      planAutoOpenTeams(pool, {
        existingTeamNames,
        shuffle: true,
      }),
    );
  }, [open, pool, existingTeamNames]);

  const rebuild = (announce: boolean) => {
    const next = planAutoOpenTeams(pool, {
      existingTeamNames,
      shuffle: true,
    });
    setPlan(next);
    if (!announce) return;
    if (next.teams.length === 0) {
      toast.message(
        pool.length < 5
          ? "Need at least 5 approved open-matching players."
          : "No full lane cover in the open-matching pool. Use Quick team manually.",
      );
      return;
    }
    toast.success(
      `Preview: ${next.teams.length} team${next.teams.length === 1 ? "" : "s"}` +
        (next.leftoverIds.length
          ? `, ${next.leftoverIds.length} leftover`
          : ""),
    );
  };

  const handleConfirm = async () => {
    if (!plan?.teams.length) return;
    await onConfirm(plan);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="flex flex-col gap-1 border-b border-border px-6 py-4 text-left">
          <DialogTitle>Auto teams preview</DialogTitle>
          <DialogDescription>
            Pack approved open-matching registrants into lane-balanced squads of
            5. Leftovers stay unassigned for Quick team.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {!plan ? (
            <p className="text-muted-foreground text-sm">Building preview…</p>
          ) : plan.teams.length === 0 ? (
            <output className="block text-muted-foreground text-sm">
              {pool.length < 5
                ? `Open-matching pool has ${pool.length} player${pool.length === 1 ? "" : "s"} (need 5+).`
                : "Could not form a full 5-lane squad from preferred lanes. Assign manually with Quick team."}
            </output>
          ) : (
            <div className="flex flex-col gap-3">
              <p className="text-muted-foreground text-sm">
                {pool.length} in open pool → {plan.teams.length} team
                {plan.teams.length === 1 ? "" : "s"}
                {plan.leftoverIds.length
                  ? `, ${plan.leftoverIds.length} leftover`
                  : ""}
                .
              </p>
              <div className="divide-y divide-border overflow-hidden rounded-lg border border-border/70">
                {plan.teams.map((team) => (
                  <div key={team.name} className="flex flex-col gap-2 px-3 py-3">
                    <div className="flex items-center gap-2">
                      <UsersRound className="size-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{team.name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {team.memberIds.length}
                      </Badge>
                    </div>
                    <ul className="grid gap-1 sm:grid-cols-2">
                      {team.memberIds.map((id) => {
                        const p = byId.get(id);
                        return (
                          <li
                            key={id}
                            className="truncate text-muted-foreground text-xs"
                          >
                            <span className="text-foreground">
                              {memberLabel(p, id)}
                            </span>
                            {" · "}
                            {p ? laneLabel(p) : "—"}
                            {id === team.captainId ? " · captain" : ""}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
              {plan.leftoverIds.length > 0 ? (
                <div className="rounded-lg border border-border/70 bg-muted/20 px-3 py-2">
                  <p className="mb-1 font-medium text-xs">Leftovers</p>
                  <p className="text-muted-foreground text-xs">
                    {plan.leftoverIds
                      .map((id) => memberLabel(byId.get(id), id))
                      .join(", ")}
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-border px-6 py-4 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            disabled={pending || pool.length < 5}
            onClick={() => rebuild(true)}
          >
            <Shuffle className="size-4" />
            Reshuffle
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending || !plan?.teams.length}
              onClick={() => void handleConfirm()}
            >
              {pending
                ? "Creating…"
                : `Create ${plan?.teams.length ?? 0} team${(plan?.teams.length ?? 0) === 1 ? "" : "s"}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
