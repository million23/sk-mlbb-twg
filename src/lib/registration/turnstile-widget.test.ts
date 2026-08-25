import { describe, expect, it } from "vitest";
import {
	handleTurnstileClientEvent,
	TURNSTILE_WIDGET_OPTIONS,
} from "./turnstile-widget";

describe("TURNSTILE_WIDGET_OPTIONS", () => {
	it("lets Cloudflare auto-refresh expired tokens instead of a manual reset", () => {
		expect(TURNSTILE_WIDGET_OPTIONS.refreshExpired).toBe("auto");
		expect(TURNSTILE_WIDGET_OPTIONS.refreshTimeout).toBe("auto");
	});
});

describe("handleTurnstileClientEvent", () => {
	it("clears the token on expire without resetting (auto-refresh owns the widget)", () => {
		expect(handleTurnstileClientEvent("expire")).toEqual({
			clearToken: true,
			resetWidget: false,
			showRetry: false,
		});
	});

	it("clears the token on timeout without resetting", () => {
		expect(handleTurnstileClientEvent("timeout")).toEqual({
			clearToken: true,
			resetWidget: false,
			showRetry: false,
		});
	});

	it("shows retry after error so submit is not stuck on a dead widget", () => {
		expect(handleTurnstileClientEvent("error")).toEqual({
			clearToken: true,
			resetWidget: true,
			showRetry: true,
		});
	});

	it("remounts after a failed submit so the next challenge can succeed", () => {
		expect(handleTurnstileClientEvent("submit-fail")).toEqual({
			clearToken: true,
			resetWidget: true,
			showRetry: true,
		});
	});
});
