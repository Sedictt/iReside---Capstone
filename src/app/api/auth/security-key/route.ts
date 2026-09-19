import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { generateSecurityKey, encryptSecurityKey } from "@/lib/security/recovery-keys";
import { logUserActivity } from "@/lib/audit/audit-logger";

/**
 * GET /api/auth/security-key
 * Returns status of whether current user has an active security recovery key.
 */
export async function GET(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;

    try {
        const adminClient = createServiceRoleSupabaseClient();
        const { data: securitySettings, error } = await (adminClient as any)
            .from("user_security_settings")
            .select("security_key_encrypted, security_key_updated_at")
            .eq("profile_id", userId)
            .maybeSingle();

        if (error) {
            console.error("[SecurityKey GET] Error querying settings:", error);
            return NextResponse.json({ error: "Failed to fetch security key status" }, { status: 500 });
        }

        const hasSecurityKey = !!securitySettings?.security_key_encrypted;
        const updatedAt = securitySettings?.security_key_updated_at || null;

        return NextResponse.json({
            hasSecurityKey,
            updatedAt,
        });
    } catch (err: any) {
        console.error("[SecurityKey GET] Unexpected error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

/**
 * POST /api/auth/security-key
 * Generates and encrypts an initial security recovery key for the authenticated user during onboarding/setup.
 * The plaintext key is returned once so the user can download/copy it.
 */
export async function POST(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, userRole } = authContext;

    try {
        const adminClient = createServiceRoleSupabaseClient();

        // 1. Generate new high-entropy Base32 security key
        const plaintextKey = generateSecurityKey();
        const encrypted = encryptSecurityKey(plaintextKey);
        const timestamp = new Date().toISOString();

        // 2. Upsert into user_security_settings
        const { error: upsertError } = await (adminClient as any)
            .from("user_security_settings")
            .upsert(
                {
                    profile_id: userId,
                    security_key_encrypted: encrypted.encrypted,
                    security_key_iv: encrypted.iv,
                    security_key_auth_tag: encrypted.authTag,
                    security_key_updated_at: timestamp,
                    security_key_failed_attempts: 0,
                    security_key_locked_until: null,
                    updated_at: timestamp,
                },
                { onConflict: "profile_id" }
            );

        if (upsertError) {
            console.error("[SecurityKey POST] Failed to save key:", upsertError);
            return NextResponse.json({ error: "Failed to register security key" }, { status: 500 });
        }

        // 3. Log security event in audit logs
        await logUserActivity({
            userId,
            userRole: (userRole as any) || "tenant",
            action: "security_key_generated",
            category: "security",
            title: "Security Recovery Key Created",
            description: "An initial single-use AES-256 encrypted security recovery key was generated during account setup.",
            severity: "info",
        });

        return NextResponse.json({
            securityKey: plaintextKey,
            updatedAt: timestamp,
        });
    } catch (err: any) {
        console.error("[SecurityKey POST] Unexpected error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
