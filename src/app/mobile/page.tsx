'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

/**
 * /mobile root — immediately redirects to the correct role-based home screen.
 * Tenant  → /mobile/tenant/home
 * Landlord → /mobile/landlord/overview
 */
export default function MobileRootPage() {
    const { profile, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (loading) return

        if (!profile) {
            router.replace('/login?redirect=/mobile')
            return
        }

        if (profile.role === 'tenant') {
            router.replace('/mobile/tenant/home')
        } else if (profile.role === 'landlord') {
            router.replace('/mobile/landlord/overview')
        } else {
            // admin and other roles — not supported on mobile
            router.replace('/login')
        }
    }, [loading, profile, router])

    return (
        <div className="flex items-center justify-center min-h-[100dvh] bg-background">
            <div
                className="w-10 h-10 rounded-full border-2 border-muted border-t-[#5e9a7a] animate-spin"
                role="status"
                aria-label="Redirecting…"
            />
        </div>
    )
}
