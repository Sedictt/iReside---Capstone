"use client";

import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AuthProvider } from "@/context/AuthContext";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <div className="flex h-screen" style={{ background: "#0a0a0a" }}>
                <AdminSidebar />
                <main className="flex-1 overflow-y-auto ml-64 min-h-screen">
                    {children}
                </main>
            </div>
        </AuthProvider>
    );
}
