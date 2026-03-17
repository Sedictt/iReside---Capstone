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

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

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

    // Keep a stable ref to the supabase client so we never recreate it
    const supabaseRef = useRef(createClient())

    /* ---------- helpers ---------- */

    /**
     * Fetch the *verified* user from Supabase (hits the server, not localStorage).
     * This is what Supabase recommends as the authoritative check.
     */
    const fetchVerifiedUser = useCallback(async () => {
        const { data, error } = await supabaseRef.current.auth.getUser()
        if (error || !data.user) return null
        return data.user
    }, [])

    /**
     * Fetch the profile row from the `profiles` table.
     * Returns null (and logs) on failure instead of crashing.
     */
    const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
        const { data, error } = await supabaseRef.current
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
     * Public method — lets any component trigger a profile re-fetch
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
        const supabase = supabaseRef.current
        let cancelled = false // prevent state updates after unmount

        const boot = async () => {
            // 1. Get the session (fast, from cookie/local-storage)
            const {
                data: { session },
            } = await supabase.auth.getSession()

            if (!session) {
                // No session → definitely not logged in
                if (!cancelled) {
                    setState({
                        user: null,
                        profile: null,
                        session: null,
                        loading: false,
                        profileLoading: false,
                    })
                }
                return
            }

            // 2. Verify the user server-side (authoritative)
            const verifiedUser = await fetchVerifiedUser()
            if (cancelled) return

            if (!verifiedUser) {
                // Token was present but invalid/expired & couldn't be refreshed
                setState({
                    user: null,
                    profile: null,
                    session: null,
                    loading: false,
                    profileLoading: false,
                })
                return
            }

            // 3. Fetch the profile — we wait for this before setting loading:false
            //    so navbars etc. never render without data.
            const profile = await fetchProfile(verifiedUser.id)
            if (cancelled) return

            setState({
                user: verifiedUser,
                profile,
                session,
                loading: false,
                profileLoading: false,
            })
        }

        boot()

        // 4. Listen for auth state changes (login, logout, token refresh)
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (cancelled) return

            if (event === 'SIGNED_OUT' || !session) {
                setState({
                    user: null,
                    profile: null,
                    session: null,
                    loading: false,
                    profileLoading: false,
                })
                return
            }

            // For SIGNED_IN, TOKEN_REFRESHED, etc. — re-verify & re-fetch profile
            const verifiedUser = await fetchVerifiedUser()
            if (cancelled) return

            if (!verifiedUser) {
                setState({
                    user: null,
                    profile: null,
                    session: null,
                    loading: false,
                    profileLoading: false,
                })
                return
            }

            const profile = await fetchProfile(verifiedUser.id)
            if (cancelled) return

            setState({
                user: verifiedUser,
                profile,
                session,
                loading: false,
                profileLoading: false,
            })
        })

        return () => {
            cancelled = true
            subscription.unsubscribe()
        }
    }, [fetchVerifiedUser, fetchProfile])

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
