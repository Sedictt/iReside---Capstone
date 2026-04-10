"use client";

import { Sidebar } from "@/components/landlord/Sidebar";
import { InPersonPaymentModal } from "@/components/landlord/InPersonPaymentModal";
import { ContactsSidebar } from "@/components/landlord/dashboard/ContactsSidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { AuthProvider } from "@/context/AuthContext";

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
            <div className="flex h-screen bg-background text-foreground">
                {showSidebar && <Sidebar />}
                <main className={cn("flex-1 overflow-y-auto", showSidebar ? "ml-64" : "", showContactsSidebar ? "md:pr-24" : "")}>
                    {children}
                </main>
                {showContactsSidebar && <ContactsSidebar />}
                <InPersonPaymentModal />
            </div>
        </AuthProvider>
    );
}
