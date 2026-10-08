"use client";

import { Sidebar } from "@/components/landlord/Sidebar";
import { InPersonPaymentModal } from "@/components/landlord/InPersonPaymentModal";
import { ContactsSidebar } from "@/components/landlord/dashboard/ContactsSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";
import { PropertyProvider } from "@/context/PropertyContext";
import { useLandlordSetup } from "@/hooks/useLandlordSetup";
import { NotificationProvider } from "@/context/NotificationContext";
import { ProfileCardProvider } from "@/context/ProfileCardContext";
import { ProfileCard } from "@/components/ui/ProfileCard";
import { GlobalDetailModal } from "@/components/landlord/tenants/GlobalDetailModal";
import { NotificationBanner } from "@/components/navigation/NotificationBanner";
import { LandlordWelcomeLightbox } from "@/components/landlord/dashboard/LandlordWelcomeLightbox";
import { LandlordUnitMapLightbox } from "@/components/landlord/dashboard/LandlordUnitMapLightbox";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/ui/LanguageToggle";
import { ProfileWidget } from "@/components/landlord/ProfileWidget";
import { AnimatePresence, m as motion } from "framer-motion";
import { toast } from "sonner";

function MandatoryPropertySetupGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    // Single source of truth: authoritative DB state + persisted deferrals.
    // While loading or on error, lockStage is null, so nobody is redirected on missing data.
    const { lockStage } = useLandlordSetup();

    const isAllowedCreationRoute = pathname === "/landlord/properties/new";
    const isAllowedUnitMapRoute = pathname?.startsWith("/landlord/unit-map");
    const isAllowedStage3Route =
        pathname === "/landlord/dashboard" ||
        pathname?.startsWith("/landlord/properties") ||
        pathname?.startsWith("/landlord/unit-map") ||
        pathname?.startsWith("/landlord/utility-billing");
    const isAllowedStage4Route =
        isAllowedStage3Route ||
        pathname?.startsWith("/landlord/invoices") ||
        pathname?.startsWith("/landlord/tenants") ||
        pathname?.startsWith("/landlord/applications");

    useEffect(() => {
        if (lockStage === "no_property" && !isAllowedCreationRoute) {
            // Zero properties: keep the landlord routed toward property setup
            if (pathname !== "/landlord/dashboard") {
                router.replace("/landlord/properties/new");
            }
        } else if (lockStage === "no_unit_map" && !isAllowedUnitMapRoute) {
            // Property registered but unit map unconfigured: keep routed toward unit map setup
            if (pathname !== "/landlord/dashboard") {
                router.replace("/landlord/unit-map");
            }
        } else if (lockStage === "no_billing_rails" && !isAllowedStage3Route) {
            toast.warning("Configure your payment channels and utility tariffs to unlock operations.");
            router.replace("/landlord/dashboard");
        } else if (lockStage === "no_tenant" && !isAllowedStage4Route) {
            toast.warning("Complete property setup and register your first tenant to unlock portal operations.");
            router.replace("/landlord/dashboard");
        }
    }, [lockStage, isAllowedCreationRoute, isAllowedUnitMapRoute, isAllowedStage3Route, isAllowedStage4Route, pathname, router]);

    return (
        <>
            {children}
            <LandlordWelcomeLightbox />
            <LandlordUnitMapLightbox />
        </>
    );
}

export default function LandlordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    
    const [sidebarWidth, setSidebarWidth] = useState(280);
    const [isGlobalFullscreen, setIsGlobalFullscreen] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    // Initialize persisted width
    useEffect(() => {
        if (typeof window === "undefined") return;
        try {
            const savedWidth = window.localStorage.getItem("ireside.sidebar_width");
            if (savedWidth) {
                const parsed = parseInt(savedWidth, 10);
                if (!isNaN(parsed) && parsed >= 240 && parsed <= 300) {
                    setSidebarWidth(parsed);
                }
            }
        } catch {
            // Ignore storage errors
        }

        const handleWidthChange = (e: any) => {
            if (e.detail && typeof e.detail === "number") {
                setSidebarWidth(e.detail);
            }
        };

        window.addEventListener("sidebar-width-changed" as any, handleWidthChange);
        return () => window.removeEventListener("sidebar-width-changed" as any, handleWidthChange);
    }, []);

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
                        <MandatoryPropertySetupGuard>
                            <div className="flex h-screen w-full bg-background text-foreground overflow-hidden flex-col md:flex-row">
                            {/* Desktop Sidebar (hidden on mobile, visible on desktop) */}
                            {showSidebar && (
                                <Sidebar 
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
                                        <LanguageToggle variant="compact" />
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
                                        "fixed inset-y-0 left-0 z-[49] w-[280px] md:hidden transform transition-transform duration-300 ease-in-out bg-card dark:bg-zinc-900 shadow-2xl flex flex-col",
                                        isMobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
                                    )}
                                >
                                    <Sidebar 
                                        onCloseMobile={() => setIsMobileSidebarOpen(false)}
                                        className="h-full border-r-0 shadow-none !w-full"
                                    />
                                </div>
                            )}

                            <main 
                                style={{
                                    marginLeft: showSidebar 
                                        ? (typeof window !== "undefined" && window.innerWidth < 768 ? 0 : sidebarWidth) 
                                        : 0
                                }}
                                className={cn(
                                    "flex-1 overflow-y-auto h-full transition-[margin] duration-200 relative", 
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
                    </MandatoryPropertySetupGuard>
                </ProfileCardProvider>
                </NotificationProvider>
            </PropertyProvider>
        </AuthProvider>
    );
}


