"use client";

import React, { useState } from "react";
import { KeyRound, Copy, Check, Download, Eye, EyeOff, HelpCircle, ShieldCheck, Laptop, FileText, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface SecurityKeyDisplayCardProps {
    securityKey: string;
    isAcknowledged: boolean;
    onToggleAcknowledge: (acknowledged: boolean) => void;
    onDownload?: () => void;
    onCopy?: () => void;
    title?: string;
    description?: string;
    accountEmail?: string;
    className?: string;
}

export function downloadSecurityKeyFile(securityKey: string, accountEmail?: string) {
    try {
        const timestamp = new Date().toLocaleString("en-US", {
            dateStyle: "full",
            timeStyle: "medium",
        });

        const fileContent = `=======================================================
iReside Landlord Portal - Emergency Spare Key
=======================================================
Date Saved   : ${timestamp}
${accountEmail ? `Account Email: ${accountEmail}\n` : ""}
YOUR EMERGENCY SPARE KEY:
${securityKey}

WHAT IS THIS FOR?
Think of this like an extra spare key to your house.
If you ever forget your password or lose access to your
email, give this code to support or use it on the login screen
to unlock your property portal.

HELPFUL TIPS:
- Keep this file saved on your computer or phone.
- You can also write this code down with a pen in your notebook.
- Do NOT share this code with strangers.
=======================================================`;

        if (typeof window !== "undefined" && typeof window.URL?.createObjectURL === "function") {
            const blob = new Blob([fileContent], { type: "text/plain;charset=utf-8" });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = `ireside-emergency-spare-key-${new Date().toISOString().split("T")[0]}.txt`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            window.URL.revokeObjectURL(url);
        }
        return true;
    } catch (err) {
        console.error("Failed to download key file:", err);
        return false;
    }
}

export function SecurityKeyDisplayCard({
    securityKey,
    isAcknowledged,
    onToggleAcknowledge,
    onDownload,
    onCopy,
    title = "Emergency Spare Key (Landlord Security Recovery Key)",
    description = "Think of this like an extra spare key to your house. If you ever forget your password or lose access to your email, you can use this code to unlock your property portal.",
    accountEmail,
    className,
}: SecurityKeyDisplayCardProps) {
    const [copied, setCopied] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const [showHint, setShowHint] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(securityKey);
            setCopied(true);
            onCopy?.();
            toast.success("Copied to Clipboard", {
                description: "Emergency code copied to your clipboard.",
            });
            setTimeout(() => setCopied(false), 2500);
        } catch {
            toast.error("Failed to copy code to clipboard");
        }
    };

    const handleDownload = () => {
        const success = downloadSecurityKeyFile(securityKey, accountEmail);
        if (success) {
            setDownloaded(true);
            onDownload?.();
            onToggleAcknowledge(true);
            toast.success("File Downloaded", {
                description: "Your emergency key has been saved to your downloads.",
            });
        } else {
            toast.error("Failed to download key file");
        }
    };

    return (
        <div className={cn("space-y-3.5", className)}>
            {/* Warm Notice Banner (from Design Mockup) */}
            <div className="space-y-2">
                <div className="flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-foreground">
                    <div className="size-11 sm:size-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 shadow-xs">
                        <KeyRound className="size-5 sm:size-6" />
                    </div>
                    <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h3 className="text-sm sm:text-base font-bold text-foreground tracking-tight">
                                Save Your Emergency Spare Key
                            </h3>
                            <span className="sr-only">Landlord Security Recovery Key</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-snug">
                            Just like a spare key to your house — keep this safe so you never get locked out.
                        </p>
                    </div>
                </div>

                {/* Hint Trigger: Opens Pop Up Dialog */}
                <div className="px-1">
                    <button
                        type="button"
                        onClick={() => setShowHint(true)}
                        className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer group"
                    >
                        <HelpCircle className="size-3.5 text-amber-500 group-hover:text-amber-600 transition-colors" />
                        <span className="underline-offset-2 group-hover:underline">Why do I need this? (Tap for hint)</span>
                    </button>
                </div>
            </div>

            {/* Hint Details Pop Up Modal */}
            {showHint && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
                    onClick={() => setShowHint(false)}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="hint-popup-title"
                >
                    <div
                        className="w-full max-w-[420px] bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 my-auto text-foreground animate-in zoom-in-95 duration-150"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-border/60">
                            <div className="flex items-center gap-2">
                                <div className="size-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                    <HelpCircle className="size-4" />
                                </div>
                                <h4 id="hint-popup-title" className="text-sm font-bold text-foreground">
                                    Why You Need This Key
                                </h4>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowHint(false)}
                                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors cursor-pointer"
                                aria-label="Close hint"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                <ShieldCheck className="size-4 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-foreground">Emergency Account Recovery</p>
                                    <p className="text-muted-foreground leading-relaxed mt-0.5">
                                        If you ever forget your password or lose access to your email, this code lets you quickly unlock your landlord portal without getting stuck.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                <FileText className="size-4 text-violet-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-foreground">Where to Keep It</p>
                                    <p className="text-muted-foreground leading-relaxed mt-0.5">
                                        Write it down with pen and paper in your notebook, or keep the downloaded <code className="text-primary font-mono text-[11px]">.txt</code> file in your documents.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/40 border border-border/40">
                                <Laptop className="size-4 text-amber-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-foreground">Important Safety Tip</p>
                                    <p className="text-muted-foreground leading-relaxed mt-0.5">
                                        Treat this like the master key to your building. Never share it with tenants or strangers.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowHint(false)}
                            className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-xs"
                        >
                            Got It, Thanks!
                        </button>
                    </div>
                </div>
            )}

            {/* Key Box: Clean Violet Container with High-Contrast Code */}
            <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 dark:bg-violet-500/10 p-3.5 sm:p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <span className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400">
                        <KeyRound className="size-4" />
                        <span className="text-[11px] font-bold">YOUR EMERGENCY KEY CODE</span>
                    </span>
                    <button
                        type="button"
                        onClick={() => setIsVisible((prev) => !prev)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title={isVisible ? "Hide code" : "Show code"}
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

                <div className="flex items-center justify-center py-3 px-4 rounded-xl bg-background/90 border border-border/80 font-mono text-base sm:text-lg font-black tracking-widest text-foreground select-all text-center shadow-xs">
                    {isVisible ? securityKey : "••••-••••-••••-••••"}
                </div>

                {/* Action Buttons: Copy Key & Download (.txt) */}
                <div className="grid grid-cols-2 gap-2.5">
                    <button
                        type="button"
                        onClick={handleCopy}
                        className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border border-border/80 hover:border-primary/50 bg-background hover:bg-muted/60 text-xs font-bold text-foreground transition-all active:scale-98 cursor-pointer shadow-2xs"
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
                        className={cn(
                            "flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border text-xs font-bold transition-all active:scale-98 cursor-pointer shadow-2xs",
                            downloaded
                                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "border-border/80 hover:border-primary/50 bg-background hover:bg-muted/60 text-foreground"
                        )}
                    >
                        {downloaded ? (
                            <>
                                <Check className="size-3.5 text-emerald-500" />
                                <span>File Downloaded</span>
                            </>
                        ) : (
                            <>
                                <Download className="size-3.5 text-muted-foreground" />
                                <span>Download (.txt)</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Subtle Confirmation Checkbox */}
            <label className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/50 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors select-none text-xs text-foreground">
                <input
                    type="checkbox"
                    checked={isAcknowledged}
                    onChange={(e) => onToggleAcknowledge(e.target.checked)}
                    className="size-4 rounded border-border text-primary focus:ring-primary/20 cursor-pointer shrink-0"
                />
                <span className="text-xs font-medium text-muted-foreground">
                    I saved or wrote down my emergency key
                </span>
            </label>
        </div>
    );
}
