import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchValenzuelaBusinessDatabank, generateValenzuelaSearchURL, type BusinessVerificationResult } from "@/lib/business-verification";

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
    const businessAddress = body?.businessAddress as string | undefined;

    if (!businessName) {
        return NextResponse.json({ error: "Business name is required for verification." }, { status: 400 });
    }

    const adminClient = createAdminClient();
    
    // First, get the registration record
    const { data: registration, error: registrationError } = await adminClient
        .from("landlord_applications")
        .select(`
            id,
            profile_id,
            business_name,
            business_address,
            verification_status,
            verification_data,
            verification_checked_at,
            verification_notes
        `)
        .eq("id", id)
        .maybeSingle();

    if (registrationError || !registration) {
        return NextResponse.json({ error: "Registration not found." }, { status: 404 });
    }

    try {
        // Perform verification search
        const verificationResult: BusinessVerificationResult = await searchValenzuelaBusinessDatabank(
            businessName,
            businessAddress
        );

        // Update the registration with verification results
        const { data: updatedRegistration, error: updateError } = await adminClient
            .from("landlord_applications")
            .update({
                business_name: businessName,
                business_address: businessAddress || null,
                verification_status: verificationResult.status,
                verification_data: verificationResult.data || null,
                verification_checked_at: verificationResult.checkedAt,
                verification_notes: verificationResult.error || null,
                updated_at: new Date().toISOString(),
            })
            .eq("id", id)
            .select(`
                id,
                profile_id,
                business_name,
                business_address,
                verification_status,
                verification_data,
                verification_checked_at,
                verification_notes
            `)
            .maybeSingle();

        if (updateError || !updatedRegistration) {
            return NextResponse.json({ error: "Failed to update registration with verification results." }, { status: 500 });
        }

        // Generate manual search URL as fallback
        const manualSearchURL = generateValenzuelaSearchURL(businessName, businessAddress);

        return NextResponse.json({
            registration: updatedRegistration,
            verification: verificationResult,
            manualSearchURL,
        });
    } catch (error) {
        console.error("Error during business verification:", error);
        
        // Update registration with error status
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

    // Get the registration with verification data
    const { data: registration, error: registrationError } = await adminClient
        .from("landlord_applications")
        .select(`
            id,
            profile_id,
            business_name,
            business_address,
            verification_status,
            verification_data,
            verification_checked_at,
            verification_notes
        `)
        .eq("id", id)
        .maybeSingle();

    if (registrationError || !registration) {
        return NextResponse.json({ error: "Registration not found." }, { status: 404 });
    }

    // Generate manual search URL if business name exists
    const manualSearchURL = registration.business_name
        ? generateValenzuelaSearchURL(registration.business_name, registration.business_address || undefined)
        : null;

    return NextResponse.json({
        registration,
        manualSearchURL,
    });
}
