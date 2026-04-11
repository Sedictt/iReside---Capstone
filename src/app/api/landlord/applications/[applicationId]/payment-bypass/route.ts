import { NextResponse } from "next/server";

import {
    applyPaymentPendingExpiry,
    areRequiredPaymentRequestsCompleted,
    logApplicationPaymentAudit,
} from "@/lib/application-payment-pending";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

type RouteContext = {
    params: Promise<{ applicationId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
    const { applicationId } = await context.params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { password?: string; reason?: string };
    const password = typeof body.password === "string" ? body.password : "";
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!password) {
        return NextResponse.json({ error: "Password is required for bypass." }, { status: 400 });
    }
    if (reason.length < 10) {
        return NextResponse.json({ error: "A detailed bypass reason is required (at least 10 characters)." }, { status: 400 });
    }

    const { data: application, error: applicationError } = await adminClient
        .from("applications")
        .select("id, status, landlord_id")
        .eq("id", applicationId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (applicationError || !application) {
        return NextResponse.json({ error: "Application not found." }, { status: 404 });
    }

    const expiryResult = await applyPaymentPendingExpiry(adminClient, application.id);
    if (expiryResult.expired) {
        return NextResponse.json(
            { error: "Payment window has expired and the application was moved back to reviewing." },
            { status: 409 }
        );
    }

    if (application.status !== "payment_pending") {
        return NextResponse.json({ error: "Application is not in payment-pending stage." }, { status: 409 });
    }

    if (!user.email) {
        return NextResponse.json({ error: "Unable to verify password for this account." }, { status: 400 });
    }

    const verify = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
    });

    if (verify.error || !verify.data.user || verify.data.user.id !== user.id) {
        return NextResponse.json({ error: "Password verification failed." }, { status: 401 });
    }

    const nowIso = new Date().toISOString();
    const reviewNote = `Bypass confirmed by landlord. Reason: ${reason}`;
    const { data: requests, error: requestsError } = await adminClient
        .from("application_payment_requests")
        .select("id, requirement_type, status")
        .eq("application_id", application.id)
        .in("requirement_type", ["advance_rent", "security_deposit"]);

    if (requestsError || !requests || requests.length === 0) {
        return NextResponse.json({ error: "No payment requests found for bypass." }, { status: 404 });
    }

    for (const row of requests) {
        const bypassUpdate: Record<string, unknown> = {
            status: "completed",
            bypassed: true,
            reviewed_at: nowIso,
            reviewed_by: user.id,
            review_note: reviewNote,
            submitted_at: nowIso,
        };
        if (row.status !== "completed") {
            bypassUpdate.method = "cash";
        }

        const { error: updateError } = await adminClient
            .from("application_payment_requests")
            .update(bypassUpdate)
            .eq("id", row.id)
            .eq("application_id", application.id);

        if (updateError) {
            return NextResponse.json({ error: "Failed to apply bypass to all payment requests." }, { status: 500 });
        }

        await logApplicationPaymentAudit(adminClient, {
            application_id: application.id,
            payment_request_id: row.id,
            actor_id: user.id,
            actor_role: "landlord",
            event_type: "bypass_used",
            metadata: {
                reason,
                requirement_type: row.requirement_type,
            },
        });
    }

    const { data: allRequests } = await adminClient
        .from("application_payment_requests")
        .select("requirement_type, status")
        .eq("application_id", application.id);

    return NextResponse.json({
        success: true,
        allConfirmed: areRequiredPaymentRequestsCompleted(allRequests ?? []),
    });
}
