'use server'

import { redirect } from 'next/navigation'
import { createClient } from './server'

const getDashboardPathForRole = (role: string) => {
    if (role === 'admin') return '/admin/dashboard'
    if (role === 'landlord') return '/landlord/dashboard'
    return '/tenant/dashboard'
}

// eslint-disable-next-line react-doctor/server-auth-actions
export async function auth() {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
        throw new Error("Unauthorized")
    }
    return session
}

/**
 * Higher security auth check that validates the user with Supabase.
 * Use this in server actions and API routes that modify data.
 */
// eslint-disable-next-line react-doctor/server-auth-actions
export async function requireUser() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized");
    }

    return { user, supabase };
}

// eslint-disable-next-line react-doctor/server-auth-actions
export async function signUp(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const fullName = formData.get('full_name') as string
    const role = (formData.get('role') as string) || 'tenant'

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                role,
            },
        },
    })

    if (error) {
        return { error: error.message }
    }

    return { error: null, url: getDashboardPathForRole(role) }
}

// eslint-disable-next-line react-doctor/server-auth-actions
export async function signIn(formData: FormData) {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        return { error: error.message }
    }

    const { data: { user } } = await supabase.auth.getUser()
    let role = user?.user_metadata?.role

    if (!role && user?.id) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        role = profile?.role ?? undefined
    }

    return { error: null, url: getDashboardPathForRole(role || 'tenant') }
}

export async function signOut() {
    const session = await auth()
    if (!session) {
        throw new Error('Unauthorized')
    }
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

export async function getCurrentUser() {
    const session = await auth()
    if (!session) {
        return null
    }
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) return null

    // Fetch the full profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return profile
}

export async function getSession() {
    const sessionFromAuth = await auth()
    const supabase = await createClient()
    if (sessionFromAuth) {
        return sessionFromAuth
    }
    const { data: { session } } = await supabase.auth.getSession()
    return session
}
