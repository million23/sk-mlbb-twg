import { describe, expect, it } from "vitest";
import {
	createInitialState,
	sanitizeAddressPackage,
	sanitizePersonName,
	validateCredentialsFields,
	type Credentials,
} from "./flow";

const day = "2030-12-01";

function base(overrides: Partial<Credentials> = {}): Credentials {
	return {
		...createInitialState().credentials,
		name: "Juan Dela Cruz",
		email: "juan@example.com",
		ign: "JuanML",
		birthdate: "2008-01-10",
		user_id: "123456789",
		server_id: "2001",
		address_phase: "9",
		address_package: "12A",
		address_block: "14",
		address_lot: "3",
		preferred_lane: "jungle",
		contact_number: "09171234567",
		...overrides,
	};
}

describe("sanitizePersonName", () => {
	it("strips digits and enforces max length", () => {
		expect(sanitizePersonName("Juan123 Dela")).toBe("Juan Dela");
		expect(sanitizePersonName("A".repeat(80)).length).toBe(60);
	});
});

describe("sanitizeAddressPackage", () => {
	it("keeps 2 digits then 1 letter", () => {
		expect(sanitizeAddressPackage("12a")).toBe("12A");
		expect(sanitizeAddressPackage("1x2b")).toBe("12B");
		expect(sanitizeAddressPackage("99ZZ")).toBe("99Z");
	});
});

describe("validateCredentialsFields", () => {
	it("accepts a valid credentials payload", () => {
		expect(validateCredentialsFields(base(), day)).toBeNull();
	});

	it("rejects names with numbers", () => {
		expect(validateCredentialsFields(base({ name: "Juan2" }), day)).toMatch(
			/cannot include numbers/i,
		);
	});

	it("rejects invalid email before leaving credentials", () => {
		expect(validateCredentialsFields(base({ email: "12345" }), day)).toMatch(
			/valid email/i,
		);
		expect(validateCredentialsFields(base({ email: "123@456" }), day)).toMatch(
			/valid email/i,
		);
		expect(
			validateCredentialsFields(base({ email: "not-an-email@" }), day),
		).toMatch(/valid email/i);
	});

	it("enforces user id 8–10 digits", () => {
		expect(
			validateCredentialsFields(base({ user_id: "1234567" }), day),
		).toMatch(/8–10 digits/i);
		expect(
			validateCredentialsFields(base({ user_id: "12345678901" }), day),
		).toMatch(/8–10 digits/i);
	});

	it("enforces server id 4–5 digits", () => {
		expect(
			validateCredentialsFields(base({ server_id: "200" }), day),
		).toMatch(/4–5 digits/i);
		expect(
			validateCredentialsFields(base({ server_id: "200123" }), day),
		).toMatch(/4–5 digits/i);
	});

	it("requires package as 2 digits + 1 letter", () => {
		expect(
			validateCredentialsFields(base({ address_package: "12" }), day),
		).toMatch(/2 digits and 1 letter/i);
		expect(
			validateCredentialsFields(base({ address_package: "1A" }), day),
		).toMatch(/2 digits and 1 letter/i);
		expect(
			validateCredentialsFields(base({ address_package: "12A" }), day),
		).toBeNull();
	});
});
