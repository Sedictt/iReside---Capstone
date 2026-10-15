"use client";

import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Bell,
    Camera,
    FileText,
    HelpCircle,
    KeyRound,
    Megaphone,
    Phone,
    Receipt,
    ShieldCheck,
    Tag,
    Type,
    User,
    Wallet,
    Wrench,
    Download,
    Mail,
} from "lucide-react";
import { createClient as createStandaloneSupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";

import { useFormValidation } from "@/hooks/useFormValidation";
import { PhoneNumberInput } from "@/components/ui/PhoneNumberInput";
import { toPhMobileE164 } from "@/lib/phone";
import {
    PASSWORD_MAX_LENGTH,
    TEXT_LIMITS,
    confirmMatchRule,
    newPasswordRule,
    personNameRule,
    phoneRule,
    textRule,
} from "@/lib/validation/rules";
import { BIO_MAX_LENGTH, CURRENT_PASSWORD_MAX_LENGTH, currentPasswordRule } from "@/lib/validation/schemas/account.schema";
import { useAuth } from "@/hooks/useAuth";
import { PageLoader } from "@/components/ui/LoadingSpinner";
import { AvatarPicker } from "@/components/profile/AvatarPicker";
import { createClient } from "@/lib/supabase/client";
import { updateTenantPassword, signOut } from "@/lib/supabase/client-auth";
import { useLanguageContext } from "@/context/LanguageContext";
import { SecurityKeyManagementCard } from "@/components/auth/SecurityKeyManagementCard";
import { TwoFactorManagementCard } from "@/components/auth/TwoFactorManagementCard";
import { tr } from "@/hooks/useLanguage";
import {
    SettingsButton,
    SettingsCard,
    SettingsField,
    SettingsHub,
    SettingsLeaveDialog,
    SettingsLinkRow,
    SettingsNotice,
    SettingsPasswordInput,
    SettingsSaveBar,
    SettingsSectionLayout,
    settingsButtonClass,
    settingsInputClass,
    useSettingsNavigation,
    type SettingsGroupDef,
    type SettingsQuickTask,
    type SettingsSectionDef,
} from "@/components/settings/settings-ui";
import {
    CloseAccountCard,
    DisplaySettingsSection,
    NotificationTopicsList,
    PRIVACY_CONTACT_EMAIL,
    SignedInDevicesCard,
    type SignedInSession,
} from "@/components/settings/settings-shared-sections";

// --- Pages ---

const SECTION_IDS = ["profile", "security", "display", "notifications", "payments", "privacy"] as const;
type SectionId = (typeof SECTION_IDS)[number];

/** Old links used ?category=...&subtab=...; keep them working. */
function resolveLegacyLink(category: string): SectionId | null {
    switch (category) {
        case "Identity": return "profile";
        case "Accessibility": return "display";
        case "Security": return "security";
        case "Notifications": return "notifications";
        case "Billing": return "payments";
        case "Data": return "privacy";
        default: return null;
    }
}

type NotificationTopicKey = "rent" | "maintenance" | "lease" | "community" | "offers";
type NotificationChannelKey = "email" | "push";
type NotificationPrefs = Record<NotificationTopicKey, Record<NotificationChannelKey, boolean>>;

const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
    rent: { email: true, push: true },
    maintenance: { email: true, push: true },
    lease: { email: true, push: true },
    community: { email: false, push: true },
    offers: { email: false, push: false },
};

function readNotificationPrefs(socials: unknown): NotificationPrefs {
    const saved = (socials as { notification_preferences?: Partial<NotificationPrefs> } | null)?.notification_preferences;
    const next = JSON.parse(JSON.stringify(DEFAULT_NOTIFICATION_PREFS)) as NotificationPrefs;
    if (saved && typeof saved === "object") {
        for (const key of Object.keys(next) as NotificationTopicKey[]) {
            next[key] = { ...next[key], ...(saved[key] ?? {}) };
        }
    }
    return next;
}

type ProfileForm = {
    full_name: string;
    email: string;
    phone: string;
    address: string;
    bio: string;
    emergency_name: string;
    emergency_phone: string;
};

const EMPTY_PROFILE: ProfileForm = { full_name: "", email: "", phone: "", address: "", bio: "", emergency_name: "", emergency_phone: "" };

type PendingNavigation = { kind: "section"; id: SectionId | null } | { kind: "url"; href: string } | { kind: "back" };

// --- Main Component ---

export function TenantSettings({ embedded = false }: { embedded?: boolean } = {}) {
    const router = useRouter();
    const { profile, loading, refreshProfile } = useAuth();
    const { t } = useLanguageContext();
    const tErr = (message?: string) => (message ? t(message) : message);
    const supabase = useMemo(() => createClient(), []);

    // --- Page definitions (translated) ---
    const groups: SettingsGroupDef[] = [
        { id: "account", title: t("Your account") },
        { id: "comfort", title: t("Your screen and alerts") },
        { id: "money", title: t("Payments and privacy") },
    ];
    const sections: SettingsSectionDef<SectionId>[] = [
        { id: "profile", group: "account", icon: User, title: t("My profile"), description: t("Your name, photo, phone number, address and emergency contact.") },
        { id: "security", group: "account", icon: KeyRound, title: t("Password and sign-in"), description: t("Change your password and see where you are signed in.") },
        { id: "display", group: "comfort", icon: Type, title: t("Text size and display"), description: t("Make the words bigger, change the language, and more.") },
        { id: "notifications", group: "comfort", icon: Bell, title: t("Notifications"), description: t("Choose which reminders and messages you get.") },
        { id: "payments", group: "money", icon: Wallet, title: t("Bills and payments"), description: t("Where to find your bills, receipts and payment history.") },
        { id: "privacy", group: "money", icon: ShieldCheck, title: t("My data and account"), description: t("Get a copy of your information or close your account.") },
    ];
    const quickTasks: SettingsQuickTask<SectionId>[] = [
        { label: t("Make the text bigger"), section: "display", icon: Type, anchor: "settings-text-size" },
        { label: t("Change my password"), section: "security", icon: KeyRound, anchor: "settings-password" },
        { label: t("Update my phone number"), section: "profile", icon: Phone, anchor: "settings-about-you" },
        { label: t("Choose my reminders"), section: "notifications", icon: Bell },
    ];

    // --- Profile form ---
    const [formData, setFormData] = useState<ProfileForm>(EMPTY_PROFILE);
    const [savedProfile, setSavedProfile] = useState<ProfileForm>(EMPTY_PROFILE);
    const [isSavingProfile, setIsSavingProfile] = useState(false);
    const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);

    useEffect(() => {
        if (!profile) return;
        const next: ProfileForm = {
            full_name: profile.full_name || "",
            email: profile.email || "",
            phone: profile.phone || "",
            address: profile.address || "",
            bio: profile.bio || "",
            emergency_name: (profile as any).emergency_contact_name || "",
            emergency_phone: (profile as any).emergency_contact_phone || "",
        };
        setFormData(next);
        setSavedProfile(next);
    }, [profile]);

    const profileForm = useFormValidation(formData, {
        full_name: (value) => personNameRule(value),
        phone: (value) => phoneRule(value),
        address: (value) => textRule(value, { label: "Address", max: TEXT_LIMITS.address }),
        bio: (value) => textRule(value, { label: "Bio", max: BIO_MAX_LENGTH }),
        emergency_name: (value) => personNameRule(value, { label: "Contact name", required: false }),
        emergency_phone: (value) => phoneRule(value),
    });

    const isProfileDirty = JSON.stringify(formData) !== JSON.stringify(savedProfile);
    const setField = (name: keyof ProfileForm, value: string) => setFormData((prev) => ({ ...prev, [name]: value }));

    /** Props for a text input bound to the profile form. */
    const bindProfileInput = (name: keyof ProfileForm, id: string, hasHelp = false) => {
        const props = profileForm.fieldProps(name);
        const error = tErr(profileForm.errorFor(name));
        return {
            ...props,
            id,
            "aria-describedby": [hasHelp ? `${id}-help` : null, props["aria-describedby"]].filter(Boolean).join(" ") || undefined,
            value: formData[name],
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(name, e.target.value),
            className: settingsInputClass(Boolean(error)),
        };
    };

    /** Props for a phone field: the shared +63 input reports the number, not an event. */
    const bindProfilePhone = (name: "phone" | "emergency_phone", id: string, hasHelp = false) => {
        const { onChange: _textOnChange, ...rest } = bindProfileInput(name, id, hasHelp);
        return { ...rest, onValueChange: (next: string) => setField(name, next) };
    };

    const handleSaveProfile = async (): Promise<boolean> => {
        if (!profile || isSavingProfile) return false;
        if (!profileForm.validateAll()) {
            toast.error(t("Some details need fixing. Look for the red messages."));
            return false;
        }
        setIsSavingProfile(true);
        try {
            const socialsWithEmergency = {
                ...((profile.socials as any) || {}),
                emergency_contact_name: formData.emergency_name,
                emergency_contact_phone: toPhMobileE164(formData.emergency_phone) ?? "",
            };

            const { error } = await supabase
                .from("profiles")
                .update({ full_name: formData.full_name.trim(), bio: formData.bio.trim(), socials: socialsWithEmergency } as any)
                .eq("id", profile.id);
            if (error) throw error;

            try {
                await supabase.auth.updateUser({
                    data: { emergency_contact_name: formData.emergency_name, emergency_contact_phone: toPhMobileE164(formData.emergency_phone) ?? "" },
                });
            } catch {
                // non-blocking
            }

            const { error: privateError } = await (supabase as any)
                .from("profile_private")
                .upsert(
                    { profile_id: profile.id, phone: toPhMobileE164(formData.phone), address: formData.address.trim() || null, updated_at: new Date().toISOString() },
                    { onConflict: "profile_id" },
                );
            if (privateError) throw privateError;

            setSavedProfile(formData);
            await refreshProfile();
            flashSaved();
            toast.success(t("Your profile is saved."));
            return true;
        } catch (error: any) {
            toast.error(tr(error.message || t("Failed to update profile")));
            return false;
        } finally {
            setIsSavingProfile(false);
        }
    };

    // --- Notifications ---
    const [notificationPrefs, setNotificationPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
    const [savedNotificationPrefs, setSavedNotificationPrefs] = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS);
    const [isSavingNotifications, setIsSavingNotifications] = useState(false);

    useEffect(() => {
        if (!profile) return;
        const prefs = readNotificationPrefs(profile.socials);
        setNotificationPrefs(prefs);
        setSavedNotificationPrefs(prefs);
    }, [profile]);

    const isNotificationsDirty = JSON.stringify(notificationPrefs) !== JSON.stringify(savedNotificationPrefs);

    const handleSaveNotifications = async (): Promise<boolean> => {
        if (!profile || isSavingNotifications) return false;
        setIsSavingNotifications(true);
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ socials: { ...((profile.socials as any) || {}), notification_preferences: notificationPrefs } } as any)
                .eq("id", profile.id);
            if (error) throw error;
            setSavedNotificationPrefs(notificationPrefs);
            await refreshProfile();
            flashSaved();
            toast.success(t("Your notification choices are saved."));
            return true;
        } catch (error: any) {
            toast.error(tr(error.message || t("Could not save your notification choices.")));
            return false;
        } finally {
            setIsSavingNotifications(false);
        }
    };

    // --- Save bar / unsaved-changes guard ---
    const [justSaved, setJustSaved] = useState(false);
    const justSavedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const flashSaved = () => {
        setJustSaved(true);
        if (justSavedTimer.current) clearTimeout(justSavedTimer.current);
        justSavedTimer.current = setTimeout(() => setJustSaved(false), 3000);
    };

    const isDirty = isProfileDirty || isNotificationsDirty;
    const isDirtyRef = useRef(false);
    useEffect(() => {
        isDirtyRef.current = isDirty;
    }, [isDirty]);
    const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);

    const { section, ready, open, leave } = useSettingsNavigation<SectionId>({
        sectionIds: SECTION_IDS,
        resolveLegacy: resolveLegacyLink,
        shouldBlock: () => isDirtyRef.current,
        onBlocked: (target) => setPendingNavigation({ kind: "section", id: target }),
        isDirty,
        onLeaveBlocked: () => setPendingNavigation({ kind: "back" }),
    });

    const saveAll = async () => {
        let ok = true;
        if (isProfileDirty) ok = (await handleSaveProfile()) && ok;
        if (isNotificationsDirty) ok = (await handleSaveNotifications()) && ok;
        return ok;
    };

    const discardAll = () => {
        setFormData(savedProfile);
        profileForm.reset();
        setNotificationPrefs(savedNotificationPrefs);
    };

    const continuePendingNavigation = (nav: PendingNavigation) => {
        setPendingNavigation(null);
        if (nav.kind === "url") router.push(nav.href);
        else if (nav.kind === "back") leave();
        else open(nav.id, { force: true });
    };

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!isDirtyRef.current) return;
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    const goToDashboard = () => {
        if (isDirtyRef.current) setPendingNavigation({ kind: "url", href: "/tenant/dashboard" });
        else router.push("/tenant/dashboard");
    };

    // --- Security ---
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordUpdating, setPasswordUpdating] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const passwordForm = useFormValidation(
        { currentPassword, newPassword, confirmPassword },
        {
            currentPassword: (value) => currentPasswordRule(value, { label: "Current password" }),
            newPassword: (value) => newPasswordRule(value, { label: "New password" }),
            confirmPassword: (value, all) => confirmMatchRule(value, all.newPassword, { label: "New passwords" }),
        },
    );

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordUpdating) return;
        setPasswordError(null);
        setPasswordSuccess(false);
        if (!passwordForm.validateAll()) return;

        setPasswordUpdating(true);
        try {
            // Verify the current password on a throwaway client so the active session is untouched.
            const accountEmail = profile?.email;
            if (accountEmail) {
                const verifier = createStandaloneSupabaseClient(
                    process.env.NEXT_PUBLIC_SUPABASE_URL!,
                    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                    { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } },
                );
                const { error: verifyError } = await verifier.auth.signInWithPassword({ email: accountEmail, password: currentPassword });
                if (verifyError) {
                    passwordForm.setServerErrors({ currentPassword: "Current password is incorrect." });
                    return;
                }
            }

            const result = await updateTenantPassword(newPassword);
            if (result.success) {
                setPasswordSuccess(true);
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
                passwordForm.reset();
            } else {
                setPasswordError(tr(result.error || "Failed to update password."));
            }
        } catch {
            setPasswordError("An unexpected error occurred.");
        } finally {
            setPasswordUpdating(false);
        }
    };

    type SessionsState = { sessions: SignedInSession[]; loading: boolean; currentSessionId: string | null };
    type SessionsAction =
        | { type: "start" }
        | { type: "success"; sessions: SignedInSession[]; currentSessionId: string | null }
        | { type: "error" };
    const [sessionsState, dispatchSessions] = useReducer(
        (state: SessionsState, action: SessionsAction): SessionsState => {
            switch (action.type) {
                case "start": return { ...state, loading: true };
                case "success": return { loading: false, sessions: action.sessions, currentSessionId: action.currentSessionId };
                case "error": return { ...state, loading: false };
                default: return state;
            }
        },
        { sessions: [], loading: false, currentSessionId: null },
    );

    const loadSessions = useCallback(async () => {
        dispatchSessions({ type: "start" });
        try {
            const { data, error } = await (supabase as any).from("user_sessions").select("*").order("updated_at", { ascending: false });
            if (error) throw error;
            const { data: { session } } = await supabase.auth.getSession();
            dispatchSessions({ type: "success", sessions: data || [], currentSessionId: session ? (session as any).id : null });
        } catch (err) {
            console.error("[Sessions] Failed to fetch sessions:", err);
            dispatchSessions({ type: "error" });
        }
    }, [supabase]);

    useEffect(() => {
        if (section === "security") loadSessions();
    }, [section, loadSessions]);

    const handleRevokeSession = async (sessionId: string) => {
        const loadingToast = toast.loading(t("Signing out that device…"));
        try {
            const res = await fetch("/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sessionId }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to revoke session");
            toast.success(t("That device is now signed out."), { id: loadingToast });
            dispatchSessions({
                type: "success",
                sessions: sessionsState.sessions.filter((s) => s.id !== sessionId),
                currentSessionId: sessionsState.currentSessionId,
            });
        } catch (error: any) {
            toast.error(tr(error.message || t("Failed to revoke session")), { id: loadingToast });
        }
    };

    const handleSignOutOthers = async () => {
        dispatchSessions({ type: "start" });
        const loadingToast = toast.loading(t("Signing out other devices..."));
        try {
            const { error } = await supabase.auth.signOut({ scope: "others" });
            if (error) throw error;
            await fetch("/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scope: "others" }),
            }).catch(() => null);
            toast.success(t("Signed out of all other devices successfully"), { id: loadingToast });
            await loadSessions();
        } catch (error: any) {
            toast.error(tr(error.message || t("Failed to sign out other devices")), { id: loadingToast });
            dispatchSessions({ type: "error" });
        }
    };

    const handleSignOutAll = async () => {
        const loadingToast = toast.loading(t("Signing out everywhere..."));
        try {
            await fetch("/api/auth/sessions", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scope: "global" }),
            }).catch(() => null);
            await signOut({ scope: "global" });
        } catch (error: any) {
            toast.error(tr(error.message || t("Failed to sign out globally")), { id: loadingToast });
        }
    };

    // --- Page renderers ---

    const renderProfile = () => {
        const displayName = formData.full_name || profile?.full_name || t("Resident");
        return (
            <>
                <SettingsCard id="settings-photo" title={t("Your photo")} description={t("This photo helps your landlord recognize you.")}>
                    <div className="flex flex-col items-center gap-5 sm:flex-row">
                        <div
                            className="relative flex size-28 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-foreground/15"
                            style={{ backgroundColor: profile?.avatar_bg_color || "#3B82F6" }}
                        >
                            {profile?.avatar_url ? (
                                <Image src={profile.avatar_url} alt={t("Your photo")} fill sizes="112px" className="object-cover" />
                            ) : (
                                <span className="text-5xl font-black text-white" aria-hidden>
                                    {displayName.charAt(0).toUpperCase()}
                                </span>
                            )}
                        </div>
                        <div className="space-y-3 text-center sm:text-left">
                            <p className="text-xl font-bold text-foreground">{displayName}</p>
                            <SettingsButton variant="secondary" icon={Camera} onClick={() => setIsAvatarPickerOpen(true)}>
                                {t("Change my photo")}
                            </SettingsButton>
                        </div>
                    </div>
                </SettingsCard>

                <SettingsCard id="settings-about-you" title={t("About you")} description={t("Press Save changes at the bottom of the screen when you are done.")}>
                    <div className="space-y-6">
                        <SettingsField label={t("Full name")} htmlFor="tenant-full-name" error={tErr(profileForm.errorFor("full_name"))} errorId={profileForm.errorId("full_name")}>
                            <input type="text" autoComplete="name" maxLength={TEXT_LIMITS.personName} {...bindProfileInput("full_name", "tenant-full-name")} />
                        </SettingsField>

                        <SettingsField label={t("Email address")} htmlFor="tenant-email" help={t("You use this email to sign in, so it cannot be changed here.")}>
                            <input id="tenant-email" type="email" value={formData.email} disabled aria-describedby="tenant-email-help" className={settingsInputClass(false)} />
                        </SettingsField>

                        <SettingsField
                            label={t("Phone number")}
                            htmlFor="tenant-phone"
                            help={t("A mobile number. Example: +63 917 123 4567")}
                            error={tErr(profileForm.errorFor("phone"))}
                            errorId={profileForm.errorId("phone")}
                        >
                            <PhoneNumberInput {...bindProfilePhone("phone", "tenant-phone", true)} />
                        </SettingsField>

                        <SettingsField label={t("Home address")} htmlFor="tenant-address" optional error={tErr(profileForm.errorFor("address"))} errorId={profileForm.errorId("address")}>
                            <input type="text" autoComplete="street-address" maxLength={TEXT_LIMITS.address} {...bindProfileInput("address", "tenant-address")} />
                        </SettingsField>

                        <SettingsField
                            label={t("A few words about you")}
                            htmlFor="tenant-bio"
                            optional
                            help={t("Your landlord can see this.")}
                            counter={{ current: formData.bio.length, max: BIO_MAX_LENGTH }}
                            error={tErr(profileForm.errorFor("bio"))}
                            errorId={profileForm.errorId("bio")}
                        >
                            <textarea rows={4} maxLength={BIO_MAX_LENGTH} {...bindProfileInput("bio", "tenant-bio", true)} className={settingsInputClass(Boolean(profileForm.errorFor("bio")), "resize-y")} />
                        </SettingsField>
                    </div>
                </SettingsCard>

                <SettingsCard id="settings-emergency" title={t("Emergency contact")} description={t("Someone we can call if something happens to you. For example, a family member.")}>
                    <div className="space-y-6">
                        <SettingsField label={t("Their name")} htmlFor="tenant-emergency-name" optional error={tErr(profileForm.errorFor("emergency_name"))} errorId={profileForm.errorId("emergency_name")}>
                            <input type="text" maxLength={TEXT_LIMITS.personName} {...bindProfileInput("emergency_name", "tenant-emergency-name")} />
                        </SettingsField>
                        <SettingsField
                            label={t("Their mobile number")}
                            htmlFor="tenant-emergency-phone"
                            optional
                            error={tErr(profileForm.errorFor("emergency_phone"))}
                            errorId={profileForm.errorId("emergency_phone")}
                        >
                            <PhoneNumberInput {...bindProfilePhone("emergency_phone", "tenant-emergency-phone")} autoComplete="off" />
                        </SettingsField>
                    </div>
                </SettingsCard>
            </>
        );
    };

    const renderSecurity = () => (
        <>
            <SettingsCard id="settings-password" title={t("Change your password")} description={t("Use at least 8 characters. A short sentence you can remember works well.")}>
                <form onSubmit={handlePasswordUpdate} className="space-y-6" noValidate>
                    {passwordSuccess && (
                        <SettingsNotice tone="success" title={t("Your password is changed.")} live>
                            {t("Use your new password the next time you sign in.")}
                        </SettingsNotice>
                    )}
                    {passwordError && (
                        <SettingsNotice tone="danger" title={t("Your password was not changed.")} live>
                            {t(passwordError)}
                        </SettingsNotice>
                    )}
                    <SettingsField
                        label={t("Your current password")}
                        htmlFor="tenant-current-password"
                        error={tErr(passwordForm.errorFor("currentPassword"))}
                        errorId={passwordForm.errorId("currentPassword")}
                    >
                        <SettingsPasswordInput
                            id="tenant-current-password"
                            autoComplete="current-password"
                            maxLength={CURRENT_PASSWORD_MAX_LENGTH}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            hasError={Boolean(passwordForm.errorFor("currentPassword"))}
                            {...passwordForm.fieldProps("currentPassword")}
                        />
                    </SettingsField>
                    <SettingsField
                        label={t("New password")}
                        htmlFor="tenant-new-password"
                        error={tErr(passwordForm.errorFor("newPassword"))}
                        errorId={passwordForm.errorId("newPassword")}
                    >
                        <SettingsPasswordInput
                            id="tenant-new-password"
                            autoComplete="new-password"
                            maxLength={PASSWORD_MAX_LENGTH}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            hasError={Boolean(passwordForm.errorFor("newPassword"))}
                            {...passwordForm.fieldProps("newPassword")}
                        />
                    </SettingsField>
                    <SettingsField
                        label={t("Type the new password again")}
                        htmlFor="tenant-confirm-password"
                        error={tErr(passwordForm.errorFor("confirmPassword"))}
                        errorId={passwordForm.errorId("confirmPassword")}
                    >
                        <SettingsPasswordInput
                            id="tenant-confirm-password"
                            autoComplete="new-password"
                            maxLength={PASSWORD_MAX_LENGTH}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            hasError={Boolean(passwordForm.errorFor("confirmPassword"))}
                            {...passwordForm.fieldProps("confirmPassword")}
                        />
                    </SettingsField>
                    <SettingsButton type="submit" size="lg" icon={KeyRound} loading={passwordUpdating} className="w-full sm:w-auto">
                        {passwordUpdating ? t("Changing your password…") : t("Change my password")}
                    </SettingsButton>
                </form>
            </SettingsCard>

            <SettingsCard
                id="settings-extra-protection"
                title={t("Extra protection (optional)")}
                description={t("These add a second check when you sign in, so no one else can get in even if they learn your password.")}
            >
                <div className="space-y-6">
                    <TwoFactorManagementCard apiEndpoint="/api/tenant/2fa" accountEmail={profile?.email || undefined} />
                    <SecurityKeyManagementCard accountEmail={profile?.email || undefined} />
                </div>
            </SettingsCard>

            <SignedInDevicesCard
                sessions={sessionsState.sessions}
                loading={sessionsState.loading}
                currentSessionId={sessionsState.currentSessionId}
                onSignOutDevice={handleRevokeSession}
                onSignOutOthers={handleSignOutOthers}
                onSignOutEverywhere={handleSignOutAll}
            />
        </>
    );

    const renderNotifications = () => (
        <SettingsCard title={t("What should we tell you about?")} description={t("Tap a button to turn it on or off. Then press Save changes at the bottom.")}>
            <NotificationTopicsList<NotificationTopicKey, NotificationChannelKey>
                topics={[
                    { key: "rent", icon: Receipt, label: t("Rent reminders"), description: t("Before rent is due, and when we receive your payment.") },
                    { key: "maintenance", icon: Wrench, label: t("Repair updates"), description: t("When your repair request moves forward.") },
                    { key: "lease", icon: FileText, label: t("Lease updates"), description: t("Renewals, end dates and papers to sign.") },
                    { key: "community", icon: Megaphone, label: t("News from your building"), description: t("Announcements from your landlord.") },
                    { key: "offers", icon: Tag, label: t("Special offers"), description: t("Deals and suggestions. You can leave this off.") },
                ]}
                channels={[
                    { key: "email", label: t("Email") },
                    { key: "push", label: t("Alert in the app") },
                ]}
                isOn={(topic, channel) => notificationPrefs[topic][channel]}
                onToggle={(topic, channel) =>
                    setNotificationPrefs((prev) => ({ ...prev, [topic]: { ...prev[topic], [channel]: !prev[topic][channel] } }))
                }
            />
            <div className="mt-6 border-t-2 border-border pt-6">
                <SettingsButton variant="ghost" onClick={() => setNotificationPrefs(DEFAULT_NOTIFICATION_PREFS)}>
                    {t("Go back to the recommended choices")}
                </SettingsButton>
            </div>
        </SettingsCard>
    );

    const renderPayments = () => (
        <SettingsCard title={t("Your bills and payments")} description={t("Bills, receipts and your payment history are kept on the Payments page.")}>
            <div className="space-y-4">
                <SettingsLinkRow
                    title={t("See my bills and pay rent")}
                    description={t("View what you owe, pay, and download receipts.")}
                    action={
                        <Link href="/tenant/payments" className={settingsButtonClass("primary", "md")}>
                            <Wallet className="size-5" aria-hidden />
                            <span>{t("Go to Payments")}</span>
                        </Link>
                    }
                />
                <SettingsLinkRow
                    title={t("Water and electricity")}
                    description={t("See your utility readings and charges.")}
                    action={
                        <Link href="/tenant/utilities" className={settingsButtonClass("secondary", "md")}>
                            <span>{t("Go to Utilities")}</span>
                        </Link>
                    }
                />
            </div>
        </SettingsCard>
    );

    const renderPrivacy = () => {
        const subject = encodeURIComponent("Request for a copy of my data");
        const body = encodeURIComponent(`Hello iReside team,\n\nPlease send me a copy of my personal data${profile?.email ? ` (${profile.email})` : ""}.\n\nThank you.`);
        return (
            <>
                <SettingsCard id="settings-data-copy" title={t("Get a copy of your information")} description={t("You can ask for a copy of your profile, lease, payment records and messages.")}>
                    <div className="space-y-5">
                        <p className="text-lg text-foreground leading-relaxed">
                            {t("Send us an email and we will reply with your information. This can take a few days.")}
                        </p>
                        <a href={`mailto:${PRIVACY_CONTACT_EMAIL}?subject=${subject}&body=${body}`} className={settingsButtonClass("secondary", "md")}>
                            <Download className="size-5" aria-hidden />
                            <span>{t("Email a request for my data")}</span>
                        </a>
                        <p className="flex items-center gap-2 text-base text-muted-foreground">
                            <Mail className="size-5 shrink-0" aria-hidden />
                            <span>{PRIVACY_CONTACT_EMAIL}</span>
                        </p>
                    </div>
                </SettingsCard>
                <CloseAccountCard accountEmail={profile?.email} extraNote={t("If you still have an active lease, please talk to your landlord first.")} />
            </>
        );
    };

    const renderSection = (id: SectionId) => {
        switch (id) {
            case "profile": return renderProfile();
            case "security": return renderSecurity();
            case "display": return <DisplaySettingsSection />;
            case "notifications": return renderNotifications();
            case "payments": return renderPayments();
            case "privacy": return renderPrivacy();
        }
    };

    if (loading || !ready) return <PageLoader message={t("Loading your settings...")} />;

    const helpFooter = (
        <SettingsNotice
            tone="info"
            title={t("Need help?")}
            action={
                <Link href="/tenant/docs" className={settingsButtonClass("secondary", "md")}>
                    <HelpCircle className="size-5" aria-hidden />
                    <span>{t("Open the help guide")}</span>
                </Link>
            }
        >
            {t("The help guide explains each part of iReside with simple steps.")}
        </SettingsNotice>
    );

    return (
        <div className="pb-40">
            {section === null ? (
                <SettingsHub
                    title={t("Settings")}
                    intro={t("Choose what you want to change. You can come back to this page at any time.")}
                    groups={groups}
                    sections={sections}
                    quickTasks={quickTasks}
                    onOpen={(id, opts) => open(id, opts)}
                    topSlot={
                        embedded ? undefined : (
                            <button type="button" onClick={goToDashboard} className={settingsButtonClass("secondary", "md")}>
                                <ArrowLeft className="size-5" aria-hidden />
                                <span>{t("Back to Dashboard")}</span>
                            </button>
                        )
                    }
                    footer={helpFooter}
                />
            ) : (
                <SettingsSectionLayout groups={groups} sections={sections} activeId={section} onOpen={(id) => open(id)} onHome={() => open(null)}>
                    {renderSection(section)}
                </SettingsSectionLayout>
            )}

            <SettingsSaveBar
                visible={isDirty}
                saving={isSavingProfile || isSavingNotifications}
                justSaved={justSaved}
                onSave={saveAll}
                onDiscard={discardAll}
                raised={embedded}
            />

            <SettingsLeaveDialog
                open={pendingNavigation !== null}
                saving={isSavingProfile || isSavingNotifications}
                onStay={() => setPendingNavigation(null)}
                onDiscard={() => {
                    const nav = pendingNavigation;
                    discardAll();
                    if (nav) continuePendingNavigation(nav);
                }}
                onSave={async () => {
                    const nav = pendingNavigation;
                    const ok = await saveAll();
                    if (ok && nav) continuePendingNavigation(nav);
                    else if (!ok) setPendingNavigation(null);
                }}
            />

            <AvatarPicker
                isOpen={isAvatarPickerOpen}
                onClose={() => setIsAvatarPickerOpen(false)}
                currentAvatarUrl={profile?.avatar_url || null}
                currentBgColor={profile?.avatar_bg_color || null}
                onProfileUpdate={() => {
                    refreshProfile();
                    router.refresh();
                }}
            />
        </div>
    );
}
