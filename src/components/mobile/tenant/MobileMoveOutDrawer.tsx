'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
    LogOut, 
    X, 
    Calendar, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    ShieldCheck, 
    RefreshCw, 
    AlertCircle, 
    Check
} from 'lucide-react';
import { toast } from 'sonner';
import { triggerHaptic } from '@/lib/haptics';
import { useLanguageContext } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';
import { ClientOnlyDate } from '@/components/ui/client-only-date';
import { 
    MOVE_OUT_NOTICE_DAYS, 
    addDaysIso, 
    moveOutDateRule 
} from '@/lib/validation/schemas/tenant-lifecycle.schema';
import { todayIsoDate } from '@/lib/validation/rules';

interface ChecklistItem {
    id: string;
    label: string;
    completed: boolean;
}

const DEFAULT_CHECKLIST: ChecklistItem[] = [
    { id: 'keys', label: 'Return all physical keys & access fobs', completed: false },
    { id: 'bills', label: 'Clear all outstanding utility & submeter charges', completed: false },
    { id: 'clean', label: 'Clean unit and remove all personal belongings', completed: false },
    { id: 'address', label: 'Confirm forwarding address & phone number', completed: false },
];

export interface MoveOutRequestDetails {
    id: string;
    status: 'pending' | 'approved' | 'denied' | 'completed';
    requested_date: string;
    reason?: string | null;
    denial_reason?: string | null;
    created_at: string;
    approved_at?: string | null;
    denied_at?: string | null;
    inspection_date?: string | null;
    inspection_notes?: string | null;
    deposit_deductions?: Array<{ id?: string; description: string; amount: number }> | null;
    deposit_refund_amount?: number | null;
    checklist_completed?: boolean;
    checklist_data?: { items?: ChecklistItem[] } | Record<string, any>;
    landlord_name?: string;
}

interface MobileMoveOutDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    leaseEndDate?: string | null;
    onSubmitted?: () => void;
}

export function MobileMoveOutDrawer({
    isOpen,
    onClose,
    leaseEndDate,
    onSubmitted,
}: MobileMoveOutDrawerProps) {
    const { t } = useLanguageContext();
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [request, setRequest] = useState<MoveOutRequestDetails | null>(null);

    // Form states
    const [requestedDate, setRequestedDate] = useState('');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [dateError, setDateError] = useState<string | null>(null);

    // Checklist states
    const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(DEFAULT_CHECKLIST);
    const [savingChecklist, setSavingChecklist] = useState(false);

    // 30-day notice rule calculations
    const earliestMoveOutDate = useMemo(() => addDaysIso(todayIsoDate(), MOVE_OUT_NOTICE_DAYS), []);
    const latestMoveOutDate = useMemo(() => {
        return leaseEndDate && leaseEndDate >= earliestMoveOutDate ? leaseEndDate : undefined;
    }, [leaseEndDate, earliestMoveOutDate]);

    // Fetch existing status
    const fetchStatus = async () => {
        setLoadingStatus(true);
        try {
            const res = await fetch('/api/tenant/lease/move-out/status');
            if (res.ok) {
                const data = await res.json();
                if (data.hasRequest && data.request) {
                    setRequest(data.request);
                    // Sync checklist
                    if (data.request.checklist_data?.items && Array.isArray(data.request.checklist_data.items)) {
                        setChecklistItems(data.request.checklist_data.items);
                    }
                } else {
                    setRequest(null);
                }
            }
        } catch (err) {
            console.error('Error fetching move-out status:', err);
        } finally {
            setLoadingStatus(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchStatus();
            setRequestedDate(earliestMoveOutDate);
            setReason('');
            setDateError(null);
        }
    }, [isOpen, earliestMoveOutDate]);

    // Validate date on change
    const handleDateChange = (date: string) => {
        setRequestedDate(date);
        const err = moveOutDateRule(date, { leaseEndDate: leaseEndDate ?? null });
        setDateError(err || null);
    };

    // Submit new notice to vacate
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = moveOutDateRule(requestedDate, { leaseEndDate: leaseEndDate ?? null });
        if (err) {
            setDateError(err);
            toast.error(err);
            return;
        }

        setSubmitting(true);
        triggerHaptic('medium');

        try {
            const res = await fetch('/api/tenant/lease/move-out', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestedDate,
                    reason: reason.trim() || undefined,
                }),
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || t('Failed to submit move-out request'));
            }

            toast.success(t('Notice to vacate submitted successfully!'));
            triggerHaptic('success');
            if (onSubmitted) onSubmitted();
            await fetchStatus();
        } catch (err: any) {
            console.error('Error submitting move-out:', err);
            toast.error(err.message || t('Failed to submit move-out request'));
        } finally {
            setSubmitting(false);
        }
    };

    // Toggle checklist item
    const handleToggleChecklist = async (id: string) => {
        if (savingChecklist) return;
        triggerHaptic('light');

        const updated = checklistItems.map(item =>
            item.id === id ? { ...item, completed: !item.completed } : item
        );
        setChecklistItems(updated);
        setSavingChecklist(true);

        try {
            const res = await fetch('/api/tenant/lease/move-out/checklist', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    checklist_data: { items: updated },
                }),
            });

            if (!res.ok) {
                throw new Error('Failed to update checklist');
            }
        } catch (err) {
            console.error('Checklist sync error:', err);
            toast.error(t('Failed to sync checklist'));
        } finally {
            setSavingChecklist(false);
        }
    };

    if (!isOpen) return null;

    const completedChecklistCount = checklistItems.filter(i => i.completed).length;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full sm:max-w-lg bg-background rounded-t-3xl sm:rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-200 max-h-[92vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between pb-1 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                        <div className="size-9 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                            <LogOut className="size-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-black text-foreground">
                                {request ? t('Move-Out Clearance') : t('Notice to Vacate')}
                            </h3>
                            <p className="text-[10px] text-muted-foreground font-semibold">
                                {request ? t('Track clearance progress & requirements') : t('Submit your move-out clearance notice')}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                        aria-label={t('Close')}
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {loadingStatus ? (
                    <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="size-6 text-primary animate-spin" />
                        <span className="text-xs font-bold text-muted-foreground">{t('Loading clearance status…')}</span>
                    </div>
                ) : request ? (
                    /* Existing Move-Out Request Details & Timeline */
                    <div className="space-y-4">
                        {/* Status Card Banner */}
                        <div className={cn(
                            "p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-2xs",
                            request.status === 'pending' && "bg-amber-500/10 border-amber-500/25 text-amber-600 dark:text-amber-400",
                            request.status === 'approved' && "bg-blue-500/10 border-blue-500/25 text-blue-600 dark:text-blue-400",
                            request.status === 'denied' && "bg-rose-500/10 border-rose-500/25 text-rose-600 dark:text-rose-400",
                            request.status === 'completed' && "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                        )}>
                            <div className="flex items-center gap-2.5">
                                {request.status === 'pending' && <Clock className="size-5 shrink-0" />}
                                {request.status === 'approved' && <CheckCircle2 className="size-5 shrink-0" />}
                                {request.status === 'denied' && <XCircle className="size-5 shrink-0" />}
                                {request.status === 'completed' && <ShieldCheck className="size-5 shrink-0" />}
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-wider">
                                        {request.status === 'pending' && t('Under Landlord Review')}
                                        {request.status === 'approved' && t('Move-Out Approved')}
                                        {request.status === 'denied' && t('Request Denied')}
                                        {request.status === 'completed' && t('Clearance Completed')}
                                    </h4>
                                    <p className="text-[10px] opacity-80 font-medium">
                                        {t('Target Date:')} <ClientOnlyDate date={request.requested_date} />
                                    </p>
                                </div>
                            </div>
                            <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full border border-current">
                                {t(request.status)}
                            </span>
                        </div>

                        {/* Denial Reason Alert */}
                        {request.status === 'denied' && request.denial_reason && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
                                <span className="font-bold">{t('Denial Reason:')} </span>
                                <span>{request.denial_reason}</span>
                            </div>
                        )}

                        {/* Stepped Progress Tracker */}
                        <div className="p-4 rounded-2xl bg-card border border-slate-200 dark:border-white/10 space-y-4 shadow-2xs">
                            <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                {t('Clearance Milestones')}
                            </h4>
                            <div className="relative pl-6 space-y-4">
                                <div className="absolute left-2.5 top-2 bottom-2 w-0.5 bg-slate-200 dark:bg-white/10" />

                                {/* 1. Request Filed */}
                                <div className="relative flex items-start gap-3">
                                    <div className="absolute -left-6 top-0.5 size-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold">
                                        ✓
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-foreground">{t('Notice to Vacate Filed')}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            <ClientOnlyDate date={request.created_at} />
                                        </p>
                                    </div>
                                </div>

                                {/* 2. Landlord Review */}
                                <div className="relative flex items-start gap-3">
                                    <div className={cn(
                                        "absolute -left-6 top-0.5 size-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                        request.status !== 'pending' && request.status !== 'denied'
                                            ? "bg-primary text-primary-foreground"
                                            : request.status === 'denied'
                                            ? "bg-rose-500 text-white"
                                            : "bg-muted text-muted-foreground border border-border"
                                    )}>
                                        {request.status === 'denied' ? '✕' : request.status !== 'pending' ? '✓' : '2'}
                                    </div>
                                    <div>
                                        <p className={cn("text-xs font-bold", request.status === 'pending' ? "text-muted-foreground" : "text-foreground")}>
                                            {request.status === 'denied' ? t('Notice Denied') : t('Landlord Approval')}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {request.approved_at ? <ClientOnlyDate date={request.approved_at} /> : t('Awaiting review')}
                                        </p>
                                    </div>
                                </div>

                                {/* 3. Physical Inspection */}
                                <div className="relative flex items-start gap-3">
                                    <div className={cn(
                                        "absolute -left-6 top-0.5 size-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                        request.inspection_date ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground border border-border"
                                    )}>
                                        {request.inspection_date ? '✓' : '3'}
                                    </div>
                                    <div>
                                        <p className={cn("text-xs font-bold", !request.inspection_date ? "text-muted-foreground" : "text-foreground")}>
                                            {t('Room Inspection')}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {request.inspection_date ? (
                                                <>
                                                    <ClientOnlyDate date={request.inspection_date} />
                                                    {request.inspection_notes ? (' • ' + request.inspection_notes) : ''}
                                                </>
                                            ) : (
                                                t('Scheduled after approval')
                                            )}
                                        </p>
                                    </div>
                                </div>

                                {/* 4. Settlement & Key Return */}
                                <div className="relative flex items-start gap-3">
                                    <div className={cn(
                                        "absolute -left-6 top-0.5 size-5 rounded-full flex items-center justify-center text-[10px] font-bold",
                                        request.status === 'completed' ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground border border-border"
                                    )}>
                                        {request.status === 'completed' ? '✓' : '4'}
                                    </div>
                                    <div>
                                        <p className={cn("text-xs font-bold", request.status !== 'completed' ? "text-muted-foreground" : "text-foreground")}>
                                            {t('Deposit & Final Settlement')}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {request.deposit_refund_amount !== null && request.deposit_refund_amount !== undefined
                                                ? t('Refund: ₱{amount}', { amount: Number(request.deposit_refund_amount).toLocaleString() })
                                                : t('Processed following inspection')}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Clearance Checklist (if approved or completed) */}
                        {(request.status === 'approved' || request.status === 'completed') && (
                            <div className="p-4 rounded-2xl bg-card border border-slate-200 dark:border-white/10 space-y-3 shadow-2xs">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                                            {t('Clearance Checklist')}
                                        </h4>
                                        <p className="text-[10px] text-muted-foreground">
                                            {t('Complete prior to physical key hand-off')}
                                        </p>
                                    </div>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                        {completedChecklistCount}/{checklistItems.length} {t('Done')}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    {checklistItems.map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => handleToggleChecklist(item.id)}
                                            className={cn(
                                                "w-full p-2.5 rounded-xl border flex items-center gap-3 text-left transition-all cursor-pointer",
                                                item.completed
                                                    ? "bg-primary/5 border-primary/30 text-foreground"
                                                    : "bg-muted/20 border-slate-200 dark:border-white/10 text-muted-foreground hover:text-foreground"
                                            )}
                                        >
                                            <div className={cn(
                                                "size-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors",
                                                item.completed
                                                    ? "bg-primary border-primary text-primary-foreground"
                                                    : "border-muted-foreground/40 bg-card"
                                            )}>
                                                {item.completed && <Check className="size-3.5 stroke-[3]" />}
                                            </div>
                                            <span className={cn(
                                                "text-xs font-bold leading-tight",
                                                item.completed && "line-through opacity-75"
                                            )}>
                                                {t(item.label)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Deposit Deductions Breakdown (if provided) */}
                        {Array.isArray(request.deposit_deductions) && request.deposit_deductions.length > 0 && (
                            <div className="p-4 rounded-2xl bg-card border border-slate-200 dark:border-white/10 space-y-2 shadow-2xs">
                                <h4 className="text-xs font-black uppercase tracking-wider text-foreground">
                                    {t('Security Deposit Deductions')}
                                </h4>
                                <div className="divide-y divide-border/40 text-xs">
                                    {request.deposit_deductions.map((ded, idx) => (
                                        <div key={ded.id || idx} className="py-2 flex items-center justify-between">
                                            <span className="text-muted-foreground">{ded.description}</span>
                                            <span className="font-bold text-rose-500">
                                                -₱{Number(ded.amount).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {request.deposit_refund_amount !== null && request.deposit_refund_amount !== undefined && (
                                    <div className="pt-2 border-t border-border flex items-center justify-between font-black text-sm">
                                        <span>{t('Total Net Refund')}</span>
                                        <span className="text-emerald-500">
                                            ₱{Number(request.deposit_refund_amount).toLocaleString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full py-3 rounded-xl bg-muted text-foreground font-bold text-xs active:scale-98 transition-all cursor-pointer"
                        >
                            {t('Close')}
                        </button>
                    </div>
                ) : (
                    /* Notice to Vacate Filing Form */
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Requirement Notice Alert */}
                        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 text-xs space-y-1">
                            <div className="flex items-center gap-1.5 font-bold">
                                <AlertCircle className="size-4 shrink-0" />
                                <span>{t('Minimum 30 Calendar Days Notice Required')}</span>
                            </div>
                            <p className="text-[11px] opacity-85 leading-relaxed">
                                {t("Per residency protocol, move-out requests require at least {days} days advance notice. Earliest eligible date is {date}.", {
                                    days: MOVE_OUT_NOTICE_DAYS,
                                    date: earliestMoveOutDate
                                })}
                            </p>
                        </div>

                        {/* Requested Date */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {t('Requested Move-Out Date')}
                            </label>
                            <input
                                type="date"
                                required
                                min={earliestMoveOutDate}
                                max={latestMoveOutDate}
                                value={requestedDate}
                                onChange={(e) => handleDateChange(e.target.value)}
                                className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                            />
                            {dateError && (
                                <p className="text-[11px] text-rose-500 font-bold mt-1">
                                    {dateError}
                                </p>
                            )}

                            {/* Quick Preset Buttons */}
                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    type="button"
                                    onClick={() => handleDateChange(earliestMoveOutDate)}
                                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-muted/60 text-muted-foreground hover:text-foreground active:scale-95 cursor-pointer"
                                >
                                    {t('+30 Days (Earliest)')}
                                </button>
                                {latestMoveOutDate && (
                                    <button
                                        type="button"
                                        onClick={() => handleDateChange(latestMoveOutDate)}
                                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-muted/60 text-muted-foreground hover:text-foreground active:scale-95 cursor-pointer"
                                    >
                                        {t('Lease End Date ({date})', { date: latestMoveOutDate })}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Reason / Forwarding Details */}
                        <div className="space-y-1.5">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                    {t('Reason & Forwarding Details')}
                                </label>
                                <span className="text-[9px] text-muted-foreground">
                                    {reason.length}/1000
                                </span>
                            </div>
                            <textarea
                                rows={3}
                                maxLength={1000}
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder={t('Reason for moving out, forwarding address, relocation notes...')}
                                className="w-full p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs resize-none"
                            />
                        </div>

                        {/* Protocol Reminder Box */}
                        <div className="p-3 rounded-xl bg-muted/40 border border-border/40 text-[11px] text-muted-foreground space-y-1">
                            <p className="font-bold text-foreground">{t('Next steps after submission:')}</p>
                            <ul className="list-disc pl-4 space-y-0.5">
                                <li>{t('Your landlord reviews and approves the date')}</li>
                                <li>{t('A room clearance inspection will be scheduled')}</li>
                                <li>{t('Deposit refunds are disbursed post-inspection')}</li>
                            </ul>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 pt-2">
                            <button
                                type="button"
                                disabled={submitting}
                                onClick={onClose}
                                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-98 transition-all cursor-pointer"
                            >
                                {t('Cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !requestedDate || !!dateError}
                                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50 cursor-pointer"
                            >
                                {submitting ? (
                                    <RefreshCw className="size-4 animate-spin" />
                                ) : (
                                    <>
                                        <LogOut className="size-4" />
                                        <span>{t('Submit Notice')}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
