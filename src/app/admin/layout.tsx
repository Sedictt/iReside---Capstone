"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";
import { ProfileCardProvider } from "@/context/ProfileCardContext";
import { ProfileCard } from "@/components/ui/ProfileCard";
import { NotificationBanner } from "@/components/navigation/NotificationBanner";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <NotificationProvider>
                <ProfileCardProvider>
                    <div
                        data-admin-portal="true"
                        className="relative flex h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-background dark:text-foreground"
                    >
                        <AdminSidebar />
                        <main className="relative z-10 flex-1 ml-[280px] overflow-y-auto min-h-screen">
                            <NotificationBanner />
                            <div className="mx-auto max-w-7xl px-8 py-10 lg:px-12 animate-in fade-in duration-700 slide-in-from-bottom-6">
                                {children}
                            </div>
                        </main>
                    </div>
                    <ProfileCard />
                </ProfileCardProvider>
            </NotificationProvider>
        </AuthProvider>
    );
}


