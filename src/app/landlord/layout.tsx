"use client";

import { Sidebar } from "@/components/landlord/Sidebar";
import { InPersonPaymentModal } from "@/components/landlord/InPersonPaymentModal";
import { ContactsSidebar } from "@/components/landlord/dashboard/ContactsSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { PropertyProvider, useProperty } from "@/context/PropertyContext";
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
import { ProfileWidget } from "@/components/landlord/ProfileWidget";
import { AnimatePresence, m as motion } from "framer-motion";
import { toast } from "sonner";

function MandatoryPropertySetupGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { profile, loading: authLoading } = useAuth();
    const { properties, loading: propertyLoading, selectedPropertyId } = useProperty();

    const [localMapCompleted, setLocalMapCompleted] = useState(false);

    useEffect(() => {
        const checkLocal = () => {
            if (typeof window === "undefined") return;
            try {
                const activeId = selectedPropertyId && selectedPropertyId !== "all" 
                    ? selectedPropertyId 
                    : (properties[0]?.id || "default");
                const isCompleted = 
                    window.localStorage.getItem(`ireside_map_setup_complete_${activeId}`) === "true" ||
                    window.localStorage.getItem(`ireside.explore_modal_shown.${activeId}`) === "true" ||
                    window.localStorage.getItem(`ireside.awaiting_tenant_setup.${activeId}`) === "true" ||
                    window.localStorage.getItem(`ireside.onboarding_awaiting_tenant_setup.${activeId}`) === "true" ||
                    properties.some((p) => window.localStorage.getItem(`ireside_map_setup_complete_${p.id}`) === "true");
                setLocalMapCompleted(Boolean(isCompleted));
            } catch {
                setLocalMapCompleted(false);
            }
        };
        checkLocal();
        window.addEventListener("unit-map-setup-completed", checkLocal);
        window.addEventListener("unit-map-guidance-changed", checkLocal);
        window.addEventListener("storage", checkLocal);
        return () => {
            window.removeEventListener("unit-map-setup-completed", checkLocal);
            window.removeEventListener("unit-map-guidance-changed", checkLocal);
            window.removeEventListener("storage", checkLocal);
        };
    }, [selectedPropertyId, properties]);

    const isLandlord = profile?.role === "landlord" || profile?.role === "admin";
    const isReady = !authLoading && !propertyLoading;
    const hasZeroProperties = isReady && isLandlord && properties.length === 0;
    const isAllowedCreationRoute = pathname === "/landlord/properties/new";

    // Stage 2: Landlord has registered a property, but unit map is not yet configured
    const hasConfiguredMap = properties.some((p) => p.isMapSetupComplete) || localMapCompleted;
    const hasPendingUnitMap = isReady && isLandlord && properties.length > 0 && !hasConfiguredMap;
    const isAllowedUnitMapRoute = pathname?.startsWith("/landlord/unit-map");

    // Stage 3: Property registered & unit map configured, but 0 tenants registered
    const hasAtLeastOneTenant = properties.some((p) => 
        Boolean(p.hasTenants) || 
        p.units?.some((u) => (u.status || "").toLowerCase() === "occupied")
    );
    const hasPendingTenantSetup = isReady && isLandlord && properties.length > 0 && hasConfiguredMap && !hasAtLeastOneTenant;
    const isAllowedStage3Route = 
        pathname === "/landlord/dashboard" || 
        pathname?.startsWith("/landlord/unit-map") || 
        pathname?.startsWith("/landlord/tenants");

    useEffect(() => {
        if (hasZeroProperties && !isAllowedCreationRoute) {
            // When zero properties and not on properties/new, keep user routed toward property setup
            if (pathname !== "/landlord/dashboard") {
                router.replace("/landlord/properties/new");
            }
        } else if (hasPendingUnitMap && !isAllowedUnitMapRoute) {
            // When property registered but unit map unconfigured, keep user routed toward unit map setup
            if (pathname !== "/landlord/dashboard") {
                router.replace("/landlord/unit-map");
            }
        } else if (hasPendingTenantSetup && !isAllowedStage3Route) {
            // When property registered and map configured, but no tenants yet registered,
            // restrict navigation to Dashboard, Unit Map, and Tenants only
            toast.warning("Complete property setup and register your first tenant to unlock portal operations.");
            router.replace("/landlord/dashboard");
        }
    }, [hasZeroProperties, hasPendingUnitMap, hasPendingTenantSetup, isAllowedCreationRoute, isAllowedUnitMapRoute, isAllowedStage3Route, pathname, router]);

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
                        <MandatoryPropertySetupGuard>
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
                    </MandatoryPropertySetupGuard>
                </ProfileCardProvider>
                </NotificationProvider>
            </PropertyProvider>
        </AuthProvider>
    );
}


