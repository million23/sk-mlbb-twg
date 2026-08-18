import { createRequire } from "node:module";
import { beforeEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const cache = require("../../../pb_hooks/turnstile_cache.js") as {
	TTL_MS: number;
	MAX_USES: number;
	acceptTurnstile: (opts: {
		token: string;
		remoteIp?: string;
		now?: number;
		verify: () => boolean;
	}) => boolean;
	resetForTests: () => void;
};

describe("turnstile token reuse (create-team batch)", () => {
	beforeEach(() => {
		cache.resetForTests();
	});

	it("calls siteverify only once for the same token across a 6-player batch", () => {
		let calls = 0;
		const verify = () => {
			calls += 1;
			return true;
		};
		const opts = { token: "tok_1", remoteIp: "203.0.113.8", verify, now: 1_000 };

		for (let i = 0; i < 6; i++) {
			expect(cache.acceptTurnstile({ ...opts, now: 1_000 + i })).toBe(true);
		}

		expect(calls).toBe(1);
	});

	it("rejects a 7th reuse so one widget cannot cover two teams", () => {
		const verify = () => true;
		const opts = { token: "tok_1", remoteIp: "203.0.113.8", verify, now: 1_000 };

		for (let i = 0; i < 6; i++) {
			expect(cache.acceptTurnstile(opts)).toBe(true);
		}
		expect(cache.acceptTurnstile(opts)).toBe(false);
	});

	it("does not reuse across different IPs", () => {
		let calls = 0;
		const verify = () => {
			calls += 1;
			return true;
		};

		expect(
			cache.acceptTurnstile({
				token: "tok_1",
				remoteIp: "203.0.113.8",
				now: 1_000,
				verify,
			}),
		).toBe(true);
		expect(
			cache.acceptTurnstile({
				token: "tok_1",
				remoteIp: "198.51.100.2",
				now: 1_001,
				verify,
			}),
		).toBe(true);
		expect(calls).toBe(2);
	});

	it("siteverifies again after the token TTL", () => {
		let calls = 0;
		const verify = () => {
			calls += 1;
			return true;
		};

		expect(
			cache.acceptTurnstile({
				token: "tok_1",
				remoteIp: "203.0.113.8",
				now: 0,
				verify,
			}),
		).toBe(true);
		expect(
			cache.acceptTurnstile({
				token: "tok_1",
				remoteIp: "203.0.113.8",
				now: cache.TTL_MS + 1,
				verify,
			}),
		).toBe(true);
		expect(calls).toBe(2);
	});

	it("does not cache a failed siteverify", () => {
		expect(
			cache.acceptTurnstile({
				token: "tok_bad",
				remoteIp: "203.0.113.8",
				now: 1_000,
				verify: () => false,
			}),
		).toBe(false);
		expect(
			cache.acceptTurnstile({
				token: "tok_bad",
				remoteIp: "203.0.113.8",
				now: 1_001,
				verify: () => true,
			}),
		).toBe(true);
	});
});
