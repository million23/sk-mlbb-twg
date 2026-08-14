import { describe, expect, it } from "vitest";
import { createInitialState, emptyUploads } from "@/lib/registration/flow";
import { buildParticipantFormData } from "./orval";

describe("buildParticipantFormData", () => {
	it("sends birthdate in PocketBase DateTime format", () => {
		const credentials = {
			...createInitialState().credentials,
			name: "Ana Reyes",
			email: "ana@example.com",
			ign: "AnaML",
			birthdate: "2008-01-15",
			user_id: "12345678",
			server_id: "2001",
			address_phase: "4",
			address_package: "12",
			address_block: "2",
			address_lot: "3",
			preferred_lane: ["mid" as const],
		};
		const draft = createInitialState({
			tournament_id: "tour_test",
			credentials,
			registrants: [{ credentials, uploads: emptyUploads() }],
		});
		const form = buildParticipantFormData(draft);
		expect(form.get("birthdate")).toBe("2008-01-15 00:00:00.000Z");
	});
});
