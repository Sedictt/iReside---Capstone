"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
    AlertCircle,
    AlertTriangle,
    ArrowRight,
    Bell,
    Bot,
    Building2,
    Check,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Compass,
    Copy,
    CreditCard,
    Download,
    ExternalLink,
    FileText,
    KeyRound,
    LayoutDashboard,
    Loader2,
    LogOut,
    Mail,
    MessageSquare,
    PenTool,
    RefreshCw,
    RotateCcw,
    Search,
    Send,
    ShieldAlert,
    Smartphone,
    Trash2,
    User,
    UserPlus,
    Users,
    Volume2,
    Wrench,
    X,
    Zap,
    type LucideIcon,
} from "lucide-react";
import {
    DEMO_CATEGORIES,
    type DemoAccount,
    type DemoAccountKey,
    type DemoCategory,
    type DemoScenario,
    type ExtraResident,
} from "./scenarios";

interface Props {
    accounts: DemoAccount[];
    extraResidents: ExtraResident[];
    password: string;
    scenarios: DemoScenario[];
    resetAvailable: boolean;
}

type PrimaryTab = "cases" | "accounts" | "emails" | "reset";

interface SampleEmailItem {
    id: string;
    category: string;
    title: string;
    recipientRole: string;
    trigger: string;
    subject: string;
    htmlBody: string;
    textBody: string;
}

interface CurrentSession {
    id?: string;
    email: string;
    fullName: string;
    role: string;
}

interface ReadyTarget {
    scenarioId: string;
    path: string;
    accountLabel: string;
    message: string;
}

const DEMO_WINDOW_NAME = "ireside-demo";

const CATEGORY_META: Record<
    DemoCategory,
    { icon: LucideIcon; pillClass: string; badgeClass: string }
> = {
    "In-Chat Cards": {
        icon: MessageSquare,
        pillClass: "text-violet-700 dark:text-violet-300",
        badgeClass: "bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/25",
    },
    "Payments & GCash": {
        icon: CreditCard,
        pillClass: "text-emerald-700 dark:text-emerald-300",
        badgeClass: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
    },
    "Leases & E-Sign": {
        icon: PenTool,
        pillClass: "text-sky-700 dark:text-sky-300",
        badgeClass: "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25",
    },
    Applications: {
        icon: Users,
        pillClass: "text-amber-700 dark:text-amber-300",
        badgeClass: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25",
    },
    "Maintenance & Utilities": {
        icon: Wrench,
        pillClass: "text-rose-700 dark:text-rose-300",
        badgeClass: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/25",
    },
    "Onboarding & AI": {
        icon: Bot,
        pillClass: "text-indigo-700 dark:text-indigo-300",
        badgeClass: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
    },
    "Tenant Portal & Mobile": {
        icon: Smartphone,
        pillClass: "text-teal-700 dark:text-teal-300",
        badgeClass: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25",
    },
};

export function DemoConsole({
    accounts,
    extraResidents,
    password,
    scenarios,
    resetAvailable,
}: Props) {
    const [activeTab, setActiveTab] = useState<PrimaryTab>("cases");
    const [selectedCategory, setSelectedCategory] = useState<DemoCategory | "All">("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentSession, setCurrentSession] = useState<CurrentSession | null>(null);
    const [sessionLoading, setSessionLoading] = useState(true);

    // Busy states
    const [busyScenarioId, setBusyScenarioId] = useState<string | null>(null);
    const [busyAccountKey, setBusyAccountKey] = useState<string | null>(null);
    const [busyActionKey, setBusyActionKey] = useState<string | null>(null);

    // Ready links per scenario after "Prepare & Switch"
    const [readyTargets, setReadyTargets] = useState<Record<string, ReadyTarget>>({});

    // Accounts tab collapsible background residents
    const [showBackgroundResidents, setShowBackgroundResidents] = useState(false);

    // Sample Emails tab states
    const [sampleEmails, setSampleEmails] = useState<SampleEmailItem[]>([]);
    const [emailsLoading, setEmailsLoading] = useState(false);
    const [emailsError, setEmailsError] = useState<string | null>(null);
    const [smtpConfigured, setSmtpConfigured] = useState(false);
    const [selectedEmailCategory, setSelectedEmailCategory] = useState<string>("All");
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [emailViewMode, setEmailViewMode] = useState<"html" | "text">("html");
    const [testRecipientEmail, setTestRecipientEmail] = useState("");
    const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
    const [downloadingEmailId, setDownloadingEmailId] = useState<string | null>(null);
    const [downloadingAllEmails, setDownloadingAllEmails] = useState(false);

    // Reset & Create tab states
    const [quickResetResult, setQuickResetResult] = useState<{
        title: string;
        message: string;
        copyValue?: string;
        copyLabel?: string;
    } | null>(null);
    const [createdLandlord, setCreatedLandlord] = useState<{
        email: string;
        password: string;
    } | null>(null);
    const [deleteEmail, setDeleteEmail] = useState("");
    const [deleteEmailError, setDeleteEmailError] = useState<string | null>(null);
    const [deleteTouched, setDeleteTouched] = useState(false);
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [resettingDb, setResettingDb] = useState(false);
    const [resetLog, setResetLog] = useState<string | null>(null);

    // Copy & Toast feedback
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const [toast, setToast] = useState<{
        message: string;
        type: "success" | "error" | "info";
    } | null>(null);

    const searchInputRef = useRef<HTMLInputElement>(null);
    const deleteInputRef = useRef<HTMLInputElement>(null);
    const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const accountByKey = useMemo(
        () =>
            Object.fromEntries(accounts.map((a) => [a.key, a])) as Record<
                DemoAccountKey,
                DemoAccount
            >,
        [accounts]
    );

    const showToast = useCallback(
        (message: string, type: "success" | "error" | "info" = "success") => {
            setToast({ message, type });
            if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
            if (type !== "error") {
                toastTimerRef.current = setTimeout(() => setToast(null), 3500);
            }
        },
        []
    );

    const copyText = useCallback(
        (text: string, label: string, keyId?: string) => {
            navigator.clipboard.writeText(text);
            if (keyId) {
                setCopiedKey(keyId);
                setTimeout(() => setCopiedKey((prev) => (prev === keyId ? null : prev)), 1800);
            }
            showToast(`Copied ${label} to clipboard`, "success");
        },
        [showToast]
    );

    const refreshSession = useCallback(async () => {
        try {
            const res = await fetch("/api/demo-console/actions", { cache: "no-store" });
            const data = await res.json();
            if (data.ok) {
                setCurrentSession(data.currentUser ?? null);
            }
        } catch {
            // keep current state on network hiccup
        } finally {
            setSessionLoading(false);
        }
    }, []);

    useEffect(() => {
        refreshSession();
        try {
            localStorage.setItem(
                "ireside-consent-v1",
                JSON.stringify({ essential: true, analytics: true, marketing: false })
            );
        } catch {
            // ignore
        }
    }, [refreshSession]);

    // Keyboard shortcuts: '/' focuses search, 'Escape' clears search or closes modal
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement | null;
            const isTyping =
                target?.tagName === "INPUT" ||
                target?.tagName === "TEXTAREA" ||
                target?.isContentEditable;

            if (e.key === "/" && !isTyping) {
                e.preventDefault();
                if (activeTab === "reset") {
                    setActiveTab("cases");
                    setTimeout(() => searchInputRef.current?.focus(), 20);
                } else {
                    searchInputRef.current?.focus();
                }
            } else if (e.key === "Escape") {
                if (resetModalOpen) {
                    setResetModalOpen(false);
                } else if (searchQuery) {
                    setSearchQuery("");
                }
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [activeTab, resetModalOpen, searchQuery]);

    const callAction = useCallback(
        async (action: string, payload: Record<string, unknown> = {}) => {
            const res = await fetch("/api/demo-console/actions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, ...payload }),
            });
            const data = await res.json();
            if (!res.ok || !data.ok) {
                throw new Error(data.error || `Action "${action}" failed`);
            }
            return data;
        },
        []
    );

    const [launchMode, setLaunchMode] = useState<"redirect" | "new_tab">(() => {
        if (typeof window !== "undefined") {
            const saved = window.localStorage.getItem("ireside.demo_launch_mode");
            if (saved === "new_tab" || saved === "redirect") return saved;
        }
        return "redirect";
    });

    const handleToggleLaunchMode = (mode: "redirect" | "new_tab") => {
        setLaunchMode(mode);
        if (typeof window !== "undefined") {
            window.localStorage.setItem("ireside.demo_launch_mode", mode);
        }
    };

    const openDemoRoute = useCallback(
        (targetPath: string) => {
            if (launchMode === "new_tab") {
                const win = window.open(targetPath, DEMO_WINDOW_NAME);
                if (win) {
                    win.focus();
                } else {
                    window.location.assign(targetPath);
                }
            } else {
                window.location.assign(targetPath);
            }
        },
        [launchMode]
    );

    const getDashboardPath = (role?: string | null) => {
        if (role === "landlord") return "/landlord/dashboard";
        if (role === "tenant") return "/tenant/dashboard";
        return "/";
    };

    // Switch account via server-side action (syncs role cookies & clears 2FA)
    const switchToAccount = useCallback(
        async (email: string | null, accountPassword: string | null) => {
            const data = await callAction("switch-account", {
                email,
                password: accountPassword || password,
            });
            setCurrentSession(data.user ?? null);
            return data.user as CurrentSession | null;
        },
        [callAction, password]
    );

    // Tab 1: Prepare & Switch handler (single round-trip when prepareAction is set)
    const handlePrepareAndSwitch = async (scenario: DemoScenario) => {
        const account = accountByKey[scenario.as];
        setBusyScenarioId(scenario.id);

        try {
            let prepMessage = `Switched to ${account.label}`;
            let resolvedPath = scenario.path;
            if (scenario.prepareAction) {
                const prepRes = await callAction(scenario.prepareAction, {
                    ...(account.email
                        ? {
                              autoSwitchEmail: account.email,
                              autoSwitchPassword: account.password || password,
                          }
                        : {}),
                    as: scenario.as,
                    targetRoute: scenario.path,
                    view: scenario.as === "landlord" ? "landlord" : undefined,
                });
                if (prepRes.message) {
                    prepMessage = prepRes.message;
                }
                if (typeof prepRes.recommendedRoute === "string" && prepRes.recommendedRoute.trim()) {
                    resolvedPath = prepRes.recommendedRoute.trim();
                }
                if (prepRes.switchedUser) {
                    setCurrentSession(prepRes.switchedUser);
                } else if (!account.email) {
                    await switchToAccount(null, null);
                }
            } else {
                await switchToAccount(account.email, account.password);
            }

            // Clean client-side onboarding/tour localStorage flags if resetting tours
            if (typeof window !== "undefined") {
                if (
                    scenario.id === "landlord-5stage-onboarding" ||
                    scenario.prepareAction === "prepare-starter-onboarding"
                ) {
                    window.localStorage.removeItem("ireside.onboarding_completed");
                    window.localStorage.removeItem("ireside.dashboard_tour_complete");
                    window.localStorage.removeItem("ireside_setup_completed");
                    window.localStorage.removeItem("ireside_setup_completed_at");
                }
                if (
                    scenario.id === "first-time-tenant-tour" ||
                    scenario.prepareAction === "reset-tenant-tour"
                ) {
                    window.localStorage.removeItem("ireside.tenant_tour_completed");
                    window.localStorage.removeItem("tenant_tour_completed");
                }
            }

            setReadyTargets((prev) => ({
                ...prev,
                [scenario.id]: {
                    scenarioId: scenario.id,
                    path: resolvedPath,
                    accountLabel: account.label,
                    message: prepMessage,
                },
            }));

            showToast(`Ready: ${scenario.title}`, "success");
            openDemoRoute(resolvedPath);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to prepare scenario";
            showToast(msg, "error");
        } finally {
            setBusyScenarioId(null);
        }
    };

    // Tab 2: Switch & Open Dashboard
    const handleAccountSwitchAndOpen = async (
        key: string,
        label: string,
        email: string | null,
        accountPassword: string | null,
        role: string
    ) => {
        setBusyAccountKey(key);
        try {
            await switchToAccount(email, accountPassword);
            const targetPath = role === "public" ? "/login" : getDashboardPath(role);
            showToast(`Signed in as ${label}`, "success");
            openDemoRoute(targetPath);
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to switch account";
            showToast(msg, "error");
        } finally {
            setBusyAccountKey(null);
        }
    };

    const handleSignOut = async () => {
        setBusyAccountKey("signout");
        try {
            await switchToAccount(null, null);
            showToast("Signed out of demo session", "info");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Sign out failed", "error");
        } finally {
            setBusyAccountKey(null);
        }
    };

    // Tab 3: Guided Onboarding & Tour ON / OFF / Reset
    const handleOnboardingControl = async (
        actionName: "toggle-landlord-onboarding" | "toggle-tenant-tour",
        mode: "on" | "off" | "reset",
        title: string
    ) => {
        const key = `${actionName}:${mode}`;
        setBusyActionKey(key);
        try {
            const data = await callAction(actionName, { mode });
            if (typeof window !== "undefined") {
                if (data.clearOnboardingLocalStorage) {
                    window.localStorage.removeItem("ireside.onboarding_completed");
                }
                if (data.setOnboardingCompleted) {
                    window.localStorage.setItem("ireside.onboarding_completed", "true");
                }
            }
            setQuickResetResult({
                title,
                message: data.message || `${title} applied.`,
            });
            showToast(data.message || `${title} applied`, "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : `${title} failed`, "error");
        } finally {
            setBusyActionKey(null);
        }
    };

    // Tab 3: Quick Resets
    const handleQuickReset = async (
        actionKey: string,
        title: string,
        successFallback: string
    ) => {
        setBusyActionKey(actionKey);
        try {
            const data = await callAction(actionKey);
            setQuickResetResult({
                title,
                message: data.message || successFallback,
                copyValue: data.signingLink || data.email,
                copyLabel: data.signingLink ? "Signing Link" : data.email ? "Email" : undefined,
            });
            showToast(`${title} complete`, "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : `${title} failed`, "error");
        } finally {
            setBusyActionKey(null);
        }
    };

    // Tab 3: Create Fresh Claimable Landlord
    const handleCreateFreshLandlord = async () => {
        setBusyActionKey("create-fresh-landlord");
        try {
            const data = await callAction("create-fresh-landlord");
            setCreatedLandlord({
                email: data.email,
                password: data.password,
            });
            showToast(`Created ${data.email}`, "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to create landlord", "error");
        } finally {
            setBusyActionKey(null);
        }
    };

    // Tab 3: Delete User validation ("Reward Early, Punish Late")
    const validateDeleteEmail = (value: string): string | null => {
        const trimmed = value.trim();
        if (!trimmed) return "Enter an email address to delete.";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            return "Enter a valid email address (e.g. marco.reyes@ireside.ph).";
        }
        return null;
    };

    const handleDeleteUserSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setDeleteTouched(true);
        const err = validateDeleteEmail(deleteEmail);
        setDeleteEmailError(err);
        if (err) {
            deleteInputRef.current?.focus();
            return;
        }

        setBusyActionKey("delete-user");
        try {
            const data = await callAction("delete-user", { email: deleteEmail.trim() });
            showToast(data.message || `Deleted ${deleteEmail.trim()}`, "success");
            setDeleteEmail("");
            setDeleteTouched(false);
            setDeleteEmailError(null);
        } catch (error) {
            showToast(error instanceof Error ? error.message : "Delete failed", "error");
        } finally {
            setBusyActionKey(null);
        }
    };

    // Tab 3: Full Database Reset
    const handleFullDatabaseReset = async () => {
        setResetModalOpen(false);
        setResettingDb(true);
        setResetLog("Running scripts/seed-defense-demo.mjs… Please wait ~10-20s.");
        try {
            const res = await fetch("/api/demo-console/reset", { method: "POST" });
            const body = await res.json();
            const summary = `${body.ok ? "Database reset succeeded" : "Database reset failed"} (${body.seconds ?? "?"}s)\n\n${body.output ?? body.error ?? ""}`;
            setResetLog(summary);
            if (!res.ok || !body.ok) {
                throw new Error(body.error || "Database reset failed");
            }
            setCurrentSession(null);
            setReadyTargets({});
            showToast(`Full reset complete in ${body.seconds ?? "?"}s`, "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Database reset failed", "error");
        } finally {
            setResettingDb(false);
        }
    };

    // Filtered scenarios (Tab 1)
    const filteredScenarios = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return scenarios.filter((s) => {
            if (selectedCategory !== "All" && s.category !== selectedCategory) {
                return false;
            }
            if (!q) return true;
            const acc = accountByKey[s.as];
            const hay = `${s.title} ${s.description} ${s.useWhen} ${s.category} ${s.path} ${s.tip ?? ""} ${acc.label} ${acc.room ?? ""}`.toLowerCase();
            return hay.includes(q);
        });
    }, [scenarios, selectedCategory, searchQuery, accountByKey]);

    // Filtered accounts (Tab 2)
    const filteredAccounts = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return accounts;
        return accounts.filter((a) =>
            `${a.label} ${a.email ?? ""} ${a.role} ${a.room ?? ""} ${a.state}`.toLowerCase().includes(q)
        );
    }, [accounts, searchQuery]);

    const filteredExtraResidents = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return extraResidents;
        return extraResidents.filter((r) =>
            `${r.label} ${r.email} ${r.room} ${r.state}`.toLowerCase().includes(q)
        );
    }, [extraResidents, searchQuery]);

    const landlordAccounts = filteredAccounts.filter((a) => a.role === "landlord");
    const tenantAccounts = filteredAccounts.filter((a) => a.role === "tenant");
    const publicAccounts = filteredAccounts.filter((a) => a.role === "public");

    // Sample Emails (Tab 3)
    const loadSampleEmails = useCallback(async () => {
        setEmailsLoading(true);
        setEmailsError(null);
        try {
            const res = await fetch("/api/demo-console/emails", { cache: "no-store" });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || "Failed to load sample emails");
            const list: SampleEmailItem[] = json.emails ?? [];
            setSampleEmails(list);
            setSmtpConfigured(Boolean(json.smtpConfigured));
            setSelectedEmailId((prev) => prev ?? list[0]?.id ?? null);
        } catch (err) {
            setEmailsError(err instanceof Error ? err.message : "Failed to load sample emails");
        } finally {
            setEmailsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === "emails" && sampleEmails.length === 0 && !emailsLoading && !emailsError) {
            void loadSampleEmails();
        }
    }, [activeTab, sampleEmails.length, emailsLoading, emailsError, loadSampleEmails]);

    const emailCategories = useMemo(
        () => ["All", ...Array.from(new Set(sampleEmails.map((e) => e.category)))],
        [sampleEmails]
    );

    const filteredSampleEmails = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return sampleEmails.filter((e) => {
            if (selectedEmailCategory !== "All" && e.category !== selectedEmailCategory) {
                return false;
            }
            if (!q) return true;
            return `${e.title} ${e.subject} ${e.category} ${e.recipientRole} ${e.trigger}`
                .toLowerCase()
                .includes(q);
        });
    }, [sampleEmails, selectedEmailCategory, searchQuery]);

    const activeSampleEmail = useMemo(
        () =>
            filteredSampleEmails.find((e) => e.id === selectedEmailId) ??
            filteredSampleEmails[0] ??
            null,
        [filteredSampleEmails, selectedEmailId]
    );

    const handleSendSampleEmail = async (emailItem: SampleEmailItem) => {
        const target = testRecipientEmail.trim();
        if (!target || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
            showToast("Enter a valid Gmail/email address first", "error");
            return;
        }
        setSendingEmailId(emailItem.id);
        try {
            const res = await fetch("/api/demo-console/emails", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: emailItem.id, to: target }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.error || "Failed to send email");
            showToast(json.message || `Sent "${emailItem.title}" to ${target}`, "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to send email", "error");
        } finally {
            setSendingEmailId(null);
        }
    };

    const triggerBlobDownload = (blob: Blob, filename: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const handleDownloadEmailPng = async (emailItem: SampleEmailItem) => {
        setDownloadingEmailId(emailItem.id);
        try {
            const res = await fetch(
                `/api/demo-console/emails/export?id=${encodeURIComponent(emailItem.id)}`,
                { cache: "no-store" }
            );
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json?.error || "Failed to export PNG");
            }
            const blob = await res.blob();
            if (blob.size === 0) throw new Error("Exported PNG was empty");
            triggerBlobDownload(blob, `ireside-email-${emailItem.id}.png`);
            showToast(`Downloaded ireside-email-${emailItem.id}.png`, "success");
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to export PNG", "error");
        } finally {
            setDownloadingEmailId(null);
        }
    };

    const handleDownloadAllEmailPngs = async () => {
        if (filteredSampleEmails.length === 0) return;
        setDownloadingAllEmails(true);
        try {
            const ids = filteredSampleEmails.map((e) => e.id).join(",");
            const res = await fetch(
                `/api/demo-console/emails/export?ids=${encodeURIComponent(ids)}`,
                { cache: "no-store" }
            );
            if (!res.ok) {
                const json = await res.json().catch(() => ({}));
                throw new Error(json?.error || "Failed to export ZIP");
            }
            const blob = await res.blob();
            if (blob.size === 0) throw new Error("Exported ZIP was empty");
            triggerBlobDownload(blob, "ireside-sample-emails.zip");
            showToast(
                `Downloaded ireside-sample-emails.zip (${filteredSampleEmails.length} PNGs)`,
                "success"
            );
        } catch (err) {
            showToast(err instanceof Error ? err.message : "Failed to export ZIP", "error");
        } finally {
            setDownloadingAllEmails(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground pb-20">
            {/* Sticky Top Command Bar */}
            <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-md">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    {/* Row 1: Title, Live Session Indicator, Soundboard */}
                    <div className="flex flex-col gap-3 py-3.5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
                                    <Building2 className="size-5" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                                        iReside Defense Console
                                    </h1>
                                    <p className="text-xs text-muted-foreground">
                                        Fast situational prep &amp; account switching for live panel Q&amp;A
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Controls: Live Session + Open Dashboard + Soundboard */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            <div className="flex min-h-[44px] items-center gap-2.5 rounded-xl border border-border/60 bg-card px-3.5 py-2 shadow-xs">
                                <span
                                    className={`size-2.5 shrink-0 rounded-full ${
                                        currentSession ? "bg-emerald-500" : "bg-zinc-400"
                                    }`}
                                    aria-hidden="true"
                                />
                                {sessionLoading ? (
                                    <span className="text-xs text-muted-foreground">Checking session…</span>
                                ) : currentSession ? (
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-xs font-semibold text-foreground">
                                            {currentSession.fullName}
                                        </span>
                                        <span
                                            className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${
                                                currentSession.role === "landlord"
                                                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                                    : "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300"
                                            }`}
                                        >
                                            {currentSession.role}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs font-medium text-muted-foreground">
                                        Signed out (Public)
                                    </span>
                                )}
                            </div>

                            {currentSession && (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => openDemoRoute(getDashboardPath(currentSession.role))}
                                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90"
                                    >
                                        <LayoutDashboard className="size-4" />
                                        Open Dashboard
                                        <ExternalLink className="size-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSignOut}
                                        disabled={busyAccountKey === "signout"}
                                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-xs transition hover:bg-muted/60 disabled:opacity-60"
                                        title="Sign out of current session"
                                    >
                                        <LogOut className="size-4" />
                                        <span className="hidden sm:inline">Sign Out</span>
                                    </button>
                                </>
                            )}

                            <Link
                                href="/demo-console/sounds"
                                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-border/60 bg-card px-3.5 py-2 text-xs font-semibold text-foreground shadow-xs transition hover:bg-muted/60"
                            >
                                <Volume2 className="size-4 text-primary" />
                                Soundboard
                            </Link>

                            {/* Launch Mode Toggle (Redirect vs. New Tab) */}
                            <div className="flex items-center gap-1 rounded-xl border border-border/60 bg-card p-1 text-xs">
                                <span className="px-2 font-bold text-muted-foreground text-[11px] hidden lg:inline">
                                    Click Action:
                                </span>
                                <button
                                    type="button"
                                    onClick={() => handleToggleLaunchMode("redirect")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                        launchMode === "redirect"
                                            ? "bg-primary text-primary-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                    title="Clicking Launch seeds data, switches account, and immediately redirects this window to the destination"
                                >
                                    Redirect (Fast)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleToggleLaunchMode("new_tab")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                        launchMode === "new_tab"
                                            ? "bg-primary text-primary-foreground shadow-xs"
                                            : "text-muted-foreground hover:text-foreground"
                                    }`}
                                    title="Clicking Launch seeds data, switches account, and opens destination in a new window/tab"
                                >
                                    New Tab
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Row 2: 3 Primary Tabs + Instant Search */}
                    <div className="flex flex-col gap-3 border-t border-border/50 py-3 md:flex-row md:items-center md:justify-between">
                        <nav className="flex flex-wrap gap-2" aria-label="Console sections">
                            <button
                                type="button"
                                onClick={() => setActiveTab("cases")}
                                className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                    activeTab === "cases"
                                        ? "bg-foreground text-background shadow-xs"
                                        : "border border-border/60 bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                }`}
                            >
                                <Compass className="size-4" />
                                Situational Cases
                                <span className="rounded-full bg-background/20 px-2 py-0.5 text-[11px] tabular-nums">
                                    {scenarios.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("accounts")}
                                className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                    activeTab === "accounts"
                                        ? "bg-foreground text-background shadow-xs"
                                        : "border border-border/60 bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                }`}
                            >
                                <Users className="size-4" />
                                Accounts &amp; Credentials
                                <span className="rounded-full bg-background/20 px-2 py-0.5 text-[11px] tabular-nums">
                                    {accounts.length + extraResidents.length}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("emails")}
                                className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                    activeTab === "emails"
                                        ? "bg-foreground text-background shadow-xs"
                                        : "border border-border/60 bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                }`}
                            >
                                <Mail className="size-4" />
                                Sample Emails
                                <span className="rounded-full bg-background/20 px-2 py-0.5 text-[11px] tabular-nums">
                                    {sampleEmails.length || 24}
                                </span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("reset")}
                                className={`inline-flex min-h-[44px] items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${
                                    activeTab === "reset"
                                        ? "bg-foreground text-background shadow-xs"
                                        : "border border-border/60 bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                }`}
                            >
                                <RotateCcw className="size-4" />
                                Reset &amp; Create
                            </button>
                        </nav>

                        {activeTab !== "reset" && (
                            <div className="relative w-full md:w-80">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    maxLength={60}
                                    placeholder={
                                        activeTab === "cases"
                                            ? "Search cases, rooms, or routes (press /)"
                                            : "Search name, email, or room (press /)"
                                    }
                                    className="min-h-[44px] w-full rounded-xl border border-border/60 bg-card pl-10 pr-11 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery("")}
                                        aria-label="Clear search"
                                        className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
                {/* ============================================================ */}
                {/* TAB 1: SITUATIONAL CASES                                     */}
                {/* ============================================================ */}
                {activeTab === "cases" && (
                    <section aria-label="Situational Cases">
                        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-base font-bold text-foreground">
                                    What does the panelist want to see?
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Click <strong>Prepare &amp; Switch</strong> to seed fresh data, switch accounts, and get a direct link.
                                </p>
                            </div>
                            <span className="text-xs font-medium text-muted-foreground tabular-nums">
                                Showing {filteredScenarios.length} of {scenarios.length} cases
                            </span>
                        </div>

                        {/* Category Filter Pills */}
                        <div className="mb-6 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory("All")}
                                className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                                    selectedCategory === "All"
                                        ? "border-primary bg-primary text-primary-foreground shadow-xs"
                                        : "border-border/60 bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                }`}
                            >
                                All
                            </button>
                            {DEMO_CATEGORIES.map((cat) => {
                                const meta = CATEGORY_META[cat];
                                const Icon = meta.icon;
                                const isActive = selectedCategory === cat;
                                return (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setSelectedCategory(cat)}
                                        className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition ${
                                            isActive
                                                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                                                : "border-border/60 bg-card text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                        }`}
                                    >
                                        <Icon className="size-3.5" />
                                        {cat}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Cases Grid */}
                        {filteredScenarios.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-2xl border border-border/60 bg-card p-10 text-center shadow-xs">
                                <Search className="mb-3 size-8 text-muted-foreground" />
                                <p className="text-base font-semibold text-foreground">
                                    No matching cases for &ldquo;{searchQuery}&rdquo;
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Try clearing your search or switching back to All categories.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedCategory("All");
                                    }}
                                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-border/60 bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/60"
                                >
                                    Clear All Filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {filteredScenarios.map((scenario) => {
                                    const account = accountByKey[scenario.as];
                                    const catMeta = CATEGORY_META[scenario.category];
                                    const CatIcon = catMeta.icon;
                                    const isBusy = busyScenarioId === scenario.id;
                                    const ready = readyTargets[scenario.id];

                                    return (
                                        <article
                                            key={scenario.id}
                                            className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-5 shadow-xs transition hover:border-primary/40"
                                        >
                                            <div>
                                                {/* Category Badge */}
                                                <div className="mb-3 flex items-center justify-between gap-2">
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${catMeta.badgeClass}`}
                                                    >
                                                        <CatIcon className="size-3.5" />
                                                        {scenario.category}
                                                    </span>
                                                    {scenario.prepareAction && (
                                                        <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                            Auto-Seeds Data
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Title & 1-sentence description */}
                                                <h3 className="text-base font-bold leading-snug text-foreground">
                                                    {scenario.title}
                                                </h3>
                                                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                                    {scenario.description}
                                                </p>

                                                {/* Use this when... */}
                                                <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-xs leading-relaxed">
                                                    <span className="font-bold text-primary">Use this when: </span>
                                                    <span className="text-foreground/90">{scenario.useWhen}</span>
                                                </div>

                                                {/* Who & Where */}
                                                <div className="mt-4 rounded-xl border border-border/50 bg-muted/30 p-3 text-xs">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="font-semibold text-muted-foreground">
                                                            Who &amp; Where
                                                        </span>
                                                        <span className="font-mono text-[11px] text-primary">
                                                            {ready?.path || scenario.path}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 font-semibold text-foreground">
                                                        {account.label}
                                                        {account.room ? ` (Room ${account.room})` : ""}
                                                        {account.role === "landlord" ? " — Landlord" : ""}
                                                    </p>
                                                    {scenario.tip && (
                                                        <p className="mt-1 text-[11px] text-muted-foreground">
                                                            Tip: {scenario.tip}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="mt-4 flex flex-col gap-2">
                                                {ready && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openDemoRoute(ready.path)}
                                                        className="inline-flex min-h-[44px] w-full items-center justify-between gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-500/20 dark:text-emerald-300"
                                                        title="Click to re-open target route"
                                                    >
                                                        <span className="flex items-center gap-2 truncate">
                                                            <CheckCircle2 className="size-4 shrink-0" />
                                                            Re-open: {ready.path}
                                                        </span>
                                                        <ArrowRight className="size-4 shrink-0" />
                                                    </button>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePrepareAndSwitch(scenario)}
                                                        disabled={isBusy}
                                                        className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-60"
                                                    >
                                                        {isBusy ? (
                                                            <>
                                                                <Loader2 className="size-4 animate-spin" />
                                                                Setting Up &amp; Launching…
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Zap className="size-4" />
                                                                Launch Scenario ⚡
                                                            </>
                                                        )}
                                                    </button>

                                                    {account.email ? (
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                copyText(
                                                                    `${account.email}\n${account.password ?? password}`,
                                                                    `${account.label} credentials`,
                                                                    `creds-${scenario.id}`
                                                                )
                                                            }
                                                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/60"
                                                            title="Copy email and password for incognito or mobile"
                                                        >
                                                            {copiedKey === `creds-${scenario.id}` ? (
                                                                <Check className="size-4 text-emerald-600" />
                                                            ) : (
                                                                <Copy className="size-4" />
                                                            )}
                                                            Copy Creds
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => openDemoRoute(scenario.path)}
                                                            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-muted/60"
                                                        >
                                                            <ExternalLink className="size-4" />
                                                            Open
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}
                    </section>
                )}

                {/* ============================================================ */}
                {/* TAB 2: ACCOUNTS & CREDENTIALS                                */}
                {/* ============================================================ */}
                {activeTab === "accounts" && (
                    <section aria-label="Accounts and Credentials" className="space-y-8">
                        {/* Role 1: Landlords */}
                        {landlordAccounts.length > 0 && (
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <h2 className="text-base font-bold text-foreground">
                                        Landlords
                                    </h2>
                                    <span className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                                        {landlordAccounts.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {landlordAccounts.map((acc) => (
                                        <AccountCard
                                            key={acc.key}
                                            account={acc}
                                            isCurrent={
                                                Boolean(acc.email) &&
                                                currentSession?.email?.toLowerCase() === acc.email?.toLowerCase()
                                            }
                                            isBusy={busyAccountKey === acc.key}
                                            copiedKey={copiedKey}
                                            onCopy={copyText}
                                            onSwitchAndOpen={() =>
                                                handleAccountSwitchAndOpen(
                                                    acc.key,
                                                    acc.label,
                                                    acc.email,
                                                    acc.password,
                                                    acc.role
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Role 2: Tenants */}
                        {(tenantAccounts.length > 0 || filteredExtraResidents.length > 0) && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-base font-bold text-foreground">
                                        Tenants
                                    </h2>
                                    <span className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                                        {tenantAccounts.length + filteredExtraResidents.length}
                                    </span>
                                </div>
                                {tenantAccounts.length > 0 && (
                                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                        {tenantAccounts.map((acc) => (
                                            <AccountCard
                                                key={acc.key}
                                                account={acc}
                                                isCurrent={
                                                    Boolean(acc.email) &&
                                                    currentSession?.email?.toLowerCase() === acc.email?.toLowerCase()
                                                }
                                                isBusy={busyAccountKey === acc.key}
                                                copiedKey={copiedKey}
                                                onCopy={copyText}
                                                onSwitchAndOpen={() =>
                                                    handleAccountSwitchAndOpen(
                                                        acc.key,
                                                        acc.label,
                                                        acc.email,
                                                        acc.password,
                                                        acc.role
                                                    )
                                                }
                                            />
                                        ))}
                                    </div>
                                )}

                                {/* Collapsible Additional & Assigned Tenants */}
                                {filteredExtraResidents.length > 0 && (
                                    <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
                            <button
                                type="button"
                                onClick={() => setShowBackgroundResidents((v) => !v)}
                                className="flex min-h-[44px] w-full items-center justify-between gap-3 text-left"
                            >
                                <div>
                                    <h2 className="text-base font-bold text-foreground">
                                        Background Residents ({filteredExtraResidents.length} settled tenants)
                                    </h2>
                                    <p className="text-xs text-muted-foreground">
                                        All share password <span className="font-mono font-semibold">{password}</span>
                                    </p>
                                </div>
                                {showBackgroundResidents || searchQuery ? (
                                    <ChevronUp className="size-5 text-muted-foreground" />
                                ) : (
                                    <ChevronDown className="size-5 text-muted-foreground" />
                                )}
                            </button>

                            {(showBackgroundResidents || Boolean(searchQuery)) && (
                                <div className="mt-4 grid grid-cols-1 gap-3 border-t border-border/50 pt-4 md:grid-cols-2 xl:grid-cols-3">
                                    {filteredExtraResidents.map((res) => (
                                        <div
                                            key={res.key}
                                            className="flex flex-col justify-between rounded-xl border border-border/60 bg-background p-4"
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="font-semibold text-foreground">
                                                        {res.label}
                                                    </span>
                                                    <span className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                                        Room {res.room}
                                                    </span>
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">{res.state}</p>
                                                <p className="mt-2 truncate font-mono text-xs text-foreground">
                                                    {res.email}
                                                </p>
                                            </div>
                                            <div className="mt-3 flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleAccountSwitchAndOpen(
                                                            res.key,
                                                            res.label,
                                                            res.email,
                                                            password,
                                                            "tenant"
                                                        )
                                                    }
                                                    disabled={busyAccountKey === res.key}
                                                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                                                >
                                                    {busyAccountKey === res.key ? (
                                                        <Loader2 className="size-3.5 animate-spin" />
                                                    ) : (
                                                        <ExternalLink className="size-3.5" />
                                                    )}
                                                    Switch &amp; Open
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        copyText(res.email, `${res.label} email`, `extra-${res.key}`)
                                                    }
                                                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60"
                                                >
                                                    {copiedKey === `extra-${res.key}` ? (
                                                        <Check className="size-3.5 text-emerald-600" />
                                                    ) : (
                                                        <Copy className="size-3.5" />
                                                    )}
                                                    Email
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Role 3: Public / Guest */}
                        {publicAccounts.length > 0 && (
                            <div>
                                <div className="mb-3 flex items-center gap-2">
                                    <h2 className="text-base font-bold text-foreground">
                                        Public / Guest
                                    </h2>
                                    <span className="rounded-full border border-border/60 bg-muted/40 px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                                        {publicAccounts.length}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                                    {publicAccounts.map((acc) => (
                                        <AccountCard
                                            key={acc.key}
                                            account={acc}
                                            isCurrent={false}
                                            isBusy={busyAccountKey === acc.key}
                                            copiedKey={copiedKey}
                                            onCopy={copyText}
                                            onSwitchAndOpen={() =>
                                                handleAccountSwitchAndOpen(
                                                    acc.key,
                                                    acc.label,
                                                    acc.email,
                                                    acc.password,
                                                    acc.role
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* ============================================================ */}
                {/* TAB 3: SAMPLE EMAILS                                         */}
                {/* ============================================================ */}
                {activeTab === "emails" && (
                    <section aria-label="Sample System Emails" className="space-y-6">
                        {/* Top Controls: Category Filter & Optional Gmail Test Sender */}
                        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-xs">
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                                        <Mail className="size-5 text-primary" />
                                        All System Email Templates ({sampleEmails.length || 24})
                                    </h2>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        Live HTML previews rendered directly from the production email templates sent to Gmail.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                    <input
                                        type="email"
                                        value={testRecipientEmail}
                                        onChange={(e) => setTestRecipientEmail(e.target.value)}
                                        placeholder="Optional: your.email@gmail.com"
                                        aria-label="Test recipient Gmail address"
                                        maxLength={80}
                                        className="min-h-[44px] w-full rounded-xl border border-border/60 bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none sm:w-64"
                                    />
                                    <span
                                        className={`inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold ${
                                            smtpConfigured
                                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                                : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                        }`}
                                    >
                                        {smtpConfigured ? "SMTP Ready" : "Preview Only (SMTP not set)"}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => void handleDownloadAllEmailPngs()}
                                        disabled={downloadingAllEmails || filteredSampleEmails.length === 0}
                                        className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {downloadingAllEmails ? (
                                            <Loader2 className="size-3.5 animate-spin" />
                                        ) : (
                                            <Download className="size-3.5" />
                                        )}
                                        Download All ZIP ({filteredSampleEmails.length})
                                    </button>
                                </div>
                            </div>

                            {emailCategories.length > 1 && (
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {emailCategories.map((cat) => {
                                        const active = selectedEmailCategory === cat;
                                        return (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setSelectedEmailCategory(cat)}
                                                className={`min-h-[38px] rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                                                    active
                                                        ? "border-primary bg-primary text-primary-foreground"
                                                        : "border-border/60 bg-background text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {emailsLoading ? (
                            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-border/60 bg-card p-8">
                                <div className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground">
                                    <Loader2 className="size-4 animate-spin text-primary" />
                                    Rendering all system email templates…
                                </div>
                            </div>
                        ) : emailsError ? (
                            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/5 p-8 text-center">
                                <AlertCircle className="size-6 text-rose-600" />
                                <p className="text-sm font-semibold text-foreground">{emailsError}</p>
                                <button
                                    type="button"
                                    onClick={() => void loadSampleEmails()}
                                    className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                                >
                                    <RefreshCw className="size-4" />
                                    Try Again
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
                                {/* Left: Email List */}
                                <div className="max-h-[760px] space-y-2 overflow-y-auto rounded-2xl border border-border/60 bg-card p-3 shadow-xs">
                                    {filteredSampleEmails.length === 0 ? (
                                        <p className="p-6 text-center text-sm text-muted-foreground">
                                            No email templates match your filter.
                                        </p>
                                    ) : (
                                        filteredSampleEmails.map((item) => {
                                            const isSelected = activeSampleEmail?.id === item.id;
                                            return (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => setSelectedEmailId(item.id)}
                                                    className={`w-full rounded-xl border p-3.5 text-left transition ${
                                                        isSelected
                                                            ? "border-primary bg-primary/10"
                                                            : "border-transparent bg-background hover:border-border/60 hover:bg-muted/40"
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                                                            {item.category}
                                                        </span>
                                                        <span className="rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                                                            To: {item.recipientRole}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-sm font-bold text-foreground">
                                                        {item.title}
                                                    </p>
                                                    <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                                        {item.subject}
                                                    </p>
                                                </button>
                                            );
                                        })
                                    )}
                                </div>

                                {/* Right: Email Preview */}
                                {activeSampleEmail && (
                                    <div className="flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-xs">
                                        <div className="border-b border-border/60 bg-muted/20 p-5">
                                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                                                            {activeSampleEmail.category}
                                                        </span>
                                                        <span className="rounded-full border border-border/60 bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                                                            Recipient: {activeSampleEmail.recipientRole}
                                                        </span>
                                                    </div>
                                                    <h3 className="mt-2 text-base font-bold text-foreground">
                                                        {activeSampleEmail.subject}
                                                    </h3>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {activeSampleEmail.trigger}
                                                    </p>
                                                </div>

                                                <div className="flex shrink-0 flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setEmailViewMode((m) =>
                                                                m === "html" ? "text" : "html"
                                                            )
                                                        }
                                                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60"
                                                    >
                                                        <FileText className="size-3.5" />
                                                        {emailViewMode === "html" ? "Plain Text" : "HTML View"}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            copyText(
                                                                activeSampleEmail.subject,
                                                                "email subject",
                                                                `subj-${activeSampleEmail.id}`
                                                            )
                                                        }
                                                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60"
                                                    >
                                                        {copiedKey === `subj-${activeSampleEmail.id}` ? (
                                                            <Check className="size-3.5 text-emerald-600" />
                                                        ) : (
                                                            <Copy className="size-3.5" />
                                                        )}
                                                        Subject
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleDownloadEmailPng(activeSampleEmail)}
                                                        disabled={downloadingEmailId === activeSampleEmail.id}
                                                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {downloadingEmailId === activeSampleEmail.id ? (
                                                            <Loader2 className="size-3.5 animate-spin" />
                                                        ) : (
                                                            <Download className="size-3.5" />
                                                        )}
                                                        Download PNG
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleSendSampleEmail(activeSampleEmail)}
                                                        disabled={!smtpConfigured || sendingEmailId === activeSampleEmail.id}
                                                        title={
                                                            smtpConfigured
                                                                ? "Send this sample email to the Gmail address above"
                                                                : "Configure SMTP_USER and SMTP_PASS to send live test emails"
                                                        }
                                                        className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {sendingEmailId === activeSampleEmail.id ? (
                                                            <Loader2 className="size-3.5 animate-spin" />
                                                        ) : (
                                                            <Send className="size-3.5" />
                                                        )}
                                                        Send to Gmail
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        {emailViewMode === "html" ? (
                                            <iframe
                                                title={activeSampleEmail.title}
                                                srcDoc={activeSampleEmail.htmlBody}
                                                sandbox="allow-same-origin"
                                                className="h-[640px] w-full bg-white"
                                            />
                                        ) : (
                                            <pre className="h-[640px] overflow-auto whitespace-pre-wrap bg-background p-6 font-mono text-xs leading-relaxed text-foreground">
                                                {activeSampleEmail.textBody || "(No plain-text fallback defined)"}
                                            </pre>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </section>
                )}

                {/* ============================================================ */}
                {/* TAB 3: RESET & CREATE                                        */}
                {/* ============================================================ */}
                {activeTab === "reset" && (
                    <section aria-label="Reset and Create" className="space-y-6">
                        {/* Guided Onboarding & Tour Controls */}
                        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-base font-bold text-foreground">
                                        Guided Onboarding &amp; Product Tours
                                    </h2>
                                    <p className="mt-0.5 text-sm text-muted-foreground">
                                        Turn the guided onboarding prompts ON or OFF on the spot, or reset the full 5-stage setup.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
                                {[
                                    {
                                        key: "toggle-landlord-onboarding:on",
                                        action: "toggle-landlord-onboarding" as const,
                                        mode: "on" as const,
                                        title: "Landlord Tour: ON",
                                        desc: "Shows guided tour on John's dashboard.",
                                        tone: "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60",
                                    },
                                    {
                                        key: "toggle-landlord-onboarding:off",
                                        action: "toggle-landlord-onboarding" as const,
                                        mode: "off" as const,
                                        title: "Landlord Tour: OFF",
                                        desc: "Hides onboarding & tour prompts on dashboard.",
                                        tone: "border-border/60 bg-background hover:border-primary/40",
                                    },
                                    {
                                        key: "toggle-landlord-onboarding:reset",
                                        action: "toggle-landlord-onboarding" as const,
                                        mode: "reset" as const,
                                        title: "Reset 5-Stage Setup",
                                        desc: "Resets Practice Landlord 1 back to /setup.",
                                        tone: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500/60",
                                    },
                                    {
                                        key: "toggle-tenant-tour:on",
                                        action: "toggle-tenant-tour" as const,
                                        mode: "on" as const,
                                        title: "Tenant Tour: ON",
                                        desc: "Enables Mark Lim's first-login tour.",
                                        tone: "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/60",
                                    },
                                    {
                                        key: "toggle-tenant-tour:off",
                                        action: "toggle-tenant-tour" as const,
                                        mode: "off" as const,
                                        title: "Tenant Tour: OFF",
                                        desc: "Marks Mark Lim's tenant tour complete.",
                                        tone: "border-border/60 bg-background hover:border-primary/40",
                                    },
                                ].map((btn) => {
                                    const isBusy = busyActionKey === btn.key;
                                    return (
                                        <button
                                            key={btn.key}
                                            type="button"
                                            onClick={() => handleOnboardingControl(btn.action, btn.mode, btn.title)}
                                            disabled={isBusy}
                                            className={`flex min-h-[76px] flex-col items-start justify-between rounded-xl border p-3.5 text-left transition disabled:opacity-60 ${btn.tone}`}
                                        >
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <span className="text-sm font-bold text-foreground">{btn.title}</span>
                                                {isBusy && <Loader2 className="size-4 animate-spin text-primary" />}
                                            </div>
                                            <p className="mt-1 text-xs text-muted-foreground">{btn.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Resets (< 1s) */}
                        <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
                            <h2 className="text-base font-bold text-foreground">
                                Quick Resets (&lt; 1 second)
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Restore a specific feature without wiping the whole database.
                            </p>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {[
                                    {
                                        key: "quick-reset-katrina",
                                        title: "Reset Katrina E-Sign",
                                        desc: "Sets Room 201 lease back to Pending Tenant Signature + fresh 30d link.",
                                        icon: PenTool,
                                    },
                                    {
                                        key: "quick-reset-joshua-bill",
                                        title: "Reset Joshua GCash Bill",
                                        desc: "Restores Oct Under Review & Nov Pending Pay Now for Room 102.",
                                        icon: CreditCard,
                                    },
                                    {
                                        key: "reset-tenant-tour",
                                        title: "Reset Mark Lim Tour",
                                        desc: "Resets Room 301 tenant to first-login guided tour state.",
                                        icon: Compass,
                                    },
                                    {
                                        key: "prepare-starter-onboarding",
                                        title: "Reset Starter Landlord (Setup)",
                                        desc: "Prepares practice.landlord1@ireside.ph for 5-stage /setup.",
                                        icon: Building2,
                                    },
                                    {
                                        key: "reset-starter-landlord",
                                        title: "Reset Starter Landlord (Unclaimed)",
                                        desc: "Sets practice.landlord1@ireside.ph back to unclaimed state.",
                                        icon: KeyRound,
                                    },
                                    {
                                        key: "seed-notifications",
                                        title: "Push Fresh Notifications",
                                        desc: "Sends 3 unread real-time alerts to John & Joshua.",
                                        icon: Bell,
                                    },
                                ].map((item) => {
                                    const Icon = item.icon;
                                    const isBusy = busyActionKey === item.key;
                                    return (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={() =>
                                                handleQuickReset(item.key, item.title, `${item.title} finished.`)
                                            }
                                            disabled={isBusy}
                                            className="flex min-h-[88px] flex-col items-start justify-between rounded-xl border border-border/60 bg-background p-4 text-left transition hover:border-primary/40 hover:bg-muted/30 disabled:opacity-60"
                                        >
                                            <div className="flex w-full items-center justify-between gap-2">
                                                <span className="flex items-center gap-2 text-sm font-bold text-foreground">
                                                    <Icon className="size-4 text-primary" />
                                                    {item.title}
                                                </span>
                                                {isBusy && <Loader2 className="size-4 animate-spin text-primary" />}
                                            </div>
                                            <p className="mt-1.5 text-xs text-muted-foreground">{item.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>

                            {quickResetResult && (
                                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                                            {quickResetResult.title}
                                        </p>
                                        <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-300">
                                            {quickResetResult.message}
                                        </p>
                                        {quickResetResult.copyValue && (
                                            <p className="mt-1 truncate font-mono text-xs text-foreground">
                                                {quickResetResult.copyValue}
                                            </p>
                                        )}
                                    </div>
                                    {quickResetResult.copyValue && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                copyText(
                                                    quickResetResult.copyValue!,
                                                    quickResetResult.copyLabel || "value",
                                                    "quick-reset-copy"
                                                )
                                            }
                                            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl border border-emerald-600/30 bg-background px-4 py-2 text-xs font-semibold text-foreground hover:bg-muted/60"
                                        >
                                            <Copy className="size-4" />
                                            Copy {quickResetResult.copyLabel}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Create & Manage Users */}
                        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            {/* Create Fresh Claimable Landlord */}
                            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
                                <h2 className="text-base font-bold text-foreground">
                                    Create Fresh Claimable Landlord
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Generates a brand-new landlord account ready for the account-claim &amp; onboarding flow.
                                </p>

                                <button
                                    type="button"
                                    onClick={handleCreateFreshLandlord}
                                    disabled={busyActionKey === "create-fresh-landlord"}
                                    className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-60"
                                >
                                    {busyActionKey === "create-fresh-landlord" ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Creating Account…
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="size-4" />
                                            Create Fresh Landlord
                                        </>
                                    )}
                                </button>

                                {createdLandlord && (
                                    <div className="mt-4 rounded-xl border border-border/60 bg-muted/30 p-4">
                                        <p className="text-xs font-semibold text-muted-foreground">
                                            New Claimable Account Ready
                                        </p>
                                        <p className="mt-1 font-mono text-sm font-bold text-foreground">
                                            {createdLandlord.email}
                                        </p>
                                        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                                            Temporary Pass: {createdLandlord.password}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                copyText(
                                                    `${createdLandlord.email}\n${createdLandlord.password}`,
                                                    "new landlord credentials",
                                                    "new-landlord"
                                                )
                                            }
                                            className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-border/60 bg-background px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted/60"
                                        >
                                            <Copy className="size-3.5" />
                                            Copy Email &amp; Password
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Delete Test User by Email */}
                            <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-xs">
                                <h2 className="text-base font-bold text-foreground">
                                    Delete Test User by Email
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Purges a test applicant or user (e.g. Marco Reyes) so they can re-apply cleanly.
                                </p>

                                <form noValidate onSubmit={handleDeleteUserSubmit} className="mt-4 space-y-3">
                                    <div>
                                        <label
                                            htmlFor="delete-user-email"
                                            className="mb-1.5 block text-xs font-semibold text-foreground"
                                        >
                                            User Email Address
                                        </label>
                                        <input
                                            ref={deleteInputRef}
                                            id="delete-user-email"
                                            type="email"
                                            maxLength={50}
                                            value={deleteEmail}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setDeleteEmail(val);
                                                if (deleteTouched) {
                                                    setDeleteEmailError(validateDeleteEmail(val));
                                                }
                                            }}
                                            onBlur={() => {
                                                setDeleteTouched(true);
                                                setDeleteEmailError(validateDeleteEmail(deleteEmail));
                                            }}
                                            placeholder="marco.reyes@ireside.ph"
                                            className={`min-h-[44px] w-full rounded-xl border bg-background px-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 ${
                                                deleteEmailError
                                                    ? "border-rose-500 focus:ring-rose-500/20"
                                                    : "border-border/60 focus:border-primary focus:ring-primary/20"
                                            }`}
                                        />
                                        {deleteEmailError && (
                                            <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
                                                <AlertCircle className="size-3.5 shrink-0" />
                                                {deleteEmailError}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={busyActionKey === "delete-user"}
                                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-500/20 disabled:opacity-60 dark:text-rose-300"
                                    >
                                        {busyActionKey === "delete-user" ? (
                                            <>
                                                <Loader2 className="size-4 animate-spin" />
                                                Deleting…
                                            </>
                                        ) : (
                                            <>
                                                <Trash2 className="size-4" />
                                                Delete User &amp; Applications
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Full Database Reset */}
                        <div className="rounded-2xl border border-rose-500/30 bg-card p-6 shadow-xs">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="flex items-center gap-2 text-base font-bold text-foreground">
                                        <ShieldAlert className="size-5 text-rose-600 dark:text-rose-400" />
                                        Full Database Reset
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Wipes and re-seeds the entire defense baseline (24 units, 18 residents, invoices, leases, messages). Takes ~15 seconds.
                                    </p>
                                    {!resetAvailable && (
                                        <p className="mt-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                                            Disabled in production environment (NODE_ENV=production).
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setResetModalOpen(true)}
                                    disabled={!resetAvailable || resettingDb}
                                    className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {resettingDb ? (
                                        <>
                                            <Loader2 className="size-4 animate-spin" />
                                            Resetting Database…
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcw className="size-4" />
                                            Full Database Reset
                                        </>
                                    )}
                                </button>
                            </div>

                            {resetLog && (
                                <pre className="mt-4 max-h-64 overflow-auto rounded-xl border border-border/60 bg-muted/40 p-4 font-mono text-xs text-foreground">
                                    {resetLog}
                                </pre>
                            )}
                        </div>
                    </section>
                )}
            </main>

            {/* Full Reset Confirmation Modal */}
            {resetModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="reset-modal-title"
                >
                    <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card p-6 shadow-xl">
                        <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="size-5" />
                            </div>
                            <div>
                                <h3 id="reset-modal-title" className="text-base font-bold text-foreground">
                                    Reset Entire Database?
                                </h3>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    This will wipe any live edits made during your rehearsal and restore the clean defense baseline.
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => setResetModalOpen(false)}
                                className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border/60 bg-background px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/60"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleFullDatabaseReset}
                                className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
                            >
                                Reset Entire Database
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast && (
                <div
                    role="status"
                    className={`fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-3 rounded-xl border px-4 py-3 text-sm font-semibold shadow-lg ${
                        toast.type === "error"
                            ? "border-rose-500/40 bg-rose-600 text-white"
                            : toast.type === "info"
                            ? "border-border/60 bg-card text-foreground"
                            : "border-emerald-500/40 bg-emerald-600 text-white"
                    }`}
                >
                    <span className="flex-1">{toast.message}</span>
                    <button
                        type="button"
                        onClick={() => setToast(null)}
                        aria-label="Dismiss notification"
                        className="flex size-11 shrink-0 items-center justify-center rounded-lg hover:bg-black/15"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

interface AccountCardProps {
    account: DemoAccount;
    isCurrent: boolean;
    isBusy: boolean;
    copiedKey: string | null;
    onCopy: (text: string, label: string, keyId?: string) => void;
    onSwitchAndOpen: () => void;
}

function AccountCard({
    account,
    isCurrent,
    isBusy,
    copiedKey,
    onCopy,
    onSwitchAndOpen,
}: AccountCardProps) {
    return (
        <article
            className={`flex flex-col justify-between rounded-2xl border p-5 shadow-xs transition ${
                isCurrent
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-border/60 bg-card"
            }`}
        >
            <div>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground">
                            <User className="size-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-foreground">{account.label}</h3>
                            <p className="text-xs text-muted-foreground">
                                {account.room ? `Room ${account.room}` : account.role.toUpperCase()}
                            </p>
                        </div>
                    </div>
                    {isCurrent && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                            Active
                        </span>
                    )}
                </div>

                <p className="mt-2.5 text-xs text-muted-foreground">{account.state}</p>

                {account.email && (
                    <div className="mt-3 space-y-1.5 rounded-xl border border-border/50 bg-muted/30 p-3 text-xs">
                        <div className="flex items-center justify-between gap-2">
                            <span className="truncate font-mono text-foreground">{account.email}</span>
                            <button
                                type="button"
                                onClick={() => onCopy(account.email!, `${account.label} email`, `email-${account.key}`)}
                                className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10"
                            >
                                {copiedKey === `email-${account.key}` ? (
                                    <Check className="size-3.5" />
                                ) : (
                                    <Copy className="size-3.5" />
                                )}
                                Copy
                            </button>
                        </div>
                        {account.password && (
                            <div className="flex items-center justify-between gap-2">
                                <span className="font-mono text-muted-foreground">{account.password}</span>
                                <button
                                    type="button"
                                    onClick={() =>
                                        onCopy(account.password!, "password", `pass-${account.key}`)
                                    }
                                    className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/10"
                                >
                                    {copiedKey === `pass-${account.key}` ? (
                                        <Check className="size-3.5" />
                                    ) : (
                                        <Copy className="size-3.5" />
                                    )}
                                    Copy
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <button
                type="button"
                onClick={onSwitchAndOpen}
                disabled={isBusy}
                className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:opacity-60"
            >
                {isBusy ? (
                    <>
                        <Loader2 className="size-4 animate-spin" />
                        Switching…
                    </>
                ) : (
                    <>
                        <ExternalLink className="size-4" />
                        {account.role === "public" ? "Sign Out & Open" : "Switch & Open"}
                    </>
                )}
            </button>
        </article>
    );
}
