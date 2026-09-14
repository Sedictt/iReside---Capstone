'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/supabase/client-auth';
import Image from 'next/image';
import Link from 'next/link';
import { 
    User, 
    ShieldCheck, 
    LogOut, 
    Moon, 
    Sun, 
    Building2, 
    Calendar,
    Phone,
    Mail,
    FileText,
    CheckCircle2,
    Clock,
    AlertCircle,
    MessageSquare,
    PhoneCall,
    ShieldAlert,
    ExternalLink
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';

const FALLBACK_AVATAR = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80";

interface LeaseDetails {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
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

export function TenantProfileView() {
    const { profile } = useAuth();
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    const [lease, setLease] = useState<LeaseDetails | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfileData = async () => {
        try {
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

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/login');
        } catch (err) {
            console.error('Logout error:', err);
        }
    };

    const fullName = `${profile?.first_name || 'Resident'} ${profile?.last_name || ''}`.trim();
    const avatarUrl = profile?.avatar_url || FALLBACK_AVATAR;
    const formatCurrency = (amt: number) => `₱${amt.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

    return (
        <PullToRefresh onRefresh={fetchProfileData}>
            <div className="flex flex-col gap-3 pb-3">
                {/* Resident Profile Identity Card */}
                <div className="mx-4 p-4 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex items-center gap-3.5">
                    <div className="relative size-14 rounded-full overflow-hidden border-2 border-primary/30 bg-muted shrink-0 shadow-xs">
                        <Image src={avatarUrl} alt={fullName} fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <h3 className="text-sm font-black text-foreground truncate">{fullName}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                Resident
                            </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{profile?.email || 'tenant@ireside.ph'}</p>
                        {lease?.unitName && (
                            <div className="flex items-center gap-1 mt-1 text-[11px] font-semibold text-primary">
                                <Building2 className="size-3 shrink-0" />
                                <span className="truncate">{lease.propertyName || 'Property'} • Unit {lease.unitName}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Action Preferences: Theme & Sign Out */}
                <div className="mx-4 grid grid-cols-2 gap-2.5">
                    <button
                        type="button"
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="p-3 rounded-xl bg-white dark:bg-card/70 border border-slate-300 dark:border-white/15 flex items-center justify-between active:scale-[0.98] transition-all shadow-2xs cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            {theme === 'dark' ? <Moon className="size-3.5 text-primary" /> : <Sun className="size-3.5 text-amber-500" />}
                            <span className="text-xs font-bold text-foreground">Appearance</span>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground capitalize">{theme || 'dark'}</span>
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-between text-red-500 dark:text-red-400 active:scale-[0.98] transition-all shadow-2xs cursor-pointer"
                    >
                        <div className="flex items-center gap-2">
                            <LogOut className="size-3.5" />
                            <span className="text-xs font-bold">Sign Out</span>
                        </div>
                    </button>
                </div>

                {/* Lease Agreement Summary Card */}
                <div className="mx-4 p-4 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                            <FileText className="size-3.5" />
                            <span>Active Lease Details</span>
                        </div>
                        <span className={cn(
                            "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                            lease?.status === 'active' 
                                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        )}>
                            {lease?.status || 'Active'}
                        </span>
                    </div>

                    {loading ? (
                        <div className="py-4 flex items-center justify-center">
                            <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : lease ? (
                        <>
                            <div>
                                <h4 className="text-sm font-bold text-foreground">{lease.propertyName || 'Residential Complex'}</h4>
                                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                    {lease.propertyAddress || 'Address on file'}{lease.propertyCity ? `, ${lease.propertyCity}` : ''}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-white/10">
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Monthly Rent</span>
                                    <span className="text-xs font-black text-foreground mt-0.5 block">
                                        {formatCurrency(lease.monthlyRent)}
                                    </span>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5">
                                    <span className="text-[10px] font-bold text-muted-foreground uppercase block">Security Deposit</span>
                                    <span className="text-xs font-black text-foreground mt-0.5 block">
                                        {formatCurrency(lease.securityDeposit)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-slate-200 dark:border-white/10">
                                <div className="flex items-center gap-1">
                                    <Calendar className="size-3 text-primary" />
                                    <span>Duration:</span>
                                </div>
                                <span className="font-semibold text-foreground">
                                    {new Date(lease.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                    {' — '}
                                    {new Date(lease.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                </span>
                            </div>
                        </>
                    ) : (
                        <p className="text-xs text-muted-foreground py-2">No active lease agreement found linked to this account.</p>
                    )}
                </div>

                {/* Landlord Contact & Support Card */}
                <div className="mx-4 p-4 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                            <ShieldCheck className="size-3.5" />
                            <span>Property Manager / Landlord</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-foreground">{lease?.landlordName || 'Property Admin'}</p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">{lease?.landlordEmail || 'support@ireside.ph'}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                            {lease?.landlordPhone && (
                                <a
                                    href={`tel:${lease.landlordPhone}`}
                                    className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 active:scale-95 transition-transform"
                                    title="Call Landlord"
                                >
                                    <PhoneCall className="size-3.5" />
                                </a>
                            )}
                            {lease?.landlordEmail && (
                                <a
                                    href={`mailto:${lease.landlordEmail}`}
                                    className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 active:scale-95 transition-transform"
                                    title="Email Landlord"
                                >
                                    <Mail className="size-3.5" />
                                </a>
                            )}
                            <Link
                                href="/mobile/tenant/messages"
                                className="px-2.5 py-1.5 rounded-xl bg-primary text-primary-foreground text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-transform"
                            >
                                <MessageSquare className="size-3" />
                                <span>Chat</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Emergency Hotlines Card */}
                <div className="mx-4 p-4 rounded-2xl bg-white dark:bg-card/80 border border-slate-300 dark:border-white/15 shadow-xs flex flex-col gap-2.5">
                    <div className="flex items-center gap-1.5 text-red-500 text-[10px] font-black uppercase tracking-wider">
                        <ShieldAlert className="size-3.5" />
                        <span>Emergency Contacts &amp; Hotlines</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <a
                            href="tel:911"
                            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-between active:scale-98 transition-all"
                        >
                            <span className="font-bold text-[11px]">National 911</span>
                            <Phone className="size-3" />
                        </a>
                        <a
                            href="tel:117"
                            className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-between active:scale-98 transition-all"
                        >
                            <span className="font-bold text-[11px]">PNP Police 117</span>
                            <Phone className="size-3" />
                        </a>
                    </div>
                </div>
            </div>
        </PullToRefresh>
    );
}
