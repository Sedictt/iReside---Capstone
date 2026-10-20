"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { DemoAccount, DemoAccountKey, DemoScenario } from "./scenarios";
import {
    Search,
    X,
    ExternalLink,
    RotateCcw,
    Copy,
    Check,
    Sparkles,
    Star,
    User,
    Crown,
    Building2,
    Shield,
    Sliders,
    Zap,
    PenTool,
    Receipt,
    Wallet,
    Wrench,
    Map as MapIcon,
    MessageSquare,
    BarChart3,
    Smartphone,
    UserPlus,
    CheckCircle2,
    FileText,
    AlertTriangle,
    LogOut,
    RefreshCw,
    Bot,
    Grid,
    Info,
    ChevronDown,
    ChevronUp,
    Terminal,
    ArrowRight,
    Clock,
    Lock,
    CheckSquare,
    Banknote,
    Coins,
    BellRing,
    FileSpreadsheet,
    CalendarRange,
    Archive,
    Megaphone,
    Bell,
    LayoutDashboard,
    Calendar,
    Folder,
    Home,
    History,
    Palette,
    UserCog,
    FileCheck2,
    LogIn,
    KeyRound,
    Download,
    BookOpen,
    FileSignature,
    ShieldCheck,
    FileSearch,
    CalendarCheck,
    ClipboardCheck,
    ArrowRightLeft,
    ArrowUpRight,
    FilePlus2,
    Printer,
    Coffee,
    Volume2,
    type LucideIcon,
} from "lucide-react";

interface Props {
    accounts: DemoAccount[];
    password: string;
    scenarios: DemoScenario[];
    resetAvailable: boolean;
}

const DEMO_WINDOW_NAME = "ireside-demo";

type Status =
    | { kind: "idle" }
    | { kind: "busy"; text: string }
    | { kind: "ok"; text: string }
    | { kind: "error"; text: string };

interface ScenarioMeta {
    icon: LucideIcon;
    badge: string;
    isTopPick?: boolean;
    color: "emerald" | "violet" | "amber" | "rose" | "blue" | "teal" | "sky" | "orange";
}

// Icon and visual identity dictionary for each scenario ID
const SCENARIO_META: Record<string, ScenarioMeta> = {
    // Tenant intake
    "apply-online": { icon: UserPlus, badge: "QR / Public Link", isTopPick: true, color: "emerald" },
    "invite-manager": { icon: Printer, badge: "QR & Links Manager", isTopPick: true, color: "emerald" },
    "walkin": { icon: FileText, badge: "Walk-in Form", color: "emerald" },
    "review-app": { icon: CheckCircle2, badge: "Approve Applicant", isTopPick: true, color: "emerald" },
    "app-reviewing": { icon: FileSearch, badge: "ID Verification", color: "blue" },
    "prospect-portal": { icon: Wallet, badge: "Deposit Portal", color: "amber" },
    "payment-pending": { icon: Receipt, badge: "Confirm Advance", color: "emerald" },

    // Lease signing
    "sign-tenant": { icon: PenTool, badge: "Tenant E-Sign", isTopPick: true, color: "violet" },
    "sign-landlord": { icon: FileSignature, badge: "Countersign Lease", isTopPick: true, color: "emerald" },
    "audit-trail": { icon: ShieldCheck, badge: "Audit Trail & IP", color: "violet" },
    "lease-view": { icon: FileText, badge: "Contract Viewer", color: "blue" },
    "lease-term": { icon: CalendarRange, badge: "Term Types", color: "teal" },

    // Rent & utilities
    "utility-billing": { icon: Zap, badge: "Meter Readings", isTopPick: true, color: "amber" },
    "invoice-tenant": { icon: Receipt, badge: "Itemized Invoice", color: "blue" },
    "pay-gcash": { icon: Wallet, badge: "GCash Payment", isTopPick: true, color: "sky" },
    "verify-gcash": { icon: CheckSquare, badge: "Verify Proof", isTopPick: true, color: "emerald" },
    "pay-cash-tenant": { icon: Banknote, badge: "Cash Intent", color: "teal" },
    "collect-cash": { icon: Coins, badge: "Collect Cash", color: "emerald" },
    "reminder": { icon: BellRing, badge: "Overdue Notice", color: "rose" },
    "issue-invoice": { icon: FilePlus2, badge: "One-Off Invoice", color: "blue" },
    "expenses": { icon: FileSpreadsheet, badge: "Ledger & CSV", color: "emerald" },
    "payout": { icon: ArrowUpRight, badge: "GCash Payout", color: "sky" },

    // Maintenance
    "ticket-new": { icon: AlertTriangle, badge: "Sparking Outlet", color: "rose" },
    "ticket-triage": { icon: Sparkles, badge: "AI Smart Triage", isTopPick: true, color: "violet" },
    "ticket-progress": { icon: Wrench, badge: "Plumber on Site", color: "amber" },

    // Lifecycle
    "renewal": { icon: RefreshCw, badge: "Renewal Terms", color: "blue" },
    "renewal-tenant": { icon: CalendarCheck, badge: "Renewal Request", color: "violet" },
    "moveout": { icon: LogOut, badge: "Inspection & Refund", isTopPick: true, color: "rose" },
    "moveout-tenant": { icon: ClipboardCheck, badge: "Move-Out Request", color: "rose" },
    "transfer": { icon: ArrowRightLeft, badge: "Unit Transfer", color: "teal" },
    "tenants": { icon: User, badge: "Resident Roster", color: "emerald" },
    "archive": { icon: Archive, badge: "Archived Resident", color: "teal" },

    // Property
    "unit-map": { icon: MapIcon, badge: "3-Floor Blueprint", isTopPick: true, color: "emerald" },
    "properties": { icon: Building2, badge: "Property Specs", color: "emerald" },
    "environment": { icon: Clock, badge: "Curfew & Rules", color: "amber" },
    "amenities": { icon: Coffee, badge: "Study Hall Booking", color: "blue" },
    "flyer": { icon: Printer, badge: "Printable QR Flyer", color: "emerald" },

    // Communication
    "messages": { icon: MessageSquare, badge: "Tenant Chat", color: "emerald" },
    "community": { icon: Megaphone, badge: "Notice Board & Poll", color: "violet" },
    "community-tenant": { icon: Megaphone, badge: "Community Feed", color: "blue" },
    "notifications": { icon: Bell, badge: "Activity Alerts", color: "amber" },
    "iris-landlord": { icon: Bot, badge: "iRis AI Finance", isTopPick: true, color: "violet" },
    "iris-tenant": { icon: Bot, badge: "iRis AI Inquiries", color: "violet" },

    // Dashboard & analytics
    "dashboard": { icon: LayoutDashboard, badge: "Today's Overview", color: "emerald" },
    "analytics": { icon: BarChart3, badge: "Reports & PDF", color: "blue" },
    "calendar": { icon: Calendar, badge: "Ops Calendar", color: "amber" },
    "documents": { icon: Folder, badge: "Permit Vault", color: "emerald" },
    "tenant-dashboard": { icon: Home, badge: "First Login Tour", color: "violet" },

    // Settings
    "settings-landlord": { icon: Sliders, badge: "Elderly-Friendly Hub", color: "emerald" },
    "security": { icon: Shield, badge: "2-Step & Devices", color: "rose" },
    "activity": { icon: History, badge: "Audit History", color: "blue" },
    "branding": { icon: Palette, badge: "White-Label Brand", color: "violet" },
    "settings-tenant": { icon: UserCog, badge: "Tenant Settings", color: "blue" },
    "privacy": { icon: FileCheck2, badge: "Data Privacy Act", color: "emerald" },

    // Platform
    "login": { icon: LogIn, badge: "Bilingual Sign-in", color: "emerald" },
    "forgot": { icon: KeyRound, badge: "Email OTP Recovery", color: "amber" },
    "mobile-tenant": { icon: Smartphone, badge: "Mobile Shell (Tenant)", color: "violet" },
    "mobile-landlord": { icon: Smartphone, badge: "Mobile Shell (Owner)", color: "emerald" },
    "download": { icon: Download, badge: "Android APK", color: "emerald" },
    "docs": { icon: BookOpen, badge: "User Manual", color: "blue" },
};

// Soothing, eye-friendly pastel badge and icon colors for light theme
const COLOR_MAP = {
    emerald: {
        bg: "#ecfdf5",
        border: "#a7f3d0",
        text: "#059669",
    },
    violet: {
        bg: "#f5f3ff",
        border: "#ddd6fe",
        text: "#7c3aed",
    },
    amber: {
        bg: "#fffbeb",
        border: "#fde68a",
        text: "#b45309",
    },
    rose: {
        bg: "#fff1f2",
        border: "#fecdd3",
        text: "#e11d48",
    },
    blue: {
        bg: "#eff6ff",
        border: "#bfdbfe",
        text: "#2563eb",
    },
    teal: {
        bg: "#f0fdfa",
        border: "#99f6e4",
        text: "#0d9488",
    },
    sky: {
        bg: "#f0f9ff",
        border: "#bae6fd",
        text: "#0284c7",
    },
    orange: {
        bg: "#fff7ed",
        border: "#fed7aa",
        text: "#c2410c",
    },
};

const CATEGORIES = [
    { id: "all", label: "All Scenarios", icon: Grid },
    { id: "top-picks", label: "⭐ Top Defense Picks", icon: Star },
    { id: "Tenant intake", label: "Intake & QR", icon: UserPlus },
    { id: "Digital lease signing", label: "Lease E-Sign", icon: PenTool },
    { id: "Rent & utilities", label: "Rent & Utilities", icon: Coins },
    { id: "Maintenance", label: "Maintenance", icon: Wrench },
    { id: "Tenant lifecycle", label: "Lifecycle", icon: RefreshCw },
    { id: "Property & rooms", label: "Property & Map", icon: Building2 },
    { id: "Communication", label: "Chat & AI", icon: MessageSquare },
    { id: "Dashboard & analytics", label: "Analytics", icon: BarChart3 },
    { id: "Settings & security", label: "Settings", icon: Shield },
    { id: "Platform", label: "Platform & Mobile", icon: Smartphone },
];

const KEYWORD_CHIPS = [
    { label: "⭐ Defense Must-Shows", query: "top-pick" },
    { label: "✍️ E-Sign Lease", query: "sign" },
    { label: "💳 GCash Payment", query: "gcash" },
    { label: "⚡ Meter Readings", query: "meter" },
    { label: "🛠️ Smart Triage", query: "triage" },
    { label: "🗺️ Unit Map", query: "unit-map" },
    { label: "🤖 iRis AI", query: "iris" },
    { label: "🚪 Move-Out", query: "move-out" },
    { label: "📱 Mobile App", query: "mobile" },
];

export function DemoConsole({ accounts, password, scenarios, resetAvailable }: Props) {
    const [status, setStatus] = useState<Status>({ kind: "idle" });
    const [current, setCurrent] = useState<string | null>(null);
    const [query, setQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedRole, setSelectedRole] = useState<"all" | "landlord" | "tenant" | "public">("all");
    const [showPresenterCues, setShowPresenterCues] = useState(false);
    const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
    const [resetLog, setResetLog] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);
    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [showResetLog, setShowResetLog] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "info" | "error" } | null>(null);
    const [lastLaunchedId, setLastLaunchedId] = useState<string | null>(null);

    const searchInputRef = useRef<HTMLInputElement>(null);

    const accountByKey = useMemo(
        () => Object.fromEntries(accounts.map((a) => [a.key, a])) as Record<DemoAccountKey, DemoAccount>,
        [accounts],
    );

    // Show temporary toast notification
    const showToast = useCallback((message: string, type: "success" | "info" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3200);
    }, []);

    // Fetch active Supabase user on mount and suppress cookie banner
    useEffect(() => {
        let cancelled = false;
        createClient()
            .auth.getUser()
            .then(({ data }) => {
                if (!cancelled) setCurrent(data.user?.email ?? null);
            })
            .catch(() => {
                if (!cancelled) setCurrent(null);
            });
        try {
            localStorage.setItem("ireside-consent-v1", JSON.stringify({ essential: true, analytics: true, marketing: false }));
        } catch {
            // ignore
        }
        return () => {
            cancelled = true;
        };
    }, []);

    // Keyboard shortcut: '/' to focus search, 'Esc' to clear search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "/" && document.activeElement !== searchInputRef.current) {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === "Escape") {
                if (query) {
                    setQuery("");
                } else {
                    setResetModalOpen(false);
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [query]);

    // Copy to clipboard helper
    const copyText = useCallback((text: string, label: string) => {
        navigator.clipboard.writeText(text);
        showToast(`✓ Copied ${label} to clipboard!`);
    }, [showToast]);

    // Filter scenarios
    const filteredScenarios = useMemo(() => {
        const q = query.trim().toLowerCase();

        return scenarios.filter((s) => {
            const meta = SCENARIO_META[s.id];
            const account = accountByKey[s.as];

            // Category filter
            if (selectedCategory === "top-picks" && !meta?.isTopPick) return false;
            if (selectedCategory !== "all" && selectedCategory !== "top-picks" && s.group !== selectedCategory) return false;

            // Role filter
            if (selectedRole !== "all" && account.role !== selectedRole) return false;

            // Search query filter
            if (!q) return true;
            if (q === "top-pick") return Boolean(meta?.isTopPick);

            const searchPayload = `${s.group} ${s.title} ${meta?.badge ?? ""} ${s.steps ?? ""} ${s.say ?? ""} ${account.label} ${account.room ? `room ${account.room}` : ""} ${s.path}`.toLowerCase();
            return searchPayload.includes(q);
        });
    }, [scenarios, query, selectedCategory, selectedRole, accountByKey]);

    // Grouping for render
    const groupedScenarios = useMemo(() => {
        const map = new Map<string, DemoScenario[]>();
        for (const s of filteredScenarios) {
            if (!map.has(s.group)) map.set(s.group, []);
            map.get(s.group)!.push(s);
        }
        return [...map.entries()];
    }, [filteredScenarios]);

    // Toggle notes for a single card
    const toggleCardNote = useCallback((id: string) => {
        setExpandedNotes((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }, []);

    /** Launch scenario: auth switch & window open */
    const launch = async (scenario: DemoScenario, sameTab: boolean) => {
        const account = accountByKey[scenario.as];
        const supabase = createClient();
        setLastLaunchedId(scenario.id);

        try {
            setStatus({
                kind: "busy",
                text: account.email ? `Authenticating as ${account.label}…` : "Switching to Public guest…",
            });

            if (current !== account.email) {
                await supabase.auth.signOut({ scope: "local" });
                if (account.email) {
                    const { error } = await supabase.auth.signInWithPassword({ email: account.email, password });
                    if (error) throw error;
                }
            }

            setCurrent(account.email);
            setStatus({
                kind: "ok",
                text: `Ready: ${account.email ? account.label : "Public"} → ${scenario.path}`,
            });

            showToast(
                `⚡ Launched "${scenario.title}" as ${account.label}${sameTab ? " in this tab" : " in demo window"}`,
                "success",
            );

            if (sameTab) {
                window.location.assign(scenario.path);
            } else {
                const win = window.open(scenario.path, DEMO_WINDOW_NAME);
                win?.focus();
            }
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Authentication failed";
            setStatus({ kind: "error", text: msg });
            showToast(`✗ Failed to launch: ${msg}`, "error");
        }
    };

    /** Direct quick switch to persona dashboard */
    const switchAccount = async (account: DemoAccount) => {
        const path = account.role === "landlord" ? "/landlord/dashboard" : account.role === "tenant" ? "/tenant/dashboard" : "/";
        await launch({
            id: `quick-account-${account.key}`,
            group: "Accounts",
            title: `Dashboard · ${account.label}`,
            as: account.key,
            path,
        }, false);
    };

    /** Sign out current account completely */
    const handleSignOut = async () => {
        try {
            const supabase = createClient();
            await supabase.auth.signOut({ scope: "local" });
            setCurrent(null);
            setStatus({ kind: "ok", text: "Signed out completely" });
            showToast("Signed out", "info");
        } catch {
            showToast("Sign out failed", "error");
        }
    };

    /** Run full database seed reset */
    const runReset = async () => {
        setResetModalOpen(false);
        setResetting(true);
        setShowResetLog(true);
        setResetLog("Executing scripts/seed-defense-demo.mjs … Resetting database to defense baseline.");

        try {
            const res = await fetch("/api/demo-console/reset", { method: "POST" });
            const body = await res.json();
            const logMessage = `${body.ok ? "✓ Demo baseline restored successfully" : "✗ Database reset failed"} (${body.seconds ?? "?"}s)\n\n${body.output ?? body.error ?? ""}`;
            setResetLog(logMessage);
            setCurrent(null);
            showToast(body.ok ? `✓ Reset complete in ${body.seconds}s` : "✗ Reset failed", body.ok ? "success" : "error");
        } catch (error) {
            const err = error instanceof Error ? error.message : "Reset failed";
            setResetLog(`✗ Error: ${err}`);
            showToast("✗ Reset failed", "error");
        } finally {
            setResetting(false);
        }
    };

    const currentAccount = useMemo(() => {
        if (!current) return null;
        return accounts.find((a) => a.email?.toLowerCase() === current.toLowerCase());
    }, [accounts, current]);

    return (
        <div className="demo-console-root">
            <style>{`
                .demo-console-root {
                    min-height: 100vh;
                    background: #f8fafc;
                    color: #0f172a;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                    padding-bottom: 80px;
                }
                .glass-header {
                    position: sticky;
                    top: 0;
                    z-index: 40;
                    background: rgba(255, 255, 255, 0.94);
                    backdrop-filter: blur(12px);
                    border-bottom: 1px solid #e2e8f0;
                    box-shadow: 0 2px 12px rgba(15, 23, 42, 0.04);
                }
                .dc-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 14px;
                    transition: all 0.18s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 1px 3px rgba(15, 23, 42, 0.03);
                }
                .dc-card:hover {
                    border-color: #059669;
                    transform: translateY(-2px);
                    box-shadow: 0 8px 24px rgba(15, 23, 42, 0.07);
                }
                .dc-card-top-pick {
                    border-color: #fed7aa;
                    background: #fffdfa;
                }
                .dc-card-top-pick:hover {
                    border-color: #f97316;
                    box-shadow: 0 8px 24px rgba(249, 115, 22, 0.09);
                }
                .persona-card {
                    background: #ffffff;
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 8px 12px;
                    cursor: pointer;
                    transition: all 0.15s ease;
                    text-align: left;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
                }
                .persona-card:hover {
                    background: #f8fafc;
                    border-color: #94a3b8;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
                }
                .persona-card.active {
                    background: #f0fdf4;
                    border-color: #16a34a;
                    box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.15);
                }
                .category-tab {
                    padding: 7px 14px;
                    border-radius: 999px;
                    font-size: 13px;
                    font-weight: 600;
                    border: 1px solid #e2e8f0;
                    background: #ffffff;
                    color: #475569;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 7px;
                    white-space: nowrap;
                    transition: all 0.12s ease;
                    box-shadow: 0 1px 2px rgba(15, 23, 42, 0.02);
                }
                .category-tab:hover {
                    color: #0f172a;
                    border-color: #cbd5e1;
                    background: #f8fafc;
                }
                .category-tab.active {
                    background: #0f766e;
                    color: #ffffff;
                    border-color: #0f766e;
                    font-weight: 700;
                    box-shadow: 0 2px 8px rgba(15, 118, 110, 0.25);
                }
                .primary-launch-btn {
                    background: #059669;
                    color: #ffffff;
                    font-weight: 700;
                    font-size: 13px;
                    border: none;
                    border-radius: 9px;
                    padding: 9px 14px;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 7px;
                    transition: all 0.15s ease;
                    flex: 1;
                    box-shadow: 0 1px 4px rgba(5, 150, 105, 0.2);
                }
                .primary-launch-btn:hover {
                    background: #047857;
                    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
                    transform: translateY(-1px);
                }
                .primary-launch-btn:active {
                    transform: translateY(0);
                }
                .secondary-btn {
                    background: #ffffff;
                    color: #334155;
                    border: 1px solid #cbd5e1;
                    border-radius: 9px;
                    padding: 8px 11px;
                    font-size: 12px;
                    font-weight: 600;
                    cursor: pointer;
                    display: inline-flex;
                    align-items: center;
                    gap: 5px;
                    transition: all 0.12s ease;
                }
                .secondary-btn:hover {
                    background: #f8fafc;
                    color: #0f172a;
                    border-color: #94a3b8;
                }
                .badge-role-landlord {
                    background: #ecfdf5;
                    color: #047857;
                    border: 1px solid #a7f3d0;
                }
                .badge-role-tenant {
                    background: #f5f3ff;
                    color: #6d28d9;
                    border: 1px solid #ddd6fe;
                }
                .badge-role-public {
                    background: #f8fafc;
                    color: #475569;
                    border: 1px solid #cbd5e1;
                }
                .custom-scroll::-webkit-scrollbar {
                    height: 6px;
                    width: 6px;
                }
                .custom-scroll::-webkit-scrollbar-track {
                    background: #f1f5f9;
                }
                .custom-scroll::-webkit-scrollbar-thumb {
                    background: #cbd5e1;
                    border-radius: 999px;
                }
                /* Suppress cookie consent overlay on private demo presenter console */
                aside[aria-label="Privacy Preferences"],
                div:has(> button:has-text("Accept all cookies")),
                div:has(> * > button:has-text("Accept all cookies")) {
                    display: none !important;
                }
            `}</style>

            {/* Toast feedback pill */}
            {toast && (
                <div
                    style={{
                        position: "fixed",
                        bottom: 24,
                        right: 24,
                        zIndex: 9999,
                        background: toast.type === "error" ? "#991b1b" : toast.type === "info" ? "#1e293b" : "#065f46",
                        color: "#fff",
                        padding: "12px 20px",
                        borderRadius: 12,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.18)",
                        fontSize: 14,
                        fontWeight: 600,
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        animation: "fadeIn 0.2s ease-out",
                    }}
                >
                    {toast.type === "error" ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
                    <span>{toast.message}</span>
                </div>
            )}

            {/* Reset confirmation modal */}
            {resetModalOpen && (
                <div
                    style={{
                        position: "fixed",
                        inset: 0,
                        zIndex: 1000,
                        background: "rgba(15, 23, 42, 0.55)",
                        backdropFilter: "blur(4px)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 20,
                    }}
                    onClick={() => setResetModalOpen(false)}
                >
                    <div
                        style={{
                            background: "#ffffff",
                            border: "1px solid #fecdd3",
                            borderRadius: 18,
                            maxWidth: 520,
                            width: "100%",
                            padding: 28,
                            boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                            <div
                                style={{
                                    width: 44,
                                    height: 44,
                                    borderRadius: 12,
                                    background: "#ffe4e6",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#e11d48",
                                }}
                            >
                                <RotateCcw size={22} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
                                    Reset Demo Baseline?
                                </h3>
                                <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                                    Restores all database records for the defense presentation
                                </p>
                            </div>
                        </div>

                        <p style={{ fontSize: 14, lineHeight: 1.5, color: "#334155", margin: "16px 0 24px" }}>
                            This executes <code>scripts/seed-defense-demo.mjs</code>. It resets John Peter Gonzales dormitory,
                            signs out all sessions, and restores all 9 tenant states (Katrina pending e-sign, Ronald overdue,
                            Mark electrical ticket, etc.).
                            <br />
                            <strong style={{ color: "#e11d48", display: "block", marginTop: 8 }}>
                                ⏱ Takes approximately 45–60 seconds to complete.
                            </strong>
                        </p>

                        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                            <button
                                type="button"
                                className="secondary-btn"
                                style={{ padding: "10px 18px", fontSize: 14 }}
                                onClick={() => setResetModalOpen(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                style={{
                                    background: "#e11d48",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 9,
                                    padding: "10px 20px",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                                onClick={runReset}
                            >
                                <RotateCcw size={16} /> Yes, Restore Baseline
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Sticky Header */}
            <header className="glass-header">
                {/* Top bar: Brand + Session Status + Quick Actions */}
                <div style={{ maxWidth: 1400, margin: "0 auto", padding: "14px 24px", display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center", justifyContent: "space-between" }}>
                    {/* Brand & Property */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                            style={{
                                width: 40,
                                height: 40,
                                borderRadius: 10,
                                background: "#059669",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff",
                                boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)",
                            }}
                        >
                            <Building2 size={22} />
                        </div>
                        <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.02em", color: "#0f172a" }}>
                                    iReside
                                </span>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 800,
                                        letterSpacing: "0.06em",
                                        textTransform: "uppercase",
                                        background: "#ecfdf5",
                                        color: "#047857",
                                        padding: "2px 8px",
                                        borderRadius: 6,
                                        border: "1px solid #a7f3d0",
                                    }}
                                >
                                    Defense Console
                                </span>
                            </div>
                            <div style={{ fontSize: 12, color: "#64748b" }}>
                                Fernando Gonzales Dormitory · 12 Rooms · Valenzuela City
                            </div>
                        </div>
                    </div>

                    {/* Current user session & Global Controls */}
                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
                        {/* Demo Password Pill with Copy button */}
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                borderRadius: 9,
                                padding: "6px 12px",
                                fontSize: 13,
                                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                            }}
                        >
                            <Lock size={14} style={{ color: "#d97706" }} />
                            <span style={{ color: "#64748b" }}>Password:</span>
                            <code style={{ color: "#0f172a", fontWeight: 700, letterSpacing: "0.02em" }}>{password}</code>
                            <button
                                type="button"
                                onClick={() => copyText(password, "demo password")}
                                title="Copy password"
                                style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#059669",
                                    cursor: "pointer",
                                    padding: 2,
                                    display: "flex",
                                    alignItems: "center",
                                }}
                            >
                                <Copy size={14} />
                            </button>
                        </div>

                        {/* Active user status badge */}
                        <div
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 8,
                                background: current ? "#f0fdf4" : "#f8fafc",
                                border: `1px solid ${current ? "#bbf7d0" : "#e2e8f0"}`,
                                borderRadius: 9,
                                padding: "6px 12px",
                                fontSize: 13,
                            }}
                        >
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: "50%",
                                    background: current ? "#16a34a" : "#94a3b8",
                                }}
                            />
                            <span style={{ color: "#64748b" }}>Active:</span>
                            <span style={{ fontWeight: 700, color: current ? "#0f172a" : "#64748b" }}>
                                {currentAccount ? currentAccount.label : current ?? "Guest / None"}
                            </span>
                            {currentAccount?.room && (
                                <span style={{ fontSize: 11, background: "#f5f3ff", color: "#6d28d9", border: "1px solid #ddd6fe", padding: "1px 6px", borderRadius: 4 }}>
                                    Rm {currentAccount.room}
                                </span>
                            )}
                            {current && (
                                <button
                                    type="button"
                                    onClick={handleSignOut}
                                    title="Sign out"
                                    style={{
                                        background: "transparent",
                                        border: "none",
                                        color: "#e11d48",
                                        cursor: "pointer",
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: "2px 4px",
                                        marginLeft: 4,
                                    }}
                                >
                                    Sign Out
                                </button>
                            )}
                        </div>

                        {/* Reset Demo Baseline button */}
                        {resetAvailable && (
                            <button
                                type="button"
                                onClick={() => setResetModalOpen(true)}
                                disabled={resetting}
                                style={{
                                    background: "#fff1f2",
                                    border: "1px solid #fecdd3",
                                    color: "#e11d48",
                                    borderRadius: 9,
                                    padding: "8px 14px",
                                    fontSize: 13,
                                    fontWeight: 700,
                                    cursor: resetting ? "wait" : "pointer",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 7,
                                    transition: "all 0.15s ease",
                                }}
                            >
                                <RotateCcw size={14} className={resetting ? "animate-spin" : ""} />
                                {resetting ? "Resetting (~1m)…" : "Reset Demo Data"}
                            </button>
                        )}
                    </div>
                </div>

                {/* Sub-bar: Search Bar + Keyword Quick Chips + Global Notes Switch */}
                <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 14px", display: "flex", flexWrap: "wrap", gap: 14, alignItems: "center", justifyContent: "space-between" }}>
                    {/* Search Input */}
                    <div style={{ position: "relative", flex: "1 1 360px", maxWidth: 540 }}>
                        <Search
                            size={18}
                            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}
                        />
                        <input
                            ref={searchInputRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search scenarios, panel questions, GCash, e-sign, triage (Press '/' to focus)..."
                            style={{
                                width: "100%",
                                background: "#ffffff",
                                border: "1px solid #cbd5e1",
                                borderRadius: 10,
                                padding: "10px 40px 10px 42px",
                                color: "#0f172a",
                                fontSize: 14,
                                outline: "none",
                                transition: "all 0.15s ease",
                                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                            }}
                        />
                        {query && (
                            <button
                                type="button"
                                onClick={() => setQuery("")}
                                style={{
                                    position: "absolute",
                                    right: 12,
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    background: "transparent",
                                    border: "none",
                                    color: "#94a3b8",
                                    cursor: "pointer",
                                }}
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Mode & Action Options */}
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {/* Toggle Presenter Script / Notes */}
                        <button
                            type="button"
                            onClick={() => setShowPresenterCues(!showPresenterCues)}
                            style={{
                                background: showPresenterCues ? "#ecfdf5" : "#ffffff",
                                border: `1px solid ${showPresenterCues ? "#10b981" : "#cbd5e1"}`,
                                color: showPresenterCues ? "#047857" : "#334155",
                                padding: "8px 14px",
                                borderRadius: 9,
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 7,
                                boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03)",
                            }}
                        >
                            <Volume2 size={16} />
                            <span>{showPresenterCues ? "Presenter Notes: ON" : "Presenter Notes: OFF"}</span>
                        </button>

                        {/* Shift-click helper pill */}
                        <div
                            style={{
                                fontSize: 12,
                                color: "#64748b",
                                background: "#ffffff",
                                border: "1px solid #e2e8f0",
                                padding: "7px 12px",
                                borderRadius: 8,
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                            }}
                        >
                            <ExternalLink size={13} style={{ color: "#059669" }} />
                            <span>Click opens Demo Window · Shift-click opens in this tab</span>
                        </div>
                    </div>
                </div>

                {/* Keyword quick filter pills */}
                <div
                    className="custom-scroll"
                    style={{
                        maxWidth: 1400,
                        margin: "0 auto",
                        padding: "0 24px 12px",
                        display: "flex",
                        gap: 8,
                        overflowX: "auto",
                        alignItems: "center",
                    }}
                >
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b", marginRight: 4 }}>
                        Quick Jump:
                    </span>
                    {KEYWORD_CHIPS.map((chip) => {
                        const isSelected = query.toLowerCase() === chip.query.toLowerCase();
                        return (
                            <button
                                key={chip.label}
                                type="button"
                                onClick={() => {
                                    if (isSelected) {
                                        setQuery("");
                                    } else {
                                        setQuery(chip.query);
                                        if (chip.query === "top-pick") setSelectedCategory("top-picks");
                                    }
                                }}
                                style={{
                                    padding: "5px 12px",
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: isSelected ? 700 : 500,
                                    background: isSelected ? "#ecfdf5" : "#ffffff",
                                    border: `1px solid ${isSelected ? "#10b981" : "#e2e8f0"}`,
                                    color: isSelected ? "#047857" : "#475569",
                                    cursor: "pointer",
                                    whiteSpace: "nowrap",
                                    transition: "all 0.12s ease",
                                }}
                            >
                                {chip.label}
                            </button>
                        );
                    })}
                </div>
            </header>

            <main style={{ maxWidth: 1400, margin: "0 auto", padding: "20px 24px" }}>
                {/* Reset Progress or Log Output Drawer */}
                {resetLog && showResetLog && (
                    <div
                        style={{
                            marginBottom: 24,
                            background: "#ffffff",
                            border: "1px solid #cbd5e1",
                            borderRadius: 12,
                            overflow: "hidden",
                            boxShadow: "0 2px 8px rgba(15, 23, 42, 0.05)",
                        }}
                    >
                        <div
                            style={{
                                padding: "10px 16px",
                                background: "#f8fafc",
                                borderBottom: "1px solid #e2e8f0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 700, color: "#059669" }}>
                                <Terminal size={15} />
                                <span>Reset Script Console Output</span>
                            </div>
                            <div style={{ display: "flex", gap: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => copyText(resetLog, "reset log")}
                                    style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}
                                >
                                    <Copy size={13} /> Copy
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowResetLog(false)}
                                    style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", fontSize: 12 }}
                                >
                                    Hide
                                </button>
                            </div>
                        </div>
                        <pre style={{ margin: 0, padding: 14, fontSize: 12, lineHeight: 1.5, color: "#334155", maxHeight: 220, overflowY: "auto", fontFamily: "ui-monospace, monospace" }}>
                            {resetLog}
                        </pre>
                    </div>
                )}

                {/* 1. PERSONA DOCK: Quick Account Switcher */}
                <section style={{ marginBottom: 28 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <Crown size={16} style={{ color: "#059669" }} />
                            <h2 style={{ margin: 0, fontSize: 13, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", color: "#64748b" }}>
                                Demo Personas · 1-Click Sign-In
                            </h2>
                        </div>
                        <span style={{ fontSize: 12, color: "#64748b" }}>
                            Click any persona to log in and open their dashboard
                        </span>
                    </div>

                    <div
                        className="custom-scroll"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                            gap: 10,
                        }}
                    >
                        {accounts.map((a) => {
                            const isCurrent = current?.toLowerCase() === a.email?.toLowerCase();
                            const isLandlord = a.role === "landlord";
                            const isPublic = a.role === "public";

                            return (
                                <button
                                    key={a.key}
                                    type="button"
                                    className={`persona-card ${isCurrent ? "active" : ""}`}
                                    onClick={() => switchAccount(a)}
                                    title={`${a.email ?? "Public"} — ${a.state}`}
                                >
                                    <div
                                        style={{
                                            width: 38,
                                            height: 38,
                                            borderRadius: 10,
                                            background: isLandlord
                                                ? "#059669"
                                                : isPublic
                                                    ? "#64748b"
                                                    : "#6366f1",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: "#fff",
                                            fontWeight: 800,
                                            fontSize: 12,
                                            flexShrink: 0,
                                        }}
                                    >
                                        {isLandlord ? <Crown size={18} /> : isPublic ? <User size={18} /> : a.room ? a.room.split(" ")[0] : a.label.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                                            <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                                {isPublic ? "Public (Signed Out)" : a.label}
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 10,
                                                    fontWeight: 800,
                                                    padding: "1px 6px",
                                                    borderRadius: 4,
                                                    textTransform: "uppercase",
                                                    background: isLandlord ? "#ecfdf5" : isPublic ? "#f1f5f9" : "#f5f3ff",
                                                    color: isLandlord ? "#047857" : isPublic ? "#475569" : "#6d28d9",
                                                    border: `1px solid ${isLandlord ? "#a7f3d0" : isPublic ? "#e2e8f0" : "#ddd6fe"}`,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                {isLandlord ? "Landlord" : a.room ? (a.room.includes("former") ? "Rm 303 (Old)" : `Rm ${a.room}`) : "Public"}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: 11, color: isCurrent ? "#059669" : "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2, fontWeight: isCurrent ? 700 : 400 }}>
                                            {isCurrent ? "● Currently signed in" : a.state}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* 2. CATEGORY TABS & ROLE FILTER */}
                <section style={{ marginBottom: 24 }}>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                        {/* Categories Horizontal Bar */}
                        <div
                            className="custom-scroll"
                            style={{
                                display: "flex",
                                gap: 8,
                                overflowX: "auto",
                                paddingBottom: 4,
                                flex: "1 1 auto",
                            }}
                        >
                            {CATEGORIES.map((cat) => {
                                const Icon = cat.icon;
                                const isActive = selectedCategory === cat.id;
                                const count = cat.id === "all"
                                    ? scenarios.length
                                    : cat.id === "top-picks"
                                        ? scenarios.filter((s) => SCENARIO_META[s.id]?.isTopPick).length
                                        : scenarios.filter((s) => s.group === cat.id).length;

                                return (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        className={`category-tab ${isActive ? "active" : ""}`}
                                        onClick={() => setSelectedCategory(cat.id)}
                                    >
                                        <Icon size={14} />
                                        <span>{cat.label}</span>
                                        <span
                                            style={{
                                                fontSize: 11,
                                                padding: "1px 6px",
                                                borderRadius: 999,
                                                background: isActive ? "rgba(255, 255, 255, 0.25)" : "#f1f5f9",
                                                color: isActive ? "#ffffff" : "#475569",
                                            }}
                                        >
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Role Pills */}
                        <div
                            style={{
                                display: "inline-flex",
                                background: "#f1f5f9",
                                border: "1px solid #e2e8f0",
                                borderRadius: 999,
                                padding: 3,
                                flexShrink: 0,
                            }}
                        >
                            {[
                                { id: "all", label: "All Roles" },
                                { id: "landlord", label: "Landlord" },
                                { id: "tenant", label: "Tenants" },
                                { id: "public", label: "Public" },
                            ].map((role) => (
                                <button
                                    key={role.id}
                                    type="button"
                                    onClick={() => setSelectedRole(role.id as any)}
                                    style={{
                                        background: selectedRole === role.id ? "#ffffff" : "transparent",
                                        color: selectedRole === role.id ? "#0f172a" : "#64748b",
                                        fontWeight: selectedRole === role.id ? 700 : 500,
                                        fontSize: 12,
                                        border: "none",
                                        borderRadius: 999,
                                        padding: "4px 12px",
                                        cursor: "pointer",
                                        transition: "all 0.1s ease",
                                        boxShadow: selectedRole === role.id ? "0 1px 2px rgba(15, 23, 42, 0.08)" : "none",
                                    }}
                                >
                                    {role.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Filter result status count */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "#64748b", padding: "0 4px" }}>
                        <span>
                            Showing <strong style={{ color: "#0f172a" }}>{filteredScenarios.length}</strong> of {scenarios.length} scenarios
                            {query && <span> matching “<span style={{ color: "#059669" }}>{query}</span>”</span>}
                        </span>
                        {status.kind !== "idle" && (
                            <span style={{ color: status.kind === "error" ? "#e11d48" : status.kind === "busy" ? "#d97706" : "#059669", fontWeight: 600 }}>
                                {status.text}
                            </span>
                        )}
                    </div>
                </section>

                {/* 3. SCENARIOS GRID */}
                {groupedScenarios.length === 0 ? (
                    <div
                        style={{
                            textAlign: "center",
                            padding: "60px 20px",
                            background: "#ffffff",
                            border: "1px dashed #cbd5e1",
                            borderRadius: 16,
                            color: "#64748b",
                        }}
                    >
                        <Search size={36} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                        <h3 style={{ color: "#0f172a", margin: "0 0 6px", fontSize: 18 }}>No matching scenarios found</h3>
                        <p style={{ margin: 0, fontSize: 14 }}>
                            No scenario matches your filters or search query “{query}”.
                        </p>
                        <button
                            type="button"
                            className="secondary-btn"
                            style={{ marginTop: 16 }}
                            onClick={() => {
                                setQuery("");
                                setSelectedCategory("all");
                                setSelectedRole("all");
                            }}
                        >
                            Reset All Filters
                        </button>
                    </div>
                ) : (
                    groupedScenarios.map(([group, items]) => (
                        <section key={group} style={{ marginBottom: 36 }}>
                            {/* Group Section Header */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "0 0 14px" }}>
                                <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: "#0f172a", letterSpacing: "-0.01em" }}>
                                    {group}
                                </h2>
                                <span
                                    style={{
                                        fontSize: 11,
                                        fontWeight: 700,
                                        background: "#e2e8f0",
                                        color: "#475569",
                                        padding: "2px 8px",
                                        borderRadius: 999,
                                    }}
                                >
                                    {items.length}
                                </span>
                            </div>

                            {/* Cards Grid */}
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
                                    gap: 14,
                                }}
                            >
                                {items.map((s) => {
                                    const meta = SCENARIO_META[s.id] ?? {
                                        icon: FileText,
                                        badge: "Scenario",
                                        color: "emerald" as const,
                                    };
                                    const Icon = meta.icon;
                                    const account = accountByKey[s.as];
                                    const colors = COLOR_MAP[meta.color] ?? COLOR_MAP.emerald;
                                    const isTopPick = meta.isTopPick;
                                    const isNotesOpen = showPresenterCues || expandedNotes.has(s.id);
                                    const isJustLaunched = lastLaunchedId === s.id;

                                    return (
                                        <div
                                            key={s.id}
                                            className={`dc-card ${isTopPick ? "dc-card-top-pick" : ""}`}
                                            style={{
                                                borderColor: isJustLaunched ? "#059669" : undefined,
                                                boxShadow: isJustLaunched ? "0 0 0 2px rgba(5, 150, 105, 0.25)" : undefined,
                                            }}
                                        >
                                            {/* Card Top: Visual Icon + Role Badge + Star Pill */}
                                            <div style={{ padding: "16px 18px 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                                    {/* Accent Icon Badge */}
                                                    <div
                                                        style={{
                                                            width: 40,
                                                            height: 40,
                                                            borderRadius: 10,
                                                            background: colors.bg,
                                                            border: `1px solid ${colors.border}`,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                            color: colors.text,
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <Icon size={20} />
                                                    </div>

                                                    {/* Action Tag & Route */}
                                                    <div>
                                                        <span
                                                            style={{
                                                                fontSize: 11,
                                                                fontWeight: 700,
                                                                textTransform: "uppercase",
                                                                letterSpacing: "0.06em",
                                                                color: colors.text,
                                                            }}
                                                        >
                                                            {meta.badge}
                                                        </span>
                                                        <div style={{ fontSize: 11, color: "#64748b", fontFamily: "ui-monospace, monospace" }}>
                                                            {s.path}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Role & Room Pill */}
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                                                    {isTopPick && (
                                                        <span
                                                            title="Must-show scenario during defense presentation"
                                                            style={{
                                                                fontSize: 10,
                                                                fontWeight: 800,
                                                                background: "#fffbeb",
                                                                color: "#b45309",
                                                                border: "1px solid #fde68a",
                                                                borderRadius: 6,
                                                                padding: "2px 6px",
                                                                display: "inline-flex",
                                                                alignItems: "center",
                                                                gap: 3,
                                                            }}
                                                        >
                                                            <Star size={10} fill="#b45309" /> TOP
                                                        </span>
                                                    )}
                                                    <span
                                                        className={
                                                            account.role === "landlord"
                                                                ? "badge-role-landlord"
                                                                : account.role === "public"
                                                                    ? "badge-role-public"
                                                                    : "badge-role-tenant"
                                                        }
                                                        style={{
                                                            fontSize: 11,
                                                            fontWeight: 800,
                                                            borderRadius: 999,
                                                            padding: "3px 9px",
                                                            textTransform: "uppercase",
                                                            letterSpacing: "0.04em",
                                                            display: "inline-flex",
                                                            alignItems: "center",
                                                            gap: 4,
                                                        }}
                                                    >
                                                        {account.role === "landlord" ? (
                                                            <Crown size={11} />
                                                        ) : account.role === "public" ? (
                                                            <User size={11} />
                                                        ) : (
                                                            <Home size={11} />
                                                        )}
                                                        {account.role === "public"
                                                            ? "Public"
                                                            : account.room
                                                                ? `Rm ${account.room}`
                                                                : "Owner"}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Card Middle: Title & Persona Actor */}
                                            <div style={{ padding: "0 18px 14px", flex: 1 }}>
                                                <h3 style={{ margin: "0 0 8px", fontSize: 15, fontWeight: 800, color: "#0f172a", lineHeight: 1.35 }}>
                                                    {s.title}
                                                </h3>

                                                {/* Persona identity indicator */}
                                                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#475569" }}>
                                                    <User size={13} style={{ color: "#059669" }} />
                                                    <span>Signs in as:</span>
                                                    <strong style={{ color: "#0f172a" }}>
                                                        {account.email ? account.label : "Public (Signed Out)"}
                                                    </strong>
                                                </div>
                                            </div>

                                            {/* Expandable Presenter Notes (Cheat Sheet & Steps) */}
                                            {isNotesOpen && (s.steps || s.say) && (
                                                <div
                                                    style={{
                                                        margin: "0 14px 14px",
                                                        padding: 12,
                                                        background: "#f8fafc",
                                                        border: "1px solid #e2e8f0",
                                                        borderRadius: 10,
                                                        fontSize: 12,
                                                    }}
                                                >
                                                    {/* Steps to click on screen */}
                                                    {s.steps && (
                                                        <div style={{ marginBottom: s.say ? 10 : 0 }}>
                                                            <div style={{ fontWeight: 700, color: "#334155", marginBottom: 4, display: "flex", alignItems: "center", gap: 5 }}>
                                                                <ArrowRight size={13} style={{ color: "#059669" }} />
                                                                <span>Click path on screen:</span>
                                                            </div>
                                                            <div style={{ color: "#475569", lineHeight: 1.45, paddingLeft: 18 }}>
                                                                {s.steps}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* What to say to defense panel */}
                                                    {s.say && (
                                                        <div
                                                            style={{
                                                                background: "#f0fdf4",
                                                                borderLeft: "3px solid #16a34a",
                                                                padding: "8px 10px",
                                                                borderRadius: "0 8px 8px 0",
                                                                color: "#166534",
                                                                lineHeight: 1.4,
                                                            }}
                                                        >
                                                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                                                                <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.08em", color: "#15803d" }}>
                                                                    Say to Panel:
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyText(s.say!, "panel script")}
                                                                    style={{
                                                                        background: "transparent",
                                                                        border: "none",
                                                                        color: "#15803d",
                                                                        cursor: "pointer",
                                                                        fontSize: 11,
                                                                        display: "flex",
                                                                        alignItems: "center",
                                                                        gap: 3,
                                                                        fontWeight: 700,
                                                                    }}
                                                                >
                                                                    <Copy size={11} /> Copy
                                                                </button>
                                                            </div>
                                                            “{s.say}”
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Card Bottom: Explicit Action Buttons */}
                                            <div
                                                style={{
                                                    padding: "12px 18px",
                                                    background: "#f8fafc",
                                                    borderTop: "1px solid #f1f5f9",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    gap: 8,
                                                }}
                                            >
                                                {/* Primary Launch Demo button */}
                                                <button
                                                    type="button"
                                                    className="primary-launch-btn"
                                                    onClick={(e) => launch(s, e.shiftKey)}
                                                    title={`Sign in as ${account.label} and launch ${s.path} in demo window`}
                                                >
                                                    <span>Launch Demo</span>
                                                    <ExternalLink size={14} />
                                                </button>

                                                {/* Open in this tab */}
                                                <button
                                                    type="button"
                                                    className="secondary-btn"
                                                    onClick={() => launch(s, true)}
                                                    title="Launch in this tab instead of a separate window"
                                                >
                                                    <span>This Tab</span>
                                                </button>

                                                {/* Toggle individual cue notes */}
                                                {(s.steps || s.say) && !showPresenterCues && (
                                                    <button
                                                        type="button"
                                                        className="secondary-btn"
                                                        onClick={() => toggleCardNote(s.id)}
                                                        title="Show presenter script and click steps"
                                                        style={{
                                                            color: isNotesOpen ? "#059669" : undefined,
                                                            borderColor: isNotesOpen ? "#10b981" : undefined,
                                                        }}
                                                    >
                                                        {isNotesOpen ? <ChevronUp size={15} /> : <Info size={15} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))
                )}
            </main>
        </div>
    );
}
