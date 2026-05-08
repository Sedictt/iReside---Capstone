import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined;

export function createClient() {
    if (client) return client;

    try {
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!url || !key) {
            console.error('[Supabase Client] Missing environment variables. URL:', !!url, 'Key:', !!key);
            // Return a "dead" client or throw a more descriptive error
            throw new Error('Missing Supabase environment variables');
        }

        client = createBrowserClient<Database>(url, key);
        return client;
    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn('[Supabase Client] Browser aborted initialization. This may happen during fast-refresh.');
            // Don't cache the failed attempt if it was an abort
            return createBrowserClient<Database>(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
        }
        console.error('[Supabase Client] Failed to initialize:', error);
        throw error;
    }
}
