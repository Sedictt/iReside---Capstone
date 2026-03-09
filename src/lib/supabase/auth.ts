'use server'

import { redirect } from 'next/navigation'
import { createClient } from './server'

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

    redirect(role === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard')
}

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

    // Get user role to redirect to proper dashboard
    const { data: { user } } = await supabase.auth.getUser()
    const role = user?.user_metadata?.role || 'tenant'

    redirect(role === 'landlord' ? '/landlord/dashboard' : '/tenant/dashboard')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
}

export async function getCurrentUser() {
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
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    return session
}
