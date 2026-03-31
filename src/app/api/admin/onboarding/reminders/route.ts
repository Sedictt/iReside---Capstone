import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    ensureOnboardingReadyForReminder,
    registerReminderAttempt,
    type TenantOnboardingState,
} from "@/lib/onboarding";
import { sendTenantOnboardingReminder } from "@/lib/email";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

const isSecretAuthorized = (request: Request) => {
    const configuredSecret = process.env.ONBOARDING_REMINDER_CRON_SECRET;
    if (!configuredSecret) return false;

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) return false;
    const token = authHeader.slice("Bearer ".length);
    return token === configuredSecret;
};

const resolveAdminUser = async (supabase: any) => {
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;

    const metadataRole = user.user_metadata?.role;
    if (metadataRole === "admin") return user;

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    if (profile?.role === "admin") {
        return user;
    }

    return null;
};

export async function POST(request: Request) {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const secretAuthorized = isSecretAuthorized(request);
    const adminUser = secretAuthorized ? null : await resolveAdminUser(supabase);

    if (!secretAuthorized && !adminUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: rows, error } = await (adminClient as any)
        .from("tenant_onboarding_states")
        .select(
            "tenant_id, status, steps, current_step, step_data, started_at, completed_at, last_reminder_sent_at, reminder_send_count, reminder_window_started_at"
        )
        .in("status", ["pending", "in_progress"])
        .order("last_reminder_sent_at", { ascending: true, nullsFirst: true })
        .limit(500);

    if (error) {
        return NextResponse.json({ error: `Failed to fetch onboarding states: ${error.message}` }, { status: 500 });
    }

    let processed = 0;
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const row of rows ?? []) {
        processed += 1;
        const state = row as TenantOnboardingState;
        const eligibility = ensureOnboardingReadyForReminder(state);

        if (!eligibility.eligible) {
            skipped += 1;
            continue;
        }

        const { data: tenantProfile } = await adminClient
            .from("profiles")
            .select("id, email, full_name")
            .eq("id", row.tenant_id)
            .maybeSingle();

        if (!tenantProfile?.email) {
            skipped += 1;
            continue;
        }

        try {
            await sendTenantOnboardingReminder({
                to: tenantProfile.email,
                tenantName: tenantProfile.full_name || "Tenant",
                onboardingUrl: `${APP_URL}/tenant/onboarding`,
            });

            await registerReminderAttempt(adminClient as any, {
                tenantId: row.tenant_id,
                actorId: adminUser?.id ?? null,
                triggerSource: "automated",
                success: true,
                metadata: {
                    channel: "scheduled_job",
                },
            });

            sent += 1;
        } catch (sendError) {
            failed += 1;
            await registerReminderAttempt(adminClient as any, {
                tenantId: row.tenant_id,
                actorId: adminUser?.id ?? null,
                triggerSource: "automated",
                success: false,
                metadata: {
                    channel: "scheduled_job",
                    error: sendError instanceof Error ? sendError.message : "unknown_error",
                },
            });
        }
    }

    return NextResponse.json({
        success: true,
        processed,
        sent,
        skipped,
        failed,
    });
}
