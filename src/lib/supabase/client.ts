import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

/**
 * Creates a Supabase client for use in Browser/Client Components.
 *
 * Uses @supabase/ssr createBrowserClient so cookies are automatically synced
 * with document.cookie for Next.js App Router and middleware.
 * Bypasses navigator.locks by providing an immediate execution lock function
 * to prevent deadlocks in React Strict Mode.
 */
export function createBrowserSupabaseClient() {
    if (!browserClient) {
        browserClient = createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                isSingleton: false,
                auth: {
                    flowType: 'pkce',
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    persistSession: true,
                    // Direct non-blocking lock to eliminate navigator.locks deadlock
                    lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => {
                        return await fn();
                    },
                },
            }
        );
    }
    return browserClient;
}

/**
 * @deprecated Use `createBrowserSupabaseClient` instead.
 * Kept as a backward-compatible alias during the refactoring migration.
 */
export const createClient = createBrowserSupabaseClient;
