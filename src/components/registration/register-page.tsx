import {
  ResponsiveModal,
  ResponsiveModalContent,
  ResponsiveModalDescription,
  ResponsiveModalHeader,
  ResponsiveModalTitle,
} from "@/components/ui/responsive-modal";
import {
  fetchRegistrationEmailAvailable,
  registrationApiErrorMessage,
  useListedTeams,
  useOpenRegistrationTournaments,
  useRegistrationTournament,
  useSubmitRegistration,
  type RegistrationTournament,
} from "@/hooks/registration";
import {
  canAdvance,
  validateAllRegistrants,
  validateCredentials,
  validateTeamDetails,
  validateTeamIntent,
  validateUploads,
  wizardStepsFor,
} from "@/lib/registration/flow";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { format, parseISO } from "date-fns";
import { Check, House } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";

import {
  ErrorBanner,
  NavRow,
  STEP_LABELS,
  StepBody,
  stepLabelFor,
} from "./steps";
import {
  isTurnstileConfigured,
  TurnstileField,
} from "./turnstile-field";
import { useRegistrationFlow } from "./use-registration-flow";

type RegisterPageProps = {
  tournamentId?: string;
};

function tournamentOptionLabel(t: RegistrationTournament): string {
  return t.title?.trim() || t.slug?.trim() || t.id || "Tournament";
}

function tournamentOptionDate(t: RegistrationTournament): string | null {
  const day = t.tournament_day?.trim();
  if (!day) return null;
  try {
    return format(parseISO(day), "MMM d, yyyy");
  } catch {
    return day;
  }
}

function RegistrationStepper({
  steps,
  activeIndex,
}: {
  steps: { id: string; label: string }[];
  activeIndex: number;
}) {
  return (
    <ol
      className="flex w-full min-w-0 flex-row items-center"
      aria-label="Registration progress"
    >
      {steps.map((step, i) => {
        const current = i === activeIndex;
        const done = i < activeIndex;
        const last = i === steps.length - 1;
        return (
          <Fragment key={step.id}>
            <li className="flex shrink-0">
              <span
                className={cn(
                  "flex h-9 items-center justify-center font-mono text-xs font-medium uppercase tracking-[0.1em] transition-[background-color,color,padding] duration-300 sm:h-10 sm:text-sm sm:tracking-[0.12em]",
                  current
                    ? "max-w-[7.5rem] truncate rounded-full bg-primary px-2.5 text-primary-foreground sm:max-w-none sm:px-4"
                    : "size-9 sm:size-10",
                  !current && done && "bg-muted text-foreground",
                  !current && !done && "bg-muted/40 text-muted-foreground",
                )}
                aria-current={current ? "step" : undefined}
                title={current ? step.label : undefined}
              >
                <span className="sr-only">
                  {current
                    ? `Current step: ${step.label}`
                    : `Step ${i + 1}: ${step.label}`}
                </span>
                <span aria-hidden className="truncate">
                  {current ? step.label : String(i + 1).padStart(2, "0")}
                </span>
              </span>
            </li>
            {!last ? (
              <li
                className={cn(
                  "mx-1 h-px min-w-0 flex-1 sm:mx-2",
                  done ? "bg-primary/45" : "bg-border/70",
                )}
                aria-hidden
              />
            ) : null}
          </Fragment>
        );
      })}
    </ol>
  );
}

/** Public registration — stepper wizard wired to Orval-backed hooks. */
export function RegisterPage({ tournamentId }: RegisterPageProps) {
  const navigate = useNavigate();
  const { state, dispatch } = useRegistrationFlow();
  const openTournaments = useOpenRegistrationTournaments();
  const openList = useMemo(
    () => (openTournaments.data ?? []).filter((t) => t.registration_open && t.id),
    [openTournaments.data],
  );
  const selectedId =
    tournamentId && openList.some((t) => t.id === tournamentId)
      ? tournamentId
      : undefined;
  /** Ask first when several are open; sole open tournament can skip the pick screen. */
  const needsTournamentPick =
    openTournaments.isSuccess && openList.length > 1 && !selectedId;
  const soleOpenId =
    openTournaments.isSuccess && openList.length === 1
      ? openList[0]?.id
      : undefined;
  const tournament = useRegistrationTournament(selectedId);
  const teams = useListedTeams(selectedId);
  const submit = useSubmitRegistration();
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const tournamentRecord = tournament.data;
  const listedTeams = teams.data;
  const submitted =
    state.step === "pending" ||
    state.step === "approved" ||
    state.step === "rejected";
  const showChangeTournament = openList.length > 1 && !submitted && !!selectedId;

  // One open tournament: land on it without a pick step.
  useEffect(() => {
    if (!soleOpenId || selectedId) return;
    void navigate({
      to: "/register",
      search: { tournament: soleOpenId },
      replace: true,
    });
  }, [navigate, selectedId, soleOpenId]);

  useEffect(() => {
    if (!tournamentRecord?.id) return;
    dispatch({
      type: "HYDRATE",
      patch: {
        tournament_id: tournamentRecord.id,
        tournament_day: tournamentRecord.tournament_day,
        registration_open: tournamentRecord.registration_open,
        listed_teams: listedTeams ?? [],
        min_team_size: tournamentRecord.min_team_size ?? 5,
        max_team_size: tournamentRecord.max_team_size ?? 6,
      },
    });
  }, [dispatch, tournamentRecord, listedTeams]);

  const selectTournament = (id: string) => {
    if (!id) return;
    if (!openList.some((t) => t.id === id)) return;
    if (id === selectedId) {
      setPickerOpen(false);
      return;
    }
    dispatch({ type: "RESET_DRAFT" });
    setTurnstileToken(null);
    setPickerOpen(false);
    void navigate({
      to: "/register",
      search: { tournament: id },
      replace: true,
    });
  };

  const wizard = wizardStepsFor(state);
  const focusStep =
    state.step === "approved" || state.step === "rejected"
      ? "pending"
      : state.step === "closed"
        ? "team_intent"
        : state.step;
  const activeIdx = wizard.indexOf(focusStep);

  const loading =
    openTournaments.isLoading ||
    (!!selectedId && tournament.isLoading) ||
    (!!selectedId && teams.isLoading) ||
    (!!soleOpenId && !selectedId);

  const bootError =
    openTournaments.error || tournament.error || teams.error
      ? registrationApiErrorMessage(
          openTournaments.error || tournament.error || teams.error,
        )
      : !loading && !selectedId && !needsTournamentPick && openList.length === 0
        ? "No tournament is open for registration right now."
        : tournament.data && !tournament.data.registration_open
          ? "Registration is closed for this tournament."
          : null;

  const handleContinue = async () => {
    const localErr = canAdvance(state);
    if (localErr) {
      dispatch({ type: "SET_LAST_ERROR", message: localErr });
      return;
    }

    if (state.step === "credentials") {
      setCheckingEmail(true);
      try {
        const available = await fetchRegistrationEmailAvailable(
          state.tournament_id,
          state.credentials.email,
        );
        if (!available) {
          dispatch({
            type: "SET_LAST_ERROR",
            message:
              "This email already has a pending or approved registration for this tournament.",
          });
          return;
        }
      } catch {
        // Server guard still enforces on submit; allow continue if pre-check is down.
      } finally {
        setCheckingEmail(false);
      }
    }

    dispatch({ type: "NEXT" });
  };

  const handleSubmit = async () => {
    if (state.step !== "review") return;
    const err =
      canAdvance(state) ??
      validateTeamIntent(state) ??
      validateTeamDetails(state) ??
      validateAllRegistrants(state) ??
      validateCredentials(state) ??
      validateUploads(state);
    if (err) {
      dispatch({ type: "SET_LAST_ERROR", message: err });
      return;
    }
    if (!state.consent_accepted) {
      dispatch({ type: "SET_LAST_ERROR", message: "Consent required" });
      return;
    }
    if (isTurnstileConfigured() && !turnstileToken) {
      dispatch({
        type: "SET_LAST_ERROR",
        message: "Complete the human verification challenge.",
      });
      return;
    }
    try {
      const result = await submit.mutateAsync({
        draft: state,
        turnstileToken,
        website: honeypot,
      });
      if (result.failedIndex != null) {
        setTurnstileToken(null);
        dispatch({
          type: "SUBMIT_PARTIAL",
          submitted: result.submitted,
          failedIndex: result.failedIndex,
          message: registrationApiErrorMessage(result.error),
        });
        return;
      }
      dispatch({
        type: "SUBMIT_SUCCESS",
        statusCodes: result.submitted.map((s) => s.statusCode),
        submitted: result.submitted,
      });
    } catch (error) {
      setTurnstileToken(null);
      dispatch({
        type: "SET_LAST_ERROR",
        message: registrationApiErrorMessage(error),
      });
    }
  };

  const onReviewStep = state.step === "review";

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto flex w-full min-w-0 max-w-2xl flex-col gap-6 px-4 py-6 sm:px-6 md:py-8">
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.2em]">
                Public registration
              </p>
              <h1 className="font-serif text-2xl tracking-tight">
                {needsTournamentPick
                  ? "Choose a tournament"
                  : "Register for the tournament"}
              </h1>
              {tournament.data?.title ? (
                <p className="mt-1 text-muted-foreground text-sm">
                  {tournament.data.title}
                </p>
              ) : needsTournamentPick ? (
                <p className="mt-1 text-muted-foreground text-sm">
                  Several events are open — pick which one you’re registering for.
                </p>
              ) : null}
              {showChangeTournament ? (
                <button
                  type="button"
                  className="mt-1.5 text-left text-primary text-sm underline-offset-4 hover:underline"
                  onClick={() => setPickerOpen(true)}
                >
                  Change tournament
                </button>
              ) : null}
            </div>
            <Link
              to="/"
              className="inline-flex shrink-0 items-center gap-1.5 pt-1 text-muted-foreground text-sm hover:text-foreground"
            >
              <House className="size-4" aria-hidden />
              Home
            </Link>
          </header>

          {loading ? (
            <p className="text-muted-foreground text-sm">Loading registration…</p>
          ) : bootError ? (
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6">
              <p className="text-sm">{bootError}</p>
              <Link
                to="/"
                className="mt-4 inline-flex text-primary text-sm hover:underline"
              >
                Back to home
              </Link>
            </div>
          ) : needsTournamentPick ? (
            <>
              <RegistrationStepper
                activeIndex={0}
                steps={[
                  { id: "tournament", label: "Tournament" },
                  ...wizard.map((step) => ({
                    id: step,
                    label: stepLabelFor(step, state.team_intent),
                  })),
                ]}
              />
              <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6">
                <h2 className="mb-2 font-serif text-xl tracking-tight">
                  Tournament
                </h2>
                <p className="mb-4 text-muted-foreground text-sm">
                  Only events with open registration are listed.
                </p>
                <TournamentPickList
                  openList={openList}
                  selectedId={selectedId}
                  onSelect={selectTournament}
                />
              </div>
            </>
          ) : (
            <>
              <RegistrationStepper
                activeIndex={
                  activeIdx < 0
                    ? 0
                    : state.step === "approved" || state.step === "rejected"
                      ? wizard.length - 1
                      : activeIdx
                }
                steps={wizard.map((step) => ({
                  id: step,
                  label: stepLabelFor(step, state.team_intent),
                }))}
              />

              <div className="h-fit w-full rounded-3xl border border-border/80 bg-card p-5 sm:p-6">
                {state.step !== "pending" &&
                state.step !== "approved" &&
                state.step !== "rejected" ? (
                  <h2 className="mb-4 font-serif text-xl tracking-tight">
                    {state.step === "team_details"
                      ? state.team_intent === "create_team"
                        ? "Name your team"
                        : "Pick a team"
                      : STEP_LABELS[state.step]}
                  </h2>
                ) : null}
                <div className="flex h-fit flex-col gap-4">
                  <StepBody state={state} dispatch={dispatch} />
                  {onReviewStep ? (
                    <>
                      {/* Honeypot — leave empty (off-screen for bots that autofill) */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none fixed top-0 -left-2500 h-px w-px overflow-hidden opacity-0"
                      >
                        <label htmlFor="reg-website">Company website</label>
                        <input
                          id="reg-website"
                          name="website"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={honeypot}
                          onChange={(e) => setHoneypot(e.target.value)}
                        />
                      </div>
                      <TurnstileField onToken={setTurnstileToken} />
                    </>
                  ) : null}
                  <ErrorBanner state={state} />
                  <NavRow
                    state={state}
                    dispatch={dispatch}
                    onContinue={handleContinue}
                    onSubmit={handleSubmit}
                    submitting={submit.isPending || checkingEmail}
                    submitDisabled={
                      onReviewStep &&
                      isTurnstileConfigured() &&
                      !turnstileToken
                    }
                  />
                </div>
              </div>
            </>
          )}
      </div>

      <ResponsiveModal open={pickerOpen} onOpenChange={setPickerOpen}>
        <ResponsiveModalContent className="flex max-h-[min(85svh,40rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 sm:max-w-lg">
          <ResponsiveModalHeader
            data-modal-enter="from-top"
            className="shrink-0 border-b border-border/70 px-5 py-4 sm:px-6"
          >
            <ResponsiveModalTitle className="font-serif text-xl tracking-tight">
              Choose a tournament
            </ResponsiveModalTitle>
            <ResponsiveModalDescription>
              Only events with open registration are listed. Switching clears
              your current form progress.
            </ResponsiveModalDescription>
          </ResponsiveModalHeader>
          <div data-modal-enter="fade" className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
            <TournamentPickList
              openList={openList}
              selectedId={selectedId}
              onSelect={selectTournament}
            />
          </div>
        </ResponsiveModalContent>
      </ResponsiveModal>
    </div>
  );
}

function TournamentPickList({
  openList,
  selectedId,
  onSelect,
}: {
  openList: RegistrationTournament[];
  selectedId: string | undefined;
  onSelect: (id: string) => void;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {openList.map((t) => {
        const id = t.id;
        if (!id) return null;
        const active = id === selectedId;
        const dayLabel = tournamentOptionDate(t);
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onSelect(id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                active
                  ? "border-primary/40 bg-primary/10"
                  : "border-border/80 bg-background/60 hover:border-primary/30 hover:bg-muted/40",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {tournamentOptionLabel(t)}
                </span>
                {dayLabel ? (
                  <span className="mt-0.5 block text-muted-foreground text-sm">
                    Tournament day · {dayLabel}
                  </span>
                ) : null}
              </span>
              {active ? (
                <Check className="size-4 shrink-0 text-primary" aria-hidden />
              ) : null}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
