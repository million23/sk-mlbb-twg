/**
 * Public registration flow state machine:
 * window → consent → credentials → team intent → (team details) → uploads →
 * pending → approve/reject — with age, phase, email uniqueness, and Phase-9
 * team rules. Team details is only used for join / create intents.
 */

export const ELIGIBLE_PHASES = ["4", "9", "10"] as const;
export const LANES = ["mid", "gold", "exp", "support", "jungle"] as const;
export const TEAM_INTENTS = [
	"open_matching",
	"join_team",
	"create_team",
] as const;
export const CONSENT_VERSION = "sk-ta-2026-07";

export type EligiblePhase = (typeof ELIGIBLE_PHASES)[number];
export type Lane = (typeof LANES)[number];
export type TeamIntent = (typeof TEAM_INTENTS)[number];

export type FlowStep =
	| "closed"
	| "consent"
	| "credentials"
	| "team_intent"
	| "team_details"
	| "uploads"
	| "pending"
	| "approved"
	| "rejected";

export type Credentials = {
	name: string;
	email: string;
	ign: string;
	birthdate: string; // YYYY-MM-DD
	user_id: string;
	server_id: string;
	/** Draft may hold invalid phases so validation can reject them. */
	address_phase: string;
	address_package: string;
	address_block: string;
	address_lot: string;
	preferred_lane: Lane | "";
	contact_number: string;
};

export type Uploads = {
	school_id_front: File | null;
	school_id_back: File | null;
	purok_endorsement: File | null;
};

export type ListedTeam = {
	id: string;
	name: string;
	/** Phases of residents already on / committed to this team */
	member_phases: EligiblePhase[];
};

export type StoredRegistration = {
	id: string;
	tournament_id: string;
	email: string;
	registration_status: "pending" | "approved" | "rejected";
	address_phase: EligiblePhase;
	team_intent: TeamIntent;
	preferred_team?: string;
	preferred_team_name?: string;
};

export type RegistrationDraft = {
	step: FlowStep;
	tournament_id: string;
	tournament_day: string; // YYYY-MM-DD — age checked against this
	registration_open: boolean;
	consent_accepted: boolean;
	consent_version: string | null;
	consent_accepted_at: string | null;
	credentials: Credentials;
	team_intent: TeamIntent | null;
	preferred_team: string | null;
	preferred_team_name: string;
	uploads: Uploads;
	registration_status: "pending" | "approved" | "rejected" | null;
	registration_status_code: string | null;
	registration_reject_reason: string;
	last_error: string | null;
	/** In-memory peers for uniqueness / Phase-9 checks (not persisted) */
	existing: StoredRegistration[];
	listed_teams: ListedTeam[];
};

export function needsTeamDetails(intent: TeamIntent | null): boolean {
	return intent === "join_team" || intent === "create_team";
}

/** Stepper steps for the current draft (team details only when needed). */
export function wizardStepsFor(state: RegistrationDraft): FlowStep[] {
	const steps: FlowStep[] = ["consent", "credentials", "team_intent"];
	if (needsTeamDetails(state.team_intent)) steps.push("team_details");
	steps.push("uploads", "pending");
	return steps;
}

export type Action =
	| { type: "TOGGLE_WINDOW" }
	| { type: "ACCEPT_CONSENT" }
	| { type: "BACK" }
	| { type: "NEXT" }
	| { type: "SET_CREDENTIALS"; patch: Partial<Credentials> }
	| { type: "LOAD_PRESET"; preset: CredentialPreset }
	| { type: "SET_TEAM_INTENT"; intent: TeamIntent }
	| { type: "SET_PREFERRED_TEAM"; teamId: string }
	| { type: "SET_PREFERRED_TEAM_NAME"; name: string }
	| { type: "SET_UPLOAD"; file: keyof Uploads; value: File | null }
	| { type: "HYDRATE"; patch: Partial<RegistrationDraft> }
	| { type: "SET_LAST_ERROR"; message: string | null }
	| { type: "SUBMIT_SUCCESS"; statusCode?: string | null }
	| { type: "APPROVE" }
	| { type: "REJECT"; reason: string }
	| { type: "RESET_DRAFT" }
	| { type: "SEED_EXISTING_EMAIL"; email: string };

export type CredentialPreset =
	| "valid_phase9"
	| "valid_phase4"
	| "underage"
	| "bad_phase"
	| "duplicate_email";

const emptyCredentials = (): Credentials => ({
	name: "",
	email: "",
	ign: "",
	birthdate: "",
	user_id: "",
	server_id: "",
	address_phase: "",
	address_package: "",
	address_block: "",
	address_lot: "",
	preferred_lane: "",
	contact_number: "",
});

export function createInitialState(
	overrides: Partial<RegistrationDraft> = {},
): RegistrationDraft {
	return {
		step: "consent",
		tournament_id: "",
		tournament_day: "",
		registration_open: false,
		consent_accepted: false,
		consent_version: null,
		consent_accepted_at: null,
		credentials: emptyCredentials(),
		team_intent: "open_matching",
		preferred_team: null,
		preferred_team_name: "",
		uploads: {
			school_id_front: null,
			school_id_back: null,
			purok_endorsement: null,
		},
		registration_status: null,
		registration_status_code: null,
		registration_reject_reason: "",
		last_error: null,
		existing: [],
		listed_teams: [],
		...overrides,
	};
}

export function ageOnTournamentDay(
	birthdate: string,
	tournamentDay: string,
): number | null {
	if (!birthdate || !tournamentDay) return null;
	const birth = new Date(`${birthdate}T00:00:00`);
	const day = new Date(`${tournamentDay}T00:00:00`);
	if (Number.isNaN(birth.getTime()) || Number.isNaN(day.getTime())) return null;
	let age = day.getFullYear() - birth.getFullYear();
	const m = day.getMonth() - birth.getMonth();
	if (m < 0 || (m === 0 && day.getDate() < birth.getDate())) age -= 1;
	return age;
}

export function validateCredentials(state: RegistrationDraft): string | null {
	const c = state.credentials;
	if (!c.name.trim()) return "Name is required";
	if (!c.email.trim() || !c.email.includes("@")) return "Valid email is required";
	if (!c.ign.trim()) return "IGN is required";
	if (!c.birthdate) return "Birthdate is required";
	if (!c.user_id.trim()) return "User ID is required";
	if (!c.server_id.trim()) return "Server ID is required";
	if (!c.address_phase) return "Phase is required";
	if (!(ELIGIBLE_PHASES as readonly string[]).includes(c.address_phase)) {
		return "Phase must be 4, 9, or 10";
	}
	if (!c.address_package.trim()) return "Package is required";
	if (!c.address_block.trim()) return "Block is required";
	if (!c.address_lot.trim()) return "Lot is required";
	if (!c.preferred_lane) return "Preferred lane is required";

	if (!state.tournament_day) {
		return "Tournament date is missing — set start_at on the tournament in PocketBase";
	}
	const age = ageOnTournamentDay(c.birthdate, state.tournament_day);
	if (age === null) return "Invalid birthdate";
	if (age < 15) {
		return `Must be 15+ on tournament day (age on ${state.tournament_day}: ${age})`;
	}

	const emailTaken = state.existing.some(
		(r) =>
			r.tournament_id === state.tournament_id &&
			r.email.toLowerCase() === c.email.toLowerCase() &&
			(r.registration_status === "pending" ||
				r.registration_status === "approved"),
	);
	if (emailTaken) {
		return "This email already has a pending or approved registration for this tournament";
	}

	return null;
}

/** Choice only — join/create details are validated on `team_details`. */
export function validateTeamIntent(state: RegistrationDraft): string | null {
	if (!state.team_intent) return "Choose a team intent";
	return null;
}

export function validateTeamDetails(state: RegistrationDraft): string | null {
	if (!state.team_intent) return "Choose a team intent";

	if (state.team_intent === "open_matching") return null;

	if (state.team_intent === "join_team") {
		if (!state.preferred_team) return "Pick a listed team to join";
		const team = state.listed_teams.find((t) => t.id === state.preferred_team);
		if (!team) return "Unknown team";
		const registrantPhase = state.credentials.address_phase;
		// Empty member_phases means API has not exposed roster phases yet — defer to server.
		const hasPhase9 =
			team.member_phases.length === 0 ||
			team.member_phases.includes("9") ||
			registrantPhase === "9";
		if (!hasPhase9) {
			return `Phase-9 team rule: "${team.name}" has no Phase-9 resident and you are Phase ${registrantPhase}`;
		}
	}

	if (state.team_intent === "create_team") {
		if (!state.preferred_team_name.trim()) {
			return "Team name is required when creating a team";
		}
		if (state.credentials.address_phase !== "9") {
			return "Phase-9 team rule: creator must be Phase 9 (no other members yet)";
		}
	}

	return null;
}

const UPLOAD_MAX_BYTES = 5 * 1024 * 1024;
const UPLOAD_OK_TYPES = new Set([
	"image/jpeg",
	"image/png",
	"image/webp",
	"image/heic",
	"image/heif",
	"application/pdf",
]);

export function validateUploadFile(file: File): string | null {
	if (file.size <= 0) return "File is empty";
	if (file.size > UPLOAD_MAX_BYTES) return "File must be 5 MiB or smaller";
	if (file.type && !UPLOAD_OK_TYPES.has(file.type)) {
		return "Use JPG, PNG, WebP, HEIC, or PDF";
	}
	return null;
}

export function validateUploads(state: RegistrationDraft): string | null {
	const u = state.uploads;
	if (!u.school_id_front) return "School ID front is required";
	if (!u.school_id_back) return "School ID back is required";
	if (!u.purok_endorsement) return "Purok endorsement is required";
	for (const [key, file] of Object.entries(u) as [keyof Uploads, File | null][]) {
		if (!file) continue;
		const err = validateUploadFile(file);
		if (err) return `${key.replaceAll("_", " ")}: ${err}`;
	}
	return null;
}

export function canAdvance(state: RegistrationDraft): string | null {
	if (!state.registration_open) return "Registration window is closed";
	switch (state.step) {
		case "consent":
			return state.consent_accepted ? null : "Accept consent (T&A) first";
		case "credentials":
			return validateCredentials(state);
		case "team_intent":
			return validateTeamIntent(state);
		case "team_details":
			return validateTeamDetails(state);
		case "uploads":
			return validateUploads(state);
		default:
			return "Cannot advance from this step";
	}
}

const PRESETS: Record<CredentialPreset, Partial<Credentials>> = {
	valid_phase9: {
		name: "Juan Dela Cruz",
		email: "juan@example.com",
		ign: "JuanML",
		birthdate: "2008-01-10",
		user_id: "123456789",
		server_id: "2001",
		address_phase: "9",
		address_package: "2",
		address_block: "14",
		address_lot: "3",
		preferred_lane: "jungle",
		contact_number: "09171234567",
	},
	valid_phase4: {
		name: "Maria Santos",
		email: "maria@example.com",
		ign: "MariaGold",
		birthdate: "2007-05-20",
		user_id: "987654321",
		server_id: "2001",
		address_phase: "4",
		address_package: "1",
		address_block: "5",
		address_lot: "8",
		preferred_lane: "gold",
		contact_number: "09181234567",
	},
	underage: {
		name: "Young Player",
		email: "young@example.com",
		ign: "TooYoung",
		birthdate: "2013-01-01",
		user_id: "111",
		server_id: "2001",
		address_phase: "9",
		address_package: "1",
		address_block: "1",
		address_lot: "1",
		preferred_lane: "mid",
	},
	bad_phase: {
		name: "Outside Phase",
		email: "outside@example.com",
		ign: "Outsider",
		birthdate: "2006-03-03",
		user_id: "222",
		server_id: "2001",
		address_phase: "" as EligiblePhase | "",
		address_package: "1",
		address_block: "1",
		address_lot: "1",
		preferred_lane: "exp",
	},
	duplicate_email: {
		name: "Taken Email",
		email: "taken@example.com",
		ign: "TakenIGN",
		birthdate: "2005-06-06",
		user_id: "333",
		server_id: "2001",
		address_phase: "10",
		address_package: "3",
		address_block: "7",
		address_lot: "2",
		preferred_lane: "support",
	},
};

function nextStep(state: RegistrationDraft): FlowStep | null {
	switch (state.step) {
		case "consent":
			return "credentials";
		case "credentials":
			return "team_intent";
		case "team_intent":
			return needsTeamDetails(state.team_intent)
				? "team_details"
				: "uploads";
		case "team_details":
			return "uploads";
		default:
			return null;
	}
}

function prevStep(state: RegistrationDraft): FlowStep | null {
	switch (state.step) {
		case "credentials":
			return "consent";
		case "team_intent":
			return "credentials";
		case "team_details":
			return "team_intent";
		case "uploads":
			return needsTeamDetails(state.team_intent)
				? "team_details"
				: "team_intent";
		default:
			return null;
	}
}

export function reduce(
	state: RegistrationDraft,
	action: Action,
): RegistrationDraft {
	const clearErr = (s: RegistrationDraft): RegistrationDraft => ({
		...s,
		last_error: null,
	});

	switch (action.type) {
		case "TOGGLE_WINDOW": {
			const open = !state.registration_open;
			return {
				...state,
				registration_open: open,
				step: open
					? state.step === "closed"
						? "consent"
						: state.step
					: "closed",
				last_error: open ? null : "Registration window closed",
			};
		}

		case "ACCEPT_CONSENT": {
			if (!state.registration_open) {
				return { ...state, last_error: "Registration window is closed" };
			}
			if (state.step !== "consent") {
				return { ...state, last_error: "Consent only on consent step" };
			}
			return clearErr({
				...state,
				consent_accepted: true,
				consent_version: CONSENT_VERSION,
				consent_accepted_at: new Date().toISOString(),
			});
		}

		case "BACK": {
			const prev = prevStep(state);
			if (!prev) return { ...state, last_error: "Already at first step" };
			return clearErr({ ...state, step: prev });
		}

		case "NEXT": {
			const err = canAdvance(state);
			if (err) return { ...state, last_error: err };
			const n = nextStep(state);
			if (!n) return { ...state, last_error: "Use submit from uploads" };
			return clearErr({ ...state, step: n });
		}

		case "SET_CREDENTIALS":
			return clearErr({
				...state,
				credentials: { ...state.credentials, ...action.patch },
			});

		case "LOAD_PRESET": {
			const patch = { ...PRESETS[action.preset] };
			if (action.preset === "bad_phase") patch.address_phase = "7";
			return clearErr({
				...state,
				credentials: { ...state.credentials, ...patch },
			});
		}

		case "SET_TEAM_INTENT":
			return clearErr({
				...state,
				team_intent: action.intent,
				preferred_team:
					action.intent === "join_team" ? state.preferred_team : null,
				preferred_team_name:
					action.intent === "create_team" ? state.preferred_team_name : "",
			});

		case "SET_PREFERRED_TEAM":
			return clearErr({ ...state, preferred_team: action.teamId });

		case "SET_PREFERRED_TEAM_NAME":
			return clearErr({ ...state, preferred_team_name: action.name });

		case "SET_UPLOAD":
			return clearErr({
				...state,
				uploads: {
					...state.uploads,
					[action.file]: action.value,
				},
			});

		case "HYDRATE":
			return clearErr({
				...state,
				...action.patch,
				credentials: action.patch.credentials
					? { ...state.credentials, ...action.patch.credentials }
					: state.credentials,
				uploads: action.patch.uploads
					? { ...state.uploads, ...action.patch.uploads }
					: state.uploads,
			});

		case "SET_LAST_ERROR":
			return { ...state, last_error: action.message };

		case "SUBMIT_SUCCESS":
			return clearErr({
				...state,
				step: "pending",
				registration_status: "pending",
				registration_status_code:
					action.statusCode?.trim() || state.registration_status_code,
				registration_reject_reason: "",
			});

		case "APPROVE": {
			if (state.step !== "pending") {
				return { ...state, last_error: "Approve only while pending" };
			}
			// Committee re-check Phase-9 for team intents
			const teamErr = validateTeamDetails(state);
			if (teamErr) {
				return {
					...state,
					last_error: `Committee blocked: ${teamErr}`,
				};
			}
			return clearErr({
				...state,
				step: "approved",
				registration_status: "approved",
				existing: state.existing.map((r) =>
					r.email.toLowerCase() === state.credentials.email.toLowerCase() &&
					r.tournament_id === state.tournament_id &&
					r.registration_status === "pending"
						? { ...r, registration_status: "approved" as const }
						: r,
				),
			});
		}

		case "REJECT": {
			if (state.step !== "pending") {
				return { ...state, last_error: "Reject only while pending" };
			}
			return clearErr({
				...state,
				step: "rejected",
				registration_status: "rejected",
				registration_reject_reason: action.reason || "No reason given",
				existing: state.existing.map((r) =>
					r.email.toLowerCase() === state.credentials.email.toLowerCase() &&
					r.tournament_id === state.tournament_id &&
					r.registration_status === "pending"
						? { ...r, registration_status: "rejected" as const }
						: r,
				),
			});
		}

		case "RESET_DRAFT":
			return createInitialState({
				existing: state.existing,
				listed_teams: state.listed_teams,
				tournament_id: state.tournament_id,
				tournament_day: state.tournament_day,
				registration_open: state.registration_open,
			});

		case "SEED_EXISTING_EMAIL":
			return clearErr({
				...state,
				existing: [
					...state.existing,
					{
						id: `reg_seed_${Date.now()}`,
						tournament_id: state.tournament_id,
						email: action.email,
						registration_status: "pending",
						address_phase: "4",
						team_intent: "open_matching",
					},
				],
			});

		default:
			return state;
	}
}

/** Snapshot for verify-by-email (read-only lookup). */
export function verifyByEmail(
	state: RegistrationDraft,
	email: string,
): StoredRegistration | null {
	return (
		state.existing.find(
			(r) =>
				r.tournament_id === state.tournament_id &&
				r.email.toLowerCase() === email.toLowerCase(),
		) ?? null
	);
}
