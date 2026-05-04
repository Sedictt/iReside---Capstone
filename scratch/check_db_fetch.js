const SUPABASE_URL = "https://hlpgsiqyrtndqdgvttcr.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscGdzaXF5cnRuZHFkZ3Z0dGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc5MiwiZXhwIjoyMDg2NjkzNzkyfQ._9HWOS8dxsbdbBlcMOFVpMPiGn8meeMqAP7-Cvn_Ro8";

async function checkColumns() {
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/landlord_applications?select=*&limit=1`, {
            headers: {
                "apikey": SERVICE_ROLE_KEY,
                "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
            }
        });

        if (!response.ok) {
            const err = await response.json();
            console.error('Error fetching data:', err);
            return;
        }

        const data = await response.json();
        if (data && data.length > 0) {
            console.log('Columns found in landlord_applications:', Object.keys(data[0]));
        } else {
            console.log('No data in landlord_applications table.');
        }
    } catch (err) {
        console.error('Fetch error:', err);
    }
}

checkColumns();
