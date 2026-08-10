import { BirthdayPicker } from "@/components/ui/birthday-picker";
import { Button } from "@/components/ui/button";
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
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type {
  ParticipantDocUploads,
  ParticipantFormValues,
} from "@/hooks/admin/use-tournament-participants";
import {
  PARTICIPANT_DOC_FIELDS,
  PARTICIPANT_DOC_LABELS,
} from "@/lib/admin/participant-files";

import {
  ELIGIBLE_PHASES,
  TEAM_INTENTS,
} from "@/lib/registration/flow";
import type { LANES, ListedTeam } from "@/lib/registration/flow";
import { TEAM_INTENT_LABELS } from "@/lib/admin/participant-approval";
import { useEffect, useState, type ReactNode } from "react";

const MAX_UI_PREFERRED_LANES = 3;

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
  preferred_lane: ["mid"],
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
    preferred_lane:
      record.preferred_roles?.length
        ? (record.preferred_roles as typeof LANES[number][])
        : record.preferred_lane
          ? ([record.preferred_lane] as typeof LANES[number][])
          : ["mid"],
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
    if (!values.preferred_lane || values.preferred_lane.length === 0)
      return "Preferred lane is required";
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
    <ResponsiveModal open={open} onOpenChange={onOpenChange}>
      <ResponsiveModalContent className="flex h-dvh max-h-dvh w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-auto sm:max-h-[90vh] sm:max-w-lg sm:rounded-lg">
        <ResponsiveModalHeader className="shrink-0 border-b border-border/70 px-5 py-4 sm:px-6">
          <ResponsiveModalTitle>
            {mode === "create" ? "Add participant" : "Edit participant"}
          </ResponsiveModalTitle>
          <ResponsiveModalDescription>
            {mode === "create"
              ? "Create a participant record for this tournament (admin)."
              : "Update credentials, team intent, and registration status."}
          </ResponsiveModalDescription>
        </ResponsiveModalHeader>

        <form
          className="flex min-h-0 flex-1 flex-col"
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
          <div className="grid min-h-0 flex-1 gap-3 overflow-y-auto px-5 py-4 sm:px-6">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
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

          <Field label="Preferred lane (select up to 3)">
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {(
                [
                  { lane: "exp", label: "Experience Lane", className: "" },
                  { lane: "jungle", label: "Jungle", className: "" },
                  {
                    lane: "mid",
                    label: "Mid Lane",
                    className: "col-span-2",
                  },
                  { lane: "gold", label: "Gold Lane", className: "" },
                  { lane: "support", label: "Support", className: "" },
                ] as const
              ).map(({ lane: l, label, className: cellClass }) => {
                const on = values.preferred_lane.includes(l);
                const inputId = `preferred-lane-${l}`;
                return (
                  <label
                    key={l}
                    htmlFor={inputId}
                    className={
                      "relative flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border px-3 py-3 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-primary/50 " +
                      cellClass +
                      (on
                        ? " border-primary bg-primary/10"
                        : " border-border hover:bg-muted/60")
                    }
                  >
                    <input
                      type="checkbox"
                      id={inputId}
                      value={l}
                      checked={on}
                      disabled={
                        !on &&
                        values.preferred_lane.length >= MAX_UI_PREFERRED_LANES
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          if (
                            values.preferred_lane.length >=
                            MAX_UI_PREFERRED_LANES
                          ) {
                            return;
                          }
                          patch({
                            preferred_lane: [...values.preferred_lane, l],
                          });
                        } else {
                          patch({
                            preferred_lane: values.preferred_lane.filter((v) => v !== l),
                          });
                        }
                      }}
                      className="sr-only"
                    />
                    {/* icon-less in admin form to keep it lightweight; label is enough */}
                    <span className="whitespace-nowrap text-sm font-medium">
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
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
          </div>

          <ResponsiveModalFooter className="mx-0! mb-0! mt-auto shrink-0 flex-col-reverse gap-2 border-t border-border/70 px-5 py-4 sm:flex-row sm:justify-end sm:gap-2 sm:px-6">
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
          </ResponsiveModalFooter>
        </form>
      </ResponsiveModalContent>
    </ResponsiveModal>
  );
}
