"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    CheckCircle,
    ChevronRight,
    CreditCard,
    Edit2,
    Lock,
    Plus,
    ShieldCheck,
    User,
    Users,
    UserPlus,
    Download,
    Trash2,
    Building2,
    Mail,
    AlertTriangle,
    Eye,
    EyeOff,
    Smartphone,
    QrCode
} from "lucide-react";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Types
type Section = "My Profile" | "Security" | "Teams" | "Team Member" | "Notifications" | "Billing" | "Data Export" | "Delete Account";

const SIDEBAR_ITEMS = [
    { icon: User, label: "My Profile" },
    { icon: ShieldCheck, label: "Security" },
    { icon: Users, label: "Teams" },
    { icon: UserPlus, label: "Team Member" },
    { icon: Bell, label: "Notifications" },
    { icon: CreditCard, label: "Billing" },
    { icon: Download, label: "Data Export" },
    { icon: Trash2, label: "Delete Account", className: "text-red-500 hover:text-red-400 hover:bg-red-500/10" },
];

export function LandlordProfile() {
    const [activeTab, setActiveTab] = useState<Section>("Security");

    // Security State
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(true);
    const [email, setEmail] = useState("alex.assenmacher@gmail.com");

    // Restored State
    const [phone, setPhone] = useState("+63 917 123 4567");
    const [emailNotification, setEmailNotification] = useState(true);
    const [smsNotification, setSmsNotification] = useState(false);
    const [maintEmail, setMaintEmail] = useState(true);
    const [maintSms, setMaintSms] = useState(true);

    const renderContent = () => {
        switch (activeTab) {
            case "Security":
                return (
                    <div className="space-y-8 max-w-4xl">
                        <div>
                            <h2 className="text-xl font-semibold text-white mb-6">Security</h2>

                            {/* Email Address */}
                            <div className="py-6 border-b border-white/5">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium text-white">Email address</h3>
                                        <p className="text-sm text-slate-400">The email address associated with your account.</p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-white">{email}</p>
                                            <p className="text-xs text-red-500 font-medium">Unverified</p>
                                        </div>
                                        <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors">
                                            Edit <Edit2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Password */}
                            <div className="py-6 border-b border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium text-white">Password</h3>
                                        <p className="text-sm text-slate-400">Set a unique password to protect your account.</p>
                                    </div>
                                    <button className="px-4 py-2 rounded-lg border border-white/10 text-sm font-medium text-slate-300 hover:bg-white/5 transition-colors">
                                        Change Password
                                    </button>
                                </div>
                            </div>

                            {/* 2-step verification */}
                            <div className="py-6 border-b border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium text-white">2-step verification</h3>
                                        <p className="text-sm text-slate-400">Make your account extra secure. Along with your password, you'll need to enter a code.</p>
                                    </div>
                                    <button
                                        onClick={() => setIsTwoFactorEnabled(!isTwoFactorEnabled)}
                                        className={cn(
                                            "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900",
                                            isTwoFactorEnabled ? "bg-blue-600" : "bg-slate-700"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                                isTwoFactorEnabled ? "translate-x-6" : "translate-x-1"
                                            )}
                                        />
                                    </button>
                                </div>
                            </div>

                            {/* Restricted Members */}
                            <div className="py-6 border-b border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium text-white">Restricted Members</h3>
                                        <p className="text-sm text-slate-400">This will shut down your account. Your account will be reactive when you sign in again.</p>
                                    </div>
                                    <span className="text-sm text-slate-400">None</span>
                                </div>
                            </div>

                            {/* Deactivate my account */}
                            <div className="py-6 border-b border-white/5">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium text-white">Deactivate my account</h3>
                                        <p className="text-sm text-slate-400">This will shut down your account. Your account will be reactive when you sign in again.</p>
                                    </div>
                                    <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
                                        Deactivate
                                    </button>
                                </div>
                            </div>

                            {/* Delete Account */}
                            <div className="py-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-medium text-white">Delete Account</h3>
                                        <p className="text-sm text-slate-400">This will delete your account. Your account will be permanently deleted from Prodeel.</p>
                                    </div>
                                    <button className="text-sm font-medium text-red-500 hover:text-red-400 transition-colors">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "My Profile":
                return (
                    <div className="space-y-6">
                        {/* Profile Header Block */}
                        <div className="relative overflow-hidden rounded-2xl bg-[#1e293b] p-6 shadow-sm border border-white/5">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div className="flex items-start gap-4">
                                    <div className="h-20 w-20 flex-shrink-0 rounded-xl bg-white p-2 shadow-sm flex items-center justify-center">
                                        <Building2 className="h-10 w-10 text-blue-600" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h1 className="text-xl font-bold text-white">Elite Property Management Group</h1>
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-400 border border-blue-500/20">
                                                <CheckCircle className="h-3 w-3" /> Verified
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-400 mb-4 flex items-center gap-1">
                                            <span className="text-slate-500 mr-1">📍</span> 123 Business Avenue, Suite 400, Manila, Philippines
                                        </p>
                                        <div className="flex gap-4">
                                            <div className="rounded-lg bg-[#0f172a] px-3 py-1.5 border border-white/5">
                                                <p className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Total Properties</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-lg font-bold text-white">24</span>
                                                    <span className="text-xs font-medium text-emerald-500">+2%</span>
                                                </div>
                                            </div>
                                            <div className="rounded-lg bg-[#0f172a] px-3 py-1.5 border border-white/5">
                                                <p className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">Total Units</p>
                                                <div className="flex items-baseline gap-2">
                                                    <span className="text-lg font-bold text-white">148</span>
                                                    <span className="text-xs font-medium text-emerald-500">+12%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button className="flex items-center gap-2 rounded-lg border border-white/10 bg-[#0f172a] px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors shadow-sm">
                                        <Edit2 className="h-4 w-4" />
                                        Edit Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case "Billing":
                return (
                    <div className="space-y-6">
                        <div className="border-b border-white/5 pb-6">
                            <h2 className="text-xl font-semibold text-white mb-2">Payment & Payout Settings</h2>
                            <p className="text-sm text-slate-400">Configure how you receive rental payments from your tenants.</p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Default Payout Method</label>
                                <div className="relative">
                                    <select className="w-full appearance-none rounded-lg bg-[#0f172a] border border-white/10 px-4 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors">
                                        <option>GCash (E-Wallet)</option>
                                        <option>Bank Transfer (BDO)</option>
                                        <option>Check Deposit</option>
                                    </select>
                                    <ChevronRight className="pointer-events-none absolute right-3 top-3 h-4 w-4 rotate-90 text-slate-500" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">GCash Mobile Number</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="w-full rounded-lg bg-[#0f172a] border border-white/10 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="rounded-lg border border-white/5 bg-[#0f172a] p-4 flex items-start justify-between">
                            <div className="flex gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white p-1">
                                    <QrCode className="h-8 w-8 text-black" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-semibold text-white text-sm">Verified GCash Account</span>
                                    </div>
                                    <p className="text-xs text-slate-400 max-w-sm">Your QR code is active and will be shown to tenants during their payment flow. Last updated on Oct 12, 2023.</p>
                                    <button className="mt-2 text-xs font-medium text-blue-400 hover:text-blue-300">Replace QR Code</button>
                                </div>
                            </div>
                            <div className="h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <CheckCircle className="h-3.5 w-3.5 text-white" />
                            </div>
                        </div>
                    </div>
                );
            case "Notifications":
                return (
                    <div className="space-y-6">
                        <div className="border-b border-white/5 pb-6">
                            <h2 className="text-xl font-semibold text-white mb-2">Notification Matrix</h2>
                            <p className="text-sm text-slate-400">Control how and when you want to be alerted about your properties.</p>
                        </div>

                        <div className="divide-y divide-white/5">
                            {/* Row 1 */}
                            <div className="flex items-center justify-between py-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-white">New Inquiries</p>
                                    <p className="text-sm text-slate-400">Alerts when potential tenants message you about listings.</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={cn("w-9 h-5 rounded-full relative cursor-pointer transition-colors", emailNotification ? "bg-blue-600" : "bg-slate-700")}
                                            onClick={() => setEmailNotification(!emailNotification)}
                                        >
                                            <div className={cn("absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform", emailNotification ? "translate-x-4" : "")} />
                                        </div>
                                        <span className="text-xs text-slate-400">Email</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={cn("w-9 h-5 rounded-full relative cursor-pointer transition-colors", smsNotification ? "bg-blue-600" : "bg-slate-700")}
                                            onClick={() => setSmsNotification(!smsNotification)}
                                        >
                                            <div className={cn("absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform", smsNotification ? "translate-x-4" : "")} />
                                        </div>
                                        <span className="text-xs text-slate-400">SMS</span>
                                    </div>
                                </div>
                            </div>

                            {/* Row 2 */}
                            <div className="flex items-center justify-between py-6">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium text-white">Maintenance Requests</p>
                                    <p className="text-sm text-slate-400">Urgent notifications for repairs and tenant issues.</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={cn("w-9 h-5 rounded-full relative cursor-pointer transition-colors", maintEmail ? "bg-blue-600" : "bg-slate-700")}
                                            onClick={() => setMaintEmail(!maintEmail)}
                                        >
                                            <div className={cn("absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform", maintEmail ? "translate-x-4" : "")} />
                                        </div>
                                        <span className="text-xs text-slate-400">Email</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div
                                            className={cn("w-9 h-5 rounded-full relative cursor-pointer transition-colors", maintSms ? "bg-blue-600" : "bg-slate-700")}
                                            onClick={() => setMaintSms(!maintSms)}
                                        >
                                            <div className={cn("absolute top-1 left-1 w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform", maintSms ? "translate-x-4" : "")} />
                                        </div>
                                        <span className="text-xs text-slate-400">SMS</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center justify-center h-64 border border-dashed border-white/10 rounded-xl text-slate-500">
                        Content for {activeTab} coming soon
                    </div>
                );
        }
    };

    return (
        <div className="flex w-full flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full lg:w-64 flex-shrink-0">
                <div className="sticky top-24 space-y-8">
                    <div>
                        <h2 className="text-xl font-bold text-white mb-6 px-3">Account Settings</h2>
                        <nav className="space-y-1">
                            {SIDEBAR_ITEMS.map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => setActiveTab(item.label as Section)}
                                    className={cn(
                                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                        activeTab === item.label
                                            ? "bg-blue-600/10 text-blue-500 shadow-sm"
                                            : item.label === "Delete Account"
                                                ? "text-red-500 hover:bg-red-500/10"
                                                : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    {item.label}
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-h-[600px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderContent()}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
}
