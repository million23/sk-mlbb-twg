import { BirthdayPicker } from "@/components/ui/birthday-picker";
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
import { Textarea } from "@/components/ui/textarea";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type {
  ParticipantDocUploads,
  ParticipantFormValues,
} from "@/hooks/admin/use-tournament-participants";
import {
  PARTICIPANT_DOC_FIELDS,
  PARTICIPANT_DOC_LABELS,
} from "@/lib/admin/participant-files";
import { LANE_ROLE_LABELS } from "@/lib/legacy/lane-role-icons";
import {
  ELIGIBLE_PHASES,
  LANES,
  TEAM_INTENTS,
  type ListedTeam,
} from "@/lib/registration/flow";
import { TEAM_INTENT_LABELS } from "@/lib/admin/participant-approval";
import { useEffect, useState, type ReactNode } from "react";

const emptyValues = (): ParticipantFormValues => ({
  name: "",
  email: "",
  ign: "",
  birthdate: "",
  contact_number: "",
  user_id: "",
  server_id: "",
  address_phase: "4",
  address_package: "",
  address_block: "",
  address_lot: "",
  preferred_lane: "mid",
  team_intent: "open_matching",
  preferred_team: "",
  preferred_team_name: "",
  registration_status: "approved",
  registration_reject_reason: "",
});

function fromRecord(record: ParticipantsRecord): ParticipantFormValues {
  return {
    name: record.name ?? "",
    email: record.email ?? "",
    ign: record.ign ?? "",
    birthdate: record.birthdate?.slice(0, 10) ?? "",
    contact_number: record.contact_number ?? "",
    user_id: record.user_id ?? "",
    server_id: record.server_id ?? "",
    address_phase: record.address_phase ?? "4",
    address_package: record.address_package ?? "",
    address_block: record.address_block ?? "",
    address_lot: record.address_lot ?? "",
    preferred_lane: record.preferred_lane ?? "mid",
    team_intent: record.team_intent ?? "open_matching",
    preferred_team: record.preferred_team ?? "",
    preferred_team_name: record.preferred_team_name ?? "",
    registration_status: record.registration_status ?? "pending",
    registration_reject_reason: record.registration_reject_reason ?? "",
  };
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ?? "space-y-1.5"}>
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

export function ParticipantFormDialog({
  open,
  onOpenChange,
  mode,
  record,
  listedTeams,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  record?: ParticipantsRecord | null;
  listedTeams: ListedTeam[];
  pending?: boolean;
  onSubmit: (input: {
    values: ParticipantFormValues;
    uploads: ParticipantDocUploads;
  }) => Promise<void> | void;
}) {
  const [values, setValues] = useState<ParticipantFormValues>(emptyValues);
  const [uploads, setUploads] = useState<ParticipantDocUploads>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setUploads({});
    setValues(record ? fromRecord(record) : emptyValues());
  }, [open, record]);

  const patch = (partial: Partial<ParticipantFormValues>) =>
    setValues((prev) => ({ ...prev, ...partial }));

  const validate = (): string | null => {
    if (!values.name.trim()) return "Name is required";
    if (!values.email.trim() || !values.email.includes("@")) {
      return "Valid email is required";
    }
    if (!values.ign.trim()) return "IGN is required";
    if (!values.birthdate) return "Birthdate is required";
    if (!values.user_id.trim()) return "User ID is required";
    if (!values.server_id.trim()) return "Server ID is required";
    if (!values.address_package.trim()) return "Package is required";
    if (!values.address_block.trim()) return "Block is required";
    if (!values.address_lot.trim()) return "Lot is required";
    if (values.team_intent === "join_team" && !values.preferred_team) {
      return "Pick a team to join";
    }
    if (
      values.team_intent === "create_team" &&
      !values.preferred_team_name.trim()
    ) {
      return "Team name is required";
    }
    if (
      values.registration_status === "rejected" &&
      !values.registration_reject_reason.trim()
    ) {
      return "Reject reason is required";
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Add participant" : "Edit participant"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a participant record for this tournament (admin)."
              : "Update credentials, team intent, and registration status."}
          </DialogDescription>
        </DialogHeader>

        <form
          className="grid gap-3"
          onSubmit={async (e) => {
            e.preventDefault();
            const err = validate();
            if (err) {
              setError(err);
              return;
            }
            setError(null);
            await onSubmit({ values, uploads });
          }}
        >
          <Field label="Name">
            <Input
              value={values.name}
              onChange={(e) => patch({ name: e.target.value })}
              required
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={values.email}
              onChange={(e) => patch({ email: e.target.value })}
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="IGN">
              <Input
                value={values.ign}
                onChange={(e) => patch({ ign: e.target.value })}
                required
              />
            </Field>
            <Field label="Contact">
              <Input
                value={values.contact_number}
                onChange={(e) => patch({ contact_number: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Birthdate">
            <BirthdayPicker
              value={values.birthdate}
              onChange={(v) => patch({ birthdate: v })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="User ID">
              <Input
                value={values.user_id}
                onChange={(e) => patch({ user_id: e.target.value })}
                required
              />
            </Field>
            <Field label="Server ID">
              <Input
                value={values.server_id}
                onChange={(e) => patch({ server_id: e.target.value })}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <Field label="Phase">
              <Select
                value={values.address_phase}
                onValueChange={(v) =>
                  patch({ address_phase: (v ?? "4") as "4" | "9" | "10" })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {ELIGIBLE_PHASES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Pkg">
              <Input
                value={values.address_package}
                onChange={(e) => patch({ address_package: e.target.value })}
                required
              />
            </Field>
            <Field label="Blk">
              <Input
                value={values.address_block}
                onChange={(e) => patch({ address_block: e.target.value })}
                required
              />
            </Field>
            <Field label="Lot">
              <Input
                value={values.address_lot}
                onChange={(e) => patch({ address_lot: e.target.value })}
                required
              />
            </Field>
          </div>

          <Field label="Preferred lane">
            <Select
              value={values.preferred_lane}
              onValueChange={(v) =>
                patch({
                  preferred_lane: (v ?? "mid") as ParticipantFormValues["preferred_lane"],
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    value
                      ? (LANE_ROLE_LABELS[
                          value as keyof typeof LANE_ROLE_LABELS
                        ] ?? value)
                      : null
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {LANES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {LANE_ROLE_LABELS[l]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Team intent">
            <Select
              value={values.team_intent}
              onValueChange={(v) =>
                patch({
                  team_intent: (v ??
                    "open_matching") as ParticipantFormValues["team_intent"],
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value: string | null) =>
                    value
                      ? TEAM_INTENT_LABELS[
                          value as keyof typeof TEAM_INTENT_LABELS
                        ]
                      : null
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {TEAM_INTENTS.map((intent) => (
                    <SelectItem key={intent} value={intent}>
                      {TEAM_INTENT_LABELS[intent]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          {values.team_intent === "join_team" ? (
            <Field label="Preferred team">
              <Select
                value={values.preferred_team || null}
                onValueChange={(v) => patch({ preferred_team: v ?? "" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select team">
                    {(value: string | null) =>
                      listedTeams.find((t) => t.id === value)?.name ?? null
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {listedTeams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          {values.team_intent === "create_team" ? (
            <Field label="Preferred team name">
              <Input
                value={values.preferred_team_name}
                onChange={(e) => patch({ preferred_team_name: e.target.value })}
              />
            </Field>
          ) : null}

          <Field label="Registration status">
            <Select
              value={values.registration_status}
              onValueChange={(v) =>
                patch({
                  registration_status: (v ??
                    "pending") as ParticipantFormValues["registration_status"],
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>

          {values.registration_status === "rejected" ? (
            <Field label="Reject reason">
              <Textarea
                value={values.registration_reject_reason}
                onChange={(e) =>
                  patch({ registration_reject_reason: e.target.value })
                }
                rows={2}
              />
            </Field>
          ) : null}

          <div className="space-y-2">
            <p className="font-medium text-sm">Documents (optional)</p>
            {PARTICIPANT_DOC_FIELDS.map((field) => (
              <Field key={field} label={PARTICIPANT_DOC_LABELS[field]}>
                <Input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setUploads((prev) => ({ ...prev, [field]: file }));
                  }}
                />
              </Field>
            ))}
          </div>

          {error ? (
            <p className="text-destructive text-sm" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : mode === "create" ? "Create" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
