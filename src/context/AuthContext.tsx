'use client'

import {
    createContext,
    useContext,
    useEffect,
    useState,
    useCallback,
    useRef,
    type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { AUTH_SYNC_CHANNEL_NAME, type AuthSyncEvent } from '@/lib/supabase/client-auth'
import type { Profile } from '@/types/database'
import type { User, Session } from '@supabase/supabase-js'
import { toast } from 'sonner'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AuthState {
    user: User | null
    profile: Profile | null
    session: Session | null
    /** true while we're still resolving the initial auth + profile fetch */
    loading: boolean
    /** true while re-fetching profile in the background (initial load already done) */
    profileLoading: boolean
}

interface AuthContextValue extends AuthState {
    /** Force-refresh the profile from Supabase (e.g. after editing profile) */
    refreshProfile: () => Promise<void>
}

interface VerifiedUserResult {
    user: User | null
    isAuthoritativelyInvalid: boolean
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function isAuthoritativeAuthError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false

    const maybeError = error as {
        status?: number
        message?: string
        code?: string
    }

    if (maybeError.status === 401 || maybeError.status === 403) return true

    const haystack = `${maybeError.message ?? ''} ${maybeError.code ?? ''}`.toLowerCase()
    if (!haystack) return false

    const authoritativeSignals = [
        'jwt expired',
        'invalid jwt',
        'refresh token',
        'token has expired or is invalid',
        'auth session missing',
        'session not found',
        'session from session_id claim in jwt does not exist',
        'user from sub claim in jwt does not exist',
        'invalid token',
        'not authenticated',
    ]

    return authoritativeSignals.some(signal => haystack.includes(signal))
}

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthState>({
        user: null,
        profile: null,
        session: null,
        loading: true,
        profileLoading: false,
    })

    // Use state to instantiate the supabase client securely
    const [supabase] = useState(() => createClient())

    /* ---------- helpers ---------- */

    /**
     * Fetch the *verified* user from Supabase (hits the server, not localStorage).
     * This is what Supabase recommends as the authoritative check.
     */
    const fetchVerifiedUser = useCallback(async (): Promise<VerifiedUserResult> => {
        if (!supabase) return { user: null, isAuthoritativelyInvalid: false }
        try {
            const { data, error } = await supabase.auth.getUser()
            if (error) {
                return {
                    user: null,
                    isAuthoritativelyInvalid: isAuthoritativeAuthError(error),
                }
            }

            if (!data.user) {
                return {
                    user: null,
                    isAuthoritativelyInvalid: false,
                }
            }

            return {
                user: data.user,
                isAuthoritativelyInvalid: false,
            }
        } catch (e) {
            // Ignore AbortError (request cancelled due to navigation/unmount)
            if (e instanceof Error && e.name === 'AbortError') {
                return {
                    user: null,
                    isAuthoritativelyInvalid: false,
                }
            }

            console.warn('[AuthProvider] getUser failed:', e)
            return {
                user: null,
                isAuthoritativelyInvalid: isAuthoritativeAuthError(e),
            }
        }
    }, [])

    /**
     * Resolve the current user while being resilient to transient network failures.
     * If verification fails for a temporary reason, we keep the local session user.
     */
    const resolveUserFromSession = useCallback(
        async (session: Session): Promise<VerifiedUserResult> => {
            const verified = await fetchVerifiedUser()
            if (verified.user) return verified
            if (verified.isAuthoritativelyInvalid) return verified

            if (session.user) {
                console.warn(
                    '[AuthProvider] Temporary user verification issue; continuing with session user.'
                )
                return {
                    user: session.user,
                    isAuthoritativelyInvalid: false,
                }
            }

            return {
                user: null,
                isAuthoritativelyInvalid: false,
            }
        },
        [fetchVerifiedUser]
    )

    /**
     * Fetch the profile row from the `profiles` table.
     * Returns null (and logs) on failure instead of crashing.
     */
    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        if (!supabase) return null
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.warn('[AuthProvider] Failed to fetch profile:', error.message)
            return null
        }

        const { data: privateProfile, error: privateError } = await (supabase as any)
            .from('profile_private')
            .select('phone, address')
            .eq('profile_id', userId)
            .maybeSingle()

        if (privateError) {
            console.warn('[AuthProvider] Failed to fetch private profile fields:', privateError.message)
        }

        const { data: businessProfile, error: businessError } = await (supabase as any)
            .from('landlord_business_profiles')
            .select('business_name, business_permit_url, business_permit_number, business_permits')
            .eq('profile_id', userId)
            .maybeSingle()

        if (businessError) {
            console.warn('[AuthProvider] Failed to fetch landlord business profile fields:', businessError.message)
        }

        return {
            ...profile,
            phone: privateProfile?.phone ?? profile.phone,
            address: privateProfile?.address ?? profile.address,
            business_name: businessProfile?.business_name ?? profile.business_name,
            business_permit_url: businessProfile?.business_permit_url ?? profile.business_permit_url,
            business_permit_number: businessProfile?.business_permit_number ?? profile.business_permit_number,
            business_permits: businessProfile?.business_permits ?? profile.business_permits,
        } as Profile
    }, [])

    /**
     * Public method - lets any component trigger a profile re-fetch
     * (e.g. after the user edits their name / avatar).
     */
    const refreshProfile = useCallback(async () => {
        const userId = state.user?.id
        if (!userId) return

        setState(prev => ({ ...prev, profileLoading: true }))
        const profile = await fetchProfile(userId)
        setState(prev => ({
            ...prev,
            profile: profile ?? prev.profile, // keep old profile if fetch fails
            profileLoading: false,
        }))
    }, [state.user?.id, fetchProfile])

    const clearAuthState = useCallback(() => {
        setState({
            user: null,
            profile: null,
            session: null,
            loading: false,
            profileLoading: false,
        })
    }, [])

    /* ---------- boot sequence ---------- */

    useEffect(() => {
        if (!supabase) return
        let cancelled = false // prevent state updates after unmount
        let timeoutId: ReturnType<typeof setTimeout> | undefined

        const applyAuthedState = async (session: Session) => {
            if (cancelled) return
            const resolved = await resolveUserFromSession(session)
            if (cancelled) return

            if (!resolved.user || resolved.isAuthoritativelyInvalid) {
                clearAuthState()
                return
            }

            const currentUser = resolved.user
            if (cancelled) return
            const fetchedProfile = await fetchProfile(currentUser.id)
            if (cancelled) return

            setState(prev => ({
                user: currentUser,
                profile:
                    fetchedProfile ?? (prev.user?.id === currentUser.id ? prev.profile : null),
                session,
                loading: false,
                profileLoading: false,
            }))
        }

        const boot = async () => {
            // 10-second timeout to prevent perpetual loading (generous to cover
            // @supabase/gotrue-js cross-tab lock recovery which can take ~5s)
            timeoutId = setTimeout(() => {
                if (!cancelled) {
                    console.warn('[α3] Boot timeout - clearing auth state to prevent perpetual loading')
                    clearAuthState()
                }
            }, 10000)

            try {
                // 1. Get the session (fast, from cookie/local-storage)
                const {
                    data: { session },
                } = await supabase.auth.getSession()

                if (cancelled) return

                if (!session) {
                    clearAuthState()
                    return
                }

                await applyAuthedState(session)
            } finally {
                if (timeoutId) clearTimeout(timeoutId)
            }
        }

        boot()

        // 2. Listen for auth state changes (login, logout, token refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (cancelled) return

            if (event === 'SIGNED_OUT' || !session) {
                clearAuthState()
                return
            }

            await applyAuthedState(session)
        })

        return () => {
            cancelled = true
            if (timeoutId) clearTimeout(timeoutId)
            subscription.unsubscribe()
        }
    }, [resolveUserFromSession, fetchProfile, clearAuthState, supabase])

    /* ---------- cross-tab BroadcastChannel synchronization ---------- */

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.BroadcastChannel === 'undefined') return

        let channel: BroadcastChannel | null = null
        try {
            channel = new BroadcastChannel(AUTH_SYNC_CHANNEL_NAME)
            channel.onmessage = async (event: MessageEvent<AuthSyncEvent>) => {
                const data = event.data
                if (!data || !data.type) return

                if (data.type === 'SIGNED_OUT' && data.scope !== 'others') {
                    clearAuthState()
                    const pathname = window.location.pathname
                    if (
                        pathname.startsWith('/tenant') ||
                        pathname.startsWith('/landlord') ||
                        pathname.startsWith('/admin')
                    ) {
                        window.location.replace(`/login?sync=logout&t=${Date.now()}`)
                    }
                } else if (data.type === 'SIGNED_IN') {
                    const {
                        data: { session },
                    } = await supabase.auth.getSession()
                    if (session) {
                        const resolved = await resolveUserFromSession(session)
                        if (resolved.user && !resolved.isAuthoritativelyInvalid) {
                            const fetchedProfile = await fetchProfile(resolved.user.id)
                            setState({
                                user: resolved.user,
                                profile: fetchedProfile,
                                session,
                                loading: false,
                                profileLoading: false,
                            })
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('[AuthContext] BroadcastChannel init error:', err)
        }

        return () => {
            if (channel) {
                try {
                    channel.close()
                } catch {
                    // ignore
                }
            }
        }
    }, [supabase, resolveUserFromSession, fetchProfile, clearAuthState])

    /* ---------- realtime remote session revocation monitor ---------- */

    useEffect(() => {
        const userId = state.user?.id
        const currentSessionId = state.session?.id
        if (!userId || !supabase) return

        const channel = supabase
            .channel(`auth-monitor:${userId}`)
            .on('broadcast', { event: 'SESSION_REVOKED' }, (payload: any) => {
                const payloadData = payload?.payload || payload
                const targetSessionId = payloadData?.sessionId
                const scope = payloadData?.scope

                const isTargeted =
                    (targetSessionId && currentSessionId && targetSessionId === currentSessionId) ||
                    scope === 'all' ||
                    (scope === 'others' && payloadData?.originatingSessionId !== currentSessionId)

                if (isTargeted) {
                    toast.error(
                        payloadData?.message || 'Your session on this device was ended remotely.'
                    )
                    clearAuthState()
                    const pathname = window.location.pathname
                    if (
                        pathname.startsWith('/tenant') ||
                        pathname.startsWith('/landlord') ||
                        pathname.startsWith('/admin')
                    ) {
                        window.location.replace('/login?reason=remote_revocation')
                    }
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [state.user?.id, state.session?.id, supabase, clearAuthState])

    /* ---------- listen for "profile-updated" custom events ---------- */

    useEffect(() => {
        const handler = () => {
            void refreshProfile()
        }
        window.addEventListener('profile-updated', handler)
        return () => window.removeEventListener('profile-updated', handler)
    }, [refreshProfile])

    /* ---------- render ---------- */

    const value: AuthContextValue = {
        ...state,
        refreshProfile,
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext)
    if (ctx === undefined) {
        throw new Error('useAuth must be used within an <AuthProvider>')
    }
    return ctx
}
