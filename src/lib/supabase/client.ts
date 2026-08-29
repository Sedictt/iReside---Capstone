import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

let authLockPromise: Promise<any> = Promise.resolve();

/**
 * Creates a Supabase client for use in Browser/Client Components.
 *
 * Uses a module-level singleton so only one instance exists per page load.
 * This is the primary client-side client.
 */
export function createBrowserSupabaseClient() {
    if (!browserClient) {
        browserClient = createBrowserClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                auth: {
                    // Serialized in-memory mutex to prevent 409 concurrent token refreshes without navigator.locks abort errors
                    lock: async (_name, _acquireTimeout, fn) => {
                        const prev = authLockPromise;
                        let release: () => void = () => {};
                        authLockPromise = new Promise((res) => {
                            release = res;
                        });
                        try {
                            await prev.catch(() => {});
                            return await fn();
                        } finally {
                            release();
                        }
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
