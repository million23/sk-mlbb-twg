export const TURNSTILE_WIDGET_OPTIONS = {
	theme: "auto",
	size: "normal",
	appearance: "always",
	execution: "render",
	retry: "auto",
	refreshExpired: "auto",
	refreshTimeout: "auto",
} as const;

export type TurnstileClientEvent =
	| "expire"
	| "timeout"
	| "error"
	| "unsupported"
	| "submit-fail";

export type TurnstileClientAction = {
	clearToken: boolean;
	resetWidget: boolean;
	showRetry: boolean;
};

/**
 * Cloudflare auto-refreshes expired/timed-out widgets by default.
 * Calling reset() in those callbacks races the auto-refresh and leaves
 * registration submit disabled with no token.
 */
export function handleTurnstileClientEvent(
	event: TurnstileClientEvent,
): TurnstileClientAction {
	if (event === "expire" || event === "timeout") {
		return { clearToken: true, resetWidget: false, showRetry: false };
	}
	return { clearToken: true, resetWidget: true, showRetry: true };
}
