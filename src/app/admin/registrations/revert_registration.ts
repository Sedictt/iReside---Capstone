import { createAdminClient } from "@/lib/supabase/admin";

async function revertRegistration() {
    const adminClient = createAdminClient();

    // Find the most recent approved registration
    const { data: registration, error: findError } = await adminClient
        .from("landlord_applications")
        .select("id, email, full_name, status")
        .eq("status", "approved")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (findError || !registration) {
        console.error("No approved registration found:", findError?.message || "Not found");
        return;
    }

    console.log(`Found approved registration: ${registration.full_name} (${registration.email})`);

    // Reset status to pending and clear onboarding tokens
    const { error: updateError } = await adminClient
        .from("landlord_applications")
        .update({
            status: "pending",
            onboarding_token: null,
            onboarding_token_expires_at: null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", registration.id);

    if (updateError) {
        console.error("Failed to revert registration:", updateError.message);
    } else {
        console.log(`Successfully reverted registration ${registration.id} back to PENDING.`);
    }
}

revertRegistration();
