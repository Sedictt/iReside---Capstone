"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
    Building2,
    Calendar,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Clock,
    Copy,
    DoorClosed,
    Globe,
    Handshake,
    History,
    Link2,
    MapPin,
    Plus,
    QrCode,
    RefreshCw,
    Users,
    X,
    XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { useAppToast } from "@/hooks/useAppToast";
import { useFormValidation } from "@/hooks/useFormValidation";
import { FieldError, fieldErrorClass } from "@/components/ui/field-error";
import { moneyRule, parseNumericInput } from "@/lib/validation/rules";
import { inviteExpiryRule } from "@/lib/validation/schemas/tenant-lifecycle.schema";
import { useLanguageContext } from "@/context/LanguageContext";
import {
    calculatePaymentPreview,
    type InvitePaymentTerms,
    type PaymentPreview,
} from "@/lib/tenant-invite-payment-terms";
import { tr } from "@/hooks/useLanguage";

type InviteMode = "property" | "unit";
type InviteApplicationType = "online" | "face_to_face";
type InviteRequirementKey =
    | "valid_id"
    | "proof_of_income"
    | "application_form"
    | "move_in_payment";

type UnitOption = {
    id: string;
    name: string;
    rent_amount: number;
    property_id: string;
    property_name: string;
    property_contract_template?: Record<string, unknown> | null;
    status?: string;
};

export type InviteListItem = {
    id: string;
    mode: InviteMode;
    applicationType: InviteApplicationType;
    requiredRequirements: string[];
    paymentTerms?: InvitePaymentTerms | null;
    status: string;
    propertyId: string;
    propertyName: string;
    unitId: string | null;
    unitName: string | null;
    expiresAt: string | null;
    useCount: number;
    maxUses: number;
    lastUsedAt: string | null;
    createdAt: string;
    paymentPreview?: PaymentPreview;
    shareUrl: string;
    qrUrl: string;
};

const REQUIREMENT_OPTIONS: Array<{ key: InviteRequirementKey; label: string }> = [
    { key: "valid_id", label: "Valid ID" },
    { key: "proof_of_income", label: "Proof of Income" },
];

const VALID_ID_TOOLTIP =
    "Accepted valid IDs: Passport, Driver's License, UMID, PhilSys/National ID, PRC ID, Postal ID, Voter's ID, Senior Citizen ID.";

const EXPIRY_PRESETS = [
    { label: "1 Day", days: 1 },
    { label: "7 Days", days: 7 },
    { label: "30 Days", days: 30 },
];

const USE_LIMIT_PRESETS = [
    { label: "1 Person", value: 1 },
    { label: "3 People", value: 3 },
    { label: "5 People", value: 5 },
    { label: "10 People", value: 10 },
];

const HISTORY_PAGE_SIZE = 4;

function computeExpiryIsoLocal(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const tz = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

function formatReadableDate(isoString: string | null | undefined): string {
    if (!isoString) return "No expiration";
    const parsed = new Date(isoString);
    if (Number.isNaN(parsed.getTime())) return "No expiration";
    return parsed.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getInviteStatusMeta(status: string): {
    label: string;
    badgeClass: string;
    icon: typeof CheckCircle2;
} {
    switch (status) {
        case "active":
            return {
                label: "Active",
                badgeClass: "bg-emerald-700 text-white dark:bg-emerald-800",
                icon: CheckCircle2,
            };
        case "consumed":
            return {
                label: "Used Up",
                badgeClass: "bg-muted text-foreground border border-border",
                icon: Users,
            };
        case "expired":
            return {
                label: "Expired",
                badgeClass: "bg-amber-600 text-white dark:bg-amber-800",
                icon: Clock,
            };
        case "revoked":
            return {
                label: "Turned Off",
                badgeClass: "bg-rose-700 text-white dark:bg-rose-800",
                icon: XCircle,
            };
        default:
            return {
                label: status,
                badgeClass: "bg-muted text-muted-foreground",
                icon: Clock,
            };
    }
}

export function TenantInviteManager({
    availableUnits,
    invites,
    onRefresh,
    embedded = false,
}: {
    availableUnits: UnitOption[];
    invites: InviteListItem[];
    onRefresh: () => void;
    embedded?: boolean;
}) {
    const { t } = useLanguageContext();
    const tOpt = (message?: string) => (message ? t(message) : message);
    const toast = useAppToast();

    // Top-level navigation tabs: Create vs Past Links
    const [activeTab, setActiveTab] = useState<"create" | "history">("create");

    // Step 1: Property & Room
    const [propertyId, setPropertyId] = useState("");
    const [mode, setMode] = useState<InviteMode>("property");
    const [unitId, setUnitId] = useState("");
    const [unitQuery, setUnitQuery] = useState("");
    const [isUnitMenuOpen, setIsUnitMenuOpen] = useState(false);
    const [isFilteringUnits, setIsFilteringUnits] = useState(false);
    const [highlightedUnitIndex, setHighlightedUnitIndex] = useState<number>(-1);
    const [previewUnitId, setPreviewUnitId] = useState("");
    const unitComboboxRef = useRef<HTMLDivElement>(null);

    // Step 2: Application Method
    const [applicationType, setApplicationType] = useState<InviteApplicationType>("face_to_face");
    const [requiredRequirements, setRequiredRequirements] = useState<InviteRequirementKey[]>([
        "valid_id",
        "proof_of_income",
    ]);

    // Step 3: Link Limits & Expiration
    const [maxUses, setMaxUses] = useState<number>(1);
    const [isCustomUses, setIsCustomUses] = useState<boolean>(false);
    const [customUsesInput, setCustomUsesInput] = useState<string>("1");
    const [activePreset, setActivePreset] = useState<number | null>(7);
    const [isCustomExpiry, setIsCustomExpiry] = useState<boolean>(false);
    const [expiresAt, setExpiresAt] = useState(() => computeExpiryIsoLocal(7));

    // Collapsible Move-In Payment Terms
    const [showPaymentEditor, setShowPaymentEditor] = useState<boolean>(false);
    const [advanceMonths, setAdvanceMonths] = useState<number>(1);
    const [securityDepositMonths, setSecurityDepositMonths] = useState<number>(1);
    const [customAdvance, setCustomAdvance] = useState<string>("");
    const [customDeposit, setCustomDeposit] = useState<string>("");

    // Submission & Result state
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [freshInvite, setFreshInvite] = useState<InviteListItem | null>(null);
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [copiedUrl, setCopiedUrl] = useState(false);

    // History filters, pagination, revoke & QR preview
    const [historyFilter, setHistoryFilter] = useState<"all" | "active" | "inactive">("all");
    const [historyPage, setHistoryPage] = useState<number>(1);
    const [revokingId, setRevokingId] = useState<string | null>(null);

    const resultRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (freshInvite && typeof resultRef.current?.scrollIntoView === "function") {
            resultRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [freshInvite]);

    const properties = useMemo(() => {
        const map = new Map<string, { id: string; name: string }>();
        for (const unit of availableUnits) {
            map.set(unit.property_id, {
                id: unit.property_id,
                name: unit.property_name,
            });
        }
        return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [availableUnits]);

    useEffect(() => {
        if (properties.length > 0 && !propertyId) {
            setPropertyId(properties[0].id);
        }
    }, [properties, propertyId]);

    const propertyUnits = useMemo(
        () =>
            availableUnits
                .filter((unit) => unit.property_id === propertyId && (unit.status ?? "vacant") === "vacant")
                .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })),
        [availableUnits, propertyId]
    );

    useEffect(() => {
        if (propertyUnits.length > 0 && !previewUnitId) {
            setPreviewUnitId(propertyUnits[0].id);
        }
    }, [propertyUnits, previewUnitId]);

    const selectedProperty = useMemo(
        () => properties.find((p) => p.id === propertyId) ?? null,
        [properties, propertyId]
    );

    const selectedUnit = useMemo(
        () => propertyUnits.find((u) => u.id === unitId) ?? null,
        [propertyUnits, unitId]
    );

    const filteredPropertyUnits = useMemo(() => {
        if (!isFilteringUnits) return propertyUnits;
        const q = unitQuery.trim().toLowerCase();
        if (!q) return propertyUnits;
        return propertyUnits.filter((unit) => {
            const nameMatch = unit.name.toLowerCase().includes(q);
            const rentMatch = String(unit.rent_amount ?? "").includes(q);
            return nameMatch || rentMatch;
        });
    }, [propertyUnits, unitQuery, isFilteringUnits]);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (unitComboboxRef.current && !unitComboboxRef.current.contains(event.target as Node)) {
                setIsUnitMenuOpen(false);
                setHighlightedUnitIndex(-1);
            }
        };
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    const effectiveMaxUses = useMemo(() => {
        if (!isCustomUses) return maxUses;
        const parsed = Number.parseInt(customUsesInput, 10);
        if (!Number.isFinite(parsed) || parsed < 1) return 0;
        return Math.min(100, parsed);
    }, [isCustomUses, maxUses, customUsesInput]);

    const currentPaymentTerms = useMemo<InvitePaymentTerms>(() => {
        const parseCustom = (raw: string) => {
            const value = parseNumericInput(raw);
            return value !== null && Number.isFinite(value) ? value : null;
        };
        return {
            advanceMonths,
            securityDepositMonths,
            customAdvanceAmount: advanceMonths === -1 ? parseCustom(customAdvance) : null,
            customSecurityDepositAmount: securityDepositMonths === -1 ? parseCustom(customDeposit) : null,
        };
    }, [advanceMonths, securityDepositMonths, customAdvance, customDeposit]);

    const inviteForm = useFormValidation(
        { customAdvance, customDeposit, expiresAt, advanceMonths, securityDepositMonths },
        {
            customAdvance: (value, all) =>
                all.advanceMonths === -1 ? moneyRule(value, { label: "Custom advance amount" }) : undefined,
            customDeposit: (value, all) =>
                all.securityDepositMonths === -1 ? moneyRule(value, { label: "Custom security deposit" }) : undefined,
            expiresAt: (value) => inviteExpiryRule(value),
        }
    );

    const currentPaymentPreview = useMemo(() => {
        const activePreviewUnitId = mode === "unit" ? unitId : previewUnitId;
        const unit = activePreviewUnitId ? propertyUnits.find((item) => item.id === activePreviewUnitId) : null;
        const fallback = unit?.rent_amount ?? propertyUnits[0]?.rent_amount ?? 0;
        const template = unit?.property_contract_template ?? propertyUnits[0]?.property_contract_template ?? null;
        return calculatePaymentPreview({
            monthlyRent: Number(fallback ?? 0),
            terms: currentPaymentTerms,
            contractTemplate: template,
        });
    }, [mode, previewUnitId, propertyUnits, unitId, currentPaymentTerms]);

    const showPaymentPreview =
        Boolean(propertyId) && (mode === "unit" ? Boolean(unitId) : Boolean(previewUnitId || propertyUnits.length > 0));

    const filteredInvites = useMemo(() => {
        if (historyFilter === "active") {
            return invites.filter((item) => item.status === "active");
        }
        if (historyFilter === "inactive") {
            return invites.filter((item) => item.status !== "active");
        }
        return invites;
    }, [invites, historyFilter]);

    const totalHistoryPages = Math.max(1, Math.ceil(filteredInvites.length / HISTORY_PAGE_SIZE));
    const safeHistoryPage = Math.min(historyPage, totalHistoryPages);
    const paginatedInvites = useMemo(() => {
        const start = (safeHistoryPage - 1) * HISTORY_PAGE_SIZE;
        return filteredInvites.slice(start, start + HISTORY_PAGE_SIZE);
    }, [filteredInvites, safeHistoryPage]);

    useEffect(() => {
        setHistoryPage(1);
    }, [historyFilter]);

    const createInvite = async () => {
        if (!propertyId) {
            toast.error(t("Please select a property first."));
            return;
        }
        if (mode === "unit" && !unitId) {
            toast.error(t("Please choose which vacant room this link is for."));
            return;
        }
        if (applicationType === "online" && requiredRequirements.length === 0) {
            toast.error(t("Please select at least one document for online applicants."));
            return;
        }
        if (effectiveMaxUses < 1 || effectiveMaxUses > 100) {
            toast.error(t("Please enter a valid number of uses between 1 and 100."));
            return;
        }
        if (submitting) return;
        if (!inviteForm.validateAll()) {
            toast.error(
                t(
                    inviteForm.errors.customAdvance ||
                        inviteForm.errors.customDeposit ||
                        inviteForm.errors.expiresAt ||
                        "Please fix the highlighted fields."
                )
            );
            return;
        }

        setSubmitting(true);
        setError(null);
        setFreshInvite(null);
        try {
            const response = await fetch("/api/landlord/invites", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    mode,
                    applicationType,
                    requiredRequirements,
                    propertyId,
                    unitId: mode === "unit" ? unitId : null,
                    previewUnitId: mode === "property" ? previewUnitId : null,
                    maxUses: effectiveMaxUses,
                    paymentTerms: currentPaymentTerms,
                    expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
                }),
            });
            const payload = (await response.json().catch(() => ({}))) as {
                error?: string;
                invite?: InviteListItem;
                fieldErrors?: Record<string, string>;
            };
            if (!response.ok || !payload.invite) {
                if (payload.fieldErrors) {
                    const mapped: Record<string, string> = {};
                    const advanceError = payload.fieldErrors["paymentTerms.customAdvanceAmount"];
                    const depositError = payload.fieldErrors["paymentTerms.customSecurityDepositAmount"];
                    if (advanceError) mapped.customAdvance = advanceError;
                    if (depositError) mapped.customDeposit = depositError;
                    if (payload.fieldErrors.expiresAt) mapped.expiresAt = payload.fieldErrors.expiresAt;
                    inviteForm.setServerErrors(mapped);
                }
                throw new Error(payload.error || "Failed to create invite.");
            }
            setFreshInvite(payload.invite);
            toast.success(t("Invite link and QR code are ready to share!"));
            onRefresh();
        } catch (createError) {
            const errorMsg = t(createError instanceof Error ? createError.message : "Failed to create invite.");
            setError(tr(errorMsg));
            toast.error(tr(errorMsg));
        } finally {
            setSubmitting(false);
        }
    };

    const revokeInvite = async (id: string) => {
        try {
            const response = await fetch(`/api/landlord/invites/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: "revoked" }),
            });
            if (!response.ok) {
                throw new Error("Failed to turn off invite link.");
            }
            toast.success(t("Invite link has been turned off."));
            onRefresh();
        } catch (revokeError) {
            const errorMsg = t(revokeError instanceof Error ? revokeError.message : "Failed to turn off invite link.");
            setError(tr(errorMsg));
            toast.error(tr(errorMsg));
        }
    };

    const copyLink = async (url: string, id?: string) => {
        try {
            await navigator.clipboard.writeText(url);
            if (id) {
                setCopiedId(id);
                setTimeout(() => setCopiedId(null), 1500);
            } else {
                setCopiedUrl(true);
                setTimeout(() => setCopiedUrl(false), 1500);
            }
            toast.success(t("Link copied! You can paste and send it now."));
        } catch {
            toast.error(t("Failed to copy link."));
        }
    };

    const paymentSummaryText = useMemo(() => {
        const adv =
            advanceMonths === 0
                ? t("No advance")
                : advanceMonths === -1
                    ? `PHP ${currentPaymentPreview.advanceAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${t("advance")}`
                    : `${advanceMonths} ${t("mo advance")}`;
        const dep =
            securityDepositMonths === 0
                ? t("No deposit")
                : securityDepositMonths === -1
                    ? `PHP ${currentPaymentPreview.securityDepositAmount.toLocaleString("en-US", { maximumFractionDigits: 0 })} ${t("deposit")}`
                    : `${securityDepositMonths} ${t("mo deposit")}`;
        return `${adv} · ${dep}`;
    }, [advanceMonths, securityDepositMonths, currentPaymentPreview, t]);

    return (
        <section className={cn(!embedded && "mb-8 rounded-2xl border border-border bg-card p-5 sm:p-7")}>
            {/* Header & Primary Navigation */}
            <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
                {!embedded ? (
                    <div>
                        <h2 className="text-xl font-bold text-foreground sm:text-2xl text-balance">
                            {t("Invite a Tenant")}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground text-pretty">
                            {t("Create a private link or QR code so a future tenant can apply.")}
                        </p>
                    </div>
                ) : (
                    <p className="text-sm font-medium text-muted-foreground">
                        {t("Choose who can use the link, then tap Create Invite Link.")}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-2">
                    <div
                        role="tablist"
                        aria-label={t("Invite sections")}
                        className="grid flex-1 grid-cols-2 gap-1 rounded-xl border border-border bg-muted p-1 sm:flex-none"
                    >
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "create"}
                            onClick={() => setActiveTab("create")}
                            className={cn(
                                "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors",
                                activeTab === "create"
                                    ? "bg-background text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Plus className="size-4 shrink-0" />
                            <span>{t("Create Link")}</span>
                        </button>
                        <button
                            type="button"
                            role="tab"
                            aria-selected={activeTab === "history"}
                            onClick={() => setActiveTab("history")}
                            className={cn(
                                "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors",
                                activeTab === "history"
                                    ? "bg-background text-foreground shadow-xs"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <History className="size-4 shrink-0" />
                            <span>{t("Past Links ({count})", { count: invites.length })}</span>
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={onRefresh}
                        aria-label={t("Refresh invites")}
                        title={t("Refresh")}
                        className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-background px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted active:scale-95"
                    >
                        <RefreshCw className="size-4" />
                        <span className="hidden sm:inline">{t("Refresh")}</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm font-semibold text-rose-700 dark:text-rose-300">
                    {error}
                </div>
            )}

            {/* TAB 1: CREATE INVITE LINK */}
            {activeTab === "create" && (
                <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
                    {/* Left Column: 3 Simple Steps */}
                    <div className="space-y-6">
                        {/* Step 1: Property & Room */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                    1
                                </span>
                                <h3 className="text-base font-bold text-foreground">
                                    {t("Which property and room?")}
                                </h3>
                            </div>

                            <div className="space-y-4 pl-0 sm:pl-9">
                                <div className="space-y-1.5">
                                    <label htmlFor="select-property" className="block text-sm font-semibold text-foreground">
                                        {t("Property")}
                                    </label>
                                    <div className="relative">
                                        <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                        <select
                                            id="select-property"
                                            value={propertyId}
                                            onChange={(event) => {
                                                setPropertyId(event.target.value);
                                                setUnitId("");
                                                setUnitQuery("");
                                                setIsUnitMenuOpen(false);
                                                setPreviewUnitId("");
                                            }}
                                            className="h-12 w-full appearance-none rounded-xl border border-border bg-background pl-10 pr-10 text-base font-medium text-foreground outline-none transition-colors hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/30"
                                        >
                                            <option value="" disabled>{t("Choose a property...")}</option>
                                            {properties.map((property) => (
                                                <option key={property.id} value={property.id}>
                                                    {property.name}
                                                </option>
                                            ))}
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <span id="scope-group-label" className="block text-sm font-semibold text-foreground">
                                        {t("Which rooms can they pick?")}
                                    </span>
                                    <div role="radiogroup" aria-labelledby="scope-group-label" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={mode === "property"}
                                            onClick={() => {
                                                setMode("property");
                                                setUnitId("");
                                                setUnitQuery("");
                                                setIsUnitMenuOpen(false);
                                                setPreviewUnitId("");
                                            }}
                                            className={cn(
                                                "flex min-h-[56px] items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
                                                mode === "property"
                                                    ? "border-primary bg-primary/10 text-foreground"
                                                    : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                            )}
                                        >
                                            <Building2 className={cn("size-5 shrink-0", mode === "property" ? "text-primary" : "text-muted-foreground")} />
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{t("Any Vacant Room")}</p>
                                                <p className="text-xs text-muted-foreground">{t("Tenant picks from open rooms")}</p>
                                            </div>
                                        </button>

                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={mode === "unit"}
                                            onClick={() => {
                                                setMode("unit");
                                                setUnitId("");
                                                setUnitQuery("");
                                                setIsUnitMenuOpen(false);
                                                setPreviewUnitId("");
                                            }}
                                            className={cn(
                                                "flex min-h-[56px] items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
                                                mode === "unit"
                                                    ? "border-primary bg-primary/10 text-foreground"
                                                    : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                            )}
                                        >
                                            <DoorClosed className={cn("size-5 shrink-0", mode === "unit" ? "text-primary" : "text-muted-foreground")} />
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{t("One Specific Room")}</p>
                                                <p className="text-xs text-muted-foreground">{t("Lock link to one room only")}</p>
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                {mode === "unit" && (
                                    <div ref={unitComboboxRef} className="relative space-y-1.5">
                                        <label htmlFor="select-unit" className="block text-sm font-semibold text-foreground">
                                            {t("Choose Vacant Room")}
                                        </label>
                                        <div className="relative">
                                            <DoorClosed className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                            <input
                                                id="select-unit"
                                                type="text"
                                                role="combobox"
                                                aria-expanded={isUnitMenuOpen}
                                                aria-controls="unit-suggestions-list"
                                                aria-autocomplete="list"
                                                aria-activedescendant={
                                                    highlightedUnitIndex >= 0 && filteredPropertyUnits[highlightedUnitIndex]
                                                        ? `unit-option-${filteredPropertyUnits[highlightedUnitIndex].id}`
                                                        : undefined
                                                }
                                                maxLength={60}
                                                disabled={!propertyId}
                                                value={unitQuery}
                                                placeholder={!propertyId ? t("Select a property first") : t("Type a room number or tap to choose...")}
                                                onFocus={() => {
                                                    if (propertyId) {
                                                        setIsFilteringUnits(false);
                                                        setIsUnitMenuOpen(true);
                                                    }
                                                }}
                                                onChange={(event) => {
                                                    const nextValue = event.target.value;
                                                    setUnitQuery(nextValue);
                                                    setIsFilteringUnits(true);
                                                    setIsUnitMenuOpen(true);
                                                    setHighlightedUnitIndex(0);
                                                    const exactMatch = propertyUnits.find(
                                                        (u) => u.name.toLowerCase() === nextValue.trim().toLowerCase()
                                                    );
                                                    setUnitId(exactMatch ? exactMatch.id : "");
                                                }}
                                                onKeyDown={(event) => {
                                                    if (!isUnitMenuOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
                                                        setIsUnitMenuOpen(true);
                                                        setHighlightedUnitIndex(0);
                                                        return;
                                                    }
                                                    if (!isUnitMenuOpen) return;
                                                    if (event.key === "ArrowDown") {
                                                        event.preventDefault();
                                                        setHighlightedUnitIndex((prev) =>
                                                            filteredPropertyUnits.length === 0
                                                                ? -1
                                                                : (prev + 1) % filteredPropertyUnits.length
                                                        );
                                                    } else if (event.key === "ArrowUp") {
                                                        event.preventDefault();
                                                        setHighlightedUnitIndex((prev) =>
                                                            filteredPropertyUnits.length === 0
                                                                ? -1
                                                                : prev <= 0
                                                                    ? filteredPropertyUnits.length - 1
                                                                    : prev - 1
                                                        );
                                                    } else if (event.key === "Enter" && highlightedUnitIndex >= 0) {
                                                        const chosen = filteredPropertyUnits[highlightedUnitIndex];
                                                        if (chosen) {
                                                            event.preventDefault();
                                                            setUnitId(chosen.id);
                                                            setUnitQuery(chosen.name);
                                                            setIsUnitMenuOpen(false);
                                                            setHighlightedUnitIndex(-1);
                                                        }
                                                    } else if (event.key === "Escape") {
                                                        setIsUnitMenuOpen(false);
                                                        setHighlightedUnitIndex(-1);
                                                    }
                                                }}
                                                className="h-12 w-full rounded-xl border border-border bg-background pl-10 pr-20 text-base font-medium text-foreground outline-none transition-colors hover:border-primary/60 focus:border-primary focus:ring-2 focus:ring-primary/30 disabled:opacity-50"
                                            />
                                            <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                                                {(unitQuery || unitId) && (
                                                    <button
                                                        type="button"
                                                        aria-label={t("Clear room selection")}
                                                        onClick={() => {
                                                            setUnitId("");
                                                            setUnitQuery("");
                                                            setIsFilteringUnits(false);
                                                            setIsUnitMenuOpen(true);
                                                            setHighlightedUnitIndex(-1);
                                                        }}
                                                        className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                                                    >
                                                        <X className="size-4" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    aria-label={t("Show vacant rooms")}
                                                    disabled={!propertyId}
                                                    onClick={() => {
                                                        setIsFilteringUnits(false);
                                                        setIsUnitMenuOpen((prev) => !prev);
                                                    }}
                                                    className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                                                >
                                                    <ChevronDown className={cn("size-4 transition-transform", isUnitMenuOpen && "rotate-180")} />
                                                </button>
                                            </div>
                                        </div>

                                        {isUnitMenuOpen && propertyId && (
                                            <div
                                                id="unit-suggestions-list"
                                                role="listbox"
                                                aria-label={t("Vacant room suggestions")}
                                                className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-60 overflow-y-auto rounded-xl border border-border bg-card p-1.5 shadow-lg"
                                            >
                                                {propertyUnits.length === 0 ? (
                                                    <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                                                        {t("No vacant rooms available in this property.")}
                                                    </p>
                                                ) : filteredPropertyUnits.length === 0 ? (
                                                    <div className="px-3 py-4 text-center space-y-2">
                                                        <p className="text-sm text-muted-foreground">
                                                            {t("No vacant rooms match \"{query}\".", { query: unitQuery.trim() })}
                                                        </p>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setUnitQuery("");
                                                                setUnitId("");
                                                                setHighlightedUnitIndex(-1);
                                                            }}
                                                            className="inline-flex min-h-[36px] items-center rounded-lg border border-border bg-background px-3 text-xs font-semibold text-foreground hover:bg-muted"
                                                        >
                                                            {t("Show all rooms")}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    filteredPropertyUnits.map((unit, idx) => {
                                                        const isSelected = unit.id === unitId;
                                                        const isHighlighted = idx === highlightedUnitIndex;
                                                        return (
                                                            <button
                                                                key={unit.id}
                                                                id={`unit-option-${unit.id}`}
                                                                type="button"
                                                                role="option"
                                                                aria-selected={isSelected}
                                                                onMouseDown={(e) => e.preventDefault()}
                                                                onClick={() => {
                                                                    setUnitId(unit.id);
                                                                    setUnitQuery(unit.name);
                                                                    setIsFilteringUnits(false);
                                                                    setIsUnitMenuOpen(false);
                                                                    setHighlightedUnitIndex(-1);
                                                                }}
                                                                className={cn(
                                                                    "flex min-h-[48px] w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                                                                    isSelected
                                                                        ? "bg-primary/10 text-foreground"
                                                                        : isHighlighted
                                                                            ? "bg-muted text-foreground"
                                                                            : "text-foreground hover:bg-muted/70"
                                                                )}
                                                            >
                                                                <span className="flex items-center gap-2 font-semibold text-sm">
                                                                    {isSelected && <Check className="size-4 text-primary shrink-0" />}
                                                                    <span>{unit.name}</span>
                                                                </span>
                                                                <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                                                                    PHP {Number(unit.rent_amount ?? 0).toLocaleString("en-US")}/mo
                                                                </span>
                                                            </button>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <hr className="border-border" />

                        {/* Step 2: Application Method */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                    2
                                </span>
                                <h3 className="text-base font-bold text-foreground">
                                    {t("How will the tenant apply?")}
                                </h3>
                            </div>

                            <div className="space-y-3 pl-0 sm:pl-9">
                                <div role="radiogroup" aria-label={t("Application method")} className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={applicationType === "face_to_face"}
                                        onClick={() => setApplicationType("face_to_face")}
                                        className={cn(
                                            "flex min-h-[56px] items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
                                            applicationType === "face_to_face"
                                                ? "border-primary bg-primary/10 text-foreground"
                                                : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                        )}
                                    >
                                        <Handshake className={cn("size-5 shrink-0", applicationType === "face_to_face" ? "text-primary" : "text-muted-foreground")} />
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{t("In Person")}</p>
                                            <p className="text-xs text-muted-foreground">{t("Check their IDs when you meet")}</p>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={applicationType === "online"}
                                        onClick={() => setApplicationType("online")}
                                        className={cn(
                                            "flex min-h-[56px] items-center gap-3 rounded-xl border p-3.5 text-left transition-colors",
                                            applicationType === "online"
                                                ? "border-primary bg-primary/10 text-foreground"
                                                : "border-border bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                        )}
                                    >
                                        <Globe className={cn("size-5 shrink-0", applicationType === "online" ? "text-primary" : "text-muted-foreground")} />
                                        <div>
                                            <p className="text-sm font-bold text-foreground">{t("Online Application")}</p>
                                            <p className="text-xs text-muted-foreground">{t("Tenant uploads documents online")}</p>
                                        </div>
                                    </button>
                                </div>

                                {applicationType === "online" && (
                                    <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2.5">
                                        <p id="docs-group-label" className="text-sm font-semibold text-foreground">
                                            {t("Documents the tenant must upload:")}
                                        </p>
                                        <div role="group" aria-labelledby="docs-group-label" className="grid gap-2 sm:grid-cols-2">
                                            {REQUIREMENT_OPTIONS.map((option) => {
                                                const checked = requiredRequirements.includes(option.key);
                                                return (
                                                    <button
                                                        key={option.key}
                                                        type="button"
                                                        role="checkbox"
                                                        aria-checked={checked}
                                                        onClick={() => {
                                                            setRequiredRequirements((prev) =>
                                                                prev.includes(option.key)
                                                                    ? prev.filter((value) => value !== option.key)
                                                                    : [...prev, option.key]
                                                            );
                                                        }}
                                                        className={cn(
                                                            "flex min-h-[44px] items-center justify-between rounded-xl border px-3.5 py-2 text-sm font-semibold transition-colors",
                                                            checked
                                                                ? "border-primary bg-primary/10 text-foreground"
                                                                : "border-border bg-background text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        <span className="inline-flex items-center gap-2">
                                                            <span
                                                                className={cn(
                                                                    "flex size-5 items-center justify-center rounded border",
                                                                    checked
                                                                        ? "border-primary bg-primary text-primary-foreground"
                                                                        : "border-muted-foreground/40 bg-background"
                                                                )}
                                                            >
                                                                {checked && <Check className="size-3.5" />}
                                                            </span>
                                                            <span>{t(option.label)}</span>
                                                        </span>
                                                        {option.key === "valid_id" && (
                                                            <span onClick={(e) => e.stopPropagation()}>
                                                                <Tooltip content={t(VALID_ID_TOOLTIP)} side="top" sideOffset={8}>
                                                                    <span className="text-xs font-medium text-muted-foreground underline">
                                                                        {t("List")}
                                                                    </span>
                                                                </Tooltip>
                                                            </span>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <hr className="border-border" />

                        {/* Step 3: Limits & Payment */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2.5">
                                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                                    3
                                </span>
                                <h3 className="text-base font-bold text-foreground">
                                    {t("Link limits & move-in payment")}
                                </h3>
                            </div>

                            <div className="space-y-5 pl-0 sm:pl-9">
                                {/* Usage Limit */}
                                <div className="space-y-2">
                                    <label className="block text-sm font-semibold text-foreground">
                                        {t("How many people can use this link?")}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {USE_LIMIT_PRESETS.map((preset) => {
                                            const active = !isCustomUses && maxUses === preset.value;
                                            return (
                                                <button
                                                    key={preset.value}
                                                    type="button"
                                                    onClick={() => {
                                                        setIsCustomUses(false);
                                                        setMaxUses(preset.value);
                                                        setCustomUsesInput(String(preset.value));
                                                    }}
                                                    className={cn(
                                                        "min-h-[44px] rounded-xl border px-3.5 text-sm font-semibold transition-colors",
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
                                            onClick={() => setIsCustomUses(true)}
                                            className={cn(
                                                "min-h-[44px] rounded-xl border px-3.5 text-sm font-semibold transition-colors",
                                                isCustomUses
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border bg-background text-foreground hover:bg-muted"
                                            )}
                                        >
                                            {t("Custom")}
                                        </button>
                                    </div>
                                    {isCustomUses && (
                                        <div className="mt-2 flex items-center gap-3">
                                            <input
                                                type="text"
                                                inputMode="numeric"
                                                maxLength={3}
                                                aria-label={t("Custom number of uses")}
                                                value={customUsesInput}
                                                onChange={(e) => {
                                                    const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                                                    setCustomUsesInput(digitsOnly);
                                                }}
                                                placeholder="1 - 100"
                                                className="h-12 w-32 rounded-xl border border-border bg-background px-3.5 text-base font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                {t("people (maximum 100)")}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Expiration */}
                                <div className="space-y-2">
                                    <label htmlFor="expires-at" className="block text-sm font-semibold text-foreground">
                                        {t("How long should this link work?")}
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {EXPIRY_PRESETS.map((preset) => {
                                            const active = !isCustomExpiry && activePreset === preset.days;
                                            return (
                                                <button
                                                    key={preset.days}
                                                    type="button"
                                                    onClick={() => {
                                                        setIsCustomExpiry(false);
                                                        setActivePreset(preset.days);
                                                        setExpiresAt(computeExpiryIsoLocal(preset.days));
                                                    }}
                                                    className={cn(
                                                        "min-h-[44px] rounded-xl border px-3.5 text-sm font-semibold transition-colors",
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
                                            onClick={() => {
                                                setIsCustomExpiry(true);
                                                setActivePreset(null);
                                            }}
                                            className={cn(
                                                "min-h-[44px] rounded-xl border px-3.5 text-sm font-semibold transition-colors",
                                                isCustomExpiry
                                                    ? "border-primary bg-primary text-primary-foreground"
                                                    : "border-border bg-background text-foreground hover:bg-muted"
                                            )}
                                        >
                                            {t("Pick a Date")}
                                        </button>
                                    </div>
                                    {isCustomExpiry && (
                                        <div className="mt-2 space-y-1.5">
                                            <div className="relative max-w-xs">
                                                <Calendar className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                                <input
                                                    {...inviteForm.fieldProps("expiresAt")}
                                                    id="expires-at"
                                                    type="datetime-local"
                                                    min={new Date().toISOString().slice(0, 16)}
                                                    max="2099-12-31T23:59"
                                                    value={expiresAt}
                                                    onChange={(event) => {
                                                        setExpiresAt(event.target.value);
                                                        setActivePreset(null);
                                                    }}
                                                    className={cn(
                                                        "h-12 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30",
                                                        inviteForm.errorFor("expiresAt") && fieldErrorClass
                                                    )}
                                                />
                                            </div>
                                            <FieldError id={inviteForm.errorId("expiresAt")} message={tOpt(inviteForm.errorFor("expiresAt"))} />
                                        </div>
                                    )}
                                </div>

                                {/* Move-in Payment Terms (Collapsible) */}
                                {showPaymentPreview && (
                                    <div className="rounded-xl border border-border bg-muted/40 p-4">
                                        <div className="flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{t("Move-in Payment")}</p>
                                                <p className="text-sm text-muted-foreground">{paymentSummaryText}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setShowPaymentEditor((prev) => !prev)}
                                                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl border border-border bg-background px-3.5 text-sm font-semibold text-foreground hover:bg-muted"
                                            >
                                                <span>{showPaymentEditor ? t("Hide") : t("Adjust")}</span>
                                                {showPaymentEditor ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                                            </button>
                                        </div>

                                        {showPaymentEditor && (
                                            <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
                                                {/* Advance Rent */}
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <label htmlFor="advance-amount-input" className="font-semibold text-foreground">
                                                            {t("Advance Rent")}
                                                        </label>
                                                        {advanceMonths === -1 && (
                                                            <span className="text-xs font-medium text-muted-foreground">{t("Custom amount")}</span>
                                                        )}
                                                    </div>
                                                    <div className="relative">
                                                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                                            PHP
                                                        </span>
                                                        <input
                                                            id="advance-amount-input"
                                                            type="text"
                                                            inputMode="decimal"
                                                            maxLength={10}
                                                            {...inviteForm.fieldProps("customAdvance")}
                                                            aria-label={t("Advance rent amount")}
                                                            value={
                                                                advanceMonths === -1
                                                                    ? customAdvance
                                                                    : String(currentPaymentPreview.advanceAmount)
                                                            }
                                                            onChange={(e) => {
                                                                const sanitized = e.target.value.replace(/[^0-9.]/g, "");
                                                                setAdvanceMonths(-1);
                                                                setCustomAdvance(sanitized);
                                                            }}
                                                            placeholder="0.00"
                                                            className={cn(
                                                                "h-11 w-full rounded-xl border border-border bg-background pl-12 pr-3 text-right text-base font-bold tabular-nums text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30",
                                                                inviteForm.errorFor("customAdvance") && fieldErrorClass
                                                            )}
                                                        />
                                                    </div>
                                                    <FieldError id={inviteForm.errorId("customAdvance")} message={tOpt(inviteForm.errorFor("customAdvance"))} />
                                                    <div className="grid grid-cols-3 gap-1.5">
                                                        {[
                                                            { value: 0, label: "None" },
                                                            { value: 1, label: "1 Mo" },
                                                            { value: 2, label: "2 Mo" },
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    setAdvanceMonths(opt.value);
                                                                    setCustomAdvance("");
                                                                }}
                                                                className={cn(
                                                                    "min-h-[40px] rounded-lg border px-2 text-xs font-semibold transition-colors",
                                                                    advanceMonths === opt.value
                                                                        ? "border-primary bg-primary text-primary-foreground"
                                                                        : "border-border bg-background text-foreground hover:bg-muted"
                                                                )}
                                                            >
                                                                {t(opt.label)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Security Deposit */}
                                                <div className="space-y-2.5">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <label htmlFor="deposit-amount-input" className="font-semibold text-foreground">
                                                            {t("Security Deposit")}
                                                        </label>
                                                        {securityDepositMonths === -1 && (
                                                            <span className="text-xs font-medium text-muted-foreground">{t("Custom amount")}</span>
                                                        )}
                                                    </div>
                                                    <div className="relative">
                                                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                                                            PHP
                                                        </span>
                                                        <input
                                                            id="deposit-amount-input"
                                                            type="text"
                                                            inputMode="decimal"
                                                            maxLength={10}
                                                            {...inviteForm.fieldProps("customDeposit")}
                                                            aria-label={t("Security deposit amount")}
                                                            value={
                                                                securityDepositMonths === -1
                                                                    ? customDeposit
                                                                    : String(currentPaymentPreview.securityDepositAmount)
                                                            }
                                                            onChange={(e) => {
                                                                const sanitized = e.target.value.replace(/[^0-9.]/g, "");
                                                                setSecurityDepositMonths(-1);
                                                                setCustomDeposit(sanitized);
                                                            }}
                                                            placeholder="0.00"
                                                            className={cn(
                                                                "h-11 w-full rounded-xl border border-border bg-background pl-12 pr-3 text-right text-base font-bold tabular-nums text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/30",
                                                                inviteForm.errorFor("customDeposit") && fieldErrorClass
                                                            )}
                                                        />
                                                    </div>
                                                    <FieldError id={inviteForm.errorId("customDeposit")} message={tOpt(inviteForm.errorFor("customDeposit"))} />
                                                    <div className="grid grid-cols-3 gap-1.5">
                                                        {[
                                                            { value: 0, label: "None" },
                                                            { value: 1, label: "1 Mo" },
                                                            { value: 2, label: "2 Mo" },
                                                        ].map((opt) => (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() => {
                                                                    setSecurityDepositMonths(opt.value);
                                                                    setCustomDeposit("");
                                                                }}
                                                                className={cn(
                                                                    "min-h-[40px] rounded-lg border px-2 text-xs font-semibold transition-colors",
                                                                    securityDepositMonths === opt.value
                                                                        ? "border-primary bg-primary text-primary-foreground"
                                                                        : "border-border bg-background text-foreground hover:bg-muted"
                                                                )}
                                                            >
                                                                {t(opt.label)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="sm:col-span-2 flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm">
                                                    <span className="font-semibold text-muted-foreground">{t("Estimated Move-in Total")}</span>
                                                    <span className="text-base font-bold tabular-nums text-foreground">
                                                        PHP {currentPaymentPreview.totalMoveInAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Mobile Primary Button */}
                        <div className="lg:hidden pt-2">
                            <button
                                type="button"
                                onClick={createInvite}
                                disabled={submitting}
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                            >
                                <Link2 className="size-5" />
                                {submitting ? t("Creating Link...") : t("Create Invite Link")}
                            </button>
                        </div>
                    </div>

                    {/* Right Column: Live Summary OR Generated Result */}
                    <div ref={resultRef} className="lg:sticky lg:top-4">
                        {freshInvite ? (
                            <div className="rounded-2xl border-2 border-primary/40 bg-background p-5 space-y-5">
                                <div className="flex items-center justify-between">
                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">
                                        <CheckCircle2 className="size-3.5" />
                                        {t("Link Ready to Share")}
                                    </span>
                                    <span className="text-xs font-semibold text-muted-foreground">
                                        {freshInvite.useCount} / {freshInvite.maxUses} {t("used")}
                                    </span>
                                </div>

                                <div className="flex flex-col items-center rounded-xl border border-border bg-muted/30 p-4">
                                    <div className="rounded-2xl border border-border bg-white p-2.5">
                                        <Image src={freshInvite.qrUrl} alt={t("Invite QR code")} width={156} height={156} className="rounded-lg" />
                                    </div>
                                    <p className="mt-2.5 text-xs font-medium text-muted-foreground">
                                        {t("Let the tenant scan this QR code, or copy the link below.")}
                                    </p>
                                </div>

                                <div className="space-y-2.5">
                                    <button
                                        type="button"
                                        onClick={() => void copyLink(freshInvite.shareUrl)}
                                        className={cn(
                                            "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl px-5 text-base font-bold transition-colors active:scale-95",
                                            copiedUrl
                                                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                                                : "bg-primary text-primary-foreground hover:bg-primary/90"
                                        )}
                                    >
                                        {copiedUrl ? (
                                            <>
                                                <Check className="size-5" />
                                                {t("Copied!")}
                                            </>
                                        ) : (
                                            <>
                                                <Copy className="size-5" />
                                                {t("Copy Link")}
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFreshInvite(null)}
                                        className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted"
                                    >
                                        {t("Create Another Link")}
                                    </button>
                                </div>

                                <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2 text-xs">
                                    <div>
                                        <p className="font-semibold text-muted-foreground">{t("Share URL")}</p>
                                        <p className="mt-0.5 break-all font-mono text-foreground">{freshInvite.shareUrl}</p>
                                    </div>
                                    <div className="flex items-center justify-between border-t border-border pt-2">
                                        <span className="text-muted-foreground">{t("Expires on")}</span>
                                        <span className="font-semibold text-foreground">{formatReadableDate(freshInvite.expiresAt)}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="hidden lg:block rounded-2xl border border-border bg-muted/30 p-6 space-y-5">
                                <div>
                                    <h4 className="text-base font-bold text-foreground">{t("Link Summary")}</h4>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {t("Check your choices, then click the button below.")}
                                    </p>
                                </div>

                                <dl className="space-y-3 border-y border-border py-4 text-sm">
                                    <div className="flex items-start justify-between gap-3">
                                        <dt className="text-muted-foreground">{t("Property")}</dt>
                                        <dd className="text-right font-semibold text-foreground">
                                            {selectedProperty?.name || t("Not selected")}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <dt className="text-muted-foreground">{t("Room")}</dt>
                                        <dd className="text-right font-semibold text-foreground">
                                            {mode === "unit"
                                                ? selectedUnit?.name || t("Pick a room")
                                                : t("Any vacant room")}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <dt className="text-muted-foreground">{t("Apply Method")}</dt>
                                        <dd className="text-right font-semibold text-foreground">
                                            {applicationType === "online" ? t("Online Application") : t("In Person")}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <dt className="text-muted-foreground">{t("Use Limit")}</dt>
                                        <dd className="text-right font-semibold text-foreground">
                                            {effectiveMaxUses === 1
                                                ? t("1 person")
                                                : t("{count} people", { count: effectiveMaxUses })}
                                        </dd>
                                    </div>
                                    <div className="flex items-start justify-between gap-3">
                                        <dt className="text-muted-foreground">{t("Expires")}</dt>
                                        <dd className="text-right font-semibold text-foreground">
                                            {formatReadableDate(expiresAt ? new Date(expiresAt).toISOString() : null)}
                                        </dd>
                                    </div>
                                    {showPaymentPreview && (
                                        <div className="flex items-start justify-between gap-3">
                                            <dt className="text-muted-foreground">{t("Move-in Total")}</dt>
                                            <dd className="text-right font-bold tabular-nums text-foreground">
                                                PHP {currentPaymentPreview.totalMoveInAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </dd>
                                        </div>
                                    )}
                                </dl>

                                <button
                                    type="button"
                                    onClick={createInvite}
                                    disabled={submitting}
                                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
                                >
                                    <Link2 className="size-5" />
                                    {submitting ? t("Creating Link...") : t("Create Invite Link")}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: PAST LINKS (PAGINATED) */}
            {activeTab === "history" && (
                <div className="mt-6 space-y-5">
                    {/* Wrapped Filter Chips */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {[
                                { key: "all" as const, label: "All Links" },
                                { key: "active" as const, label: "Active Only" },
                                { key: "inactive" as const, label: "Used or Expired" },
                            ].map((chip) => (
                                <button
                                    key={chip.key}
                                    type="button"
                                    onClick={() => setHistoryFilter(chip.key)}
                                    className={cn(
                                        "min-h-[40px] rounded-full border px-4 text-sm font-semibold transition-colors",
                                        historyFilter === chip.key
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-border bg-background text-foreground hover:bg-muted"
                                    )}
                                >
                                    {t(chip.label)}
                                </button>
                            ))}
                        </div>
                        {filteredInvites.length > 0 && (
                            <p className="text-sm font-medium text-muted-foreground">
                                {t("Showing {start}–{end} of {total}", {
                                    start: (safeHistoryPage - 1) * HISTORY_PAGE_SIZE + 1,
                                    end: Math.min(safeHistoryPage * HISTORY_PAGE_SIZE, filteredInvites.length),
                                    total: filteredInvites.length,
                                })}
                            </p>
                        )}
                    </div>

                    {invites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                            <Link2 className="mb-3 size-8 text-muted-foreground" />
                            <p className="text-base font-bold text-foreground">{t("No invite links yet")}</p>
                            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                {t("Create your first invite link to share with a future tenant.")}
                            </p>
                            <button
                                type="button"
                                onClick={() => setActiveTab("create")}
                                className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
                            >
                                <Plus className="size-4" />
                                {t("Create First Link")}
                            </button>
                        </div>
                    ) : filteredInvites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
                            <p className="text-base font-bold text-foreground">{t("No links match this filter")}</p>
                            <button
                                type="button"
                                onClick={() => setHistoryFilter("all")}
                                className="mt-3 inline-flex min-h-[44px] items-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted"
                            >
                                {t("Show All Links")}
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-3.5">
                            {paginatedInvites.map((invite) => {
                                const statusMeta = getInviteStatusMeta(invite.status);
                                const StatusIcon = statusMeta.icon;
                                const remainingUses = Math.max(0, invite.maxUses - invite.useCount);

                                return (
                                    <div
                                        key={invite.id}
                                        className="rounded-2xl border border-border bg-background p-4 sm:p-5 space-y-3.5"
                                    >
                                        {/* Band 1: Identity & State */}
                                        <div className="flex flex-wrap items-start justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-foreground">
                                                    <QrCode className="size-5" />
                                                </div>
                                                <div>
                                                    <p className="text-base font-bold text-foreground">
                                                        {invite.propertyName}
                                                        {invite.unitName ? ` — ${invite.unitName}` : ""}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {invite.mode === "unit" ? t("Specific Room") : t("Any Vacant Room")} ·{" "}
                                                        {invite.applicationType === "online" ? t("Online") : t("In Person")}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold", statusMeta.badgeClass)}>
                                                <StatusIcon className="size-3.5" />
                                                {t(statusMeta.label)}
                                            </span>
                                        </div>

                                        {/* Band 2: Plain Summary */}
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                            <span>
                                                <strong className="font-semibold text-foreground">
                                                    {invite.useCount} / {invite.maxUses}
                                                </strong>{" "}
                                                {t("used")} ({remainingUses} {t("left")})
                                            </span>
                                            <span>·</span>
                                            <span>
                                                {t("Expires")}:{" "}
                                                <strong className="font-semibold text-foreground">
                                                    {formatReadableDate(invite.expiresAt)}
                                                </strong>
                                            </span>
                                        </div>

                                        {/* Band 3: Action Footer */}
                                        <div className="border-t border-border pt-3">
                                            {revokingId === invite.id ? (
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">
                                                        {t("Turn off this link so no one else can use it?")}
                                                    </p>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                void revokeInvite(invite.id);
                                                                setRevokingId(null);
                                                            }}
                                                            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-rose-700 px-4 text-sm font-bold text-white hover:bg-rose-800"
                                                        >
                                                            {t("Yes, Turn Off")}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setRevokingId(null)}
                                                            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted"
                                                        >
                                                            {t("Keep Active")}
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => void copyLink(invite.shareUrl, invite.id)}
                                                        className={cn(
                                                            "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-colors",
                                                            copiedId === invite.id
                                                                ? "border-emerald-700 bg-emerald-700 text-white"
                                                                : "border-border bg-background text-foreground hover:bg-muted"
                                                        )}
                                                    >
                                                        {copiedId === invite.id ? (
                                                            <>
                                                                <Check className="size-4" />
                                                                {t("Copied!")}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Copy className="size-4" />
                                                                {t("Copy Link")}
                                                            </>
                                                        )}
                                                    </button>
                                                    <a
                                                        href={invite.qrUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted"
                                                    >
                                                        <QrCode className="size-4" />
                                                        {t("View QR")}
                                                    </a>
                                                    {invite.status === "active" && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setRevokingId(invite.id)}
                                                            className="col-span-2 sm:col-span-1 sm:ml-auto inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-rose-500/30 bg-background px-4 text-sm font-semibold text-rose-700 hover:bg-rose-500/10 dark:text-rose-400"
                                                        >
                                                            <XCircle className="size-4" />
                                                            {t("Turn Off")}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalHistoryPages > 1 && (
                        <div className="flex items-center justify-between border-t border-border pt-4">
                            <button
                                type="button"
                                onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                                disabled={safeHistoryPage <= 1}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                            >
                                <ChevronLeft className="size-4" />
                                {t("Prev")}
                            </button>
                            <span className="text-sm font-semibold text-muted-foreground">
                                {t("Page {current} of {total}", { current: safeHistoryPage, total: totalHistoryPages })}
                            </span>
                            <button
                                type="button"
                                onClick={() => setHistoryPage((p) => Math.min(totalHistoryPages, p + 1))}
                                disabled={safeHistoryPage >= totalHistoryPages}
                                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
                            >
                                {t("Next")}
                                <ChevronRight className="size-4" />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Mobile Generated Invite Sheet */}
            {freshInvite && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4 lg:hidden">
                    <div className="w-full max-w-md overscroll-contain rounded-t-3xl border border-border bg-card p-6 shadow-xl sm:rounded-2xl">
                        <div className="mb-4 flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-700 px-3 py-1 text-xs font-bold text-white">
                                <CheckCircle2 className="size-3.5" />
                                {t("Link Ready to Share")}
                            </span>
                            <button
                                type="button"
                                onClick={() => setFreshInvite(null)}
                                aria-label={t("Close")}
                                className="flex size-10 items-center justify-center rounded-full border border-border bg-background text-lg font-bold text-foreground hover:bg-muted"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex flex-col items-center rounded-xl border border-border bg-muted/30 p-4">
                            <div className="rounded-2xl border border-border bg-white p-2.5">
                                <Image src={freshInvite.qrUrl} alt={t("Invite QR code")} width={156} height={156} className="rounded-lg" />
                            </div>
                            <p className="mt-2.5 text-center text-xs font-medium text-muted-foreground">
                                {t("Scan QR code or copy the link below.")}
                            </p>
                        </div>

                        <div className="mt-4 rounded-xl border border-border bg-background p-3 text-xs">
                            <p className="font-semibold text-muted-foreground">{t("Share URL")}</p>
                            <p className="mt-0.5 break-all font-mono text-foreground">{freshInvite.shareUrl}</p>
                        </div>

                        <div className="mt-4 flex gap-2.5">
                            <button
                                type="button"
                                onClick={() => void copyLink(freshInvite.shareUrl, "fresh")}
                                className={cn(
                                    "flex-1 inline-flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors",
                                    copiedId === "fresh"
                                        ? "bg-emerald-700 text-white"
                                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                                )}
                            >
                                {copiedId === "fresh" ? (
                                    <>
                                        <Check className="size-4" />
                                        {t("Copied!")}
                                    </>
                                ) : (
                                    <>
                                        <Copy className="size-4" />
                                        {t("Copy Link")}
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setFreshInvite(null)}
                                className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground hover:bg-muted"
                            >
                                {t("Done")}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
