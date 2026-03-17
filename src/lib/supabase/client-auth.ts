import { createClient } from './client'

export async function signOut() {
    const supabase = createClient()

    try {
        // Clear browser session quickly, even if network is flaky.
        const { error } = await supabase.auth.signOut({ scope: 'local' })

        if (error) {
            console.error('Supabase local signOut failed:', error)
        }
    } catch (error) {
        console.error('Unexpected local signOut error:', error)
    }

    // Ask the server to clear middleware-visible cookies without blocking UX.
    void fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        keepalive: true,
    }).catch((error) => {
        console.error('Server logout request failed:', error)
    })

    // Always leave protected routes immediately after local sign-out.
    window.location.replace('/login')
}