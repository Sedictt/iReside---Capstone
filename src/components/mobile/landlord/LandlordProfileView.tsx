'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useProperty } from '@/context/PropertyContext';
import { useBrand } from '@/context/BrandContext';
import { useRouter } from 'next/navigation';
import { signOut } from '@/lib/supabase/client-auth';
import Image from 'next/image';
import { 
    User, 
    ShieldCheck, 
    LogOut, 
    Building2, 
    Phone, 
    Mail, 
    MapPin, 
    Shield, 
    Briefcase,
    Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguageContext } from '@/context/LanguageContext';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobileConfirmModal } from '@/components/mobile/shared/MobileConfirmModal';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { formatPhMobile } from "@/lib/phone";
import { ART, artOr } from "@/lib/art/abstract-art";

const FALLBACK_AVATAR = ART.avatar;

export function LandlordProfileView() {
    const { profile, user, refreshProfile } = useAuth();
    const { properties } = useProperty();
    const brand = useBrand();
    const router = useRouter();
    const { t } = useLanguageContext();

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
        t('Landlord');
    const avatarUrl = artOr(profile?.avatar_url, FALLBACK_AVATAR);

    const totalUnits = properties.reduce((acc, p) => acc + (p.units?.length || 0), 0);
    const occupiedUnits = properties.reduce((acc, p) => {
        const occ = p.units?.filter(u => u.status === 'occupied').length || 0;
        return acc + occ;
    }, 0);

    const isVerified = (profile as any)?.verification_status === 'verified' || !!(profile as any)?.business_permit_url;

    return (
        <PullToRefresh onRefresh={async () => { await refreshProfile(); }}>
            <div className="flex flex-col gap-3.5 pb-8 px-4 pt-2">
                {/* Hero Profile Card */}
                <div className="rounded-[1.75rem] neumorphic-extruded overflow-hidden p-5 flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="relative size-16 rounded-2xl overflow-hidden shrink-0 neumorphic-inset-card p-0.5">
                            <div className="relative w-full h-full rounded-[0.85rem] overflow-hidden">
                                <Image src={avatarUrl} alt={fullName} fill sizes="64px" className="object-cover" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                                <h2 className="text-base font-black text-foreground truncate">{fullName}</h2>
                                {isVerified && (
                                    <span title={t("Verified Landlord")}>
                                        <ShieldCheck className="size-4 text-emerald-500 shrink-0" />
                                    </span>
                                )}
                            </div>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-primary/15 text-primary">
                                {t("Property Manager / Landlord")}
                            </span>
                            <p className="text-xs text-muted-foreground truncate mt-1">
                                {brand?.propertyName || 'iReside Properties'}
                            </p>
                        </div>
                    </div>

                    {profile?.bio && (
                        <p className="text-xs text-muted-foreground leading-relaxed pt-2 border-t border-border/40 italic">
                            &ldquo;{profile.bio}&rdquo;
                        </p>
                    )}
                </div>



                {/* Contact & Business Info Card */}
                <div className="p-4 rounded-2xl neumorphic-extruded space-y-3">
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                        <Briefcase className="size-3.5" />
                        <span>{t("Business & Contact Details")}</span>
                    </div>

                    <div className="space-y-2.5 text-xs">
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                            <Mail className="size-3.5 text-primary shrink-0" />
                            <span className="text-foreground truncate">{profile?.email || user?.email || 'admin@ireside.ph'}</span>
                        </div>
                        {profile?.phone && (
                            <div className="flex items-center gap-2.5 text-muted-foreground">
                                <Phone className="size-3.5 text-primary shrink-0" />
                                <span className="text-foreground">{formatPhMobile(profile.phone)}</span>
                            </div>
                        )}
                        {profile?.address && (
                            <div className="flex items-center gap-2.5 text-muted-foreground">
                                <MapPin className="size-3.5 text-primary shrink-0" />
                                <span className="text-foreground truncate">{profile.address}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2.5 text-muted-foreground">
                            <Shield className="size-3.5 text-primary shrink-0" />
                            <span className="text-foreground">
                                {t("Verification Status:")}{" "}
                                <span className={cn("font-bold", isVerified ? "text-emerald-500" : "text-amber-500")}>
                                    {isVerified ? t("Verified Account") : t("Verification Pending")}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Property Portfolio Summary Card */}
                <div className="p-4 rounded-2xl neumorphic-extruded space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                            <Building2 className="size-3.5" />
                            <span>{t("Portfolio Overview")}</span>
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">
                            {properties.length === 1 ? t('{count} Property', { count: properties.length }) : t('{count} Properties', { count: properties.length })}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div className="p-3 rounded-xl neumorphic-inset text-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">{t("Properties")}</span>
                            <span className="text-sm font-black text-foreground mt-0.5 block">{properties.length}</span>
                        </div>
                        <div className="p-3 rounded-xl neumorphic-inset text-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">{t("Total Units")}</span>
                            <span className="text-sm font-black text-foreground mt-0.5 block">{totalUnits}</span>
                        </div>
                        <div className="p-3 rounded-xl neumorphic-inset text-center">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase block">{t("Occupied")}</span>
                            <span className="text-sm font-black text-emerald-500 mt-0.5 block">{occupiedUnits}</span>
                        </div>
                    </div>

                    {properties.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                            {properties.slice(0, 3).map((prop, index) => (
                                <div key={`${prop.id || 'property'}-${index}`} className="flex items-center justify-between p-2 rounded-xl neumorphic-inset text-xs">
                                    <div className="truncate mr-2">
                                        <span className="font-bold text-foreground block truncate">{prop.name}</span>
                                        <span className="text-[10px] text-muted-foreground truncate block">{prop.address || t('Address on file')}</span>
                                    </div>
                                    <span className="text-[10px] font-black text-primary shrink-0">
                                        {t('{count} units', { count: prop.units?.length || 0 })}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Language */}
                <div className="p-4 rounded-2xl neumorphic-extruded space-y-3">
                    <div className="flex items-center gap-1.5 text-primary text-[10px] font-black uppercase tracking-wider">
                        <Globe className="size-3.5" />
                        <span>{t("Language")}</span>
                    </div>
                    <LanguageToggle variant="segmented" />
                </div>

                {/* Sign Out Action */}
                <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-2 text-red-500 active:scale-[0.98] transition-all cursor-pointer shadow-2xs"
                >
                    <LogOut className="size-4" />
                    <span className="text-xs font-bold">{t("Sign Out")}</span>
                </button>
            </div>

            {/* Logout Confirm Modal */}
            <MobileConfirmModal
                isOpen={showLogoutConfirm}
                title={t("Sign Out of iReside?")}
                description={t("Are you sure you want to sign out of your landlord account?")}
                confirmLabel={t("Sign Out")}
                cancelLabel={t("Cancel")}
                variant="danger"
                isLoading={loggingOut}
                icon={<LogOut className="size-5" />}
                onConfirm={handleLogout}
                onCancel={() => setShowLogoutConfirm(false)}
            />
        </PullToRefresh>
    );
}
