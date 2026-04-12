"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AuthProvider } from "@/context/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <div className="relative flex h-screen overflow-hidden bg-[#0A0A0A] text-foreground dark:bg-[#050505]">
                {/* Visual Depth & Psychological Layering */}
                <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-black/0 to-black/0" />
                <div className="pointer-events-none absolute inset-0 z-0 bg-[url('/assets/noise.png')] opacity-[0.015] mix-blend-overlay" />

                <AdminSidebar />
                <main className="relative z-10 flex-1 ml-0 overflow-y-auto px-8 md:ml-80 lg:ml-80 lg:px-12 py-10 min-h-screen">
                    <div className="mx-auto max-w-7xl animate-in fade-in duration-700 slide-in-from-bottom-6">
                        {children}
                    </div>
                </main>
            </div>
        </AuthProvider>
    );
}
