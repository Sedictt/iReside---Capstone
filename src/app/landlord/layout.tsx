"use client";

import { Sidebar } from "@/components/landlord/Sidebar";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LandlordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isMessages = pathname?.startsWith("/landlord/messages");

    return (
        <div className="flex h-screen bg-[#0a0a0a]">
            {!isMessages && <Sidebar />}
            <main className={cn("flex-1 overflow-y-auto", !isMessages ? "ml-64" : "")}>
                {children}
            </main>
        </div>
    );
}
