import { useEffect, useRef, useState, useCallback } from "react";

interface UseIdleTimeoutOptions {
  timeoutMs: number;       // Total idle time before logout
  warningMs: number;       // When to show warning (before timeout)
  onTimeout: () => void;
  enabled?: boolean;
}

export function useIdleTimeout({
  timeoutMs,
  warningMs,
  onTimeout,
  enabled = true,
}: UseIdleTimeoutOptions) {
  const [showWarning, setShowWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const warningRef = useRef<ReturnType<typeof setTimeout>>();
  const countdownRef = useRef<ReturnType<typeof setInterval>>();
  const lastActivityRef = useRef(Date.now());

  const resetTimers = useCallback(() => {
    if (!enabled) return;
    lastActivityRef.current = Date.now();
    setShowWarning(false);

    clearTimeout(timeoutRef.current);
    clearTimeout(warningRef.current);
    clearInterval(countdownRef.current);

    const warningDelay = timeoutMs - warningMs;

    warningRef.current = setTimeout(() => {
      setShowWarning(true);
      setRemainingSeconds(Math.ceil(warningMs / 1000));

      countdownRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, warningDelay);

    timeoutRef.current = setTimeout(() => {
      setShowWarning(false);
      clearInterval(countdownRef.current);
      onTimeout();
    }, timeoutMs);
  }, [timeoutMs, warningMs, onTimeout, enabled]);

  const stayActive = useCallback(() => {
    resetTimers();
  }, [resetTimers]);

  useEffect(() => {
    if (!enabled) return;

    const events = ["mousedown", "keydown", "touchstart", "scroll", "mousemove"];
    
    // Throttle to avoid excessive resets
    let throttled = false;
    const handleActivity = () => {
      if (throttled) return;
      throttled = true;
      resetTimers();
      setTimeout(() => { throttled = false; }, 5000);
    };

    events.forEach((e) => document.addEventListener(e, handleActivity, { passive: true }));
    resetTimers();

    return () => {
      events.forEach((e) => document.removeEventListener(e, handleActivity));
      clearTimeout(timeoutRef.current);
      clearTimeout(warningRef.current);
      clearInterval(countdownRef.current);
    };
  }, [resetTimers, enabled]);

  return { showWarning, remainingSeconds, stayActive };
}
