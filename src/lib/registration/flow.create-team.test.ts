import { describe, expect, it } from "vitest";
import {
	canAdvance,
	createInitialState,
	memberCountBounds,
	reduce,
	validateAllRegistrants,
	validateTeamDetails,
	validateUploadsFields,
	wizardStepsFor,
	type Credentials,
	type RegistrationDraft,
	type Uploads,
} from "./flow";

function openState(
	overrides: Partial<RegistrationDraft> = {},
): RegistrationDraft {
	return createInitialState({
		registration_open: true,
		tournament_id: "tour_test",
		tournament_day: "2030-12-01",
		min_team_size: 5,
		max_team_size: 6,
		...overrides,
	});
}

/** From team_intent with create_team already set: walk through team name → consent. */
function throughConsent(state: RegistrationDraft): RegistrationDraft {
	let next = reduce(state, { type: "NEXT" });
	if (next.step === "team_details") {
		next = reduce(next, {
			type: "SET_PREFERRED_TEAM_NAME",
			name: next.preferred_team_name.trim() || "Night Owls",
		});
		next = reduce(next, { type: "NEXT" });
	}
	next = reduce(next, { type: "ACCEPT_CONSENT" });
	return reduce(next, { type: "NEXT" });
}

function fillCredentials(
	state: RegistrationDraft,
	patch: Partial<Credentials>,
): RegistrationDraft {
	return reduce(state, { type: "SET_CREDENTIALS", patch });
}

const PLAYER_NAMES = ["Ana Reyes", "Ben Santos", "Cara Lim", "Diego Cruz"] as const;

function validPlayer(i: number, phase: string = "4"): Partial<Credentials> {
	return {
		name: PLAYER_NAMES[i] ?? `Player ${String.fromCharCode(65 + i)}`,
		email: `player${i + 1}@example.com`,
		ign: `IGN${i + 1}`,
		birthdate: "2008-01-15",
		user_id: `${12345678 + i}`,
		server_id: "2001",
		address_phase: phase,
		address_package: "12",
		address_block: "2",
		address_lot: "3",
		preferred_lane: ["mid"],
		contact_number: "09171234567",
	};
}

function tinyPng(): File {
	const bytes = new Uint8Array([
		0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
		0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
		0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
		0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
		0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xfe, 0xd4, 0xef, 0x00, 0x00,
		0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
	]);
	return new File([bytes], "doc.png", { type: "image/png" });
}

function fillUploads(state: RegistrationDraft): RegistrationDraft {
	const file = tinyPng();
	let next = state;
	for (const key of [
		"school_id_front",
		"school_id_back",
		"purok_endorsement",
	] as const) {
		next = reduce(next, { type: "SET_UPLOAD", file: key, value: file });
	}
	return next;
}

describe("validateUploadsFields", () => {
	it("requires ID front and back, and allows missing purok endorsement", () => {
		expect(
			validateUploadsFields({
				school_id_front: tinyPng(),
				school_id_back: tinyPng(),
				purok_endorsement: tinyPng(),
			}),
		).toBeNull();
		expect(
			validateUploadsFields({
				school_id_front: tinyPng(),
				school_id_back: tinyPng(),
				purok_endorsement: null,
			}),
		).toBeNull();
	});

	it("still rejects missing ID sides", () => {
		expect(
			validateUploadsFields({
				school_id_front: tinyPng(),
				school_id_back: null,
				purok_endorsement: tinyPng(),
			}),
		).toMatch(/back is required/i);
	});
});

describe("memberCountBounds", () => {
	it("allows 2–6 even when tournament min is 5", () => {
		expect(memberCountBounds(5, 6)).toEqual({ min: 2, max: 6 });
	});

	it("caps max at tournament max when below 6", () => {
		expect(memberCountBounds(2, 4)).toEqual({ min: 2, max: 4 });
	});
});

describe("create-team registration wizard", () => {
	it("orders steps: team → team name → consent → credentials → documents → review → pending", () => {
		const state = openState({ team_intent: "create_team", member_count: 2 });
		expect(wizardStepsFor(state)).toEqual([
			"team_intent",
			"team_details",
			"consent",
			"credentials",
			"documents",
			"review",
			"pending",
		]);
	});

	it("walks N=2 players through credentials and documents without Phase-9 block", () => {
		let state = openState();
		expect(state.step).toBe("team_intent");

		state = reduce(state, { type: "SET_TEAM_INTENT", intent: "create_team" });
		state = reduce(state, { type: "SET_MEMBER_COUNT", count: 2 });
		expect(state.member_count).toBe(2);
		expect(state.registrants).toHaveLength(2);
		expect(canAdvance(state)).toBeNull();

		state = reduce(state, { type: "NEXT" });
		expect(state.step).toBe("team_details");

		// Phase-9 deferred: team name only
		state = reduce(state, {
			type: "SET_PREFERRED_TEAM_NAME",
			name: "Night Owls",
		});
		expect(validateTeamDetails(state)).toBeNull();
		state = reduce(state, { type: "NEXT" });
		expect(state.step).toBe("consent");

		state = reduce(state, { type: "ACCEPT_CONSENT" });
		state = reduce(state, { type: "NEXT" });
		expect(state.step).toBe("credentials");
		expect(state.active_registrant_index).toBe(0);

		// Player 1 Phase 4 (not 9) — must still advance
		state = fillCredentials(state, validPlayer(0, "4"));
		expect(canAdvance(state)).toBeNull();
		state = reduce(state, { type: "NEXT" });
		expect(state.step).toBe("credentials");
		expect(state.active_registrant_index).toBe(1);

		state = fillCredentials(state, validPlayer(1, "10"));
		state = reduce(state, { type: "NEXT" });
		expect(state.step).toBe("documents");
		expect(state.active_registrant_index).toBe(0);

		state = fillUploads(state);
		state = reduce(state, { type: "NEXT" });
		expect(state.step).toBe("documents");
		expect(state.active_registrant_index).toBe(1);

		state = fillUploads(state);
		expect(validateAllRegistrants(state)).toBeNull();
		expect(canAdvance(state)).toBeNull();
		expect(state.registrants[0]?.uploads.school_id_front?.name).toBe("doc.png");
		expect(state.registrants[1]?.uploads.school_id_front?.name).toBe("doc.png");
		state = reduce(state, { type: "NEXT" });
		expect(state.step).toBe("review");
		expect(canAdvance(state)).toBeNull();
	});

	it("rejects duplicate emails inside the same create-team batch", () => {
		let state = openState();
		state = reduce(state, { type: "SET_TEAM_INTENT", intent: "create_team" });
		state = reduce(state, { type: "SET_MEMBER_COUNT", count: 2 });
		state = throughConsent(state);
		expect(state.step).toBe("credentials");

		state = fillCredentials(state, validPlayer(0));
		state = reduce(state, { type: "NEXT" });
		state = fillCredentials(state, {
			...validPlayer(1),
			email: "player1@example.com",
		});

		expect(canAdvance(state)).toMatch(/different registration email/i);
	});

	it("keeps successful status codes on SUBMIT_PARTIAL for retry", () => {
		let state = openState({
			step: "documents",
			team_intent: "create_team",
			member_count: 2,
			active_registrant_index: 1,
			registrants: [
				{
					credentials: { ...validPlayer(0), preferred_lane: ["mid"] } as Credentials,
					uploads: {
						school_id_front: tinyPng(),
						school_id_back: tinyPng(),
						purok_endorsement: tinyPng(),
					} satisfies Uploads,
				},
				{
					credentials: { ...validPlayer(1), preferred_lane: ["gold"] } as Credentials,
					uploads: {
						school_id_front: tinyPng(),
						school_id_back: tinyPng(),
						purok_endorsement: tinyPng(),
					} satisfies Uploads,
				},
			],
		});

		state = reduce(state, {
			type: "SUBMIT_PARTIAL",
			submitted: [
				{ index: 0, email: "player1@example.com", statusCode: "111111" },
			],
			failedIndex: 1,
			message: "network down",
		});

		expect(state.step).toBe("documents");
		expect(state.active_registrant_index).toBe(1);
		expect(state.submitted_registrants).toHaveLength(1);
		expect(state.last_error).toMatch(/Player 2/);
	});
});
