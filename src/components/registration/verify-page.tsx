import { RegistrationStatusBadge } from "@/components/admin/participants/registration-status-badge";
import { LandingShell } from "@/components/landing/shell";
import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Skeleton } from "@/components/ui/skeleton";
import {
  isValidStatusCode,
  normalizeStatusCode,
  useRegistrationStatus,
  type RegistrationStatusReceipt,
} from "@/hooks/registration";
import { TEAM_INTENT_LABELS } from "@/lib/admin/participant-approval";
import { LANE_ROLE_LABELS } from "@/lib/legacy/lane-role-icons";
import { formatParticipantNameDisplay } from "@/lib/legacy/participant-normalize";
import { calendarDayFromPbDate, normalizePbDateString } from "@/lib/legacy/registered-date";
import type { TeamIntent } from "@/lib/registration/flow";
import { cn } from "@/lib/utils";
import type { PlayerRole } from "@/types/__pocketbase-types";
import { Link, useNavigate } from "@tanstack/react-router";
import { format, isValid, parseISO } from "date-fns";
import { House, Search } from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";

type VerifyPageProps = {
  /** Prefill from `?code=` */
  initialCode?: string;
};

function formatWhen(iso?: string): string {
  if (!iso?.trim()) return "—";
  const d = parseISO(normalizePbDateString(iso));
  if (!isValid(d)) return iso;
  return format(d, "MMM d, yyyy · h:mm a");
}

function formatBirthdate(iso?: string): string {
  const day = calendarDayFromPbDate(iso);
  if (!day) return iso?.trim() || "—";
  const d = parseISO(day);
  if (!isValid(d)) return iso ?? "—";
  return format(d, "MMM d, yyyy");
}

function homeAddress(r: RegistrationStatusReceipt): string {
  if (!r.address_phase) return "—";
  return `Phase ${r.address_phase} Package ${r.address_package} Block ${r.address_block} Lot ${r.address_lot}`;
}

function ReceiptRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-0.5 border-b border-border/50 py-3 last:border-b-0 sm:grid-cols-[10rem_1fr] sm:gap-4">
      <dt className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.16em]">
        {label}
      </dt>
      <dd className="text-sm text-pretty wrap-break-word">{value || "—"}</dd>
    </div>
  );
}

function ReceiptSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border/70 bg-background/70 px-4 py-2 backdrop-blur-sm sm:px-5">
      <h2 className="pt-3 font-mono text-[0.65rem] text-primary uppercase tracking-[0.22em]">
        {title}
      </h2>
      <dl>{children}</dl>
    </section>
  );
}

function statusCopy(status: string): { title: string; body: string } {
  if (status === "approved") {
    return {
      title: "Registration approved",
      body: "You’re cleared as a participant. Watch for team and schedule updates from the committee.",
    };
  }
  if (status === "rejected") {
    return {
      title: "Registration rejected",
      body: "The committee could not approve this registration.",
    };
  }
  return {
    title: "In the review queue",
    body: "The SK committee is still checking your credentials and documents.",
  };
}

export function VerifyPage({ initialCode = "" }: VerifyPageProps) {
  const navigate = useNavigate({ from: "/verify" });
  const [input, setInput] = useState(() => normalizeStatusCode(initialCode));
  const [lookupCode, setLookupCode] = useState(() =>
    isValidStatusCode(initialCode) ? normalizeStatusCode(initialCode) : "",
  );

  useEffect(() => {
    const next = normalizeStatusCode(initialCode);
    setInput(next);
    if (isValidStatusCode(next)) {
      setLookupCode(next);
    }
  }, [initialCode]);

  const query = useRegistrationStatus(lookupCode, Boolean(lookupCode));
  const receipt =
    query.data?.found && query.data.receipt ? query.data.receipt : null;
  const notFound =
    Boolean(lookupCode) &&
    query.isSuccess &&
    query.data?.found === false;

  const runLookup = (raw: string) => {
    const code = normalizeStatusCode(raw);
    setInput(code);
    if (!isValidStatusCode(code)) return;
    setLookupCode(code);
    void navigate({
      search: (prev) => ({ ...prev, code }),
      replace: true,
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    runLookup(input);
  };

  const copy = receipt
    ? statusCopy(receipt.registration_status)
    : null;

  const intent = (receipt?.team_intent || "open_matching") as TeamIntent;
  const lanes = receipt?.preferred_lane as PlayerRole[] | undefined;

  return (
    <LandingShell>
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_0%_0%,color-mix(in_oklch,var(--primary)_16%,transparent),transparent_55%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_20%,color-mix(in_oklch,var(--primary)_10%,transparent),transparent_50%)]" />
        </div>

        <div className="relative mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:px-12">
          <header className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.24em]">
              Verify registration
            </p>
            <h1 className="text-balance font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
              Check your status code
            </h1>
            <p className="max-w-xl text-muted-foreground text-sm text-pretty leading-relaxed sm:text-base">
              Enter the 6-digit code from your confirmation email or the
              registration success screen. Documents stay private — this receipt
              shows your submitted details and committee status.
            </p>
          </header>

          <form
            onSubmit={onSubmit}
            className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background/70 p-4 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-2 duration-500 sm:p-5"
            style={{ animationDelay: "70ms" }}
          >
            <div className="flex flex-col gap-2">
              <label
                htmlFor="status-code"
                className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-[0.16em]"
              >
                Status code
              </label>
              <InputOTP
                id="status-code"
                name="code"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                value={input}
                onChange={(value) => {
                  const code = normalizeStatusCode(value);
                  setInput(code);
                  if (isValidStatusCode(code)) runLookup(code);
                }}
                containerClassName="w-full justify-between gap-1.5 sm:justify-center sm:gap-2"
                aria-invalid={
                  input.length > 0 && !isValidStatusCode(input)
                    ? true
                    : undefined
                }
                disabled={query.isFetching}
              >
                <InputOTPGroup className="w-full justify-between gap-1.5 sm:w-auto sm:justify-center sm:gap-2">
                  {[0, 1, 2, 3, 4, 5].map((slot) => (
                    <InputOTPSlot
                      key={`otp-slot-${slot}`}
                      index={slot}
                      className="size-11 flex-1 rounded-xl border border-input font-mono text-lg first:rounded-xl first:border-l last:rounded-xl sm:size-12 sm:flex-none"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
              {input.length > 0 && !isValidStatusCode(input) ? (
                <p className="text-destructive text-xs">
                  Enter all 6 digits to look up.
                </p>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Paste or type your 6-digit code — lookup starts when complete.
                </p>
              )}
            </div>
            <Button
              type="submit"
              size="lg"
              className="w-full sm:w-auto sm:self-start"
              disabled={!isValidStatusCode(input) || query.isFetching}
            >
              <Search data-icon="inline-start" />
              {query.isFetching ? "Looking up…" : "Check status"}
            </Button>
          </form>

          {lookupCode && query.isLoading ? (
            <div className="flex flex-col gap-3">
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ) : null}

          {query.isError ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-4 text-sm">
              <p className="font-medium text-destructive">Lookup failed</p>
              <p className="mt-1 text-muted-foreground text-pretty">
                {query.error instanceof Error
                  ? query.error.message
                  : "Could not reach the status service. Try again."}
              </p>
            </div>
          ) : null}

          {notFound ? (
            <div className="rounded-2xl border border-border/70 bg-muted/30 px-4 py-5 text-center">
              <p className="font-heading font-semibold tracking-tight">
                No registration for that code
              </p>
              <p className="mt-1 text-muted-foreground text-sm text-pretty">
                Double-check the 6 digits from your email. Codes are unique per
                registration.
              </p>
            </div>
          ) : null}

          {receipt && copy ? (
            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div
                className={cn(
                  "rounded-2xl border px-5 py-5",
                  receipt.registration_status === "approved" &&
                    "border-success/35 bg-success/6",
                  receipt.registration_status === "rejected" &&
                    "border-destructive/35 bg-destructive/6",
                  receipt.registration_status === "pending" &&
                    "border-warning/35 bg-warning/6",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <RegistrationStatusBadge
                    status={receipt.registration_status}
                  />
                  <span className="font-mono text-xs text-muted-foreground tracking-wider">
                    {receipt.registration_status_code}
                  </span>
                </div>
                <h2 className="mt-3 font-heading text-2xl font-semibold tracking-tight">
                  {copy.title}
                </h2>
                <p className="mt-1 text-muted-foreground text-sm text-pretty">
                  {receipt.registration_status === "rejected" &&
                  receipt.registration_reject_reason.trim()
                    ? receipt.registration_reject_reason
                    : copy.body}
                </p>
                {receipt.tournament_title ? (
                  <p className="mt-3 text-sm">
                    <span className="text-muted-foreground">Tournament · </span>
                    <span className="font-medium">{receipt.tournament_title}</span>
                  </p>
                ) : null}
              </div>

              <ReceiptSection title="Identity">
                <ReceiptRow
                  label="Name"
                  value={formatParticipantNameDisplay(receipt.name)}
                />
                <ReceiptRow label="Email" value={receipt.email} />
                <ReceiptRow
                  label="Contact"
                  value={receipt.contact_number || "—"}
                />
                <ReceiptRow
                  label="Birthdate"
                  value={formatBirthdate(receipt.birthdate)}
                />
                <ReceiptRow label="Home address" value={homeAddress(receipt)} />
              </ReceiptSection>

              <ReceiptSection title="Game account">
                <ReceiptRow label="IGN" value={receipt.ign} />
                <ReceiptRow label="User ID" value={receipt.user_id} />
                <ReceiptRow label="Server ID" value={receipt.server_id} />
                <ReceiptRow
                  label="Preferred lanes"
                  value={
                    lanes && lanes.length > 0
                      ? lanes.map((l) => l in LANE_ROLE_LABELS ? LANE_ROLE_LABELS[l] : l).join(", ")
                      : "—"
                  }
                />
              </ReceiptSection>

              <ReceiptSection title="Team">
                <ReceiptRow
                  label="Intent"
                  value={
                    intent in TEAM_INTENT_LABELS
                      ? TEAM_INTENT_LABELS[intent]
                      : receipt.team_intent || "—"
                  }
                />
                {intent === "open_matching" ? (
                  <ReceiptRow
                    label="Matching"
                    value="Unassigned until committee runs Auto teams"
                  />
                ) : (
                  <ReceiptRow
                    label={intent === "join_team" ? "Preferred team" : "Team name"}
                    value={receipt.preferred_team_name || "—"}
                  />
                )}
                <ReceiptRow
                  label="Roster status"
                  value={receipt.status || "—"}
                />
              </ReceiptSection>

              <ReceiptSection title="Record">
                <ReceiptRow
                  label="Submitted"
                  value={formatWhen(receipt.created)}
                />
                <ReceiptRow
                  label="Consent"
                  value={
                    receipt.consent_version
                      ? `${receipt.consent_version}${
                          receipt.consent_accepted_at
                            ? ` · ${formatWhen(receipt.consent_accepted_at)}`
                            : ""
                        }`
                      : "—"
                  }
                />
              </ReceiptSection>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto"
              render={<Link to="/" />}
            >
              <House data-icon="inline-start" />
              Back to home
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto"
              render={<Link to="/register" />}
            >
              Register
            </Button>
          </div>
        </div>
      </main>
    </LandingShell>
  );
}
