import { ParticipantDocuments } from "@/components/admin/participants/participant-documents";
import { RegistrationStatusBadge } from "@/components/admin/participants/registration-status-badge";
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
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import {
  committeeApproveBlockReason,
  formatHomeAddress,
  TEAM_INTENT_LABELS,
} from "@/lib/admin/participant-approval";
import { ageOnTournamentDay, type ListedTeam } from "@/lib/registration/flow";
import { LANE_ROLE_LABELS } from "@/lib/legacy/lane-role-icons";
import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import type { TeamIntent } from "@/lib/registration/flow";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm text-pretty wrap-break-word">{value || "—"}</dd>
    </div>
  );
}

export function ParticipantDetailSheet({
  record,
  open,
  onOpenChange,
  listedTeams,
  peers,
  tournamentDay,
  teamNameById,
  approvePending,
  rejectPending,
  archivePending,
  onApprove,
  onReject,
  onEdit,
  onArchive,
}: {
  record: ParticipantsRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listedTeams: ListedTeam[];
  peers: ParticipantsRecord[];
  tournamentDay: string;
  teamNameById: Map<string, string>;
  approvePending?: boolean;
  rejectPending?: boolean;
  archivePending?: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onEdit: () => void;
  onArchive: () => void;
}) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [archiveOpen, setArchiveOpen] = useState(false);
  // Keep last record while closing so the sheet exit animation can finish.
  const [cached, setCached] = useState(record);
  useEffect(() => {
    if (record) setCached(record);
  }, [record]);

  if (!cached) return null;
  const view = cached;

  const isPending = view.registration_status === "pending";
  const blockReason = isPending
    ? committeeApproveBlockReason(
        view,
        listedTeams,
        peers,
        tournamentDay,
      )
    : null;
  const age = ageOnTournamentDay(view.birthdate, tournamentDay);
  const intent = (view.team_intent ?? "open_matching") as TeamIntent;
  const preferredTeamLabel =
    intent === "join_team"
      ? (teamNameById.get(view.preferred_team ?? "") ??
        view.preferred_team ??
        "—")
      : intent === "create_team"
        ? (view.preferred_team_name ?? "—")
        : "—";

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full gap-0 overflow-y-auto sm:max-w-md"
        >
          <SheetHeader className="border-b border-border">
            <SheetTitle className="pr-8">
              {formatParticipantNameDisplay(view.name) || "Participant"}
            </SheetTitle>
            <SheetDescription className="flex flex-wrap items-center gap-2">
              <RegistrationStatusBadge status={view.registration_status} />
              <span className="text-muted-foreground">
                IGN {view.ign}
              </span>
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-5 p-6">
            <dl className="grid gap-3">
              <DetailRow label="Email" value={view.email} />
              <DetailRow label="Contact" value={view.contact_number} />
              <DetailRow
                label="Birthdate"
                value={
                  <>
                    {view.birthdate?.slice(0, 10)}
                    {age != null ? (
                      <span className="text-muted-foreground">
                        {" "}
                        · age {age}
                        {tournamentDay ? ` on ${tournamentDay}` : ""}
                      </span>
                    ) : null}
                  </>
                }
              />
              <DetailRow
                label="MLBB IDs"
                value={`${view.user_id} / ${view.server_id}`}
              />
              <DetailRow label="Home address" value={formatHomeAddress(view)} />
              <DetailRow
                label="Preferred lane"
                value={
                  LANE_ROLE_LABELS[
                    view.preferred_lane as keyof typeof LANE_ROLE_LABELS
                  ] ?? view.preferred_lane
                }
              />
              <DetailRow
                label="Team intent"
                value={TEAM_INTENT_LABELS[intent]}
              />
              {intent !== "open_matching" ? (
                <DetailRow
                  label={
                    intent === "join_team" ? "Preferred team" : "Team name"
                  }
                  value={preferredTeamLabel}
                />
              ) : null}
              {view.registration_status_code ? (
                <DetailRow
                  label="Status code"
                  value={
                    <span className="font-mono tracking-wider">
                      {view.registration_status_code}
                    </span>
                  }
                />
              ) : null}
              {view.registration_status === "rejected" &&
              view.registration_reject_reason ? (
                <DetailRow
                  label="Reject reason"
                  value={view.registration_reject_reason}
                />
              ) : null}
            </dl>

            <ParticipantDocuments record={view} />

            {isPending && blockReason ? (
              <output className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-pretty">
                Cannot approve yet: {blockReason}
              </output>
            ) : null}
          </div>

          <SheetFooter className="border-t border-border sm:flex-col">
            {isPending ? (
              <div className="flex w-full flex-col gap-2">
                <Button
                  type="button"
                  disabled={Boolean(blockReason) || approvePending}
                  onClick={onApprove}
                >
                  <Check className="size-4" />
                  Approve
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  disabled={rejectPending}
                  onClick={() => {
                    setRejectReason("");
                    setRejectOpen(true);
                  }}
                >
                  <X className="size-4" />
                  Reject
                </Button>
              </div>
            ) : null}
            <div className="flex w-full gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={onEdit}
              >
                <Pencil className="size-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={archivePending}
                onClick={() => setArchiveOpen(true)}
              >
                <Trash2 className="size-4" />
                Archive
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject registration?</AlertDialogTitle>
            <AlertDialogDescription>
              The registrant will be emailed with this reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 px-1">
            <Label htmlFor="reject-reason">Reason</Label>
            <Textarea
              id="reject-reason"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Missing documents, ineligible address, …"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!rejectReason.trim() || rejectPending}
              onClick={(e) => {
                e.preventDefault();
                onReject(rejectReason.trim());
                setRejectOpen(false);
              }}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={archiveOpen} onOpenChange={setArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive participant?</AlertDialogTitle>
            <AlertDialogDescription>
              Soft-removes this record from the active roster. Team assignment
              will be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={archivePending}
              onClick={(e) => {
                e.preventDefault();
                onArchive();
                setArchiveOpen(false);
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
