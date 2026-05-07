import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { createAdminClient } from "../src/lib/supabase/admin";

async function activateLease() {
  const adminClient = createAdminClient();
  
  const leaseId = "40675cbc-7d65-4b21-bedb-70112380d3ab";
  const tenantId = "804d8f41-635b-4766-abf6-67d8b8b5ad43";
  const landlordId = "8bd74e3c-5ad3-4d4b-aa19-68c5650911af";

  console.log(`Activating lease ${leaseId} for tenant ${tenantId}...`);

  // 1. Update lease status to active
  const { data: lease, error: leaseError } = await adminClient
    .from("leases")
    .update({
      status: "active",
      updated_at: new Date().toISOString()
    })
    .eq("id", leaseId)
    .select()
    .single();

  if (leaseError) {
    console.error("Error updating lease:", leaseError);
    return;
  }

  console.log("Lease activated successfully.");

  // 2. Find and update the associated application to 'approved' if not already
  const { data: application, error: appError } = await adminClient
    .from("applications")
    .update({
      status: "approved",
      lease_id: leaseId,
      applicant_id: tenantId
    })
    .eq("lease_id", leaseId)
    .select();

  if (appError) {
    console.error("Error updating application:", appError);
  } else {
    console.log("Application(s) updated successfully.");
  }
}

activateLease().catch(console.error);
