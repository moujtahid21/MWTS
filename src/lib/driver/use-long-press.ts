"use client";

/* ============================================================
   MW Transport Service — Fahrer-Portal: Long-Press Hook
   ------------------------------------------------------------
   Erkennt langes Drücken (Maus + Touch). Kurzer Tap → onClick,
   Halten > ms → onLongPress (z. B. „Ganztägig verfügbar").
   ============================================================ */
import { useRef, useState, useCallback } from "react";

export interface LongPressHandlers {
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  onTouchCancel: () => void;
}

export function useLongPress(
  onLongPress?: () => void,
  onClick?: () => void,
  ms = 600,
): { pressing: boolean; handlers: LongPressHandlers } {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFired = useRef(false);
  const [pressing, setPressing] = useState(false);

  const clear = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }, []);

  const start = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if ("button" in e && e.type === "mousedown" && e.button !== 0) return;
      longFired.current = false;
      setPressing(true);
      timer.current = setTimeout(() => {
        longFired.current = true;
        setPressing(false);
        onLongPress?.();
      }, ms);
    },
    [ms, onLongPress],
  );

  const end = useCallback(() => {
    clear();
    setPressing(false);
    if (!longFired.current) onClick?.();
  }, [clear, onClick]);

  const cancel = useCallback(() => {
    clear();
    setPressing(false);
    longFired.current = true;
  }, [clear]);

  return {
    pressing,
    handlers: {
      onMouseDown: start,
      onMouseUp: end,
      onMouseLeave: cancel,
      onTouchStart: start,
      onTouchEnd: (e) => {
        e.preventDefault();
        end();
      },
      onTouchCancel: cancel,
    },
  };
}
