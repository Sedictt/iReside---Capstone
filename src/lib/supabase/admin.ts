import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Robust fetch wrapper with a 15-second timeout to prevent server-side hangs
 * if upstream database requests experience network drops or TCP socket stalls.
 */
function fetchWithTimeout(url: RequestInfo | URL, options: RequestInit = {}): Promise<Response> {
    const timeoutMs = 15000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => {
        controller.abort(new Error(`Supabase admin request timed out after ${timeoutMs}ms`))
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
 * Creates a Supabase client with service-role privileges.
 *
 * Bypasses Row-Level Security (RLS) and should ONLY be used
 * in server-side code (API routes, server actions, cron jobs).
 * NEVER expose this client to the browser.
 */
export function createServiceRoleSupabaseClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        throw new Error("Missing Supabase admin credentials.");
    }

    return createClient<Database>(url, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        },
        global: {
            fetch: fetchWithTimeout,
        },
    });
}

/**
 * @deprecated Use `createServiceRoleSupabaseClient` instead.
 * Kept as a backward-compatible alias during the refactoring migration.
 */
export const createAdminClient = createServiceRoleSupabaseClient;
