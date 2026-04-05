"use client";

import * as React from "react";
import { MoonStar, SunMedium } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
    variant?: "floating" | "sidebar";
    className?: string;
    dataTourId?: string;
};

export function ThemeToggle({ variant = "floating", className, dataTourId }: ThemeToggleProps) {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return null;
    }

    const isDark = resolvedTheme !== "light";

    return (
        <button
            type="button"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            data-tour-id={dataTourId}
            className={cn(
                variant === "floating"
                    ? "fixed bottom-4 right-4 z-[120] inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur transition-all hover:-translate-y-0.5"
                    : "inline-flex h-10 w-10 items-center justify-center rounded-xl border text-foreground transition-colors hover:bg-muted",
                "border-border/80 bg-card/90 text-foreground hover:bg-card",
                className
            )}
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
        >
            {isDark ? <SunMedium className="h-4 w-4 text-amber-500" /> : <MoonStar className="h-4 w-4 text-sky-500" />}
            {variant === "floating" && <span className="hidden sm:inline">{isDark ? "Light mode" : "Dark mode"}</span>}
        </button>
    );
}
