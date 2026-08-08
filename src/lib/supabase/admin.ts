import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

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
    });
}

/**
 * @deprecated Use `createServiceRoleSupabaseClient` instead.
 * Kept as a backward-compatible alias during the refactoring migration.
 */
export const createAdminClient = createServiceRoleSupabaseClient;
