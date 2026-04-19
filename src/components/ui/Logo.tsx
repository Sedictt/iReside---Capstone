import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
    variant?: "primary" | "stacked" | "submark";
    theme?: "adaptive" | "light" | "dark";
    className?: string;
}

export function Logo({ variant = "primary", theme = "adaptive", className }: LogoProps) {
    // Determine the paths based on variant
    const getPaths = () => {
        switch (variant) {
            case "primary":
                return {
                    light: "/logos/primary.png",
                    dark: "/logos/primary_white_text.png",
                };
            case "stacked":
                return {
                    light: "/logos/stacked_black.png",
                    dark: "/logos/stacked_white_text.png",
                };
            case "submark":
                return {
                    light: "/logos/submark_black.png",
                    dark: "/logos/submark_white.png",
                };
        }
    };

    const paths = getPaths();

    return (
        <div className={cn("relative flex items-center justify-center", className)}>
            {(theme === "adaptive" || theme === "light") && (
                <Image
                    src={paths.light}
                    alt={`iReside ${variant} logo`}
                    fill
                    className={cn("object-contain", theme === "adaptive" && "dark:hidden")}
                />
            )}
            {(theme === "adaptive" || theme === "dark") && (
                <Image
                    src={paths.dark}
                    alt={`iReside ${variant} logo`}
                    fill
                    className={cn("object-contain", theme === "adaptive" ? "hidden dark:block" : "block")}
                />
            )}
        </div>
    );
}
