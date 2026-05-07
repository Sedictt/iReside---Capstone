const SUPABASE_URL = "https://hlpgsiqyrtndqdgvttcr.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscGdzaXF5cnRuZHFkZ3Z0dGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc5MiwiZXhwIjoyMDg2NjkzNzkyfQ._9HWOS8dxsbdbBlcMOFVpMPiGn8meeMqAP7-Cvn_Ro8";

const LEASE_ID = "9102c536-4813-4575-9225-c203df2f2926";

async function resetApplication() {
  // First get the application linked to this lease
  const getRes = await fetch(
    `${SUPABASE_URL}/rest/v1/applications?lease_id=eq.${LEASE_ID}&select=id,status,compliance_checklist`,
    {
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`
      }
    }
  );
  
  const apps = await getRes.json();
  console.log("Found applications:", apps);
  
  if (apps.length > 0) {
    const app = apps[0];
    const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.${app.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        status: "pending_approval",
        compliance_checklist: {
          ...app.compliance_checklist,
          lease_signed: false,
          application_completed: false
        }
      })
    });
    
    if (updateRes.ok) {
      console.log("Application reset successfully");
    }
  }
}

resetApplication();