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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import {
  matchesFuzzyQuery,
  participantSearchHaystack,
} from "@/lib/legacy/fuzzy-match";
import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import { pickUnassignedIdsForFiveLanes } from "@/lib/legacy/team-lane-recommendations";
import type { PlayerRole } from "@/types/__pocketbase-types";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const QUICK_TEAM_MAX_MEMBERS = 6;

function laneRoles(p: ParticipantsRecord): PlayerRole[] {
  const roles = p.preferred_roles?.length
    ? p.preferred_roles
    : p.preferred_lane
      ? [p.preferred_lane]
      : [];
  return roles as PlayerRole[];
}

export function QuickTeamDialog({
  open,
  onOpenChange,
  unassigned,
  pending,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unassigned: ParticipantsRecord[];
  pending?: boolean;
  onCreate: (input: {
    name: string;
    captain: string;
    participantIds: string[];
  }) => Promise<void>;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [captain, setCaptain] = useState("");
  const [search, setSearch] = useState("");
  const [suggestedLaneIds, setSuggestedLaneIds] = useState<string[] | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  const laneCandidates = useMemo(
    () =>
      unassigned
        .filter((p): p is ParticipantsRecord & { id: string } => Boolean(p.id))
        .map((p) => ({
          id: p.id,
          preferredRoles: laneRoles(p),
        })),
    [unassigned],
  );

  const suggestFive = (announce: boolean) => {
    const ids = pickUnassignedIdsForFiveLanes(laneCandidates, {
      shuffleMemberOrder: true,
    });
    setSuggestedLaneIds(ids);
    setSelected(new Set(ids ?? []));
    if (!announce) return;
    if (ids) {
      toast.success(
        "Selected 5 players whose preferences can cover all five main lanes.",
      );
    } else {
      toast.message(
        "No group of 5 unassigned players covers every lane from preferences alone. Pick manually.",
      );
    }
  };

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setName("");
    setCaptain("");
    setSearch("");
    setError(null);
    const ids = pickUnassignedIdsForFiveLanes(laneCandidates, {
      shuffleMemberOrder: true,
    });
    setSuggestedLaneIds(ids);
    setSelected(new Set(ids ?? []));
    // Reset wizard only when opened; laneCandidates captured at open time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    setCaptain((c) => (c && !selected.has(c) ? "" : c));
  }, [selected]);

  const rosterList = useMemo(() => {
    if (!suggestedLaneIds?.length) return unassigned;
    const byId = new Map(unassigned.map((p) => [p.id, p]));
    return suggestedLaneIds
      .map((id) => byId.get(id))
      .filter((p): p is ParticipantsRecord => p != null);
  }, [suggestedLaneIds, unassigned]);

  const filteredRoster = useMemo(() => {
    const q = search.trim();
    if (!q) return rosterList;
    return rosterList.filter((p) =>
      matchesFuzzyQuery(
        participantSearchHaystack({
          name: p.name,
          gameID: p.ign ?? p.user_id,
          area: p.address_phase,
        }),
        q,
      ),
    );
  }, [rosterList, search]);

  const selectedList = useMemo(
    () => unassigned.filter((p) => p.id && selected.has(p.id)),
    [unassigned, selected],
  );

  const selectionMatchesLaneSuggestion = useMemo(() => {
    if (!suggestedLaneIds || suggestedLaneIds.length !== 5) return false;
    if (selected.size !== 5) return false;
    return suggestedLaneIds.every((id) => selected.has(id));
  }, [suggestedLaneIds, selected]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        return next;
      }
      if (next.size >= QUICK_TEAM_MAX_MEMBERS) {
        setError(
          `You can select at most ${QUICK_TEAM_MAX_MEMBERS} players in this flow.`,
        );
        return prev;
      }
      setError(null);
      next.add(id);
      return next;
    });
  };

  const canContinue =
    name.trim().length > 0 &&
    selected.size >= 1 &&
    selected.size <= QUICK_TEAM_MAX_MEMBERS;

  return (
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="flex max-h-[90vh] max-w-lg flex-col overflow-hidden sm:max-w-lg">
        <ResponsiveModalHeader>
          <ResponsiveModalTitle>Quick team</ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {step === 1
              ? "Name a team and pick unassigned approved players (up to 6)."
              : "Confirm creation — members will be assigned immediately."}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        {step === 1 ? (
          <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <div className="space-y-1.5">
              <Label htmlFor="quick-team-name">Team name</Label>
              <Input
                id="quick-team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Phase 9 United"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Captain (optional)</Label>
              <Select
                value={captain || "__none__"}
                onValueChange={(v) =>
                  setCaptain(!v || v === "__none__" ? "" : v)
                }
                disabled={selected.size === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose from selected">
                    {(value) => {
                      if (!value || value === "__none__") return "No captain yet";
                      const p = unassigned.find((x) => x.id === value);
                      return (
                        formatParticipantNameDisplay(p?.name) ||
                        p?.ign ||
                        String(value)
                      );
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="__none__">No captain yet</SelectItem>
                    {[...selected].map((id) => {
                      const p = unassigned.find((x) => x.id === id);
                      return (
                        <SelectItem key={id} value={id}>
                          {formatParticipantNameDisplay(p?.name) || p?.ign || id}
                        </SelectItem>
                      );
                    })}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-muted-foreground text-xs text-pretty">
                {suggestedLaneIds?.length
                  ? "Showing a lane-balanced five. Try another mix anytime."
                  : `Select up to ${QUICK_TEAM_MAX_MEMBERS} unassigned players.`}
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => suggestFive(true)}
              >
                {selectionMatchesLaneSuggestion
                  ? "Try another mix"
                  : "Suggest five by lanes"}
              </Button>
            </div>

            {!suggestedLaneIds?.length ? (
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or IGN…"
              />
            ) : null}

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {filteredRoster.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No unassigned players to show.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {filteredRoster.map((p) => {
                    if (!p.id) return null;
                    const checked = selected.has(p.id);
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
                          <PreferredLaneIcons roles={laneRoles(p)} />
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3 overflow-y-auto">
            <div className="rounded-xl border border-border/80 bg-muted/30 p-4 text-sm">
              <p>
                <span className="text-muted-foreground">Team name </span>
                <span className="font-medium">{name.trim()}</span>
              </p>
              <p className="mt-2 text-muted-foreground">
                Members ({selectedList.length})
              </p>
              <ul className="mt-1 space-y-0.5 pl-1">
                {selectedList.map((p) => (
                  <li key={p.id}>
                    · {formatParticipantNameDisplay(p.name) || p.ign}
                  </li>
                ))}
              </ul>
              {captain ? (
                <p className="mt-2 border-border/60 border-t pt-2 text-muted-foreground text-xs">
                  Captain:{" "}
                  <span className="font-medium text-foreground">
                    {formatParticipantNameDisplay(
                      selectedList.find((x) => x.id === captain)?.name,
                    ) ||
                      selectedList.find((x) => x.id === captain)?.ign ||
                      captain}
                  </span>
                </p>
              ) : null}
            </div>
          </div>
        )}

        {error ? (
          <p className="text-destructive text-sm" role="alert">
            {error}
          </p>
        ) : null}

        <ResponsiveModalFooter>
          {step === 1 ? (
            <>
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
                disabled={!canContinue || pending}
                onClick={() => setStep(2)}
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={pending}
              >
                Back
              </Button>
              <Button
                type="button"
                disabled={pending}
                onClick={() => {
                  void onCreate({
                    name: name.trim(),
                    captain,
                    participantIds: [...selected],
                  }).catch((err: unknown) => {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Could not create team",
                    );
                    setStep(1);
                  });
                }}
              >
                {pending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create team"
                )}
              </Button>
            </>
          )}
        </ResponsiveModalFooter>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
