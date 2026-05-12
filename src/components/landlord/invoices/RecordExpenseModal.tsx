"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { m as motion, AnimatePresence } from "framer-motion";
import { X, Receipt, CheckCircle2, DollarSign, Calendar, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProperty } from "@/context/PropertyContext";

interface RecordExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function RecordExpenseModal({ isOpen, onClose, onSaved }: RecordExpenseModalProps & { onSaved?: () => void }) {
    const { selectedPropertyId } = useProperty();
    const [category, setCategory] = useState("maintenance");
    const [amount, setAmount] = useState("");
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await fetch("/api/landlord/expenses", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    category,
                    amount: parseFloat(amount),
                    date_incurred: date,
                    description,
                    propertyId: selectedPropertyId === "all" ? undefined : selectedPropertyId,
                }),
            });
            if (!response.ok) throw new Error("Failed to save expense");
            
            // Reset form
            setAmount("");
            setDescription("");
            if (onSaved) onSaved();
            onClose();
        } catch (error) {
            console.error(error);
            alert("Failed to record expense. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { id: "maintenance", label: "Maintenance", color: "text-orange-500", bg: "bg-orange-500/10" },
        { id: "utilities", label: "Utilities", color: "text-blue-500", bg: "bg-blue-500/10" },
        { id: "taxes", label: "Taxes & Fees", color: "text-purple-500", bg: "bg-purple-500/10" },
        { id: "other", label: "Other", color: "text-zinc-500", bg: "bg-zinc-500/10" },
    ];

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

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Expense Category</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setCategory(cat.id)}
                                    className={cn(
                                        "flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all",
                                        category === cat.id
                                            ? "border-primary/50 bg-primary/10 shadow-sm"
                                            : "border-border bg-background/50 hover:bg-background"
                                    )}
                                >
                                    <div className={cn("flex size-8 items-center justify-center rounded-full", cat.bg, cat.color)}>
                                        <CheckCircle2 className={cn("size-4", category === cat.id ? "opacity-100" : "opacity-0")} />
                                    </div>
                                    <span className={cn("text-xs font-black", category === cat.id ? "text-foreground" : "text-muted-foreground")}>{cat.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2">
                        <div className="space-y-3">
                            <label htmlFor="expense-amount" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Amount (PHP)</label>
                            <div className="relative group">
                                <DollarSign className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    id="expense-amount"
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    className="w-full rounded-2xl border border-border bg-background py-4 pl-12 pr-4 text-sm font-black text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-4 focus:ring-primary/10"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="expense-date" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Date Incurred</label>
                            <div className="relative group">
                                <Calendar className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <input
                                    id="expense-date"
                                    type="date"
                                    required
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    className="w-full rounded-2xl border border-border bg-background py-4 pl-12 pr-4 text-sm font-black text-foreground outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label htmlFor="expense-description" className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Description</label>
                        <div className="relative group">
                            <Type className="absolute left-4 top-4 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <textarea
                                id="expense-description"
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                                className="w-full resize-none rounded-2xl border border-border bg-background py-4 pl-12 pr-4 text-sm font-medium text-foreground outline-none transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-4 focus:ring-primary/10"
                                placeholder="What was this expense for? (e.g. Fixed leaky faucet in Unit 402)"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading || !amount || !description}
                            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                        >
                            {loading ? (
                                "Saving..."
                            ) : (
                                <>
                                    <CheckCircle2 className="size-5 transition-transform group-hover:scale-110" />
                                    Record Expense
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );

    return typeof window === "undefined" ? null : createPortal(content, document.body);
}
