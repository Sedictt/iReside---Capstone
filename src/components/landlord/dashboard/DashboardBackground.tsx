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
        <div className={cn("absolute inset-0 overflow-hidden rounded-[2.5rem]", className)}>
            <Image
                src={image}
                alt={t("Dashboard Banner")}
                fill
                sizes="100vw"
                unoptimized={!isWhitelistedHost}
                className="object-cover transition-transform duration-[2000ms] group-hover:scale-110 opacity-60 dark:opacity-40"
            />
            
            {/* Progressive Gradients */}
            <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/90 to-background/20" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/95 to-transparent" />
            
            {/* Decorative Spotlight */}
            <div className="absolute -top-24 -right-24 size-96 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-white/5 blur-[80px] pointer-events-none" />
        </div>
    );
}
