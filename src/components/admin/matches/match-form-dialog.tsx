import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import type { MatchRecord } from "@/hooks/legacy/use-matches";
import {
  getMatchStatusStyle,
  type MatchStatusValue,
} from "@/lib/legacy/match-status";
import { cn } from "@/lib/utils";
import { Check, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

export type TeamOption = { id: string; name: string };

export type MatchFormValues = {
  matchLabel: string;
  round: string;
  order: number;
  bestOf: number;
  teamA: string;
  teamB: string;
  status: MatchStatusValue;
  notes: string;
};

const MATCH_STATUSES: { value: MatchStatusValue; label: string }[] = [
  { value: "scheduled", label: "Scheduled" },
  { value: "live", label: "Live" },
  { value: "completed", label: "Completed" },
  { value: "walkover", label: "Walkover" },
  { value: "cancelled", label: "Cancelled" },
];

function emptyValues(): MatchFormValues {
  return {
    matchLabel: "",
    round: "",
    order: 0,
    bestOf: 3,
    teamA: "",
    teamB: "",
    status: "scheduled",
    notes: "",
  };
}

function fromRecord(record: MatchRecord): MatchFormValues {
  return {
    matchLabel: record.matchLabel ?? "",
    round: record.round ?? "",
    order: record.order ?? 0,
    bestOf: record.bestOf ?? 3,
    teamA: record.teamA ?? "",
    teamB: record.teamB ?? "",
    status: record.status ?? "scheduled",
    notes: record.notes ?? "",
  };
}

function TeamSelectButton({
  id,
  label,
  value,
  teams,
  onOpen,
}: {
  id: string;
  label: string;
  value: string;
  teams: TeamOption[];
  onOpen: () => void;
}) {
  const selectedName =
    teams.find((t) => t.id === value)?.name?.trim() || (value ? value : "TBD");

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <button
        id={id}
        type="button"
        onClick={onOpen}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-4xl border border-input bg-background px-3 text-left text-sm shadow-xs transition-[color,box-shadow] outline-none",
          "hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        )}
      >
        <span className={cn("truncate", !value && "text-muted-foreground")}>
          {selectedName}
        </span>
        <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </div>
  );
}

/** Sibling dialog (not nested) so outside/backdrop click can dismiss. */
function TeamPickerDialog({
  open,
  onOpenChange,
  label,
  value,
  teams,
  excludeId,
  onChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  value: string;
  teams: TeamOption[];
  excludeId?: string;
  onChange: (value: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return teams;
    return teams.filter((t) => t.name.toLowerCase().includes(q));
  }, [teams, query]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton
        className="flex h-[min(92svh,52rem)] max-h-[92svh] w-full max-w-[min(96vw,56rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[min(96vw,56rem)]"
      >
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 text-left sm:px-6">
          <DialogTitle>Pick {label.toLowerCase()}</DialogTitle>
          <DialogDescription>
            Choose a team for this match slot, or leave it TBD. Click outside to
            close.
          </DialogDescription>
        </DialogHeader>

        <div className="shrink-0 border-b border-border/70 px-5 py-3 sm:px-6">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search teams…"
            autoComplete="off"
            autoFocus
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            <button
              type="button"
              onClick={() => {
                onChange("");
                onOpenChange(false);
              }}
              className={cn(
                "flex min-h-20 flex-col items-start justify-between rounded-2xl border px-3 py-3 text-left transition-colors",
                !value
                  ? "border-primary bg-primary/10"
                  : "border-border/80 bg-background/60 hover:border-primary/30 hover:bg-muted/40",
              )}
            >
              <span className="font-medium text-sm">TBD</span>
              <span className="text-muted-foreground text-xs">Unassigned</span>
            </button>

            {filtered.map((t) => {
              const active = t.id === value;
              const taken = Boolean(excludeId && t.id === excludeId);
              return (
                <button
                  key={t.id}
                  type="button"
                  disabled={taken}
                  onClick={() => {
                    onChange(t.id);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "flex min-h-20 flex-col items-start justify-between rounded-2xl border px-3 py-3 text-left transition-colors",
                    active
                      ? "border-primary bg-primary/10"
                      : taken
                        ? "cursor-not-allowed border-border/50 bg-muted/20 opacity-50"
                        : "border-border/80 bg-background/60 hover:border-primary/30 hover:bg-muted/40",
                  )}
                >
                  <span className="line-clamp-2 font-medium text-sm">
                    {t.name}
                  </span>
                  {active ? (
                    <Check className="size-4 text-primary" aria-hidden />
                  ) : taken ? (
                    <span className="text-muted-foreground text-xs">
                      Other side
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs">Select</span>
                  )}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <p className="mt-6 text-center text-muted-foreground text-sm">
              No teams match “{query.trim()}”.
            </p>
          ) : null}
        </div>

        <DialogFooter className="mx-0! mb-0! shrink-0 border-t border-border bg-muted/40 px-5 pt-3 pb-4 sm:flex-row sm:justify-end sm:px-6">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MatchFormDialog({
  open,
  onOpenChange,
  mode,
  record,
  teams,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  record?: MatchRecord | null;
  teams: TeamOption[];
  pending?: boolean;
  onSubmit: (values: MatchFormValues) => Promise<void> | void;
}) {
  const [values, setValues] = useState<MatchFormValues>(emptyValues);
  const [picking, setPicking] = useState<"A" | "B" | null>(null);

  useEffect(() => {
    if (!open) {
      setPicking(null);
      return;
    }
    setValues(record ? fromRecord(record) : emptyValues());
  }, [open, record]);

  const pickerLabel = picking === "B" ? "Team B" : "Team A";
  const pickerValue = picking === "B" ? values.teamB : values.teamA;
  const pickerExclude = picking === "B" ? values.teamA : values.teamB;

  return (
    <>
      <ResponsiveModal
        open={open}
        onOpenChange={(next) => {
          // While the team picker is open, ignore dismiss on the match form
          // (outside click should close the picker only).
          if (!next && picking) return;
          onOpenChange(next);
        }}
      >
        <ResponsiveModalContent className="flex max-h-[min(90vh,720px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <ResponsiveModalHeader className="flex flex-col gap-1 border-b border-border px-6 py-4 text-left">
            <ResponsiveModalTitle>
              {mode === "create" ? "Add match" : "Edit match"}
            </ResponsiveModalTitle>
            <ResponsiveModalDescription>
              {mode === "create"
                ? "Create a bracket row for this tournament."
                : "Update bracket slot, teams, and schedule metadata. Use Score & winner for results."}
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>

          <form
            className="flex min-h-0 flex-1 flex-col"
            onSubmit={(e) => {
              e.preventDefault();
              void Promise.resolve(
                onSubmit({
                  ...values,
                  matchLabel: values.matchLabel.trim(),
                  round: values.round.trim(),
                  notes: values.notes.trim(),
                }),
              ).then(() => onOpenChange(false));
            }}
          >
            <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="match-label">Label</Label>
                <Input
                  id="match-label"
                  value={values.matchLabel}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, matchLabel: e.target.value }))
                  }
                  placeholder="e.g. Upper bracket — semifinal"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="match-round">Round</Label>
                  <Input
                    id="match-round"
                    value={values.round}
                    onChange={(e) =>
                      setValues((v) => ({ ...v, round: e.target.value }))
                    }
                    placeholder="Round 1"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="match-order">Order</Label>
                  <Input
                    id="match-order"
                    type="number"
                    min={0}
                    value={values.order}
                    onChange={(e) =>
                      setValues((v) => ({
                        ...v,
                        order: Number.parseInt(e.target.value, 10) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="match-best-of">Best of</Label>
                <Input
                  id="match-best-of"
                  type="number"
                  min={1}
                  value={values.bestOf}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      bestOf: Number.parseInt(e.target.value, 10) || 3,
                    }))
                  }
                />
              </div>

              <div className="flex flex-col gap-3 border-t border-border pt-4">
                <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
                  Teams
                </p>
                <TeamSelectButton
                  id="match-team-a"
                  label="Team A"
                  value={values.teamA}
                  teams={teams}
                  onOpen={() => setPicking("A")}
                />
                <TeamSelectButton
                  id="match-team-b"
                  label="Team B"
                  value={values.teamB}
                  teams={teams}
                  onOpen={() => setPicking("B")}
                />
              </div>

              {mode === "edit" ? (
                <div className="space-y-1.5 border-t border-border pt-4">
                  <Label htmlFor="match-status">Status</Label>
                  <Select
                    value={values.status}
                    onValueChange={(v) =>
                      setValues((prev) => ({
                        ...prev,
                        status: (v as MatchStatusValue) ?? "scheduled",
                      }))
                    }
                  >
                    <SelectTrigger id="match-status" className="w-full">
                      <SelectValue>
                        {(selected) =>
                          selected
                            ? (MATCH_STATUSES.find((s) => s.value === selected)
                                ?.label ??
                              getMatchStatusStyle(
                                selected as MatchStatusValue,
                              ).label)
                            : null
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {MATCH_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              ) : null}

              <div className="space-y-1.5 border-t border-border pt-4">
                <Label htmlFor="match-notes">Notes</Label>
                <Textarea
                  id="match-notes"
                  value={values.notes}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, notes: e.target.value }))
                  }
                  placeholder="Optional staff notes"
                  rows={3}
                  className="min-h-18 resize-y"
                />
              </div>
            </div>

            <ResponsiveModalFooter className="mx-0! mb-0! mt-auto shrink-0 flex-col-reverse gap-3 border-t border-border bg-muted/40 px-6 pt-4 pb-5 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={pending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={pending}>
                {pending
                  ? "Saving…"
                  : mode === "create"
                    ? "Create"
                    : "Save changes"}
              </Button>
            </ResponsiveModalFooter>
          </form>
        </ResponsiveModalContent>
      </ResponsiveModal>

      <TeamPickerDialog
        open={picking != null}
        onOpenChange={(next) => {
          if (!next) setPicking(null);
        }}
        label={pickerLabel}
        value={pickerValue}
        teams={teams}
        excludeId={pickerExclude || undefined}
        onChange={(id) => {
          if (picking === "B") {
            setValues((v) => ({ ...v, teamB: id }));
          } else {
            setValues((v) => ({ ...v, teamA: id }));
          }
        }}
      />
    </>
  );
}
