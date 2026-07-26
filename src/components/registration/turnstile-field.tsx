import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { useRef } from "react";

const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() ?? "";

export function isTurnstileConfigured() {
  return siteKey.length > 0;
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
      <Turnstile
        ref={ref}
        siteKey={siteKey}
        options={{
          theme: "auto",
          size: "normal",
          appearance: "always",
          // Only emit a token after Cloudflare accepts the challenge.
          execution: "render",
          retry: "auto",
        }}
        onSuccess={(token) => onToken(token)}
        onExpire={() => {
          onToken(null);
          ref.current?.reset();
        }}
        onError={() => onToken(null)}
        onTimeout={() => {
          onToken(null);
          ref.current?.reset();
        }}
      />
    </div>
  );
}
