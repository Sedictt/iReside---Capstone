const SUPABASE_URL = "https://hlpgsiqyrtndqdgvttcr.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscGdzaXF5cnRuZHFkZ3Z0dGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc5MiwiZXhwIjoyMDg2NjkzNzkyfQ._9HWOS8dxsbdbBlcMOFVpMPiGn8meeMqAP7-Cvn_Ro8";

async function findNonEmpty() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/landlord_applications?select=id,identity_document_url,business_permit_url,business_permit_card_url,ownership_document_url&order=created_at.desc&limit=5`, {
            headers: {
                "apikey": SERVICE_ROLE_KEY,
                "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
            }
        });

        const data = await response.json();
        console.log('Last 5 registrations document URLs:');
        data.forEach((row, i) => {
            console.log(`[${i}] ID: ${row.id}`);
            console.log(`    Identity: ${row.identity_document_url ? 'YES' : 'null'}`);
            console.log(`    Permit:   ${row.business_permit_url ? 'YES' : 'null'}`);
            console.log(`    Card:     ${row.business_permit_card_url ? 'YES' : 'null'}`);
            console.log(`    Owner:    ${row.ownership_document_url ? 'YES' : 'null'}`);
        });
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

findNonEmpty();
