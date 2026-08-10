import type { ParticipantsRecord } from "@/hooks/orval/model/participantsRecord";
import type { TeamsRecord } from "@/hooks/orval/model/teamsRecord";
import type { TournamentsRecord } from "@/hooks/orval/model/tournamentsRecord";
import { getPostCollectionsParticipantsRecordsUrl } from "@/hooks/orval/participants-collection/participants-collection";
import { ApiError, customInstance } from "@/lib/api/mutator/custom-instance";
import { resolveRegistrationAppOrigin } from "@/lib/registration/app-origin";
import {
	CONSENT_VERSION,
	draftForRegistrant,
	isCreateTeamBatch,
	type EligiblePhase,
	type ListedTeam,
	type RegistrationDraft,
	type SubmittedRegistrant,
} from "@/lib/registration/flow";

/** Orval response wrappers don't match PocketBase JSON; unwrap list bodies. */
export function unwrapOrvalListItems<T>(res: unknown): T[] {
	if (!res || typeof res !== "object") return [];
	const body = res as { items?: T[]; data?: { items?: T[] } };
	if (Array.isArray(body.items)) return body.items;
	if (Array.isArray(body.data?.items)) return body.data.items;
	return [];
}

export function unwrapOrvalRecord<T>(res: unknown): T {
	if (!res || typeof res !== "object") {
		throw new Error("Empty API response");
	}
	const body = res as { data?: T } & T;
	if ("data" in body && body.data && typeof body.data === "object") {
		return body.data;
	}
	return body as T;
}

/** Prefer the calendar date from an ISO/date string (avoids TZ day-shift). */
export function tournamentDayFromStartAt(startAt?: string): string {
	if (!startAt?.trim()) return "";
	const m = /^(\d{4}-\d{2}-\d{2})/.exec(startAt.trim());
	if (m) return m[1]!;
	const d = new Date(startAt);
	if (Number.isNaN(d.getTime())) return "";
	const y = d.getFullYear();
	const mo = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${mo}-${day}`;
}

/** Age-check day: tournament start, else registration window end/start. */
export function resolveTournamentDay(t: TournamentsRecord): string {
	return (
		tournamentDayFromStartAt(t.start_at) ||
		tournamentDayFromStartAt(t.registration_close_at) ||
		tournamentDayFromStartAt(t.registration_open_at) ||
		""
	);
}

export function isRegistrationWindowOpen(
	t: TournamentsRecord,
	now = new Date(),
): boolean {
	if (t.archived || !t.registration_enabled) return false;
	if (
		t.status === "draft" ||
		t.status === "archived" ||
		t.status === "completed"
	) {
		return false;
	}
	if (t.registration_open_at && new Date(t.registration_open_at) > now) {
		return false;
	}
	if (t.registration_close_at && new Date(t.registration_close_at) < now) {
		return false;
	}
	return true;
}

export function mapTeamRecord(team: TeamsRecord): ListedTeam | null {
	if (!team.id) return null;
	return {
		id: team.id,
		name: team.name,
		/** Until public API exposes member phases / has_phase_9. */
		member_phases: [] as EligiblePhase[],
	};
}

export type SubmitRegistrationInput = {
	draft: RegistrationDraft;
	/** Cloudflare Turnstile token from the documents step. */
	turnstileToken?: string | null;
	/** Honeypot — must stay empty. */
	website?: string;
};

export type BatchSubmitResult = {
	submitted: SubmittedRegistrant[];
	/** Set when a later player failed after earlier successes. */
	failedIndex?: number;
	error?: unknown;
};

const UPLOAD_FIELD_NAMES = [
	"school_id_front",
	"school_id_back",
	"purok_endorsement",
] as const;

/** 6-digit status-lookup code (fallback when pb_hooks are not deployed yet). */
export function generateRegistrationStatusCode(): string {
	return String(Math.floor(100000 + Math.random() * 900000));
}

type BuildParticipantFormOptions = {
	statusCode?: string;
};

/** Build multipart body for public participant create (files + fields). */
export function buildParticipantFormData(
	draft: RegistrationDraft,
	options: BuildParticipantFormOptions = {},
): FormData {
	const statusCode =
		options.statusCode ?? generateRegistrationStatusCode();
	const c = draft.credentials;
	const form = new FormData();

	form.append("tournament", draft.tournament_id);
	form.append("name", c.name.trim());
	form.append("email", c.email.trim().toLowerCase());
	form.append("ign", c.ign.trim());
	form.append("birthdate", c.birthdate);
	form.append("user_id", c.user_id.trim());
	form.append("server_id", c.server_id.trim());
	form.append("address_phase", c.address_phase);
	form.append("address_package", c.address_package.trim());
	form.append("address_block", c.address_block.trim());
	form.append("address_lot", c.address_lot.trim());
	for (const lane of c.preferred_lane || []) {
		form.append("preferred_lane", lane);
		form.append("preferred_roles", lane);
	}
	form.append("status", "unassigned");
	// Required on participants; public create also forced by pb_hooks when deployed.
	form.append("registration_status", "pending");
	form.append("archived", "false");
	// Fallback if create hooks are not on the host; server hook overwrites when deployed.
	form.append("registration_status_code", statusCode);

	if (c.contact_number.trim()) {
		form.append("contact_number", c.contact_number.trim());
	}

	if (draft.team_intent) {
		form.append("team_intent", draft.team_intent);
	}
	if (draft.team_intent === "join_team" && draft.preferred_team) {
		form.append("preferred_team", draft.preferred_team);
	}
	if (draft.team_intent === "create_team" && draft.preferred_team_name.trim()) {
		form.append("preferred_team_name", draft.preferred_team_name.trim());
	}

	form.append("consent_version", draft.consent_version ?? CONSENT_VERSION);
	if (draft.consent_accepted_at) {
		form.append("consent_accepted_at", draft.consent_accepted_at);
	}

	// Turnstile / honeypot are sent as query params on the POST URL (see
	// createParticipantRecord) — not as FormData keys.

	for (const key of UPLOAD_FIELD_NAMES) {
		const file = draft.uploads[key];
		if (file instanceof File && file.size > 0) {
			form.append(key, file, file.name);
		}
	}

	return form;
}

/**
 * Create participant via Orval path + FormData (JSON Orval POST cannot attach files).
 * Mail is sent by PocketBase hooks (Settings → Mail SMTP).
 */
export async function createParticipantRecord(
	input: SubmitRegistrationInput,
): Promise<ParticipantsRecord> {
	const { draft, turnstileToken, website } = input;
	const statusCode = generateRegistrationStatusCode();
	const body = buildParticipantFormData(draft, { statusCode });

	// Query params (not FormData fields / custom headers): PB rejects unknown
	// collection keys, and CORS often strips X-* on multipart POSTs.
	const path = getPostCollectionsParticipantsRecordsUrl();
	const qs = new URLSearchParams();
	if (turnstileToken?.trim()) {
		qs.set("turnstile_token", turnstileToken.trim());
	}
	qs.set("website", website ?? "");
	const appOrigin = resolveRegistrationAppOrigin();
	if (appOrigin) {
		qs.set("app_origin", appOrigin);
	}
	const url = `${path}?${qs.toString()}`;

	const res = await customInstance<unknown>(url, {
		method: "POST",
		body,
	});
	const record = unwrapOrvalRecord<ParticipantsRecord>(res);
	// Response may omit the field; keep the code we submitted for the success screen.
	return {
		...record,
		registration_status_code: record.registration_status_code || statusCode,
	};
}

/**
 * Submit one or many registrants. Skips indexes already in
 * `draft.submitted_registrants` (retry after partial failure).
 */
export async function createParticipantRecords(
	input: SubmitRegistrationInput,
): Promise<BatchSubmitResult> {
	const { draft, turnstileToken, website } = input;
	const already = new Map(
		draft.submitted_registrants.map((s) => [s.index, s] as const),
	);
	const count = isCreateTeamBatch(draft) ? draft.member_count : 1;
	const submitted: SubmittedRegistrant[] = [...draft.submitted_registrants];

	for (let i = 0; i < count; i++) {
		if (already.has(i)) continue;
		try {
			const slice = draftForRegistrant(draft, i);
			const record = await createParticipantRecord({
				draft: slice,
				turnstileToken,
				website,
			});
			const statusCode =
				record.registration_status_code?.trim() ||
				generateRegistrationStatusCode();
			const row: SubmittedRegistrant = {
				index: i,
				email: slice.credentials.email.trim(),
				statusCode,
			};
			submitted.push(row);
			already.set(i, row);
		} catch (error) {
			return { submitted, failedIndex: i, error };
		}
	}

	return { submitted };
}

export function registrationApiErrorMessage(error: unknown): string {
	if (error instanceof ApiError) {
		const data = error.data;
		if (data && typeof data === "object") {
			const envelope = data as {
				message?: string;
				data?: Record<string, { message?: string; code?: string }>;
			};
			if (envelope.data && typeof envelope.data === "object") {
				const first = Object.values(envelope.data).find((v) => v?.message)
					?.message;
				if (first) return first;
			}
			if (typeof envelope.message === "string" && envelope.message.trim()) {
				return envelope.message;
			}
		}
		return error.message;
	}
	if (error instanceof Error) return error.message;
	return "Registration failed";
}
