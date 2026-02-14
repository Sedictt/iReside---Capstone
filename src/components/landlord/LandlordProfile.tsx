"use client";

import { motion } from "framer-motion";
import {
    Banknote,
    Bell,
    CheckCircle,
    ChevronRight,
    CreditCard,
    Edit2,
    List,
    Lock,
    Plus,
    QrCode,
    Repeat,
    ShieldCheck,
    Smartphone,
    User,
    History,
    Info,
    Building2,
} from "lucide-react";

import { useState } from "react";
import { cn } from "@/lib/utils";

// Types
type Section = "Business Info" | "Payment Settings" | "Notifications" | "Security" | "Activity Log";

const SIDEBAR_ITEMS = [
    { icon: Info, label: "Business Info" },
    { icon: CreditCard, label: "Payment Settings" },
    { icon: Bell, label: "Notifications" },
    { icon: ShieldCheck, label: "Security" },
    { icon: History, label: "Activity Log" },
];

export function LandlordProfile() {
    const [activeTab, setActiveTab] = useState<Section>("Business Info");
    const [phone, setPhone] = useState("+63 917 123 4567");
    const [emailNotification, setEmailNotification] = useState(true);
    const [smsNotification, setSmsNotification] = useState(false);
    const [maintEmail, setMaintEmail] = useState(true);
    const [maintSms, setMaintSms] = useState(true);

    return (
        <div className="flex w-full flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <aside className="w-full lg:w-64 flex-shrink-0 bg-transparent pr-4 border-r border-white/5 lg:border-none lg:pr-0">
                <div className="sticky top-24 space-y-1">
                    <div className="mb-4 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Settings
                    </div>
                    {SIDEBAR_ITEMS.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => setActiveTab(item.label as Section)}
                            className={cn(
                                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                                activeTab === item.label
                                    ? "bg-blue-600/10 text-blue-500 shadow-sm"
                                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.label}
                        </button>
                    ))}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 space-y-6">

                {/* Profile Header */}
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
                            <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]">
                                <Plus className="h-4 w-4" />
                                New Property
                            </button>
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                >
                    {/* Payment & Payout Settings */}
                    <section className="rounded-xl border border-white/5 bg-[#1e293b] overflow-hidden">
                        <div className="border-b border-white/5 bg-[#1e293b] px-6 py-4 flex items-center gap-3">
                            <CreditCard className="h-5 w-5 text-blue-500" />
                            <div>
                                <h2 className="text-base font-semibold text-white">Payment & Payout Settings</h2>
                                <p className="text-xs text-slate-400">Configure how you receive rental payments from your tenants.</p>
                            </div>
                        </div>
                        <div className="p-6 space-y-6">
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
                                        <Smartphone className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
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
                    </section>

                    {/* Notification Matrix */}
                    <section className="rounded-xl border border-white/5 bg-[#1e293b] overflow-hidden">
                        <div className="border-b border-white/5 bg-[#1e293b] px-6 py-4 flex items-center gap-3">
                            <Bell className="h-5 w-5 text-blue-500" />
                            <div>
                                <h2 className="text-base font-semibold text-white">Notification Matrix</h2>
                                <p className="text-xs text-slate-400">Control how and when you want to be alerted about your properties.</p>
                            </div>
                        </div>
                        <div className="divide-y divide-white/5">
                            {/* Row 1 */}
                            <div className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                                        <List className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">New Inquiries</p>
                                        <p className="text-xs text-slate-400">Alerts when potential tenants message you about listings.</p>
                                    </div>
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
                            <div className="flex items-center justify-between p-6 hover:bg-white/[0.02] transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                                        <CheckCircle className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Maintenance Requests</p>
                                        <p className="text-xs text-slate-400">Urgent notifications for repairs and tenant issues.</p>
                                    </div>
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
                    </section>

                    {/* Security Hub */}
                    <section className="rounded-xl border border-white/5 bg-[#1e293b] overflow-hidden">
                        <div className="border-b border-white/5 bg-[#1e293b] px-6 py-4 flex items-center gap-3">
                            <ShieldCheck className="h-5 w-5 text-blue-500" />
                            <div>
                                <h2 className="text-base font-semibold text-white">Security Hub</h2>
                            </div>
                        </div>
                        <div className="divide-y divide-white/5">
                            <button className="flex w-full items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group text-left">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                                        <Repeat className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Change Password</p>
                                        <p className="text-xs text-slate-400">Last changed 3 months ago</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors" />
                            </button>
                            <button className="flex w-full items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group text-left">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10 text-green-500">
                                        <Smartphone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Two-Factor Authentication</p>
                                        <p className="text-xs text-green-400">Enabled via Authenticator App</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors" />
                            </button>
                            <button className="flex w-full items-center justify-between p-5 hover:bg-white/[0.02] transition-colors group text-left">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white transition-colors">
                                        <User className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">Login Sessions</p>
                                        <p className="text-xs text-slate-400">Manage your active sessions and devices</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-slate-500 group-hover:text-white transition-colors" />
                            </button>
                        </div>
                    </section>
                </motion.div>

                {/* Unsaved Changes Toast */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-white/5 bg-[#1e293b] p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-black/20"
                >
                    <div className="text-sm text-slate-300 text-center sm:text-left">
                        You have unsaved changes in your <span className="font-bold text-white">payout</span> settings.
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors px-3 py-1.5">
                            Discard
                        </button>
                        <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 shadow-lg shadow-blue-500/25 transition-all active:scale-[0.98]">
                            Save Changes
                        </button>
                    </div>
                </motion.div>

                {/* Footer */}
                <footer className="mt-12 border-t border-white/5 pt-8 text-center text-xs text-slate-500 mb-8">
                    <div className="flex items-center justify-center gap-2 mb-2 font-bold text-slate-400">
                        <Building2 className="h-4 w-4" /> iReside Landlord Portal
                    </div>
                    <p className="mb-4">© 2023 IRESIDE PROPERTY MANAGEMENT SOLUTIONS. ALL RIGHTS RESERVED.</p>
                    <div className="flex justify-center gap-6">
                        <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
                        <a href="#" className="hover:text-slate-300 transition-colors">Help Center</a>
                        <a href="#" className="hover:text-slate-300 transition-colors">Contact Support</a>
                    </div>
                </footer>

            </div>
        </div>
    );
}
