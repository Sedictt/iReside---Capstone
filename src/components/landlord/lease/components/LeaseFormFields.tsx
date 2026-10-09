import { Calendar, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldError, fieldErrorClass } from "@/components/ui/field-error";
import type { FormValidation } from "@/hooks/useFormValidation";
import { MAX_MONEY_AMOUNT } from "@/lib/validation/rules";

/** Values validated inline by the contract preview (see ContractPreviewModal). */
export type LeaseFormValues = {
    leaseStart: string;
    leaseEnd: string;
    monthlyRent: number;
    advanceAmount: number;
    securityDeposit: number;
};

interface LeaseFormFieldsProps {
    leaseStart: string;
    leaseEnd: string;
    monthlyRent: number;
    advanceAmount: number;
    securityDeposit: number;
    isFinalApproval: boolean;
    onLeaseStartChange: (value: string) => void;
    onMonthlyRentChange: (value: number) => void;
    onAdvanceAmountChange: (value: number) => void;
    onSecurityDepositChange: (value: number) => void;
    /** Optional inline validation wiring (errors shown after blur / submit attempt). */
    form?: FormValidation<LeaseFormValues>;
}

const inputClass =
    "w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary/50 focus:outline-none transition-colors";

export function LeaseFormFields({
    leaseStart,
    leaseEnd,
    monthlyRent,
    advanceAmount,
    securityDeposit,
    isFinalApproval,
    onLeaseStartChange,
    onMonthlyRentChange,
    onAdvanceAmountChange,
    onSecurityDepositChange,
    form,
}: LeaseFormFieldsProps) {
    const fieldProps = (name: keyof LeaseFormValues) => (form ? form.fieldProps(name) : {});
    const errorFor = (name: keyof LeaseFormValues) => form?.errorFor(name);
    const errorNode = (name: keyof LeaseFormValues) =>
        form ? <FieldError id={form.errorId(name)} message={form.errorFor(name)} /> : null;
    // An empty number input means "no value" (0 here) — inline validation flags it instead of silently accepting.
    const toAmount = (raw: string) => (raw.trim() === "" ? 0 : Number(raw));

    return (
        <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label
                        htmlFor="lease-start"
                        className="text-xs font-black uppercase tracking-wide text-neutral-300 flex items-center gap-2"
                    >
                        <Calendar className="size-3.5" />
                        Lease Start Date
                    </label>
                    <input min="1990-01-01" max="2100-12-31"
                        {...fieldProps("leaseStart")}
                        id="lease-start"
                        type="date"
                        value={leaseStart}
                        onChange={(event) => onLeaseStartChange(event.target.value)}
                        className={cn(inputClass, errorFor("leaseStart") && fieldErrorClass)}
                    />
                    {errorNode("leaseStart")}
                </div>
                <div className="space-y-2">
                    <label
                        htmlFor="lease-end"
                        className="text-xs font-black uppercase tracking-wide text-neutral-300 flex items-center gap-2"
                    >
                        <Calendar className="size-3.5" />
                        Lease End Date
                    </label>
                    <input min="1990-01-01" max="2100-12-31"
                        {...fieldProps("leaseEnd")}
                        id="lease-end"
                        type="date"
                        value={leaseEnd}
                        disabled
                        className={cn("w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-neutral-400 text-sm", errorFor("leaseEnd") && fieldErrorClass)}
                    />
                    {errorNode("leaseEnd")}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                    <label
                        htmlFor="monthly-rent"
                        className="text-xs font-black uppercase tracking-wide text-neutral-300 flex items-center gap-2"
                    >
                        <Banknote className="size-3.5" />
                        Monthly Rent
                    </label>
                    <input max={MAX_MONEY_AMOUNT}
                        {...fieldProps("monthlyRent")}
                        id="monthly-rent"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        value={monthlyRent}
                        onChange={(event) => onMonthlyRentChange(toAmount(event.target.value))}
                        className={cn(inputClass, errorFor("monthlyRent") && fieldErrorClass)}
                    />
                    {errorNode("monthlyRent")}
                </div>
                <div className="space-y-2">
                    <label
                        htmlFor="advance-invoice"
                        className="text-xs font-black uppercase tracking-wide text-neutral-300 flex items-center gap-2"
                    >
                        <Banknote className="size-3.5" />
                        Advance Rent
                    </label>
                    <input max={MAX_MONEY_AMOUNT}
                        {...fieldProps("advanceAmount")}
                        id="advance-invoice"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        value={advanceAmount}
                        onChange={(event) => onAdvanceAmountChange(toAmount(event.target.value))}
                        className={cn(inputClass, errorFor("advanceAmount") && fieldErrorClass)}
                    />
                    {errorNode("advanceAmount")}
                </div>
                <div className="space-y-2">
                    <label
                        htmlFor="security-deposit"
                        className="text-xs font-black uppercase tracking-wide text-neutral-300 flex items-center gap-2"
                    >
                        <Banknote className="size-3.5" />
                        Security Deposit
                    </label>
                    <input max={MAX_MONEY_AMOUNT}
                        {...fieldProps("securityDeposit")}
                        id="security-deposit"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step="0.01"
                        value={securityDeposit}
                        onChange={(event) => onSecurityDepositChange(toAmount(event.target.value))}
                        className={cn(inputClass, errorFor("securityDeposit") && fieldErrorClass)}
                    />
                    {errorNode("securityDeposit")}
                </div>
            </div>
        </>
    );
}
