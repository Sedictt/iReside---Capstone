"use client";

import {
    CreditCard,
    Wrench,
    MessageSquare,
    FileText,
    MoreHorizontal,
    Home,
    Bell,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { EmptyState } from "@/components/shared/EmptyState";

export default function TenantDashboard() {
    const [showBanner, setShowBanner] = useState(true);

    return (
        <div className="space-y-6">
            {/* Community Announcement Banner */}
            {showBanner && (
                <div className="w-full bg-card border border-border rounded-xl p-4 flex items-start md:items-center justify-between gap-4 shadow-lg shadow-black/5 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-start gap-4">
                        <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-sm md:text-base">Welcome to iReside</h3>
                            <p className="text-sm text-muted-foreground mt-0.5">Your landlord will provide you with account access and property details.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowBanner(false)}
                        className="text-xs font-medium bg-muted hover:bg-muted/80 text-foreground px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { icon: Wrench, label: "Request Repair", href: "/tenant/maintenance/new", color: "text-orange-500", bg: "bg-orange-500/10" },
                        { icon: MessageSquare, label: "Messages", href: "/tenant/messages", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                        { icon: FileText, label: "Your Lease", href: "/tenant/lease", color: "text-purple-500", bg: "bg-purple-500/10" },
                        { icon: FileText, label: "Applications", href: "/tenant/applications", color: "text-blue-500", bg: "bg-blue-500/10" },
                        { icon: MoreHorizontal, label: "More", href: "#", color: "text-neutral-500", bg: "bg-neutral-500/10" },
                    ].map((action, i) => (
                        <Link
                            key={i}
                            href={action.href}
                            className="bg-card border border-border hover:border-primary/30 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 group"
                        >
                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", action.bg, action.color)}>
                                <action.icon className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium text-center group-hover:text-primary transition-colors">{action.label}</span>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Empty State Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
                        <EmptyState
                            icon={Home}
                            title="No active lease yet"
                            description="Your lease details, payment information, and unit information will appear here once your landlord sets up your account."
                        />
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6">
                        <EmptyState
                            icon={CreditCard}
                            title="No recent activity"
                            description="Payment confirmations, maintenance updates, and messages will show up here."
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}