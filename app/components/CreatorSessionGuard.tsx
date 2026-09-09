"use client";

import { useEffect, useRef } from "react";
import { createClient } from "../../lib/supabase";

const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes

export function CreatorSessionGuard() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function logoutForInactivity() {
      await supabase.auth.signOut();
      window.location.href = "/login?reason=inactive";
    }

    function resetTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        void logoutForInactivity();
      }, INACTIVITY_LIMIT);
    }

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
    ] as const;

    events.forEach((event) => {
      window.addEventListener(event, resetTimer, {
        passive: true,
      });
    });

    resetTimer();

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  return null;
}