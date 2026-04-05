import { createClient } from "./client"

const CLIENT_SIGN_OUT_TIMEOUT_MS = 1500

async function signOutWithTimeout() {
    const supabase = createClient()

    return Promise.race([
        supabase.auth.signOut({ scope: 'global' }),
        new Promise<{ error: Error }>((resolve) => {
            window.setTimeout(() => {
                resolve({ error: new Error(`Client sign-out timed out after ${CLIENT_SIGN_OUT_TIMEOUT_MS}ms`) })
            }, CLIENT_SIGN_OUT_TIMEOUT_MS)
        }),
    ])
}

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
    try {
        // Clear browser session AND invalidate refresh token globally, but do not
        // let a hanging client request trap the user on a protected page.
        const { error } = await signOutWithTimeout()
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

    // Route logout through the server so middleware-visible cookies are
    // definitely cleared before we land on the login page.
    const timestamp = Date.now()
    window.location.replace(`/auth/logout?logout=${timestamp}`)
}
