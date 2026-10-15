import {
    Banknote,
    Bell,
    ClipboardCheck,
    ClipboardList,
    DoorOpen,
    FileSignature,
    Megaphone,
    MessageSquare,
    RefreshCw,
    Wrench,
    type LucideIcon,
} from "lucide-react";
import type { TranslationParams } from "@/lib/i18n";

type Translate = (phrase: string, params?: TranslationParams) => string;

export interface NotificationVisual {
    icon: LucideIcon;
    /** Tinted background + foreground classes for the icon tile. */
    tileClassName: string;
    /** Foreground-only class, for tiles that keep their own background. */
    iconClassName: string;
    /** Badge pill classes (background, text, border). */
    badgeClassName: string;
    /** English label; pass through t(). */
    label: string;
}

const visual = (icon: LucideIcon, color: string, label: string): NotificationVisual => ({
    icon,
    tileClassName: `bg-${color}-500/10 text-${color}-500`,
    iconClassName: `text-${color}-500`,
    badgeClassName: `bg-${color}-500/15 text-${color}-600 dark:text-${color}-400 border-${color}-500/20`,
    label,
});

// Class names are spelled out below so Tailwind's scanner picks them up:
// bg-emerald-500/10 text-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20
// bg-amber-500/10 text-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20
// bg-blue-500/10 text-blue-500 bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20
// bg-purple-500/10 text-purple-500 bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/20
// bg-red-500/10 text-red-500 bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/20
// bg-sky-500/10 text-sky-500 bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/20
// bg-indigo-500/10 text-indigo-500 bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/20
const NOTIFICATION_VISUALS: Record<string, NotificationVisual> = {
    payment: visual(Banknote, "emerald", "Payment"),
    maintenance: visual(Wrench, "amber", "Maintenance"),
    application: visual(ClipboardList, "blue", "Application"),
    lease: visual(FileSignature, "purple", "Lease"),
    lease_renewal_request: visual(RefreshCw, "purple", "Renewal"),
    lease_renewal_approved: visual(RefreshCw, "purple", "Renewal"),
    lease_renewal_rejected: visual(RefreshCw, "red", "Renewal"),
    move_out_approved: visual(DoorOpen, "sky", "Move-out"),
    move_out_denied: visual(DoorOpen, "red", "Move-out"),
    move_out_inspection_completed: visual(ClipboardCheck, "sky", "Move-out"),
    move_out_finalized: visual(DoorOpen, "sky", "Move-out"),
    announcement: visual(Megaphone, "indigo", "Announcement"),
    message: visual(MessageSquare, "blue", "Message"),
};

const DEFAULT_VISUAL: NotificationVisual = {
    icon: Bell,
    tileClassName: "bg-primary/10 text-primary",
    iconClassName: "text-primary",
    badgeClassName: "bg-primary/15 text-primary border-primary/20",
    label: "Notice",
};

export function getNotificationVisual(type: string | null | undefined): NotificationVisual {
    return (type && NOTIFICATION_VISUALS[type]) || DEFAULT_VISUAL;
}

/**
 * Relative time for fresh notifications ("5m ago", "3h ago"); anything a day or
 * older also carries the clock time ("Yesterday · 3:12 PM", "Oct 4 · 3:12 PM").
 */
export function formatNotificationTime(value: string, t: Translate, locale: string) {
    const timestamp = new Date(value);
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();

    if (Number.isNaN(diffMs) || diffMs < 0) {
        return t("Recently");
    }

    const minute = 60 * 1000;
    const hour = 60 * minute;
    const day = 24 * hour;

    if (diffMs < hour) {
        return t("{count}m ago", { count: Math.max(1, Math.floor(diffMs / minute)) });
    }

    if (diffMs < day) {
        return t("{count}h ago", { count: Math.max(1, Math.floor(diffMs / hour)) });
    }

    const time = timestamp.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });

    const days = Math.floor(diffMs / day);
    if (days === 1) {
        return `${t("Yesterday")} · ${time}`;
    }

    if (days < 7) {
        return `${t("{count}d ago", { count: days })} · ${time}`;
    }

    const date = timestamp.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        ...(timestamp.getFullYear() !== now.getFullYear() && { year: "numeric" }),
    });
    return `${date} · ${time}`;
}

/** Full date + time, for a timestamp's hover title. */
export function formatNotificationFullTime(value: string, locale: string) {
    const timestamp = new Date(value);
    return Number.isNaN(timestamp.getTime())
        ? ""
        : timestamp.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}
