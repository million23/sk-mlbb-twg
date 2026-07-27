import { Button } from "@/components/ui/button";
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
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";
import type { TeamsRecordStatus } from "@/hooks/orval/model/teamsRecordStatus";
import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import { getTeamStatusStyle } from "@/lib/legacy/team-status";
import { useEffect, useState } from "react";

export type TeamFormDialogValues = {
  name: string;
  captain: string;
  status: TeamsRecordStatus;
};

const STATUS_OPTIONS: TeamsRecordStatus[] = [
  "forming",
  "ready",
  "incomplete",
  "inactive",
];

function emptyValues(): TeamFormDialogValues {
  return { name: "", captain: "", status: "forming" };
}

function fromRecord(
  record: TeamsRecord,
  members: ParticipantsRecord[],
): TeamFormDialogValues {
  const captainStillMember = members.some((m) => m.id === record.captain);
  return {
    name: record.name ?? "",
    captain: captainStillMember ? (record.captain ?? "") : "",
    status: record.status ?? "forming",
  };
}

export function TeamFormDialog({
  open,
  onOpenChange,
  mode,
  record,
  members,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  record?: TeamsRecord | null;
  members: ParticipantsRecord[];
  pending?: boolean;
  onSubmit: (values: TeamFormDialogValues) => Promise<void> | void;
}) {
  const [values, setValues] = useState<TeamFormDialogValues>(emptyValues);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setValues(record ? fromRecord(record, members) : emptyValues());
  }, [open, record, members]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add team" : "Edit team"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create an empty team. Add members from the team sheet or Quick team."
              : "Update the team name, captain, or status."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (!values.name.trim()) {
              setError("Team name is required");
              return;
            }
            setError(null);
            void Promise.resolve(onSubmit({
              ...values,
              name: values.name.trim(),
            })).catch((err: unknown) => {
              setError(
                err instanceof Error ? err.message : "Could not save team",
              );
            });
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="team-name">
              Name
              <span className="text-destructive" aria-hidden>
                {" "}
                *
              </span>
            </Label>
            <Input
              id="team-name"
              value={values.name}
              aria-required
              onChange={(e) =>
                setValues((v) => ({ ...v, name: e.target.value }))
              }
              placeholder="Team name"
            />
          </div>

          {mode === "edit" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="team-captain">Captain</Label>
                <Select
                  value={values.captain || "__none__"}
                  onValueChange={(v) =>
                    setValues((prev) => ({
                      ...prev,
                      captain: !v || v === "__none__" ? "" : v,
                    }))
                  }
                >
                  <SelectTrigger id="team-captain" className="w-full">
                    <SelectValue placeholder="No captain">
                      {(selected) => {
                        if (!selected || selected === "__none__") {
                          return "No captain";
                        }
                        const m = members.find((p) => p.id === selected);
                        if (!m) return "No captain";
                        return (
                          formatParticipantNameDisplay(m.name) ||
                          m.ign ||
                          selected
                        );
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="__none__">No captain</SelectItem>
                      {members.map((m) =>
                        m.id ? (
                          <SelectItem key={m.id} value={m.id}>
                            {formatParticipantNameDisplay(m.name) || m.ign}
                          </SelectItem>
                        ) : null,
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="team-status">Status</Label>
                <Select
                  value={values.status}
                  onValueChange={(v) =>
                    setValues((prev) => ({
                      ...prev,
                      status: (v as TeamsRecordStatus) ?? "forming",
                    }))
                  }
                >
                  <SelectTrigger id="team-status" className="w-full">
                    <SelectValue>
                      {(selected) =>
                        selected
                          ? getTeamStatusStyle(
                              selected as Parameters<
                                typeof getTeamStatusStyle
                              >[0],
                            ).label
                          : null
                      }
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {STATUS_OPTIONS.map((s) => (
                        <SelectItem key={s} value={s}>
                          {getTeamStatusStyle(s).label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
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
                  ? "Add team"
                  : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
