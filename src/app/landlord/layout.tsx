"use client";

import { Sidebar } from "@/components/landlord/Sidebar";
import { InPersonPaymentModal } from "@/components/landlord/InPersonPaymentModal";
import { ContactsSidebar } from "@/components/landlord/dashboard/ContactsSidebar";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";
import { PropertyProvider } from "@/context/PropertyContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ProfileCardProvider } from "@/context/ProfileCardContext";
import { ProfileCard } from "@/components/ui/ProfileCard";
import { LandlordQuestTriggerGuide } from "@/components/landlord/dashboard/LandlordQuestTriggerGuide";
import { NotificationBanner } from "@/components/navigation/NotificationBanner";

export default function LandlordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isGlobalFullscreen, setIsGlobalFullscreen] = useState(false);

    useEffect(() => {
        const handleToggle = (e: any) => setIsGlobalFullscreen(e.detail);
        window.addEventListener('hide-sidebars', handleToggle);
        return () => window.removeEventListener('hide-sidebars', handleToggle);
    }, []);

    const isMessages = pathname?.startsWith("/landlord/messages");
    const isUnitMap = pathname?.startsWith("/landlord/unit-map");
    const isSettings = pathname?.startsWith("/landlord/settings");
    const isOnboarding = pathname?.startsWith("/landlord/onboarding");
    
    const showSidebar = !isMessages && !isSettings && !isOnboarding && !isGlobalFullscreen;
    const showContactsSidebar = !isMessages && !isUnitMap && !isSettings && !isOnboarding && !isGlobalFullscreen;

    return (
        <AuthProvider>
            <PropertyProvider>
                <NotificationProvider>
                    <ProfileCardProvider>
                        <div className="flex h-screen bg-background text-foreground overflow-hidden">
                            {showSidebar && (
                                <Sidebar 
                                    isCollapsed={isSidebarCollapsed} 
                                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                    showCollapseToggle={isUnitMap}
                                />
                            )}
                            
                            <main 
                                className={cn(
                                    "flex-1 overflow-y-auto h-full transition-all duration-300 relative", 
                                    showSidebar ? (isSidebarCollapsed ? "ml-[80px]" : "ml-[280px]") : "",
                                    showContactsSidebar ? "md:pr-24" : ""
                                )}
                            >
                                {!isOnboarding && (
                                    <div className={cn(
                                        "w-full pointer-events-none z-[100]",
                                        showContactsSidebar && "md:pr-24"
                                    )}>
                                        <NotificationBanner />
                                    </div>
                                )}
                                {children}
                            </main>
                            
                            {showContactsSidebar && <ContactsSidebar />}
                            <InPersonPaymentModal />
                        </div>
                        <ProfileCard />
                        <LandlordQuestTriggerGuide />
                    </ProfileCardProvider>
                </NotificationProvider>
            </PropertyProvider>
        </AuthProvider>
    );
}


