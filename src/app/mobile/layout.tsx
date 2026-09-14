'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { BottomTabBar } from '@/components/mobile/layout/BottomTabBar'
import { AuthProvider } from '@/context/AuthContext'
import { NotificationProvider } from '@/context/NotificationContext'
import { PropertyProvider } from '@/context/PropertyContext'
import { cn } from '@/lib/utils'
import '../../styles/mobile.css'

/* ----------------------------------------------------------
   Inner layout — needs AuthContext to read role
   ---------------------------------------------------------- */

function MobileLayoutInner({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth()
    const router = useRouter()

    // Ensure no outer window scrollbar appears on mobile portal
    useEffect(() => {
        document.documentElement.classList.add('mobile-viewport')
        document.body.classList.add('mobile-viewport')
        return () => {
            document.documentElement.classList.remove('mobile-viewport')
            document.body.classList.remove('mobile-viewport')
        }
    }, [])

    // Redirect unauthenticated users to login
    useEffect(() => {
        if (!loading && !profile) {
            router.replace('/login?redirect=/mobile')
        }
    }, [loading, profile, router])

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-3">
                    {/* Animated sage green spinner */}
                    <div
                        className="w-10 h-10 rounded-full border-2 border-muted border-t-[#5e9a7a] animate-spin"
                        role="status"
                        aria-label="Loading"
                    />
                    <span className="text-sm text-muted-foreground">Loading iReside…</span>
                </div>
            </div>
        )
    }

    if (!profile) return null

    const role = profile.role as 'tenant' | 'landlord'

    // Only tenant and landlord roles have mobile portal access
    if (role !== 'tenant' && role !== 'landlord') {
        router.replace('/login')
        return null
    }

    return (
        <div
            className={cn(
                'mobile-app-root relative h-[100dvh] max-h-[100dvh] min-h-[100dvh] w-full max-w-md mx-auto bg-background text-foreground',
                'flex flex-col overflow-hidden select-none'
            )}
        >
            {/* Page content — scrollable only when content exceeds screen */}
            <main className="flex-1 min-h-0 overflow-y-auto flex flex-col mobile-scroll [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {children}
            </main>

            {/* Fixed bottom navigation */}
            <BottomTabBar role={role} />
        </div>
    )
}

/* ----------------------------------------------------------
   Public layout export — wraps providers
   ---------------------------------------------------------- */

export default function MobileLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <PropertyProvider>
                <NotificationProvider>
                    <MobileLayoutInner>{children}</MobileLayoutInner>
                </NotificationProvider>
            </PropertyProvider>
        </AuthProvider>
    )
}
