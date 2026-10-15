"use client";

/**
 * Shared building blocks for the tenant and landlord Settings pages.
 *
 * Design rules (our users are often older and not confident with apps):
 * - One level of navigation: a Settings home page, then one page per topic. No sub-tabs,
 *   no sideways scrolling, nothing hidden behind hover.
 * - Every control has a visible text label. Icons only ever support the words.
 * - Large type (16px+ body, 18px labels) and large targets (48px+), visible input borders.
 * - The browser Back button always works: the open page lives in the URL (?section=...).
 * - Plain-language feedback: say what happened and what to do next.
 *
 * Callers pass already-translated text; strings owned by this file are translated here.
 */

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import {
    AlertCircle,
    AlertTriangle,
    ArrowLeft,
    Check,
    CheckCircle2,
    ChevronRight,
    Eye,
    EyeOff,
    Info,
    Loader2,
    type LucideIcon,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SettingsGroupDef {
    id: string;
    title: string;
}

export interface SettingsSectionDef<Id extends string = string> {
    id: Id;
    group: string;
    title: string;
    description: string;
    icon: LucideIcon;
    tone?: "default" | "danger";
}

export interface SettingsQuickTask<Id extends string = string> {
    label: string;
    section: Id;
    icon: LucideIcon;
    /** Element id to scroll to once the page opens. */
    anchor?: string;
}

// ---------------------------------------------------------------------------
// Navigation (URL-backed so the browser Back button works)
// ---------------------------------------------------------------------------

interface UseSettingsNavigationOptions<Id extends string> {
    sectionIds: readonly Id[];
    /** Maps the old `?category=&subtab=` links to a page id. */
    resolveLegacy?: (category: string, subtab: string | null) => Id | null;
    /** Return true to stop navigation (e.g. unsaved changes); `onBlocked` gets the target. */
    shouldBlock?: () => boolean;
    onBlocked?: (target: Id | null) => void;
    /**
     * True while there are unsaved changes. Arms a guard so the browser Back button cannot
     * leave Settings (to another page of the app) without asking first.
     */
    isDirty?: boolean;
    /** Back was pressed with unsaved changes. Ask first; call `leave()` to carry on. */
    onLeaveBlocked?: () => void;
}

// Marks the extra history entry that guards unsaved changes (see useSettingsNavigation).
const LEAVE_GUARD_KEY = "__iresideSettingsGuard";

function currentHistoryState(): Record<string, unknown> | null {
    const state = window.history.state;
    return state && typeof state === "object" ? (state as Record<string, unknown>) : null;
}

function isLeaveGuardEntry() {
    return Boolean(currentHistoryState()?.[LEAVE_GUARD_KEY]);
}

/** The current history state without the guard marker, for entries we add ourselves. */
function historyStateWithoutGuard() {
    const state = currentHistoryState();
    if (!state || !(LEAVE_GUARD_KEY in state)) return window.history.state;
    const rest = { ...state };
    delete rest[LEAVE_GUARD_KEY];
    return rest;
}

function readSectionFromUrl<Id extends string>(
    sectionIds: readonly Id[],
    resolveLegacy?: (category: string, subtab: string | null) => Id | null,
): Id | null {
    const params = new URLSearchParams(window.location.search);
    const section = params.get("section");
    if (section && (sectionIds as readonly string[]).includes(section)) return section as Id;
    const category = params.get("category");
    if (category && resolveLegacy) return resolveLegacy(category, params.get("subtab"));
    return null;
}

function buildUrl(section: string | null) {
    const params = new URLSearchParams(window.location.search);
    params.delete("category");
    params.delete("subtab");
    if (section) params.set("section", section);
    else params.delete("section");
    const query = params.toString();
    return `${window.location.pathname}${query ? `?${query}` : ""}`;
}

/**
 * Scrolls an element into view and focuses it (headings and cards get a temporary tabindex).
 * Uses scrollIntoView so it works whichever element is the scroll container.
 */
export function focusAnchor(id: string, block: ScrollLogicalPosition = "center") {
    window.requestAnimationFrame(() => {
        const target = document.getElementById(id);
        if (!target) return;
        target.scrollIntoView({ block });
        const focusable = /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(target.tagName);
        if (!focusable && !target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
    });
}

/**
 * Which settings page is open, kept in the URL (?section=) so the browser Back button works.
 *
 * Unsaved changes: moving between settings pages is checked with `shouldBlock`. Leaving
 * Settings with the browser Back button is a client-side route change in Next.js, so it
 * can't be cancelled (and `beforeunload` doesn't fire). Instead, while `isDirty` is true an
 * extra history entry with the same URL sits on top of the page. Back then only removes that
 * entry; we notice, put it back, and call `onLeaveBlocked`. `leave()` goes back for real.
 */
export function useSettingsNavigation<Id extends string>({
    sectionIds,
    resolveLegacy,
    shouldBlock,
    onBlocked,
    isDirty = false,
    onLeaveBlocked,
}: UseSettingsNavigationOptions<Id>) {
    const [section, setSection] = useState<Id | null>(null);
    const [ready, setReady] = useState(false);
    const sectionRef = useRef<Id | null>(null);
    const pendingAnchorRef = useRef<string | null>(null);
    const guardRef = useRef({ shouldBlock, onBlocked, onLeaveBlocked });
    useEffect(() => {
        guardRef.current = { shouldBlock, onBlocked, onLeaveBlocked };
    });
    const pathnameRef = useRef<string | null>(null);
    // URL of the page the leave guard protects; Back landing on it (without the marker) means
    // the guard entry was just removed by the browser.
    const leaveGuardHrefRef = useRef<string | null>(null);
    // Set by leave(): the Back it triggers was already confirmed, so don't ask again.
    const skipNextBlockRef = useRef(false);

    const pushLeaveGuard = useCallback(() => {
        window.history.pushState({ ...currentHistoryState(), [LEAVE_GUARD_KEY]: true }, "", window.location.href);
        leaveGuardHrefRef.current = window.location.href;
    }, []);

    useEffect(() => {
        pathnameRef.current = window.location.pathname;
        // Coming back to a guard entry left over from an earlier visit: the next Back should
        // skip the duplicate entry under it instead of seeming to do nothing.
        if (isLeaveGuardEntry()) leaveGuardHrefRef.current = window.location.href;
        const initial = readSectionFromUrl(sectionIds, resolveLegacy);
        sectionRef.current = initial;
        // The URL is only readable in the browser, so the first page is picked after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSection(initial);
        setReady(true);
        // Rewrite old ?category= links to the new form without adding a history entry.
        const params = new URLSearchParams(window.location.search);
        if (params.has("category")) window.history.replaceState(window.history.state, "", buildUrl(initial));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!ready || !isDirty || isLeaveGuardEntry()) return;
        pushLeaveGuard();
    }, [ready, isDirty, pushLeaveGuard]);

    useEffect(() => {
        const handlePopState = () => {
            const confirmed = skipNextBlockRef.current;
            skipNextBlockRef.current = false;
            // Another page of the app: Next.js is already showing it; nothing to do here.
            if (window.location.pathname !== pathnameRef.current) return;

            if (leaveGuardHrefRef.current === window.location.href && !isLeaveGuardEntry()) {
                // Back just removed the guard entry.
                if (!confirmed && guardRef.current.shouldBlock?.()) {
                    pushLeaveGuard();
                    guardRef.current.onLeaveBlocked?.();
                    return;
                }
                // Nothing unsaved any more (saved or undone): finish the Back press.
                leaveGuardHrefRef.current = null;
                window.history.back();
                return;
            }

            const target = readSectionFromUrl(sectionIds, resolveLegacy);
            if (target === sectionRef.current) return;
            if (!confirmed && guardRef.current.shouldBlock?.()) {
                // Undo the browser's move and ask first.
                window.history.pushState(historyStateWithoutGuard(), "", buildUrl(sectionRef.current));
                guardRef.current.onBlocked?.(target);
                return;
            }
            sectionRef.current = target;
            setSection(target);
        };
        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [sectionIds, resolveLegacy, pushLeaveGuard]);

    /** After `onLeaveBlocked`: go back past the guard entry to where Back was heading. */
    const leave = useCallback(() => {
        leaveGuardHrefRef.current = null;
        skipNextBlockRef.current = true;
        window.history.go(isLeaveGuardEntry() ? -2 : -1);
    }, []);

    const open = useCallback((target: Id | null, options?: { force?: boolean; anchor?: string }) => {
        if (!options?.force && target !== sectionRef.current && guardRef.current.shouldBlock?.()) {
            guardRef.current.onBlocked?.(target);
            return;
        }
        if (target === sectionRef.current) {
            // Same page: no re-render will happen, so jump to the anchor directly.
            if (options?.anchor) focusAnchor(options.anchor);
            return;
        }
        pendingAnchorRef.current = options?.anchor ?? null;
        window.history.pushState(historyStateWithoutGuard(), "", buildUrl(target));
        sectionRef.current = target;
        setSection(target);
    }, []);

    // After a page opens, move focus to its heading (or the requested anchor) so keyboard
    // and screen-reader users land at the start of the new content. The first page shown on
    // load is left alone: the browser already starts at the top.
    const hasOpenedRef = useRef(false);
    useEffect(() => {
        if (!ready) return;
        if (!hasOpenedRef.current) {
            hasOpenedRef.current = true;
            return;
        }
        const anchor = pendingAnchorRef.current;
        pendingAnchorRef.current = null;
        const frame = window.requestAnimationFrame(() => {
            if (anchor) return focusAnchor(anchor);
            document.getElementById("settings-page-top")?.scrollIntoView({ block: "start" });
            document.getElementById("settings-page-heading")?.focus({ preventScroll: true });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [section, ready]);

    return { section, ready, open, leave };
}

// ---------------------------------------------------------------------------
// Buttons
// ---------------------------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
    primary: "bg-primary text-primary-foreground border-2 border-transparent hover:brightness-95 shadow-sm",
    secondary: "bg-card text-foreground border-2 border-foreground/25 hover:border-foreground/50 hover:bg-muted",
    danger: "bg-rose-700 text-white border-2 border-transparent hover:bg-rose-800 shadow-sm",
    ghost: "bg-transparent text-foreground border-2 border-transparent hover:bg-muted underline-offset-4",
};

export function settingsButtonClass(variant: ButtonVariant = "primary", size: "md" | "lg" = "md", className?: string) {
    return cn(
        "inline-flex items-center justify-center gap-2.5 rounded-2xl font-bold transition-colors cursor-pointer select-none",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        size === "lg" ? "min-h-14 px-7 text-lg" : "min-h-12 px-5 text-base",
        BUTTON_VARIANTS[variant],
        className,
    );
}

interface SettingsButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: "md" | "lg";
    icon?: LucideIcon;
    loading?: boolean;
}

export function SettingsButton({
    variant = "primary",
    size = "md",
    icon: Icon,
    loading = false,
    className,
    children,
    disabled,
    type = "button",
    ...rest
}: SettingsButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={settingsButtonClass(variant, size, className)}
            {...rest}
        >
            {loading ? (
                <Loader2 className="size-5 shrink-0 motion-safe:animate-spin" aria-hidden />
            ) : (
                Icon && <Icon className="size-5 shrink-0" aria-hidden />
            )}
            <span>{children}</span>
        </button>
    );
}

// ---------------------------------------------------------------------------
// Page chrome
// ---------------------------------------------------------------------------

function SettingsIconTile({ icon: Icon, tone = "default", size = "md" }: { icon: LucideIcon; tone?: "default" | "danger"; size?: "md" | "lg" }) {
    return (
        <span
            aria-hidden
            className={cn(
                "flex shrink-0 items-center justify-center rounded-2xl",
                size === "lg" ? "size-16" : "size-12",
                tone === "danger"
                    ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                    : "bg-primary/25 text-foreground dark:bg-primary/20",
            )}
        >
            <Icon className={size === "lg" ? "size-8" : "size-6"} />
        </span>
    );
}

interface SettingsHubProps<Id extends string> {
    title: string;
    intro: string;
    groups: SettingsGroupDef[];
    sections: SettingsSectionDef<Id>[];
    quickTasks?: SettingsQuickTask<Id>[];
    onOpen: (id: Id, options?: { anchor?: string }) => void;
    /** Shown above the title (e.g. a "Back to Dashboard" button). */
    topSlot?: ReactNode;
    /** Shown under the groups (e.g. a help box). */
    footer?: ReactNode;
}

/** The Settings home page: every topic, grouped, as one big tappable card each. */
export function SettingsHub<Id extends string>({ title, intro, groups, sections, quickTasks, onOpen, topSlot, footer }: SettingsHubProps<Id>) {
    const { t } = useLanguageContext();
    return (
        <div id="settings-page-top" className="scroll-mt-24 space-y-10">
            {topSlot}
            <header className="space-y-3">
                <h1 id="settings-page-heading" tabIndex={-1} className="text-3xl sm:text-4xl font-black tracking-tight text-foreground focus:outline-none">
                    {title}
                </h1>
                <p className="max-w-2xl text-lg text-muted-foreground leading-relaxed">{intro}</p>
            </header>

            {quickTasks && quickTasks.length > 0 && (
                <section aria-labelledby="settings-quick-tasks" className="space-y-4">
                    <h2 id="settings-quick-tasks" className="text-xl font-bold text-foreground">
                        {t("Things people often change")}
                    </h2>
                    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {quickTasks.map((task) => {
                            const Icon = task.icon;
                            return (
                                <li key={task.label}>
                                    <button
                                        type="button"
                                        onClick={() => onOpen(task.section, { anchor: task.anchor })}
                                        className={cn(
                                            "flex w-full min-h-16 items-center gap-3 rounded-2xl border-2 border-foreground/15 bg-card px-4 py-3 text-left",
                                            "text-base font-bold text-foreground transition-colors hover:border-foreground/40 hover:bg-muted cursor-pointer",
                                            "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50",
                                        )}
                                    >
                                        <Icon className="size-6 shrink-0" aria-hidden />
                                        <span className="flex-1">{task.label}</span>
                                        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}

            {groups.map((group) => {
                const items = sections.filter((s) => s.group === group.id);
                if (items.length === 0) return null;
                const headingId = `settings-group-${group.id}`;
                return (
                    <section key={group.id} aria-labelledby={headingId} className="space-y-4">
                        <h2 id={headingId} className="text-xl font-bold text-foreground">
                            {group.title}
                        </h2>
                        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            {items.map((item) => (
                                <li key={item.id}>
                                    <button
                                        type="button"
                                        onClick={() => onOpen(item.id)}
                                        className={cn(
                                            "group flex h-full w-full items-center gap-4 rounded-3xl border-2 bg-card p-5 text-left transition-colors cursor-pointer",
                                            "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50",
                                            item.tone === "danger"
                                                ? "border-rose-200 hover:border-rose-400 dark:border-rose-500/30"
                                                : "border-foreground/10 hover:border-foreground/35 hover:bg-muted/60",
                                        )}
                                    >
                                        <SettingsIconTile icon={item.icon} tone={item.tone} />
                                        <span className="flex-1 min-w-0">
                                            <span className="block text-lg font-bold text-foreground">{item.title}</span>
                                            <span className="mt-1 block text-base leading-snug text-muted-foreground">{item.description}</span>
                                        </span>
                                        <span className="flex shrink-0 items-center gap-1 text-base font-semibold text-foreground">
                                            <span className="hidden sm:inline">{t("Open")}</span>
                                            <ChevronRight className="size-6 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden />
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                );
            })}

            {footer}
        </div>
    );
}

interface SettingsSectionLayoutProps<Id extends string> {
    groups: SettingsGroupDef[];
    sections: SettingsSectionDef<Id>[];
    activeId: Id;
    onOpen: (id: Id) => void;
    onHome: () => void;
    /** Extra content under the page title (e.g. a property picker). */
    headerExtra?: ReactNode;
    children: ReactNode;
}

/** One settings topic. On large screens a list of all topics stays on the left. */
export function SettingsSectionLayout<Id extends string>({
    groups,
    sections,
    activeId,
    onOpen,
    onHome,
    headerExtra,
    children,
}: SettingsSectionLayoutProps<Id>) {
    const { t } = useLanguageContext();
    const active = sections.find((s) => s.id === activeId) ?? sections[0];

    return (
        <div id="settings-page-top" className="scroll-mt-24 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-10 xl:gap-14">
            {/* Always-visible topic list (large screens only) */}
            <nav aria-label={t("All settings")} className="hidden lg:block">
                <div className="sticky top-6 space-y-6">
                    <button
                        type="button"
                        onClick={onHome}
                        className={settingsButtonClass("secondary", "md", "w-full justify-start")}
                    >
                        <ArrowLeft className="size-5 shrink-0" aria-hidden />
                        <span>{t("All settings")}</span>
                    </button>
                    {groups.map((group) => {
                        const items = sections.filter((s) => s.group === group.id);
                        if (items.length === 0) return null;
                        return (
                            <div key={group.id} className="space-y-1.5">
                                <p className="px-3 text-sm font-bold text-muted-foreground">{group.title}</p>
                                <ul className="space-y-1">
                                    {items.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = item.id === activeId;
                                        return (
                                            <li key={item.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => onOpen(item.id)}
                                                    aria-current={isActive ? "page" : undefined}
                                                    className={cn(
                                                        "flex w-full min-h-12 items-center gap-3 rounded-2xl border-2 px-3 py-2 text-left text-base transition-colors cursor-pointer",
                                                        "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50",
                                                        isActive
                                                            ? "border-foreground/70 bg-primary/25 font-bold text-foreground"
                                                            : "border-transparent font-semibold text-foreground/80 hover:bg-muted hover:text-foreground",
                                                    )}
                                                >
                                                    <Icon className="size-5 shrink-0" aria-hidden />
                                                    <span className="flex-1">{item.title}</span>
                                                    {isActive && <Check className="size-5 shrink-0" aria-hidden />}
                                                </button>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </nav>

            <div className="min-w-0 max-w-3xl space-y-8">
                {/* Where am I + way back (all screen sizes) */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
                    <button type="button" onClick={onHome} className={settingsButtonClass("secondary", "md", "lg:hidden")}>
                        <ArrowLeft className="size-5 shrink-0" aria-hidden />
                        <span>{t("All settings")}</span>
                    </button>
                    <nav aria-label={t("You are here")} className="text-base text-muted-foreground">
                        <ol className="flex flex-wrap items-center gap-1.5">
                            <li>
                                <button
                                    type="button"
                                    onClick={onHome}
                                    className="rounded-md font-semibold underline underline-offset-4 hover:text-foreground focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 cursor-pointer"
                                >
                                    {t("Settings")}
                                </button>
                            </li>
                            <li aria-hidden>
                                <ChevronRight className="size-4" />
                            </li>
                            <li aria-current="page" className="font-bold text-foreground">
                                {active.title}
                            </li>
                        </ol>
                    </nav>
                </div>

                <header className="flex items-start gap-4">
                    <SettingsIconTile icon={active.icon} tone={active.tone} size="lg" />
                    <div className="min-w-0 space-y-2">
                        <h1 id="settings-page-heading" tabIndex={-1} className="text-3xl sm:text-4xl font-black tracking-tight text-foreground focus:outline-none">
                            {active.title}
                        </h1>
                        <p className="text-lg text-muted-foreground leading-relaxed">{active.description}</p>
                    </div>
                </header>

                {headerExtra}

                <div className="space-y-8">{children}</div>

                <div className="border-t-2 border-border pt-6">
                    <button type="button" onClick={onHome} className={settingsButtonClass("secondary", "lg")}>
                        <ArrowLeft className="size-5 shrink-0" aria-hidden />
                        <span>{t("Back to all settings")}</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Content blocks
// ---------------------------------------------------------------------------

interface SettingsCardProps {
    id?: string;
    title?: string;
    description?: ReactNode;
    tone?: "default" | "danger";
    headerExtra?: ReactNode;
    children: ReactNode;
    className?: string;
}

export function SettingsCard({ id, title, description, tone = "default", headerExtra, children, className }: SettingsCardProps) {
    const headingId = useId();
    return (
        <section
            id={id}
            aria-labelledby={title ? headingId : undefined}
            className={cn(
                "scroll-mt-24 rounded-3xl border-2 bg-card p-5 sm:p-7 shadow-sm",
                tone === "danger" ? "border-rose-300 dark:border-rose-500/40" : "border-foreground/10",
                className,
            )}
        >
            {(title || description || headerExtra) && (
                <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1.5">
                        {title && (
                            <h2 id={headingId} className={cn("text-xl sm:text-2xl font-bold", tone === "danger" ? "text-rose-700 dark:text-rose-300" : "text-foreground")}>
                                {title}
                            </h2>
                        )}
                        {description && <div className="text-base text-muted-foreground leading-relaxed">{description}</div>}
                    </div>
                    {headerExtra && <div className="shrink-0">{headerExtra}</div>}
                </div>
            )}
            {children}
        </section>
    );
}

export function settingsInputClass(hasError?: boolean, className?: string) {
    return cn(
        "w-full min-h-14 rounded-2xl border-2 bg-background px-4 py-3 text-lg text-foreground transition-colors",
        "placeholder:text-muted-foreground/80",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/40",
        "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
        hasError
            ? "border-rose-600 focus:border-rose-600 dark:border-rose-400"
            : "border-foreground/25 hover:border-foreground/45 focus:border-foreground/70",
        className,
    );
}

interface SettingsFieldProps {
    label: string;
    /** id of the input this label belongs to. */
    htmlFor: string;
    help?: ReactNode;
    error?: string;
    /** Overrides the id of the error message (when a validation hook already owns it). */
    errorId?: string;
    optional?: boolean;
    counter?: { current: number; max: number };
    children: ReactNode;
    className?: string;
}

/** A labelled form field. Label above, help under the label, error under the input. */
export function SettingsField({ label, htmlFor, help, error, errorId, optional, counter, children, className }: SettingsFieldProps) {
    const { t } = useLanguageContext();
    return (
        <div className={cn("space-y-2", className)}>
            <div className="space-y-1">
                <label htmlFor={htmlFor} className="block text-lg font-bold text-foreground">
                    {label}
                    {optional && <span className="ml-2 text-base font-semibold text-muted-foreground">({t("optional")})</span>}
                </label>
                {help && (
                    <p id={`${htmlFor}-help`} className="text-base text-muted-foreground leading-snug">
                        {help}
                    </p>
                )}
            </div>
            {children}
            <div className="flex items-start justify-between gap-3">
                {error ? (
                    <p id={errorId ?? `${htmlFor}-error`} role="alert" className="flex items-start gap-2 text-base font-semibold text-rose-700 dark:text-rose-400">
                        <AlertCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
                        <span>{error}</span>
                    </p>
                ) : (
                    <span />
                )}
                {counter && (
                    <p className={cn("shrink-0 text-sm font-semibold", counter.current > counter.max ? "text-rose-700 dark:text-rose-400" : "text-muted-foreground")}>
                        {t("{current} of {max} letters", { current: counter.current, max: counter.max })}
                    </p>
                )}
            </div>
        </div>
    );
}

/** aria wiring for an input that sits inside <SettingsField>. */
export function fieldAria(id: string, opts: { help?: boolean; error?: string }) {
    const describedBy = [opts.help ? `${id}-help` : null, opts.error ? `${id}-error` : null].filter(Boolean).join(" ");
    return {
        id,
        "aria-invalid": opts.error ? true : undefined,
        "aria-describedby": describedBy || undefined,
    } as const;
}

interface SettingsPasswordInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
    hasError?: boolean;
}

/** Password box with a labelled "Show" / "Hide" button (words, not just an eye icon). */
export function SettingsPasswordInput({ hasError, className, ...rest }: SettingsPasswordInputProps) {
    const { t } = useLanguageContext();
    const [visible, setVisible] = useState(false);
    return (
        <div className="relative">
            <input type={visible ? "text" : "password"} className={settingsInputClass(hasError, cn("pr-32", className))} {...rest} />
            <button
                type="button"
                onClick={() => setVisible((v) => !v)}
                aria-pressed={visible}
                className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-base font-bold text-foreground hover:bg-muted focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50 cursor-pointer"
            >
                {visible ? <EyeOff className="size-5" aria-hidden /> : <Eye className="size-5" aria-hidden />}
                <span>{visible ? t("Hide") : t("Show")}</span>
            </button>
        </div>
    );
}

interface SettingsSwitchRowProps {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (next: boolean) => void;
    disabled?: boolean;
    icon?: LucideIcon;
}

/** A whole-row on/off control. The current state is written out ("On" / "Off"). */
export function SettingsSwitchRow({ label, description, checked, onChange, disabled, icon: Icon }: SettingsSwitchRowProps) {
    const { t } = useLanguageContext();
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={cn(
                "flex w-full min-h-20 items-center gap-4 rounded-2xl border-2 px-4 py-4 text-left transition-colors cursor-pointer",
                "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50",
                "disabled:cursor-not-allowed disabled:opacity-60",
                checked ? "border-foreground/40 bg-primary/15" : "border-foreground/15 bg-card hover:border-foreground/35",
            )}
        >
            {Icon && <Icon className="size-6 shrink-0 text-foreground" aria-hidden />}
            <span className="flex-1 min-w-0">
                <span className="block text-lg font-bold text-foreground">{label}</span>
                {description && <span className="mt-0.5 block text-base text-muted-foreground leading-snug">{description}</span>}
            </span>
            <span className="flex shrink-0 flex-col items-center gap-1" aria-hidden>
                <span
                    className={cn(
                        "relative inline-flex h-9 w-16 items-center rounded-full border-2 transition-colors",
                        checked ? "border-foreground/70 bg-primary" : "border-foreground/30 bg-muted",
                    )}
                >
                    <span
                        className={cn(
                            "inline-flex size-6 items-center justify-center rounded-full bg-white shadow transition-transform",
                            checked ? "translate-x-8" : "translate-x-1",
                        )}
                    >
                        {checked && <Check className="size-4 text-foreground" strokeWidth={3} />}
                    </span>
                </span>
                <span className="text-sm font-bold text-foreground">{checked ? t("On") : t("Off")}</span>
            </span>
        </button>
    );
}

export interface SettingsChoiceOption<V extends string> {
    value: V;
    label: string;
    description?: string;
    /** Visual sample shown inside the option (e.g. "Aa" at a size). */
    preview?: ReactNode;
}

interface SettingsChoiceGroupProps<V extends string> {
    legend: string;
    hideLegend?: boolean;
    value: V;
    onChange: (value: V) => void;
    options: SettingsChoiceOption<V>[];
    columns?: 1 | 2 | 3;
}

/** Big radio cards built on native radio inputs (arrow keys work out of the box). */
export function SettingsChoiceGroup<V extends string>({ legend, hideLegend, value, onChange, options, columns = 2 }: SettingsChoiceGroupProps<V>) {
    const name = useId();
    return (
        <fieldset className="space-y-3">
            <legend className={cn("text-lg font-bold text-foreground", hideLegend && "sr-only")}>{legend}</legend>
            <div className={cn("grid grid-cols-1 gap-3", columns === 2 && "sm:grid-cols-2", columns === 3 && "sm:grid-cols-3")}>
                {options.map((option) => {
                    const selected = option.value === value;
                    return (
                        <label
                            key={option.value}
                            className={cn(
                                "relative flex min-h-20 cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-colors",
                                "has-[:focus-visible]:ring-4 has-[:focus-visible]:ring-primary/50",
                                selected ? "border-foreground/70 bg-primary/20" : "border-foreground/15 bg-card hover:border-foreground/40",
                            )}
                        >
                            <input
                                type="radio"
                                name={name}
                                value={option.value}
                                checked={selected}
                                onChange={() => onChange(option.value)}
                                className="sr-only"
                            />
                            <span
                                aria-hidden
                                className={cn(
                                    "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                                    selected ? "border-foreground bg-foreground text-background" : "border-foreground/40 bg-background",
                                )}
                            >
                                {selected && <Check className="size-4" strokeWidth={3} />}
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-lg font-bold text-foreground">{option.label}</span>
                                {option.description && <span className="mt-0.5 block text-base text-muted-foreground leading-snug">{option.description}</span>}
                                {option.preview && <span className="mt-3 block">{option.preview}</span>}
                            </span>
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
}

const NOTICE_TONES = {
    info: { icon: Info, box: "border-sky-300 bg-sky-50 text-sky-950 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-100" },
    success: { icon: CheckCircle2, box: "border-emerald-300 bg-emerald-50 text-emerald-950 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100" },
    warning: { icon: AlertTriangle, box: "border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100" },
    danger: { icon: AlertCircle, box: "border-rose-300 bg-rose-50 text-rose-950 dark:border-rose-500/40 dark:bg-rose-500/10 dark:text-rose-100" },
} as const;

interface SettingsNoticeProps {
    tone?: keyof typeof NOTICE_TONES;
    title?: string;
    children?: ReactNode;
    action?: ReactNode;
    live?: boolean;
    className?: string;
}

export function SettingsNotice({ tone = "info", title, children, action, live, className }: SettingsNoticeProps) {
    const { icon: Icon, box } = NOTICE_TONES[tone];
    return (
        <div
            role={live ? (tone === "danger" ? "alert" : "status") : undefined}
            className={cn("flex flex-col gap-4 rounded-2xl border-2 p-4 sm:flex-row sm:items-center", box, className)}
        >
            <div className="flex flex-1 items-start gap-3">
                <Icon className="mt-0.5 size-6 shrink-0" aria-hidden />
                <div className="space-y-1">
                    {title && <p className="text-lg font-bold">{title}</p>}
                    {children && <div className="text-base leading-relaxed">{children}</div>}
                </div>
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    );
}

interface SettingsSaveBarProps {
    visible: boolean;
    saving: boolean;
    justSaved?: boolean;
    onSave: () => void;
    onDiscard: () => void;
    /** Raise the bar above a bottom tab bar (mobile app shell). */
    raised?: boolean;
}

/**
 * Appears at the bottom of the screen while there are unsaved changes, so the Save button is
 * always within reach no matter how far down the page someone has scrolled.
 */
export function SettingsSaveBar({ visible, saving, justSaved, onSave, onDiscard, raised }: SettingsSaveBarProps) {
    const { t } = useLanguageContext();
    const show = visible || saving || justSaved;
    if (!show) return null;
    const savedOnly = justSaved && !visible && !saving;

    return (
        <div
            role="region"
            aria-label={t("Save your changes")}
            className={cn(
                "fixed inset-x-0 z-50 px-3 sm:px-6",
                raised ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))]" : "bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]",
            )}
        >
            <div
                className={cn(
                    "mx-auto flex max-w-3xl flex-col gap-3 rounded-3xl border-2 bg-card p-4 shadow-2xl sm:flex-row sm:items-center sm:gap-4",
                    savedOnly ? "border-emerald-400 dark:border-emerald-500/50" : "border-amber-400 dark:border-amber-500/60",
                )}
            >
                <p aria-live="polite" className="flex flex-1 items-center gap-3 text-base font-bold text-foreground">
                    {savedOnly ? (
                        <>
                            <CheckCircle2 className="size-6 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                            <span>{t("Your changes are saved.")}</span>
                        </>
                    ) : (
                        <>
                            <AlertTriangle className="size-6 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                            <span>{saving ? t("Saving your changes…") : t("You have changes that are not saved yet.")}</span>
                        </>
                    )}
                </p>
                {!savedOnly && (
                    <div className="flex gap-3">
                        <SettingsButton variant="secondary" onClick={onDiscard} disabled={saving} className="flex-1 whitespace-nowrap px-4 sm:flex-none">
                            {t("Undo changes")}
                        </SettingsButton>
                        <SettingsButton variant="primary" onClick={onSave} loading={saving} className="flex-1 whitespace-nowrap px-4 sm:flex-none">
                            {saving ? t("Saving…") : t("Save changes")}
                        </SettingsButton>
                    </div>
                )}
            </div>
        </div>
    );
}

/** A "go somewhere else" row: label, explanation and a clear button. */
export function SettingsLinkRow({ title, description, action }: { title: string; description?: string; action: ReactNode }) {
    return (
        <div className="flex flex-col gap-4 rounded-2xl border-2 border-foreground/15 p-4 sm:flex-row sm:items-center">
            <div className="flex-1 space-y-1">
                <p className="text-lg font-bold text-foreground">{title}</p>
                {description && <p className="text-base text-muted-foreground leading-snug">{description}</p>}
            </div>
            <div className="shrink-0">{action}</div>
        </div>
    );
}

interface SettingsLeaveDialogProps {
    open: boolean;
    saving: boolean;
    onStay: () => void;
    onDiscard: () => void;
    onSave: () => void;
}

/** Asked when someone tries to leave a page with unsaved changes. Three plain choices. */
export function SettingsLeaveDialog({ open, saving, onStay, onDiscard, onSave }: SettingsLeaveDialogProps) {
    const { t } = useLanguageContext();
    return (
        <Dialog.Root open={open} onOpenChange={(next) => { if (!next && !saving) onStay(); }}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 z-[200] bg-black/60" />
                <Dialog.Content
                    className="fixed left-1/2 top-1/2 z-[201] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border-2 border-foreground/15 bg-card p-6 sm:p-8 shadow-2xl focus:outline-none"
                    onEscapeKeyDown={(e) => { if (saving) e.preventDefault(); }}
                    onPointerDownOutside={(e) => { if (saving) e.preventDefault(); }}
                >
                    <div className="flex items-start gap-4">
                        <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                            <AlertTriangle className="size-7" />
                        </span>
                        <div className="space-y-2">
                            <Dialog.Title className="text-2xl font-bold text-foreground">{t("Save your changes first?")}</Dialog.Title>
                            <Dialog.Description className="text-lg text-muted-foreground leading-relaxed">
                                {t("You changed some details but did not press Save yet. If you leave without saving, your changes will be lost.")}
                            </Dialog.Description>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-col gap-3">
                        <SettingsButton variant="primary" size="lg" icon={Check} loading={saving} onClick={onSave}>
                            {saving ? t("Saving…") : t("Save my changes")}
                        </SettingsButton>
                        <SettingsButton variant="secondary" size="lg" onClick={onDiscard} disabled={saving}>
                            {t("Leave without saving")}
                        </SettingsButton>
                        <SettingsButton variant="ghost" size="lg" onClick={onStay} disabled={saving}>
                            {t("Stay on this page")}
                        </SettingsButton>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}
