"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Camera } from "lucide-react";
import { LandlordQuestBoard } from "@/components/landlord/dashboard/LandlordQuestBoard";
import { DashboardHeaderActions } from "./DashboardHeaderActions";
import { DashboardMainContent } from "./DashboardMainContent";
import { DashboardDigitalClock } from "./DashboardDigitalClock";
import { DashboardBackground } from "./DashboardBackground";
import { BannerCustomizerModal, DEFAULT_BANNER_URL } from "./BannerCustomizerModal";
import { useAuth } from "@/hooks/useAuth";
import { useBrand } from "@/context/BrandContext";

interface DashboardBannerProps {
    title?: string;
    subtitle?: string;
    image?: string;
    className?: string;
    simplifiedMode?: boolean;
    onNewWalkIn?: () => void;
    onCreateInvite?: () => void;
    onOpenFlyer?: () => void;
}

export function DashboardBanner({
    title = "Welcome back, Landlord",
    subtitle = "Here's what's happening with your properties today.",
    image = DEFAULT_BANNER_URL,
    className,
    simplifiedMode = false,
    onNewWalkIn,
    onCreateInvite,
    onOpenFlyer
}: DashboardBannerProps) {
    const brand = useBrand();
    const getManilaTime = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const [time, setTime] = useState<Date>(() => getManilaTime());
    const [isQuestPanelOpen, setIsQuestPanelOpen] = useState(false);
    const [isCustomizerOpen, setIsCustomizerOpen] = useState(false);

    // Active Banner with BrandContext & LocalStorage Persistence
    const [activeBanner, setActiveBanner] = useState<string>(brand.bannerUrl || image);

    useEffect(() => {
        if (brand.bannerUrl) {
            setActiveBanner(brand.bannerUrl);
            return;
        }
        try {
            const saved = localStorage.getItem("ireside_landlord_custom_banner_url");
            if (saved) {
                setActiveBanner(saved);
            }
        } catch {
            // Ignore storage errors
        }

        const handleBannerUpdated = (e: CustomEvent<string>) => {
            if (e.detail) {
                setActiveBanner(e.detail);
            }
        };

        window.addEventListener("banner-updated" as any, handleBannerUpdated);
        return () => window.removeEventListener("banner-updated" as any, handleBannerUpdated);
    }, [brand.bannerUrl]);
    
    const { profile, user, loading: authLoading } = useAuth();
    const rawName = profile?.full_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "";
    const firstName = rawName.split(" ")[0] || "Landlord";
    
    // Replace 'Landlord' in the title if it exists, otherwise use title as is
    const displayTitle = title.includes("Landlord") ? title.replace("Landlord", firstName) : title;
    const displaySubtitle = simplifiedMode ? "Hi! Here is a quick look at your houses today." : subtitle;

    useEffect(() => {
        const handleOpenQuestBoard = () => {
            setIsQuestPanelOpen(true);
        };

        window.addEventListener("open-quest-board", handleOpenQuestBoard);
        return () => window.removeEventListener("open-quest-board", handleOpenQuestBoard);
    }, []);

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(getManilaTime());
        }, 1000);
        
        return () => clearInterval(timer);
    }, []);

    const handleQuestPanelOpen = () => {
        setIsQuestPanelOpen(true);
        window.dispatchEvent(new CustomEvent("open-quest-board"));
    };

    return (
        <div
            className={cn(
                "group relative min-h-[200px] xs:min-h-[220px] sm:min-h-[240px] md:min-h-[320px] w-full shrink-0 overflow-visible rounded-[2.5rem] neumorphic-panel transition-all duration-500",
                className
            )}>
            {/* Background Layer */}
            <DashboardBackground image={activeBanner} />

            {/* Header Actions (Floating Controls & Dropdown with top z-index z-50) */}
            <DashboardHeaderActions onQuestPanelOpen={handleQuestPanelOpen} />

            {/* Main Content Area */}
            <div className="relative z-10 w-full px-4 py-5 sm:px-6 sm:py-8 md:px-10 md:py-10 pointer-events-none">
                {/* Banner uses lg:grid to put content on left, clock on right on large screens */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-6 lg:gap-8 pointer-events-auto">
                    <DashboardMainContent
                        title={displayTitle}
                        subtitle={displaySubtitle}
                        time={time}
                        onNewWalkIn={onNewWalkIn}
                        onCreateInvite={onCreateInvite}
                        onOpenFlyer={onOpenFlyer}
                    />

                    {/* Digital Clock - only visible on large screens */}
                    <div className="hidden lg:block shrink-0">
                        <DashboardDigitalClock time={time} />
                    </div>
                </div>
            </div>

            {/* Floating Banner Customizer Button (z-20 for instant clicks, layered behind z-50 dropdown) */}
            <button
                type="button"
                onClick={() => setIsCustomizerOpen(true)}
                className="absolute bottom-3 right-4 z-20 pointer-events-auto opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300 px-3 py-1.5 rounded-xl bg-background/80 hover:bg-background border border-border/60 backdrop-blur-md text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-foreground flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                title="Customize banner image"
            >
                <Camera className="size-3.5 text-primary" />
                <span>Customize Banner</span>
            </button>

            {/* Side Quest Panel */}
            <LandlordQuestBoard 
                isOpen={isQuestPanelOpen} 
                onClose={() => setIsQuestPanelOpen(false)} 
            />

            {/* Banner Customizer Modal */}
            <BannerCustomizerModal
                isOpen={isCustomizerOpen}
                onClose={() => setIsCustomizerOpen(false)}
                currentBanner={activeBanner}
                onBannerChange={(newBanner) => setActiveBanner(newBanner)}
            />
        </div>
    );
}
