'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    CreditCard,
    Wrench,
    MessageSquare,
    Sparkles,
    Calendar,
    FileText,
    BookOpen,
    Zap,
    Megaphone,
    User,
    Settings,
    LogOut,
    ChevronRight,
    Download,
    HelpCircle,
    Home,
    Map,
} from 'lucide-react';
import { BrandLogo } from '@/components/ui/BrandLogo';
import { ThemeToggle } from '@/components/theme-toggle';
import { LogoutConfirmationModal } from '@/components/ui/LogoutConfirmationModal';
import { useNotifications } from '@/context/NotificationContext';
import { useAuth } from '@/context/AuthContext';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { useLanguageContext } from '@/context/LanguageContext';
import { signOut } from '@/lib/supabase/client-auth';
import { MobileAmenityBookingDrawer } from './MobileAmenityBookingDrawer';

interface TenantMenuItem {
    label: string;
    href?: string;
    onClick?: () => void;
    icon: React.ComponentType<{ className?: string }>;
    description?: string;
    badge?: number;
    urgent?: boolean;
}

interface TenantMenuSection {
    category: string;
    items: TenantMenuItem[];
}

export function TenantMenuView() {
    const router = useRouter();
    const { t } = useLanguageContext();
    const { counts, importantNotifications } = useNotifications();
    const { profile } = useAuth();
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isAmenityDrawerOpen, setIsAmenityDrawerOpen] = useState(false);

    const isUrgent = (type: string) => importantNotifications.some((n) => n.type === type);

    const SECTIONS: TenantMenuSection[] = [
        {
            category: t('Home & Living'),
            items: [
                {
                    label: t('Dashboard'),
                    href: '/mobile/tenant/home',
                    icon: LayoutDashboard,
                    description: t('Rent status, upcoming payments & property notice feed'),
                },
                {
                    label: t('Unit Map'),
                    href: '/mobile/tenant/unit-map',
                    icon: Map,
                    description: t('Explore building floors & view your unit location'),
                },
                {
                    label: t('Payments & Bills'),
                    href: '/mobile/tenant/pay',
                    icon: CreditCard,
                    urgent: isUrgent('payment'),
                    description: t('Pay rent, upload GCash/bank proof & view receipts'),
                },
                {
                    label: t('Water & Electricity'),
                    href: '/mobile/utilities',
                    icon: Zap,
                    description: t('Submeter consumption, rate breakdown & utility dues'),
                },
                {
                    label: t('Maintenance Requests'),
                    href: '/mobile/tenant/maintenance',
                    icon: Wrench,
                    badge: counts.maintenance || undefined,
                    urgent: isUrgent('maintenance'),
                    description: t('Submit repair requests, upload photos & track technician visits'),
                },
                {
                    label: t('Property Amenities'),
                    icon: Sparkles,
                    onClick: () => setIsAmenityDrawerOpen(true),
                    description: t('Reserve clubhouse, study lounge, gym & facilities'),
                },
            ],
        },
        {
            category: t('Stay & Tenancy'),
            items: [
                {
                    label: t('Lease Agreement'),
                    href: '/mobile/tenant/lease',
                    icon: FileText,
                    urgent: isUrgent('lease') || isUrgent('lease_renewal_request'),
                    description: t('Active lease agreement, term dates & security deposits'),
                },
                {
                    label: t('Schedule & Calendar'),
                    href: '/mobile/tenant/calendar',
                    icon: Calendar,
                    description: t('Payment milestones, inspections & community event dates'),
                },
                {
                    label: t('Messages & Support'),
                    href: '/mobile/tenant/messages',
                    icon: MessageSquare,
                    badge: counts.messages || undefined,
                    description: t('Direct conversation with your landlord & management'),
                },
                {
                    label: t('Community Hub'),
                    href: '/mobile/community',
                    icon: Megaphone,
                    description: t('Building announcements, community posts & resident discussions'),
                },
            ],
        },
        {
            category: t('Account & Safety'),
            items: [
                {
                    label: t('Profile'),
                    href: '/mobile/tenant/profile',
                    icon: User,
                    description: t('Your resident profile, contact info & emergency contacts'),
                },
                {
                    label: t('House Rules & Guide'),
                    href: '/mobile/tenant/manual',
                    icon: BookOpen,
                    description: t('Quiet hours, garbage disposal, safety protocols & speed dial'),
                },
                {
                    label: t('Settings'),
                    href: '/mobile/tenant/settings',
                    icon: Settings,
                    description: t('Account security, password changes & notifications'),
                },
                {
                    label: t('Download Apps'),
                    href: '/download',
                    icon: Download,
                    description: t('Native Windows client and Android APK package'),
                },
            ],
        },
    ];

    const handleConfirmLogout = async () => {
        setIsLoggingOut(true);
        triggerHaptic('heavy');
        try {
            await signOut();
            router.push('/login');
        } catch {
            setIsLoggingOut(false);
            setIsLogoutOpen(false);
        }
    };

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24 mobile-scroll">
            {/* 1. Brand Header Card */}
            <div className="rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-xs border border-border/80 bg-card">
                <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    <BrandLogo size="md" className="min-w-0" />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="p-1 rounded-2xl flex items-center bg-muted/50 border border-border/50">
                        <ThemeToggle variant="sidebar" className="size-8" />
                    </div>
                </div>
            </div>

            {/* 2. Resident Profile Card */}
            <Link
                href="/mobile/tenant/profile"
                onClick={() => triggerHaptic('light')}
                className="rounded-3xl p-4 flex items-center justify-between gap-3 shadow-xs border border-border/80 bg-card active:scale-[0.99] transition-all cursor-pointer"
            >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0 font-bold text-sm">
                        {profile?.full_name?.charAt(0).toUpperCase() || 'R'}
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-foreground truncate">
                            {profile?.full_name || t('Resident')}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                            {profile?.email || t('Tap to view profile')}
                        </p>
                    </div>
                </div>
                <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </Link>

            {/* 3. Grouped Navigation Hub */}
            <div className="space-y-4">
                {SECTIONS.map((section) => (
                    <div key={section.category} className="space-y-1.5">
                        <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider px-2">
                            {section.category}
                        </h4>

                        <div className="rounded-3xl border border-border/80 bg-card overflow-hidden shadow-xs divide-y divide-border/60">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const content = (
                                    <>
                                        <div className="flex size-9 items-center justify-center rounded-xl bg-muted/60 text-foreground shrink-0">
                                            <Icon className="size-4" />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-foreground">
                                                    {item.label}
                                                </span>

                                                {item.urgent && (
                                                    <span className="size-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
                                                )}

                                                {item.badge !== undefined && item.badge > 0 && (
                                                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary/15 text-primary">
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </div>

                                            {item.description && (
                                                <p className="text-xs text-muted-foreground line-clamp-1 leading-snug">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>

                                        <ChevronRight className="size-4 text-muted-foreground shrink-0" />
                                    </>
                                );

                                if (item.href) {
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            onClick={() => triggerHaptic('light')}
                                            className="w-full p-3.5 flex items-center gap-3 text-left active:bg-muted/50 transition-colors cursor-pointer"
                                        >
                                            {content}
                                        </Link>
                                    );
                                }

                                return (
                                    <button
                                        key={item.label}
                                        type="button"
                                        onClick={() => {
                                            triggerHaptic('light');
                                            item.onClick?.();
                                        }}
                                        className="w-full p-3.5 flex items-center gap-3 text-left active:bg-muted/50 transition-colors cursor-pointer"
                                    >
                                        {content}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* 4. Log Out Button */}
            <div className="pt-2">
                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic('light');
                        setIsLogoutOpen(true);
                    }}
                    className="w-full p-3.5 rounded-2xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-destructive font-bold text-sm flex items-center justify-center gap-2 transition-colors active:scale-[0.99] cursor-pointer"
                >
                    <LogOut className="size-4" />
                    <span>{t('Log Out')}</span>
                </button>
            </div>

            {/* Amenity Booking Drawer */}
            <MobileAmenityBookingDrawer
                isOpen={isAmenityDrawerOpen}
                onClose={() => setIsAmenityDrawerOpen(false)}
            />

            {/* Logout Modal */}
            <LogoutConfirmationModal
                isOpen={isLogoutOpen}
                onClose={() => setIsLogoutOpen(false)}
                onConfirm={handleConfirmLogout}
            />
        </div>
    );
}
