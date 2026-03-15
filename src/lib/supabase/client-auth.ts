import { createClient } from './client'

export async function signOut() {
    const supabase = createClient()

    try {
        const { error } = await supabase.auth.signOut({ scope: 'global' })

        if (error) {
            console.error('Supabase signOut failed:', error)
        }
    } catch (error) {
        console.error('Unexpected signOut error:', error)
    } finally {
        // Always leave protected routes after logout attempt.
        window.location.replace('/login')
    }
}