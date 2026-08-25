import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";

const HOLD_MS = 2000;
const SNAP_MS = 200;
const EASE_OUT = "cubic-bezier(0.22, 1, 0.36, 1)";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

type HoldToConfirmButtonProps = {
  children: ReactNode;
  onConfirm: () => void;
  disabled?: boolean;
  className?: string;
  holdLabel?: string;
  variant?: ComponentProps<typeof Button>["variant"];
  size?: ComponentProps<typeof Button>["size"];
};

/**
 * Hold 2s to confirm (pointer). Keyboard Enter/Space confirms immediately.
 * Reduced motion: click confirms with no fill.
 */
export function HoldToConfirmButton({
  children,
  onConfirm,
  disabled,
  className,
  holdLabel = "Hold to confirm",
  variant = "destructive",
  size = "default",
}: HoldToConfirmButtonProps) {
  const [holding, setHolding] = useState(false);
  const [filled, setFilled] = useState(false);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);
  const confirmedRef = useRef(false);

  const clearTimers = useCallback(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const fireConfirm = useCallback(() => {
    if (confirmedRef.current || disabled) return;
    confirmedRef.current = true;
    clearTimers();
    setHolding(false);
    setFilled(false);
    onConfirm();
  }, [clearTimers, disabled, onConfirm]);

  const cancelHold = useCallback(() => {
    clearTimers();
    pointerIdRef.current = null;
    setHolding(false);
    setFilled(false);
  }, [clearTimers]);

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (disabled || e.button !== 0) return;
    if (pointerIdRef.current != null) return;

    if (prefersReducedMotion()) {
      e.preventDefault();
      fireConfirm();
      return;
    }

    pointerIdRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    confirmedRef.current = false;
    clearTimers();
    setHolding(true);
    setFilled(false);
    // Next frame so clip-path starts collapsed, then expands over HOLD_MS
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = window.requestAnimationFrame(() => {
        setFilled(true);
      });
    });
    timerRef.current = window.setTimeout(() => {
      fireConfirm();
    }, HOLD_MS);
  };

  const onPointerUpOrCancel = (e: PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== e.pointerId) return;
    if (confirmedRef.current) {
      pointerIdRef.current = null;
      return;
    }
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    cancelHold();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      fireConfirm();
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled}
      className={cn(
        "relative isolate overflow-hidden select-none",
        className,
      )}
      aria-label={typeof children === "string" ? children : holdLabel}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUpOrCancel}
      onPointerCancel={onPointerUpOrCancel}
      onKeyDown={onKeyDown}
      onClick={(e) => e.preventDefault()}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 bg-white/25 dark:bg-black/25"
        style={{
          clipPath: filled ? "inset(0 0 0 0)" : "inset(0 100% 0 0)",
          transition: holding
            ? `clip-path ${HOLD_MS}ms linear`
            : `clip-path ${SNAP_MS}ms ${EASE_OUT}`,
        }}
      />
      <span className="relative z-10 inline-flex items-center gap-2">
        {holding ? holdLabel : children}
      </span>
    </Button>
  );
}
