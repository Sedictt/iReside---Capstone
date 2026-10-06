'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { triggerHaptic } from '@/lib/haptics'
import {
    LayoutDashboard,
    CreditCard,
    Wrench,
    MessageCircle,
    User,
    BarChart3,
    Ticket,
    Menu,
    Bell,
} from 'lucide-react'

/* ----------------------------------------------------------
   Tenant Tab Config
   ---------------------------------------------------------- */

const TENANT_TABS = [
    {
        href: '/mobile/tenant/home',
        label: 'Home',
        icon: LayoutDashboard,
        matchPrefix: '/mobile/tenant/home',
    },
    {
        href: '/mobile/tenant/pay',
        label: 'Pay',
        icon: CreditCard,
        matchPrefix: '/mobile/tenant/pay',
    },
    {
        href: '/mobile/tenant/maintenance',
        label: 'Requests',
        icon: Wrench,
        matchPrefix: '/mobile/tenant/maintenance',
    },
    {
        href: '/mobile/tenant/messages',
        label: 'Messaging',
        icon: MessageCircle,
        matchPrefix: '/mobile/tenant/messages',
    },
    {
        href: '/mobile/tenant/profile',
        label: 'Profile',
        icon: User,
        matchPrefix: '/mobile/tenant/profile',
    },
]

/* ----------------------------------------------------------
   Landlord Tab Config
   ---------------------------------------------------------- */

const LANDLORD_TABS = [
    {
        href: '/mobile/landlord/overview',
        label: 'Dashboard',
        icon: LayoutDashboard,
        matchPrefix: '/mobile/landlord/overview',
    },
    {
        href: '/mobile/landlord/payments',
        label: 'Payments',
        icon: CreditCard,
        matchPrefix: '/mobile/landlord/payments',
    },
    {
        href: '/mobile/landlord/tickets',
        label: 'Maintenance',
        icon: Wrench,
        matchPrefix: '/mobile/landlord/tickets',
    },
    {
        href: '/mobile/landlord/messages',
        label: 'Messaging',
        icon: MessageCircle,
        matchPrefix: '/mobile/landlord/messages',
    },
    {
        href: '/mobile/landlord/menu',
        label: 'Menu',
        icon: Menu,
        matchPrefix: '/mobile/landlord/menu',
    },
]

/* ----------------------------------------------------------
   Props
   ---------------------------------------------------------- */

interface BottomTabBarProps {
    role: 'tenant' | 'landlord'
    /** Badge counts keyed by matchPrefix */
    badges?: Record<string, number>
}

/* ----------------------------------------------------------
   Component
   ---------------------------------------------------------- */

export function BottomTabBar({ role, badges = {} }: BottomTabBarProps) {
    const pathname = usePathname()
    const tabs = role === 'tenant' ? TENANT_TABS : LANDLORD_TABS

    return (
        <nav className="mobile-tab-bar relative z-[60] pointer-events-auto" aria-label="Main navigation">
            {tabs.map((tab) => {
                const isMenuTab = tab.label === 'Menu'
                const isActive = pathname?.startsWith(tab.matchPrefix) || 
                    (isMenuTab && (pathname?.includes('/profile') || pathname?.includes('/settings') || pathname?.includes('/menu'))) ||
                    (tab.label === 'Profile' && pathname?.includes('/settings'))
                const badgeCount = badges[tab.matchPrefix] ?? 0
                const Icon = tab.icon

                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        onClick={() => triggerHaptic('light')}
                        className={cn(
                            'mobile-tab-item cursor-pointer touch-manipulation active:scale-95 transition-transform',
                            isActive && 'active'
                        )}
                        aria-label={tab.label}
                        aria-current={isActive ? 'page' : undefined}
                    >
                        <span className="tab-icon relative">
                            <Icon
                                size={22}
                                strokeWidth={isActive ? 2.5 : 1.8}
                                aria-hidden="true"
                            />
                            {badgeCount > 0 && (
                                <span className="mobile-tab-badge" aria-label={`${badgeCount} unread`}>
                                    {badgeCount > 9 ? '9+' : badgeCount}
                                </span>
                            )}
                        </span>
                        <span className="font-bold">{tab.label}</span>
                    </Link>
                )
            })}
        </nav>
    )
}
