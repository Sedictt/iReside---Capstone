"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { m as motion, AnimatePresence } from "framer-motion";
import { X, Receipt, CheckCircle2, Calendar, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProperty } from "@/context/PropertyContext";
import { toast } from "sonner";
import { useFormValidation } from "@/hooks/useFormValidation";
import { FieldError, fieldErrorClass } from "@/components/ui/field-error";
import { choiceRule, dateRule, moneyRule, parseNumericInput, textRule, todayIsoDate } from "@/lib/validation/rules";
import { BILLING_LIMITS, EXPENSE_CATEGORIES, EXPENSE_FUTURE_DATE_MESSAGE } from "@/lib/validation/schemas/billing.schema";

interface RecordExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RecordExpenseModal({ isOpen, onClose, onSaved }: RecordExpenseModalProps & { onSaved?: () => void }) {
    const { selectedPropertyId } = useProperty();
    const [category, setCategory] = useState("maintenance");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(() => todayIsoDate());
    const [description, setDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirming, setConfirming] = useState(false);

    const formatWithCommas = (value: string) => {
        const cleanValue = value.replace(/,/g, "");
        if (cleanValue === "") return "";
        const parts = cleanValue.split(".");
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join(".");
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/,/g, "");
        if (val === "" || /^\d*\.?\d*$/.test(val)) {
            setAmount(formatWithCommas(val));
        }
    };

    const formValues = useMemo(() => ({ category, amount, date, description }), [category, amount, date, description]);
    const form = useFormValidation(formValues, {
        category: (value) => choiceRule(value, EXPENSE_CATEGORIES, { label: "Expense category" }),
        amount: (value) => moneyRule(value, { label: "Amount", positive: true }),
        date: (value) => dateRule(value, { label: "Date incurred", max: todayIsoDate(), maxMessage: EXPENSE_FUTURE_DATE_MESSAGE }),
        description: (value) => textRule(value, { label: "Description", required: true, max: BILLING_LIMITS.expenseDescription }),
    });

    if (!isOpen) return null;

    const categories = [
        { id: "maintenance", label: "Maintenance", color: "text-orange-500", bg: "bg-orange-500/10" },
        { id: "utilities", label: "Utilities", color: "text-blue-500", bg: "bg-blue-500/10" },
        { id: "taxes", label: "Taxes & Fees", color: "text-purple-500", bg: "bg-purple-500/10" },
        { id: "other", label: "Other", color: "text-zinc-500", bg: "bg-zinc-500/10" },
    ];

    const selectedCategory = categories.find((c) => c.id === category);

    const handleConfirmedSubmit = async () => {
        if (isSubmitting) return;
        if (!form.validateAll()) {
            setConfirming(false);
            return;
        }
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/landlord/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category,
                    amount: parseNumericInput(amount),
                    date_incurred: date,
                    description: description.trim(),
                    propertyId: selectedPropertyId === "all" ? undefined : selectedPropertyId,
                }),
            });
            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                form.setServerErrors(data?.fieldErrors);
                setConfirming(false);
                throw new Error(data?.error || "Failed to record expense. Please try again.");
            }

            // Reset form
            setAmount("");
            setDescription("");
            form.reset();
            setConfirming(false);
            if (onSaved) onSaved();
            onClose();
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to record expense. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const content = (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
                onClick={onClose}
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative flex w-full max-w-xl flex-col overflow-hidden rounded-[2.5rem] border border-border bg-card shadow-[0_32px_120px_-20px_rgba(0,0,0,0.8)]"
            >
                {/* Header */}
                <div className="relative shrink-0 overflow-hidden border-b border-border/50 bg-background/50 px-8 py-8">
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 size-64 rounded-full bg-rose-500/5 blur-3xl transition-opacity animate-pulse" />
                    <div className="relative flex items-start justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-xl bg-background border border-border shadow-inner">
                                    <Receipt className="size-5 text-rose-500" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-primary">Financial Ledger</span>
                            </div>
                            <h2 className="text-3xl font-black tracking-tight text-foreground">Record Expense</h2>
                            <p className="text-sm font-medium text-muted-foreground">Log a manual outflow transaction to keep your net income accurate.</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="group flex size-10 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-95 shadow-sm"
                        >
                            <X className="size-5 transition-transform group-hover:rotate-90" />
                        </button>
                    </div>
                </div>

                {/* Form */}
                <form
                    onSubmit={(e) => { e.preventDefault(); if (form.validateAll()) setConfirming(true); }}
                    noValidate
                    className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6"
                >
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Expense Category</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {categories.map((categoryOption) => (
                                <button
                                    key={categoryOption.id}
                                    type="button"
                                    onClick={() => setCategory(categoryOption.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all",
                                        category === categoryOption.id
                                            ? "border-primary/50 bg-primary/10 shadow-sm"
                                            : "border-border bg-background/50 hover:bg-background"
                                    )}
                                >
                                    <div className={cn("flex size-8 items-center justify-center rounded-full", categoryOption.bg, categoryOption.color)}>
                                        <CheckCircle2 className={cn("size-4", category === categoryOption.id ? "opacity-100" : "opacity-0")} />
                                    </div>
                                    <span className={cn("text-xs font-black", category === categoryOption.id ? "text-foreground" : "text-muted-foreground")}>{categoryOption.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-3">
                            <label htmlFor="expense-amount" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Amount (PHP)</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-muted-foreground group-focus-within:text-primary transition-colors select-none">₱</span>
                                <input maxLength={14}
                                    {...form.fieldProps("amount")}
                                    id="expense-amount"
                                    type="text"
                                    inputMode="decimal"
                                    required
                                    value={amount}
                                    onChange={handleAmountChange}
                                    className={cn("w-full rounded-2xl border border-border bg-background py-4 pl-12 pr-4 text-sm font-black text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-4 focus:ring-primary/10", form.errorFor("amount") && fieldErrorClass)}
                                    placeholder="0.00"
                                />
                            </div>
                            <FieldError id={form.errorId("amount")} message={form.errorFor("amount")} />
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="expense-date" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Date Incurred</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input min="2000-01-01" max={todayIsoDate()}
                                    {...form.fieldProps("date")}
                                    id="expense-date"
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(event) => setDate(event.target.value)}
                                    className={cn("w-full rounded-2xl border border-border bg-background py-4 pl-12 pr-4 text-sm font-black text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10", form.errorFor("date") && fieldErrorClass)}
                                />
                            </div>
                            <FieldError id={form.errorId("date")} message={form.errorFor("date")} />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label htmlFor="expense-description" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Description</label>
                        <div className="relative group">
                            <Type className="absolute left-4 top-4 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <textarea maxLength={BILLING_LIMITS.expenseDescription}
                                {...form.fieldProps("description")}
                                id="expense-description"
                                required
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                rows={3}
                                className={cn("w-full resize-none rounded-2xl border border-border bg-background py-4 pl-12 pr-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-4 focus:ring-primary/10", form.errorFor("description") && fieldErrorClass)}
                                placeholder="What was this expense for? (e.g. Fixed leaky faucet in Unit 402)"
                            />
                        </div>
                        <FieldError id={form.errorId("description")} message={form.errorFor("description")} />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                        >
                            <CheckCircle2 className="size-5 transition-transform group-hover:scale-110" />
                            Record Expense
                        </button>
                    </div>
                </form>

                {/* Confirmation Overlay */}
                <AnimatePresence>
                    {confirming && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-10 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm rounded-[2.5rem]"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.92, y: 16 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.92, y: 16 }}
                                className="w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
                            >
                                <div className="px-7 py-7 space-y-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex size-10 items-center justify-center rounded-xl bg-rose-500/10 border border-rose-500/20">
                                            <Receipt className="size-5 text-rose-500" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-foreground">Confirm Expense</p>
                                            <p className="text-[11px] text-muted-foreground">Review before saving to the ledger</p>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-border bg-background/60 divide-y divide-border/60 overflow-hidden">
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Category</span>
                                            <span className={cn("text-xs font-black capitalize", selectedCategory?.color)}>{selectedCategory?.label}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Amount</span>
                                            <span className="text-sm font-black text-foreground">₱{amount}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-4 py-3">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground">Date</span>
                                            <span className="text-xs font-bold text-foreground">
                                                {new Date(date + "T00:00:00").toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" })}
                                            </span>
                                        </div>
                                        <div className="px-4 py-3">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground block mb-1">Description</span>
                                            <span className="text-xs text-foreground/80 leading-relaxed line-clamp-2">{description}</span>
                                        </div>
                                    </div>

                                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                                        This will be permanently recorded in your financial ledger and deducted from your net income.
                                    </p>

                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setConfirming(false)}
                                            disabled={isSubmitting}
                                            className="flex-1 rounded-2xl border border-border bg-background px-4 py-3 text-sm font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            Go Back
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleConfirmedSubmit}
                                            disabled={isSubmitting}
                                            className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
                                        >
                                            {isSubmitting ? "Saving..." : (
                                                <>
                                                    <CheckCircle2 className="size-4 shrink-0" />
                                                    Confirm &amp; Save
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );

    return typeof window === "undefined" ? null : createPortal(content, document.body);
}
