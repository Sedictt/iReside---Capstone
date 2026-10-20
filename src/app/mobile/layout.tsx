'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useBrand } from '@/context/BrandContext'
import { BottomTabBar } from '@/components/mobile/layout/BottomTabBar'
import { MobileSheetExit } from '@/components/mobile/layout/MobileSheetExit'
import { NotificationProvider } from '@/context/NotificationContext'
import { PropertyProvider } from '@/context/PropertyContext'
import { cn } from '@/lib/utils'
import { useLanguageContext } from '@/context/LanguageContext'
import '../../styles/mobile.css'

/* ----------------------------------------------------------
   Inner layout — needs AuthContext to read role
   ---------------------------------------------------------- */

function MobileLayoutInner({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const { t } = useLanguageContext()
    const { isCustomBranded } = useBrand()

    // Ensure no outer window scrollbar appears on mobile portal
    useEffect(() => {
        document.documentElement.classList.add('mobile-viewport')
        document.body.classList.add('mobile-viewport')
        return () => {
            document.documentElement.classList.remove('mobile-viewport')
            document.body.classList.remove('mobile-viewport')
        }
    }, [])

    // Violet Ledger default vs. the landlord's own brand colour (see mobile.css)
    useEffect(() => {
        document.documentElement.classList.toggle('mobile-branded', isCustomBranded)
        return () => {
            document.documentElement.classList.remove('mobile-branded')
        }
    }, [isCustomBranded])

    // Redirect unauthenticated users to login
    useEffect(() => {
        if (!loading && !profile) {
            window.location.replace('/login?redirect=/mobile')
        }
    }, [loading, profile, router])

    const role = profile?.role as 'tenant' | 'landlord' | undefined

    // Role boundary checks for client-side navigation
    const isTenantOnLandlordRoute = role === 'tenant' && pathname.startsWith('/mobile/landlord')
    const isLandlordOnTenantRoute = role === 'landlord' && pathname.startsWith('/mobile/tenant')

    useEffect(() => {
        if (!loading && profile) {
            if (isTenantOnLandlordRoute) {
                router.replace('/mobile/tenant/home')
            } else if (isLandlordOnTenantRoute) {
                router.replace('/mobile/landlord/overview')
            }
        }
    }, [loading, profile, isTenantOnLandlordRoute, isLandlordOnTenantRoute, router])

    if (loading || !profile || isTenantOnLandlordRoute || isLandlordOnTenantRoute) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-full border-2 border-muted border-t-primary animate-spin"
                        role="status"
                        aria-label={t('Loading')}
                    />
                    <span className="text-sm text-muted-foreground">
                        {isTenantOnLandlordRoute || isLandlordOnTenantRoute ? 'Redirecting to your portal…' : t('Loading iReside…')}
                    </span>
                </div>
            </div>
        )
    }

    // Only tenant and landlord roles have mobile portal access
    if (role !== 'tenant' && role !== 'landlord') {
        router.replace('/login')
        return null
    }

    return (
        <div
            className={cn(
                'mobile-app-root mobile-ground relative h-[100dvh] max-h-[100dvh] min-h-[100dvh] w-full max-w-full sm:max-w-xl md:max-w-2xl mx-auto text-foreground',
                'flex flex-col overflow-x-hidden overflow-y-hidden select-none border-x-0 sm:border-x border-slate-200 dark:border-white/10 sm:shadow-2xl'
            )}
        >
            {/* Page content — scrollable only when content exceeds screen */}
            <main className="flex-1 min-h-0 overflow-y-auto flex flex-col mobile-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {children}
            </main>

            {/* Fixed bottom navigation */}
            <BottomTabBar role={role} />

            {/* Slide-down exit for CSS-animated bottom sheets */}
            <MobileSheetExit />
        </div>
    )
}

/* ----------------------------------------------------------
   Public layout export — wraps providers
   ---------------------------------------------------------- */

export default function MobileLayout({ children }: { children: React.ReactNode }) {
    return (
        <PropertyProvider>
            <NotificationProvider>
                <MobileLayoutInner>{children}</MobileLayoutInner>
            </NotificationProvider>
        </PropertyProvider>
    )
}
