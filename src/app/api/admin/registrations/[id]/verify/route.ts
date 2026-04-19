import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchValenzuelaBusinessDatabank, generateValenzuelaSearchURL } from "@/lib/business-verification";

async function assertAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (error || !user) return { error: "Unauthorized" as const };

    const adminClient = createAdminClient();
    const { data: profile } = await adminClient.from("profiles").select("role").eq("id", user.id).maybeSingle();

    if (profile?.role !== "admin") return { error: "Forbidden" as const };

    return { error: null };
}

export async function POST(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const auth = await assertAdmin();
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { id } = await context.params;
    const body = await request.json().catch(() => null);
    const businessName = body?.businessName as string | undefined;

    if (!businessName) {
        return NextResponse.json({ error: "Business name is required for verification." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    const { data: registration, error: registrationError } = await adminClient
        .from("landlord_applications")
        .select("id")
        .eq("id", id)
        .maybeSingle();

    if (registrationError || !registration) {
        return NextResponse.json({ error: "Registration not found." }, { status: 404 });
    }

    try {
        const verificationResult = await searchValenzuelaBusinessDatabank(businessName);

        // Map to the DB column's allowed enum
        const dbStatus: 'not_verified' | 'verified' | 'not_found' | 'error' =
            verificationResult.status === 'found' ? 'verified' :
            verificationResult.status === 'not_found' ? 'not_found' : 'error';

        // Persist the search result so the admin can revisit it
        await adminClient
            .from("landlord_applications")
            .update({
                business_name: businessName,
                verification_status: dbStatus,
                verification_data: { rows: verificationResult.rows } as any,
                verification_checked_at: verificationResult.checkedAt,
                verification_notes: verificationResult.error || null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        const manualSearchURL = generateValenzuelaSearchURL(businessName);

        return NextResponse.json({
            verification: verificationResult,
            manualSearchURL,
        });
    } catch (error) {
        console.error("Error during business verification:", error);

        await adminClient
            .from("landlord_applications")
            .update({
                verification_status: "error",
                verification_notes: error instanceof Error ? error.message : "Unknown verification error",
                verification_checked_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("id", id);

        return NextResponse.json(
            { error: "Verification failed. Please try again or use manual verification." },
            { status: 500 }
        );
    }
}

export async function GET(
    request: Request,
    context: { params: Promise<{ id: string }> }
) {
    const auth = await assertAdmin();
    if (auth.error) {
        return NextResponse.json({ error: auth.error }, { status: auth.error === "Unauthorized" ? 401 : 403 });
    }

    const { id } = await context.params;
    const adminClient = createAdminClient();

    const { data: registration, error: registrationError } = await adminClient
        .from("landlord_applications")
        .select("id, business_name")
        .eq("id", id)
        .maybeSingle();

    if (registrationError || !registration) {
        return NextResponse.json({ error: "Registration not found." }, { status: 404 });
    }

    const manualSearchURL = registration.business_name
        ? generateValenzuelaSearchURL(registration.business_name)
        : null;

    return NextResponse.json({ registration, manualSearchURL });
}
