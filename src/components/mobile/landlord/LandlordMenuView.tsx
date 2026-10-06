'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
    LayoutDashboard,
    Building2,
    Users,
    CreditCard,
    Wrench,
    MessageSquare,
    ClipboardList,
    Map,
    Megaphone,
    Settings,
    User,
    LayoutGrid,
    BarChart2,
    Zap,
    ShieldCheck,
    FileText,
    Calendar,
    BookOpen,
    Download,
    LogOut,
    ChevronRight,
    AlertTriangle,
} from 'lucide-react'
import { BrandLogo } from '@/components/ui/BrandLogo'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector'
import { LogoutConfirmationModal } from '@/components/ui/LogoutConfirmationModal'
import { useNotifications } from '@/context/NotificationContext'
import { useProperty } from '@/context/PropertyContext'
import { triggerHaptic } from '@/lib/haptics'
import { cn } from '@/lib/utils'
import { signOut } from '@/lib/supabase/client-auth'
import { toast } from 'sonner'

interface MenuItem {
    label: string
    href: string
    icon: React.ComponentType<{ className?: string }>
    description?: string
    badge?: number
    urgent?: boolean
    warning?: boolean
    warningTooltip?: string
    isExternal?: boolean
}

interface MenuSection {
    category: string
    items: MenuItem[]
}

export function LandlordMenuView() {
    const router = useRouter()
    const { counts, importantNotifications } = useNotifications()
    const { properties, loading: propertyLoading, selectedPropertyId } = useProperty()

    const [showLogoutModal, setShowLogoutModal] = useState(false)
    const [isTenantSetupDelayed, setIsTenantSetupDelayed] = useState(false)

    const activePropertyId = selectedPropertyId && selectedPropertyId !== 'all'
        ? selectedPropertyId
        : (properties[0]?.id || 'default')

    useEffect(() => {
        const checkDelayed = () => {
            if (typeof window === 'undefined') return
            try {
                const val = window.localStorage.getItem(`ireside.tenant_setup_delayed.${activePropertyId}`)
                setIsTenantSetupDelayed(val === 'true')
            } catch {
                setIsTenantSetupDelayed(false)
            }
        }
        checkDelayed()
        window.addEventListener('tenant-setup-delayed-changed', checkDelayed)
        window.addEventListener('storage', checkDelayed)
        return () => {
            window.removeEventListener('tenant-setup-delayed-changed', checkDelayed)
            window.removeEventListener('storage', checkDelayed)
        }
    }, [activePropertyId])

    const hasZeroProperties = !propertyLoading && properties.length === 0
    const hasConfiguredMap = properties.some((p) => p.isMapSetupComplete)
    const hasPendingUnitMap = !propertyLoading && properties.length > 0 && !hasConfiguredMap
    const isLocked = hasZeroProperties || hasPendingUnitMap

    const isUrgent = (type: string) => importantNotifications.some(n => n.type === type)

    // Exact 1:1 match with desktop NAV_ITEMS in src/components/landlord/Sidebar.tsx
    const SECTIONS: MenuSection[] = [
        {
            category: 'Main',
            items: [
                { 
                    label: 'Dashboard', 
                    href: '/mobile/landlord/overview', 
                    icon: LayoutDashboard,
                    description: 'Operational overview, urgent tasks & real-time property KPIs'
                },
                { 
                    label: 'Analytics', 
                    href: '/mobile/landlord/analytics', 
                    icon: BarChart2,
                    description: 'Revenue trends, occupancy rates & financial performance metrics',
                },
                { 
                    label: 'Messaging', 
                    href: '/mobile/landlord/messages', 
                    icon: MessageSquare, 
                    badge: counts.messages || undefined,
                    description: 'Direct communications, tenant inquiries & broadcast channels'
                },
                { 
                    label: 'Calendar', 
                    href: '/landlord/calendar', 
                    icon: Calendar,
                    description: 'Viewing schedules, property inspections & lease milestone dates',
                    isExternal: true
                },
                { 
                    label: 'Community Hub', 
                    href: '/landlord/community', 
                    icon: Megaphone,
                    description: 'Building announcements, community posts & resident discussions',
                    isExternal: true
                },
            ]
        },
        {
            category: 'Portfolio',
            items: [
                { 
                    label: 'Properties', 
                    href: '/landlord/properties', 
                    icon: Building2, 
                    description: 'Manage registered buildings, configure units & set property amenities',
                    isExternal: true
                },
                { 
                    label: 'Unit Map', 
                    href: '/landlord/unit-map', 
                    icon: Map, 
                    description: 'Interactive 2D architectural blueprint & visual unit layout planner',
                    isExternal: true
                },
                { 
                    label: 'Facilities', 
                    href: '/landlord/utilities', 
                    icon: LayoutGrid,
                    description: 'Track on-site facilities, building amenities & shared utility meters',
                    isExternal: true
                },
                { 
                    label: 'Applications', 
                    href: '/landlord/applications', 
                    icon: ClipboardList, 
                    badge: counts.applications || undefined, 
                    urgent: isUrgent('application'),
                    description: 'Review tenant applications, screening details & issue digital approvals',
                    isExternal: true
                },
                { 
                    label: 'Tenants', 
                    href: '/mobile/landlord/tenants', 
                    icon: Users, 
                    warning: isTenantSetupDelayed,
                    warningTooltip: 'Action needed: Begin setting up your tenants to occupy units and activate lease tracking.',
                    description: 'Active resident profiles, occupancy records & emergency contacts',
                    isExternal: true
                },
                { 
                    label: 'Leases', 
                    href: '/mobile/landlord/leases', 
                    icon: FileText, 
                    urgent: isUrgent('lease') || isUrgent('lease_renewal_request'),
                    description: 'Digital lease agreements, active contracts & renewal negotiations',
                    isExternal: true
                },
                { 
                    label: 'Move-Out Requests', 
                    href: '/landlord/move-out', 
                    icon: ClipboardList, 
                    urgent: isUrgent('move_out_approved') || isUrgent('move_out_denied'),
                    description: 'Process resident move-out notices, checkout inspections & deposit refunds',
                    isExternal: true
                },
                { 
                    label: 'Maintenance', 
                    href: '/mobile/landlord/tickets', 
                    icon: Wrench, 
                    badge: counts.maintenance || undefined, 
                    urgent: isUrgent('maintenance'),
                    description: 'Track repair tickets, contractor assignments & resolution progress'
                },
            ]
        },
        {
            category: 'Finance',
            items: [
                { 
                    label: 'Finance Hub', 
                    href: '/mobile/landlord/payments', 
                    icon: CreditCard, 
                    urgent: isUrgent('payment'),
                    description: 'Rental ledger, incoming payments, receipts & automated billing'
                },
                { 
                    label: 'Utility Billing', 
                    href: '/landlord/utility-billing', 
                    icon: Zap,
                    description: 'Calculate, allocate and bill electricity, water & submeter charges',
                    isExternal: true
                },
            ]
        },
        {
            category: 'Account',
            items: [
                { 
                    label: 'Profile', 
                    href: '/mobile/landlord/profile', 
                    icon: User,
                    description: 'Public landlord profile, contact info & verification credentials'
                },
                { 
                    label: 'Document Vault', 
                    href: '/landlord/documents', 
                    icon: ShieldCheck,
                    description: 'Encrypted storage for signed contracts, property deeds & permits',
                    isExternal: true
                },
                { 
                    label: 'Settings', 
                    href: '/mobile/landlord/settings', 
                    icon: Settings,
                    description: 'Payout bank accounts, notification preferences & security settings'
                },
                { 
                    label: 'Documentation', 
                    href: '/landlord/docs', 
                    icon: BookOpen,
                    description: 'User manual, FAQs, troubleshooting & IT handover runbook',
                    isExternal: true
                },
                { 
                    label: 'Download Apps', 
                    href: '/download', 
                    icon: Download,
                    description: 'Native Windows .exe client and Android APK package',
                    isExternal: true
                },
            ]
        },
    ]

    const handleItemClick = (e: React.MouseEvent, item: MenuItem) => {
        triggerHaptic('light')
        if (isLocked && item.isExternal && item.href !== '/landlord/properties') {
            e.preventDefault()
            toast.warning(
                hasZeroProperties
                    ? 'Property setup required. Please complete your property setup first to unlock portal operations.'
                    : 'Unit map setup required. Please configure your property unit layout first to unlock portal operations.'
            )
        }
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-24 mobile-scroll">
            {/* 1. Brand Header Card */}
            <div className="neumorphic-panel rounded-3xl p-4 sm:p-5 flex items-center justify-between gap-3 shadow-sm border border-border/20">
                <div className="flex items-center gap-3 min-w-0 flex-1 overflow-hidden">
                    <BrandLogo size="md" className="min-w-0" />
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <div className="neumorphic-inset-card p-1 rounded-2xl flex items-center">
                        <ThemeToggle variant="sidebar" className="size-8" />
                    </div>
                </div>
            </div>

            {/* 2. Active Property Switcher */}
            <div className="w-full">
                <MobilePropertySelector />
            </div>

            {/* 3. Categorized Navigation Modules matching Desktop exactly */}
            {SECTIONS.map((section) => (
                <div key={section.category} className="space-y-2">
                    <div className="px-2 pt-1 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">
                            {section.category}
                        </span>
                    </div>

                    <div className="neumorphic-panel rounded-3xl p-2 space-y-1 shadow-sm border border-border/20">
                        {section.items.map((item) => {
                            const Icon = item.icon
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    onClick={(e) => handleItemClick(e, item)}
                                    className="group flex items-center justify-between gap-3 p-3 rounded-2xl transition-all hover:bg-muted/40 active:scale-[0.99] cursor-pointer"
                                >
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="size-10 rounded-2xl flex items-center justify-center shrink-0 neumorphic-inset-card text-muted-foreground group-hover:text-primary transition-colors">
                                            <Icon className="size-5" />
                                        </div>
                                        <div className="flex flex-col min-w-0 flex-1 text-left">
                                            <span className="text-xs font-black uppercase tracking-wider text-foreground truncate">
                                                {item.label}
                                            </span>
                                            {item.description && (
                                                <span className="text-[10px] text-muted-foreground/80 truncate">
                                                    {item.description}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right indicators & badges */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {item.warning && (
                                            <span
                                                className="text-amber-500 animate-pulse"
                                                title={item.warningTooltip}
                                            >
                                                <AlertTriangle className="size-4" />
                                            </span>
                                        )}

                                        {item.badge && item.badge > 0 && (
                                            <span
                                                className={cn(
                                                    'px-2 py-0.5 rounded-full text-[10px] font-black text-white bg-red-500 shadow-sm',
                                                    item.urgent && 'animate-pulse'
                                                )}
                                            >
                                                {item.badge > 99 ? '99+' : item.badge}
                                            </span>
                                        )}

                                        <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                </div>
            ))}

            {/* 4. Log Out Card */}
            <div className="pt-2">
                <button
                    type="button"
                    onClick={() => {
                        triggerHaptic('medium')
                        setShowLogoutModal(true)
                    }}
                    className="w-full group flex items-center justify-between gap-3 p-4 rounded-3xl neumorphic-panel border border-red-500/20 text-red-500 hover:bg-red-500/5 active:scale-[0.99] transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl flex items-center justify-center shrink-0 neumorphic-inset-card text-red-500">
                            <LogOut className="size-5" />
                        </div>
                        <div className="flex flex-col text-left">
                            <span className="text-xs font-black uppercase tracking-wider text-red-500">
                                Log Out
                            </span>
                            <span className="text-[10px] text-muted-foreground/80">
                                Sign out of your iReside account
                            </span>
                        </div>
                    </div>
                    <ChevronRight className="size-4 text-red-500/40 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>

            {/* Logout Confirmation Modal */}
            <LogoutConfirmationModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={async () => {
                    await signOut()
                    router.replace('/login')
                }}
            />
        </div>
    )
}
