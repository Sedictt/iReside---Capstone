import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";
import { FieldError, fieldErrorClass } from "@/components/ui/field-error";
import type { FormValidation } from "@/hooks/useFormValidation";
import { MAX_MONEY_AMOUNT } from "@/lib/validation/rules";
import type { LeaseTermType } from "@/lib/lease-term";
import { LeaseDurationPresets, LeaseTermReveal, LeaseTermTypeField } from "../LeaseTermTypeField";

/** Values validated inline by the contract preview (see ContractPreviewModal). */
export type LeaseFormValues = {
    leaseStart: string;
    termType: LeaseTermType;
    leaseEnd: string;
    monthlyRent: number;
    advanceAmount: number;
    securityDeposit: number;
};

interface LeaseFormFieldsProps {
    leaseStart: string;
    termType: LeaseTermType;
    leaseEnd: string;
    monthlyRent: number;
    advanceAmount: number;
    securityDeposit: number;
    portalMaxUses: number;
    isCustomPortalUses: boolean;
    customPortalUsesInput: string;
    isFinalApproval: boolean;
    onLeaseStartChange: (value: string) => void;
    onTermTypeChange: (value: LeaseTermType) => void;
    onLeaseEndChange: (value: string) => void;
    onMonthlyRentChange: (value: number) => void;
    onAdvanceAmountChange: (value: number) => void;
    onSecurityDepositChange: (value: number) => void;
    onPortalMaxUsesPreset: (uses: number) => void;
    onPortalCustomUsesToggle: () => void;
    onCustomPortalUsesInputChange: (raw: string) => void;
    /** Optional inline validation wiring (errors shown after blur / submit attempt). */
    form?: FormValidation<LeaseFormValues>;
}

const inputClass =
    "h-12 w-full rounded-xl border border-border bg-background px-3.5 text-base font-semibold text-foreground outline-none transition-colors hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/30";

const PORTAL_USE_PRESETS = [
    { value: 1, label: "1 time" },
    { value: 3, label: "3 times" },
    { value: 5, label: "5 times" },
];

export function LeaseFormFields({
    leaseStart,
    termType,
    leaseEnd,
    monthlyRent,
    advanceAmount,
    securityDeposit,
    portalMaxUses,
    isCustomPortalUses,
    customPortalUsesInput,
    isFinalApproval,
    onLeaseStartChange,
    onTermTypeChange,
    onLeaseEndChange,
    onMonthlyRentChange,
    onAdvanceAmountChange,
    onSecurityDepositChange,
    onPortalMaxUsesPreset,
    onPortalCustomUsesToggle,
    onCustomPortalUsesInputChange,
    form,
}: LeaseFormFieldsProps) {
    const { t } = useLanguageContext();
    const fieldProps = (name: keyof LeaseFormValues) => (form ? form.fieldProps(name) : {});
    const errorFor = (name: keyof LeaseFormValues) => form?.errorFor(name);
    const errorNode = (name: keyof LeaseFormValues) =>
        form ? <FieldError id={form.errorId(name)} message={form.errorFor(name)} /> : null;
    const toAmount = (raw: string) => (raw.trim() === "" ? 0 : Number(raw));

    const totalDueNow = Math.max(0, Number(advanceAmount || 0)) + Math.max(0, Number(securityDeposit || 0));

    return (
        <div className="space-y-5">
            {/* Move-in Date */}
            <div className="space-y-1.5">
                <label htmlFor="lease-start" className="block text-sm font-semibold text-foreground">
                    {t("Move-in Date")}
                </label>
                <div className="relative max-w-xs">
                    <Calendar className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                        min="1990-01-01"
                        max="2100-12-31"
                        {...fieldProps("leaseStart")}
                        id="lease-start"
                        type="date"
                        value={leaseStart}
                        onChange={(event) => onLeaseStartChange(event.target.value)}
                        className={cn(inputClass, "pl-10", errorFor("leaseStart") && fieldErrorClass)}
                    />
                </div>
                {errorNode("leaseStart")}
            </div>

            {/* Lease Term (Full Width so options never truncate) */}
            <LeaseTermTypeField
                id="contract-term-type"
                value={termType}
                onChange={onTermTypeChange}
                disabled={isFinalApproval}
                appearance="theme"
                label={t("Lease Term")}
            />

            <LeaseTermReveal show={termType === "fixed"}>
                <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-muted/30 p-4 sm:grid-cols-2 sm:items-end">
                    <div className="space-y-1.5">
                        <label htmlFor="lease-end" className="block text-sm font-semibold text-foreground">
                            {t("Lease End Date")}
                        </label>
                        <div className="relative">
                            <Calendar className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                min={leaseStart || "1990-01-01"}
                                max="2100-12-31"
                                {...fieldProps("leaseEnd")}
                                id="lease-end"
                                type="date"
                                value={leaseEnd}
                                disabled={isFinalApproval}
                                onChange={(event) => onLeaseEndChange(event.target.value)}
                                className={cn(
                                    inputClass,
                                    "pl-10",
                                    isFinalApproval && "opacity-60",
                                    errorFor("leaseEnd") && fieldErrorClass
                                )}
                            />
                        </div>
                        {errorNode("leaseEnd")}
                    </div>
                    <LeaseDurationPresets
                        startDate={leaseStart}
                        endDate={leaseEnd}
                        onSelect={onLeaseEndChange}
                        disabled={isFinalApproval}
                        appearance="theme"
                        className="pb-1"
                    />
                </div>
            </LeaseTermReveal>

            {/* Payment Amounts */}
            <div className="space-y-3">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="space-y-1.5">
                        <label htmlFor="monthly-rent" className="block text-sm font-semibold text-foreground">
                            {t("Monthly Rent")}
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                PHP
                            </span>
                            <input
                                max={MAX_MONEY_AMOUNT}
                                {...fieldProps("monthlyRent")}
                                id="monthly-rent"
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step="0.01"
                                value={monthlyRent}
                                onChange={(event) => onMonthlyRentChange(toAmount(event.target.value))}
                                className={cn(
                                    inputClass,
                                    "pl-12 pr-3 text-right tabular-nums",
                                    errorFor("monthlyRent") && fieldErrorClass
                                )}
                            />
                        </div>
                        {errorNode("monthlyRent")}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="advance-invoice" className="block text-sm font-semibold text-foreground">
                            {t("Advance Rent")}
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                PHP
                            </span>
                            <input
                                max={MAX_MONEY_AMOUNT}
                                {...fieldProps("advanceAmount")}
                                id="advance-invoice"
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step="0.01"
                                value={advanceAmount}
                                onChange={(event) => onAdvanceAmountChange(toAmount(event.target.value))}
                                className={cn(
                                    inputClass,
                                    "pl-12 pr-3 text-right tabular-nums",
                                    errorFor("advanceAmount") && fieldErrorClass
                                )}
                            />
                        </div>
                        {errorNode("advanceAmount")}
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="security-deposit" className="block text-sm font-semibold text-foreground">
                            {t("Security Deposit")}
                        </label>
                        <div className="relative">
                            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                PHP
                            </span>
                            <input
                                max={MAX_MONEY_AMOUNT}
                                {...fieldProps("securityDeposit")}
                                id="security-deposit"
                                type="number"
                                inputMode="decimal"
                                min={0}
                                step="0.01"
                                value={securityDeposit}
                                onChange={(event) => onSecurityDepositChange(toAmount(event.target.value))}
                                className={cn(
                                    inputClass,
                                    "pl-12 pr-3 text-right tabular-nums",
                                    errorFor("securityDeposit") && fieldErrorClass
                                )}
                            />
                        </div>
                        {errorNode("securityDeposit")}
                    </div>
                </div>

                {/* Total Move-in Summary */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
                    <span className="font-semibold text-muted-foreground">
                        {t("Total Move-in Payment (Advance + Deposit)")}
                    </span>
                    <span className="text-base font-bold tabular-nums text-foreground">
                        PHP {totalDueNow.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                </div>
            </div>

            {/* Payment Link Use Limit */}
            {!isFinalApproval && (
                <div className="space-y-2">
                    <span className="block text-sm font-semibold text-foreground">
                        {t("How many times can they use this payment link?")}
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                        {PORTAL_USE_PRESETS.map((preset) => {
                            const active = !isCustomPortalUses && portalMaxUses === preset.value;
                            return (
                                <button
                                    key={preset.value}
                                    type="button"
                                    onClick={() => onPortalMaxUsesPreset(preset.value)}
                                    className={cn(
                                        "min-h-[40px] rounded-xl border px-3.5 text-sm font-semibold transition-colors",
                                        active
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-background text-foreground hover:bg-muted"
                                    )}
                                >
                                    {t(preset.label)}
                                </button>
                            );
                        })}
                        <button
                            type="button"
                            onClick={onPortalCustomUsesToggle}
                            className={cn(
                                "min-h-[40px] rounded-xl border px-3.5 text-sm font-semibold transition-colors",
                                isCustomPortalUses
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border bg-background text-foreground hover:bg-muted"
                            )}
                        >
                            {t("Custom")}
                        </button>
                    </div>
                    {isCustomPortalUses && (
                        <div className="flex items-center gap-3 pt-1">
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={2}
                                aria-label={t("Custom payment link uses")}
                                value={customPortalUsesInput}
                                onChange={(e) => onCustomPortalUsesInputChange(e.target.value.replace(/[^0-9]/g, ""))}
                                placeholder="1 - 50"
                                className="h-11 w-28 rounded-xl border border-border bg-background px-3 text-base font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                            />
                            <span className="text-sm text-muted-foreground">{t("times (maximum 50)")}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
