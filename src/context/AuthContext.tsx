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
import type { Profile } from '@/types/database'
import type { User, Session } from '@supabase/supabase-js'

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
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (error) {
            console.warn('[AuthProvider] Failed to fetch profile:', error.message)
            return null
        }
        return data as Profile
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

    /* ---------- boot sequence ---------- */

    useEffect(() => {
        if (!supabase) return
        let cancelled = false // prevent state updates after unmount

        const clearAuthState = () => {
            setState({
                user: null,
                profile: null,
                session: null,
                loading: false,
                profileLoading: false,
            })
        }

        const applyAuthedState = async (session: Session) => {
            const resolved = await resolveUserFromSession(session)
            if (cancelled) return

            if (!resolved.user || resolved.isAuthoritativelyInvalid) {
                clearAuthState()
                return
            }

            const currentUser = resolved.user
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
            // 1. Get the session (fast, from cookie/local-storage)
            const {
                data: { session },
            } = await supabase.auth.getSession()

            if (!session) {
                if (!cancelled) clearAuthState()
                return
            }

            await applyAuthedState(session)
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
            subscription.unsubscribe()
        }
    }, [resolveUserFromSession, fetchProfile])

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
