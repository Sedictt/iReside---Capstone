"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";
import { DEFAULT_BANNER_ART_URL, resolveBannerUrl } from "@/lib/art/abstract-art";

interface DashboardBackgroundProps {
    image: string;
    className?: string;
}

export function DashboardBackground({ image: rawImage, className }: DashboardBackgroundProps) {
    const { t } = useLanguageContext();
    const image = resolveBannerUrl(rawImage) ?? DEFAULT_BANNER_ART_URL;
    const isWhitelistedHost =
        image.startsWith("/") ||
        image.includes("supabase.co") ||
        image.includes("googleusercontent.com") ||
        image.includes("ui-avatars.com") ||
        image.includes("api.qrserver.com");

    return (
        <div className={cn("absolute inset-0 overflow-hidden rounded-2xl", className)}>
            <Image
                src={image}
                alt={t("Dashboard Banner")}
                fill
                sizes="100vw"
                unoptimized={!isWhitelistedHost}
                className="object-cover opacity-80 dark:opacity-55"
            />
            
            {/* Clean directional readability scrim (keeps left greeting & right clock legible without milky blur blobs) */}
            <div className="absolute inset-0 bg-gradient-to-r from-card via-card/85 to-card/45 dark:from-zinc-900 dark:via-zinc-900/85 dark:to-zinc-900/50" />
        </div>
    );
}
