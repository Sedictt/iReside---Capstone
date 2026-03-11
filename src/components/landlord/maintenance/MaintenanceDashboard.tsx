"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
    Wrench,
    AlertTriangle,
    Clock,
    CheckCircle2,
    Search,
    Filter,
    Plus,
    MoreVertical,
    Calendar,
    Hammer,
    UserCircle2,
    ArrowRight,
    Image as ImageIcon
} from "lucide-react";

type Priority = "Critical" | "High" | "Medium" | "Low";
type Status = "Pending" | "Assigned" | "In Progress" | "Resolved";

interface MaintenanceRequest {
    id: string;
    title: string;
    description: string;
    property: string;
    unit: string;
    tenant: string;
    tenantAvatar: string;
    priority: Priority;
    status: Status;
    reportedAt: string;
    assignee?: string;
    scheduledFor?: string;
    images: string[];
}

const MOCK_REQUESTS: MaintenanceRequest[] = [
    {
        id: "REQ-2041",
        title: "Water leak in master bathroom",
        description: "There's a constant dripping from the ceiling above the shower. It started yesterday and seems to be getting worse.",
        property: "The Azure Residences",
        unit: "PH-02",
        tenant: "Elena Rodriguez",
        tenantAvatar: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=150&q=80",
        priority: "Critical",
        status: "Pending",
        reportedAt: "2 hours ago",
        images: ["https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"]
    },
    {
        id: "REQ-2038",
        title: "HVAC System Malfunction",
        description: "The AC unit is blowing warm air even when set to 18°C. Makes a loud rattling noise when starting up.",
        property: "Lumina Towers",
        unit: "Unit 1405",
        tenant: "Marcus Johnson",
        tenantAvatar: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=150&q=80",
        priority: "High",
        status: "Assigned",
        assignee: "Apex Cooling Systems",
        reportedAt: "Yesterday",
        images: ["https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"]
    },
    {
        id: "REQ-2035",
        title: "Broken Kitchen Cabinet Hinge",
        description: "One of the overhead cabinet doors is sagging and won't close properly. Needs a new hinge mechanism.",
        property: "The Azure Residences",
        unit: "Unit 812",
        tenant: "David Chen",
        tenantAvatar: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=150&q=80",
        priority: "Medium",
        status: "In Progress",
        assignee: "Mike's Handyman",
        scheduledFor: "Today, 2:00 PM",
        reportedAt: "3 days ago",
        images: ["https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80", "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?auto=format&fit=crop&w=800&q=80"]
    },
    {
        id: "REQ-2029",
        title: "Flickering hallway lights",
        description: "The recessed lights in the main hallway flicker randomly, especially in the evening.",
        property: "Horizon Suites",
        unit: "Unit 401",
        tenant: "Sarah Wilson",
        tenantAvatar: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?auto=format&fit=crop&w=150&q=80",
        priority: "Low",
        status: "Resolved",
        assignee: "Volt Electric",
        reportedAt: "Last week",
        images: ["https://images.unsplash.com/photo-1563720360172-67b8f3dce741?auto=format&fit=crop&w=800&q=80"]
    }
];

import { MaintenanceRequestModal } from "./MaintenanceRequestModal";

export function MaintenanceDashboard() {
    const [filter, setFilter] = useState<"All" | Status>("All");
    const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);

    const filteredRequests = MOCK_REQUESTS.filter(req => filter === "All" || req.status === filter);

    return (
        <div className="flex flex-col w-full bg-[#0a0a0a] text-white p-6 md:p-8 space-y-8 animate-in fade-in duration-700 h-full overflow-y-auto custom-scrollbar relative">
            {/* Header Section */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2 flex items-center gap-3">
                        <Wrench className="h-8 w-8 text-primary/80" />
                        Maintenance Operations
                    </h1>
                    <p className="text-neutral-400 font-medium tracking-wide text-sm">
                        Coordinate, assign, and track property repairs in real-time.
                    </p>
                </div>
                <button className="flex items-center gap-2 bg-gradient-to-r from-primary to-emerald-400 text-black px-6 py-3 rounded-2xl font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95">
                    <Plus className="h-5 w-5" />
                    New Work Order
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Action Required"
                    value="4"
                    subtitle="Pending requests"
                    icon={<AlertTriangle className="h-5 w-5 text-red-500" />}
                    glowColor="rgba(239,68,68,0.15)"
                    borderColor="border-red-500/20"
                />
                <StatCard
                    title="In Progress"
                    value="12"
                    subtitle="Active work orders"
                    icon={<Hammer className="h-5 w-5 text-amber-500" />}
                    glowColor="rgba(245,158,11,0.15)"
                    borderColor="border-amber-500/20"
                />
                <StatCard
                    title="Scheduled"
                    value="8"
                    subtitle="Upcoming visits"
                    icon={<Clock className="h-5 w-5 text-cyan-500" />}
                    glowColor="rgba(6,182,212,0.15)"
                    borderColor="border-cyan-500/20"
                />
                <StatCard
                    title="Resolved"
                    value="142"
                    subtitle="Completed this month"
                    icon={<CheckCircle2 className="h-5 w-5 text-emerald-500" />}
                    glowColor="rgba(16,185,129,0.15)"
                    borderColor="border-emerald-500/20"
                />
            </div>

            {/* Main Content Area */}
            <div className="rounded-3xl bg-neutral-900 border border-white/5 flex flex-col pt-2 shadow-2xl">
                {/* Toolbar */}
                <div className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-neutral-900/50 backdrop-blur-xl sticky top-0 z-10 rounded-t-3xl">
                    <div className="flex bg-neutral-950 p-1.5 rounded-xl border border-white/5 overflow-x-auto w-full sm:w-auto no-scrollbar">
                        {["All", "Pending", "Assigned", "In Progress", "Resolved"].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab as any)}
                                className={cn(
                                    "px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap",
                                    filter === tab
                                        ? "bg-neutral-800 text-white shadow-lg"
                                        : "text-neutral-500 hover:text-neutral-300 hover:bg-white/[0.02]"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <div className="relative group flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Search by ID, tenant or unit..."
                                className="w-full bg-neutral-950 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder:text-neutral-600 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50 transition-all"
                            />
                        </div>
                        <button className="p-2.5 rounded-xl bg-neutral-950 border border-white/5 text-neutral-400 hover:text-white hover:bg-white/5 transition-all">
                            <Filter className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Grid Format Request List */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredRequests.map((request) => (
                            <MaintenanceCard
                                key={request.id}
                                request={request}
                                onClick={() => setSelectedRequest(request)}
                            />
                        ))}

                        {filteredRequests.length === 0 && (
                            <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-4 py-20 flex flex-col items-center justify-center text-center">
                                <div className="w-20 h-20 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">No {filter !== "All" ? filter.toLowerCase() : ""} requests</h3>
                                <p className="text-neutral-400 text-sm max-w-sm">
                                    You're all caught up! Everything is running smoothly across your properties.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <MaintenanceRequestModal
                isOpen={!!selectedRequest}
                onClose={() => setSelectedRequest(null)}
                request={selectedRequest}
            />
        </div>
    );
}

function StatCard({ title, value, subtitle, icon, glowColor, borderColor }: any) {
    return (
        <div
            className={cn(
                "relative overflow-hidden p-6 rounded-3xl bg-neutral-900 border transition-all duration-300 group hover:-translate-y-1",
                borderColor
            )}
        >
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)` }}
            />
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-wider">{title}</h3>
                    <div className="p-2 rounded-xl bg-neutral-800 border border-white/5">
                        {icon}
                    </div>
                </div>
                <div className="flex flex-col gap-1">
                    <span className="text-4xl font-black text-white tracking-tighter">{value}</span>
                    <span className="text-sm font-medium text-neutral-500">{subtitle}</span>
                </div>
            </div>
        </div>
    );
}

function MaintenanceCard({ request, onClick }: { request: MaintenanceRequest, onClick?: () => void }) {
    const isCritical = request.priority === "Critical";
    const isPending = request.status === "Pending";
    const isResolved = request.status === "Resolved";

    return (
        <div
            onClick={onClick}
            className="group relative flex flex-col bg-neutral-950 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-2xl"
        >
            {/* Top Image Preview Area */}
            <div className="relative h-44 w-full bg-neutral-900 border-b border-white/5 overflow-hidden shrink-0">
                {request.images && request.images.length > 0 ? (
                    <>
                        <img
                            src={request.images[0]}
                            alt={request.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-neutral-950/40" />

                        {/* Multiple Images Indicator */}
                        {request.images.length > 1 && (
                            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-bold text-white border border-white/10">
                                <ImageIcon className="w-3 h-3" />
                                +{request.images.length - 1}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900 absolute inset-0">
                        <Wrench className="w-8 h-8 text-neutral-800" />
                    </div>
                )}

                {/* Badges on top of image */}
                <div className="absolute top-2 left-2 flex flex-col items-start gap-1.5 z-10">
                    <StatusBadge status={request.status} />
                    <PriorityBadge priority={request.priority} />
                </div>
            </div>

            {/* Glowing red accent for critical pending */}
            {isCritical && isPending && (
                <div className="absolute top-0 inset-x-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] z-10" />
            )}

            {/* Content Area */}
            <div className="p-4 flex flex-col flex-1 bg-gradient-to-b from-neutral-950 to-neutral-900 border-t border-white/5">
                {/* Header & Meta */}
                <div className="flex items-center justify-between mb-3 text-[10px] font-medium text-neutral-500 shrink-0">
                    <span className="font-mono font-bold tracking-wider">{request.id}</span>
                    <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" />
                        {request.reportedAt}
                    </div>
                </div>

                {/* Title */}
                <div className="mb-3 shrink-0">
                    <h3 className="text-sm font-bold text-white mb-1.5 group-hover:text-primary transition-colors line-clamp-2 leading-snug">{request.title}</h3>
                </div>

                {/* Property & Unit */}
                <div className="flex flex-wrap items-center gap-2 mb-4 shrink-0">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-300 bg-white/5 px-2 py-1 rounded-md border border-white/10 shadow-sm">
                        {request.property}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-1 rounded-md border border-primary/20 shadow-sm">
                        {request.unit}
                    </span>
                </div>

                {/* Spacer to push footer down */}
                <div className="flex-1 min-h-[16px]" />

                {/* Footer Info: Contractor */}
                <div className="flex items-center justify-between gap-3 shrink-0 pt-3 border-t border-white/5 mt-auto">
                    {/* Assignee / Action */}
                    <div className="flex flex-col items-end flex-1 w-full">
                        {request.assignee ? (
                            <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1.5 rounded-lg border border-white/5 w-full justify-center">
                                <span className="text-xs font-bold text-neutral-300 truncate">{request.assignee}</span>
                            </div>
                        ) : (
                            <button
                                onClick={(e) => e.stopPropagation()}
                                className="w-full justify-center text-xs font-black text-amber-500 hover:text-black hover:bg-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap shadow-sm"
                            >
                                Assign
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Pulsing effect for crucial items */}
            {isCritical && isPending && (
                <div className="absolute inset-0 rounded-2xl ring-2 ring-red-500/20 ring-offset-2 ring-offset-neutral-950 animate-pulse pointer-events-none" />
            )}
        </div>
    );
}

function PriorityBadge({ priority }: { priority: Priority }) {
    const config = {
        Critical: "bg-red-500 text-white border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.5)]",
        High: "bg-orange-500/90 backdrop-blur-md text-white border-orange-400/50",
        Medium: "bg-blue-500/90 backdrop-blur-md text-white border-blue-400/50",
        Low: "bg-neutral-800/90 backdrop-blur-md text-neutral-300 border-neutral-600",
    };

    return (
        <span className={cn(
            "px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5",
            config[priority]
        )}>
            {priority === "Critical" && <AlertTriangle className="w-3 h-3" />}
            {priority} Priority
        </span>
    );
}

function StatusBadge({ status }: { status: Status }) {
    const config = {
        Pending: "bg-amber-500 text-black border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]",
        Assigned: "bg-cyan-500/90 backdrop-blur-md text-black border-cyan-400/50",
        "In Progress": "bg-primary text-black border-primary/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]",
        Resolved: "bg-emerald-500/90 backdrop-blur-md text-black border-emerald-400/50",
    };

    return (
        <span className={cn(
            "px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider",
            config[status]
        )}>
            {status}
        </span>
    );
}
