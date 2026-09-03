import { createClient } from "./client";

export const AUTH_SYNC_CHANNEL_NAME = "ireside_auth_sync";

export type AuthSyncEvent =
    | { type: "SIGNED_IN"; userId?: string }
    | { type: "SIGNED_OUT"; scope?: "local" | "global" | "others" }
    | { type: "TOKEN_REFRESHED" }
    | { type: "SESSION_REVOKED"; sessionId?: string };

export function broadcastAuthEvent(event: AuthSyncEvent): void {
    if (typeof window === "undefined" || typeof window.BroadcastChannel === "undefined") {
        return;
    }
    try {
        const channel = new BroadcastChannel(AUTH_SYNC_CHANNEL_NAME);
        channel.postMessage(event);
        channel.close();
    } catch (e) {
        console.warn("[AuthSync] Failed to broadcast auth event:", e);
    }
}

export interface SignOutOptions {
    scope?: "local" | "global" | "others";
    broadcast?: boolean;
}

const CLIENT_SIGN_OUT_TIMEOUT_MS = 1500;

async function signOutWithTimeout(scope: "local" | "global" | "others" = "local") {
    const supabase = createClient();

    return Promise.race([
        supabase.auth.signOut({ scope }),
        new Promise<{ error: Error }>((resolve) => {
            window.setTimeout(() => {
                resolve({ error: new Error(`Client sign-out timed out after ${CLIENT_SIGN_OUT_TIMEOUT_MS}ms`) });
            }, CLIENT_SIGN_OUT_TIMEOUT_MS);
        }),
    ]);
}

/**
 * Unified sign-out function supporting multi-device scopes.
 *
 * Scopes:
 * - 'local' (default): Clears current browser/tab session only. Other devices remain logged in.
 * - 'others': Invalidate all other device sessions while keeping the current device active.
 * - 'global': Completely terminates sessions on all devices for security lockout.
 *
 * Use this function from client components for consistent multi-device auth behavior.
 */
export async function signOut(options: SignOutOptions = {}) {
    const { scope = "local", broadcast = true } = options;

    try {
        const { error } = await signOutWithTimeout(scope);
        if (error) {
            console.error(`Supabase ${scope} signOut failed:`, error);
        }
    } catch (error) {
        console.error("Unexpected signOut error:", error);
    }

    if (broadcast && typeof window !== "undefined") {
        broadcastAuthEvent({ type: "SIGNED_OUT", scope });
    }

    if (scope === "others") {
        return;
    }

    // Clear any app-specific localStorage/sessionStorage data
    try {
        Object.keys(localStorage).forEach((key) => {
            if (key.startsWith("supabase.") || key.includes("auth") || key.includes("session")) {
                localStorage.removeItem(key);
            }
        });
        Object.keys(sessionStorage).forEach((key) => {
            if (key.startsWith("supabase.") || key.includes("auth") || key.includes("session")) {
                sessionStorage.removeItem(key);
            }
        });
    } catch (e) {
        console.warn("Could not clear custom storage:", e);
    }

    // Route logout through the server so middleware-visible cookies are cleared
    const timestamp = Date.now();
    window.location.replace(`/auth/logout?logout=${timestamp}`);
}

/**
 * Update tenant password and mark account as claimed.
 *
 * This function:
 * 1. Updates the user's password in Supabase Auth
 * 2. Marks has_changed_password = true through the tenant profile API
 *
 * Call this when a tenant changes their password for the first time.
 * This ensures the landlord can no longer resend credentials for this account.
 */
export async function updateTenantPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
        const supabase = createClient()

        // Step 1: Update the password in Supabase Auth
        const { error: authError } = await supabase.auth.updateUser({
            password: newPassword,
        })

        if (authError) {
            console.error('[updateTenantPassword] Auth update failed:', authError)
            return { success: false, error: authError.message }
        }

        const claimResponse = await fetch('/api/tenant/profile', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ has_changed_password: true }),
        })

        if (!claimResponse.ok) {
            const responseBody = await claimResponse.json().catch(() => null)
            console.error('[updateTenantPassword] Account claim update failed:', responseBody)
            return { success: false, error: 'Password updated but failed to mark account as claimed. Please refresh the page.' }
        }

        return { success: true }
    } catch (error) {
        console.error('[updateTenantPassword] Unexpected error:', error)
        return { success: false, error: 'An unexpected error occurred' }
    }
}
