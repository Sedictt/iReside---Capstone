'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { 
    Wrench, 
    Plus, 
    Clock, 
    CheckCircle2, 
    AlertCircle, 
    AlertTriangle, 
    X, 
    Upload, 
    Maximize2, 
    ChevronDown, 
    ChevronUp,
    Calendar,
    Tag
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';

interface MaintenanceRequest {
    id: string;
    title: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'resolved' | 'cancelled';
    images?: string[];
    createdAt: string;
    updatedAt?: string;
    resolutionNotes?: string;
}

const CATEGORIES = [
    'Plumbing',
    'Electrical',
    'Appliance',
    'Air Conditioning',
    'Carpentry / Furniture',
    'Pest Control',
    'Other'
];

export function TenantMaintenanceView() {
    const [requests, setRequests] = useState<MaintenanceRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('open');
    
    // New Request Modal state
    const [showNewModal, setShowNewModal] = useState(false);
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState(CATEGORIES[0]);
    const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
    const [description, setDescription] = useState('');
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Lightbox state
    const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/tenant/maintenance');
            if (res.ok) {
                const json = await res.json();
                setRequests(Array.isArray(json.requests) ? json.requests : []);
            }
        } catch (err) {
            console.error('[TenantMaintenance] Failed to fetch requests:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const filteredRequests = useMemo(() => {
        return requests.filter((r) => {
            if (filter === 'open') return r.status === 'pending';
            if (filter === 'in_progress') return r.status === 'in_progress';
            if (filter === 'resolved') return r.status === 'resolved';
            return true;
        });
    }, [requests, filter]);

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setSelectedPhoto(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            setToast({ type: 'error', message: 'Please provide both title and description.' });
            return;
        }

        setSubmitting(true);
        setToast(null);

        try {
            const payload = {
                title: title.trim(),
                description: description.trim(),
                category,
                priority,
                images: selectedPhoto ? [selectedPhoto] : [],
            };

            const res = await fetch('/api/tenant/maintenance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const errJson = await res.json().catch(() => ({}));
                throw new Error(errJson.error || 'Failed to submit request.');
            }

            setToast({ type: 'success', message: 'Maintenance request submitted! Management will review shortly.' });
            setShowNewModal(false);
            setTitle('');
            setDescription('');
            setSelectedPhoto(null);
            setPriority('medium');
            fetchRequests();
        } catch (err: any) {
            setToast({ type: 'error', message: err?.message || 'Submission error.' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <PullToRefresh onRefresh={fetchRequests}>
            <div className="flex flex-col gap-3 pb-3">
                {/* Header Action Strip */}
                <div className="px-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                            Service Requests
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                            Track repairs and request property fixes
                        </p>
                    </div>

                    <button
                        onClick={() => setShowNewModal(true)}
                        className="px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold flex items-center gap-1.5 shadow-xs hover:brightness-105 active:scale-95 transition-all shrink-0"
                    >
                        <Plus className="size-3.5" />
                        <span>New Request</span>
                    </button>
                </div>

                {/* Toast Notification */}
                {toast && (
                    <div className={cn(
                        "mx-4 p-3 rounded-xl text-xs font-bold flex items-center justify-between animate-in fade-in duration-200",
                        toast.type === 'success' 
                            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-400" 
                            : "bg-red-500/15 border border-red-500/30 text-red-400"
                    )}>
                        <span>{toast.message}</span>
                        <button onClick={() => setToast(null)} className="p-1">
                            <X className="size-3.5" />
                        </button>
                    </div>
                )}

                {/* Status Filter Tabs */}
                <div className="px-4 flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
                    <button
                        onClick={() => setFilter('open')}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                            filter === 'open' 
                                ? "bg-primary text-primary-foreground shadow-xs" 
                                : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                        )}
                    >
                        Pending / Open
                    </button>
                    <button
                        onClick={() => setFilter('in_progress')}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                            filter === 'in_progress' 
                                ? "bg-primary text-primary-foreground shadow-xs" 
                                : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                        )}
                    >
                        In Progress
                    </button>
                    <button
                        onClick={() => setFilter('resolved')}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                            filter === 'resolved' 
                                ? "bg-primary text-primary-foreground shadow-xs" 
                                : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                        )}
                    >
                        Resolved
                    </button>
                    <button
                        onClick={() => setFilter('all')}
                        className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                            filter === 'all' 
                                ? "bg-primary text-primary-foreground shadow-xs" 
                                : "bg-slate-100/90 dark:bg-card/70 border border-slate-300/80 dark:border-white/15 text-muted-foreground"
                        )}
                    >
                        All
                    </button>
                </div>

                {/* Requests List */}
                <div className="px-4 flex flex-col gap-2.5">
                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-2">
                            <div className="w-8 h-8 rounded-full border-2 border-muted border-t-primary animate-spin" />
                            <span className="text-xs text-muted-foreground">Loading maintenance tickets…</span>
                        </div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/50 p-6 text-center flex flex-col items-center justify-center shadow-xs">
                            <Wrench className="size-8 text-muted-foreground/50 mb-2" />
                            <h4 className="text-xs font-bold text-foreground">No requests found</h4>
                            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs">
                                {filter === 'open' 
                                    ? 'Everything in your residence is in good working order!' 
                                    : 'No requests match the selected filter.'}
                            </p>
                        </div>
                    ) : (
                        filteredRequests.map((req) => {
                            const isExpanded = expandedId === req.id;
                            const isUrgent = req.priority === 'urgent' || req.priority === 'high';
                            const hasImages = Boolean(req.images && req.images.length > 0);

                            return (
                                <div
                                    key={req.id}
                                    className="rounded-2xl border border-slate-300 dark:border-white/15 bg-white dark:bg-card/80 p-3.5 shadow-xs flex flex-col gap-2.5 transition-all"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <span className="px-2 py-0.5 rounded-md bg-muted text-foreground text-[9px] font-bold">
                                                    {req.category}
                                                </span>
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight",
                                                    isUrgent ? "bg-red-500/15 text-red-500" : "bg-blue-500/15 text-blue-500"
                                                )}>
                                                    {req.priority}
                                                </span>
                                            </div>
                                            <h4 className="text-xs font-bold text-foreground">{req.title}</h4>
                                        </div>

                                        <span className={cn(
                                            "text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0",
                                            req.status === 'resolved' && "bg-emerald-500/15 text-emerald-500",
                                            req.status === 'in_progress' && "bg-blue-500/15 text-blue-400",
                                            req.status === 'pending' && "bg-amber-500/15 text-amber-500"
                                        )}>
                                            {req.status === 'in_progress' ? 'In Progress' : req.status}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className={cn(
                                        "text-[11px] text-muted-foreground leading-relaxed",
                                        !isExpanded && "line-clamp-2"
                                    )}>
                                        {req.description}
                                    </p>

                                    {/* Photos preview */}
                                    {hasImages && req.images && (
                                        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
                                            {req.images.map((imgUrl, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setLightboxUrl(imgUrl)}
                                                    className="relative size-14 rounded-lg overflow-hidden border border-slate-200 dark:border-white/10 bg-black/40 shrink-0 hover:opacity-80 active:scale-95 transition-all"
                                                    aria-label="Inspect issue photo"
                                                >
                                                    <Image src={imgUrl} alt="Issue photo" fill sizes="56px" className="object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Footer details & toggle */}
                                    <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Calendar className="size-3" />
                                            {new Date(req.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>

                                        <button
                                            onClick={() => setExpandedId(isExpanded ? null : req.id)}
                                            className="text-[10px] font-bold text-primary flex items-center gap-0.5 hover:underline"
                                        >
                                            <span>{isExpanded ? 'Less' : 'Details'}</span>
                                            {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* New Request Modal */}
            {mounted && showNewModal && createPortal(
                <div 
                    className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowNewModal(false);
                    }}
                >
                    <div 
                        className="w-full max-w-md bg-card border-t sm:border border-slate-300 dark:border-white/15 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl flex flex-col gap-3.5 max-h-[85vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-2 border-b border-border">
                            <div>
                                <h3 className="text-sm font-black text-foreground">New Maintenance Request</h3>
                                <p className="text-[10px] text-muted-foreground">Submit a repair issue for your residence</p>
                            </div>
                            <button
                                onClick={() => setShowNewModal(false)}
                                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground"
                                aria-label="Close modal"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateRequest} className="flex flex-col gap-3">
                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">
                                    Issue Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Leaking kitchen faucet"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label className="text-[11px] font-bold text-foreground block mb-1">
                                        Category
                                    </label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-2.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                                    >
                                        {CATEGORIES.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="text-[11px] font-bold text-foreground block mb-1">
                                        Priority
                                    </label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value as any)}
                                        className="w-full px-2.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary shadow-xs"
                                    >
                                        <option value="low">Low (Standard)</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">
                                    Detailed Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Please describe where and when the issue occurs…"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary shadow-xs resize-none"
                                />
                            </div>

                            <div>
                                <label className="text-[11px] font-bold text-foreground block mb-1">
                                    Attach Photo (Optional)
                                </label>
                                <label className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border-2 border-dashed border-border/80 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-all">
                                    {selectedPhoto ? (
                                        <div className="relative size-20 rounded-lg overflow-hidden border border-border">
                                            <Image src={selectedPhoto} alt="Issue photo preview" fill sizes="80px" className="object-cover" />
                                        </div>
                                    ) : (
                                        <>
                                            <Upload className="size-4 text-muted-foreground" />
                                            <span className="text-xs font-bold text-foreground">Attach issue photo</span>
                                            <span className="text-[9px] text-muted-foreground">PNG, JPG up to 5MB</span>
                                        </>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoSelect}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs hover:brightness-105 active:scale-[0.98] transition-all disabled:opacity-50 mt-1"
                            >
                                {submitting ? 'Submitting…' : 'Submit Maintenance Request'}
                            </button>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* Photo Lightbox */}
            {mounted && lightboxUrl && createPortal(
                <div className="fixed inset-0 z-[130] bg-black/90 backdrop-blur-md flex flex-col p-4 animate-in fade-in duration-200">
                    <div className="flex justify-end">
                        <button
                            onClick={() => setLightboxUrl(null)}
                            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20"
                            aria-label="Close photo"
                        >
                            <X className="size-4" />
                        </button>
                    </div>
                    <div className="flex-1 relative my-3 flex items-center justify-center overflow-hidden rounded-xl">
                        <Image src={lightboxUrl} alt="Enlarged issue" fill sizes="100vw" className="object-contain" />
                    </div>
                </div>,
                document.body
            )}
        </PullToRefresh>
    );
}
