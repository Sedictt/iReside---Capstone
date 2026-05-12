"use client";

import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types/database";
import { DollarSign, Hash, Calendar, Wallet, CheckCircle2, Clock } from "lucide-react";

interface PaymentRecordFormProps {
  label: string;
  amount: number;
  onAmountChange?: (amount: number) => void;
  allowAmountEdit?: boolean;
  paymentMethod: PaymentMethod | null;
  onMethodChange: (method: PaymentMethod) => void;
  referenceNumber: string;
  onReferenceChange: (ref: string) => void;
  paidAt: string | null;
  onPaidAtChange: (date: string) => void;
  status: "pending" | "completed";
  onStatusChange: (status: "pending" | "completed") => void;
}

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "gcash", label: "GCash" },
  { value: "maya", label: "Maya" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "debit_card", label: "Debit Card" },
];

export function PaymentRecordForm({
  label,
  amount,
  onAmountChange,
  allowAmountEdit = false,
  paymentMethod,
  onMethodChange,
  referenceNumber,
  onReferenceChange,
  paidAt,
  onPaidAtChange,
  status,
  onStatusChange,
}: PaymentRecordFormProps) {
  return (
    <div className="group relative flex flex-col gap-6 rounded-[2rem] border border-border bg-card/30 p-6 transition-all duration-500 hover:bg-card/50 hover:border-primary/30 shadow-sm">
      {/* Compact Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="space-y-0.5">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-primary/80">Ledger Entry</p>
          <h3 className="text-lg font-black tracking-tight text-foreground">
              {label}
          </h3>
        </div>
        <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all",
            status === "completed" 
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                : "bg-amber-500/10 border-amber-500/20 text-amber-500"
        )}>
            {status === "completed" ? <CheckCircle2 size={12} strokeWidth={3} /> : <Clock size={12} strokeWidth={3} />}
            {status}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
        {/* Amount */}
        <div className="space-y-2">
          <label htmlFor="amount-due" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Amount Due
          </label>
          <div className="relative isolate group/input">
            <div className="absolute inset-0 -z-10 rounded-xl border border-border bg-background/40 transition-all duration-300 group-focus-within/input:bg-background group-focus-within/input:border-primary/50" />
            <div className="absolute inset-y-0 left-4 flex items-center text-muted-foreground/60 transition-colors group-focus-within/input:text-primary">
              <DollarSign size={16} strokeWidth={2} />
            </div>
            <input
              id="amount-due"
              type="number"
              value={amount}
              onChange={(e) => onAmountChange?.(parseFloat(e.target.value) || 0)}
              disabled={!allowAmountEdit}
              placeholder="0.00"
              className={cn(
                "h-12 w-full bg-transparent pl-11 pr-4 text-sm font-black tracking-tight text-foreground outline-none transition-all",
                !allowAmountEdit && "cursor-not-allowed opacity-60"
              )}
            />
          </div>
        </div>

        {/* Method */}
        <div className="space-y-2">
          <label htmlFor="payment-method" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Method
          </label>
          <div className="relative isolate group/input">
            <div className="absolute inset-0 -z-10 rounded-xl border border-border bg-background/40 transition-all duration-300 group-focus-within/input:bg-background group-focus-within/input:border-primary/50" />
            <div className="absolute inset-y-0 left-4 flex items-center text-muted-foreground/60 pointer-events-none">
              <Wallet size={16} strokeWidth={2} />
            </div>
            <select
              id="payment-method"
              value={paymentMethod || ""}
              onChange={(e) => onMethodChange(e.target.value as PaymentMethod)}
              className="h-12 w-full appearance-none bg-transparent pl-11 pr-10 text-sm font-black tracking-tight text-foreground outline-none cursor-pointer"
            >
              <option value="" disabled>Choose Method</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value} className="bg-neutral-900 text-foreground">{m.label}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-muted-foreground/40">
                <Clock size={12} className="rotate-90" />
            </div>
          </div>
        </div>

        {/* Reference */}
        <div className="space-y-2">
          <label htmlFor="ref-number" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Ref Number
          </label>
          <div className="relative isolate group/input">
            <div className="absolute inset-0 -z-10 rounded-xl border border-border bg-background/40 transition-all duration-300 group-focus-within/input:bg-background group-focus-within/input:border-primary/50" />
            <div className="absolute inset-y-0 left-4 flex items-center text-muted-foreground/60 transition-colors group-focus-within/input:text-primary">
              <Hash size={16} strokeWidth={2} />
            </div>
            <input
              id="ref-number"
              type="text"
              value={referenceNumber}
              onChange={(e) => onReferenceChange(e.target.value)}
              placeholder="e.g. TRN-123"
              className="h-12 w-full bg-transparent pl-11 pr-4 text-sm font-black tracking-tight text-foreground outline-none"
            />
          </div>
        </div>

        {/* Date */}
        <div className="space-y-2">
          <label htmlFor="payment-date" className="ml-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
            Payment Date
          </label>
          <div className="relative isolate group/input">
            <div className="absolute inset-0 -z-10 rounded-xl border border-border bg-background/40 transition-all duration-300 group-focus-within/input:bg-background group-focus-within/input:border-primary/50" />
            <div className="absolute inset-y-0 left-4 flex items-center text-muted-foreground/60 pointer-events-none">
              <Calendar size={16} strokeWidth={2} />
            </div>
            <input
              id="payment-date"
              type="date"
              value={paidAt || ""}
              onChange={(e) => onPaidAtChange(e.target.value)}
              className="h-12 w-full bg-transparent pl-11 pr-4 text-sm font-black tracking-tight text-foreground outline-none [color-scheme:dark]"
            />
          </div>
        </div>
      </div>

      {/* Compact Buttons */}
      <div className="flex gap-4 pt-2">
        <button
          type="button"
          onClick={() => onStatusChange("completed")}
          className={cn(
            "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border",
            status === "completed"
              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/10"
              : "bg-background/30 text-muted-foreground border-border hover:bg-muted"
          )}
        >
          <CheckCircle2 size={14} strokeWidth={3} />
          Received
        </button>
        <button
          type="button"
          onClick={() => onStatusChange("pending")}
          className={cn(
            "flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 border",
            status === "pending"
              ? "bg-amber-500 text-black border-amber-600 shadow-lg shadow-amber-500/10"
              : "bg-background/30 text-muted-foreground border-border hover:bg-muted"
          )}
        >
          <Clock size={14} strokeWidth={3} />
          Pending
        </button>
      </div>
    </div>
  );
}


