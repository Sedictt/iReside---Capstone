"use client";

import { cn } from "@/lib/utils";
import type { PaymentMethod } from "@/types/database";

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
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0 && onAmountChange) {
      onAmountChange(value);
    }
  };

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onMethodChange(e.target.value as PaymentMethod);
  };

  const handleReferenceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onReferenceChange(e.target.value);
  };

  const handlePaidAtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onPaidAtChange(e.target.value);
  };

  const handleStatusChange = (newStatus: "pending" | "completed") => {
    onStatusChange(newStatus);
  };

  return (
    <div className="space-y-4 p-6 rounded-2xl border border-white/[0.12] bg-white/[0.05]">
      <h3 className="text-lg font-bold text-white">{label}</h3>

      {/* Amount */}
      <div className="space-y-2">
        <label htmlFor="payment-amount" className="block text-sm font-medium text-neutral-300">
          Amount
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400 font-medium">
            ₱
          </span>
          <input
            id="payment-amount"
            type="number"
            value={amount}
            onChange={handleAmountChange}
            disabled={!allowAmountEdit}
            min="0"
            step="0.01"
            className={cn(
              "w-full h-12 pl-8 pr-4 rounded-xl font-medium transition-all duration-300",
              "bg-white/5 border border-white/10 text-white",
              allowAmountEdit
                ? "hover:bg-white/10 focus:bg-white/10 focus:border-primary/50 focus:outline-none"
                : "cursor-not-allowed opacity-60"
            )}
          />
        </div>
      </div>

      {/* Payment Method */}
      <div className="space-y-2">
        <label htmlFor="payment-method" className="block text-sm font-medium text-neutral-300">
          Payment Method <span className="text-red-400">*</span>
        </label>
        <select
          id="payment-method"
          value={paymentMethod || ""}
          onChange={handleMethodChange}
          required
          className={cn(
            "w-full h-12 px-4 rounded-xl font-medium transition-all duration-300",
            "bg-white/5 border border-white/10 text-white",
            "hover:bg-white/10 focus:bg-white/10 focus:border-primary/50 focus:outline-none",
            "appearance-none cursor-pointer"
          )}
        >
          <option value="" disabled className="bg-neutral-900">
            Select payment method
          </option>
          {PAYMENT_METHODS.map((method) => (
            <option
              key={method.value}
              value={method.value}
              className="bg-neutral-900"
            >
              {method.label}
            </option>
          ))}
        </select>
      </div>

      {/* Reference Number */}
      <div className="space-y-2">
        <label htmlFor="reference-number" className="block text-sm font-medium text-neutral-300">
          Reference Number
        </label>
        <input
          id="reference-number"
          type="text"
          value={referenceNumber}
          onChange={handleReferenceChange}
          placeholder="Enter reference number"
          className={cn(
            "w-full h-12 px-4 rounded-xl font-medium transition-all duration-300",
            "bg-white/5 border border-white/10 text-white placeholder:text-neutral-500",
            "hover:bg-white/10 focus:bg-white/10 focus:border-primary/50 focus:outline-none"
          )}
        />
      </div>

      {/* Paid Date */}
      <div className="space-y-2">
        <label htmlFor="paid-date" className="block text-sm font-medium text-neutral-300">
          Paid Date
        </label>
        <input
          id="paid-date"
          type="date"
          value={paidAt || ""}
          onChange={handlePaidAtChange}
          className={cn(
            "w-full h-12 px-4 rounded-xl font-medium transition-all duration-300",
            "bg-white/5 border border-white/10 text-white",
            "hover:bg-white/10 focus:bg-white/10 focus:border-primary/50 focus:outline-none",
            "[color-scheme:dark]"
          )}
        />
      </div>

      {/* Status Toggle */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-neutral-300">
          Payment Status
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleStatusChange("completed")}
            className={cn(
              "flex-1 h-12 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300",
              "flex items-center justify-center gap-2",
              status === "completed"
                ? "bg-primary text-black border border-primary/30"
                : "bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-white"
            )}
          >
            Completed
          </button>
          <button
            type="button"
            onClick={() => handleStatusChange("pending")}
            className={cn(
              "flex-1 h-12 rounded-xl font-bold text-sm uppercase tracking-wider transition-all duration-300",
              "flex items-center justify-center gap-2",
              status === "pending"
                ? "bg-amber-500 text-black border border-amber-500/30"
                : "bg-white/5 text-neutral-400 border border-white/10 hover:bg-white/10 hover:text-white"
            )}
          >
            Pending
          </button>
        </div>
      </div>
    </div>
  );
}
