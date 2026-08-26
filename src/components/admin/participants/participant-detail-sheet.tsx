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
import { HoldToConfirmButton } from "@/components/ui/hold-to-confirm-button";
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
  hasPurokEndorsement,
  TEAM_INTENT_LABELS,
} from "@/lib/admin/participant-approval";
import { ageOnTournamentDay, type ListedTeam } from "@/lib/registration/flow";
import { LANE_ROLE_LABELS } from "@/lib/legacy/lane-role-icons";
import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import type { TeamIntent } from "@/lib/registration/flow";
import {
  ArchiveRestore,
  Check,
  Pencil,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
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
  canManage = true,
  approvePending,
  rejectPending,
  archivePending,
  restorePending,
  formTeamPending,
  onApprove,
  onReject,
  onFormCreateTeam,
  onEdit,
  onArchive,
  onRestore,
}: {
  record: ParticipantsRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listedTeams: ListedTeam[];
  peers: ParticipantsRecord[];
  tournamentDay: string;
  teamNameById: Map<string, string>;
  canManage?: boolean;
  approvePending?: boolean;
  rejectPending?: boolean;
  archivePending?: boolean;
  restorePending?: boolean;
  formTeamPending?: boolean;
  onApprove: () => void;
  onReject: (reason: string) => void;
  onFormCreateTeam?: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
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
  const isArchived = Boolean(view.archived);

  const isPending = view.registration_status === "pending";
  const endorsementOnFile = hasPurokEndorsement(view);
  const approveWithoutEndorsement = isPending && !endorsementOnFile;
  const intent = (view.team_intent ?? "open_matching") as TeamIntent;
  const canFormCreateTeam =
    canManage &&
    intent === "create_team" &&
    view.registration_status === "approved" &&
    Boolean(view.preferred_team_name?.trim()) &&
    !view.team &&
    Boolean(onFormCreateTeam);
  const canAssignJoinTeam =
    canManage &&
    intent === "join_team" &&
    view.registration_status === "approved" &&
    Boolean(view.preferred_team?.trim()) &&
    !view.team &&
    Boolean(onFormCreateTeam);
  const blockReason = isPending
    ? committeeApproveBlockReason(view, listedTeams, peers, tournamentDay)
    : null;
  const age = ageOnTournamentDay(view.birthdate, tournamentDay);
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
              <RegistrationStatusBadge
                status={view.registration_status}
                hasPurokEndorsement={endorsementOnFile}
              />
              <span className="text-muted-foreground">IGN {view.ign}</span>
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
                value={(() => {
                  const lanes: string[] = view.preferred_roles?.length
                    ? (view.preferred_roles as unknown as string[])
                    : view.preferred_lane
                      ? [view.preferred_lane as unknown as string]
                      : [];
                  return lanes.length
                    ? lanes
                        .map(
                          (l) =>
                            LANE_ROLE_LABELS[
                              l as keyof typeof LANE_ROLE_LABELS
                            ] ?? l,
                        )
                        .join(", ")
                    : "—";
                })()}
              />
              <DetailRow
                label="Team intent"
                value={TEAM_INTENT_LABELS[intent]}
              />
              {intent === "open_matching" ? (
                <DetailRow
                  label="Matching"
                  value="Unassigned until Auto teams on the Teams page"
                />
              ) : (
                <DetailRow
                  label={
                    intent === "join_team" ? "Preferred team" : "Team name"
                  }
                  value={preferredTeamLabel}
                />
              )}
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
            {approveWithoutEndorsement && !blockReason ? (
              <output className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-pretty">
                No purok endorsement on file. Approve is conditional. They must
                present it at the tournament.
              </output>
            ) : null}
            {view.registration_status === "approved" && !endorsementOnFile ? (
              <output className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-sm text-pretty">
                Conditional approval. Present purok endorsement at the
                tournament.
              </output>
            ) : null}
          </div>

          {canManage ? (
            <SheetFooter className="border-t border-border sm:flex-col">
              {isArchived ? (
                <Button
                  type="button"
                  disabled={restorePending}
                  onClick={onRestore}
                >
                  <ArchiveRestore className="size-4" />
                  {restorePending ? "Restoring…" : "Restore participant"}
                </Button>
              ) : null}
              {!isArchived && isPending ? (
                <div className="flex w-full flex-col gap-2">
                  {approveWithoutEndorsement ? (
                    <HoldToConfirmButton
                      variant="default"
                      disabled={Boolean(blockReason) || approvePending}
                      holdLabel="Hold to approve…"
                      onConfirm={onApprove}
                    >
                      <Check className="size-4" />
                      Approve without endorsement
                    </HoldToConfirmButton>
                  ) : (
                    <Button
                      type="button"
                      disabled={Boolean(blockReason) || approvePending}
                      onClick={onApprove}
                    >
                      <Check className="size-4" />
                      Approve
                    </Button>
                  )}
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
              {!isArchived && canAssignJoinTeam ? (
                <Button
                  type="button"
                  disabled={formTeamPending}
                  onClick={onFormCreateTeam}
                >
                  <UsersRound className="size-4" />
                  {formTeamPending ? "Assigning…" : "Assign to preferred team"}
                </Button>
              ) : null}
              {!isArchived && canFormCreateTeam ? (
                <Button
                  type="button"
                  disabled={formTeamPending}
                  onClick={onFormCreateTeam}
                >
                  <UsersRound className="size-4" />
                  {formTeamPending
                    ? "Forming team…"
                    : "Form team from preferred name"}
                </Button>
              ) : null}
              {!isArchived ? (
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
              ) : null}
            </SheetFooter>
          ) : null}
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
            <HoldToConfirmButton
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={!rejectReason.trim() || rejectPending}
              holdLabel="Hold to reject…"
              onConfirm={() => {
                onReject(rejectReason.trim());
                setRejectOpen(false);
              }}
            >
              Reject
            </HoldToConfirmButton>
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
