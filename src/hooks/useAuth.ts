'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'
import type { User, Session } from '@supabase/supabase-js'

interface AuthState {
    user: User | null
    profile: Profile | null
    session: Session | null
    loading: boolean
}

export function useAuth() {
    const [state, setState] = useState<AuthState>({
        user: null,
        profile: null,
        session: null,
        loading: true,
    })

    useEffect(() => {
        const supabase = createClient()

        // Fetch profile in background — does NOT block loading
        const fetchProfile = async (userId: string) => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()
            if (data) {
                setState(prev => ({ ...prev, profile: data }))
            }
        }

        // Get initial session — resolve loading immediately from session data
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user ?? null

            // Set loading: false immediately so the navbar renders right away
            setState({ user, profile: null, session, loading: false })

            // Then fetch full profile in the background
            if (user) fetchProfile(user.id)
        }

        getInitialSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const user = session?.user ?? null

                // Again, resolve immediately from session
                setState(prev => ({ ...prev, user, session, loading: false }))

                // Fetch profile in background
                if (user) {
                    fetchProfile(user.id)
                } else {
                    setState(prev => ({ ...prev, profile: null }))
                }
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    return state
}
