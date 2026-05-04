const SUPABASE_URL = "https://hlpgsiqyrtndqdgvttcr.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscGdzaXF5cnRuZHFkZ3Z0dGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc5MiwiZXhwIjoyMDg2NjkzNzkyfQ._9HWOS8dxsbdbBlcMOFVpMPiGn8meeMqAP7-Cvn_Ro8";

async function testUploads() {
    const folders = ["identity", "permit", "permit-card", "ownership"];
    const content = Buffer.from("test content");

    for (const folder of folders) {
        try {
            const fileName = `${folder}/test-${Date.now()}.txt`;
            const response = await fetch(`${SUPABASE_URL}/storage/v1/object/landlord-documents/${fileName}`, {
                method: "POST",
                headers: {
                    "apikey": SERVICE_ROLE_KEY,
                    "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
                    "Content-Type": "text/plain"
                },
                body: content
            });

            if (response.ok) {
                console.log(`Upload to ${folder} SUCCESS`);
            } else {
                const err = await response.json();
                console.error(`Upload to ${folder} FAILED:`, err);
            }
        } catch (err) {
            console.error(`Upload to ${folder} ERROR:`, err);
        }
    }
}

testUploads();
