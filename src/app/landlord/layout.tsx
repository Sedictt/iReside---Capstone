"use client";

import { Sidebar } from "@/components/landlord/Sidebar";
import { InPersonPaymentModal } from "@/components/landlord/InPersonPaymentModal";
import { ContactsSidebar } from "@/components/landlord/dashboard/ContactsSidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LandlordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isMessages = pathname?.startsWith("/landlord/messages");
    const isUnitMap = pathname?.startsWith("/landlord/unit-map");
    const showContactsSidebar = !isMessages && !isUnitMap;

    return (
        <div className="flex h-screen bg-[#0a0a0a]">
            {!isMessages && <Sidebar />}
            <main className={cn("flex-1 overflow-y-auto", !isMessages ? "ml-64" : "", showContactsSidebar ? "md:pr-24" : "")}>
                {children}
            </main>
            {showContactsSidebar && <ContactsSidebar />}
            <InPersonPaymentModal />
        </div>
    );
}
