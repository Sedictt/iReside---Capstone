import { createClient } from "./client"

/**
 * Unified, fully destructive sign-out function.
 *
 * This ensures complete session termination:
 * 1. Clears client-side auth state (localStorage/sessionStorage) with global scope
 * 2. Clears any custom app storage
 * 3. Calls server endpoint to clear cookies and server-side session
 * 4. Redirects to login with cache-busting to prevent back-button access
 *
 * Use this function from client components for consistent sign-out behavior.
 */
export async function signOut() {
    const supabase = createClient()

    try {
        // Clear browser session AND invalidate refresh token globally
        const { error } = await supabase.auth.signOut({ scope: 'global' })
        if (error) {
            console.error('Supabase global signOut failed:', error)
        }
    } catch (error) {
        console.error('Unexpected signOut error:', error)
    }

    // Clear any app-specific localStorage/sessionStorage data
    try {
        // Remove any custom auth-related keys (adjust as needed)
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('supabase.') || key.includes('auth') || key.includes('session')) {
                localStorage.removeItem(key)
            }
        })
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('supabase.') || key.includes('auth') || key.includes('session')) {
                sessionStorage.removeItem(key)
            }
        })
    } catch (e) {
        console.warn('Could not clear custom storage:', e)
    }

    // Ask the server to clear middleware-visible cookies (non-blocking)
    void fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        keepalive: true,
    }).catch((error) => {
        console.error('Server logout request failed:', error)
    })

    // Always leave protected routes immediately with cache-busting URL
    // This prevents back-button access to cached pages
    const timestamp = Date.now()
    window.location.replace(`/login?logout=${timestamp}`)
}