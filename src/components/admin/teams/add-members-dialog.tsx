import { PreferredLaneIcons } from "@/components/participants/preferred-lane-icons";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalFooter,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import { Input } from "@/components/ui/input";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import { groupParticipantsByTournamentAge } from "@/lib/legacy/age";
import {
  matchesFuzzyQuery,
  participantSearchHaystack,
} from "@/lib/legacy/fuzzy-match";
import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import type { PlayerRole } from "@/types/__pocketbase-types";
import { useEffect, useMemo, useState } from "react";

export function AddMembersDialog({
  open,
  onOpenChange,
  teamName,
  unassigned,
  maxSelectable,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamName: string;
  unassigned: ParticipantsRecord[];
  maxSelectable: number;
  pending?: boolean;
  onSubmit: (participantIds: string[]) => Promise<void> | void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setSearch("");
    setError(null);
  }, [open]);

  const filtered = useMemo(() => {
    const q = search.trim();
    const pool = !q
      ? unassigned
      : unassigned.filter((p) =>
          matchesFuzzyQuery(
            participantSearchHaystack({
              name: p.name,
              gameID: p.ign ?? p.user_id,
              area: p.address_phase,
            }),
            q,
          ),
        );
    return groupParticipantsByTournamentAge(pool);
  }, [unassigned, search]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= maxSelectable) {
        setError(`You can add at most ${maxSelectable} more player(s).`);
        return prev;
      }
      setError(null);
      next.add(id);
      return next;
    });
  };

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden sm:max-w-lg">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Add members</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            Pick unassigned approved players for{" "}
            <span className="font-medium text-foreground">{teamName}</span>.
            {maxSelectable < 99
              ? ` Up to ${maxSelectable} slot(s) left.`
              : null}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search name or IGN…"
          className="shrink-0"
        />

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {unassigned.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No unassigned approved participants available.
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No players match this search.
            </p>
          ) : (
            filtered.map((group) => (
              <div key={group.key} className="space-y-2">
                <p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.18em]">
                  {group.label}
                </p>
                <ul className="space-y-1.5">
                  {group.items.map((p) => {
                    if (!p.id) return null;
                    const checked = selected.has(p.id);
                    const roles = (p.preferred_roles?.length
                      ? p.preferred_roles
                      : p.preferred_lane
                        ? [p.preferred_lane]
                        : []) as PlayerRole[];
                    return (
                      <li key={p.id}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-background/60 px-3 py-2.5 hover:border-primary/30">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggle(p.id!)}
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-medium text-sm">
                              {formatParticipantNameDisplay(p.name)}
                            </span>
                            <span className="block truncate font-mono text-muted-foreground text-xs">
                              {p.ign}
                            </span>
                          </span>
                          {roles.length > 0 ? (
                            <PreferredLaneIcons roles={roles} />
                          ) : null}
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </div>

        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <ResponsiveModalFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={pending || selected.size === 0}
            onClick={() => {
              void Promise.resolve(onSubmit([...selected])).catch(
                (err: unknown) => {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Could not add members",
                  );
                },
              );
            }}
          >
            {pending
              ? "Adding…"
              : `Add ${selected.size || ""} member${selected.size === 1 ? "" : "s"}`.trim()}
          </Button>
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
