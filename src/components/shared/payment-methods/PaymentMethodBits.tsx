"use client";

/**
 * Pieces every "pay your landlord" screen shares: the bank transfer card
 * (bank, account name, account number and amount with Copy buttons, plus
 * short how-to steps) and the GCash ₱50,000 limit warning. Used by the
 * invoice checkout, the mobile Pay tab and the move-in payment portal.
 */

import { useState } from "react";
import Image from "next/image";
import { AlertTriangle, Check, Copy, Landmark } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatPhpCurrency } from "@/lib/billing/utils";
import {
    GCASH_TRANSFER_LIMIT,
    bankInitials,
    exceedsGcashLimit,
    formatAccountNumber,
    normalizeAccountNumber,
} from "@/lib/billing/payment-methods";
import { useLanguageContext } from "@/context/LanguageContext";

export type BankDestinationView = {
    bankName: string | null;
    accountName: string | null;
    accountNumber: string | null;
    qrImageUrl?: string | null;
};

/** Copies a value and says "Copied!" for two seconds. */
export function CopyValueButton({ value, label, className }: { value: string; label: string; className?: string }) {
    const { t } = useLanguageContext();
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard?.writeText(value);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 2000);
        } catch {
            setCopied(false);
        }
    };

    return (
        <button
            type="button"
            onClick={copy}
            aria-label={label}
            className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all active:scale-95",
                copied
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-border bg-background text-foreground hover:bg-muted",
                className,
            )}
        >
            {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            <span aria-live="polite">{copied ? t("Copied!") : t("Copy")}</span>
        </button>
    );
}

/** Bank account card with everything a tenant types into their bank app. */
export function BankTransferDetails({
    destination,
    amount,
    compact = false,
    className,
}: {
    destination: BankDestinationView;
    amount: number;
    compact?: boolean;
    className?: string;
}) {
    const { t } = useLanguageContext();
    const accountDigits = normalizeAccountNumber(destination.accountNumber);
    const amountText = amount > 0 ? amount.toFixed(2) : "";
    const overInstapay = exceedsGcashLimit(amount);

    return (
        <div className={cn("space-y-4", className)} data-testid="bank-transfer-details">
            <div className="rounded-2xl border border-border bg-background/60 p-4 sm:p-5">
                <div className="flex items-center gap-3">
                    <span
                        aria-hidden
                        className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-emerald-600 px-2 text-xs font-black tracking-wide text-white"
                    >
                        {bankInitials(destination.bankName)}
                    </span>
                    <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">{t("Send to this bank")}</p>
                        <p className="truncate text-base font-black text-foreground">{destination.bankName || t("Bank")}</p>
                    </div>
                </div>

                <dl className="mt-4 space-y-3">
                    <div>
                        <dt className="text-[11px] font-bold text-muted-foreground">{t("Account name")}</dt>
                        <dd className="break-words text-sm font-black text-foreground">{destination.accountName || "—"}</dd>
                    </div>
                    <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
                        <div className="min-w-0">
                            <dt className="text-[11px] font-bold text-muted-foreground">{t("Account number")}</dt>
                            <dd className="whitespace-nowrap font-mono text-lg font-black tracking-wide text-foreground">
                                {formatAccountNumber(accountDigits) || "—"}
                            </dd>
                        </div>
                        {accountDigits && <CopyValueButton value={accountDigits} label={t("Copy account number")} />}
                    </div>
                    {amountText && (
                        <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-2 border-t border-dashed border-border pt-3">
                            <div>
                                <dt className="text-[11px] font-bold text-muted-foreground">{t("Amount to send")}</dt>
                                <dd className="text-lg font-black text-foreground">{formatPhpCurrency(amount)}</dd>
                            </div>
                            <CopyValueButton value={amountText} label={t("Copy amount")} />
                        </div>
                    )}
                </dl>

                {destination.qrImageUrl && !compact && (
                    <div className="mt-4 flex items-center gap-4 rounded-xl border border-border bg-white p-3">
                        <Image
                            src={destination.qrImageUrl}
                            alt={t("Bank QR code")}
                            width={96}
                            height={96}
                            unoptimized
                            className="size-24 shrink-0 rounded-lg object-contain"
                        />
                        <p className="text-xs font-semibold text-zinc-700">
                            {t("You can also scan this QR Ph code with your bank or e-wallet app.")}
                        </p>
                    </div>
                )}
            </div>

            <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <p className="flex items-center gap-2 text-xs font-black text-foreground">
                    <Landmark className="size-4 text-emerald-600" aria-hidden />
                    {t("How to send")}
                </p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-relaxed text-muted-foreground">
                    <li>{t("Open your bank or e-wallet app and choose Send Money / Transfer to another bank.")}</li>
                    <li>{t("Pick InstaPay (instant) or PESONet (same or next banking day).")}</li>
                    <li>{t("Paste the account number and amount, send, then take a screenshot of the receipt.")}</li>
                </ol>
                <p
                    className={cn(
                        "mt-3 rounded-xl px-3 py-2 text-xs font-semibold",
                        overInstapay
                            ? "bg-amber-500/10 text-amber-800 dark:text-amber-300"
                            : "bg-background/60 text-muted-foreground",
                    )}
                >
                    {t("Over ₱50,000? Use PESONet or deposit at the bank branch, then take a photo of the deposit slip.")}
                </p>
            </div>
        </div>
    );
}

/** Warns (never blocks) when a GCash payment is above GCash's ₱50,000 transfer limit. */
export function GcashLimitNotice({
    amount,
    onSwitchToBank,
    className,
}: {
    amount: number;
    onSwitchToBank?: () => void;
    className?: string;
}) {
    const { t } = useLanguageContext();
    if (!exceedsGcashLimit(amount)) return null;

    return (
        <div
            role="status"
            data-testid="gcash-limit-notice"
            className={cn(
                "flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200",
                className,
            )}
        >
            <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
            <div className="space-y-2 text-sm">
                <p className="font-black">
                    {t("GCash transfers are limited to {limit}.", { limit: formatPhpCurrency(GCASH_TRANSFER_LIMIT) })}
                </p>
                <p className="font-medium">
                    {t("You are paying {amount}. If your transfer fails, choose Bank Transfer or pay in parts.", {
                        amount: formatPhpCurrency(amount),
                    })}
                </p>
                {onSwitchToBank && (
                    <button
                        type="button"
                        onClick={onSwitchToBank}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white transition-all hover:bg-amber-700 active:scale-95"
                    >
                        <Landmark className="size-3.5" aria-hidden />
                        {t("Switch to Bank Transfer")}
                    </button>
                )}
            </div>
        </div>
    );
}
