import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let browserClient: ReturnType<typeof createSupabaseClient<Database>> | null = null;

/**
 * Creates a Supabase client for use in Browser/Client Components.
 *
 * Uses a module-level singleton so only one instance exists per page load.
 * 
 * IMPORTANT: We use `@supabase/supabase-js` `createClient` directly instead of
 * `@supabase/ssr` `createBrowserClient` because the SSR wrapper has its own
 * internal singleton cache that can return a stale client instance created
 * without our custom lock option. By using the base client directly and
 * configuring cookie storage ourselves, we ensure the custom lock is always
 * applied and navigator.locks (which deadlocks under React Strict Mode
 * double-mounting) is never used.
 */
export function createBrowserSupabaseClient() {
    if (!browserClient) {
        browserClient = createSupabaseClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    flowType: 'pkce',
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    persistSession: true,
                    // Bypass navigator.locks entirely to prevent deadlocks caused by
                    // React Strict Mode double-mounting (orphaned locks from unmounted effects)
                    // and recursive lock acquisition within the same sign-in flow.
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
