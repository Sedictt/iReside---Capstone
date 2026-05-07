const SUPABASE_URL = "https://hlpgsiqyrtndqdgvttcr.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhscGdzaXF5cnRuZHFkZ3Z0dGNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTExNzc5MiwiZXhwIjoyMDg2NjkzNzkyfQ._9HWOS8dxsbdbBlcMOFVpMPiGn8meeMqAP7-Cvn_Ro8";

const LEASE_ID = "9102c536-4813-4575-9225-c203df2f2926";

async function resetLease() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/leases?id=eq.${LEASE_ID}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Prefer": "return=minimal"
    },
    body: JSON.stringify({
      landlord_signature: null,
      tenant_signature: null,
      status: "pending_signature",
      signed_at: null,
      tenant_signed_at: null,
      landlord_signed_at: null,
      signed_document_url: null,
      signature_lock_version: 0
    })
  });

  if (response.ok) {
    console.log("Lease reset successfully");
  } else {
    const error = await response.text();
    console.error("Failed to reset lease:", error);
  }
}

resetLease();