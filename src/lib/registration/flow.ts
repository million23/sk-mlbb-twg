/**
 * Public registration flow state machine:
 * window → team intent → (team select | team name) → consent →
 * credentials (×N for create) → documents (×N for create) →
 * review → pending.
 * Phase-9 team rule is deferred (informational copy only).
 */

import { calendarDayFromPbDate } from "@/lib/legacy/registered-date";

export const ELIGIBLE_PHASES = ["4", "9", "10"] as const;
export const LANES = ["mid", "gold", "exp", "support", "jungle"] as const;
export const TEAM_INTENTS = [
	"open_matching",
	"join_team",
	"create_team",
] as const;
export const CONSENT_VERSION = "sk-ta-2026-08-18-s2";

export type EligiblePhase = (typeof ELIGIBLE_PHASES)[number];
export type Lane = (typeof LANES)[number];
export type TeamIntent = (typeof TEAM_INTENTS)[number];

export type FlowStep =
	| "closed"
	| "consent"
	| "team_intent"
	| "credentials"
	| "team_details"
	| "documents"
	| "review"
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
	preferred_lane: Lane[];
	contact_number: string;
};

export type Uploads = {
	school_id_front: File | null;
	school_id_back: File | null;
	purok_endorsement: File | null;
};

export type RegistrantDraft = {
	credentials: Credentials;
	uploads: Uploads;
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

export type SubmittedRegistrant = {
	index: number;
	email: string;
	statusCode: string;
};

export type RegistrationDraft = {
	step: FlowStep;
	tournament_id: string;
	tournament_day: string; // YYYY-MM-DD — age checked against this
	registration_open: boolean;
	min_team_size: number;
	max_team_size: number;
	consent_accepted: boolean;
	consent_version: string | null;
	consent_accepted_at: string | null;
	/** Active registrant mirror — always equals registrants[active_registrant_index]. */
	credentials: Credentials;
	uploads: Uploads;
	team_intent: TeamIntent | null;
	member_count: number;
	active_registrant_index: number;
	registrants: RegistrantDraft[];
	preferred_team: string | null;
	preferred_team_name: string;
	registration_status: "pending" | "approved" | "rejected" | null;
	/** Primary / first status code (single-player flows). */
	registration_status_code: string | null;
	/** All status codes from a create-team batch (and single-player as length 1). */
	registration_status_codes: string[];
	submitted_registrants: SubmittedRegistrant[];
	registration_reject_reason: string;
	last_error: string | null;
	/** In-memory peers for uniqueness checks (not persisted) */
	existing: StoredRegistration[];
	listed_teams: ListedTeam[];
};

export function emptyCredentials(): Credentials {
	return {
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
		preferred_lane: [],
		contact_number: "",
	};
}

export function emptyUploads(): Uploads {
	return {
		school_id_front: null,
		school_id_back: null,
		purok_endorsement: null,
	};
}

export function emptyRegistrant(): RegistrantDraft {
	return {
		credentials: emptyCredentials(),
		uploads: emptyUploads(),
	};
}

/**
 * Create-team registration size: always 2–6.
 * Tournament min/max still inform admin ready status; public create allows smaller squads.
 */
export function memberCountBounds(
	_minTeamSize?: number,
	maxTeamSize?: number,
): { min: number; max: number } {
	const rawMax =
		Number.isFinite(maxTeamSize) && (maxTeamSize as number) > 0
			? (maxTeamSize as number)
			: 6;
	const max = Math.min(6, Math.max(2, rawMax));
	return { min: 2, max };
}

export function needsTeamDetails(intent: TeamIntent | null): boolean {
	return intent === "join_team" || intent === "create_team";
}

export function isCreateTeamBatch(state: RegistrationDraft): boolean {
	return state.team_intent === "create_team";
}

function resizeRegistrants(
	current: RegistrantDraft[],
	count: number,
): RegistrantDraft[] {
	const next = current.slice(0, count);
	while (next.length < count) next.push(emptyRegistrant());
	return next;
}

function syncActive(state: RegistrationDraft): RegistrationDraft {
	const idx = Math.min(
		Math.max(0, state.active_registrant_index),
		Math.max(0, state.registrants.length - 1),
	);
	const reg = state.registrants[idx] ?? emptyRegistrant();
	return {
		...state,
		active_registrant_index: idx,
		credentials: reg.credentials,
		uploads: reg.uploads,
	};
}

/** Persist active credentials/uploads into registrants[active]. */
function persistActive(state: RegistrationDraft): RegistrationDraft {
	const idx = state.active_registrant_index;
	const registrants = state.registrants.map((r, i) =>
		i === idx
			? { credentials: state.credentials, uploads: state.uploads }
			: r,
	);
	return { ...state, registrants };
}

/** Stepper steps for the current draft. */
export function wizardStepsFor(state: RegistrationDraft): FlowStep[] {
	const steps: FlowStep[] = ["team_intent"];
	if (needsTeamDetails(state.team_intent)) steps.push("team_details");
	steps.push("consent", "credentials", "documents", "review", "pending");
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
	| { type: "SET_MEMBER_COUNT"; count: number }
	| { type: "SET_PREFERRED_TEAM"; teamId: string }
	| { type: "SET_PREFERRED_TEAM_NAME"; name: string }
	| { type: "SET_UPLOAD"; file: keyof Uploads; value: File | null }
	| { type: "HYDRATE"; patch: Partial<RegistrationDraft> }
	| { type: "SET_LAST_ERROR"; message: string | null }
	| {
			type: "SUBMIT_SUCCESS";
			statusCode?: string | null;
			statusCodes?: string[];
			submitted?: SubmittedRegistrant[];
	  }
	| {
			type: "SUBMIT_PARTIAL";
			submitted: SubmittedRegistrant[];
			failedIndex: number;
			message: string;
	  }
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

export function createInitialState(
	overrides: Partial<RegistrationDraft> = {},
): RegistrationDraft {
	const first = emptyRegistrant();
	const base: RegistrationDraft = {
		step: "team_intent",
		tournament_id: "",
		tournament_day: "",
		registration_open: false,
		min_team_size: 5,
		max_team_size: 6,
		consent_accepted: false,
		consent_version: null,
		consent_accepted_at: null,
		credentials: first.credentials,
		uploads: first.uploads,
		team_intent: "open_matching",
		member_count: 1,
		active_registrant_index: 0,
		registrants: [first],
		preferred_team: null,
		preferred_team_name: "",
		registration_status: null,
		registration_status_code: null,
		registration_status_codes: [],
		submitted_registrants: [],
		registration_reject_reason: "",
		last_error: null,
		existing: [],
		listed_teams: [],
	};
	const merged = { ...base, ...overrides };
	if (!merged.registrants?.length) {
		merged.registrants = [
			{
				credentials: merged.credentials ?? emptyCredentials(),
				uploads: merged.uploads ?? emptyUploads(),
			},
		];
	}
	return syncActive(merged);
}

export function ageOnTournamentDay(
	birthdate: string,
	tournamentDay: string,
): number | null {
	if (!birthdate || !tournamentDay) return null;
	const birthDay = calendarDayFromPbDate(birthdate);
	const dayStr = calendarDayFromPbDate(tournamentDay);
	if (!birthDay || !dayStr) return null;
	const birth = new Date(`${birthDay}T00:00:00`);
	const day = new Date(`${dayStr}T00:00:00`);
	if (Number.isNaN(birth.getTime()) || Number.isNaN(day.getTime())) return null;
	let age = day.getFullYear() - birth.getFullYear();
	const m = day.getMonth() - birth.getMonth();
	if (m < 0 || (m === 0 && day.getDate() < birth.getDate())) age -= 1;
	return age;
}

/** Full name: letters / spaces / common punctuation only, max length. */
export const NAME_MAX_LENGTH = 60;
const NAME_PATTERN = /^[\p{L}\s.'’-]+$/u;

/** Practical email shape checked before leaving credentials. */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EMAIL_MAX_LENGTH = 254;

export const USER_ID_MIN_LENGTH = 8;
export const USER_ID_MAX_LENGTH = 10;
export const SERVER_ID_MIN_LENGTH = 4;
export const SERVER_ID_MAX_LENGTH = 5;

/** Package: up to 2 digits (e.g. 12). */
export const PACKAGE_MAX_LENGTH = 2;
const PACKAGE_PATTERN = /^\d{1,2}$/;

export function sanitizePersonName(raw: string): string {
	return raw.replace(/[0-9]/g, "").slice(0, NAME_MAX_LENGTH);
}

export function sanitizeDigits(raw: string, max: number): string {
	return raw.replace(/\D/g, "").slice(0, max);
}

/** Digits-only package, max 2. */
export function sanitizeAddressPackage(raw: string): string {
	return sanitizeDigits(raw, PACKAGE_MAX_LENGTH);
}

export type CredentialField =
	| "name"
	| "email"
	| "ign"
	| "birthdate"
	| "user_id"
	| "server_id"
	| "address_phase"
	| "address_package"
	| "address_block"
	| "address_lot"
	| "preferred_lane";

/** All invalid credential fields (for inline highlights). */
export function getCredentialFieldErrors(
	c: Credentials,
	tournamentDay: string,
): Partial<Record<CredentialField, string>> {
	const errors: Partial<Record<CredentialField, string>> = {};

	const name = c.name.trim();
	if (!name) errors.name = "Name is required";
	else if (name.length > NAME_MAX_LENGTH) {
		errors.name = `Name must be ${NAME_MAX_LENGTH} characters or fewer`;
	} else if (/\d/.test(name) || !NAME_PATTERN.test(name)) {
		errors.name = "Name cannot include numbers or special symbols";
	}

	const email = c.email.trim();
	if (!email) errors.email = "Email is required";
	else if (email.length > EMAIL_MAX_LENGTH || !EMAIL_PATTERN.test(email)) {
		errors.email = "Enter a valid email address";
	}

	if (!c.ign.trim()) errors.ign = "IGN is required";

	if (!tournamentDay) {
		errors.birthdate =
			"Tournament date is missing — set start_at on the tournament";
	} else if (!c.birthdate) {
		errors.birthdate = "Birthdate is required";
	} else {
		const age = ageOnTournamentDay(c.birthdate, tournamentDay);
		if (age === null) errors.birthdate = "Invalid birthdate";
		else if (age < 15) {
			errors.birthdate = `Must be 15+ on tournament day (age on ${tournamentDay}: ${age})`;
		}
	}

	const userId = c.user_id.trim();
	if (!userId) errors.user_id = "User ID is required";
	else if (!/^\d+$/.test(userId)) errors.user_id = "User ID must be digits only";
	else if (
		userId.length < USER_ID_MIN_LENGTH ||
		userId.length > USER_ID_MAX_LENGTH
	) {
		errors.user_id = `User ID must be ${USER_ID_MIN_LENGTH}–${USER_ID_MAX_LENGTH} digits`;
	}

	const serverId = c.server_id.trim();
	if (!serverId) errors.server_id = "Server ID is required";
	else if (!/^\d+$/.test(serverId)) {
		errors.server_id = "Server ID must be digits only";
	} else if (
		serverId.length < SERVER_ID_MIN_LENGTH ||
		serverId.length > SERVER_ID_MAX_LENGTH
	) {
		errors.server_id = `Server ID must be ${SERVER_ID_MIN_LENGTH}–${SERVER_ID_MAX_LENGTH} digits`;
	}

	if (!c.address_phase) errors.address_phase = "Phase is required";
	else if (!(ELIGIBLE_PHASES as readonly string[]).includes(c.address_phase)) {
		errors.address_phase = "Phase must be 4, 9, or 10";
	}

	const pkg = c.address_package.trim();
	if (!pkg) errors.address_package = "Package is required";
	else if (!PACKAGE_PATTERN.test(pkg)) {
		errors.address_package = "Package must be 1–2 digits";
	}

	if (!c.address_block || c.address_block.trim().length === 0) errors.address_block = "Block is required";
	if (!c.address_lot || c.address_lot.trim().length === 0) errors.address_lot = "Lot is required";
	if (!c.preferred_lane || c.preferred_lane.length === 0) {
		errors.preferred_lane = "Preferred lane is required";
	}

	return errors;
}

export function validateCredentialsFields(
	c: Credentials,
	tournamentDay: string,
): string | null {
	const errors = getCredentialFieldErrors(c, tournamentDay);
	return Object.values(errors)[0] ?? null;
}

export function validateCredentials(
	state: RegistrationDraft,
	registrantIndex = state.active_registrant_index,
): string | null {
	const persisted = persistActive(state);
	const c =
		persisted.registrants[registrantIndex]?.credentials ??
		persisted.credentials;
	const fieldErr = validateCredentialsFields(c, state.tournament_day);
	if (fieldErr) return fieldErr;

	const email = c.email.trim().toLowerCase();
	const emailTaken = state.existing.some(
		(r) =>
			r.tournament_id === state.tournament_id &&
			r.email.toLowerCase() === email &&
			(r.registration_status === "pending" ||
				r.registration_status === "approved"),
	);
	if (emailTaken) {
		return "This email already has a pending or approved registration for this tournament";
	}

	const dupInBatch = persisted.registrants.some(
		(r, i) =>
			i !== registrantIndex &&
			r.credentials.email.trim().toLowerCase() === email &&
			email.length > 0,
	);
	if (dupInBatch) {
		return "Each teammate needs a different registration email";
	}

	return null;
}

/** Choice + create-team member count. */
export function validateTeamIntent(state: RegistrationDraft): string | null {
	if (!state.team_intent) return "Choose a team intent";
	if (state.team_intent === "create_team") {
		const { min, max } = memberCountBounds(
			state.min_team_size,
			state.max_team_size,
		);
		if (
			!Number.isFinite(state.member_count) ||
			state.member_count < min ||
			state.member_count > max
		) {
			return `Team size must be between ${min} and ${max}`;
		}
	}
	return null;
}

export function validateTeamDetails(state: RegistrationDraft): string | null {
	if (!state.team_intent) return "Choose a team intent";

	if (state.team_intent === "open_matching") return null;

	if (state.team_intent === "join_team") {
		if (!state.preferred_team) return "Pick a listed team to join";
		const team = state.listed_teams.find((t) => t.id === state.preferred_team);
		if (!team) return "Unknown team";
		// Phase-9 team rule deferred — do not block join.
	}

	if (state.team_intent === "create_team") {
		if (!state.preferred_team_name.trim()) {
			return "Team name is required when creating a team";
		}
		// Phase-9 team rule deferred — do not require creator Phase 9.
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

export function validateUploadsFields(u: Uploads): string | null {
	if (!u.school_id_front) return "Valid ID / School ID front is required";
	if (!u.school_id_back) return "Valid ID / School ID back is required";
	if (!u.purok_endorsement) return "Purok endorsement is required";
	for (const [key, file] of Object.entries(u) as [
		keyof Uploads,
		File | null,
	][]) {
		if (!file) continue;
		const err = validateUploadFile(file);
		if (err) return `${key.replaceAll("_", " ")}: ${err}`;
	}
	return null;
}

export function validateUploads(
	state: RegistrationDraft,
	registrantIndex = state.active_registrant_index,
): string | null {
	const persisted = persistActive(state);
	const u =
		persisted.registrants[registrantIndex]?.uploads ?? persisted.uploads;
	return validateUploadsFields(u);
}

/** Validate every registrant before batch submit. */
export function validateAllRegistrants(
	state: RegistrationDraft,
): string | null {
	const persisted = persistActive(state);
	const count = isCreateTeamBatch(persisted)
		? persisted.member_count
		: 1;
	for (let i = 0; i < count; i++) {
		const credErr = validateCredentials(persisted, i);
		if (credErr) {
			return `Player ${i + 1}: ${credErr}`;
		}
		const upErr = validateUploads(persisted, i);
		if (upErr) {
			return `Player ${i + 1}: ${upErr}`;
		}
	}
	return null;
}

export function canAdvance(state: RegistrationDraft): string | null {
	if (!state.registration_open) return "Registration window is closed";
	switch (state.step) {
		case "consent":
			return state.consent_accepted ? null : "Accept consent (T&A) first";
		case "team_intent":
			return validateTeamIntent(state);
		case "credentials":
			return validateCredentials(state);
		case "team_details":
			return validateTeamDetails(state);
		case "documents":
			return validateUploads(state);
		case "review":
			return (
				validateTeamIntent(state) ??
				validateTeamDetails(state) ??
				validateAllRegistrants(state)
			);
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
		preferred_lane: ["jungle"],
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
		preferred_lane: ["gold"],
		contact_number: "09181234567",
	},
	underage: {
		name: "Young Player",
		email: "young@example.com",
		ign: "TooYoung",
		birthdate: "2013-01-01",
		user_id: "12345678",
		server_id: "2001",
		address_phase: "9",
		address_package: "1",
		address_block: "1",
		address_lot: "1",
		preferred_lane: ["mid"],
	},
	bad_phase: {
		name: "Outside Phase",
		email: "outside@example.com",
		ign: "Outsider",
		birthdate: "2006-03-03",
		user_id: "23456789",
		server_id: "2001",
		address_phase: "" as EligiblePhase | "",
		address_package: "1",
		address_block: "1",
		address_lot: "1",
		preferred_lane: ["exp"],
	},
	duplicate_email: {
		name: "Taken Email",
		email: "taken@example.com",
		ign: "TakenIGN",
		birthdate: "2005-06-06",
		user_id: "34567890",
		server_id: "2001",
		address_phase: "10",
		address_package: "3",
		address_block: "7",
		address_lot: "2",
		preferred_lane: ["support"],
	},
};

function nextMajorStep(state: RegistrationDraft): FlowStep | null {
	switch (state.step) {
		case "team_intent":
			return needsTeamDetails(state.team_intent)
				? "team_details"
				: "consent";
		case "team_details":
			return "consent";
		case "consent":
			return "credentials";
		case "credentials":
			return "documents";
		case "documents":
			return "review";
		default:
			return null;
	}
}

function prevMajorStep(state: RegistrationDraft): FlowStep | null {
	switch (state.step) {
		case "team_details":
			return "team_intent";
		case "consent":
			return needsTeamDetails(state.team_intent)
				? "team_details"
				: "team_intent";
		case "credentials":
			return "consent";
		case "documents":
			return "credentials";
		case "review":
			return "documents";
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
						? "team_intent"
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
			if (
				state.step === "credentials" &&
				isCreateTeamBatch(state) &&
				state.active_registrant_index > 0
			) {
				const persisted = persistActive(state);
				const idx = state.active_registrant_index - 1;
				return clearErr(
					syncActive({
						...persisted,
						active_registrant_index: idx,
					}),
				);
			}
			if (
				state.step === "documents" &&
				isCreateTeamBatch(state) &&
				state.active_registrant_index > 0
			) {
				const persisted = persistActive(state);
				const idx = state.active_registrant_index - 1;
				return clearErr(
					syncActive({
						...persisted,
						active_registrant_index: idx,
					}),
				);
			}
			const prev = prevMajorStep(state);
			if (!prev) return { ...state, last_error: "Already at first step" };
			const persisted = persistActive(state);
			let nextState = { ...persisted, step: prev };
			if (prev === "credentials" && isCreateTeamBatch(persisted)) {
				nextState = {
					...nextState,
					active_registrant_index: Math.max(0, persisted.member_count - 1),
				};
			} else if (prev === "documents" && isCreateTeamBatch(persisted)) {
				nextState = {
					...nextState,
					active_registrant_index: Math.max(0, persisted.member_count - 1),
				};
			} else if (prev === "team_intent" || prev === "consent") {
				nextState = { ...nextState, active_registrant_index: 0 };
			} else if (
				prev === "credentials" &&
				!isCreateTeamBatch(persisted)
			) {
				nextState = { ...nextState, active_registrant_index: 0 };
			} else if (prev === "team_details") {
				nextState = { ...nextState, active_registrant_index: 0 };
			}
			return clearErr(syncActive(nextState));
		}

		case "NEXT": {
			const err = canAdvance(state);
			if (err) return { ...state, last_error: err };

			if (
				state.step === "credentials" &&
				isCreateTeamBatch(state) &&
				state.active_registrant_index < state.member_count - 1
			) {
				const persisted = persistActive(state);
				const idx = state.active_registrant_index + 1;
				return clearErr(
					syncActive({
						...persisted,
						active_registrant_index: idx,
					}),
				);
			}

			if (
				state.step === "documents" &&
				isCreateTeamBatch(state) &&
				state.active_registrant_index < state.member_count - 1
			) {
				const persisted = persistActive(state);
				const idx = state.active_registrant_index + 1;
				return clearErr(
					syncActive({
						...persisted,
						active_registrant_index: idx,
					}),
				);
			}

			const n = nextMajorStep(state);
			if (!n) {
				return {
					...state,
					last_error: "Use submit from review",
				};
			}
			const persisted = persistActive(state);
			let nextState: RegistrationDraft = { ...persisted, step: n };
			if (n === "credentials" || n === "documents") {
				nextState = { ...nextState, active_registrant_index: 0 };
			}
			if (n === "team_details") {
				nextState = { ...nextState, active_registrant_index: 0 };
			}
			return clearErr(syncActive(nextState));
		}

		case "SET_CREDENTIALS": {
			const credentials = { ...state.credentials, ...action.patch };
			const registrants = state.registrants.map((r, i) =>
				i === state.active_registrant_index ? { ...r, credentials } : r,
			);
			return clearErr({ ...state, credentials, registrants });
		}

		case "LOAD_PRESET": {
			const patch = { ...PRESETS[action.preset] };
			if (action.preset === "bad_phase") patch.address_phase = "7";
			return clearErr({
				...state,
				credentials: { ...state.credentials, ...patch },
			});
		}

		case "SET_TEAM_INTENT": {
			const intent = action.intent;
			const { min } = memberCountBounds(
				state.min_team_size,
				state.max_team_size,
			);
			const member_count = intent === "create_team" ? min : 1;
			const registrants = resizeRegistrants(
				persistActive(state).registrants,
				member_count,
			);
			return clearErr(
				syncActive({
					...state,
					team_intent: intent,
					member_count,
					registrants,
					active_registrant_index: 0,
					preferred_team:
						intent === "join_team" ? state.preferred_team : null,
					preferred_team_name:
						intent === "create_team" ? state.preferred_team_name : "",
					submitted_registrants: [],
					registration_status_codes: [],
				}),
			);
		}

		case "SET_MEMBER_COUNT": {
			const { min, max } = memberCountBounds(
				state.min_team_size,
				state.max_team_size,
			);
			const count = Math.min(max, Math.max(min, Math.floor(action.count)));
			const persisted = persistActive(state);
			return clearErr(
				syncActive({
					...persisted,
					member_count: count,
					registrants: resizeRegistrants(persisted.registrants, count),
					active_registrant_index: Math.min(
						persisted.active_registrant_index,
						count - 1,
					),
				}),
			);
		}

		case "SET_PREFERRED_TEAM":
			return clearErr({ ...state, preferred_team: action.teamId });

		case "SET_PREFERRED_TEAM_NAME":
			return clearErr({ ...state, preferred_team_name: action.name });

		case "SET_UPLOAD": {
			const uploads = {
				...state.uploads,
				[action.file]: action.value,
			};
			const registrants = state.registrants.map((r, i) =>
				i === state.active_registrant_index
					? { ...r, uploads: { ...r.uploads, [action.file]: action.value } }
					: r,
			);
			return clearErr({ ...state, uploads, registrants });
		}

		case "HYDRATE": {
			const next = {
				...state,
				...action.patch,
				credentials: action.patch.credentials
					? { ...state.credentials, ...action.patch.credentials }
					: state.credentials,
				uploads: action.patch.uploads
					? { ...state.uploads, ...action.patch.uploads }
					: state.uploads,
			};
			if (
				action.patch.min_team_size != null ||
				action.patch.max_team_size != null
			) {
				if (next.team_intent === "create_team") {
					const { min, max } = memberCountBounds(
						next.min_team_size,
						next.max_team_size,
					);
					const count = Math.min(max, Math.max(min, next.member_count));
					next.member_count = count;
					next.registrants = resizeRegistrants(next.registrants, count);
				}
			}
			return clearErr(syncActive(next));
		}

		case "SET_LAST_ERROR":
			return { ...state, last_error: action.message };

		case "SUBMIT_SUCCESS": {
			const codes =
				action.statusCodes?.filter((c) => c.trim()) ??
				(action.statusCode?.trim()
					? [action.statusCode.trim()]
					: state.registration_status_codes);
			const submitted =
				action.submitted ??
				(codes.length
					? codes.map((statusCode, index) => ({
							index,
							email:
								state.registrants[index]?.credentials.email.trim() ||
								state.credentials.email.trim(),
							statusCode,
						}))
					: state.submitted_registrants);
			return clearErr({
				...persistActive(state),
				step: "pending",
				registration_status: "pending",
				registration_status_code: codes[0] ?? null,
				registration_status_codes: codes,
				submitted_registrants: submitted,
				registration_reject_reason: "",
			});
		}

		case "SUBMIT_PARTIAL": {
			const codes = action.submitted.map((s) => s.statusCode);
			return {
				...persistActive(state),
				step: "documents",
				active_registrant_index: action.failedIndex,
				submitted_registrants: action.submitted,
				registration_status_codes: codes,
				registration_status_code: codes[0] ?? null,
				last_error: `Player ${action.failedIndex + 1}: ${action.message}`,
				credentials:
					state.registrants[action.failedIndex]?.credentials ??
					state.credentials,
				uploads:
					state.registrants[action.failedIndex]?.uploads ?? state.uploads,
			};
		}

		case "APPROVE": {
			if (state.step !== "pending") {
				return { ...state, last_error: "Approve only while pending" };
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
				min_team_size: state.min_team_size,
				max_team_size: state.max_team_size,
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

/** Draft slice for submitting one registrant in a batch. */
export function draftForRegistrant(
	state: RegistrationDraft,
	index: number,
): RegistrationDraft {
	const persisted = persistActive(state);
	const reg = persisted.registrants[index] ?? emptyRegistrant();
	return {
		...persisted,
		active_registrant_index: index,
		credentials: reg.credentials,
		uploads: reg.uploads,
	};
}
