/**
 * Test Account Provisioning CLI Utility
 * 
 * Creates clean, production-grade test accounts (Landlord or Tenant) directly
 * in Supabase Auth and public.profiles without polluting the database with
 * pre-seeded properties, fake leases, or bypassed setup steps.
 * 
 * Usage:
 *   npx tsx scripts/create-test-account.ts --role landlord --email new.landlord@ireside.ph --password Password123! --name "Juan Valenzuela"
 *   npx tsx scripts/create-test-account.ts --role tenant --email new.tenant@ireside.ph --password Password123! --name "Maria Santos"
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables from .env.local first, fallback to .env
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("\x1b[31m%s\x1b[0m", "Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

function parseArgs() {
    const args = process.argv.slice(2);
    const parsed: Record<string, string> = {};

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith("--")) {
            const key = arg.slice(2);
            const value = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true";
            parsed[key] = value;
        }
    }
    return parsed;
}

async function main() {
    const args = parseArgs();

    const isTurnkeyDefault = args["turnkey-default"] === "true" || args.turnkey === "true";
    const role = (isTurnkeyDefault ? "landlord" : (args.role?.toLowerCase() === "tenant" ? "tenant" : "landlord")) as "landlord" | "tenant";
    const timestamp = Date.now().toString().slice(-4);
    const defaultEmail = isTurnkeyDefault 
        ? "admin@turnkey.local" 
        : (role === "landlord" ? `test.landlord.${timestamp}@ireside.ph` : `test.tenant.${timestamp}@ireside.ph`);
    const email = (args.email || defaultEmail).toLowerCase().trim();
    const password = args.password || (isTurnkeyDefault ? "TurnkeyAdmin2026!" : "Password123!");
    const name = args.name || (isTurnkeyDefault ? "Default Admin" : (role === "landlord" ? "Test Landlord" : "Test Resident"));
    const phone = args.phone || (role === "landlord" ? "0917-888-1234" : "0918-555-4321");

    console.log("\n=======================================================");
    console.log("🛠️   iReside Test Account Provisioning Utility");
    console.log("=======================================================");
    console.log(`Role:      \x1b[36m${role.toUpperCase()}\x1b[0m`);
    console.log(`Email:     \x1b[32m${email}\x1b[0m`);
    console.log(`Password:  \x1b[33m${password}\x1b[0m`);
    console.log(`Full Name: ${name}`);
    console.log(`Phone:     ${phone}`);
    console.log("-------------------------------------------------------");

    // 1. Check if auth user already exists
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
        console.error("\x1b[31m%s\x1b[0m", `Failed to query existing auth users: ${listError.message}`);
        process.exit(1);
    }

    const existingUser = users?.find(u => u.email?.toLowerCase() === email);
    let userId: string;

    if (existingUser) {
        console.log(`ℹ️  Auth user with email ${email} already exists (${existingUser.id}). Updating credentials and metadata...`);
        userId = existingUser.id;

        const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
            password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                role,
                phone,
            },
        });

        if (updateError) {
            console.error("\x1b[31m%s\x1b[0m", `Failed to update auth user: ${updateError.message}`);
            process.exit(1);
        }
    } else {
        console.log(`Creating fresh auth user in Supabase...`);
        const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: name,
                role,
                phone,
            },
        });

        if (createError || !newUser?.user) {
            console.error("\x1b[31m%s\x1b[0m", `Failed to create auth user: ${createError?.message}`);
            process.exit(1);
        }
        userId = newUser.user.id;
    }

    // 2. Upsert profile row in public.profiles
    console.log(`Syncing profile record in public.profiles...`);
    const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
            id: userId,
            email,
            full_name: name,
            role,
            phone,
        }, { onConflict: "id" });

    if (profileError) {
        console.error("\x1b[31m%s\x1b[0m", `Failed to upsert profile: ${profileError.message}`);
        process.exit(1);
    }

    console.log("\x1b[32m%s\x1b[0m", "✓ Account provisioned successfully!");
    console.log("=======================================================");
    console.log("📋  Login Credentials:");
    console.log(`    URL:      http://localhost:3000/login`);
    console.log(`    Email:    ${email}`);
    console.log(`    Password: ${password}`);
    console.log("=======================================================");
    if (role === "landlord") {
        console.log("🚀  Next Steps for Testing Landlord Setup:");
        console.log("    1. Open a clean browser window at http://localhost:3000/login");
        console.log("    2. Log in with the credentials above.");
        console.log("    3. Follow the Business Personalization Wizard at http://localhost:3000/setup.");
        console.log("    4. Setup your property spatial unit map at http://localhost:3000/landlord/unit-map.");
        console.log("    5. Configure GCash payment destination in http://localhost:3000/landlord/settings.");
    } else {
        console.log("🚀  Next Steps for Testing Tenant Flow:");
        console.log("    1. Log in at http://localhost:3000/login");
        console.log("    2. If no active lease exists yet, you will be guided to complete onboarding.");
    }
    console.log("=======================================================\n");
}

main().catch((err) => {
    console.error("Unexpected error:", err);
    process.exit(1);
});
