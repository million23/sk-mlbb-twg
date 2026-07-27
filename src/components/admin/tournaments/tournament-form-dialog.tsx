import { Button } from "@/components/ui/button";
import { DateTimeRangePicker } from "@/components/ui/date-time-range-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Collections } from "@/lib/pocketbase.types";
import {
  getTournamentStatusLabel,
  TOURNAMENT_STATUS_OPTIONS,
} from "@/lib/legacy/tournament-status";
import { useEffect, useState, type ReactNode } from "react";

export type TournamentFormValues = {
  title: string;
  slug: string;
  description: string;
  venue: string;
  start_at: string;
  end_at: string;
  status: Collections["tournaments"]["status"];
  registration_enabled: boolean;
  registration_open_at: string;
  registration_close_at: string;
  max_teams: string;
  min_team_size: string;
  max_team_size: string;
  match_best_of: string;
};

export type TournamentFormRecord = Partial<Collections["tournaments"]> & {
  id?: string;
  startAt?: string;
  endAt?: string;
  registrationEnabled?: boolean;
  registrationOpenAt?: string;
  registrationCloseAt?: string;
  maxTeams?: number;
  minTeamSize?: number;
  maxTeamSize?: number;
  matchBestOf?: number;
};

const STATUS_VALUES = new Set(TOURNAMENT_STATUS_OPTIONS.map((o) => o.value));

function slugFromTitle(title: string) {
  return title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function emptyValues(): TournamentFormValues {
  return {
    title: "",
    slug: "",
    description: "",
    venue: "",
    start_at: "",
    end_at: "",
    status: "draft",
    registration_enabled: false,
    registration_open_at: "",
    registration_close_at: "",
    max_teams: "",
    min_team_size: "5",
    max_team_size: "6",
    match_best_of: "3",
  };
}

function fromRecord(record: TournamentFormRecord): TournamentFormValues {
  return {
    title: record.title ?? "",
    slug: record.slug ?? "",
    description: record.description ?? "",
    venue: record.venue ?? "",
    start_at: record.start_at || record.startAt || "",
    end_at: record.end_at || record.endAt || "",
    status: record.status ?? "draft",
    registration_enabled:
      record.registration_enabled ?? record.registrationEnabled ?? false,
    registration_open_at:
      record.registration_open_at || record.registrationOpenAt || "",
    registration_close_at:
      record.registration_close_at || record.registrationCloseAt || "",
    max_teams:
      record.max_teams != null
        ? String(record.max_teams)
        : record.maxTeams != null
          ? String(record.maxTeams)
          : "",
    min_team_size: String(
      record.min_team_size ?? record.minTeamSize ?? 5,
    ),
    max_team_size: String(
      record.max_team_size ?? record.maxTeamSize ?? 6,
    ),
    match_best_of: String(
      record.match_best_of ?? record.matchBestOf ?? 3,
    ),
  };
}

function Field({
  label,
  children,
  className,
  hint,
}: {
  label: ReactNode;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={className ?? "space-y-1.5"}>
      <Label className="text-sm">{label}</Label>
      {children}
      {hint ? (
        <p className="text-muted-foreground text-xs text-pretty">{hint}</p>
      ) : null}
    </div>
  );
}

function requiredMark(text: string) {
  return (
    <>
      {text}
      <span className="text-destructive" aria-hidden>
        {" "}
        *
      </span>
    </>
  );
}

export function TournamentFormDialog({
  open,
  onOpenChange,
  mode,
  record,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  record?: TournamentFormRecord | null;
  pending?: boolean;
  onSubmit: (values: TournamentFormValues) => Promise<void> | void;
}) {
  const [values, setValues] = useState<TournamentFormValues>(emptyValues);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setValues(record ? fromRecord(record) : emptyValues());
  }, [open, record]);

  const patch = (partial: Partial<TournamentFormValues>) =>
    setValues((prev) => ({ ...prev, ...partial }));

  const validate = (): string | null => {
    if (!values.title.trim()) return "Title is required";
    if (!values.venue.trim()) return "Venue is required";
    if (!values.start_at.trim()) return "Start date is required";
    if (!values.end_at.trim()) return "End date is required";
    if (!values.status || !STATUS_VALUES.has(values.status)) {
      return "Status is required";
    }

    const startMs = new Date(values.start_at).getTime();
    const endMs = new Date(values.end_at).getTime();
    if (Number.isNaN(startMs)) return "Start date is invalid";
    if (Number.isNaN(endMs)) return "End date is invalid";
    if (endMs < startMs) {
      return "End date and time must be on or after the start";
    }

    if (values.registration_open_at && values.registration_close_at) {
      const openMs = new Date(values.registration_open_at).getTime();
      const closeMs = new Date(values.registration_close_at).getTime();
      if (Number.isNaN(openMs) || Number.isNaN(closeMs)) {
        return "Registration window dates are invalid";
      }
      if (closeMs < openMs) {
        return "Registration close must be on or after open";
      }
    }

    const minSize = Number(values.min_team_size);
    const maxSize = Number(values.max_team_size);
    const bestOf = Number(values.match_best_of);
    if (!Number.isInteger(minSize) || minSize < 1) {
      return "Min team size must be a whole number ≥ 1";
    }
    if (!Number.isInteger(maxSize) || maxSize < minSize) {
      return "Max team size must be ≥ min team size";
    }
    if (!Number.isInteger(bestOf) || bestOf < 1) {
      return "Match best-of must be a whole number ≥ 1";
    }
    if (values.max_teams.trim()) {
      const maxTeams = Number(values.max_teams);
      if (!Number.isInteger(maxTeams) || maxTeams < 1) {
        return "Max teams must be a whole number ≥ 1";
      }
    }

    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add tournament" : "Edit tournament"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create an event workspace for participants, teams, and matches."
              : "Update event details, schedule, and registration settings."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            const message = validate();
            if (message) {
              setError(message);
              return;
            }
            setError(null);
            const title = values.title.trim();
            void Promise.resolve(
              onSubmit({
                ...values,
                title,
                slug: slugFromTitle(title),
                venue: values.venue.trim(),
                description: values.description.trim(),
              }),
            ).catch((err: unknown) => {
              setError(
                err instanceof Error ? err.message : "Could not save tournament",
              );
            });
          }}
        >
          <Field label={requiredMark("Title")}>
            <Input
              value={values.title}
              aria-required
              onChange={(e) => {
                const title = e.target.value;
                patch({ title, slug: slugFromTitle(title) });
              }}
              placeholder="Tournament name"
            />
          </Field>

          <Field label="Slug" hint="Generated from the title.">
            <Input
              value={values.slug}
              readOnly
              className="bg-muted"
              placeholder="url-friendly-name"
            />
          </Field>

          <Field label="Description">
            <Textarea
              value={values.description}
              onChange={(e) => patch({ description: e.target.value })}
              placeholder="Event details"
              rows={3}
              className="resize-none"
            />
          </Field>

          <Field label={requiredMark("Venue")}>
            <Input
              value={values.venue}
              aria-required
              onChange={(e) => patch({ venue: e.target.value })}
              placeholder="Venue / location"
            />
          </Field>

          <Field label={requiredMark("Start & end")}>
            <DateTimeRangePicker
              startValue={values.start_at}
              endValue={values.end_at}
              onChange={({ startAt, endAt }) =>
                patch({ start_at: startAt, end_at: endAt })
              }
            />
          </Field>

          <Field label={requiredMark("Status")}>
            <Select
              value={values.status}
              onValueChange={(v) =>
                patch({
                  status: v as Collections["tournaments"]["status"],
                })
              }
            >
              <SelectTrigger className="w-full" aria-required>
                <SelectValue placeholder="Select status">
                  {(value) =>
                    value != null && value !== ""
                      ? getTournamentStatusLabel(
                          value as Collections["tournaments"]["status"],
                        )
                      : null
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {TOURNAMENT_STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <div className="flex items-center justify-between gap-3 rounded-xl border border-border/80 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium">Registration enabled</p>
              <p className="text-muted-foreground text-xs text-pretty">
                Allow public signup when the window is open.
              </p>
            </div>
            <Switch
              checked={values.registration_enabled}
              onCheckedChange={(checked) =>
                patch({ registration_enabled: checked })
              }
            />
          </div>

          <Field
            label="Registration window"
            hint="Optional. Leave empty to rely on enabled + status only."
          >
            <DateTimeRangePicker
              startValue={values.registration_open_at}
              endValue={values.registration_close_at}
              onChange={({ startAt, endAt }) =>
                patch({
                  registration_open_at: startAt,
                  registration_close_at: endAt,
                })
              }
              placeholder="Registration open – close"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Max teams">
              <Input
                inputMode="numeric"
                value={values.max_teams}
                onChange={(e) => patch({ max_teams: e.target.value })}
                placeholder="e.g. 64"
              />
            </Field>
            <Field label={requiredMark("Match best-of")}>
              <Input
                inputMode="numeric"
                value={values.match_best_of}
                aria-required
                onChange={(e) => patch({ match_best_of: e.target.value })}
              />
            </Field>
            <Field label={requiredMark("Min team size")}>
              <Input
                inputMode="numeric"
                value={values.min_team_size}
                aria-required
                onChange={(e) => patch({ min_team_size: e.target.value })}
              />
            </Field>
            <Field label={requiredMark("Max team size")}>
              <Input
                inputMode="numeric"
                value={values.max_team_size}
                aria-required
                onChange={(e) => patch({ max_team_size: e.target.value })}
              />
            </Field>
          </div>

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-2">
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
                  ? "Add tournament"
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
