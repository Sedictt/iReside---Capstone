"use client";

import React, { useMemo, useEffect, useRef, useState } from "react";
import { Toaster, useSonner, toast } from "sonner";

/**
 * Standard reading time per notification before collapsing.
 * In deck view, each notification sequentially receives its full reading window.
 */
const TOAST_DURATION = 4000;

/**
 * AppToaster
 *
 * Implements intelligent adaptive notification stacking, FIFO queue, and sequential timers:
 * 1. FIFO (First-In, First-Out): In deck view, the earliest notification is on top.
 * 2. Sequential Timer: Each notification's 4-second countdown only runs when it is at the front
 *    of the deck (after the one before it has collapsed), guaranteeing users have time to read each message.
 * 3. Smooth Card Slide Exit: When a notification in deck view collapses, it slides smoothly to the right
 *    like removing a card from a deck.
 * 4. Adaptive Layout:
 *    - 1 Toast: Clean standalone banner.
 *    - Exactly 2 Toasts: Displayed vertically stacked with reasonable, compact spacing (8px gap).
 *    - 3+ Toasts: Stacked in an authentic stepped iOS card deck.
 * 5. Hover Expansion: Hovering over the toaster pauses timers and expands cards vertically for full readability.
 */
export function AppToaster() {
  const { toasts } = useSonner();
  const [isHovered, setIsHovered] = useState(false);

  // Active toasts (excluding already deleted or dismissed ones)
  const activeToasts = useMemo(() => {
    return toasts.filter((t) => !t.delete);
  }, [toasts]);

  const activeCount = activeToasts.length;

  // Adaptive stacking rule:
  // - If exactly 2 notifications -> expand=true (stacked vertically with 8px gap)
  // - If 3 or more notifications -> expand=false (iOS-style card deck)
  // - If 1 or 0 notifications   -> expand=false (single clean banner)
  const shouldExpand = activeCount === 2;

  // FIFO Queue: chronological order of arrival (oldest first)
  // In Sonner, new toasts are prepended to index 0, so the oldest is at the end.
  const fifoQueue = useMemo(() => {
    return [...activeToasts].reverse();
  }, [activeToasts]);

  // Current front notification in the FIFO queue
  const currentFront = fifoQueue[0];
  const currentFrontId = currentFront?.id;

  // Timer tracking refs
  const frontIdRef = useRef<string | number | null>(null);
  const remainingTimeRef = useRef<number>(TOAST_DURATION);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen to mouseenter / mouseleave on the toaster container for hover pause
  useEffect(() => {
    if (typeof document === "undefined") return;

    const toasterEl = document.querySelector("[data-sonner-toaster]") || document.querySelector(".ireside-toaster");
    if (!toasterEl) return;

    const handleMouseEnter = () => setIsHovered(true);
    const handleMouseLeave = () => setIsHovered(false);

    toasterEl.addEventListener("mouseenter", handleMouseEnter);
    toasterEl.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      toasterEl.removeEventListener("mouseenter", handleMouseEnter);
      toasterEl.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [activeCount]);

  // Sequential FIFO Timer Controller:
  // Background notifications wait; only the front notification's timer ticks down.
  useEffect(() => {
    if (currentFrontId === undefined || currentFrontId === null) {
      if (timerRef.current) clearTimeout(timerRef.current);
      frontIdRef.current = null;
      return;
    }

    // New notification stepped into the front position
    if (frontIdRef.current !== currentFrontId) {
      frontIdRef.current = currentFrontId;
      remainingTimeRef.current = TOAST_DURATION;
      startTimeRef.current = Date.now();
    }

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Pause timer on hover
    if (isHovered) {
      const elapsed = Date.now() - startTimeRef.current;
      remainingTimeRef.current = Math.max(500, remainingTimeRef.current - elapsed);
      return;
    }

    // Start countdown for remaining time
    startTimeRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      if (frontIdRef.current !== null && frontIdRef.current !== undefined) {
        toast.dismiss(frontIdRef.current);
      }
    }, remainingTimeRef.current);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentFrontId, isHovered]);

  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      expand={shouldExpand}
      duration={Infinity} /* Managed sequentially by AppToaster FIFO queue */
      visibleToasts={3}
      gap={8}
      theme="system"
      className="ireside-toaster"
      toastOptions={{
        className: "ireside-toast",
        duration: Infinity,
      }}
    />
  );
}

export default AppToaster;
