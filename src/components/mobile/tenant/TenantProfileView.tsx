'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/supabase/client-auth';
import Image from 'next/image';
import Link from 'next/link';
import { 
    User,
    BookOpen,
    ChevronRight, 
    ShieldCheck, 
    LogOut, 
    Building2, 
    Calendar, 
    Phone, 
    Mail, 
    FileText, 
    MessageSquare, 
    PhoneCall, 
    ShieldAlert, 
    HeartPulse,
    Globe,
    Settings
} from 'lucide-react';
import { useLanguageContext } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobileConfirmModal } from '@/components/mobile/shared/MobileConfirmModal';
import { formatLeaseDate, formatTenure, leaseEndState, tenureSinceLabel } from '@/lib/lease-term';
import { ART, artOr } from "@/lib/art/abstract-art";

const FALLBACK_AVATAR = ART.avatar;

interface LeaseDetails {
    id: string;
    status: string;
    startDate: string;
    endDate: string | null;
    termType?: string | null;
    monthlyRent: number;
    securityDeposit: number;
    unitName: string | null;
    propertyName: string | null;
    propertyAddress: string | null;
    propertyCity: string | null;
    landlordName: string | null;
    landlordEmail: string | null;
    landlordPhone: string | null;
}

/** Header shortcut to the tenant settings screen (client-side so its label follows the active language). */
export function TenantProfileSettingsLink() {
    const { t } = useLanguageContext();
    return (
        <Link
            href="/mobile/tenant/settings"
            className="flex items-center justify-center w-9 h-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label={t('Settings')}
        >
            <Settings size={20} strokeWidth={1.8} />
        </Link>
    );
}

export function TenantProfileView() {
    const { profile, user, refreshProfile } = useAuth();
    const router = useRouter();
    const { t, language } = useLanguageContext();

    const [lease, setLease] = useState<LeaseDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfileData = async () => {
        try {
            await refreshProfile();
            const res = await fetch('/api/tenant/dashboard');
            if (res.ok) {
                const data = await res.json();
                if (data.lease) {
                    setLease(data.lease);
                }
            }
        } catch (err) {
            console.error('Failed to load tenant profile lease data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData();
    }, []);

    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [loggingOut, setLoggingOut] = useState(false);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            await signOut();
            router.replace('/login');
        } catch (err) {
            console.error('Logout error:', err);
            setLoggingOut(false);
            setShowLogoutConfirm(false);
        }
    };

    const fullName = 
        profile?.full_name || 
        user?.user_metadata?.full_name || 
        user?.user_metadata?.name || 
        t('Resident');
    const avatarUrl = artOr(profile?.avatar_url, FALLBACK_AVATAR);
    const formatCurrency = (amt: number) => `₱${amt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

    // Open-ended leases (the default) have no end date: show tenure rather than a date range.
    const leaseEnd = leaseEndState(lease ? { start_date: lease.startDate, end_date: lease.endDate, term_type: lease.termType } : null);
    const monthYear = { month: 'short', year: 'numeric' } as const;
    const leaseDurationLabel = !lease
        ? ''
        : leaseEnd.kind === 'open_ended'
            ? `${tenureSinceLabel(lease.startDate, language)} · ${formatTenure(lease.startDate, undefined, language)}`
            : leaseEnd.kind === 'moving_out'
                ? t('Moving out {date}', { date: formatLeaseDate(leaseEnd.endDate, undefined, language) })
                : `${formatLeaseDate(lease.startDate, monthYear, language)} — ${formatLeaseDate(leaseEnd.endDate, monthYear, language)}`;

    return (
        <PullToRefresh onRefresh={fetchProfileData}>
            <div className="flex flex-col gap-3 pb-8">
                {/* Resident Profile Identity Card */}
                <div className="px-4 pt-2.5">
                    <div className="p-4 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex items-center gap-3.5">
                        <div className="relative size-14 rounded-full overflow-hidden border-2 border-primary/30 bg-muted shrink-0 shadow-xs">
                            <Image src={avatarUrl} alt={fullName} fill sizes="56px" className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-sm font-black text-foreground truncate">{fullName}</h3>
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                    {t('Resident')}
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">{profile?.email || user?.email || 'tenant@ireside.ph'}</p>
                            {lease?.unitName && (
                                <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-primary">
                                    <Building2 className="size-3 shrink-0" />
                                    <span className="truncate">{lease.propertyName || t('Property')} • {t('Unit {unit}', { unit: lease.unitName })}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>



                {/* Lease Agreement Summary Card */}
                <div id="lease" className="mx-4 p-4 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col gap-3 scroll-mt-16">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                            <FileText className="size-3.5" />
                            <span>{t('Active Lease Details')}</span>
                        </div>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                            lease?.status === 'active' 
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        )}>
                            {lease?.status ? t(lease.status.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')) : t('Active')}
                        </span>
                    </div>

                    {loading ? (
                        <div className="py-4 flex items-center justify-center">
                            <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : lease ? (
                        <>
                            <div>
                                <h4 className="text-sm font-bold text-foreground">{lease.propertyName || t('Residential Complex')}</h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                    {lease.propertyAddress || t('Address on file')}{lease.propertyCity ? `, ${lease.propertyCity}` : ''}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-white/10">
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">{t('Monthly Rent')}</span>
                                    <span className="text-xs font-black text-foreground mt-0.5 block">
                                        {formatCurrency(lease.monthlyRent)}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">{t('Security Deposit')}</span>
                                    <span className="text-xs font-black text-foreground mt-0.5 block">
                                        {formatCurrency(lease.securityDeposit)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-slate-200 dark:border-white/10">
                                <div className="flex items-center gap-1">
                                    <Calendar className="size-3 text-primary" />
                                    <span>{leaseEnd.kind === 'open_ended' ? t('Tenure:') : t('Duration:')}</span>
                                </div>
                                <span className="font-semibold text-foreground text-right">
                                    {leaseDurationLabel}
                                </span>
                            </div>
                        </>
                    ) : (
                        <p className="text-xs text-muted-foreground py-2">{t('No active lease agreement found linked to this account.')}</p>
                    )}
                </div>

                {/* Emergency Contact on File (if any) */}
                {((profile as any)?.emergency_contact_name || (profile as any)?.emergency_contact_phone || (profile as any)?.emergency_name || (profile as any)?.emergency_phone) && (
                    <div className="mx-4 p-4 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col gap-2.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                                <HeartPulse className="size-3.5" />
                                <span>{t('Emergency Contact')}</span>
                            </div>
                            <Link href="/mobile/tenant/settings?category=Identity&subtab=Emergency+Contact" className="text-[10px] font-bold text-primary hover:underline">
                                {t('Edit')}
                            </Link>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                            <div>
                                <p className="font-bold text-foreground">
                                    {(profile as any)?.emergency_contact_name || (profile as any)?.emergency_name || t('Designated Contact')}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {(profile as any)?.emergency_contact_phone || (profile as any)?.emergency_phone || t('No phone')}
                                </p>
                            </div>
                            {((profile as any)?.emergency_contact_phone || (profile as any)?.emergency_phone) && (
                                <a
                                    href={`tel:${(profile as any)?.emergency_contact_phone || (profile as any)?.emergency_phone}`}
                                    className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 active:scale-95 transition-transform"
                                    title={t('Call Emergency Contact')}
                                >
                                    <Phone className="size-3.5" />
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Landlord Contact & Support Card */}
                <div className="mx-4 p-4 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                            <ShieldCheck className="size-3.5" />
                            <span>{t('Property Manager / Landlord')}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-foreground">{lease?.landlordName || t('Property Admin')}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{lease?.landlordEmail || 'support@ireside.ph'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {lease?.landlordPhone && (
                                <a
                                    href={`tel:${lease.landlordPhone}`}
                                    className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 active:scale-95 transition-transform"
                                    title={t('Call Landlord')}
                                >
                                    <PhoneCall className="size-3.5" />
                                </a>
                            )}
                            {lease?.landlordEmail && (
                                <a
                                    href={`mailto:${lease.landlordEmail}`}
                                    className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 active:scale-95 transition-transform"
                                    title={t('Email Landlord')}
                                >
                                    <Mail className="size-3.5" />
                                </a>
                            )}
                            <Link
                                href="/mobile/tenant/messages"
                                className="px-2.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform"
                            >
                                <MessageSquare className="size-3" />
                                <span>{t('Chat')}</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Emergency Hotlines Card */}
                <div className="mx-4 p-4 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col gap-2.5">
                    <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase tracking-wider">
                        <ShieldAlert className="size-3.5" />
                        <span>{t('Emergency Contacts & Hotlines')}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <a
                            href="tel:911"
                            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-between active:scale-98 transition-all"
                        >
                            <span className="font-bold text-[11px]">{t('National 911')}</span>
                            <Phone className="size-3" />
                        </a>
                        <a
                            href="tel:117"
                            className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-between active:scale-98 transition-all"
                        >
                            <span className="font-bold text-[11px]">{t('PNP Police 117')}</span>
                            <Phone className="size-3" />
                        </a>
                    </div>
                </div>

                {/* House Rules & Emergency Handbook Link Card */}
<div className="px-4">
    <Link
        href="/mobile/tenant/manual"
        className="p-3.5 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex items-center justify-between active:scale-[0.98] transition-all hover:border-primary/40 group"
    >
        <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <BookOpen className="size-4" />
            </div>
            <div>
                <h4 className="text-xs font-bold text-foreground">
                    {t('House Rules & Safety Manual')}
                </h4>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                    {t('Quiet hours, garbage schedules & emergency hotlines')}
                </p>
            </div>
        </div>
        <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
    </Link>
</div>

                {/* Language Switch */}
                <div className="mx-4 p-4 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col gap-3">
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                        <Globe className="size-3.5" />
                        <span>{t('Language')}</span>
                    </div>
                    <LanguageToggle variant="segmented" />
                </div>

                {/* Sign Out Action */}
                <div className="px-4 pt-1">
                    <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(true)}
                        className="w-full p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 text-red-500 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
                    >
                        <LogOut className="size-4" />
                        <span className="text-xs font-bold">{t('Sign Out')}</span>
                    </button>
                </div>
            </div>

            {/* Sign Out Confirmation Modal */}
            <MobileConfirmModal
                isOpen={showLogoutConfirm}
                title={t('Sign Out of iReside?')}
                description={t('Are you sure you want to sign out? You will need to log back in to view your lease, pay rent, or request maintenance.')}
                confirmLabel={t('Sign Out')}
                cancelLabel={t('Cancel')}
                variant="danger"
                isLoading={loggingOut}
                icon={<LogOut className="size-5" />}
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutConfirm(false)}
            />
        </PullToRefresh>
    );
}
