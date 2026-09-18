"use client";

import React, { useMemo } from "react";
import { Toaster, useSonner } from "sonner";

/**
 * AppToaster
 *
 * Implements intelligent adaptive notification stacking and auto-dismissal:
 * 1. Auto-dismissal: Toasts automatically close after 4000ms (pause on hover).
 * 2. 1 Toast: Displays as a clean standalone banner.
 * 3. Exactly 2 Toasts: Displayed stacked vertically with compact, reasonable spacing (gap: 10px).
 * 4. 3 or More Toasts: Stacked in an iOS-style card deck with depth, scale, and subtle shadows.
 * 5. Graceful transition: As toasts dismiss, 3+ stacks collapse smoothly into the 2-toast vertical view,
 *    then to 1, and close gracefully.
 */
export function AppToaster() {
  const { toasts } = useSonner();

  // Determine active count (excluding already deleted or dismissed toasts)
  const activeCount = useMemo(() => {
    return toasts.filter((t) => !t.delete).length;
  }, [toasts]);

  // Adaptive stacking rule:
  // - If exactly 2 notifications -> expand=true (stacked vertically with reasonable spacing)
  // - If 3 or more notifications -> expand=false (iOS-style card deck)
  // - If 1 or 0 notifications   -> expand=false (single clean banner)
  const shouldExpand = activeCount === 2;

  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      expand={shouldExpand}
      duration={4000}
      visibleToasts={3}
      gap={10}
      theme="system"
      className="ireside-toaster"
      toastOptions={{
        className: "ireside-toast",
        duration: 4000,
      }}
    />
  );
}

export default AppToaster;
