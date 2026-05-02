import * as dotenv from "dotenv";
import * as path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../src/lib/supabase/admin";

async function checkAndFixProperty() {
    const adminClient = createAdminClient();
    const email = "venoxyarts@gmail.com";

    console.log(`Checking property for ${email}...`);
    
    // Get profile ID
    const { data: profile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("email", email)
        .maybeSingle();

    if (!profile) {
        console.error("Profile not found.");
        return;
    }

    // Check if property exists
    let { data: property } = await adminClient
        .from("properties")
        .select("id, type")
        .eq("landlord_id", profile.id)
        .maybeSingle();

    if (!property) {
        console.log("Property NOT found. Creating it from registration...");
        
        const { data: application } = await adminClient
            .from("landlord_applications")
            .select("business_name, business_address")
            .eq("email", email)
            .maybeSingle();

        if (application) {
            const { data: newProperty, error: insertError } = await adminClient
                .from("properties")
                .insert({
                    landlord_id: profile.id,
                    name: application.business_name || "My Property",
                    address: application.business_address || "No Address",
                })
                .select()
                .single();

            if (insertError) {
                console.error("Failed to create property:", insertError);
                return;
            } else {
                console.log(`Successfully created property: ${newProperty.id}`);
                property = newProperty;
            }
        } else {
            console.error("Registration application not found.");
            return;
        }
    } else {
        console.log(`Property found: ${property.id}`);
    }

    // Initialize environment policies with defaults
    console.log("Initializing property environment policies...");
    const { error: policyError } = await adminClient
        .from("property_environment_policies")
        .upsert({
            property_id: property.id,
            environment_mode: property.type || "residential", // Fallback to residential
            payment_profile_defaults: {
                dueDay: 5,
                allowPartialPayments: false,
                lateFeeAmount: 0,
                lateFeeDays: 0,
            },
        }, { onConflict: "property_id" });

    if (policyError) {
        console.error("Failed to create policies:", policyError);
    } else {
        console.log("Successfully initialized property policies.");
    }
}

checkAndFixProperty();
