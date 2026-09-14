"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { TenantSidebar } from "@/components/tenant/TenantNavbar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";
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
    const isSettingsPage = pathname === "/tenant/settings";
    const isDocsPage = pathname?.startsWith("/tenant/docs") || pathname?.startsWith("/tenant/manual");
    const useImmersiveLayout = isChatPage || isOnboardingPage || isUnitMapPage || isSettingsPage || isDocsPage;

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
                            <Suspense fallback={
                                <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
                                    <Loader2 className="size-8 animate-spin text-primary" />
                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Loading...</p>
                                </div>
                            }>
                                <div
                                    key={pathname}
                                    className="w-full h-full flex-1 flex flex-col animate-in fade-in-50 duration-200"
                                >
                                    {useImmersiveLayout ? (
                                        children
                                    ) : (
                                        <div className="w-full max-w-7xl mr-auto px-4 sm:px-6 py-6 sm:py-8 flex-1 flex flex-col">
                                            {children}
                                        </div>
                                    )}
                                </div>
                            </Suspense>
                        </main>
                    </div>
                </ThemeProvider>
                <ProfileCard />
                </ProfileCardProvider>
            </NotificationProvider>
        </AuthProvider>
    );
}


