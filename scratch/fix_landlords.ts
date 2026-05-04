import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { createAdminClient } from "../src/lib/supabase/admin";

async function fixUnconfirmedLandlords() {
    const adminClient = createAdminClient();
    
    console.log("Fetching approved landlords...");
    const { data: applications, error: appError } = await adminClient
        .from("landlord_applications")
        .select("email, profile_id")
        .eq("status", "approved");

    if (appError) {
        console.error("Error fetching applications:", appError);
        return;
    }

    console.log(`Found ${applications?.length || 0} approved landlords.`);

    const { data: { users }, error: usersError } = await adminClient.auth.admin.listUsers();
    if (usersError) {
        console.error("Error listing users:", usersError);
        return;
    }

    let fixedCount = 0;
    for (const app of applications || []) {
        const email = app.email;
        if (!email) continue;

        const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());
        if (user && !user.email_confirmed_at) {
            console.log(`Confirming user: ${email} (${user.id})`);
            const { error: updateError } = await adminClient.auth.admin.updateUserById(
                user.id,
                { email_confirm: true }
            );
            if (updateError) {
                console.error(`Failed to confirm ${email}:`, updateError);
            } else {
                console.log(`Successfully confirmed ${email}`);
                fixedCount++;
            }
        }
    }
    
    console.log(`Done. Fixed ${fixedCount} users.`);
}

fixUnconfirmedLandlords();
