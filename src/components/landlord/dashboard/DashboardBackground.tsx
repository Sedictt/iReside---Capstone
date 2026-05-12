"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface DashboardBackgroundProps {
    image: string;
    className?: string;
}

export function DashboardBackground({ image, className }: DashboardBackgroundProps) {
    return (
        <div className="absolute inset-0 overflow-hidden rounded-[2.5rem]">
            <Image
                src={image}
                alt="Dashboard Banner"
                fill
                sizes="100vw"
                className="object-cover transition-transform duration-[2000ms] group-hover:scale-110 opacity-60 dark:opacity-40"
            />
            
            {/* Noise Texture Overlay */}
            <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

            {/* Progressive Gradients */}
            <div className="absolute inset-0 bg-gradient-to-tr from-background via-background/90 to-background/20" />
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/95 to-transparent" />
            
            {/* Decorative Spotlight */}
            <div className="absolute -top-24 -right-24 size-96 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 size-64 rounded-full bg-white/5 blur-[80px] pointer-events-none" />
        </div>
    );
}
