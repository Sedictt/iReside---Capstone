"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/landlord/Sidebar";
import { LandlordNavbar } from "@/components/landlord/LandlordNavbar";

export default function LandlordLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const isDashboard = pathname === "/landlord/dashboard";

    if (isDashboard) {
        return (
            <div className="flex h-screen overflow-hidden bg-[#0f172a] text-white">
                <Sidebar />
                <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden md:ml-64">
                    {children}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0f172a] text-white">
            <LandlordNavbar />
            {children}
        </div>
    );
}
