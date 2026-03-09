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

        // Get initial session
        const getInitialSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            const user = session?.user ?? null

            let profile: Profile | null = null
            if (user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()
                profile = data
            }

            setState({ user, profile, session, loading: false })
        }

        getInitialSession()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                const user = session?.user ?? null

                let profile: Profile | null = null
                if (user) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .single()
                    profile = data
                }

                setState({ user, profile, session, loading: false })
            }
        )

        return () => {
            subscription.unsubscribe()
        }
    }, [])

    return state
}
