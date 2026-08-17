"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { m as motion, AnimatePresence } from "framer-motion";
import {
    X,
    FileText,
    CreditCard,
    Hammer,
    Bell,
    CalendarClock,
    Search,
    User,
    ArrowUpRight,
    ExternalLink,
    Clock,
    CheckCircle2,
    AlertCircle,
    Building2,
    DollarSign,
    ShieldCheck,
    Send,
    MessageSquare,
    Loader2,
    Bot,
    Sparkles
} from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { RoleBadge, type BadgeRole } from "@/components/profile/RoleBadge";
import type { ContactItem } from "@/components/landlord/messages/types";

interface QuickActionSummaryModalProps {
    isOpen: boolean;
    onClose: () => void;
    actionKey: string | null;
    contact: ContactItem | null;
    currentUserRole: "landlord" | "tenant";
    onInsertMessage?: (text: string) => void;
}

type LeaseSummaryData = {
    monthlyRent?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    propertyName?: string;
    unitName?: string;
    deposit?: number;
};

type PaymentSummaryData = {
    totalPaid?: number;
    lastPaymentDate?: string;
    lastPaymentAmount?: number;
    pendingAmount?: number;
    status?: "paid" | "due_soon" | "overdue" | "pending" | "reminder_sent";
    statusLabel?: string;
    invoiceId?: string;
    invoiceDescription?: string;
    dueDate?: string;
};

type MaintenanceSummaryData = {
    openCount?: number;
    recentTitle?: string;
    recentStatus?: string;
    recentPriority?: string;
    recentDate?: string;
};

export function QuickActionSummaryModal({
    isOpen,
    onClose,
    actionKey,
    contact,
    currentUserRole,
    onInsertMessage,
}: QuickActionSummaryModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [leaseData, setLeaseData] = useState<LeaseSummaryData | null>(null);
    const [paymentData, setPaymentData] = useState<PaymentSummaryData | null>(null);
    const [maintenanceData, setMaintenanceData] = useState<MaintenanceSummaryData | null>(null);
    const [selectedNoticeTemplate, setSelectedNoticeTemplate] = useState(0);
    const [isSendingReminder, setIsSendingReminder] = useState(false);
    const [reminderSentSuccess, setReminderSentSuccess] = useState(false);
    const [reminderError, setReminderError] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !actionKey || !contact) return;

        let isMounted = true;
        setLoading(true);
        setReminderSentSuccess(false);
        setReminderError(null);

        const fetchDetails = async () => {
            try {
                if (actionKey === "view-lease") {
                    if (currentUserRole === "landlord" && contact.participantUserId) {
                        const res = await fetch(`/api/landlord/tenants/${contact.participantUserId}/profile`);
                        if (res.ok) {
                            const data = await res.json();
                            if (isMounted && data.lease) {
                                setLeaseData({
                                    monthlyRent: data.lease.monthly_rent,
                                    startDate: data.lease.start_date,
                                    endDate: data.lease.end_date,
                                    status: data.lease.status || "active",
                                    unitName: data.lease.unit?.name || contact.unit,
                                    propertyName: data.lease.unit?.property?.name || "Property",
                                    deposit: data.lease.monthly_rent ? data.lease.monthly_rent * 2 : undefined
                                });
                            }
                        }
                    } else if (currentUserRole === "tenant") {
                        const res = await fetch(`/api/tenant/lease`);
                        if (res.ok) {
                            const data = await res.json();
                            if (isMounted && data.lease) {
                                setLeaseData({
                                    monthlyRent: data.lease.monthlyRent,
                                    startDate: data.lease.startDate,
                                    endDate: data.lease.endDate,
                                    status: data.lease.status || "active",
                                    unitName: data.lease.unitName,
                                    propertyName: data.lease.propertyName,
                                    deposit: data.lease.securityDeposit
                                });
                            }
                        }
                    }
                } else if (actionKey === "request-payment" || actionKey === "pay-rent") {
                    if (currentUserRole === "landlord") {
                        // 1. Fetch conversation payments
                        const paymentsRes = await fetch(`/api/messages/conversations/${contact.id}/payments`);
                        let unpaidFound = false;
                        if (paymentsRes.ok) {
                            const data = await paymentsRes.json();
                            if (isMounted && data.payments && data.payments.length > 0) {
                                const unpaid = data.payments.find((p: any) => p.statusTone !== "paid");
                                if (unpaid) {
                                    unpaidFound = true;
                                    setPaymentData({
                                        pendingAmount: unpaid.amount,
                                        status: unpaid.statusLabel === "Reminder Sent" ? "reminder_sent" : "pending",
                                        statusLabel: unpaid.statusLabel || "Pending Payment",
                                        invoiceId: unpaid.id,
                                        invoiceDescription: unpaid.typeLabel || "Monthly Rent",
                                        dueDate: unpaid.dateLabel,
                                        totalPaid: data.totalPaid,
                                        lastPaymentDate: data.payments.find((p: any) => p.statusTone === "paid")?.dateLabel,
                                        lastPaymentAmount: data.payments.find((p: any) => p.statusTone === "paid")?.amount,
                                    });
                                } else {
                                    setPaymentData({
                                        pendingAmount: 0,
                                        status: "paid",
                                        statusLabel: "All Settled",
                                        totalPaid: data.totalPaid,
                                        lastPaymentDate: data.payments[0]?.dateLabel,
                                        lastPaymentAmount: data.payments[0]?.amount,
                                    });
                                }
                            }
                        }
                        
                        // 2. Fetch lease info for context if available
                        if (contact.participantUserId) {
                            const profileRes = await fetch(`/api/landlord/tenants/${contact.participantUserId}/profile`);
                            if (profileRes.ok) {
                                const profileData = await profileRes.json();
                                if (isMounted && profileData.lease) {
                                    setLeaseData({
                                        monthlyRent: profileData.lease.monthly_rent,
                                        startDate: profileData.lease.start_date,
                                        endDate: profileData.lease.end_date,
                                        status: profileData.lease.status || "active",
                                        unitName: profileData.lease.unit?.name || contact.unit,
                                        propertyName: profileData.lease.unit?.property?.name || "Property",
                                    });
                                    if (!unpaidFound) {
                                        setPaymentData((prev) => prev ?? {
                                            pendingAmount: profileData.lease.monthly_rent || 0,
                                            status: "pending",
                                            statusLabel: "Current Cycle Rent",
                                            invoiceDescription: "Monthly Rent Rate",
                                        });
                                    }
                                }
                            }
                        }
                    } else if (currentUserRole === "tenant") {
                        const res = await fetch(`/api/tenant/payments`);
                        if (res.ok) {
                            const data = await res.json();
                            if (isMounted) {
                                const nextPay = data.nextPayment;
                                setPaymentData({
                                    pendingAmount: nextPay ? nextPay.amount : 0,
                                    status: nextPay ? "due_soon" : "paid",
                                    statusLabel: nextPay ? "Pending Payment" : "All Settled",
                                    invoiceId: nextPay?.id,
                                    invoiceDescription: nextPay?.description || "Monthly Rent",
                                    dueDate: nextPay?.dueDate ? new Date(nextPay.dueDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : undefined,
                                    lastPaymentDate: data.history?.[0]?.createdAt ? new Date(data.history[0].createdAt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : undefined,
                                    lastPaymentAmount: data.history?.[0]?.amount,
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load quick action summary:", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        void fetchDetails();

        return () => {
            isMounted = false;
        };
    }, [isOpen, actionKey, contact, currentUserRole]);

    const canRender = Boolean(isOpen && actionKey && contact);

    const noticeTemplates = [
        {
            title: "Rent Due Reminder",
            text: `Friendly reminder: your monthly rent payment for ${contact?.unit || "your unit"} is due. Please settle your balance at your earliest convenience.`
        },
        {
            title: "Property Inspection Notice",
            text: `Notice: A routine property inspection for ${contact?.unit || "your unit"} is scheduled for this upcoming week. We will notify you of the exact schedule.`
        },
        {
            title: "Maintenance Service Alert",
            text: `Notice: Scheduled maintenance service will be conducted in the building. Please ensure common pathways are clear.`
        },
        {
            title: "General Advisory",
            text: `Important advisory for residents of ${contact?.unit || "the property"}: please check the community board for recent updates.`
        }
    ];

    const handleNavigate = (path: string) => {
        onClose();
        router.push(path);
    };

    const handleApplyNotice = (text: string) => {
        if (onInsertMessage) {
            onInsertMessage(text);
        }
        onClose();
    };

    const handleSendSystemReminder = async () => {
        if (!contact) return;
        if (!paymentData?.invoiceId) {
            handleNavigate(`/landlord/invoices?search=${encodeURIComponent(contact.name || "")}`);
            return;
        }

        setIsSendingReminder(true);
        setReminderError(null);
        try {
            const res = await fetch(`/api/landlord/invoices/${paymentData.invoiceId}/reminder`, {
                method: "POST",
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to send system reminder.");
            }
            setReminderSentSuccess(true);
            setPaymentData((prev) => prev ? { ...prev, status: "reminder_sent", statusLabel: "Reminder Sent" } : null);
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (err: any) {
            setReminderError(err.message || "Failed to dispatch system reminder.");
        } finally {
            setIsSendingReminder(false);
        }
    };

    return (
        <AnimatePresence>
            {canRender && contact && (
                <div key="quick-action-modal-wrapper" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        key="quick-action-modal-backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    {/* Modal Window */}
                    <motion.div
                        key="quick-action-modal-window"
                        initial={{ opacity: 0, scale: 0.95, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 15 }}
                        className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] neumorphic-panel p-6 shadow-2xl z-10 border border-white/10 bg-surface-1"
                    >
                    {/* Header */}
                    <div className="flex items-center justify-between pb-4 border-b border-divider">
                        <div className="flex items-center gap-3">
                            <div className="relative size-11 rounded-2xl neumorphic-inset-card overflow-hidden shrink-0" style={{ backgroundColor: contact.avatarBgColor || "var(--surface-3)" }}>
                                {contact.avatarUrl ? (
                                    <Image src={contact.avatarUrl} alt={contact.name} fill sizes="44px" className="object-cover" />
                                ) : (
                                    <span className="flex h-full w-full items-center justify-center font-black text-high">{contact.initials}</span>
                                )}
                            </div>
                            <div>
                                <h3 className="text-base font-black text-high leading-snug">{contact.name}</h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    {contact.role && <RoleBadge role={contact.role as BadgeRole} />}
                                    <span className="text-xs font-medium text-medium">{contact.unit || "Contact"}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-xl p-2 text-medium hover:bg-surface-2 hover:text-high transition-colors"
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    {/* Modal Content Body */}
                    <div className="py-5 space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <Loader2 className="size-6 text-primary animate-spin" />
                                <p className="text-xs text-medium">Loading summary...</p>
                            </div>
                        ) : (
                            <>
                                {/* 1. VIEW LEASE SUMMARY */}
                                {actionKey === "view-lease" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                                            <FileText className="size-4" />
                                            <span>Lease Agreement Summary</span>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="p-3.5 rounded-2xl neumorphic-inset-card space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-wider text-disabled">Assigned Unit</p>
                                                <p className="text-sm font-black text-high">{leaseData?.unitName || contact.unit || "Unit Assigned"}</p>
                                                <p className="text-[10px] text-medium">{leaseData?.propertyName || "Property"}</p>
                                            </div>
                                            <div className="p-3.5 rounded-2xl neumorphic-inset-card space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-wider text-disabled">Monthly Rent</p>
                                                <p className="text-sm font-black text-emerald-500">
                                                    {leaseData?.monthlyRent ? `₱${leaseData.monthlyRent.toLocaleString()}` : "Active Rate"}
                                                </p>
                                                <p className="text-[10px] text-medium">Due monthly</p>
                                            </div>
                                            <div className="p-3.5 rounded-2xl neumorphic-inset-card space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-wider text-disabled">Lease Period</p>
                                                <p className="text-xs font-bold text-high">
                                                    {leaseData?.startDate ? new Date(leaseData.startDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Active"}
                                                    {" — "}
                                                    {leaseData?.endDate ? new Date(leaseData.endDate).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : "Ongoing"}
                                                </p>
                                            </div>
                                            <div className="p-3.5 rounded-2xl neumorphic-inset-card space-y-1">
                                                <p className="text-[10px] font-black uppercase tracking-wider text-disabled">Status</p>
                                                <div className="flex items-center gap-1.5 pt-0.5">
                                                    <span className="size-2 rounded-full bg-emerald-500" />
                                                    <span className="text-xs font-black text-high capitalize">{leaseData?.status || "Active Lease"}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-2 flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (currentUserRole === "landlord") {
                                                        if (contact.participantUserId) {
                                                            handleNavigate(`/landlord/tenants?view=profile&tenantId=${contact.participantUserId}`);
                                                        } else {
                                                            handleNavigate(`/landlord/tenants?search=${encodeURIComponent(contact.name)}`);
                                                        }
                                                    } else {
                                                        handleNavigate("/tenant/lease");
                                                    }
                                                }}
                                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl neumorphic-primary text-white text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                                            >
                                                <span>{currentUserRole === "landlord" ? "View Full Profile & Lease" : "View Full Lease Agreement"}</span>
                                                <ArrowUpRight className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 2. REQUEST PAYMENT / PAY RENT SUMMARY */}
                                {(actionKey === "request-payment" || actionKey === "pay-rent") && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-500">
                                                <CreditCard className="size-4" />
                                                <span>Payment & Billing Summary</span>
                                            </div>
                                            {paymentData?.pendingAmount && paymentData.pendingAmount > 0 ? (
                                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1.5">
                                                    <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    {paymentData.statusLabel || "Payment Due"}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
                                                    <CheckCircle2 className="size-3" />
                                                    {paymentData?.statusLabel || "All Settled"}
                                                </span>
                                            )}
                                        </div>

                                        {/* Prominent Amount Due / Balance Card */}
                                        <div className="p-4 rounded-2xl neumorphic-inset-card space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-disabled">
                                                        {paymentData?.pendingAmount && paymentData.pendingAmount > 0 ? "Outstanding Amount Due" : "Current Account Balance"}
                                                    </p>
                                                    <p className={cn(
                                                        "text-3xl font-black mt-1 tracking-tight",
                                                        paymentData?.pendingAmount && paymentData.pendingAmount > 0 ? "text-amber-500" : "text-emerald-500"
                                                    )}>
                                                        {paymentData?.pendingAmount !== undefined && paymentData.pendingAmount > 0 
                                                            ? `₱${paymentData.pendingAmount.toLocaleString()}`
                                                            : (paymentData?.pendingAmount === 0 ? "₱0.00" : (leaseData?.monthlyRent ? `₱${leaseData.monthlyRent.toLocaleString()}` : "₱0.00"))}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black uppercase tracking-wider text-disabled">Target Unit</p>
                                                    <p className="text-xs font-black text-high mt-1">{leaseData?.unitName || contact.unit || "Unit"}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-divider text-xs">
                                                <div>
                                                    <span className="text-[10px] font-medium text-medium block">Invoice / Fee</span>
                                                    <span className="font-bold text-high">{paymentData?.invoiceDescription || "Monthly Rent"}</span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-[10px] font-medium text-medium block">Due / Status</span>
                                                    <span className="font-bold text-high">
                                                        {paymentData?.dueDate ? paymentData.dueDate : (paymentData?.lastPaymentDate ? `Last: ${paymentData.lastPaymentDate}` : "Current Cycle")}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Status Message / Info */}
                                        {reminderSentSuccess && (
                                            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 animate-in fade-in slide-in-from-top-1 duration-200">
                                                <CheckCircle2 className="size-5 shrink-0" />
                                                <div className="text-xs">
                                                    <p className="font-black">Official System Reminder Sent</p>
                                                    <p className="text-[11px] opacity-90 mt-0.5">iReside System has dispatched a neutral payment notification and Pay Now button directly to the tenant.</p>
                                                </div>
                                            </div>
                                        )}

                                        {reminderError && (
                                            <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs">
                                                <AlertCircle className="size-4 shrink-0" />
                                                <span className="font-medium">{reminderError}</span>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="pt-2 flex flex-col gap-2.5">
                                            {currentUserRole === "landlord" ? (
                                                <>
                                                    {paymentData?.pendingAmount && paymentData.pendingAmount > 0 && !reminderSentSuccess ? (
                                                        <div className="space-y-1.5">
                                                            <button
                                                                type="button"
                                                                disabled={isSendingReminder}
                                                                onClick={handleSendSystemReminder}
                                                                className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-primary text-white text-xs font-black uppercase tracking-widest shadow-md hover:bg-primary-dark transition-all active:scale-95 disabled:opacity-50"
                                                            >
                                                                {isSendingReminder ? (
                                                                    <>
                                                                        <Loader2 className="size-4 animate-spin" />
                                                                        <span>Dispatching System Reminder...</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Bot className="size-4" />
                                                                        <span>Send Official System Reminder</span>
                                                                    </>
                                                                )}
                                                            </button>
                                                            <p className="text-[10px] text-center text-disabled font-medium px-2">
                                                                Dispatched automatically from <span className="font-bold text-medium">iReside System</span> to prevent false hostility or personal confrontation.
                                                            </p>
                                                        </div>
                                                    ) : null}

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleNavigate(`/landlord/invoices?search=${encodeURIComponent(contact.name)}`);
                                                        }}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl neumorphic-inset-card text-high hover:text-primary text-xs font-black uppercase tracking-widest transition-all"
                                                    >
                                                        <span>View Invoices & Billing Details</span>
                                                        <ArrowUpRight className="size-4" />
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    {paymentData?.pendingAmount && paymentData.pendingAmount > 0 ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleNavigate(paymentData.invoiceId ? `/tenant/payments/${paymentData.invoiceId}/checkout` : "/tenant/payments?action=pay")}
                                                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl neumorphic-primary text-white text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                                                        >
                                                            <span>Pay Outstanding Balance (₱{paymentData.pendingAmount.toLocaleString()})</span>
                                                            <ArrowUpRight className="size-4" />
                                                        </button>
                                                    ) : null}

                                                    <button
                                                        type="button"
                                                        onClick={() => handleNavigate("/tenant/payments")}
                                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl neumorphic-inset-card text-high hover:text-primary text-xs font-black uppercase tracking-widest transition-all"
                                                    >
                                                        <span>View Payment History & Receipts</span>
                                                        <ArrowUpRight className="size-4" />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* 3. SCHEDULE REPAIR / REQUEST REPAIR */}
                                {(actionKey === "schedule-repair" || actionKey === "request-repair") && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-500">
                                            <Hammer className="size-4" />
                                            <span>Maintenance & Repairs</span>
                                        </div>

                                        <div className="p-4 rounded-2xl neumorphic-inset-card space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-medium">Target Unit</span>
                                                <span className="text-xs font-black text-high">{contact.unit || "Assigned Unit"}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-medium">Ticket Triage</span>
                                                <span className="text-xs font-black text-amber-500">Priority Support</span>
                                            </div>
                                            <p className="text-[11px] text-medium leading-relaxed pt-1">
                                                Maintenance requests submitted for this unit are logged with real-time status tracking and vendor dispatching.
                                            </p>
                                        </div>

                                        <div className="pt-2 flex flex-col gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (currentUserRole === "landlord") {
                                                        handleNavigate(`/landlord/maintenance?search=${encodeURIComponent(contact.name)}`);
                                                    } else {
                                                        handleNavigate("/tenant/maintenance?action=new");
                                                    }
                                                }}
                                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl neumorphic-primary text-white text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                                            >
                                                <span>{currentUserRole === "landlord" ? "Open in Maintenance Dashboard" : "Create New Repair Request"}</span>
                                                <ArrowUpRight className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 4. SEND NOTICE (LANDLORD) */}
                                {actionKey === "send-notice" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-400">
                                            <Bell className="size-4" />
                                            <span>Send Formal Notice Template</span>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-disabled">Select Preset Notice</label>
                                            <div className="grid grid-cols-1 gap-2">
                                                {noticeTemplates.map((template, idx) => (
                                                    <button
                                                        key={template.title}
                                                        type="button"
                                                        onClick={() => setSelectedNoticeTemplate(idx)}
                                                        className={cn(
                                                            "text-left p-3 rounded-2xl transition-all border",
                                                            selectedNoticeTemplate === idx
                                                                ? "border-primary/40 bg-primary/10 shadow-sm"
                                                                : "border-border neumorphic-inset-card hover:border-primary/20"
                                                        )}
                                                    >
                                                        <p className="text-xs font-black text-high">{template.title}</p>
                                                        <p className="text-[11px] text-medium line-clamp-2 mt-0.5">{template.text}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => handleApplyNotice(noticeTemplates[selectedNoticeTemplate].text)}
                                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl neumorphic-primary text-white text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                                            >
                                                <Send className="size-4" />
                                                <span>Apply Notice into Chat</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 5. REVIEW APPLICATION (LANDLORD - PROSPECTIVE) */}
                                {actionKey === "review-application" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400">
                                            <FileText className="size-4" />
                                            <span>Rental Application Summary</span>
                                        </div>

                                        <div className="p-4 rounded-2xl neumorphic-inset-card space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-medium">Applicant Name</span>
                                                <span className="text-xs font-black text-high">{contact.name}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-medium">Target Unit</span>
                                                <span className="text-xs font-black text-high">{contact.unit || "Prospective Unit"}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-medium">Application Status</span>
                                                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                                    In Review
                                                </span>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => handleNavigate(`/landlord/applications?search=${encodeURIComponent(contact.name)}`)}
                                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl neumorphic-primary text-white text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                                            >
                                                <span>Open Application for Review</span>
                                                <ArrowUpRight className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 6. SCHEDULE VIEWING (LANDLORD - PROSPECTIVE) */}
                                {actionKey === "schedule-viewing" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-amber-500">
                                            <CalendarClock className="size-4" />
                                            <span>Schedule Property Viewing</span>
                                        </div>

                                        <div className="p-4 rounded-2xl neumorphic-inset-card space-y-2">
                                            <p className="text-xs font-black text-high">Viewing Invitation for {contact.name}</p>
                                            <p className="text-[11px] text-medium leading-relaxed">
                                                Send standard viewing hours for {contact.unit || "the property"} directly to the prospect.
                                            </p>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleApplyNotice(
                                                        `Hello ${contact.name}! We would love to schedule a property viewing for ${contact.unit || "the unit"}. Please let us know your availability during our standard viewing hours:\n• Weekdays: 10:00 AM - 4:00 PM\n• Saturdays: 1:00 PM - 5:00 PM`
                                                    );
                                                }}
                                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl neumorphic-primary text-white text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                                            >
                                                <Send className="size-4" />
                                                <span>Insert Viewing Schedule into Chat</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 7. SHARE REQUIREMENTS (LANDLORD - PROSPECTIVE) */}
                                {actionKey === "share-requirements" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                                            <ShieldCheck className="size-4" />
                                            <span>Tenancy Screening Requirements</span>
                                        </div>

                                        <div className="p-4 rounded-2xl neumorphic-inset-card space-y-2 text-xs">
                                            <p className="font-black text-high">Required Documents Checklist:</p>
                                            <ul className="space-y-1 text-medium text-[11px] list-disc list-inside">
                                                <li>2 Valid Government-issued IDs</li>
                                                <li>Proof of Income (latest 3 months payslips or bank statements)</li>
                                                <li>Certificate of Employment (or School Enrollment)</li>
                                                <li>1 Month Advance + 1 Month Security Deposit</li>
                                            </ul>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    handleApplyNotice(
                                                        `Here are the standard screening documents required to process your tenancy application for ${contact.unit || "our property"}:\n1. 2 Valid Government-issued IDs\n2. Proof of Income (latest 3 months payslips or bank statements)\n3. Certificate of Employment or School Enrollment\n4. 1 Month Advance + 1 Month Security Deposit\n\nPlease send photos or PDFs of these documents here.`
                                                    );
                                                }}
                                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl neumorphic-primary text-white text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                                            >
                                                <Send className="size-4" />
                                                <span>Share Requirements in Chat</span>
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 8. SHARE LISTING (LANDLORD - PROSPECTIVE) */}
                                {actionKey === "share-listing" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-neutral-300">
                                            <Search className="size-4" />
                                            <span>Property Listings</span>
                                        </div>

                                        <div className="p-4 rounded-2xl neumorphic-inset-card space-y-2">
                                            <p className="text-xs font-black text-high">Manage & Share Property Units</p>
                                            <p className="text-[11px] text-medium leading-relaxed">
                                                Browse all properties and available units to share details or generate direct listing links.
                                            </p>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => handleNavigate("/landlord/properties")}
                                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl neumorphic-primary text-white text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                                            >
                                                <span>Browse Property Listings</span>
                                                <ArrowUpRight className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 9. VIEW PROFILE */}
                                {actionKey === "view-profile" && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-400">
                                            <User className="size-4" />
                                            <span>Resident Profile Summary</span>
                                        </div>

                                        <div className="p-4 rounded-2xl neumorphic-inset-card space-y-3 text-center flex flex-col items-center">
                                            <div className="relative size-16 rounded-full neumorphic-inset-card overflow-hidden" style={{ backgroundColor: contact.avatarBgColor || "var(--surface-3)" }}>
                                                {contact.avatarUrl ? (
                                                    <Image src={contact.avatarUrl} alt={contact.name} fill sizes="64px" className="object-cover" />
                                                ) : (
                                                    <span className="flex h-full w-full items-center justify-center font-black text-lg text-high">{contact.initials}</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-high">{contact.name}</p>
                                                <p className="text-xs text-medium">{contact.unit || "Resident"}</p>
                                            </div>
                                        </div>

                                        <div className="pt-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (contact.participantUserId) {
                                                        handleNavigate(`/visitor/${contact.participantUserId}`);
                                                    } else {
                                                        handleNavigate(`/landlord/tenants?search=${encodeURIComponent(contact.name)}`);
                                                    }
                                                }}
                                                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl neumorphic-primary text-white text-xs font-black uppercase tracking-widest shadow-md transition-all active:scale-95"
                                            >
                                                <span>Open Full Profile</span>
                                                <ArrowUpRight className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
            )}
        </AnimatePresence>
    );
}
