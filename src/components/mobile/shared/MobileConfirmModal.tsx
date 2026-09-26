'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { AlertTriangle, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react';

export interface MobileConfirmModalProps {
    isOpen: boolean;
    title: string;
    description: string | React.ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: 'danger' | 'warning' | 'primary' | 'success';
    isLoading?: boolean;
    onConfirm: () => void | Promise<void>;
    onCancel: () => void;
    icon?: React.ReactNode;
}

export function MobileConfirmModal({
    isOpen,
    title,
    description,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'primary',
    isLoading = false,
    onConfirm,
    onCancel,
    icon,
}: MobileConfirmModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || !isOpen) return null;

    const variantStyles = {
        danger: {
            iconBg: 'bg-rose-500/15 text-rose-500 border border-rose-500/20',
            confirmBtn: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25',
            defaultIcon: <AlertCircle className="size-5" />,
        },
        warning: {
            iconBg: 'bg-amber-500/15 text-amber-500 border border-amber-500/20',
            confirmBtn: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25',
            defaultIcon: <AlertTriangle className="size-5" />,
        },
        success: {
            iconBg: 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20',
            confirmBtn: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25',
            defaultIcon: <CheckCircle2 className="size-5" />,
        },
        primary: {
            iconBg: 'bg-primary/15 text-primary border border-primary/20',
            confirmBtn: 'bg-primary hover:brightness-105 text-primary-foreground shadow-primary/25',
            defaultIcon: <HelpCircle className="size-5" />,
        },
    };

    const currentVariant = variantStyles[variant];

    return createPortal(
        <div
            onClick={() => !isLoading && onCancel()}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150 cursor-pointer"
            role="dialog"
            aria-modal="true"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-xs rounded-3xl border border-slate-300 dark:border-white/15 bg-white dark:bg-[#111622] p-5 shadow-2xl flex flex-col animate-in zoom-in-95 duration-150 cursor-default"
            >
                {/* Icon Header */}
                <div className="flex items-center gap-3 mb-3">
                    <div className={cn("size-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs", currentVariant.iconBg)}>
                        {icon || currentVariant.defaultIcon}
                    </div>
                    <h3 className="text-sm font-black text-foreground leading-snug">
                        {title}
                    </h3>
                </div>

                {/* Description */}
                <div className="text-xs text-muted-foreground leading-relaxed mb-5">
                    {description}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-white/5">
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onCancel}
                        className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-muted-foreground hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        disabled={isLoading}
                        onClick={onConfirm}
                        className={cn(
                            "flex-1 py-2.5 px-3 rounded-xl font-black text-xs uppercase tracking-tight shadow-md active:scale-95 transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5",
                            currentVariant.confirmBtn
                        )}
                    >
                        {isLoading ? (
                            <>
                                <div className="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Please wait…</span>
                            </>
                        ) : (
                            <span>{confirmLabel}</span>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
