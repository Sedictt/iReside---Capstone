import Image from "next/image";
import Link from "next/link";
import {
    X,
    CreditCard,
    Search,
    CheckCircle2,
    ChevronRight,
    MessageSquare,
    Send,
    Receipt,
    Banknote,
    Loader2,
    AlertCircle,
    ArrowUpRight,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { AnimatePresence, m as motion } from "framer-motion";
import { DEFAULT_AVATAR_URL, getSafeAvatarBgColor } from "@/lib/constants";
import { useLanguageContext } from "@/context/LanguageContext";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    category: "Overdue" | "Near Due" | "Paid" | null;
    paymentsByCategory: Record<"Overdue" | "Near Due" | "Paid", PaymentListItem[]>;
    onRecordPayment?: (invoiceId: string) => void;
}

interface PaymentListItem {
    id: string;
    tenant: string;
    unit: string;
    amount: number;
    date: string;
    avatar: string | null;
    avatarBgColor?: string | null;
}

const FALLBACK_AVATAR = DEFAULT_AVATAR_URL;
const CATEGORY_COPY: Record<"Overdue" | "Near Due" | "Paid", { title: string; description: string; emptyState: string }> = {
    Overdue: {
        title: "Unpaid Rent",
        description: "Unpaid invoices past their due date.",
        emptyState: "No overdue rent found",
    },
    "Near Due": {
        title: "Due in Next 7 Days",
        description: "Pending invoices due within one week.",
        emptyState: "No invoices due this week",
    },
    Paid: {
        title: "Recently Paid Rent",
        description: "Most recent rent payments already received.",
        emptyState: "No recent payments found",
    },
};

export function PaymentModal({
    isOpen,
    onClose,
    category,
    paymentsByCategory,
    onRecordPayment,
}: PaymentModalProps) {
    const { t } = useLanguageContext();
    const [selectedActionPayment, setSelectedActionPayment] = useState<PaymentListItem | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSendingReminder, setIsSendingReminder] = useState(false);
    const [reminderFeedback, setReminderFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

    if (!category) return null;

    const payments = paymentsByCategory[category] || [];
    const categoryCopy = CATEGORY_COPY[category];
    const trimmedQuery = searchQuery.trim();

    const filteredPayments = payments.filter((payment) =>
        payment.tenant.toLowerCase().includes(trimmedQuery.toLowerCase()) ||
        payment.unit.toLowerCase().includes(trimmedQuery.toLowerCase())
    );

    const handleCloseTarget = () => {
        setSelectedActionPayment(null);
        setReminderFeedback(null);
        setIsSendingReminder(false);
    };

    const handleSendReminder = async (payment: PaymentListItem) => {
        setIsSendingReminder(true);
        setReminderFeedback(null);
        try {
            const res = await fetch(`/api/landlord/invoices/${payment.id}/reminder`, {
                method: "POST",
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || "Unable to send reminder right now.");
            }
            setReminderFeedback({
                type: "success",
                message: t("Payment reminder sent to {tenant}!", { tenant: payment.tenant }),
            });
        } catch (err: any) {
            setReminderFeedback({
                type: "error",
                message: t(err?.message || "Unable to send reminder right now."),
            });
        } finally {
            setIsSendingReminder(false);
        }
    };

    const getStatusStyles = () => {
        switch (category) {
            case "Overdue":
                return "text-rose-600 dark:text-red-400 bg-rose-50 dark:bg-red-500/10 border-rose-200 dark:border-red-500/20";
            case "Near Due":
                return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20";
            case "Paid":
                return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20";
        }
    };

    const getDotColor = () => {
        switch (category) {
            case "Overdue":
                return "bg-rose-500 dark:bg-red-500";
            case "Near Due":
                return "bg-amber-500";
            case "Paid":
                return "bg-emerald-500";
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => {
                            handleCloseTarget();
                            onClose();
                        }}
                        className="fixed inset-0 h-screen w-screen bg-black/50 dark:bg-black/80 backdrop-blur-md z-[100] transition-opacity"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-b-none max-sm:rounded-t-[2.5rem] sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-[101] flex max-h-[88vh] sm:max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl neumorphic-panel"
                    >
                        {/* Header */}
                        <div className="flex shrink-0 items-center justify-between border-b border-neutral-200/50 dark:border-white/5 bg-neutral-100/60 dark:bg-neutral-900/50 p-6 sm:p-8 backdrop-blur-xl">
                            <div className="flex items-center gap-4 sm:gap-5">
                                <div className="rounded-2xl neumorphic-inset-card p-3.5 sm:p-4 text-primary shrink-0">
                                    <CreditCard className="size-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="flex items-center gap-3 text-xl sm:text-2xl font-black text-foreground text-balance">
                                        {t(categoryCopy.title)}
                                        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-black text-primary border border-primary/20 tabular-nums">
                                            {filteredPayments.length}
                                        </span>
                                    </h2>
                                    <p className="mt-1 text-xs font-medium text-muted-foreground text-pretty">
                                        {t(categoryCopy.description)}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    handleCloseTarget();
                                    onClose();
                                }}
                                className="group flex size-11 min-h-[44px] min-w-[44px] items-center justify-center rounded-2xl neumorphic-extruded text-muted-foreground transition-all hover:text-primary hover:rotate-90 active:scale-95"
                                aria-label={t("Close dialog")}
                            >
                                <X className="size-5" />
                            </button>
                        </div>

                        {/* Search Bar - High Visual Affordance */}
                        <div className="shrink-0 border-b border-neutral-200/60 dark:border-white/10 px-6 py-4 bg-neutral-100/40 dark:bg-neutral-900/40">
                            <div className="relative group flex items-center">
                                <Search
                                    className="pointer-events-none absolute left-4 size-4 text-slate-400 dark:text-neutral-400 group-focus-within:text-primary transition-colors"
                                    aria-hidden="true"
                                />
                                <input
                                    maxLength={60}
                                    type="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t("Search by tenant name or unit number...")}
                                    aria-label={t("Search by tenant name or unit number...")}
                                    className="w-full rounded-xl border-2 border-slate-200/90 dark:border-white/15 bg-white dark:bg-input py-3 pl-11 pr-10 text-sm font-medium text-foreground shadow-xs placeholder:text-slate-400 dark:placeholder:text-neutral-500 transition-all hover:border-slate-300 dark:hover:border-white/25 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/15"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        aria-label={t("Clear search")}
                                        className="absolute right-3 flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar-premium bg-gradient-to-b from-transparent to-black/[0.03] dark:to-black/20">
                            {filteredPayments.length === 0 ? (
                                trimmedQuery ? (
                                    <div className="rounded-3xl border border-border/60 bg-card/60 p-8 sm:p-12 text-center flex flex-col items-center justify-center gap-3">
                                        <div className="size-12 rounded-2xl bg-muted text-muted-foreground flex items-center justify-center shadow-xs">
                                            <Search className="size-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-black text-foreground">
                                                {t('No results found matching "{query}"', { query: trimmedQuery })}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                                                {t("Try searching with a different tenant name or unit number.")}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setSearchQuery("")}
                                            className="mt-2 min-h-[40px] rounded-xl border border-border bg-background px-4 py-2 text-xs font-bold text-foreground hover:bg-muted transition-all active:scale-95"
                                        >
                                            {t("Clear All Filters")}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 p-8 sm:p-12 text-center backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                                        <div className="size-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shadow-xs">
                                            <CheckCircle2 className="size-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm sm:text-base font-black text-foreground">
                                                {category === "Overdue"
                                                    ? t("All Caught Up!")
                                                    : category === "Near Due"
                                                    ? t("Clear Horizon")
                                                    : t("No Records")}
                                            </h3>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-xs mx-auto leading-relaxed">
                                                {t(categoryCopy.emptyState)}
                                            </p>
                                        </div>
                                    </div>
                                )
                            ) : (
                                filteredPayments.map((payment) => (
                                    <div
                                        key={payment.id}
                                        onClick={() => {
                                            setReminderFeedback(null);
                                            setSelectedActionPayment(payment);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                setReminderFeedback(null);
                                                setSelectedActionPayment(payment);
                                            }
                                        }}
                                        tabIndex={0}
                                        role="button"
                                        className="group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-2xl border border-neutral-200/60 dark:border-white/5 bg-card p-4 sm:p-5 transition-all hover:bg-neutral-50/80 dark:hover:bg-white/[0.06] hover:shadow-[4px_4px_12px_rgba(163,177,198,0.25)] dark:hover:shadow-[inset_0_0_20px_rgba(255,255,255,0.01)] hover:border-primary/20 active:scale-[0.98]"
                                    >
                                        <div className="flex items-center gap-4 relative z-10 min-w-0">
                                            <div className="relative shrink-0">
                                                <div
                                                    className="relative size-12 sm:size-14 rounded-full border-2 border-background overflow-hidden transition-all duration-500 group-hover:scale-105"
                                                    style={{ backgroundColor: getSafeAvatarBgColor(payment.avatarBgColor) }}
                                                >
                                                    <Image
                                                        src={payment.avatar || FALLBACK_AVATAR}
                                                        alt={payment.tenant}
                                                        fill
                                                        sizes="56px"
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div
                                                    className={cn(
                                                        "absolute -bottom-0.5 -right-0.5 size-3.5 sm:size-4 rounded-full border-2 border-background shadow-lg",
                                                        getDotColor()
                                                    )}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="text-sm sm:text-base font-black text-foreground transition-colors group-hover:text-primary truncate">
                                                    {payment.tenant}
                                                </h4>
                                                <p className="text-[11px] font-black text-muted-foreground uppercase tracking-wider">
                                                    {payment.unit}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 relative z-10 shrink-0 pl-3">
                                            <div className="text-right flex flex-col items-end">
                                                <h4 className="mb-1 text-sm sm:text-base font-black text-foreground tracking-tight tabular-nums">
                                                    PHP {payment.amount.toLocaleString()}
                                                </h4>
                                                <div className="flex items-center justify-end gap-2 text-[10px] font-black uppercase tracking-widest">
                                                    <span
                                                        className={cn(
                                                            "px-2 py-0.5 rounded-full border",
                                                            getStatusStyles()
                                                        )}
                                                    >
                                                        {t(category)}
                                                    </span>
                                                    <span className="text-muted-foreground/70">{payment.date}</span>
                                                </div>
                                            </div>
                                            <ChevronRight
                                                className="size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                                                aria-hidden="true"
                                            />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Secondary Action Modal (Tenant Invoice Follow-Up & Payment Recording Hub) */}
                    <AnimatePresence>
                        {selectedActionPayment && (
                            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-black/75 backdrop-blur-md"
                                    onClick={handleCloseTarget}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter" || e.key === " ") {
                                            e.preventDefault();
                                            handleCloseTarget();
                                        }
                                    }}
                                    tabIndex={0}
                                    role="button"
                                    aria-label={t("Close tenant payment options")}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.92, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.92, y: 20 }}
                                    className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl neumorphic-panel p-6 sm:p-8"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="relative shrink-0">
                                                <div
                                                    className="relative size-16 sm:size-20 rounded-full border-2 border-neutral-200 dark:border-white/10 overflow-hidden"
                                                    style={{ backgroundColor: getSafeAvatarBgColor(selectedActionPayment.avatarBgColor) }}
                                                >
                                                    <Image
                                                        src={selectedActionPayment.avatar || FALLBACK_AVATAR}
                                                        alt={selectedActionPayment.tenant}
                                                        fill
                                                        sizes="80px"
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div
                                                    className={cn(
                                                        "absolute -bottom-0.5 -right-0.5 size-5 rounded-full border-4 border-background shadow-lg",
                                                        getDotColor()
                                                    )}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-lg sm:text-xl font-black text-foreground truncate">
                                                    {selectedActionPayment.tenant}
                                                </h3>
                                                <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                                                    {selectedActionPayment.unit}
                                                </p>
                                                <span
                                                    className={cn(
                                                        "mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider",
                                                        getStatusStyles()
                                                    )}
                                                >
                                                    {t(category)} • {selectedActionPayment.date}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCloseTarget}
                                            className="flex size-9 min-h-[36px] min-w-[36px] items-center justify-center rounded-xl neumorphic-extruded text-muted-foreground hover:text-foreground transition-colors shrink-0"
                                            aria-label={t("Close")}
                                        >
                                            <X className="size-4" />
                                        </button>
                                    </div>

                                    {/* Invoice Balance Summary Card */}
                                    <div className="mt-6 flex items-center justify-between rounded-2xl bg-neutral-100/70 dark:bg-white/[0.03] p-4 sm:p-5 border border-neutral-200/80 dark:border-white/10">
                                        <div>
                                            <p className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">
                                                {category === "Paid" ? t("Amount Paid") : t("Amount Due")}
                                            </p>
                                            <h4 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight tabular-nums mt-0.5">
                                                PHP {selectedActionPayment.amount.toLocaleString()}
                                            </h4>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[11px] font-semibold text-muted-foreground block">
                                                {category === "Paid" ? t("Date Received") : t("Due Date")}
                                            </span>
                                            <span className="text-xs sm:text-sm font-bold text-foreground">
                                                {selectedActionPayment.date}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Reminder Feedback Banner */}
                                    {reminderFeedback && (
                                        <div
                                            className={cn(
                                                "mt-4 flex items-center gap-2.5 rounded-2xl border p-3.5 text-xs font-bold",
                                                reminderFeedback.type === "success"
                                                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                                    : "border-rose-500/25 bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                            )}
                                            role="status"
                                        >
                                            {reminderFeedback.type === "success" ? (
                                                <CheckCircle2 className="size-4 shrink-0" />
                                            ) : (
                                                <AlertCircle className="size-4 shrink-0" />
                                            )}
                                            <span>{reminderFeedback.message}</span>
                                        </div>
                                    )}

                                    {/* Action Controls */}
                                    <div className="mt-6 flex flex-col gap-3">
                                        {category !== "Paid" && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const targetId = selectedActionPayment.id;
                                                        handleCloseTarget();
                                                        onClose();
                                                        if (onRecordPayment) {
                                                            onRecordPayment(targetId);
                                                        } else {
                                                            window.location.href = `/landlord/invoices?search=${encodeURIComponent(selectedActionPayment.tenant)}`;
                                                        }
                                                    }}
                                                    className="group flex min-h-[48px] w-full items-center justify-between rounded-xl bg-primary px-5 py-3.5 text-primary-foreground shadow-sm transition-all hover:brightness-105 active:scale-[0.99]"
                                                >
                                                    <div className="flex items-center gap-3 text-left">
                                                        <div className="flex size-8 items-center justify-center rounded-lg bg-white/20 shrink-0">
                                                            <Banknote className="size-4 text-white" />
                                                        </div>
                                                        <div>
                                                            <span className="block text-xs sm:text-sm font-black uppercase tracking-wide text-white">
                                                                {t("Record Payment")}
                                                            </span>
                                                            <span className="block text-[11px] font-medium text-white/80">
                                                                {t("Verify payment method, amount, and receipt details")}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="size-4 text-white/80 transition-transform group-hover:translate-x-1 shrink-0" />
                                                </button>

                                                <button
                                                    type="button"
                                                    disabled={isSendingReminder}
                                                    onClick={() => handleSendReminder(selectedActionPayment)}
                                                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-[0.99] disabled:opacity-60"
                                                >
                                                    {isSendingReminder ? (
                                                        <Loader2 className="size-4 animate-spin text-primary" />
                                                    ) : (
                                                        <Send className="size-4 text-primary" />
                                                    )}
                                                    <span>
                                                        {isSendingReminder
                                                            ? t("Sending Reminder...")
                                                            : t("Send Payment Reminder")}
                                                    </span>
                                                </button>
                                            </>
                                        )}

                                        <div className="grid grid-cols-2 gap-2.5">
                                            <Link
                                                href={`/landlord/messages?search=${encodeURIComponent(selectedActionPayment.tenant)}`}
                                                onClick={() => {
                                                    handleCloseTarget();
                                                    onClose();
                                                }}
                                                className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95"
                                            >
                                                <MessageSquare className="size-4 text-primary shrink-0" />
                                                <span>{t("Message Tenant")}</span>
                                            </Link>

                                            <Link
                                                href={`/landlord/invoices?search=${encodeURIComponent(selectedActionPayment.tenant)}`}
                                                onClick={() => {
                                                    handleCloseTarget();
                                                    onClose();
                                                }}
                                                className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-bold text-foreground transition-all hover:bg-muted active:scale-95"
                                            >
                                                <Receipt className="size-4 text-primary shrink-0" />
                                                <span>{t("View Invoice")}</span>
                                                <ArrowUpRight className="size-3.5 text-muted-foreground shrink-0" />
                                            </Link>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleCloseTarget}
                                            className="mt-1 flex min-h-[42px] items-center justify-center rounded-xl neumorphic-extruded py-2.5 text-xs font-bold text-muted-foreground transition-all hover:text-foreground active:scale-95"
                                        >
                                            {t("Cancel")}
                                        </button>
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>
                </>
            )}
        </AnimatePresence>
    );
}
