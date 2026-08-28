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
import { GlobalDetailModal } from "@/components/landlord/tenants/GlobalDetailModal";
import { LandlordQuestTriggerGuide } from "@/components/landlord/dashboard/LandlordQuestTriggerGuide";
import { NotificationBanner } from "@/components/navigation/NotificationBanner";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfileWidget } from "@/components/landlord/ProfileWidget";
import { AnimatePresence, m as motion } from "framer-motion";

export default function LandlordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isGlobalFullscreen, setIsGlobalFullscreen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    useEffect(() => {
        const handleToggle = (e: any) => setIsGlobalFullscreen(e.detail);
        window.addEventListener('hide-sidebars', handleToggle);
        return () => window.removeEventListener('hide-sidebars', handleToggle);
    }, []);

    // Auto-close mobile sidebar when pathname changes (navigation)
    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [pathname]);
    
    const isMessages = pathname?.startsWith("/landlord/messages");
    const isUnitMap = pathname?.startsWith("/landlord/unit-map");
    const isSettings = pathname?.startsWith("/landlord/settings");
    const isOnboarding = pathname?.startsWith("/landlord/onboarding");
    const isDocs = pathname?.startsWith("/landlord/docs") || pathname?.startsWith("/landlord/documentation") || pathname?.startsWith("/landlord/flyer");
    
    const showSidebar = !isMessages && !isSettings && !isOnboarding && !isDocs && !isGlobalFullscreen;
    const showContactsSidebar = !isMessages && !isUnitMap && !isSettings && !isOnboarding && !isDocs && !isGlobalFullscreen;

    return (
        <AuthProvider>
            <PropertyProvider>
                <NotificationProvider>
                    <ProfileCardProvider>
                        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden flex-col md:flex-row">
                            {/* Desktop Sidebar (hidden on mobile, visible on desktop) */}
                            {showSidebar && (
                                <Sidebar 
                                    isCollapsed={isSidebarCollapsed} 
                                    onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                                    showCollapseToggle={isUnitMap}
                                    className="hidden md:flex"
                                />
                            )}
                            
                            {/* Mobile Sticky Top Header */}
                            {showSidebar && (
                                <header className="md:hidden sticky top-0 z-[45] h-16 w-full border-b border-border/40 bg-card/85 backdrop-blur-xl px-4 flex items-center justify-between shrink-0">
                                    <button 
                                        onClick={() => setIsMobileSidebarOpen(true)} 
                                        className="p-2 hover:bg-muted rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                        aria-label="Open navigation menu"
                                    >
                                        <Menu className="size-6" />
                                    </button>
                                    <div className="flex items-center">
                                        <Logo className="h-16 w-20" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <ThemeToggle variant="sidebar" />
                                        <ProfileWidget />
                                    </div>
                                </header>
                            )}

                            {/* Mobile slide-out drawer sidebar overlay/backdrop */}
                            <AnimatePresence>
                                {isMobileSidebarOpen && showSidebar && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="fixed inset-0 z-[48] bg-black/60 backdrop-blur-sm md:hidden"
                                        onClick={() => setIsMobileSidebarOpen(false)}
                                    />
                                )}
                            </AnimatePresence>

                            {/* Mobile slide-out drawer sidebar */}
                            {showSidebar && (
                                <div 
                                    className={cn(
                                        "fixed inset-y-0 left-0 z-[49] w-[280px] md:hidden transform transition-transform duration-300 ease-in-out bg-background shadow-2xl flex flex-col",
                                        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                                    )}
                                >
                                    <Sidebar 
                                        isCollapsed={false}
                                        onToggleCollapse={() => {}}
                                        showCollapseToggle={false}
                                        className="h-full border-r-0 shadow-none !w-full"
                                    />
                                    {/* Close Button Inside Mobile Drawer */}
                                    <button
                                        onClick={() => setIsMobileSidebarOpen(false)}
                                        className="absolute top-6 right-4 z-[50] p-2 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground transition-colors hover:scale-105 active:scale-95"
                                        aria-label="Close menu"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>
                            )}

                            <main 
                                className={cn(
                                    "flex-1 overflow-y-auto h-full transition-all duration-300 relative", 
                                    showSidebar ? (isSidebarCollapsed ? "md:ml-[80px]" : "md:ml-[280px]") : "",
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
                        <GlobalDetailModal />
                        <LandlordQuestTriggerGuide />
                    </ProfileCardProvider>
                </NotificationProvider>
            </PropertyProvider>
        </AuthProvider>
    );
}


