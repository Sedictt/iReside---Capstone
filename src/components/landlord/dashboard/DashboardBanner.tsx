"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { LandlordQuestBoard } from "@/components/landlord/dashboard/LandlordQuestBoard";
import { DashboardHeaderActions } from "./DashboardHeaderActions";
import { DashboardMainContent } from "./DashboardMainContent";
import { DashboardDigitalClock } from "./DashboardDigitalClock";
import { DashboardBackground } from "./DashboardBackground";
import { useAuth } from "@/hooks/useAuth";


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
    image = "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop",
    className,
    simplifiedMode = false,
    onNewWalkIn,
    onCreateInvite,
    onOpenFlyer
}: DashboardBannerProps) {
    const getManilaTime = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
    const [time, setTime] = useState<Date>(() => getManilaTime());
    const [isQuestPanelOpen, setIsQuestPanelOpen] = useState(false);
    
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
            <DashboardBackground image={image} />

            {/* Header Actions */}
            <DashboardHeaderActions onQuestPanelOpen={handleQuestPanelOpen} />

            {/* Main Content Area */}
            <div className="relative z-10 w-full px-4 py-5 sm:px-6 sm:py-8 md:px-10 md:py-10">
                {/* Banner uses lg:grid to put content on left, clock on right on large screens */}
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] items-center gap-6 lg:gap-8">
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

            {/* Side Quest Panel */}
            <LandlordQuestBoard 
                isOpen={isQuestPanelOpen} 
                onClose={() => setIsQuestPanelOpen(false)} 
            />
        </div>
    );
}

