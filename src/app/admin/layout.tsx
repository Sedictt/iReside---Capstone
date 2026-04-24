"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AuthProvider } from "@/context/AuthContext";
import { NotificationProvider } from "@/context/NotificationContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <NotificationProvider>
                <div
                    data-admin-portal="true"
                    className="relative flex h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-background dark:text-foreground"
                >
                    <AdminSidebar />
                    <main className="relative z-10 flex-1 ml-[280px] overflow-y-auto px-8 py-10 min-h-screen lg:px-12">
                        <div className="mx-auto max-w-7xl animate-in fade-in duration-700 slide-in-from-bottom-6">
                            {children}
                        </div>
                    </main>
                </div>
            </NotificationProvider>
        </AuthProvider>
    );
}


