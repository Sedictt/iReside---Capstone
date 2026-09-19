"use client";

import React, { useState } from "react";
import { KeyRound, ShieldAlert, Copy, Check, Download, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SecurityKeyDisplayCardProps {
    securityKey: string;
    isAcknowledged: boolean;
    onToggleAcknowledge: (acknowledged: boolean) => void;
    title?: string;
    description?: string;
    accountEmail?: string;
    className?: string;
}

export function SecurityKeyDisplayCard({
    securityKey,
    isAcknowledged,
    onToggleAcknowledge,
    title = "Your Security Recovery Key",
    description = "Save this single-use recovery key in a safe place. If you ever lose access to your email, this key is your final recourse to restore your account.",
    accountEmail,
    className,
}: SecurityKeyDisplayCardProps) {
    const [copied, setCopied] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(securityKey);
            setCopied(true);
            toast.success("Security key copied to clipboard");
            setTimeout(() => setCopied(false), 2500);
        } catch {
            toast.error("Failed to copy key to clipboard");
        }
    };

    const handleDownload = () => {
        try {
            const timestamp = new Date().toLocaleString("en-US", {
                dateStyle: "full",
                timeStyle: "medium",
            });

            const fileContent = `=======================================================
iReside Account Security Recovery Key
=======================================================
Generated On : ${timestamp}
${accountEmail ? `Account Email: ${accountEmail}\n` : ""}
SECURITY RECOVERY KEY:
${securityKey}

IMPORTANT INSTRUCTIONS:
- This key is your ultimate failsafe to recover your account if you lose access to your email.
- This key is encrypted by the system and will NOT be shown again.
- Each key is single-use. Once used to recover your account, a new key will be generated.
- Store this file in a safe location (e.g. encrypted storage, password manager, or printed offline).
- Never share this key with anyone. iReside staff will never ask for your key.
=======================================================`;

            const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `ireside-security-key-${new Date().toISOString().split("T")[0]}.txt`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);

            toast.success("Security key file downloaded");
        } catch {
            toast.error("Failed to download security key file");
        }
    };

    return (
        <div className={cn("space-y-4 rounded-2xl border border-border/70 bg-surface-1 p-5 sm:p-6 shadow-sm", className)}>
            {/* Header */}
            <div className="flex items-start gap-3.5">
                <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <KeyRound className="size-5" />
                </div>
                <div className="space-y-1">
                    <h3 className="text-base font-bold text-foreground leading-tight">{title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                </div>
            </div>

            {/* Key Container */}
            <div className="rounded-xl border border-border/80 bg-surface-2 p-3.5 sm:p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                        Single-Use Security Key
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsVisible((prev) => !prev)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        title={isVisible ? "Hide key" : "Show key"}
                    >
                        {isVisible ? (
                            <>
                                <EyeOff className="size-3.5" />
                                <span>Hide</span>
                            </>
                        ) : (
                            <>
                                <Eye className="size-3.5" />
                                <span>Show</span>
                            </>
                        )}
                    </button>
                </div>

                <div className="flex items-center justify-center py-2 px-3 rounded-lg bg-background border border-border font-mono text-base sm:text-lg font-black tracking-widest text-foreground select-all text-center">
                    {isVisible ? securityKey : "••••-••••-••••-••••"}
                </div>

                {/* Actions */}
                <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-border/70 hover:border-primary/50 bg-surface-1 hover:bg-surface-3 text-xs font-bold text-foreground transition-all active:scale-98"
                    >
                        {copied ? (
                            <>
                                <Check className="size-3.5 text-emerald-500" />
                                <span className="text-emerald-500">Copied to Clipboard</span>
                            </>
                        ) : (
                            <>
                                <Copy className="size-3.5 text-muted-foreground" />
                                <span>Copy Key</span>
                            </>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={handleDownload}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-border/70 hover:border-primary/50 bg-surface-1 hover:bg-surface-3 text-xs font-bold text-foreground transition-all active:scale-98"
                    >
                        <Download className="size-3.5 text-muted-foreground" />
                        <span>Download (.txt)</span>
                    </button>
                </div>
            </div>

            {/* Warning Alert */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
                <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                <p>
                    <span className="font-bold">Important:</span> This key will be encrypted and will not be displayed again.
                    Ensure you have copied or downloaded it before proceeding.
                </p>
            </div>

            {/* Mandatory Acknowledgement Checkbox */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-border/60 bg-surface-2/60 hover:bg-surface-2 cursor-pointer transition-colors select-none">
                <input
                    type="checkbox"
                    checked={isAcknowledged}
                    onChange={(e) => onToggleAcknowledge(e.target.checked)}
                    className="size-4 mt-0.5 rounded border-border text-primary focus:ring-primary/20 cursor-pointer shrink-0"
                />
                <span className="text-xs font-medium text-foreground leading-snug">
                    I have safely saved my security key in a secure location. I understand that it is single-use and will never be shown again.
                </span>
            </label>
        </div>
    );
}
