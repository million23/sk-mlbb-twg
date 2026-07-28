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
  validateCredentials,
  validateTeamDetails,
  validateTeamIntent,
  validateUploads,
  wizardStepsFor,
} from "@/lib/registration/flow";
import { cn } from "@/lib/utils";
import { Link, useNavigate } from "@tanstack/react-router";
import { Check, House } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ErrorBanner, NavRow, STEP_LABELS, StepBody } from "./steps";
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
    (tournamentId && openList.some((t) => t.id === tournamentId)
      ? tournamentId
      : undefined) ||
    openList[0]?.id ||
    undefined;
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
  const showTournamentPicker = openList.length > 1 && !submitted;

  useEffect(() => {
    if (!openTournaments.isSuccess || openList.length === 0) return;
    if (tournamentId && openList.some((t) => t.id === tournamentId)) return;
    const fallback = openList[0]?.id;
    if (!fallback) return;
    void navigate({
      to: "/register",
      search: { tournament: fallback },
      replace: true,
    });
  }, [navigate, openList, openTournaments.isSuccess, tournamentId]);

  useEffect(() => {
    if (!tournamentRecord?.id) return;
    dispatch({
      type: "HYDRATE",
      patch: {
        tournament_id: tournamentRecord.id,
        tournament_day: tournamentRecord.tournament_day,
        registration_open: tournamentRecord.registration_open,
        listed_teams: listedTeams ?? [],
      },
    });
  }, [dispatch, tournamentRecord, listedTeams]);

  const selectTournament = (id: string) => {
    if (!id || id === selectedId) {
      setPickerOpen(false);
      return;
    }
    if (!openList.some((t) => t.id === id)) return;
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
        ? "consent"
        : state.step;
  const activeIdx = wizard.indexOf(focusStep);

  const loading =
    openTournaments.isLoading ||
    (!!selectedId && tournament.isLoading) ||
    (!!selectedId && teams.isLoading);

  const bootError =
    openTournaments.error || tournament.error || teams.error
      ? registrationApiErrorMessage(
          openTournaments.error || tournament.error || teams.error,
        )
      : !loading && !selectedId
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
    if (state.step !== "uploads") return;
    const err =
      canAdvance(state) ??
      validateCredentials(state) ??
      validateTeamIntent(state) ??
      validateTeamDetails(state) ??
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
      const record = await submit.mutateAsync({
        draft: state,
        turnstileToken,
        website: honeypot,
      });
      dispatch({
        type: "SUBMIT_SUCCESS",
        statusCode: record.registration_status_code ?? null,
      });
    } catch (error) {
      setTurnstileToken(null);
      dispatch({
        type: "SET_LAST_ERROR",
        message: registrationApiErrorMessage(error),
      });
    }
  };

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <div className="flex flex-1 flex-col px-4 py-6 sm:px-6 md:items-center md:justify-center md:py-10">
        <div className="flex w-full max-w-2xl flex-col gap-6">
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-[0.65rem] text-primary uppercase tracking-[0.2em]">
                Public registration
              </p>
              <h1 className="font-serif text-2xl tracking-tight">
                Register for the tournament
              </h1>
              {tournament.data?.title ? (
                <p className="mt-1 text-muted-foreground text-sm">
                  {tournament.data.title}
                </p>
              ) : null}
              {showTournamentPicker ? (
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
          ) : (
            <>
              <ol className="flex flex-wrap gap-1">
                {wizard.map((step, i) => {
                  const done = activeIdx > i || state.step === "approved";
                  const current =
                    focusStep === step ||
                    (step === "pending" &&
                      (state.step === "approved" || state.step === "rejected"));
                  return (
                    <li
                      key={step}
                      className={`rounded-full px-3 py-1 font-mono text-[0.65rem] uppercase tracking-wider ${
                        current
                          ? "bg-primary text-primary-foreground"
                          : done
                            ? "bg-muted text-foreground"
                            : "bg-muted/40 text-muted-foreground"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")} {STEP_LABELS[step]}
                    </li>
                  );
                })}
              </ol>

              <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6">
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
                <div className="flex flex-col gap-4">
                  <StepBody state={state} dispatch={dispatch} />
                  {state.step === "uploads" ? (
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
                      state.step === "uploads" &&
                      isTurnstileConfigured() &&
                      !turnstileToken
                    }
                  />
                </div>
              </div>
            </>
          )}
        </div>
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
          <ul
            data-modal-enter="fade"
            className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 py-4 sm:px-6"
          >
            {openList.map((t) => {
              const id = t.id;
              if (!id) return null;
              const active = id === selectedId;
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => selectTournament(id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                      active
                        ? "border-primary/40 bg-primary/10"
                        : "border-border/80 bg-background/60 hover:border-primary/30 hover:bg-muted/40",
                    )}
                  >
                    <span className="min-w-0 flex-1 truncate font-medium">
                      {tournamentOptionLabel(t)}
                    </span>
                    {active ? (
                      <Check
                        className="size-4 shrink-0 text-primary"
                        aria-hidden
                      />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </ResponsiveModalContent>
      </ResponsiveModal>
    </div>
  );
}
