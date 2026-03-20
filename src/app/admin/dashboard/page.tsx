"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Users, Home, Building2 } from "lucide-react";

interface AdminStats {
    totalUsers: number;
    totalLandlords: number;
    totalTenants: number;
    totalRegistrations: number;
    pendingRegistrations: number;
    reviewingRegistrations: number;
    approvedRegistrations: number;
    activeLeases: number;
    totalProperties: number;
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/admin/stats")
            .then((r) => {
                if (!r.ok) {
                    setStats(null);
                    return null;
                }
                return r.json();
            })
            .then((data) => {
                if (data) setStats(data);
            })
            .finally(() => setLoading(false));
    }, []);

    const cards = [
        { label: "Total Users", value: stats?.totalUsers, icon: Users, color: "text-blue-400" },
        { label: "Pending Registrations", value: stats?.pendingRegistrations, icon: ClipboardList, color: "text-amber-400" },
        { label: "Active Leases", value: stats?.activeLeases, icon: Home, color: "text-purple-400" },
        { label: "Total Properties", value: stats?.totalProperties, icon: Building2, color: "text-emerald-400" },
    ];

    return (
        <div className="p-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-neutral-400 text-sm mt-1">System overview and management</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <div key={card.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">{card.label}</span>
                                <Icon className={`h-4 w-4 ${card.color}`} />
                            </div>
                            <p className="text-3xl font-bold text-white">
                                {loading || stats === null ? "—" : (card.value ?? 0)}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
