#!/usr/bin/env node
/**
 * iReside — Client Landlords Seeder (Valenzuela City Study Sites)
 *
 * Seeds the remaining 3 client landlords from the Valenzuela study alongside
 * John Peter Gonzales (who is seeded by scripts/seed-defense-demo.mjs):
 *   1. Melanie Tolentino        (melanie.tolentino@ireside.ph)  — Brgy. Malinta
 *   2. Shannea Joelle F. Joven  (shannea.joven@ireside.ph)      — Brgy. Canumay
 *   3. Arnold F. Ferrer         (arnold.ferrer@ireside.ph)      — Brgy. Maysan
 *
 * Each landlord receives a configured property, 6 units (2 floors), floor map
 * positions, utility configs, GCash payment destination, and 2 assigned tenants
 * with active leases and sample payment records.
 *
 * Shared password: Defense2026!
 * Idempotent: safe to re-run at any time.
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const root = process.cwd();
if (fs.existsSync(path.join(root, ".env.local"))) dotenv.config({ path: path.join(root, ".env.local"), quiet: true });
if (fs.existsSync(path.join(root, ".env"))) dotenv.config({ path: path.join(root, ".env"), quiet: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Defense2026!";
const STORAGE_PUBLIC = `${SUPABASE_URL}/storage/v1/object/public`;
const AVATAR = (n) => `${STORAGE_PUBLIC}/profile-avatars/default_avatars/${n}.png`;

const uid = (name) => {
  const h = crypto.createHash("sha256").update(`client-landlords:${name}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

const iso = (d) => (d instanceof Date ? d : new Date(d)).toISOString();
const must = (res, what) => {
  if (res?.error) {
    console.error(`\x1b[31m✗ ${what}:\x1b[0m`, res.error.message ?? res.error);
    process.exit(1);
  }
  return res?.data;
};

const HOUSE_RULES = [
  "Quiet hours are observed from 10:00 PM to 6:00 AM.",
  "Visitors are allowed in common areas until 9:00 PM.",
  "Keep hallways, stairs, and shared spaces clean at all times.",
  "Pay monthly rent and utility bills on or before the 5th of each month.",
  "Report leaks, electrical issues, or broken fixtures through iReside.",
];

const CLIENT_LANDLORDS = [
  {
    key: "melanie",
    name: "Melanie Tolentino",
    email: "melanie.tolentino@ireside.ph",
    phone: "+639172223301",
    gcash: "09172223301",
    avatar: AVATAR(2),
    color: "#6d28d9",
    secondaryColor: "#4c1d95",
    property: {
      name: "Tolentino Apartments",
      address: "14 MacArthur Highway, Barangay Malinta, Valenzuela City",
      tagline: "Apartment units along MacArthur Highway, Malinta",
      type: "apartment",
      environmentMode: "apartment",
      rent: 6500,
      permit: "VC-BP-2026-021104",
      bio: "Owner of Tolentino Apartments in Barangay Malinta, Valenzuela City.",
    },
    tenants: [
      {
        key: "nixon",
        name: "Nixon Sent Jr.",
        email: "nixon.sent@ireside.ph",
        phone: "+639182224401",
        avatar: AVATAR(1),
        unit: "101",
        occupation: "Logistics Coordinator",
        employer: "Valenzuela Logistics Hub",
        income: 26000,
        emergency: ["Teresa Sent (Mother)", "+639182224501"],
        leaseStart: "2026-02-01",
        bio: "Long-term Malinta resident; pays rent via GCash.",
      },
      {
        key: "gian",
        name: "Gian Carlo Quintano",
        email: "gian.quintano@ireside.ph",
        phone: "+639182224402",
        avatar: AVATAR(6),
        unit: "102",
        occupation: "Accountant",
        employer: "Malinta Commercial Center",
        income: 30000,
        emergency: ["Lorna Quintano (Mother)", "+639182224502"],
        leaseStart: "2026-04-01",
        bio: "Quiet tenant in Unit 102.",
      },
    ],
  },
  {
    key: "shannea",
    name: "Shannea Joelle F. Joven",
    email: "shannea.joven@ireside.ph",
    phone: "+639173334401",
    gcash: "09173334401",
    avatar: AVATAR(11),
    color: "#0f766e",
    secondaryColor: "#115e59",
    property: {
      name: "Joven Boarding House",
      address: "88 T. Santiago Street, Barangay Canumay, Valenzuela City",
      tagline: "Boarding rooms along T. Santiago St., Canumay",
      type: "boarding_house",
      environmentMode: "dormitory",
      rent: 4200,
      permit: "VC-BP-2026-024518",
      bio: "Owner of Joven Boarding House in Barangay Canumay, Valenzuela City.",
    },
    tenants: [
      {
        key: "franchesca",
        name: "Franchesca Faith De Guzman",
        email: "franchesca.deguzman@ireside.ph",
        phone: "+639183335501",
        avatar: AVATAR(12),
        unit: "101",
        occupation: "Quality Assurance Analyst",
        employer: "Canumay Manufacturing Corp.",
        income: 22000,
        emergency: ["Elena De Guzman (Mother)", "+639183335601"],
        leaseStart: "2026-03-01",
        bio: "Canumay resident; consistently settles bills on time.",
      },
      {
        key: "jake",
        name: "Jake Manreal",
        email: "jake.manreal@ireside.ph",
        phone: "+639183335502",
        avatar: AVATAR(8),
        unit: "102",
        occupation: "Machine Technician",
        employer: "Canumay Industrial Park",
        income: 21000,
        emergency: ["Roberto Manreal (Father)", "+639183335602"],
        leaseStart: "2026-05-01",
        bio: "Day-shift technician staying in Room 102.",
      },
    ],
  },
  {
    key: "arnold",
    name: "Arnold F. Ferrer",
    email: "arnold.ferrer@ireside.ph",
    phone: "+639174445501",
    gcash: "09174445501",
    avatar: AVATAR(7),
    color: "#b45309",
    secondaryColor: "#92400e",
    property: {
      name: "Ferrer Apartment",
      address: "52 Maysan Road, Barangay Maysan, Valenzuela City",
      tagline: "Apartment units along Maysan Road, Valenzuela",
      type: "apartment",
      environmentMode: "apartment",
      rent: 5500,
      permit: "VC-BP-2026-028991",
      bio: "Owner of Ferrer Apartment in Barangay Maysan, Valenzuela City.",
    },
    tenants: [
      {
        key: "estella",
        name: "Estella Marie P. Dacara",
        email: "estella.dacara@ireside.ph",
        phone: "+639184446601",
        avatar: AVATAR(14),
        unit: "101",
        occupation: "Public School Teacher",
        employer: "Maysan National High School",
        income: 27000,
        emergency: ["Mario Dacara (Father)", "+639184446701"],
        leaseStart: "2026-01-15",
        bio: "Educator residing in Unit 101.",
      },
      {
        key: "adrian",
        name: "Adrian Molina",
        email: "adrian.molina@ireside.ph",
        phone: "+639184446602",
        avatar: AVATAR(10),
        unit: "102",
        occupation: "Warehouse Supervisor",
        employer: "Maysan Distribution Hub",
        income: 25000,
        emergency: ["Grace Molina (Mother)", "+639184446702"],
        leaseStart: "2026-06-01",
        bio: "Residing in Unit 102 at Ferrer Residential Suites.",
      },
    ],
  },
];

async function ensureAuthUser({ id, email, name, phone, role, avatar, extraMeta = {} }) {
  const { data: list, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  must({ error }, "list auth users");
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase() || u.id === id);
  const user_metadata = {
    full_name: name,
    role,
    phone,
    avatar_url: avatar,
    email_verified: true,
    is_account_claimed: true,
    has_changed_password: true,
    ...extraMeta,
  };
  if (existing) {
    const r = await db.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email,
      email_confirm: true,
      user_metadata,
    });
    must(r, `update auth user ${email}`);
    return existing.id;
  }
  const r = await db.auth.admin.createUser({
    id,
    email,
    password: PASSWORD,
    email_confirm: true,
    user_metadata,
  });
  must(r, `create auth user ${email}`);
  return r.data.user.id;
}

async function wipeLandlordData(landlordId, tenantIds) {
  const { data: props } = await db.from("properties").select("id").eq("landlord_id", landlordId);
  const propIds = (props ?? []).map((p) => p.id);
  const { data: units } = propIds.length
    ? await db.from("units").select("id").in("property_id", propIds)
    : { data: [] };
  const unitIds = (units ?? []).map((u) => u.id);
  const { data: leases } = await db
    .from("leases")
    .select("id")
    .or(`landlord_id.eq.${landlordId},tenant_id.in.(${tenantIds.join(",")})`);
  const leaseIds = (leases ?? []).map((l) => l.id);

  const del = async (table, col, vals) => {
    if (!vals || vals.length === 0) return;
    const res = await db.from(table).delete().in(col, vals);
    if (res.error) console.warn(`  warn deleting ${table}: ${res.error.message}`);
  };

  await del("payments", "lease_id", leaseIds);
  await del("leases", "id", leaseIds);
  await del("utility_configs", "landlord_id", [landlordId]);
  await del("landlord_payment_destinations", "landlord_id", [landlordId]);
  await del("unit_map_positions", "unit_id", unitIds);
  await del("property_environment_policies", "property_id", propIds);
  await del("property_floor_configs", "property_id", propIds);
  await del("units", "id", unitIds);
  await del("properties", "id", propIds);
}

async function seedLandlord(cfg) {
  console.log(`\n▶ Seeding ${cfg.name} (${cfg.email})`);
  const landlordId = await ensureAuthUser({
    id: uid(`landlord:${cfg.key}`),
    email: cfg.email,
    name: cfg.name,
    phone: cfg.phone,
    role: "landlord",
    avatar: cfg.avatar,
    extraMeta: { is_setup_completed: true, setup_completed: true },
  });

  const tenantRecords = [];
  for (const t of cfg.tenants) {
    const tid = await ensureAuthUser({
      id: uid(`tenant:${cfg.key}:${t.key}`),
      email: t.email,
      name: t.name,
      phone: t.phone,
      role: "tenant",
      avatar: t.avatar,
    });
    tenantRecords.push({ ...t, id: tid });
  }

  await wipeLandlordData(landlordId, tenantRecords.map((t) => t.id));

  const branding = {
    propertyName: cfg.property.name,
    propertyTagline: cfg.property.tagline,
    rentalArchetype: cfg.property.type,
    primaryColor: cfg.color,
    secondaryColor: cfg.secondaryColor,
    logoUrl: null,
    bannerUrl: "/art/banners/morning-sun.svg",
    setup_completed: true,
    setup_completed_at: "2026-01-15T02:00:00.000Z",
  };

  must(
    await db.from("profiles").upsert(
      [
        {
          id: landlordId,
          email: cfg.email,
          full_name: cfg.name,
          role: "landlord",
          phone: cfg.phone,
          avatar_url: cfg.avatar,
          avatar_bg_color: cfg.color,
          cover_url: "/art/banners/morning-sun.svg",
          bio: cfg.property.bio,
          address: cfg.property.address,
          business_name: cfg.property.name,
          business_permit_number: cfg.property.permit,
          business_permits: [],
          socials: {
            branding,
            notification_preferences: {
              payments: true,
              maintenance: true,
              applications: true,
              messages: true,
              community: true,
            },
          },
          two_factor_enabled: false,
          has_changed_password: true,
          is_account_claimed: true,
          updated_at: iso(new Date()),
        },
      ],
      { onConflict: "id" }
    ),
    `upsert landlord profile for ${cfg.key}`
  );

  must(
    await db.from("profiles").upsert(
      tenantRecords.map((t) => ({
        id: t.id,
        email: t.email,
        full_name: t.name,
        role: "tenant",
        phone: t.phone,
        avatar_url: t.avatar,
        avatar_bg_color: "#8B5CF6",
        bio: t.bio,
        address: `${cfg.property.name}, Unit ${t.unit}, Valenzuela City`,
        socials: {
          emergency_contact_name: t.emergency[0],
          emergency_contact_phone: t.emergency[1],
          occupation: t.occupation,
          employer: t.employer,
        },
        two_factor_enabled: false,
        has_changed_password: true,
        is_account_claimed: true,
        updated_at: iso(new Date()),
      })),
      { onConflict: "id" }
    ),
    `upsert tenant profiles for ${cfg.key}`
  );

  must(
    await db.from("profile_private").upsert(
      [
        { profile_id: landlordId, phone: cfg.phone, address: cfg.property.address },
        ...tenantRecords.map((t) => ({
          profile_id: t.id,
          phone: t.phone,
          address: `Unit ${t.unit}, ${cfg.property.name}`,
        })),
      ],
      { onConflict: "profile_id" }
    ),
    `upsert profile_private for ${cfg.key}`
  );

  must(
    await db.from("user_security_settings").upsert(
      [landlordId, ...tenantRecords.map((t) => t.id)].map((id) => ({
        profile_id: id,
        has_changed_password: true,
        two_factor_enabled: false,
      })),
      { onConflict: "profile_id" }
    ),
    `upsert security settings for ${cfg.key}`
  );

  must(
    await db.from("landlord_business_profiles").upsert(
      [
        {
          profile_id: landlordId,
          business_name: cfg.property.name,
          business_permit_number: cfg.property.permit,
          business_permits: [],
        },
      ],
      { onConflict: "profile_id" }
    ),
    `upsert business profile for ${cfg.key}`
  );

  const propertyId = uid(`property:${cfg.key}`);
  const unitNames = ["101", "102", "103", "201", "202", "203"];
  const occupiedSet = new Set(tenantRecords.map((t) => t.unit));

  const units = unitNames.map((name) => ({
    id: uid(`unit:${cfg.key}:${name}`),
    property_id: propertyId,
    name: `Unit ${name}`,
    floor: Number(name[0]),
    status: occupiedSet.has(name) ? "occupied" : "vacant",
    rent_amount: cfg.property.rent,
    sqft: 180,
    beds: 1,
    baths: 1,
    created_at: "2026-01-15T02:05:00.000Z",
  }));

  const ROOM_W = 200;
  const ROOM_H = 140;
  const GAP = 20;
  const CORRIDOR_H = 80;
  const MARGIN = 80;
  const corridorY = MARGIN + ROOM_H + GAP;

  const positions = units.map((u, idx) => {
    const col = idx % 3;
    return {
      unit_id: u.id,
      floor_key: `floor${u.floor}`,
      x: MARGIN + col * (ROOM_W + GAP),
      y: MARGIN,
      w: ROOM_W,
      h: ROOM_H,
    };
  });

  const floorDecorations = {
    floor1: {
      corridors: [{ id: "corridor-floor1-main", label: "Ground Floor Hallway", x: MARGIN - 20, y: corridorY, w: 3 * ROOM_W + 2 * GAP + 40, h: CORRIDOR_H }],
      structures: [],
    },
    floor2: {
      corridors: [{ id: "corridor-floor2-main", label: "Second Floor Hallway", x: MARGIN - 20, y: corridorY, w: 3 * ROOM_W + 2 * GAP + 40, h: CORRIDOR_H }],
      structures: [],
    },
  };

  must(
    await db.from("properties").insert({
      id: propertyId,
      landlord_id: landlordId,
      name: cfg.property.name,
      address: cfg.property.address,
      city: "Valenzuela",
      description: cfg.property.bio,
      type: cfg.property.type,
      total_units: units.length,
      total_floors: 2,
      base_rent_amount: cfg.property.rent,
      amenities: ["Wi-Fi", "CCTV", "Sub-metered Utilities", "24/7 Gate Access"],
      house_rules: HOUSE_RULES,
      images: ["/art/property.svg"],
      is_featured: false,
      advance_rent_months: 1,
      security_deposit_months: 1,
      renewal_window_days: 60,
      map_decorations: { branding, ...floorDecorations },
      created_at: "2026-01-15T02:00:00.000Z",
    }),
    `insert property for ${cfg.key}`
  );

  must(await db.from("units").insert(units), `insert units for ${cfg.key}`);
  must(
    await db.from("property_floor_configs").insert([
      { id: uid(`floor:${cfg.key}:1`), property_id: propertyId, floor_number: 1, floor_key: "floor1", display_name: "Ground Floor", sort_order: 1 },
      { id: uid(`floor:${cfg.key}:2`), property_id: propertyId, floor_number: 2, floor_key: "floor2", display_name: "Second Floor", sort_order: 2 },
    ]),
    `insert floor configs for ${cfg.key}`
  );
  must(await db.from("unit_map_positions").insert(positions), `insert unit_map_positions for ${cfg.key}`);
  must(
    await db.from("property_environment_policies").insert({
      property_id: propertyId,
      environment_mode: cfg.property.environmentMode,
      max_occupants_per_unit: 2,
      curfew_enabled: false,
      visitor_cutoff_enabled: true,
      visitor_cutoff_time: "21:00:00",
      quiet_hours_start: "22:00:00",
      quiet_hours_end: "06:00:00",
      gender_restriction_mode: "none",
      utility_policy_mode: "tenant_paid",
      payment_profile_defaults: {
        due_day: 5,
        late_fee: 250,
        allow_partial: false,
        accepted_methods: ["gcash", "cash"],
      },
      needs_review: false,
      reviewed_at: "2026-01-15T02:10:00.000Z",
      reviewed_by: landlordId,
    }),
    `insert env policy for ${cfg.key}`
  );

  must(
    await db.from("utility_configs").insert([
      {
        id: uid(`ucfg:${cfg.key}:elec`),
        landlord_id: landlordId,
        property_id: propertyId,
        unit_id: null,
        utility_type: "electricity",
        billing_mode: "tenant_paid",
        rate_per_unit: 13.5,
        unit_label: "kwh",
        is_active: true,
        effective_from: "2026-01-01",
        note: "Sub-metered electricity rate",
      },
      {
        id: uid(`ucfg:${cfg.key}:water`),
        landlord_id: landlordId,
        property_id: propertyId,
        unit_id: null,
        utility_type: "water",
        billing_mode: "tenant_paid",
        rate_per_unit: 35,
        unit_label: "cubic_meter",
        is_active: true,
        effective_from: "2026-01-01",
        note: "Sub-metered water rate",
      },
    ]),
    `insert utility_configs for ${cfg.key}`
  );

  must(
    await db.from("landlord_payment_destinations").insert([
      {
        id: uid(`gcash:${cfg.key}`),
        landlord_id: landlordId,
        provider: "gcash",
        bank_name: null,
        account_name: cfg.name,
        account_number: cfg.gcash,
        is_enabled: true,
      },
    ]),
    `insert payment destination for ${cfg.key}`
  );

  const unitMap = Object.fromEntries(units.map((u) => [u.name.replace("Unit ", ""), u]));
  const leases = tenantRecords.map((t) => ({
    id: uid(`lease:${cfg.key}:${t.key}`),
    unit_id: unitMap[t.unit].id,
    tenant_id: t.id,
    landlord_id: landlordId,
    status: "active",
    start_date: t.leaseStart,
    end_date: null,
    term_type: "open_ended",
    monthly_rent: cfg.property.rent,
    security_deposit: cfg.property.rent,
    terms: {
      due_day: 5,
      late_fee: 250,
      allow_partial: false,
      house_rules: HOUSE_RULES,
      occupancy_limit: 2,
      utilities: "Electricity ₱13.50/kWh and water ₱35/m³ sub-metered",
      monthly_rent: cfg.property.rent,
    },
    tenant_signature: t.name,
    landlord_signature: cfg.name,
    signing_mode: "in_person",
    signed_at: `${t.leaseStart}T02:00:00.000Z`,
    tenant_signed_at: `${t.leaseStart}T02:00:00.000Z`,
    landlord_signed_at: `${t.leaseStart}T02:10:00.000Z`,
    signature_lock_version: 1,
    created_at: `${t.leaseStart}T01:30:00.000Z`,
  }));

  must(await db.from("leases").insert(leases), `insert leases for ${cfg.key}`);

  const payments = [];
  const paymentItems = [];
  const paymentReceipts = [];
  for (let i = 0; i < tenantRecords.length; i++) {
    const t = tenantRecords[i];
    const lease = leases[i];
    const octId = uid(`pay:${cfg.key}:${t.key}:2026-10`);
    const novId = uid(`pay:${cfg.key}:${t.key}:2026-11`);
    const octReceiptNo = `REC-202610-${octId.slice(0, 8).toUpperCase()}`;
    payments.push(
      {
        id: octId,
        lease_id: lease.id,
        tenant_id: t.id,
        landlord_id: landlordId,
        amount: cfg.property.rent,
        subtotal: cfg.property.rent,
        paid_amount: cfg.property.rent,
        balance_remaining: 0,
        status: "completed",
        workflow_status: "receipted",
        method: "gcash",
        intent_method: "gcash",
        amount_tag: "exact",
        review_action: "confirm_received",
        landlord_confirmed: true,
        billing_cycle: "2026-10-01",
        invoice_period_start: "2026-10-01",
        invoice_period_end: "2026-10-31",
        due_date: "2026-10-05T00:00:00.000Z",
        paid_at: "2026-10-04T06:00:00.000Z",
        payment_submitted_at: "2026-10-04T05:30:00.000Z",
        last_action_at: "2026-10-04T06:00:00.000Z",
        last_action_by: landlordId,
        description: `October 2026 — Rent (Unit ${t.unit})`,
        invoice_number: `INV-202610-${octId.slice(0, 8).toUpperCase()}`,
        receipt_number: octReceiptNo,
        reference_number: `GC-${cfg.key.toUpperCase()}-10${i + 1}`,
        allow_partial_payments: false,
        due_day_snapshot: 5,
        late_fee_amount: 0,
        created_at: "2026-10-01T00:00:00.000Z",
        updated_at: "2026-10-04T06:00:00.000Z",
      },
      {
        id: novId,
        lease_id: lease.id,
        tenant_id: t.id,
        landlord_id: landlordId,
        amount: cfg.property.rent,
        subtotal: cfg.property.rent,
        paid_amount: 0,
        balance_remaining: cfg.property.rent,
        status: "pending",
        workflow_status: "pending",
        billing_cycle: "2026-11-01",
        invoice_period_start: "2026-11-01",
        invoice_period_end: "2026-11-30",
        due_date: "2026-11-05T00:00:00.000Z",
        paid_at: null,
        description: `November 2026 — Rent (Unit ${t.unit})`,
        invoice_number: `INV-202611-${novId.slice(0, 8).toUpperCase()}`,
        allow_partial_payments: false,
        due_day_snapshot: 5,
        late_fee_amount: 0,
        created_at: "2026-11-01T00:00:00.000Z",
        updated_at: "2026-11-01T00:00:00.000Z",
      }
    );
    paymentItems.push(
      { id: uid(`item:${octId}:rent`), payment_id: octId, label: "Base rent", amount: cfg.property.rent, category: "rent", sort_order: 0, metadata: {} },
      { id: uid(`item:${novId}:rent`), payment_id: novId, label: "Base rent", amount: cfg.property.rent, category: "rent", sort_order: 0, metadata: {} }
    );
    paymentReceipts.push({
      id: uid(`rcpt:${octId}`),
      payment_id: octId,
      landlord_id: landlordId,
      tenant_id: t.id,
      receipt_number: octReceiptNo,
      amount: cfg.property.rent,
      issued_at: "2026-10-04T06:00:00.000Z",
      issued_by: landlordId,
      method: "gcash",
      amount_breakdown: { rent: cfg.property.rent },
      notes: "GCash payment verified.",
      created_at: "2026-10-04T06:00:00.000Z",
    });
  }
  must(await db.from("payments").insert(payments), `insert payments for ${cfg.key}`);
  must(await db.from("payment_items").insert(paymentItems), `insert payment_items for ${cfg.key}`);
  must(await db.from("payment_receipts").insert(paymentReceipts), `insert payment_receipts for ${cfg.key}`);

  console.log(`  ✓ Created ${cfg.name} (${cfg.email}) + ${cfg.property.name} + ${tenantRecords.length} assigned tenants`);
}

async function main() {
  console.log("Seeding Valenzuela City Client Landlords & Assigned Tenants...");
  for (const cfg of CLIENT_LANDLORDS) {
    await seedLandlord(cfg);
  }
  console.log("\nDone! All client landlords and their assigned tenants are ready.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
