import { createAdminClient } from "@/lib/supabase/admin";

async function syncPermitCard() {
    const adminClient = createAdminClient();

    // Find the most recent landlord application with a card URL
    const { data: rawApplication, error: appError } = await adminClient
        .from("landlord_applications")
        .select("*")
        .eq("status", "approved")
        .not("profile_id", "is", null)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

    const application = rawApplication as any;

    if (appError || !application) {
        console.error("No suitable application found:", appError?.message || "Not found");
        return;
    }

    const cardUrl = (application as any).business_permit_card_url || application.business_permit_url;

    if (!cardUrl) {
        console.log("No permit URL found in application.");
        return;
    }

    console.log(`Syncing permit URL for profile ${application.profile_id}: ${cardUrl}`);

    const { error: profileError } = await adminClient
        .from("profiles")
        .update({
            business_permit_url: cardUrl,
            updated_at: new Date().toISOString(),
        })
        .eq("id", application.profile_id);

    if (profileError) {
        console.error("Failed to sync profile:", profileError.message);
    } else {
        console.log("Successfully updated profile with the permit card URL.");
    }
}

syncPermitCard();
