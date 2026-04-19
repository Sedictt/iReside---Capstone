"use client";

import ClickSpark from "@/components/ui/ClickSpark";
import { ReactNode } from "react";

/**
 * GlobalClickSpark
 * Wraps the full application in the ClickSpark canvas overlay so
 * spark animations fire on every click — including button clicks —
 * across every page, without any per-page wiring.
 */
export default function GlobalClickSpark({ children }: { children: ReactNode }) {
  return (
    <ClickSpark
      sparkColor="#6D9738"
      sparkSize={12}
      sparkRadius={22}
      sparkCount={10}
      duration={500}
      easing="ease-out"
      extraScale={1.2}
    >
      {children}
    </ClickSpark>
  );
}
