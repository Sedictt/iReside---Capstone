"use client";

import { TenantSidebar } from "@/components/tenant/TenantNavbar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { AuthProvider } from "@/context/AuthContext";
import { TenantProductTourOverlay } from "@/components/tenant/TenantProductTourOverlay";
import { ThemeProvider } from "@/components/theme-provider";
import { NotificationProvider } from "@/context/NotificationContext";
import { ProfileCardProvider } from "@/context/ProfileCardContext";
import { ProfileCard } from "@/components/ui/ProfileCard";
import { NotificationBanner } from "@/components/navigation/NotificationBanner";

export default function TenantLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    
    const isChatPage = pathname === "/tenant/messages";
    const isOnboardingPage = pathname.startsWith("/tenant/onboarding");
    const isUnitMapPage = pathname === "/tenant/unit-map";
    const useImmersiveLayout = isChatPage || isOnboardingPage || isUnitMapPage;

    return (
        <AuthProvider>
            <NotificationProvider>
                <ProfileCardProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="light"
                        enableSystem={false}
                        disableTransitionOnChange
                        storageKey="ireside-tenant-theme"
                    >
                    <div className={cn(
                        "tenant-light min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 flex overflow-hidden",
                        (isChatPage || isUnitMapPage) && "h-screen"
                    )}>
                        {!useImmersiveLayout && <TenantSidebar />}
                        
                        <main 
                            className={cn(
                                "min-w-0 h-full flex-1 flex flex-col overflow-x-hidden relative",
                                !useImmersiveLayout && "ml-[280px]"
                            )}
                        >
                            <div className={cn(
                                "w-full z-[100] pointer-events-none",
                                !useImmersiveLayout && "max-w-7xl mr-auto px-4 sm:px-6 md:pr-[104px] lg:pr-[112px]"
                            )}>
                                <NotificationBanner />
                            </div>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={pathname}
                                    initial={{ opacity: 0, scale: 0.99, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.99, y: -10 }}
                                    transition={{
                                        duration: 0.5,
                                        ease: [0.22, 1, 0.36, 1]
                                    }}
                                    className="w-full h-full flex-1 flex flex-col"
                                >
                                    {useImmersiveLayout ? (
                                        children
                                    ) : (
                                        <div className="w-full max-w-7xl mr-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col">
                                            {children}
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </main>
                        {!isOnboardingPage && <TenantProductTourOverlay />}
                    </div>
                </ThemeProvider>
                <ProfileCard />
                </ProfileCardProvider>
            </NotificationProvider>
        </AuthProvider>
    );
}


