import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

/**
 * Robust fetch wrapper with a 15-second timeout to prevent server-side hangs
 * if upstream database requests experience network drops or TCP socket stalls.
 */
function fetchWithTimeout(url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
    const timeoutMs = 15000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
        controller.abort(new Error(`Supabase request timed out after ${timeoutMs}ms`))
    }, timeoutMs)

    const originalSignal = options.signal
    let signal = controller.signal
    if (originalSignal && typeof AbortSignal !== 'undefined' && typeof AbortSignal.any === 'function') {
        signal = AbortSignal.any([originalSignal, controller.signal])
    }

    return fetch(url, {
        ...options,
        signal,
    }).finally(() => {
        clearTimeout(timeoutId)
    })
}

/**
 * Creates a Supabase client for use in Server Components and API routes.
 *
 * Uses the request cookie store for session management.
 * This is the primary server-side client.
 */
export async function createServerSupabaseClient() {
    const cookieStore = await cookies()

    return createServerClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                fetch: fetchWithTimeout,
            },
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    )
}

/**
 * @deprecated Use `createServerSupabaseClient` instead.
 * Kept as a backward-compatible alias during the refactoring migration.
 */
export const createClient = createServerSupabaseClient;

export async function auth() {
    const supabase = await createServerSupabaseClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
}
