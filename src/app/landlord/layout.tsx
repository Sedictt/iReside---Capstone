"use client";

import { Sidebar } from "@/components/landlord/Sidebar";
import { InPersonPaymentModal } from "@/components/landlord/InPersonPaymentModal";
import { ContactsSidebar } from "@/components/landlord/dashboard/ContactsSidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";
import { PropertyProvider } from "@/context/PropertyContext";
import { NotificationProvider } from "@/context/NotificationContext";

export default function LandlordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    
    const isMessages = pathname?.startsWith("/landlord/messages");
    const isUnitMap = pathname?.startsWith("/landlord/unit-map");
    const isSettings = pathname?.startsWith("/landlord/settings");
    const showSidebar = !isMessages && !isSettings;
    const showContactsSidebar = !isMessages && !isUnitMap && !isSettings;

    return (
        <AuthProvider>
            <PropertyProvider>
                <NotificationProvider>
                    <div className="flex h-screen bg-background text-foreground overflow-hidden">
                        {showSidebar && <Sidebar />}
                        
                        <main 
                            className={cn(
                                "flex-1 overflow-y-auto h-full", 
                                showSidebar ? "ml-[280px]" : "",
                                showContactsSidebar ? "md:pr-24" : ""
                            )}
                        >
                            {children}
                        </main>
                        
                        {showContactsSidebar && <ContactsSidebar />}
                        <InPersonPaymentModal />
                    </div>
                </NotificationProvider>
            </PropertyProvider>
        </AuthProvider>
    );
}


