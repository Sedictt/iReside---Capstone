'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    FileCheck,
    Search,
    Phone,
    Mail,
    Building2,
    Calendar,
    Clock,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Eye,
    Wallet,
    RefreshCw,
    X,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Check,
    Briefcase,
    DollarSign,
    Shield,
    FileText,
    ExternalLink,
    UserCheck,
    Users,
    Lock,
    ArrowRightLeft,
    Receipt,
    ClipboardCheck,
    Loader2,
} from 'lucide-react';
import { useProperty } from '@/context/PropertyContext';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';
import { UnitHoldModal, type UnitHoldApplicantOption } from '@/components/landlord/applications/UnitHoldModal';
import { ApproveConfirmationModal } from '@/components/landlord/applications/ApproveConfirmationModal';
import {
    ResolveCompetingApplicantsModal,
    type CompetingApplicantItem,
} from '@/components/landlord/applications/ResolveCompetingApplicantsModal';
import type { UnitHoldInfo, WalkInUnit } from '@/lib/application-intake';
import type { LeaseStatus } from '@/types/database';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useLanguageContext } from '@/context/LanguageContext';
import { ScrollableWithHint } from '@/components/ui/ScrollableWithHint';
import { CollapsiblePanel } from '@/components/ui/CollapsiblePanel';
import { toast } from 'sonner';
import { tr } from '@/hooks/useLanguage';
import { readViewCache, writeViewCache, hasViewCache, fetchJsonDeduped } from '@/lib/mobile/view-cache';

const MOBILE_APPS_PAGE_SIZE = 4;

const APPLICATION_STATUS_LABELS: Record<string, string> = {
    pending: 'Needs Review',
    reviewing: 'In Review',
    payment_pending: 'Waiting Payment',
    approved: 'Approved',
    rejected: 'Declined',
    withdrawn: 'Cancelled',
};

const LEASE_STATUS_TEXT: Record<string, { label: string; description: string; tone: 'emerald' | 'amber' | 'neutral' }> = {
    active: {
        label: 'Active Lease',
        description: 'Both you and the tenant have signed the contract.',
        tone: 'emerald',
    },
    pending_landlord_signature: {
        label: 'Needs Your Signature',
        description: 'The tenant already signed. Open Leases to add your signature.',
        tone: 'amber',
    },
    pending_tenant_signature: {
        label: 'Waiting for Tenant',
        description: 'Contract link sent. Waiting for the tenant to sign.',
        tone: 'amber',
    },
    pending_signature: {
        label: 'Ready to Send',
        description: 'Contract is created and ready to send to the tenant.',
        tone: 'amber',
    },
    draft: {
        label: 'Draft',
        description: 'Lease contract is still being prepared.',
        tone: 'neutral',
    },
};

interface ApplicantData {
    name: string;
    email: string;
    phone: string;
    occupation: string;
    monthlyIncome: number | null;
    avatar?: string | null;
    avatarBgColor?: string | null;
}

interface ComplianceChecklistState {
    valid_id: boolean;
    income_verified: boolean;
    application_completed: boolean;
    background_checked: boolean;
    payment_received: boolean;
    lease_signed: boolean;
    inspection_done: boolean;
}

interface PreApprovalPaymentItem {
    id: string;
    requirementType: 'advance_rent' | 'security_deposit';
    amount: number;
    dueAt: string | null;
    status: 'pending' | 'processing' | 'completed' | 'rejected' | 'expired';
    method: 'gcash' | 'bank_transfer' | 'cash' | null;
    referenceNumber?: string | null;
    transactionReference?: string | null;
    submittedAt: string | null;
    reviewedAt: string | null;
    proofUrl: string | null;
    reviewNote: string | null;
    bypassed: boolean;
}

interface ApplicationItem {
    id: string;
    source?: 'walk_in_application' | 'invite_link';
    applicant: ApplicantData;
    propertyName: string;
    propertyId?: string | null;
    unitId?: string | null;
    unitNumber: string;
    requestedMoveIn: string | null;
    monthlyRent: number | null;
    status: 'pending' | 'reviewing' | 'payment_pending' | 'approved' | 'rejected' | 'withdrawn';
    submittedDate: string;
    notes?: string | null;
    documents?: string[];
    emergencyContact?: {
        name: string | null;
        phone: string | null;
    };
    reference?: {
        name: string | null;
        contact: string | null;
    };
    complianceChecklist?: ComplianceChecklistState | null;
    lease?: {
        id: string;
        status: LeaseStatus;
        signing_mode: 'in_person' | 'remote' | null;
        tenant_signature: string | null;
        landlord_signature: string | null;
    } | null;
    preApprovalPayments?: PreApprovalPaymentItem[];
    unitOffer?: {
        target_unit_id?: string;
        target_unit_name?: string;
        target_monthly_rent?: number;
        previous_unit_name?: string;
        offered_at?: string;
        status?: 'pending' | 'accepted' | 'cancelled';
        responded_at?: string | null;
    } | null;
}

const getDocumentLabel = (value: string) => {
    if (!value) return 'Document';
    const trimmed = value.trim();
    const withoutQuery = trimmed.split('?')[0] ?? trimmed;
    const lastSlash = withoutQuery.lastIndexOf('/');
    const fileName = lastSlash >= 0 ? withoutQuery.slice(lastSlash + 1) : withoutQuery;
    try {
        return decodeURIComponent(fileName || 'Document');
    } catch {
        return fileName || 'Document';
    }
};

const getApplicationProgress = (app: ApplicationItem) => {
    const items = [
        { label: 'Full name provided', done: Boolean(app.applicant?.name) },
        { label: 'Email address provided', done: Boolean(app.applicant?.email) },
        { label: 'Phone number provided', done: Boolean(app.applicant?.phone) },
        { label: 'Job or occupation listed', done: Boolean(app.applicant?.occupation) },
        { label: 'Monthly income listed', done: Boolean(app.applicant?.monthlyIncome && app.applicant.monthlyIncome > 0) },
        { label: 'Valid ID check', done: Boolean(app.complianceChecklist?.valid_id) },
        { label: 'Income verification', done: Boolean(app.complianceChecklist?.income_verified) },
        { label: 'Signed lease contract', done: Boolean(app.lease?.tenant_signature || app.lease?.status === 'active' || app.status === 'approved') },
    ];

    const completed = items.filter((item) => item.done).length;
    const total = items.length;
    const percentage = Math.round((completed / total) * 100);
    const missing = items.filter((item) => !item.done).map((item) => item.label);

    return { completed, total, percentage, missing };
};

export function LandlordApplicationsView() {
    const router = useRouter();
    const { selectedPropertyId } = useProperty();
    const { t, locale } = useLanguageContext();

    const appsCacheKey = `landlord-applications:${selectedPropertyId || 'all'}`;
    const appsRequestRef = useRef(0);

    const [applications, setApplications] = useState<ApplicationItem[]>(
        () => readViewCache<ApplicationItem[]>(appsCacheKey) ?? []
    );
    const [availableUnits, setAvailableUnits] = useState<WalkInUnit[]>(
        () => readViewCache<WalkInUnit[]>('landlord-applications:units') ?? []
    );
    const [loading, setLoading] = useState(() => !hasViewCache(appsCacheKey));
    const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Detail & Decision state
    const [mounted, setMounted] = useState(false);
    const [selectedApp, setSelectedApp] = useState<ApplicationItem | null>(null);
    const [decisionMode, setDecisionMode] = useState<'reject' | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [submittingAction, setSubmittingAction] = useState(false);
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [approveError, setApproveError] = useState<string | null>(null);
    const [showRoomOptions, setShowRoomOptions] = useState(false);
    const [showApplicantDetails, setShowApplicantDetails] = useState(false);
    const [showMissingSteps, setShowMissingSteps] = useState(false);
    const [showPaymentsSection, setShowPaymentsSection] = useState(false);
    const [showDocumentsSection, setShowDocumentsSection] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [reviewingPaymentId, setReviewingPaymentId] = useState<string | null>(null);
    const latestChecklistRef = useRef<Record<string, ComplianceChecklistState>>({});
    const confirmedChecklistRef = useRef<Record<string, ComplianceChecklistState>>({});
    const checklistInflightRef = useRef<Record<string, boolean>>({});
    const checklistDirtyRef = useRef<Record<string, boolean>>({});
    const [sendingSigningLink, setSendingSigningLink] = useState(false);
    const [signingLinkFeedback, setSigningLinkFeedback] = useState<{
        message: string | null;
        signingUrl: string | null;
        emailSent: boolean | null;
    } | null>(null);
    const [expandedCardIds, setExpandedCardIds] = useState<Record<string, boolean>>({});

    const toggleCardExpanded = (id: string) => {
        setExpandedCardIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    useEffect(() => {
        setShowRoomOptions(false);
        setShowApplicantDetails(false);
        setShowMissingSteps(false);
        setShowDocumentsSection(false);
        setShowPaymentsSection(
            Boolean(
                selectedApp?.status === 'payment_pending' ||
                    selectedApp?.preApprovalPayments?.some((p) => p.status !== 'completed' && !p.bypassed)
            )
        );
        setSigningLinkFeedback(null);
        setPreviewUrl(null);
        if (!selectedApp?.id) {
            setShowApproveConfirm(false);
            setApproveError(null);
        }
    }, [selectedApp?.id, selectedApp?.status]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery, selectedPropertyId]);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Multi-applicant & Room Hold Modals
    const [unitHoldModalState, setUnitHoldModalState] = useState<{
        isOpen: boolean;
        unitId: string;
        unitName: string;
        propertyName: string;
        applicantOptions: UnitHoldApplicantOption[];
        defaultApplicantName: string;
        defaultApplicationId: string | null;
        competingApplicantsCount: number;
        existingHold: UnitHoldInfo | null;
    } | null>(null);

    const [resolveModalState, setResolveModalState] = useState<{
        isOpen: boolean;
        takenUnitId: string;
        takenUnitName: string;
        propertyName: string;
        propertyId: string | null;
        winnerName?: string;
        competingApplicants: CompetingApplicantItem[];
    } | null>(null);

    useEffect(() => {
        if (!selectedApp && !previewUrl) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;
            if (previewUrl) {
                setPreviewUrl(null);
                return;
            }
            if (!showApproveConfirm && !unitHoldModalState?.isOpen && !resolveModalState?.isOpen) {
                setSelectedApp(null);
                setDecisionMode(null);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [selectedApp, previewUrl, showApproveConfirm, unitHoldModalState?.isOpen, resolveModalState?.isOpen]);

    const loadUnits = useCallback(async (fresh = false) => {
        try {
            const data = await fetchJsonDeduped<any>(fresh ? '/api/landlord/property-units?fresh=1' : '/api/landlord/property-units');
            const properties = Array.isArray(data.properties) ? data.properties : [];
            const unitsList: WalkInUnit[] = properties.flatMap((property: any) => {
                const units = Array.isArray(property.units) ? property.units : [];
                return units.map((unit: any) => ({
                    id: unit.id,
                    name: unit.name,
                    rent_amount: Number(unit.rentAmount ?? 0),
                    property_id: property.id,
                    property_name: property.name,
                    property_contract_template: property.contractTemplate ?? null,
                    status: unit.status,
                    has_ongoing_application: Boolean(unit.hasOngoingApplication),
                    ongoing_application_count: Number(unit.ongoingApplicationCount ?? 0),
                    ongoing_application_status: unit.ongoingApplicationStatus ?? null,
                    is_on_hold: Boolean(unit.isOnHold),
                    hold_info: unit.holdInfo ?? null,
                }));
            });
            setAvailableUnits(unitsList);
            writeViewCache('landlord-applications:units', unitsList);
        } catch {
            // Non-blocking fallback
        }
    }, []);

    const fetchApplications = useCallback(async () => {
        const requestId = ++appsRequestRef.current;
        const cacheKey = `landlord-applications:${selectedPropertyId || 'all'}`;
        const snapshot = readViewCache<ApplicationItem[]>(cacheKey);
        if (snapshot) {
            setApplications(snapshot);
            setLoading(false);
        } else {
            setLoading(true);
        }

        try {
            const params = new URLSearchParams();
            if (selectedPropertyId && selectedPropertyId !== 'all') {
                params.set('propertyId', selectedPropertyId);
            }

            const data = await fetchJsonDeduped<any>(`/api/landlord/applications?${params.toString()}`);
            if (requestId !== appsRequestRef.current) return;
            const list: ApplicationItem[] = Array.isArray(data)
                ? data
                : Array.isArray(data?.applications)
                ? data.applications
                : [];
            for (const app of list) {
                if (!checklistInflightRef.current[app.id] && !checklistDirtyRef.current[app.id]) {
                    if (app.complianceChecklist) {
                        latestChecklistRef.current[app.id] = app.complianceChecklist;
                        confirmedChecklistRef.current[app.id] = app.complianceChecklist;
                    } else {
                        delete latestChecklistRef.current[app.id];
                        delete confirmedChecklistRef.current[app.id];
                    }
                }
            }
            setApplications(list);
            writeViewCache(cacheKey, list);
            setSelectedApp((prev) => (prev ? list.find((a) => a.id === prev.id) ?? prev : null));
        } catch (err) {
            if (requestId !== appsRequestRef.current) return;
            console.error('Error fetching landlord applications:', err);
            if (!hasViewCache(cacheKey)) {
                toast.error(tr('Failed to load rental applications'));
            }
        } finally {
            if (requestId === appsRequestRef.current) setLoading(false);
        }
    }, [selectedPropertyId]);

    useEffect(() => {
        void fetchApplications();
        void loadUnits();
    }, [fetchApplications, loadUnits]);

    const activeApplicantsByUnitKey = useMemo(() => {
        const map = new Map<string, ApplicationItem[]>();
        for (const app of applications) {
            if (!['pending', 'reviewing', 'payment_pending', 'approved'].includes(app.status)) continue;
            const key = app.unitId || `${app.propertyId ?? ''}:${app.unitNumber}`;
            const list = map.get(key) ?? [];
            list.push(app);
            map.set(key, list);
        }
        return map;
    }, [applications]);

    const formatCurrency = (amt?: number | null) => {
        if (typeof amt !== 'number' || !Number.isFinite(amt)) return t('Not provided');
        return `₱${amt.toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return t('Not specified');
        const d = new Date(dateStr);
        if (Number.isNaN(d.getTime())) return t('Not specified');
        return d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const formatRatio = (income?: number | null, rent?: number | null) => {
        if (typeof income !== 'number' || !Number.isFinite(income)) return null;
        if (typeof rent !== 'number' || !Number.isFinite(rent) || rent <= 0) return null;
        return `${(income / rent).toFixed(1)}x`;
    };

    const formatRoomLabel = (unitNumber?: string | null) => {
        const raw = (unitNumber ?? '').trim();
        if (!raw) return t('Room');
        if (/^(unit|room)\b/i.test(raw)) return raw;
        return t('Unit {unit}', { unit: raw });
    };

    const flushChecklistSync = useCallback(
        async (applicationId: string) => {
            if (checklistInflightRef.current[applicationId]) {
                checklistDirtyRef.current[applicationId] = true;
                return;
            }

            checklistInflightRef.current[applicationId] = true;
            try {
                while (true) {
                    checklistDirtyRef.current[applicationId] = false;
                    const payloadToSync = latestChecklistRef.current[applicationId];
                    if (!payloadToSync) break;

                    const res = await fetch('/api/landlord/applications/tenant-application', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            application_id: applicationId,
                            requirements_checklist: payloadToSync,
                        }),
                    });

                    if (!res.ok) {
                        throw new Error('Failed to save checklist update');
                    }

                    confirmedChecklistRef.current[applicationId] = payloadToSync;

                    if (!checklistDirtyRef.current[applicationId]) {
                        break;
                    }
                }
            } catch {
                // Only roll back if the user did not keep toggling after this failure
                if (!checklistDirtyRef.current[applicationId]) {
                    const fallback = confirmedChecklistRef.current[applicationId];
                    if (fallback) {
                        latestChecklistRef.current[applicationId] = fallback;
                        setApplications((prev) =>
                            prev.map((a) =>
                                a.id === applicationId ? { ...a, complianceChecklist: fallback } : a
                            )
                        );
                        setSelectedApp((prev) =>
                            prev && prev.id === applicationId ? { ...prev, complianceChecklist: fallback } : prev
                        );
                    }
                }
                toast.error(t('Could not update checklist item. Please try again.'));
            } finally {
                checklistInflightRef.current[applicationId] = false;
                if (checklistDirtyRef.current[applicationId]) {
                    void flushChecklistSync(applicationId);
                }
            }
        },
        [t]
    );

    const toggleChecklistItem = (
        applicationId: string,
        currentChecklist: Partial<ComplianceChecklistState> | null | undefined,
        key: 'valid_id' | 'income_verified'
    ) => {
        const previousChecklist: ComplianceChecklistState = latestChecklistRef.current[applicationId] ?? {
            valid_id: Boolean(currentChecklist?.valid_id),
            income_verified: Boolean(currentChecklist?.income_verified),
            application_completed: Boolean(currentChecklist?.application_completed),
            background_checked: Boolean(currentChecklist?.background_checked),
            payment_received: Boolean(currentChecklist?.payment_received),
            lease_signed: Boolean(currentChecklist?.lease_signed),
            inspection_done: Boolean(currentChecklist?.inspection_done),
        };

        if (!confirmedChecklistRef.current[applicationId]) {
            confirmedChecklistRef.current[applicationId] = previousChecklist;
        }

        const updatedChecklist: ComplianceChecklistState = {
            ...previousChecklist,
            [key]: !previousChecklist[key],
        };

        latestChecklistRef.current[applicationId] = updatedChecklist;
        triggerHaptic('light');

        setApplications((prev) =>
            prev.map((a) => (a.id === applicationId ? { ...a, complianceChecklist: updatedChecklist } : a))
        );
        setSelectedApp((prev) =>
            prev && prev.id === applicationId ? { ...prev, complianceChecklist: updatedChecklist } : prev
        );

        void flushChecklistSync(applicationId);
    };

    const handleConfirmPayment = async (applicationId: string, requestId: string) => {
        setReviewingPaymentId(requestId);
        triggerHaptic('medium');
        try {
            const res = await fetch(
                `/api/landlord/applications/${applicationId}/payment-requests/${requestId}/review`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'confirm' }),
                }
            );
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Could not confirm payment');
            toast.success(t('Payment confirmed!'));
            await fetchApplications();
        } catch (err: any) {
            toast.error(tr(err.message || 'Could not confirm payment. Please try again.'));
        } finally {
            setReviewingPaymentId(null);
        }
    };

    const handleSendSigningLink = async (applicationId: string) => {
        setSendingSigningLink(true);
        triggerHaptic('light');
        try {
            const res = await fetch(`/api/landlord/applications/${applicationId}/signing-link`, {
                method: 'POST',
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || 'Failed to send signing link');
            setSigningLinkFeedback({
                message: data.email_sent
                    ? t('Signing link sent to tenant email!')
                    : t('Signing link created. Share it below if needed.'),
                signingUrl: data.signing_url ?? null,
                emailSent: data.email_sent ?? false,
            });
            toast.success(t('Signing link ready!'));
            await fetchApplications();
        } catch (err: any) {
            toast.error(tr(err.message || 'Failed to send signing link.'));
        } finally {
            setSendingSigningLink(false);
        }
    };

    // Calculate metrics
    const metrics = useMemo(() => {
        const total = applications.length;
        const pendingCount = applications.filter(a => a.status === 'pending' || a.status === 'reviewing').length;
        const approvedCount = applications.filter(a => a.status === 'approved' || a.status === 'payment_pending').length;
        const rejectedCount = applications.filter(a => a.status === 'rejected').length;
        return { total, pendingCount, approvedCount, rejectedCount };
    }, [applications]);

    // Filtered list
    const filteredApps = useMemo(() => {
        let list = applications;

        if (activeTab === 'pending') {
            list = list.filter(a => a.status === 'pending' || a.status === 'reviewing');
        } else if (activeTab === 'approved') {
            list = list.filter(a => a.status === 'approved' || a.status === 'payment_pending');
        } else if (activeTab === 'rejected') {
            list = list.filter(a => a.status === 'rejected');
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(a => {
                const nameMatch = (a.applicant?.name || '').toLowerCase().includes(q);
                const unitMatch = (a.unitNumber || '').toLowerCase().includes(q);
                const propMatch = (a.propertyName || '').toLowerCase().includes(q);
                const occMatch = (a.applicant?.occupation || '').toLowerCase().includes(q);
                return nameMatch || unitMatch || propMatch || occMatch;
            });
        }

        return list;
    }, [applications, activeTab, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredApps.length / MOBILE_APPS_PAGE_SIZE));
    const safePage = Math.min(currentPage, totalPages);
    const pageStartIndex = (safePage - 1) * MOBILE_APPS_PAGE_SIZE;
    const paginatedApps = useMemo(
        () => filteredApps.slice(pageStartIndex, pageStartIndex + MOBILE_APPS_PAGE_SIZE),
        [filteredApps, pageStartIndex]
    );

    // Handle Quick Approve
    const handleQuickApprove = async () => {
        if (!selectedApp) return;
        const approvedSnapshot = selectedApp;
        setSubmittingAction(true);
        setApproveError(null);
        triggerHaptic('medium');

        try {
            const res = await fetch(`/api/landlord/applications/${selectedApp.id}/quick-approve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });

            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(data.error || t('Failed to approve application'));
            }

            toast.success(t('Application for {name} approved!', { name: approvedSnapshot.applicant.name }));
            setShowApproveConfirm(false);
            setSelectedApp(null);
            setDecisionMode(null);
            void fetchApplications();
            void loadUnits(true);

            const competing = Array.isArray(data.competing_applications) ? data.competing_applications : [];
            const matchedUnit = availableUnits.find(
                (u) => u.id === approvedSnapshot.unitId || (u.name === approvedSnapshot.unitNumber && u.property_id === approvedSnapshot.propertyId)
            );
            const resolvedUnitId = approvedSnapshot.unitId || matchedUnit?.id || '';
            if (competing.length > 0 && resolvedUnitId) {
                setResolveModalState({
                    isOpen: true,
                    takenUnitId: resolvedUnitId,
                    takenUnitName: approvedSnapshot.unitNumber,
                    propertyName: approvedSnapshot.propertyName,
                    propertyId: approvedSnapshot.propertyId ?? matchedUnit?.property_id ?? null,
                    winnerName: approvedSnapshot.applicant.name,
                    competingApplicants: competing,
                });
            }
        } catch (err: any) {
            console.error('Approve error:', err);
            const msg = tr(err.message || t('Action failed'));
            setApproveError(msg);
            toast.error(msg);
        } finally {
            setSubmittingAction(false);
        }
    };

    // Handle Decline / Reject
    const handleReject = async () => {
        if (!selectedApp) return;
        setSubmittingAction(true);
        triggerHaptic('medium');

        try {
            const res = await fetch(`/api/landlord/applications/${selectedApp.id}/actions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    status: 'rejected',
                    rejection_reason: rejectionReason.trim() || 'Application was not selected.'
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.error || t('Failed to decline application'));
            }

            toast.success(t('Application declined.'));
            setSelectedApp(null);
            setDecisionMode(null);
            setRejectionReason('');
            fetchApplications();
        } catch (err: any) {
            console.error('Reject error:', err);
            toast.error(tr(err.message || t('Action failed')));
        } finally {
            setSubmittingAction(false);
        }
    };

    return (
        <>
        <PullToRefresh onRefresh={fetchApplications}>
            <div className="flex flex-col gap-3.5 p-4 pb-20">
                {/* Property Scope & Refresh */}
                <div className="flex items-center justify-between gap-2">
                    <MobilePropertySelector className="flex-1" />
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            fetchApplications();
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-2xs"
                        aria-label={t("Refresh applications")}
                    >
                        <RefreshCw className={cn("size-4", loading && "animate-spin text-primary")} />
                    </button>
                </div>

                {/* Unified Summary & Filter Tiles */}
                <div className="grid grid-cols-4 gap-2" role="group" aria-label={t('Filter applications by status')}>
                    <button
                        type="button"
                        aria-pressed={activeTab === 'pending'}
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('pending');
                        }}
                        className={cn(
                            "min-h-[64px] p-2.5 rounded-2xl border flex flex-col justify-between text-left cursor-pointer active:scale-97 transition-all",
                            activeTab === 'pending'
                                ? "bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/35 shadow-xs"
                                : metrics.pendingCount > 0
                                  ? "bg-amber-500/8 border-amber-500/25 opacity-80 hover:opacity-100"
                                  : "bg-card border-slate-200 dark:border-white/10 opacity-75 hover:opacity-100"
                        )}
                    >
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide truncate w-full">
                            {t("Pending")}
                        </span>
                        <div className="flex items-center justify-between w-full mt-1">
                            <span className="text-xl font-black text-foreground tabular-nums leading-none">
                                {metrics.pendingCount}
                            </span>
                            {metrics.pendingCount > 0 && (
                                <span className="size-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                            )}
                        </div>
                    </button>

                    <button
                        type="button"
                        aria-pressed={activeTab === 'approved'}
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('approved');
                        }}
                        className={cn(
                            "min-h-[64px] p-2.5 rounded-2xl border flex flex-col justify-between text-left cursor-pointer active:scale-97 transition-all",
                            activeTab === 'approved'
                                ? "bg-emerald-500/15 border-emerald-600 ring-2 ring-emerald-500/35 shadow-xs"
                                : "bg-emerald-500/8 border-emerald-500/20 opacity-80 hover:opacity-100"
                        )}
                    >
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide truncate w-full">
                            {t("Approved")}
                        </span>
                        <span className="text-xl font-black text-foreground tabular-nums leading-none mt-1">
                            {metrics.approvedCount}
                        </span>
                    </button>

                    <button
                        type="button"
                        aria-pressed={activeTab === 'rejected'}
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('rejected');
                        }}
                        className={cn(
                            "min-h-[64px] p-2.5 rounded-2xl border flex flex-col justify-between text-left cursor-pointer active:scale-97 transition-all",
                            activeTab === 'rejected'
                                ? "bg-red-500/15 border-red-500 ring-2 ring-red-500/35 shadow-xs"
                                : "bg-red-500/8 border-red-500/20 opacity-80 hover:opacity-100"
                        )}
                    >
                        <span className="text-[10px] font-bold text-red-700 dark:text-red-300 uppercase tracking-wide truncate w-full">
                            {t("Declined")}
                        </span>
                        <span className="text-xl font-black text-foreground tabular-nums leading-none mt-1">
                            {metrics.rejectedCount}
                        </span>
                    </button>

                    <button
                        type="button"
                        aria-pressed={activeTab === 'all'}
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('all');
                        }}
                        className={cn(
                            "min-h-[64px] p-2.5 rounded-2xl border flex flex-col justify-between text-left cursor-pointer active:scale-97 transition-all",
                            activeTab === 'all'
                                ? "bg-primary/12 border-primary ring-2 ring-primary/30 shadow-xs"
                                : "bg-card border-slate-200 dark:border-white/10 opacity-80 hover:opacity-100"
                        )}
                    >
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide truncate w-full">
                            {t("All")}
                        </span>
                        <span className="text-xl font-black text-foreground tabular-nums leading-none mt-1">
                            {metrics.total}
                        </span>
                    </button>
                </div>

                {/* Live Search Input */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                    <input
                        type="text"
                        maxLength={60}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder={t("Search applicant, unit, or occupation...")}
                        className="w-full min-h-[48px] pl-10 pr-10 py-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
                    />
                    {searchQuery && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            aria-label={t('Clear search')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 size-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>

                {/* Applications Roster */}
                <div className="space-y-3">
                    {filteredApps.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col items-center gap-3">
                            <FileCheck className="size-10 text-muted-foreground/40 stroke-1" />
                            <div className="space-y-1">
                                <h4 className="text-sm font-bold text-foreground">{t("No Applications")}</h4>
                                <p className="text-xs text-muted-foreground max-w-xs">
                                    {searchQuery ? t('No applicants match your search filter.') : t('No applications found in this tab.')}
                                </p>
                            </div>
                            {(searchQuery || activeTab !== 'all') && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        triggerHaptic('light');
                                        setSearchQuery('');
                                        setActiveTab('all');
                                    }}
                                    className="min-h-[44px] px-4 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground cursor-pointer"
                                >
                                    {t('Clear Filters')}
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {paginatedApps.map((app) => {
                            const isPending = app.status === 'pending' || app.status === 'reviewing';
                            const isApproved = app.status === 'approved';
                            const isPaymentPending = app.status === 'payment_pending';

                            const unitKey = app.unitId || `${app.propertyId ?? ''}:${app.unitNumber}`;
                            const othersCount = Math.max(0, (activeApplicantsByUnitKey.get(unitKey)?.length ?? 1) - 1);
                            const unitObj = availableUnits.find(
                                (u) => u.id === app.unitId || (u.name === app.unitNumber && u.property_id === app.propertyId)
                            );
                            const roomLabel = formatRoomLabel(app.unitNumber);
                            const StatusIcon =
                                app.status === 'approved'
                                    ? CheckCircle2
                                    : app.status === 'payment_pending'
                                    ? Wallet
                                    : app.status === 'reviewing'
                                    ? Eye
                                    : app.status === 'pending'
                                    ? Clock
                                    : app.status === 'rejected'
                                    ? XCircle
                                    : AlertCircle;

                            const isExpanded = Boolean(expandedCardIds[app.id]);

                            return (
                                <div
                                    key={app.id}
                                    className={cn(
                                        "rounded-2xl bg-card border border-border/80 shadow-xs transition-all overflow-hidden",
                                        !isPending && !isApproved && !isPaymentPending && "opacity-85"
                                    )}
                                >
                                    {/* Collapsible Header Row */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            toggleCardExpanded(app.id);
                                        }}
                                        aria-expanded={isExpanded}
                                        className="w-full p-4 sm:p-5 flex items-start justify-between gap-3 text-left hover:bg-muted/25 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-start gap-3 min-w-0 flex-1">
                                            <div
                                                className="size-12 rounded-full flex items-center justify-center font-bold text-base shrink-0 border border-border/60"
                                                style={{ backgroundColor: app.applicant?.avatarBgColor || '#e2e8f0' }}
                                            >
                                                <span className="text-slate-800">
                                                    {(app.applicant?.name || 'A').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                                </span>
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-base font-bold text-foreground leading-snug">
                                                    {app.applicant?.name || t('Prospective Tenant')}
                                                </h3>
                                                <p className="text-sm text-muted-foreground leading-snug mt-0.5">
                                                    <span className="font-semibold text-foreground">{roomLabel}</span>
                                                    {' • '}
                                                    <span>{app.propertyName}</span>
                                                </p>

                                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                                    <span
                                                        className={cn(
                                                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border",
                                                            isPending
                                                                ? "bg-amber-500/12 border-amber-500/30 text-amber-800 dark:text-amber-300"
                                                                : isPaymentPending
                                                                ? "bg-violet-500/12 border-violet-500/30 text-violet-700 dark:text-violet-300"
                                                                : isApproved
                                                                ? "bg-emerald-500/12 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
                                                                : "bg-red-500/10 border-red-500/25 text-red-700 dark:text-red-300"
                                                        )}
                                                    >
                                                        <StatusIcon className="size-3.5 shrink-0" />
                                                        <span>{t(APPLICATION_STATUS_LABELS[app.status] ?? app.status)}</span>
                                                    </span>

                                                    {!isExpanded && othersCount > 0 && (
                                                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                                                            <Users className="size-3.5 shrink-0" />
                                                            <span>
                                                                {othersCount === 1
                                                                    ? t('1 other applicant')
                                                                    : t('{count} other applicants', { count: othersCount })}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <ChevronDown
                                            className={cn(
                                                "size-5 text-muted-foreground shrink-0 mt-1 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                                                isExpanded && "rotate-180"
                                            )}
                                        />
                                    </button>

                                    {/* Expanded Body */}
                                    <CollapsiblePanel isOpen={isExpanded}>
                                        <div className="border-t border-border/60 p-4 sm:p-5 pt-3.5 flex flex-col gap-3.5 bg-muted/10">
                                            {(othersCount > 0 || unitObj?.is_on_hold || (app.unitOffer?.status === 'pending' && app.unitOffer.target_unit_name)) && (
                                                <div className="flex flex-col gap-1.5">
                                                    {othersCount > 0 && (
                                                        <div className="flex items-center gap-2 rounded-xl bg-amber-500/12 border border-amber-500/30 px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                                                            <Users className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                                            <span>
                                                                {othersCount === 1
                                                                    ? t('1 other person also applied for {unit}', { unit: app.unitNumber })
                                                                    : t('{count} other people also applied for {unit}', { count: othersCount, unit: app.unitNumber })}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {unitObj?.is_on_hold && (
                                                        <div className="flex items-center gap-2 rounded-xl bg-amber-500/12 border border-amber-500/30 px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
                                                            <Lock className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                                            <span>{t('On hold for {name}', { name: unitObj.hold_info?.held_for_name || 'Applicant' })}</span>
                                                        </div>
                                                    )}
                                                    {app.unitOffer?.status === 'pending' && app.unitOffer.target_unit_name && (
                                                        <div className="flex items-center gap-2 rounded-xl bg-primary/10 border border-primary/25 px-3 py-2 text-xs font-semibold text-primary">
                                                            <ArrowRightLeft className="size-4 shrink-0" />
                                                            <span>{t('Offered {unit} — waiting for reply', { unit: app.unitOffer.target_unit_name })}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Clean 2x2 Key Info Grid */}
                                            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 p-3.5 rounded-xl bg-background border border-border/60">
                                                <div>
                                                    <span className="text-xs text-muted-foreground block">
                                                        {t("Work / Occupation")}
                                                    </span>
                                                    <span className="text-sm font-semibold text-foreground block truncate mt-0.5">
                                                        {app.applicant?.occupation || t('Not stated')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-muted-foreground block">
                                                        {t("Monthly Income")}
                                                    </span>
                                                    <span className="text-sm font-bold text-foreground tabular-nums block mt-0.5">
                                                        {formatCurrency(app.applicant?.monthlyIncome)}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-muted-foreground block">
                                                        {t("Room Rent")}
                                                    </span>
                                                    <span className="text-sm font-semibold text-foreground tabular-nums block mt-0.5">
                                                        {formatCurrency(app.monthlyRent)} / {t("mo")}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-muted-foreground block">
                                                        {t("Date Applied")}
                                                    </span>
                                                    <span className="text-sm font-medium text-foreground tabular-nums block mt-0.5">
                                                        {formatDate(app.submittedDate)}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Clear 2-Button Elderly-Friendly Footer (>= 48px height) */}
                                            <div className="flex items-center gap-2.5 pt-0.5">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        triggerHaptic('light');
                                                        setSelectedApp(app);
                                                    }}
                                                    className="flex-1 min-h-[48px] px-4 rounded-xl border border-border bg-background hover:bg-muted text-sm font-bold text-foreground flex items-center justify-center gap-1.5 active:scale-98 transition-all cursor-pointer"
                                                >
                                                    <span>{t('Review Details')}</span>
                                                    <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                                                </button>

                                                {isPending && (
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            triggerHaptic('medium');
                                                            setSelectedApp(app);
                                                            setApproveError(null);
                                                            setShowApproveConfirm(true);
                                                        }}
                                                        className="flex-1 min-h-[48px] px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-xs cursor-pointer"
                                                    >
                                                        <Check className="size-4 shrink-0" />
                                                        <span>{t('Approve')}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </CollapsiblePanel>
                                </div>
                            );
                        })}

                            {filteredApps.length > MOBILE_APPS_PAGE_SIZE && (
                                <div className="rounded-2xl bg-card border border-border/80 p-3.5 flex flex-col gap-3">
                                    <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
                                        <span className="tabular-nums">
                                            {t('Showing {start}–{end} of {total}', {
                                                start: pageStartIndex + 1,
                                                end: Math.min(pageStartIndex + MOBILE_APPS_PAGE_SIZE, filteredApps.length),
                                                total: filteredApps.length,
                                            })}
                                        </span>
                                        <span className="tabular-nums font-bold text-foreground">
                                            {t('Page {page} of {total}', { page: safePage, total: totalPages })}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2.5">
                                        <button
                                            type="button"
                                            disabled={safePage <= 1}
                                            onClick={() => {
                                                triggerHaptic('light');
                                                setCurrentPage((p) => Math.max(1, p - 1));
                                            }}
                                            className="min-h-[48px] px-4 rounded-xl border border-border bg-background text-sm font-bold text-foreground flex items-center justify-center gap-1.5 hover:bg-muted disabled:opacity-45 disabled:pointer-events-none transition-colors cursor-pointer"
                                        >
                                            <ChevronLeft className="size-4 shrink-0" />
                                            <span>{t('Previous')}</span>
                                        </button>
                                        <button
                                            type="button"
                                            disabled={safePage >= totalPages}
                                            onClick={() => {
                                                triggerHaptic('light');
                                                setCurrentPage((p) => Math.min(totalPages, p + 1));
                                            }}
                                            className="min-h-[48px] px-4 rounded-xl border border-border bg-background text-sm font-bold text-foreground flex items-center justify-center gap-1.5 hover:bg-muted disabled:opacity-45 disabled:pointer-events-none transition-colors cursor-pointer"
                                        >
                                            <span>{t('Next')}</span>
                                            <ChevronRight className="size-4 shrink-0" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </PullToRefresh>

        {/* DOSSIER & DECISION BOTTOM SHEET (portaled above BottomTabBar z-[60], below action modals z-[350]) */}
        {mounted && selectedApp && createPortal(
            <div
                className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
                onClick={() => {
                    setSelectedApp(null);
                    setDecisionMode(null);
                }}
                role="dialog"
                aria-modal="true"
                aria-label={t('Applicant Details')}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className="w-full sm:max-w-md max-h-[90dvh] bg-background rounded-t-3xl sm:rounded-3xl border border-border/70 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200"
                >
                    {/* Drag Handle */}
                    <div className="pt-2.5 pb-1 flex justify-center sm:hidden shrink-0">
                        <div className="h-1.5 w-11 rounded-full bg-muted-foreground/25" />
                    </div>

                    {/* Sticky Header */}
                    <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-4 border-b border-border/60 shrink-0">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                                className="size-12 rounded-full flex items-center justify-center font-bold text-base shrink-0 border border-border/60"
                                style={{ backgroundColor: selectedApp.applicant?.avatarBgColor || '#e2e8f0' }}
                            >
                                <span className="text-slate-800">
                                    {(selectedApp.applicant?.name || 'A').split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                                </span>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h3 className="text-base font-black text-foreground truncate">
                                        {selectedApp.applicant?.name}
                                    </h3>
                                    <span
                                        className={cn(
                                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0',
                                            selectedApp.status === 'pending' || selectedApp.status === 'reviewing'
                                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                                : selectedApp.status === 'approved' || selectedApp.status === 'payment_pending'
                                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                                                : 'bg-red-500/15 text-red-700 dark:text-red-300'
                                        )}
                                    >
                                        {t(APPLICATION_STATUS_LABELS[selectedApp.status] ?? selectedApp.status)}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                    <span className="font-semibold text-foreground">{formatRoomLabel(selectedApp.unitNumber)}</span>
                                    {' • '}
                                    {selectedApp.propertyName}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedApp(null);
                                setDecisionMode(null);
                            }}
                            className="size-10 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors shrink-0"
                            aria-label={t('Close')}
                        >
                            <X className="size-5" />
                        </button>
                    </div>

                    {/* Scrollable Body with Overflow Cue */}
                    <ScrollableWithHint
                        className="overscroll-contain"
                        contentClassName="px-5 py-4 space-y-4"
                        fadeColor="background"
                        resetKey={selectedApp.id}
                        hintText={t('More below • Scroll down')}
                    >
                        {/* Competing Applicants Alert (shown first when relevant) */}
                        {selectedApp.status !== 'approved' && selectedApp.status !== 'rejected' && selectedApp.status !== 'withdrawn' && (() => {
                            const unitKey = selectedApp.unitId || `${selectedApp.propertyId ?? ''}:${selectedApp.unitNumber}`;
                            const competingList = (activeApplicantsByUnitKey.get(unitKey) ?? []).filter((a) => a.id !== selectedApp.id);
                            const matchedUnit = availableUnits.find(
                                (u) => u.id === selectedApp.unitId || (u.name === selectedApp.unitNumber && u.property_id === selectedApp.propertyId)
                            );
                            const resolvedUnitId = selectedApp.unitId || matchedUnit?.id || '';

                            if (competingList.length === 0) return null;

                            return (
                                <div className="flex flex-col gap-2.5 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4">
                                    <div className="flex items-center gap-2.5">
                                        <Users className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                                        <p className="text-sm font-bold text-foreground leading-snug">
                                            {t('{count} other applicant(s) also applied for {unit}.', {
                                                count: competingList.length,
                                                unit: selectedApp.unitNumber,
                                            })}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setResolveModalState({
                                                isOpen: true,
                                                takenUnitId: resolvedUnitId,
                                                takenUnitName: selectedApp.unitNumber,
                                                propertyName: selectedApp.propertyName,
                                                propertyId: selectedApp.propertyId ?? matchedUnit?.property_id ?? null,
                                                competingApplicants: competingList.map((c) => ({
                                                    id: c.id,
                                                    name: c.applicant.name,
                                                    email: c.applicant.email,
                                                    status: c.status,
                                                    source: c.source,
                                                })),
                                            });
                                        }}
                                        className="w-full min-h-[44px] px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold transition-colors"
                                    >
                                        {t('View Other Applicants')}
                                    </button>
                                </div>
                            );
                        })()}

                        {/* Verification Checklist & Progress (Senior-Friendly Compliance Roadmap) */}
                        {(() => {
                            const progress = getApplicationProgress(selectedApp);
                            const idChecked = Boolean(selectedApp.complianceChecklist?.valid_id);
                            const incomeChecked = Boolean(selectedApp.complianceChecklist?.income_verified);

                            return (
                                <div className="rounded-2xl bg-muted/30 border border-border/60 p-4 space-y-3.5">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <ClipboardCheck className="size-4 text-primary shrink-0" />
                                            <h4 className="text-sm font-bold text-foreground truncate">
                                                {t('Verification Checklist')}
                                            </h4>
                                        </div>
                                        <span
                                            className={cn(
                                                'text-xs font-bold tabular-nums shrink-0',
                                                progress.percentage === 100
                                                    ? 'text-emerald-600 dark:text-emerald-400'
                                                    : 'text-primary'
                                            )}
                                        >
                                            {t('{completed} of {total} done', {
                                                completed: progress.completed,
                                                total: progress.total,
                                            })}
                                        </span>
                                    </div>

                                    <div className="h-2.5 w-full overflow-hidden rounded-full bg-background border border-border/60">
                                        <div
                                            data-no-theme-transition
                                            className={cn(
                                                'h-full rounded-full transition-[width,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                                                progress.percentage === 100 ? 'bg-emerald-500' : 'bg-primary'
                                            )}
                                            style={{ width: `${progress.percentage}%` }}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleChecklistItem(
                                                    selectedApp.id,
                                                    selectedApp.complianceChecklist,
                                                    'valid_id'
                                                )
                                            }
                                            aria-pressed={idChecked}
                                            className={cn(
                                                'min-h-[52px] px-3.5 py-2.5 rounded-xl border text-left transition-colors duration-150 flex items-center justify-between gap-2 cursor-pointer active:scale-[0.98]',
                                                idChecked
                                                    ? 'bg-emerald-500/12 border-emerald-500/35 text-emerald-800 dark:text-emerald-300'
                                                    : 'bg-background border-border text-foreground hover:bg-muted/40'
                                            )}
                                        >
                                            <span className="text-xs font-bold leading-snug">
                                                {t('Valid ID Checked')}
                                            </span>
                                            {idChecked ? (
                                                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            ) : (
                                                <span className="size-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleChecklistItem(
                                                    selectedApp.id,
                                                    selectedApp.complianceChecklist,
                                                    'income_verified'
                                                )
                                            }
                                            aria-pressed={incomeChecked}
                                            className={cn(
                                                'min-h-[52px] px-3.5 py-2.5 rounded-xl border text-left transition-colors duration-150 flex items-center justify-between gap-2 cursor-pointer active:scale-[0.98]',
                                                incomeChecked
                                                    ? 'bg-emerald-500/12 border-emerald-500/35 text-emerald-800 dark:text-emerald-300'
                                                    : 'bg-background border-border text-foreground hover:bg-muted/40'
                                            )}
                                        >
                                            <span className="text-xs font-bold leading-snug">
                                                {t('Income Checked')}
                                            </span>
                                            {incomeChecked ? (
                                                <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            ) : (
                                                <span className="size-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                                            )}
                                        </button>
                                    </div>

                                    {progress.missing.length > 0 && (
                                        <div className="rounded-xl border border-border/60 bg-background/80 overflow-hidden">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    triggerHaptic('light');
                                                    setShowMissingSteps((prev) => !prev);
                                                }}
                                                aria-expanded={showMissingSteps}
                                                className="w-full min-h-[44px] px-3.5 py-2 flex items-center justify-between gap-2 text-left hover:bg-muted/40 transition-colors cursor-pointer"
                                            >
                                                <span className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                                                    <AlertCircle className="size-3.5 shrink-0" />
                                                    {t("What's still needed ({count})", {
                                                        count: progress.missing.length,
                                                    })}
                                                </span>
                                                <ChevronDown
                                                    className={cn(
                                                        'size-4 text-muted-foreground shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                                                        showMissingSteps && 'rotate-180'
                                                    )}
                                                />
                                            </button>
                                            <CollapsiblePanel isOpen={showMissingSteps}>
                                                <ul className="border-t border-border/50 px-3.5 py-2.5 space-y-1.5">
                                                    {progress.missing.map((item) => (
                                                        <li
                                                            key={item}
                                                            className="flex items-center gap-2 text-xs font-medium text-muted-foreground"
                                                        >
                                                            <span className="size-1.5 rounded-full bg-amber-500/70 shrink-0" />
                                                            <span>{t(item)}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </CollapsiblePanel>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Move-In Payments & Receipts */}
                        {(selectedApp.status === 'payment_pending' ||
                            (selectedApp.preApprovalPayments && selectedApp.preApprovalPayments.length > 0)) && (() => {
                            const payments = selectedApp.preApprovalPayments ?? [];
                            const allCompleted =
                                payments.length > 0 && payments.every((p) => p.status === 'completed' || p.bypassed);
                            const hasUploadedProof = payments.some(
                                (p) => Boolean(p.proofUrl) && p.status !== 'completed' && !p.bypassed
                            );

                            return (
                                <div className="rounded-2xl bg-muted/30 border border-border/60 overflow-hidden text-sm">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setShowPaymentsSection((prev) => !prev);
                                        }}
                                        aria-expanded={showPaymentsSection}
                                        className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                                <Wallet className="size-4 text-violet-600 dark:text-violet-400 shrink-0" />
                                                {t('Move-In Payments')}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                                {allCompleted
                                                    ? t('All payments confirmed')
                                                    : hasUploadedProof
                                                      ? t('Receipt uploaded — please check')
                                                      : t('Waiting for applicant payment')}
                                            </p>
                                        </div>
                                        <ChevronDown
                                            className={cn(
                                                'size-5 text-muted-foreground shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                                                showPaymentsSection && 'rotate-180'
                                            )}
                                        />
                                    </button>

                                    <CollapsiblePanel isOpen={showPaymentsSection}>
                                        <div className="border-t border-border/60 p-3.5 space-y-3 bg-background/50">
                                            {payments.length === 0 ? (
                                                <p className="text-xs text-muted-foreground text-center py-2">
                                                    {t('No payment items requested yet.')}
                                                </p>
                                            ) : (
                                                payments.map((req) => {
                                                    const isConfirmed = req.status === 'completed' || req.bypassed;
                                                    const hasProof = Boolean(req.proofUrl);
                                                    return (
                                                        <div
                                                            key={req.id}
                                                            className={cn(
                                                                'rounded-xl border p-3.5 space-y-2.5 bg-background',
                                                                isConfirmed
                                                                    ? 'border-emerald-500/30'
                                                                    : hasProof
                                                                      ? 'border-violet-500/35'
                                                                      : 'border-border/70'
                                                            )}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div>
                                                                    <p className="text-xs font-semibold text-muted-foreground">
                                                                        {req.requirementType === 'advance_rent'
                                                                            ? t('First Month Advance Rent')
                                                                            : t('Security Deposit')}
                                                                    </p>
                                                                    <p className="text-base font-black text-foreground tabular-nums mt-0.5">
                                                                        {formatCurrency(req.amount)}
                                                                    </p>
                                                                </div>
                                                                <span
                                                                    className={cn(
                                                                        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border shrink-0',
                                                                        isConfirmed
                                                                            ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                                                            : hasProof
                                                                              ? 'bg-violet-500/12 border-violet-500/30 text-violet-700 dark:text-violet-300'
                                                                              : 'bg-amber-500/12 border-amber-500/30 text-amber-800 dark:text-amber-300'
                                                                    )}
                                                                >
                                                                    {isConfirmed ? (
                                                                        <CheckCircle2 className="size-3 shrink-0" />
                                                                    ) : (
                                                                        <Clock className="size-3 shrink-0" />
                                                                    )}
                                                                    <span>
                                                                        {isConfirmed
                                                                            ? req.bypassed
                                                                                ? t('Cash Bypassed')
                                                                                : t('Confirmed')
                                                                            : hasProof
                                                                              ? t('Receipt Uploaded')
                                                                              : t('Waiting Payment')}
                                                                    </span>
                                                                </span>
                                                            </div>

                                                            {(req.referenceNumber || req.transactionReference || req.method) && (
                                                                <p className="text-xs text-muted-foreground tabular-nums">
                                                                    {[
                                                                        req.method ? req.method.replace(/_/g, ' ').toUpperCase() : null,
                                                                        req.referenceNumber ? `${t('Ref')}: ${req.referenceNumber}` : null,
                                                                        !req.referenceNumber && req.transactionReference
                                                                            ? `${t('Ref')}: ${req.transactionReference}`
                                                                            : null,
                                                                    ]
                                                                        .filter(Boolean)
                                                                        .join(' • ')}
                                                                </p>
                                                            )}

                                                            {(req.proofUrl || !isConfirmed) && (
                                                                <div className="flex flex-wrap gap-2 pt-1">
                                                                    {req.proofUrl && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => {
                                                                                triggerHaptic('light');
                                                                                setPreviewUrl(req.proofUrl);
                                                                            }}
                                                                            className="flex-1 min-h-[44px] px-3 rounded-xl border border-border bg-background hover:bg-muted text-xs font-bold text-foreground flex items-center justify-center gap-1.5 cursor-pointer"
                                                                        >
                                                                            <Receipt className="size-3.5 text-primary shrink-0" />
                                                                            <span>{t('View Receipt')}</span>
                                                                        </button>
                                                                    )}
                                                                    {!isConfirmed && (
                                                                        <button
                                                                            type="button"
                                                                            disabled={reviewingPaymentId === req.id}
                                                                            onClick={() => handleConfirmPayment(selectedApp.id, req.id)}
                                                                            className="flex-1 min-h-[44px] px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                                                        >
                                                                            {reviewingPaymentId === req.id ? (
                                                                                <Loader2 className="size-3.5 animate-spin shrink-0" />
                                                                            ) : (
                                                                                <CheckCircle2 className="size-3.5 shrink-0" />
                                                                            )}
                                                                            <span>{t('Confirm Payment')}</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </CollapsiblePanel>
                                </div>
                            );
                        })()}

                        {/* Collapsible Applicant Details */}
                        <div className="rounded-2xl bg-muted/30 border border-border/60 overflow-hidden text-sm">
                            <button
                                type="button"
                                onClick={() => {
                                    triggerHaptic('light');
                                    setShowApplicantDetails((prev) => !prev);
                                }}
                                aria-expanded={showApplicantDetails}
                                className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-muted/40 transition-colors"
                            >
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-foreground">
                                        {t('Applicant Details')}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                                        {selectedApp.applicant?.occupation || t('Not stated')}
                                        {' • '}
                                        {formatCurrency(selectedApp.applicant?.monthlyIncome)}/mo
                                    </p>
                                </div>
                                <ChevronDown
                                    className={cn(
                                        'size-5 text-muted-foreground shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                                        showApplicantDetails && 'rotate-180'
                                    )}
                                />
                            </button>

                            <CollapsiblePanel isOpen={showApplicantDetails}>
                                <div className="border-t border-border/60 px-4 pb-3 pt-1 divide-y divide-border/50">
                                    <div className="flex justify-between items-center gap-4 py-2.5">
                                        <span className="text-muted-foreground shrink-0">{t('Occupation')}</span>
                                        <span className="font-semibold text-foreground text-right">
                                            {selectedApp.applicant?.occupation || t('Not stated')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4 py-2.5">
                                        <span className="text-muted-foreground shrink-0">{t('Monthly Income')}</span>
                                        <span className="font-black text-emerald-600 dark:text-emerald-400 tabular-nums text-right">
                                            {formatCurrency(selectedApp.applicant?.monthlyIncome)}
                                            {formatRatio(selectedApp.applicant?.monthlyIncome, selectedApp.monthlyRent) && (
                                                <span className="ml-1.5 text-xs font-bold text-muted-foreground">
                                                    ({formatRatio(selectedApp.applicant?.monthlyIncome, selectedApp.monthlyRent)})
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4 py-2.5">
                                        <span className="text-muted-foreground shrink-0">{t('Target Monthly Rent')}</span>
                                        <span className="font-black text-foreground tabular-nums text-right">
                                            {formatCurrency(selectedApp.monthlyRent)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4 py-2.5">
                                        <span className="text-muted-foreground shrink-0">{t('Requested Move-in')}</span>
                                        <span className="font-semibold text-foreground tabular-nums text-right">
                                            {formatDate(selectedApp.requestedMoveIn)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4 py-2.5">
                                        <span className="text-muted-foreground shrink-0">{t('Submitted On')}</span>
                                        <span className="font-semibold text-foreground tabular-nums text-right">
                                            {formatDate(selectedApp.submittedDate)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center gap-4 py-2.5">
                                        <span className="text-muted-foreground shrink-0">{t('How They Applied')}</span>
                                        <span className="font-semibold text-foreground text-right">
                                            {selectedApp.source === 'walk_in_application'
                                                ? t('Walk-in')
                                                : t('Online Invite Link')}
                                        </span>
                                    </div>
                                    {selectedApp.applicant?.phone && (
                                        <a
                                            href={`tel:${selectedApp.applicant.phone}`}
                                            onClick={() => triggerHaptic('light')}
                                            className="flex justify-between items-center gap-4 py-2.5 min-h-[44px] text-foreground hover:text-primary transition-colors"
                                        >
                                            <span className="text-muted-foreground shrink-0 flex items-center gap-1.5">
                                                <Phone className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                                {t('Phone')}
                                            </span>
                                            <span className="font-semibold tabular-nums text-right flex items-center gap-2 min-w-0">
                                                <span className="truncate">{selectedApp.applicant.phone}</span>
                                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                                                    {t('Call')}
                                                </span>
                                            </span>
                                        </a>
                                    )}
                                    {selectedApp.applicant?.email && (
                                        <a
                                            href={`mailto:${selectedApp.applicant.email}`}
                                            onClick={() => triggerHaptic('light')}
                                            className="flex justify-between items-center gap-4 py-2.5 min-h-[44px] text-foreground hover:text-primary transition-colors"
                                        >
                                            <span className="text-muted-foreground shrink-0 flex items-center gap-1.5">
                                                <Mail className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                                                {t('Email')}
                                            </span>
                                            <span className="font-semibold text-right flex items-center gap-2 min-w-0">
                                                <span className="truncate">{selectedApp.applicant.email}</span>
                                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 shrink-0">
                                                    {t('Send')}
                                                </span>
                                            </span>
                                        </a>
                                    )}
                                    {selectedApp.emergencyContact?.name && (
                                        <div className="flex justify-between items-start gap-4 py-2.5">
                                            <span className="text-muted-foreground shrink-0">{t('Emergency Contact')}</span>
                                            <div className="text-right min-w-0">
                                                <p className="font-semibold text-foreground">{selectedApp.emergencyContact.name}</p>
                                                {selectedApp.emergencyContact.phone && (
                                                    <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                                                        {selectedApp.emergencyContact.phone}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {selectedApp.reference?.name && (
                                        <div className="flex justify-between items-start gap-4 py-2.5">
                                            <span className="text-muted-foreground shrink-0">{t('Reference')}</span>
                                            <div className="text-right min-w-0">
                                                <p className="font-semibold text-foreground">{selectedApp.reference.name}</p>
                                                {selectedApp.reference.contact && (
                                                    <p className="text-xs text-muted-foreground tabular-nums mt-0.5">
                                                        {selectedApp.reference.contact}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {selectedApp.notes && (
                                        <div className="pt-2.5 space-y-1">
                                            <span className="text-muted-foreground block">{t('Applicant Notes')}</span>
                                            <p className="text-xs leading-relaxed text-foreground bg-background/80 rounded-xl p-2.5 border border-border/50">
                                                {selectedApp.notes}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </CollapsiblePanel>
                        </div>

                        {/* Uploaded Documents (Supporting Files) */}
                        <div className="rounded-2xl bg-muted/30 border border-border/60 overflow-hidden text-sm">
                            {selectedApp.documents && selectedApp.documents.length > 0 ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setShowDocumentsSection((prev) => !prev);
                                        }}
                                        aria-expanded={showDocumentsSection}
                                        className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-muted/40 transition-colors cursor-pointer"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                                <FileText className="size-4 text-primary shrink-0" />
                                                <span>
                                                    {t('Uploaded Documents ({count})', {
                                                        count: selectedApp.documents.length,
                                                    })}
                                                </span>
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {t('Tap to view IDs or proof files')}
                                            </p>
                                        </div>
                                        <ChevronDown
                                            className={cn(
                                                'size-5 text-muted-foreground shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                                                showDocumentsSection && 'rotate-180'
                                            )}
                                        />
                                    </button>
                                    <CollapsiblePanel isOpen={showDocumentsSection}>
                                        <div className="border-t border-border/60 p-3 space-y-2 bg-background/50">
                                            {selectedApp.documents.map((doc) => (
                                                <button
                                                    key={doc}
                                                    type="button"
                                                    onClick={() => {
                                                        triggerHaptic('light');
                                                        setPreviewUrl(doc);
                                                    }}
                                                    className="w-full min-h-[48px] px-3.5 py-2.5 rounded-xl border border-border bg-background hover:bg-muted/50 transition-colors flex items-center justify-between gap-3 text-left cursor-pointer"
                                                >
                                                    <span className="flex items-center gap-2.5 min-w-0">
                                                        <FileText className="size-4 text-primary shrink-0" />
                                                        <span className="text-xs font-bold text-foreground truncate">
                                                            {getDocumentLabel(doc)}
                                                        </span>
                                                    </span>
                                                    <span className="text-xs font-bold text-primary flex items-center gap-1 shrink-0">
                                                        <Eye className="size-3.5 shrink-0" />
                                                        {t('View')}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </CollapsiblePanel>
                                </>
                            ) : (
                                <div className="px-4 py-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
                                    <span className="flex items-center gap-2 font-semibold">
                                        <FileText className="size-4 shrink-0 opacity-60" />
                                        {t('Uploaded Documents')}
                                    </span>
                                    <span>{t('None uploaded')}</span>
                                </div>
                            )}
                        </div>

                        {/* Lease Contract Status (Shown for Approved Applications) */}
                        {selectedApp.status === 'approved' && (() => {
                            const leaseInfo = selectedApp.lease;
                            const statusMeta = leaseInfo
                                ? LEASE_STATUS_TEXT[leaseInfo.status] ?? {
                                      label: leaseInfo.status,
                                      description: 'View lease status in Leases.',
                                      tone: 'neutral' as const,
                                  }
                                : {
                                      label: 'Not Created Yet',
                                      description: 'Create and send the lease signing link when ready.',
                                      tone: 'amber' as const,
                                  };
                            const needsSigningLink =
                                !leaseInfo ||
                                leaseInfo.status === 'pending_signature' ||
                                leaseInfo.status === 'pending_tenant_signature';

                            return (
                                <div className="rounded-2xl bg-muted/30 border border-border/60 p-4 space-y-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-foreground flex items-center gap-1.5">
                                                <Shield className="size-4 text-primary shrink-0" />
                                                {t('Lease Contract')}
                                            </p>
                                            {leaseInfo && (
                                                <p className="text-xs text-muted-foreground font-mono mt-0.5">
                                                    {t('ID')}: {leaseInfo.id.slice(0, 8)}
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className={cn(
                                                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold border shrink-0',
                                                statusMeta.tone === 'emerald'
                                                    ? 'bg-emerald-500/12 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                                    : statusMeta.tone === 'amber'
                                                      ? 'bg-amber-500/12 border-amber-500/30 text-amber-800 dark:text-amber-300'
                                                      : 'bg-muted border-border text-muted-foreground'
                                            )}
                                        >
                                            {t(statusMeta.label)}
                                        </span>
                                    </div>

                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        {t(statusMeta.description)}
                                    </p>

                                    {needsSigningLink && (
                                        <button
                                            type="button"
                                            disabled={sendingSigningLink}
                                            onClick={() => handleSendSigningLink(selectedApp.id)}
                                            className="w-full min-h-[48px] px-4 rounded-xl bg-amber-500/15 border border-amber-500/35 text-amber-800 dark:text-amber-200 hover:bg-amber-500/25 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                                        >
                                            {sendingSigningLink ? (
                                                <Loader2 className="size-4 animate-spin shrink-0" />
                                            ) : (
                                                <Mail className="size-4 shrink-0" />
                                            )}
                                            <span>
                                                {leaseInfo?.status === 'pending_tenant_signature'
                                                    ? t('Resend Signing Link')
                                                    : t('Send Signing Link')}
                                            </span>
                                        </button>
                                    )}

                                    {signingLinkFeedback?.message && (
                                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 space-y-2">
                                            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                                                {signingLinkFeedback.message}
                                            </p>
                                            {signingLinkFeedback.signingUrl && (
                                                <a
                                                    href={signingLinkFeedback.signingUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary underline"
                                                >
                                                    <ExternalLink className="size-3.5 shrink-0" />
                                                    <span>{t('Open Signing Link')}</span>
                                                </a>
                                            )}
                                        </div>
                                    )}

                                    <Link
                                        href="/mobile/landlord/leases"
                                        className="w-full min-h-[44px] px-4 rounded-xl border border-border bg-background hover:bg-muted/50 text-xs font-bold text-foreground flex items-center justify-center gap-1.5 transition-colors"
                                    >
                                        <span>{t('Manage Leases')}</span>
                                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                                    </Link>
                                </div>
                            );
                        })()}

                        {/* Secondary Room Options (Collapsed by default for clean reading) */}
                        {selectedApp.status !== 'approved' && selectedApp.status !== 'rejected' && selectedApp.status !== 'withdrawn' && (() => {
                            const unitKey = selectedApp.unitId || `${selectedApp.propertyId ?? ''}:${selectedApp.unitNumber}`;
                            const competingList = (activeApplicantsByUnitKey.get(unitKey) ?? []).filter((a) => a.id !== selectedApp.id);
                            const matchedUnit = availableUnits.find(
                                (u) => u.id === selectedApp.unitId || (u.name === selectedApp.unitNumber && u.property_id === selectedApp.propertyId)
                            );
                            const resolvedUnitId = selectedApp.unitId || matchedUnit?.id || '';

                            return (
                                <div className="rounded-2xl border border-border/70 bg-muted/20 overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            setShowRoomOptions((prev) => !prev);
                                        }}
                                        aria-expanded={showRoomOptions}
                                        className="w-full min-h-[52px] px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-muted/40 transition-colors"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-foreground">
                                                {t('Other Actions')}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {t('Hold this room or offer another room')}
                                            </p>
                                        </div>
                                        <ChevronDown
                                            className={cn(
                                                'size-5 text-muted-foreground shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]',
                                                showRoomOptions && 'rotate-180'
                                            )}
                                        />
                                    </button>

                                    <CollapsiblePanel isOpen={showRoomOptions}>
                                        <div className="border-t border-border/60 p-3 grid grid-cols-1 gap-2 bg-background/50">
                                            {resolvedUnitId && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        triggerHaptic('light');
                                                        const unitApplicants = activeApplicantsByUnitKey.get(unitKey) ?? [];
                                                        const allCandidates = unitApplicants.some((a) => a.id === selectedApp.id)
                                                            ? unitApplicants
                                                            : [selectedApp, ...unitApplicants];
                                                        setUnitHoldModalState({
                                                            isOpen: true,
                                                            unitId: resolvedUnitId,
                                                            unitName: selectedApp.unitNumber,
                                                            propertyName: selectedApp.propertyName,
                                                            applicantOptions: allCandidates.map((a) => ({
                                                                id: a.id,
                                                                name: a.applicant.name,
                                                                subtitle: a.applicant.email || a.applicant.phone || null,
                                                                status:
                                                                    a.status === 'pending'
                                                                        ? t('Pending')
                                                                        : a.status === 'reviewing'
                                                                          ? t('Under Review')
                                                                          : a.status,
                                                            })),
                                                            defaultApplicantName: selectedApp.applicant.name,
                                                            defaultApplicationId: selectedApp.id,
                                                            competingApplicantsCount: competingList.length,
                                                            existingHold: matchedUnit?.hold_info ?? null,
                                                        });
                                                    }}
                                                    className="min-h-[48px] px-4 rounded-xl border border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-sm font-bold flex items-center justify-center gap-2 active:scale-98 transition-all"
                                                >
                                                    <Lock className="size-4 shrink-0" />
                                                    <span>{matchedUnit?.is_on_hold ? t('Manage Room Hold') : t('Hold Room')}</span>
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    triggerHaptic('light');
                                                    setResolveModalState({
                                                        isOpen: true,
                                                        takenUnitId: resolvedUnitId,
                                                        takenUnitName: selectedApp.unitNumber,
                                                        propertyName: selectedApp.propertyName,
                                                        propertyId: selectedApp.propertyId ?? matchedUnit?.property_id ?? null,
                                                        competingApplicants: [
                                                            {
                                                                id: selectedApp.id,
                                                                name: selectedApp.applicant.name,
                                                                email: selectedApp.applicant.email,
                                                                status: selectedApp.status,
                                                                source: selectedApp.source,
                                                            },
                                                        ],
                                                    });
                                                }}
                                                className="min-h-[48px] px-4 rounded-xl border border-border bg-background text-foreground text-sm font-bold flex items-center justify-center gap-2 hover:bg-muted/50 active:scale-98 transition-all"
                                            >
                                                <ArrowRightLeft className="size-4 shrink-0" />
                                                <span>{t('Offer Another Room')}</span>
                                            </button>
                                        </div>
                                    </CollapsiblePanel>
                                </div>
                            );
                        })()}

                        {/* Rejection Form Mode */}
                        {decisionMode === 'reject' && (
                            <div className="space-y-1.5 animate-in fade-in duration-150">
                                <label
                                    htmlFor="mobile-decline-reason"
                                    className="text-xs font-bold text-muted-foreground"
                                >
                                    {t('Reason for Declining (Sent to Applicant)')}
                                </label>
                                <textarea
                                    id="mobile-decline-reason"
                                    value={rejectionReason}
                                    maxLength={250}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    rows={3}
                                    placeholder={t('e.g., Unit is currently under exclusive hold, or income requirements not met.')}
                                    className="w-full p-3 rounded-xl bg-card border border-border text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary scroll-mb-8"
                                />
                                <div className="flex justify-end">
                                    <span className="text-[11px] text-muted-foreground tabular-nums">
                                        {rejectionReason.length} / 250
                                    </span>
                                </div>
                            </div>
                        )}
                    </ScrollableWithHint>

                    {/* Sticky Pinned Footer */}
                    {(selectedApp.status === 'pending' ||
                        selectedApp.status === 'reviewing' ||
                        selectedApp.status === 'payment_pending') && (
                        <div className="border-t border-border/60 bg-background px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] shrink-0">
                            <div className="flex items-center gap-2.5">
                                {decisionMode === 'reject' ? (
                                    <>
                                        <button
                                            type="button"
                                            disabled={submittingAction}
                                            onClick={() => setDecisionMode(null)}
                                            className="flex-1 h-12 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground active:scale-98 transition-all"
                                        >
                                            {t('Back')}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={submittingAction}
                                            onClick={handleReject}
                                            className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                        >
                                            {submittingAction ? <RefreshCw className="size-4 animate-spin" /> : t('Confirm Decline')}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                triggerHaptic('medium');
                                                setApproveError(null);
                                                setShowApproveConfirm(true);
                                            }}
                                            className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-xs"
                                        >
                                            <Check className="size-4" />
                                            {t('Approve')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                triggerHaptic('light');
                                                setDecisionMode('reject');
                                            }}
                                            className="h-12 px-5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold active:scale-98 transition-all"
                                        >
                                            {t('Decline')}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>,
            document.body
        )}

        {selectedApp && (() => {
            const unitKey = selectedApp.unitId || `${selectedApp.propertyId ?? ''}:${selectedApp.unitNumber}`;
            const competingCount = (activeApplicantsByUnitKey.get(unitKey) ?? []).filter((a) => a.id !== selectedApp.id).length;
            return (
                <ApproveConfirmationModal
                    isOpen={showApproveConfirm}
                    onClose={() => {
                        if (!submittingAction) {
                            setShowApproveConfirm(false);
                            setApproveError(null);
                        }
                    }}
                    onConfirm={handleQuickApprove}
                    submitting={submittingAction}
                    applicantName={selectedApp.applicant?.name || t('Applicant')}
                    applicantOccupation={selectedApp.applicant?.occupation}
                    monthlyIncomeFormatted={selectedApp.applicant?.monthlyIncome ? formatCurrency(selectedApp.applicant.monthlyIncome) : null}
                    propertyName={selectedApp.propertyName}
                    unitLabel={formatRoomLabel(selectedApp.unitNumber)}
                    monthlyRentFormatted={formatCurrency(selectedApp.monthlyRent)}
                    competingApplicantsCount={competingCount}
                    errorMessage={approveError}
                />
            );
        })()}

        {unitHoldModalState && (
            <UnitHoldModal
                isOpen={unitHoldModalState.isOpen}
                onClose={() => setUnitHoldModalState(null)}
                unitId={unitHoldModalState.unitId}
                unitName={unitHoldModalState.unitName}
                propertyName={unitHoldModalState.propertyName}
                applicantOptions={unitHoldModalState.applicantOptions}
                defaultApplicantName={unitHoldModalState.defaultApplicantName}
                defaultApplicationId={unitHoldModalState.defaultApplicationId}
                competingApplicantsCount={unitHoldModalState.competingApplicantsCount}
                existingHold={unitHoldModalState.existingHold}
                onHoldUpdated={(updatedUnitId, newHoldInfo) => {
                    setAvailableUnits((prev) =>
                        prev.map((u) =>
                            u.id === updatedUnitId
                                ? { ...u, is_on_hold: Boolean(newHoldInfo), hold_info: newHoldInfo }
                                : u
                        )
                    );
                    void loadUnits(true);
                    toast.success(
                        newHoldInfo
                            ? t('Room placed on hold for {name}.', { name: newHoldInfo.held_for_name })
                            : t('Room hold released. The room is vacant again.')
                    );
                }}
            />
        )}

        {resolveModalState && (
            <ResolveCompetingApplicantsModal
                isOpen={resolveModalState.isOpen}
                onClose={() => setResolveModalState(null)}
                takenUnitId={resolveModalState.takenUnitId}
                takenUnitName={resolveModalState.takenUnitName}
                propertyName={resolveModalState.propertyName}
                propertyId={resolveModalState.propertyId}
                winnerName={resolveModalState.winnerName}
                competingApplicants={resolveModalState.competingApplicants}
                availableUnits={availableUnits}
                onResolved={() => {
                    void fetchApplications();
                    void loadUnits(true);
                }}
            />
        )}

        {mounted && previewUrl && createPortal(
            <div
                className="fixed inset-0 z-[360] flex flex-col bg-black/90 backdrop-blur-sm animate-in fade-in duration-150"
                role="dialog"
                aria-modal="true"
                aria-label={getDocumentLabel(previewUrl)}
                onClick={() => setPreviewUrl(null)}
            >
                <div
                    className="flex items-center justify-between gap-3 px-4 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-3 border-b border-white/15 bg-black/70 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <p className="text-sm font-bold text-white truncate min-w-0">
                        {getDocumentLabel(previewUrl)}
                    </p>
                    <div className="flex items-center gap-2 shrink-0">
                        <a
                            href={previewUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="min-h-[44px] px-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                        >
                            <ExternalLink className="size-4 shrink-0" />
                            <span>{t('Open')}</span>
                        </a>
                        <button
                            type="button"
                            onClick={() => setPreviewUrl(null)}
                            aria-label={t('Close')}
                            className="size-11 rounded-xl bg-red-500/20 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                        >
                            <X className="size-5" />
                        </button>
                    </div>
                </div>
                <div
                    className="flex-1 p-4 flex items-center justify-center overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {previewUrl.toLowerCase().split('?')[0]?.endsWith('.pdf') ? (
                        <iframe
                            src={previewUrl}
                            title={getDocumentLabel(previewUrl)}
                            className="w-full h-full rounded-2xl border border-white/15 bg-white"
                        />
                    ) : (
                        <img
                            src={previewUrl}
                            alt={getDocumentLabel(previewUrl)}
                            className="max-h-full max-w-full object-contain rounded-xl"
                        />
                    )}
                </div>
            </div>,
            document.body
        )}
        </>
    );
}
