import { Button } from "@/components/ui/button";
import {
	handleTurnstileClientEvent,
	TURNSTILE_WIDGET_OPTIONS,
	type TurnstileClientEvent,
} from "@/lib/registration/turnstile-widget";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef, useState } from "react";

export function getTurnstileSiteKey() {
	return import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";
}

export function isTurnstileConfigured() {
	return getTurnstileSiteKey().length > 0;
}

type TurnstileFieldProps = {
	onToken: (token: string | null) => void;
};

/**
 * Cloudflare Turnstile — always visible; token only after a real challenge success.
 * Omitted when `VITE_TURNSTILE_SITE_KEY` is unset.
 */
export function TurnstileField({ onToken }: TurnstileFieldProps) {
	const ref = useRef<TurnstileInstance>(null);
	const [widgetKey, setWidgetKey] = useState(0);
	const [retryVisible, setRetryVisible] = useState(false);
	const siteKey = getTurnstileSiteKey();

	const applyEvent = (event: TurnstileClientEvent) => {
		const action = handleTurnstileClientEvent(event);
		if (action.clearToken) onToken(null);
		if (action.resetWidget) {
			ref.current?.reset();
			setWidgetKey((k) => k + 1);
		}
		setRetryVisible(action.showRetry);
	};

	const retry = () => {
		onToken(null);
		setRetryVisible(false);
		ref.current?.reset();
		setWidgetKey((k) => k + 1);
	};

	if (!siteKey) {
		return (
			<p className="text-muted-foreground text-xs text-pretty">
				Bot check skipped in this environment (no Turnstile site key).
			</p>
		);
	}

	return (
		<div className="flex flex-col gap-1.5">
			<p className="font-mono text-[0.65rem] text-muted-foreground uppercase tracking-wider">
				Human verification
			</p>
			<p className="text-muted-foreground text-xs text-pretty">
				Wait for the check to finish before submitting. It is not skipped
				automatically.
			</p>
			<div className="min-h-16">
				<Turnstile
					key={widgetKey}
					ref={ref}
					siteKey={siteKey}
					options={TURNSTILE_WIDGET_OPTIONS}
					onSuccess={(token) => {
						setRetryVisible(false);
						onToken(token);
					}}
					onExpire={() => applyEvent("expire")}
					onError={() => applyEvent("error")}
					onTimeout={() => applyEvent("timeout")}
					onUnsupported={() => applyEvent("unsupported")}
				/>
			</div>
			{retryVisible ? (
				<div className="flex flex-col gap-1.5">
					<p className="text-destructive text-xs text-pretty">
						Verification failed to finish. Retry the check, then submit.
					</p>
					<Button
						type="button"
						variant="outline"
						size="sm"
						className="w-fit"
						onClick={retry}
					>
						Try verification again
					</Button>
				</div>
			) : null}
		</div>
	);
}
