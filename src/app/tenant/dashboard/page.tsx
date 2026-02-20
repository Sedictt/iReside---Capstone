"use client";

import {
    Calendar,
    CreditCard,
    FileText,
    Bell,
    CheckCircle,
    ArrowUpRight,
    Megaphone,
    Clock,
    Wrench,
    MessageSquare,
    MoreHorizontal,
    X,
    ChevronRight,
    Mail,
    Home,
    Zap,
    Droplets,
    Sparkles
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState } from "react";
import LeaseModal from "@/components/tenant/LeaseModal";

export default function TenantDashboard() {
    const [showBanner, setShowBanner] = useState(true);
    const [isLeaseModalOpen, setIsLeaseModalOpen] = useState(false);

    return (
        <div className="relative">
            {/* Ambient Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <Image
                    src="https://images.unsplash.com/photo-1481277542470-605612bd2d61?q=80&w=2600&auto=format&fit=crop"
                    alt="Background"
                    fill
                    className="object-cover opacity-[0.03]"
                    priority
                />
            </div>

            <div className="space-y-6 relative z-10 text-foreground">

                {/* Hero Banner */}
                <div className="relative w-full h-[280px] rounded-3xl overflow-hidden group border border-border/50 shadow-2xl">
                    <Image
                        src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688"
                        alt="Property"
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                    <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div className="space-y-6 w-full md:w-auto">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                    <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Next Payment</span>
                                </div>
                                <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-2 shadow-sm">₱18,500<span className="text-2xl text-white/60">.00</span></h2>
                                <p className="text-white/80 font-medium flex items-center gap-2">
                                    <Calendar className="w-4 h-4" />
                                    Due October 1st, 2026
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/tenant/payments"
                                    className="bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 shadow-lg shadow-primary/20 transition-all hover:translate-y-[-1px]"
                                >
                                    <CreditCard className="w-4 h-4" />
                                    Pay Rent Now
                                </Link>
                                <Link
                                    href="/tenant/payments"
                                    className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-6 py-3 rounded-xl font-medium text-sm transition-colors backdrop-blur-md"
                                >
                                    View Details
                                </Link>
                            </div>
                        </div>

                        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl p-6 flex flex-col items-center justify-center min-w-[200px]">
                            <p className="text-sm font-medium text-white/70 mb-2">Time Remaining</p>
                            <div className="flex items-start gap-4 text-white">
                                <div className="text-center">
                                    <span className="text-3xl font-bold block">12</span>
                                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Days</span>
                                </div>
                                <span className="text-2xl text-white/30 font-light animate-blink mt-1">:</span>
                                <div className="text-center">
                                    <span className="text-3xl font-bold block">05</span>
                                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">Hrs</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Community Announcement Banner */}
                {showBanner && (
                    <div className="w-full bg-card border border-border rounded-xl p-4 flex items-start md:items-center justify-between gap-4 shadow-lg shadow-black/5 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-start gap-4">
                            <div className="p-2 rounded-full bg-primary/10 text-primary flex-shrink-0">
                                <Megaphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-sm md:text-base">Community Announcement</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">Water shutoff scheduled for Tuesday, 10 AM - 2 PM for urgent maintenance.</p>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column: Payments & Quick Actions */}
                    <div className="lg:col-span-2 space-y-6">

                        <div>
                            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {[
                                    { icon: Wrench, label: "Request Repair", href: "/tenant/maintenance/new", color: "text-orange-500", bg: "bg-orange-500/10" },
                                    { icon: Mail, label: "Contact Landlord", href: "/tenant/dashboard/ai-concierge", color: "text-emerald-500", bg: "bg-emerald-500/10" },
                                    { icon: FileText, label: "Your Lease", href: "/tenant/lease/123", color: "text-purple-500", bg: "bg-purple-500/10" },
                                    { icon: MoreHorizontal, label: "More", href: "#", color: "text-blue-500", bg: "bg-blue-500/10" },
                                ].map((action, i) => {
                                    const isLease = action.label === "Your Lease";
                                    const content = (
                                        <>
                                            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", action.bg, action.color)}>
                                                <action.icon className="w-6 h-6" />
                                            </div>
                                            <span className="text-sm font-medium text-center group-hover:text-primary transition-colors">{action.label}</span>
                                        </>
                                    );

                                    if (isLease) {
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setIsLeaseModalOpen(true)}
                                                className="bg-card border border-border hover:border-primary/30 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 group text-left"
                                            >
                                                {content}
                                            </button>
                                        );
                                    }

                                    return (
                                        <Link
                                            key={i}
                                            href={action.href}
                                            className="bg-card border border-border hover:border-primary/30 rounded-xl p-6 flex flex-col items-center justify-center gap-3 transition-all hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1 group"
                                        >
                                            {content}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Unit & Utilities Overview */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Lease Status Card */}
                            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:border-primary/30 transition-colors">
                                <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                    <Home className="w-24 h-24" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold mb-1">My Unit</h3>
                                    <p className="text-muted-foreground text-sm">The Grand, Unit 304</p>
                                </div>
                                <div className="mt-8">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-muted-foreground">Lease Progress</span>
                                        <span className="font-medium text-primary">10 months left</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div className="h-full bg-primary w-[35%] rounded-full" />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">Ends Aug 15, 2027</p>
                                </div>
                            </div>

                            {/* Utilities Card */}
                            <div className="bg-card border border-border rounded-2xl p-6 space-y-6 hover:border-primary/30 transition-colors">
                                <h3 className="text-lg font-semibold">Utilities</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-yellow-500/10 text-yellow-500">
                                                <Zap className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Electricity</p>
                                                <p className="text-xs text-muted-foreground">Est. 182 kWh</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold">₱2,450</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                                <Droplets className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">Water</p>
                                                <p className="text-xs text-muted-foreground">Est. 14 m³</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold">₱450</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Concierge Teaser */}
                        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border border-primary/20 rounded-2xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 blur-3xl rounded-full pointer-events-none group-hover:bg-primary/20 transition-colors" />
                            <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Sparkles className="w-4 h-4 text-primary" />
                                        <span className="text-xs font-semibold text-primary uppercase tracking-wide">iRis Assistant</span>
                                    </div>
                                    <h3 className="text-xl font-bold mb-1">Need help with something?</h3>
                                    <p className="text-muted-foreground text-sm max-w-md">Ask iRis about building rules, amenities, or local recommendations.</p>
                                </div>
                                <Link
                                    href="/tenant/dashboard/ai-concierge"
                                    className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20 whitespace-nowrap"
                                >
                                    Chat with iRis
                                </Link>
                            </div>
                        </div>

                    </div>

                    {/* Right Column: Recent Activity */}
                    <div className="lg:col-span-1">
                        <div className="bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-semibold">Recent Activity</h3>
                                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                                </div>
                                <Link href="/tenant/activity" className="text-xs font-bold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide">View All</Link>
                            </div>

                            <div className="space-y-4 flex-1">
                                {[
                                    {
                                        type: "payment",
                                        title: "September Rent Paid",
                                        desc: "Paid ₱18,500.00",
                                        time: "2 hrs ago",
                                        icon: CheckCircle,
                                        color: "text-emerald-500",
                                        bg: "bg-emerald-500/10",
                                        isNew: true
                                    },
                                    {
                                        type: "lease",
                                        title: "Lease Renewed",
                                        desc: "Signed for 12 months",
                                        time: "Yesterday",
                                        icon: FileText,
                                        color: "text-blue-500",
                                        bg: "bg-blue-500/10",
                                        isNew: false
                                    },
                                    {
                                        type: "maintenance",
                                        title: "Request #402",
                                        desc: "Status: In Progress",
                                        time: "2 days ago",
                                        icon: Wrench,
                                        color: "text-orange-500",
                                        bg: "bg-orange-500/10",
                                        isNew: false
                                    },
                                    {
                                        type: "message",
                                        title: "Property Manager",
                                        desc: "New message received",
                                        time: "3 days ago",
                                        icon: MessageSquare,
                                        color: "text-purple-500",
                                        bg: "bg-purple-500/10",
                                        isNew: false
                                    }
                                ].map((item, i) => (
                                    <div
                                        key={i}
                                        onClick={() => {
                                            if (item.type === "lease") {
                                                setIsLeaseModalOpen(true);
                                            }
                                        }}
                                        className="group flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 border border-transparent hover:border-border/50 transition-all cursor-pointer"
                                    >
                                        <div className={cn(
                                            "h-10 w-10 rounded-full flex items-center justify-center border border-white/5 shadow-sm transition-transform group-hover:scale-105",
                                            item.bg, item.color
                                        )}>
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <h4 className="text-sm font-medium text-foreground truncate">{item.title}</h4>
                                                <span className="text-[10px] text-muted-foreground font-medium">{item.time}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground group-hover:text-foreground/80 transition-colors">{item.desc}</p>
                                        </div>
                                        {item.isNew && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <LeaseModal
                open={isLeaseModalOpen}
                onOpenChange={setIsLeaseModalOpen}
            />
        </div>
    );
}
