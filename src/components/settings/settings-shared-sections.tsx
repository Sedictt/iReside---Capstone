"use client";

/**
 * Settings pages that are the same for tenants and landlords: how the screen looks,
 * the list of signed-in devices, notification topics and closing an account.
 */

import { useTheme } from "next-themes";
import { Check, LogOut, Mail, Monitor, Moon, Smartphone, Sun, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguageContext } from "@/context/LanguageContext";
import { useFontSize } from "@/hooks/useFontSize";
import { useHighContrast } from "@/hooks/useHighContrast";
import { useTimeFormat } from "@/hooks/useTimeFormat";
import { parseUserAgent } from "@/lib/utils/device-parser";
import { ClientOnlyDate } from "@/components/ui/client-only-date";
import {
    SettingsButton,
    SettingsCard,
    SettingsChoiceGroup,
    SettingsNotice,
    SettingsSwitchRow,
    settingsButtonClass,
} from "@/components/settings/settings-ui";

// ---------------------------------------------------------------------------
// Text size & display
// ---------------------------------------------------------------------------

export function DisplaySettingsSection({ showTheme = false }: { showTheme?: boolean }) {
    const { t, language, setLanguage } = useLanguageContext();
    const { fontScale, setFontScale } = useFontSize();
    const { isHighContrast, toggleHighContrast } = useHighContrast();
    const { timeFormat, setTimeFormat } = useTimeFormat();
    const { resolvedTheme, setTheme } = useTheme();

    const sizeValue = fontScale >= 120 ? "120" : fontScale >= 110 ? "110" : "100";

    return (
        <>
            <SettingsNotice tone="info">
                {t("Changes on this page happen right away. You do not need to press Save.")}
            </SettingsNotice>

            <SettingsCard id="settings-text-size" title={t("Text size")} description={t("Pick the size that is easiest for you to read.")}>
                <SettingsChoiceGroup
                    legend={t("Text size")}
                    hideLegend
                    columns={3}
                    value={sizeValue}
                    onChange={(v) => setFontScale(Number(v))}
                    options={[
                        { value: "100", label: t("Normal"), preview: <span className="block font-bold text-foreground" style={{ fontSize: "1.25rem" }}>Aa</span> },
                        { value: "110", label: t("Bigger"), preview: <span className="block font-bold text-foreground" style={{ fontSize: "1.6rem" }}>Aa</span> },
                        { value: "120", label: t("Biggest"), preview: <span className="block font-bold text-foreground" style={{ fontSize: "2rem" }}>Aa</span> },
                    ]}
                />
                <p className="mt-4 text-base text-muted-foreground">{t("This choice is saved on this device only.")}</p>
            </SettingsCard>

            <SettingsCard id="settings-contrast" title={t("Easier to see")} description={t("Makes text darker and borders sharper.")}>
                <SettingsSwitchRow
                    label={t("Stronger contrast")}
                    description={t("Turn this on if things look faded or hard to tell apart.")}
                    checked={isHighContrast}
                    onChange={(next) => toggleHighContrast(next)}
                />
            </SettingsCard>

            {showTheme && (
                <SettingsCard id="settings-theme" title={t("Screen colors")} description={t("Light is best in bright rooms. Dark is gentler at night.")}>
                    <SettingsChoiceGroup
                        legend={t("Screen colors")}
                        hideLegend
                        value={resolvedTheme === "dark" ? "dark" : "light"}
                        onChange={(v) => setTheme(v)}
                        options={[
                            { value: "light", label: t("Light"), description: t("Dark text on a white background."), preview: <ThemeSwatch icon={Sun} dark={false} /> },
                            { value: "dark", label: t("Dark"), description: t("Light text on a dark background."), preview: <ThemeSwatch icon={Moon} dark /> },
                        ]}
                    />
                </SettingsCard>
            )}

            <SettingsCard id="settings-language" title={t("Language")} description={t("Choose the language for buttons, menus and messages.")}>
                <SettingsChoiceGroup
                    legend={t("Language")}
                    hideLegend
                    value={language}
                    onChange={(v) => setLanguage(v)}
                    options={[
                        { value: "en", label: "English", description: t("Standard English.") },
                        { value: "fil", label: "Filipino (Taglish)", description: t("Everyday Filipino mixed with English.") },
                    ]}
                />
            </SettingsCard>

            <SettingsCard id="settings-time" title={t("How times are shown")}>
                <SettingsChoiceGroup
                    legend={t("How times are shown")}
                    hideLegend
                    value={timeFormat}
                    onChange={(v) => setTimeFormat(v)}
                    options={[
                        { value: "12h", label: "1:30 PM", description: t("12-hour clock with AM and PM (most common).") },
                        { value: "24h", label: "13:30", description: t("24-hour clock.") },
                    ]}
                />
            </SettingsCard>
        </>
    );
}

function ThemeSwatch({ icon: Icon, dark }: { icon: LucideIcon; dark: boolean }) {
    return (
        <span
            className={cn(
                "flex h-14 items-center gap-3 rounded-xl border-2 px-3",
                dark ? "border-neutral-700 bg-neutral-900 text-white" : "border-neutral-300 bg-white text-neutral-900",
            )}
        >
            <Icon className="size-5" aria-hidden />
            <span className="text-base font-bold">Aa</span>
        </span>
    );
}

// ---------------------------------------------------------------------------
// Signed-in devices
// ---------------------------------------------------------------------------

export interface SignedInSession {
    id: string;
    user_agent?: string | null;
    ip?: string | null;
    updated_at?: string | null;
}

interface SignedInDevicesCardProps {
    sessions: SignedInSession[];
    loading: boolean;
    currentSessionId: string | null;
    onSignOutDevice: (id: string) => void;
    onSignOutOthers: () => void;
    onSignOutEverywhere: () => void;
}

export function SignedInDevicesCard({ sessions, loading, currentSessionId, onSignOutDevice, onSignOutOthers, onSignOutEverywhere }: SignedInDevicesCardProps) {
    const { t, locale } = useLanguageContext();

    return (
        <SettingsCard
            id="settings-devices"
            title={t("Where you are signed in")}
            description={t("These are the phones and computers using your account. If you see one you do not know, sign it out and change your password.")}
        >
            {loading && sessions.length === 0 ? (
                <p role="status" className="text-lg text-muted-foreground">{t("Loading your devices…")}</p>
            ) : sessions.length === 0 ? (
                <p className="text-lg text-muted-foreground">{t("No other devices found.")}</p>
            ) : (
                <ul className="space-y-3">
                    {sessions.map((session) => {
                        const device = parseUserAgent(session.user_agent ?? "");
                        const isCurrent = session.id === currentSessionId;
                        const Icon = device.deviceType === "mobile" || device.deviceType === "tablet" ? Smartphone : Monitor;
                        return (
                            <li
                                key={session.id}
                                className={cn(
                                    "flex flex-col gap-4 rounded-2xl border-2 p-4 sm:flex-row sm:items-center",
                                    isCurrent ? "border-foreground/50 bg-primary/15" : "border-foreground/15",
                                )}
                            >
                                <div className="flex flex-1 items-center gap-4 min-w-0">
                                    <Icon className="size-8 shrink-0 text-foreground" aria-hidden />
                                    <div className="min-w-0">
                                        <p className="flex flex-wrap items-center gap-2 text-lg font-bold text-foreground">
                                            <span>{device.label}</span>
                                            {isCurrent && (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-0.5 text-sm font-bold text-background">
                                                    <Check className="size-4" aria-hidden /> {t("This device")}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-base text-muted-foreground">
                                            {isCurrent ? (
                                                t("You are using it now")
                                            ) : session.updated_at ? (
                                                <>
                                                    {t("Last used")}{" "}
                                                    <ClientOnlyDate date={session.updated_at} locale={locale} format={{ month: "long", day: "numeric", hour: "numeric", minute: "2-digit" }} />
                                                </>
                                            ) : (
                                                t("Last used: not known")
                                            )}
                                        </p>
                                    </div>
                                </div>
                                {!isCurrent && (
                                    <SettingsButton variant="secondary" icon={LogOut} onClick={() => onSignOutDevice(session.id)} className="sm:shrink-0">
                                        {t("Sign out this device")}
                                    </SettingsButton>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            <div className="mt-6 flex flex-col gap-3 border-t-2 border-border pt-6 sm:flex-row">
                {sessions.length > 1 && (
                    <SettingsButton variant="secondary" icon={LogOut} onClick={onSignOutOthers} disabled={loading}>
                        {t("Sign out all other devices")}
                    </SettingsButton>
                )}
                <SettingsButton
                    variant="ghost"
                    onClick={() => {
                        if (window.confirm(t("This will sign you out on every device, including this one. You will need to sign in again. Continue?"))) {
                            onSignOutEverywhere();
                        }
                    }}
                    disabled={loading}
                    className="text-rose-700 dark:text-rose-400"
                >
                    {t("Sign out everywhere, including here")}
                </SettingsButton>
            </div>
        </SettingsCard>
    );
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface NotificationTopic<K extends string> {
    key: K;
    label: string;
    description: string;
    icon: LucideIcon;
}

export interface NotificationChannel<C extends string> {
    key: C;
    label: string;
}

interface NotificationTopicsListProps<K extends string, C extends string> {
    topics: NotificationTopic<K>[];
    channels: NotificationChannel<C>[];
    isOn: (topic: K, channel: C) => boolean;
    onToggle: (topic: K, channel: C) => void;
}

/** One block per topic; under it, a clearly worded On/Off button for each way we can reach you. */
export function NotificationTopicsList<K extends string, C extends string>({ topics, channels, isOn, onToggle }: NotificationTopicsListProps<K, C>) {
    const { t } = useLanguageContext();
    return (
        <ul className="space-y-4">
            {topics.map((topic) => {
                const Icon = topic.icon;
                return (
                    <li key={topic.key} className="rounded-2xl border-2 border-foreground/15 p-4 sm:p-5">
                        <div className="flex items-start gap-3">
                            <Icon className="mt-0.5 size-6 shrink-0 text-foreground" aria-hidden />
                            <div className="space-y-0.5">
                                <h3 className="text-lg font-bold text-foreground">{topic.label}</h3>
                                <p className="text-base text-muted-foreground leading-snug">{topic.description}</p>
                            </div>
                        </div>
                        <div className={cn("mt-4 grid grid-cols-1 gap-3", channels.length === 2 && "sm:grid-cols-2", channels.length >= 3 && "sm:grid-cols-3")}>
                            {channels.map((channel) => {
                                const on = isOn(topic.key, channel.key);
                                return (
                                    <button
                                        key={channel.key}
                                        type="button"
                                        role="switch"
                                        aria-checked={on}
                                        aria-label={`${topic.label}: ${channel.label}`}
                                        onClick={() => onToggle(topic.key, channel.key)}
                                        className={cn(
                                            "flex min-h-14 items-center justify-between gap-3 rounded-xl border-2 px-4 text-left text-base font-bold transition-colors cursor-pointer",
                                            "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/50",
                                            on ? "border-foreground/60 bg-primary/20 text-foreground" : "border-foreground/15 bg-card text-muted-foreground hover:border-foreground/40",
                                        )}
                                    >
                                        <span className="text-foreground">{channel.label}</span>
                                        <span className="flex items-center gap-2">
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    "flex size-7 items-center justify-center rounded-lg border-2",
                                                    on ? "border-foreground bg-foreground text-background" : "border-foreground/40 bg-background",
                                                )}
                                            >
                                                {on && <Check className="size-4" strokeWidth={3} />}
                                            </span>
                                            <span className={on ? "text-foreground" : "text-muted-foreground"}>{on ? t("On") : t("Off")}</span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </li>
                );
            })}
        </ul>
    );
}

// ---------------------------------------------------------------------------
// Closing an account (done by request, see the Privacy Policy)
// ---------------------------------------------------------------------------

export const PRIVACY_CONTACT_EMAIL = "ireside.official.mail@gmail.com";

export function CloseAccountCard({ accountEmail, extraNote }: { accountEmail?: string | null; extraNote?: string }) {
    const { t } = useLanguageContext();
    const subject = encodeURIComponent("Account closure request");
    const body = encodeURIComponent(
        `Hello iReside team,\n\nPlease close my account${accountEmail ? ` (${accountEmail})` : ""}.\n\nThank you.`,
    );

    return (
        <SettingsCard
            id="settings-close-account"
            tone="danger"
            title={t("Close my account")}
            description={t("Closing your account deletes your profile and records for good. This cannot be undone.")}
        >
            <div className="space-y-5">
                <p className="text-lg text-foreground leading-relaxed">
                    {t("To keep leases and payment records safe, accounts are closed by request. Send us an email and our team will help you, step by step.")}
                </p>
                {extraNote && <p className="text-base text-muted-foreground leading-relaxed">{extraNote}</p>}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <a href={`mailto:${PRIVACY_CONTACT_EMAIL}?subject=${subject}&body=${body}`} className={settingsButtonClass("secondary", "md", "text-rose-700 dark:text-rose-300")}>
                        <Mail className="size-5" aria-hidden />
                        <span>{t("Email a request to close my account")}</span>
                    </a>
                    <a href="/privacy" className="text-base font-semibold text-foreground underline underline-offset-4">
                        {t("Read our Privacy Policy")}
                    </a>
                </div>
                <p className="text-base text-muted-foreground">
                    {t("Email address:")} <span className="font-semibold text-foreground">{PRIVACY_CONTACT_EMAIL}</span>
                </p>
            </div>
        </SettingsCard>
    );
}
