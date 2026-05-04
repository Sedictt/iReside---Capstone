import { createClient } from "@supabase/supabase-js";

// ============================================================
// CONFIG — fill these in before running
// ============================================================
const REMOTE_URL = "https://hlpgsiqyrtndqdgvttcr.supabase.co";
const REMOTE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscGdzaXF5cnRuZHFkZ3Z0dGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc5MiwiZXhwIjoyMDg2NjkzNzkyfQ._9HWOS8dxsbdbBlcMOFVpMPiGn8meeMqAP7-Cvn_Ro8";

const LOCAL_URL = "http://localhost:54321";
const LOCAL_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"; // from `supabase status`
// ============================================================

const remote = createClient(REMOTE_URL, REMOTE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

const local = createClient(LOCAL_URL, LOCAL_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

async function listAllFiles(client, bucket, folder = "") {
    const { data, error } = await client.storage.from(bucket).list(folder, {
        limit: 1000,
        offset: 0,
    });

    if (error) throw new Error(`Failed to list files in ${bucket}/${folder}: ${error.message}`);
    if (!data) return [];

    const files = [];

    for (const item of data) {
        const fullPath = folder ? `${folder}/${item.name}` : item.name;

        if (item.id === null) {
            // it's a folder — recurse
            const nested = await listAllFiles(client, bucket, fullPath);
            files.push(...nested);
        } else {
            files.push(fullPath);
        }
    }

    return files;
}

async function syncBucket(bucketName, isPublic) {
    console.log(`\n📦 Syncing bucket: ${bucketName}`);

    // Create bucket locally if it doesn't exist
    const { error: createError } = await local.storage.createBucket(bucketName, {
        public: isPublic,
    });

    if (createError && !createError.message.includes("already exists")) {
        console.error(`  ❌ Failed to create bucket: ${createError.message}`);
        return;
    }

    // List all files in remote bucket
    const files = await listAllFiles(remote, bucketName);
    console.log(`  Found ${files.length} file(s)`);

    for (const filePath of files) {
        try {
            // Download from remote
            const { data, error: downloadError } = await remote.storage
                .from(bucketName)
                .download(filePath);

            if (downloadError) {
                console.error(`  ❌ Download failed [${filePath}]: ${downloadError.message}`);
                continue;
            }

            // Upload to local
            const { error: uploadError } = await local.storage
                .from(bucketName)
                .upload(filePath, data, { upsert: true });

            if (uploadError) {
                console.error(`  ❌ Upload failed [${filePath}]: ${uploadError.message}`);
                continue;
            }

            console.log(`  ✅ ${filePath}`);
        } catch (err) {
            console.error(`  ❌ Unexpected error [${filePath}]: ${err.message}`);
        }
    }
}

async function main() {
    console.log("🚀 Starting Supabase storage sync: remote → local\n");

    // Get all remote buckets
    const { data: buckets, error } = await remote.storage.listBuckets();
    if (error) {
        console.error("❌ Failed to list remote buckets:", error.message);
        process.exit(1);
    }

    console.log(`Found ${buckets.length} bucket(s): ${buckets.map((b) => b.name).join(", ")}`);

    for (const bucket of buckets) {
        await syncBucket(bucket.name, bucket.public);
    }

    console.log("\n✅ Sync complete!");
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});