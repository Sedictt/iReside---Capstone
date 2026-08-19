import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";

// Load environment variables from .env.local or .env
config({ path: path.resolve(process.cwd(), ".env.local") });
config({ path: path.resolve(process.cwd(), ".env") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing Supabase credentials in .env or .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function seedNotifications() {
  console.log("Fetching existing user profiles...");
  const { data: profiles, error: profileErr } = await supabase
    .from("profiles")
    .select("id, full_name, role, email");

  if (profileErr) {
    console.error("Failed to fetch profiles:", profileErr);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.warn("No profiles found in the database.");
    return;
  }

  console.log(`Found ${profiles.length} user profile(s).`);

  const notificationsToInsert = [];
  const now = Date.now();

  for (const user of profiles) {
    const isLandlord = user.role === "landlord";

    if (isLandlord) {
      // Landlord notification set
      notificationsToInsert.push(
        {
          user_id: user.id,
          type: "application",
          title: "New Application Received",
          message: "Sarah Jenkins submitted a rental application for Unit 302, Maple Heights.",
          read: false,
          data: { applicationId: "app-302", applicantName: "Sarah Jenkins", unit: "302" },
          created_at: new Date(now - 1000 * 60 * 15).toISOString(), // 15 mins ago
        },
        {
          user_id: user.id,
          type: "payment",
          title: "Payment Received",
          message: "Rent payment of ₱24,500.00 confirmed for Unit 104 via GCash.",
          read: false,
          data: { amount: 24500, unit: "104", method: "GCash" },
          created_at: new Date(now - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        },
        {
          user_id: user.id,
          type: "maintenance",
          title: "Urgent: Water Leak Reported",
          message: "Tenant in Unit 201 reported an active pipe leak under the bathroom sink.",
          read: false,
          data: { priority: "urgent", unit: "201", category: "plumbing" },
          created_at: new Date(now - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        },
        {
          user_id: user.id,
          type: "lease",
          title: "Lease Signed by Tenant",
          message: "David Chen signed the 12-month lease agreement for Unit 501.",
          read: true,
          data: { leaseId: "lease-501", tenantName: "David Chen" },
          created_at: new Date(now - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
        {
          user_id: user.id,
          type: "lease_renewal_request",
          title: "Lease Renewal Request",
          message: "Maria Santos requested a 1-year renewal extension for Unit 102.",
          read: true,
          data: { unit: "102", tenantName: "Maria Santos" },
          created_at: new Date(now - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        },
        {
          user_id: user.id,
          type: "announcement",
          title: "Quarterly System Advisory",
          message: "Platform maintenance scheduled for this Sunday at 2:00 AM UTC.",
          read: true,
          data: { maintenanceWindow: "2:00 AM - 4:00 AM UTC" },
          created_at: new Date(now - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
        }
      );
    } else {
      // Tenant notification set
      notificationsToInsert.push(
        {
          user_id: user.id,
          type: "payment",
          title: "Monthly Rent Invoice Ready",
          message: "Your rent invoice for this month (₱18,000.00) has been generated.",
          read: false,
          data: { amount: 18000, dueDate: "2026-09-01" },
          created_at: new Date(now - 1000 * 60 * 30).toISOString(), // 30 mins ago
        },
        {
          user_id: user.id,
          type: "maintenance",
          title: "Maintenance Ticket Updated",
          message: "Your AC repair request #MR-108 has been assigned to technician Roberto.",
          read: false,
          data: { ticketId: "MR-108", status: "In Progress", technician: "Roberto" },
          created_at: new Date(now - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
        },
        {
          user_id: user.id,
          type: "announcement",
          title: "Scheduled Water Maintenance",
          message: "Building water supply will undergo routine filter replacement tomorrow from 1 PM to 3 PM.",
          read: false,
          data: { timeframe: "Tomorrow 1:00 PM - 3:00 PM" },
          created_at: new Date(now - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
        },
        {
          user_id: user.id,
          type: "lease",
          title: "Lease Countersigned",
          message: "Your landlord countersigned your updated lease agreement.",
          read: true,
          data: { status: "Active" },
          created_at: new Date(now - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
        },
        {
          user_id: user.id,
          type: "payment",
          title: "Payment Receipt Confirmed",
          message: "Official Receipt #OR-9942 for your parking fee (₱2,500.00) is now available.",
          read: true,
          data: { receiptNumber: "OR-9942", amount: 2500 },
          created_at: new Date(now - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
        }
      );
    }
  }

  console.log(`Inserting ${notificationsToInsert.length} notifications...`);
  const { data, error } = await supabase
    .from("notifications")
    .insert(notificationsToInsert)
    .select("id");

  if (error) {
    console.error("Error inserting notifications:", error);
    process.exit(1);
  }

  console.log(`Successfully seeded ${data?.length ?? notificationsToInsert.length} notifications!`);
}

seedNotifications().catch((err) => {
  console.error("Unhandled error seeding notifications:", err);
  process.exit(1);
});
