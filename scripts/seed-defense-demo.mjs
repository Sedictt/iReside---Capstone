#!/usr/bin/env node
/**
 * iReside — Defense Demo Seeder (Fernando Gonzales Dormitory)
 *
 * Builds a complete, realistic dataset for the capstone defense:
 *   Landlord  : John Peter Gonzales  (john.gonzales@ireside.ph)
 *   Property  : Fernando Gonzales Dormitory, Marulas, Valenzuela City
 *   Tenants   : 8 residents, each parked in a different workflow state so every
 *               feature the panel might ask for already has live data.
 *
 * The script is IDEMPOTENT: every run deletes the demo landlord's data
 * (properties, units, leases, payments, tickets, chats, posts, notifications,
 * applications, invites …) and rebuilds it from scratch with the same IDs.
 * Run it again after a rehearsal to reset the demo to its starting state.
 *
 *   node scripts/seed-defense-demo.mjs            # (re)build the demo
 *   node scripts/seed-defense-demo.mjs --wipe     # remove the demo data only
 *
 * Shared password for every demo account: Defense2026!
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import sharp from "sharp";

const root = process.cwd();
if (fs.existsSync(path.join(root, ".env.local"))) dotenv.config({ path: path.join(root, ".env.local"), quiet: true });
if (fs.existsSync(path.join(root, ".env"))) dotenv.config({ path: path.join(root, ".env"), quiet: true });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const JWT_SECRET = process.env.JWT_SECRET?.trim() || "iReside-dev-fallback-secret-2024";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

if (!SUPABASE_URL || !SERVICE_ROLE || !ANON_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { autoRefreshToken: false, persistSession: false } });
const authProbe = createClient(SUPABASE_URL, ANON_KEY, { auth: { autoRefreshToken: false, persistSession: false } });

const WIPE_ONLY = process.argv.includes("--wipe");
const PASSWORD = "Defense2026!";
const STORAGE_PUBLIC = `${SUPABASE_URL}/storage/v1/object/public`;
const AVATAR = (n) => `${STORAGE_PUBLIC}/profile-avatars/default_avatars/${n}.png`;

// ---------------------------------------------------------------------------
// Deterministic IDs — the same name always yields the same (valid v4-shaped) UUID,
// so URLs in the defense guide stay stable across reseeds.
// ---------------------------------------------------------------------------
const uid = (name) => {
  const h = crypto.createHash("sha256").update(`fgd-demo:${name}`).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${(parseInt(h[16], 16) & 0x3 | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
};
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const iso = (d) => (d instanceof Date ? d : new Date(d)).toISOString();
const daysAgo = (n, hour = 9) => { const d = new Date(); d.setUTCDate(d.getUTCDate() - n); d.setUTCHours(hour, 0, 0, 0); return d.toISOString(); };
const hoursAgo = (n) => new Date(Date.now() - n * 3600_000).toISOString();
const pad = (n) => String(n).padStart(2, "0");
const ymd = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const invoiceNo = (paymentId, cycle) => `INV-${cycle.replace(/-/g, "").slice(0, 6)}-${paymentId.slice(0, 8).toUpperCase()}`;
const receiptNo = (paymentId, issuedAt) => `REC-${issuedAt.replace(/-/g, "").slice(0, 6)}-${paymentId.slice(0, 8).toUpperCase()}`;
const peso = (n) => `₱${Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const log = (m) => console.log(`  ${m}`);
const step = (m) => console.log(`\n\x1b[36m▶ ${m}\x1b[0m`);
const ok = (m) => console.log(`  \x1b[32m✓\x1b[0m ${m}`);
const must = (res, what) => { if (res?.error) { console.error(`\x1b[31m✗ ${what}:\x1b[0m`, res.error.message ?? res.error); process.exit(1); } return res?.data; };

async function insert(table, rows, what = table) {
  if (!rows || rows.length === 0) return [];
  // PostgREST bulk inserts use the union of all keys and send NULL for rows that
  // lack a key, which defeats column defaults. Group rows by key signature so
  // every batch is homogeneous and defaults still apply.
  const groups = new Map();
  for (const row of rows) {
    const sig = Object.keys(row).sort().join(",");
    if (!groups.has(sig)) groups.set(sig, []);
    groups.get(sig).push(row);
  }
  const out = [];
  for (const group of groups.values()) {
    for (let i = 0; i < group.length; i += 200) {
      const res = await db.from(table).insert(group.slice(i, i + 200)).select();
      out.push(...(must(res, `insert ${what}`) ?? []));
    }
  }
  return out;
}
async function upsert(table, rows, onConflict, what = table) {
  const res = await db.from(table).upsert(rows, { onConflict }).select();
  return must(res, `upsert ${what}`);
}

// ---------------------------------------------------------------------------
// Cast
// ---------------------------------------------------------------------------
const LANDLORD = {
  id: uid("user:landlord"),
  email: "john.gonzales@ireside.ph",
  name: "John Peter Gonzales",
  phone: "+639171112222",
  gcash: "09171112222",
  avatar: AVATAR(7),
};

const PROPERTY_ID = uid("property:fgd");
const PROPERTY_NAME = "Fernando Gonzales Dormitory";
const PROPERTY_ADDRESS = "27 M. H. del Pilar Street, Barangay Marulas, Valenzuela City";

// key → tenant definition. `state` drives the scenario each tenant demonstrates.
const TENANTS = {
  maria: { name: "Maria Angelica Santos", email: "maria.santos@ireside.ph", phone: "+639181234501", avatar: AVATAR(5), unit: "101", occupation: "Call Center Agent", employer: "Concentrix Valenzuela", income: 24000, emergency: ["Rosario Santos (Mother)", "+639181234601"], leaseStart: "2025-03-01", bio: "Night-shift CSR. Quiet, pays early." },
  joshua: { name: "Joshua Miguel Dela Cruz", email: "joshua.delacruz@ireside.ph", phone: "+639181234502", avatar: AVATAR(9), unit: "102", occupation: "Production Operator", employer: "Universal Robina Corp. – Pascual Plant", income: 18500, emergency: ["Elena Dela Cruz (Mother)", "+639181234602"], leaseStart: "2025-08-15", bio: "Works rotating shifts at URC." },
  katrina: { name: "Katrina Mae Villanueva", email: "katrina.villanueva@ireside.ph", phone: "+639181234503", avatar: AVATAR(12), unit: "201", occupation: "3rd Year BS Nursing Student", employer: "Our Lady of Fatima University – Valenzuela", income: 12000, emergency: ["Reynaldo Villanueva (Father)", "+639181234603"], leaseStart: "2026-11-01", bio: "Incoming resident; lease awaiting her e-signature." },
  ronald: { name: "Ronald Bautista", email: "ronald.bautista@ireside.ph", phone: "+639181234504", avatar: AVATAR(3), unit: "202", occupation: "Warehouse Checker", employer: "SM Supply Chain – Karuhatan DC", income: 17000, emergency: ["Liza Bautista (Wife)", "+639181234604"], leaseStart: "2025-06-01", bio: "Filed a move-out request (transferring to Cebu)." },
  christine: { name: "Christine Joy Reyes", email: "christine.reyes@ireside.ph", phone: "+639181234505", avatar: AVATAR(14), unit: "203", occupation: "Junior Bookkeeper", employer: "Valenzuela City Hall – Accounting", income: 21000, emergency: ["Marites Reyes (Sister)", "+639181234605"], leaseStart: "2025-12-01", leaseEnd: "2026-11-30", bio: "Fixed-term lease ending soon; renewal request pending." },
  mark: { name: "Mark Anthony Lim", email: "mark.lim@ireside.ph", phone: "+639181234506", avatar: AVATAR(10), unit: "301", occupation: "IT Support Specialist", employer: "Accenture – Vertis North", income: 32000, emergency: ["Grace Lim (Mother)", "+639181234606"], leaseStart: "2026-10-10", bio: "Just moved in Oct 10; first-time login (guided tour not yet taken)." },
  angelo: { name: "Angelo Fernandez", email: "angelo.fernandez@ireside.ph", phone: "+639181234507", avatar: AVATAR(16), unit: "302", occupation: "Rider / Delivery Partner", employer: "Grab Philippines", income: 20000, emergency: ["Nora Fernandez (Mother)", "+639181234607"], leaseStart: "2026-02-01", bio: "Pays in cash at the office; requested a transfer to Room 303." },
  daniel: { name: "Daniel Ocampo", email: "daniel.ocampo@ireside.ph", phone: "+639181234508", avatar: AVATAR(4), unit: "303", occupation: "Machine Operator", employer: "Jollibee Foods Corp. – Commissary", income: 16500, emergency: ["Carmen Ocampo (Mother)", "+639181234608"], leaseStart: "2025-09-01", leaseEnd: "2026-08-31", bio: "Former resident; moved out Aug 31, 2026 (archive)." },
};
for (const [key, t] of Object.entries(TENANTS)) { t.key = key; t.id = uid(`user:${key}`); t.leaseId = uid(`lease:${key}`); }

// Rooms: 3 floors × 4 rooms. Floor 1 fan rooms, Floor 2 larger, Floor 3 air-conditioned.
const UNITS = [
  ["101", 1, 4500, "occupied"], ["102", 1, 4500, "occupied"], ["103", 1, 4500, "vacant"], ["104", 1, 4500, "occupied"],
  ["201", 2, 5000, "occupied"], ["202", 2, 5000, "occupied"], ["203", 2, 5000, "occupied"], ["204", 2, 5000, "occupied"],
  ["301", 3, 5500, "occupied"], ["302", 3, 5500, "occupied"], ["303", 3, 5500, "vacant"], ["304", 3, 5500, "maintenance"],
].map(([name, floor, rent, status]) => ({ id: uid(`unit:${name}`), name, floor, rent, status }));
const unitByName = Object.fromEntries(UNITS.map((u) => [u.name, u]));
// Rooms 104 and 204 are occupied by walk-in residents who do not use the app (realistic: not every resident is onboarded yet).
const OFFLINE_RESIDENTS = { "104": "Bernard Mendoza", "204": "Aljon Rivera" };

const ELEC_RATE = 13.5;   // ₱ per kWh (Meralco pass-through)
const WATER_RATE = 35;    // ₱ per m³ (Maynilad pass-through)
const DUE_DAY = 5;
const LATE_FEE = 200;
const HOUSE_RULES = [
  "Curfew is 11:00 PM; the main gate is locked until 5:00 AM",
  "Visitors are allowed in the ground-floor lounge only, until 9:00 PM",
  "Quiet hours from 10:00 PM to 6:00 AM",
  "No cooking inside rooms; use the common kitchen",
  "No smoking, vaping, or alcohol anywhere in the building",
  "Keep your own room clean; shared areas are cleaned on a rotating schedule",
  "Report leaks, broken fixtures, or electrical problems through the app immediately",
];

// ---------------------------------------------------------------------------
// Tiny image generator (abstract SVG → PNG via sharp). No stock / AI photos.
// ---------------------------------------------------------------------------
async function makeCardPng({ title, subtitle, lines = [], accent = "#2f6f5e", w = 900, h = 1200 }) {
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const body = lines.map((l, i) => `<text x="70" y="${520 + i * 64}" font-family="Segoe UI, Arial" font-size="34" fill="#1f2937">${esc(l)}</text>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="100%" height="100%" fill="#f6f7f4"/>
    <rect x="0" y="0" width="${w}" height="300" fill="${accent}"/>
    <circle cx="${w - 140}" cy="140" r="220" fill="#ffffff" fill-opacity="0.12"/>
    <circle cx="120" cy="330" r="160" fill="${accent}" fill-opacity="0.18"/>
    <text x="70" y="150" font-family="Segoe UI, Arial" font-size="56" font-weight="700" fill="#ffffff">${esc(title)}</text>
    <text x="70" y="220" font-family="Segoe UI, Arial" font-size="32" fill="#e6f1ec">${esc(subtitle)}</text>
    ${body}
    <text x="70" y="${h - 60}" font-family="Segoe UI, Arial" font-size="24" fill="#6b7280">iReside demo artifact · ${esc(PROPERTY_NAME)}</text>
  </svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function uploadPng(bucket, objectPath, buffer) {
  const res = await db.storage.from(bucket).upload(objectPath, buffer, { contentType: "image/png", upsert: true });
  if (res.error) { console.warn(`  ! upload ${bucket}/${objectPath}: ${res.error.message}`); return null; }
  return { path: objectPath, url: `${STORAGE_PUBLIC}/${bucket}/${objectPath}` };
}

// ---------------------------------------------------------------------------
// WIPE — remove everything owned by the demo landlord / tenants
// ---------------------------------------------------------------------------
async function wipe(userIds) {
  step("Removing previous demo data");
  const tenantIds = Object.values(TENANTS).map((t) => t.id);
  const L = LANDLORD.id;

  const { data: props } = await db.from("properties").select("id").eq("landlord_id", L);
  const propIds = (props ?? []).map((p) => p.id);
  const { data: units } = propIds.length ? await db.from("units").select("id").in("property_id", propIds) : { data: [] };
  const unitIds = (units ?? []).map((u) => u.id);
  const { data: leases } = await db.from("leases").select("id").or(`landlord_id.eq.${L},tenant_id.in.(${tenantIds.join(",")})`);
  const leaseIds = (leases ?? []).map((l) => l.id);
  const { data: pays } = await db.from("payments").select("id").or(`landlord_id.eq.${L},tenant_id.in.(${tenantIds.join(",")})`);
  const payIds = (pays ?? []).map((p) => p.id);
  const { data: apps } = await db.from("applications").select("id").eq("landlord_id", L);
  const appIds = (apps ?? []).map((a) => a.id);
  const { data: posts } = propIds.length ? await db.from("community_posts").select("id").in("property_id", propIds) : { data: [] };
  const postIds = (posts ?? []).map((p) => p.id);
  const { data: parts } = await db.from("conversation_participants").select("conversation_id").in("user_id", userIds);
  const convIds = [...new Set((parts ?? []).map((p) => p.conversation_id))];
  const { data: invites } = await db.from("tenant_intake_invites").select("id").eq("landlord_id", L);
  const inviteIds = (invites ?? []).map((i) => i.id);
  const { data: albums } = postIds.length ? await db.from("community_albums").select("id").in("post_id", postIds) : { data: [] };
  const albumIds = (albums ?? []).map((a) => a.id);

  const del = async (table, col, ids) => { if (!ids?.length) return; const r = await db.from(table).delete().in(col, ids); if (r.error) console.warn(`  ! delete ${table}: ${r.error.message}`); };

  await del("payment_receipts", "payment_id", payIds);
  await del("payment_workflow_audit_events", "payment_id", payIds);
  await del("payment_items", "payment_id", payIds);
  await del("utility_readings", "landlord_id", [L]);
  await del("payments", "id", payIds);
  await del("renewal_requests", "landlord_id", [L]);
  await del("lease_signing_audit", "lease_id", leaseIds);
  await del("move_out_requests", "landlord_id", [L]);
  await del("unit_transfer_requests", "landlord_id", [L]);
  await del("landlord_reviews", "landlord_id", [L]);
  await del("leases", "id", leaseIds);
  await del("application_payment_audit_events", "application_id", appIds);
  await del("application_payment_requests", "application_id", appIds);
  await del("landlord_inquiry_actions", "landlord_id", [L]);
  await del("applications", "id", appIds);
  await del("tenant_intake_invite_events", "invite_id", inviteIds);
  await del("tenant_intake_invites", "id", inviteIds);
  await del("maintenance_requests", "landlord_id", [L]);
  await del("amenity_bookings", "landlord_id", [L]);
  await del("amenities", "landlord_id", [L]);
  await del("community_poll_votes", "poll_id", postIds);
  await del("community_reactions", "post_id", postIds);
  await del("community_comments", "post_id", postIds);
  await del("community_photos", "album_id", albumIds);
  await del("community_albums", "post_id", postIds);
  await del("post_views", "post_id", postIds);
  await del("saved_posts", "post_id", postIds);
  await del("content_reports", "post_id", postIds);
  await del("community_posts", "id", postIds);
  await del("messages", "conversation_id", convIds);
  await del("conversation_participants", "conversation_id", convIds);
  await del("conversations", "id", convIds);
  await del("message_user_actions", "actor_user_id", userIds);
  await del("message_user_reports", "reporter_user_id", userIds);
  await del("notifications", "user_id", userIds);
  await del("iris_chat_messages", "user_id", userIds);
  await del("expenses", "landlord_id", [L]);
  await del("utility_configs", "landlord_id", [L]);
  await del("unit_environment_overrides", "unit_id", unitIds);
  await del("unit_map_positions", "unit_id", unitIds);
  await del("property_floor_configs", "property_id", propIds);
  await del("property_environment_policies", "property_id", propIds);
  await del("units", "id", unitIds);
  await del("landlord_payment_destinations", "landlord_id", [L]);
  await del("landlord_business_profiles", "profile_id", [L]);
  await del("landlord_statistics_exports", "landlord_id", [L]);
  await del("landlord_product_tour_events", "landlord_id", [L]);
  await del("landlord_product_tour_states", "landlord_id", [L]);
  await del("tenant_product_tour_events", "tenant_id", tenantIds);
  await del("tenant_product_tour_states", "tenant_id", tenantIds);
  await del("properties", "id", propIds);
  ok("Previous demo rows removed");
}

// ---------------------------------------------------------------------------
// AUTH + PROFILES
// ---------------------------------------------------------------------------
async function ensureAuthUser({ id, email, name, phone, role, avatar, extraMeta = {} }) {
  const { data: list, error } = await db.auth.admin.listUsers({ perPage: 1000 });
  must({ error }, "list auth users");
  const existing = list.users.find((u) => u.email?.toLowerCase() === email || u.id === id);
  const user_metadata = { full_name: name, role, phone, avatar_url: avatar, email_verified: true, is_account_claimed: true, has_changed_password: true, ...extraMeta };
  if (existing) {
    if (existing.id !== id) {
      // Email is taken by a different id (e.g. an older manual account). Reuse that id.
      log(`${email} already exists with a different id – reusing ${existing.id}`);
    }
    const r = await db.auth.admin.updateUserById(existing.id, { password: PASSWORD, email, email_confirm: true, user_metadata });
    must(r, `update auth user ${email}`);
    return existing.id;
  }
  const r = await db.auth.admin.createUser({ id, email, password: PASSWORD, email_confirm: true, user_metadata });
  must(r, `create auth user ${email}`);
  return r.data.user.id;
}

// ---------------------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------------------
async function main() {
  console.log("\n\x1b[1m════════════════════════════════════════════════════════════\x1b[0m");
  console.log("\x1b[1m  iReside Defense Demo Seeder — Fernando Gonzales Dormitory\x1b[0m");
  console.log("\x1b[1m════════════════════════════════════════════════════════════\x1b[0m");

  step("Accounts (Supabase Auth)");
  LANDLORD.id = await ensureAuthUser({ ...LANDLORD, role: "landlord", extraMeta: { is_setup_completed: true, setup_completed: true } });
  ok(`Landlord ${LANDLORD.email} → ${LANDLORD.id}`);
  for (const t of Object.values(TENANTS)) {
    t.id = await ensureAuthUser({ id: t.id, email: t.email, name: t.name, phone: t.phone, role: "tenant", avatar: t.avatar });
    ok(`Tenant   ${t.email} → ${t.id}`);
  }
  const allUserIds = [LANDLORD.id, ...Object.values(TENANTS).map((t) => t.id)];

  await wipe(allUserIds);
  if (WIPE_ONLY) { console.log("\nDemo data wiped (accounts kept).\n"); return; }

  // ---- brand assets -------------------------------------------------------
  step("Brand assets & evidence images");
  const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="96" fill="#2f6f5e"/><text x="256" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="200" font-weight="700" fill="#ffffff">FG</text><text x="256" y="400" text-anchor="middle" font-family="Segoe UI, Arial" font-size="56" fill="#cfe7dd">DORMITORY</text></svg>`;
  const logo = await uploadPng("brand-logos", `landlords/${LANDLORD.id}/fgd-logo.png`, await sharp(Buffer.from(logoSvg)).png().toBuffer());
  const gcashProofFor = async (amount) => uploadPng("payment-proofs", `${TENANTS.joshua.id}/demo/gcash-october-2026.png`, await makeCardPng({
    title: "GCash", subtitle: "Send Money — Successful", accent: "#0b63f6",
    lines: [`Amount          ${peso(amount)}`, "To              JO** PE** G.", "Mobile No.      0917 111 2222", "Ref No.         1023 4477 8812", "Date            Oct 12, 2026 · 8:41 PM", "", "Note: Room 102 rent + utilities Oct 2026"],
  }));
  const leakPhoto1 = await uploadPng("maintenance-images", `${TENANTS.joshua.id}/demo/room102-faucet-leak-1.png`, await makeCardPng({ title: "Room 102 · Lavatory", subtitle: "Photo evidence · Oct 14, 2026 · 7:12 AM", accent: "#b45309", lines: ["Water dripping from the faucet base", "even when closed. Bucket fills in ~3 hrs.", "", "Submitted by: Joshua Miguel Dela Cruz"] }));
  const leakPhoto2 = await uploadPng("maintenance-images", `${TENANTS.joshua.id}/demo/room102-faucet-leak-2.png`, await makeCardPng({ title: "Room 102 · Lavatory", subtitle: "Close-up of the leaking joint", accent: "#b45309", lines: ["Corroded compression nut on the supply line."] }));
  const outletPhoto = await uploadPng("maintenance-images", `${TENANTS.mark.id}/demo/room301-outlet.png`, await makeCardPng({ title: "Room 301 · Wall Outlet", subtitle: "Photo evidence · Oct 17, 2026 · 10:30 PM", accent: "#991b1b", lines: ["Sparks and a burning smell when the", "aircon is plugged in. Outlet cover is", "discolored. Not using it for now.", "", "Submitted by: Mark Anthony Lim"] }));
  const albumPhoto1 = await uploadPng("community-images", `${PROPERTY_ID}/demo/fiesta-1.png`, await makeCardPng({ title: "Marulas Fiesta 2026", subtitle: "Boodle fight at the rooftop", accent: "#7c3aed", lines: ["Thank you to everyone who joined!"], w: 1200, h: 900 }));
  const albumPhoto2 = await uploadPng("community-images", `${PROPERTY_ID}/demo/fiesta-2.png`, await makeCardPng({ title: "Marulas Fiesta 2026", subtitle: "Karaoke night, ground-floor lounge", accent: "#7c3aed", lines: ["Winner: Room 203 (Christine) — Tagumpay Nating Lahat"], w: 1200, h: 900 }));
  ok("Logo, GCash proof, maintenance photos and album images uploaded");

  // ---- profiles -----------------------------------------------------------
  step("Profiles");
  const branding = {
    propertyName: PROPERTY_NAME,
    propertyTagline: "Safe, affordable rooms for students and workers in Marulas",
    rentalArchetype: "dormitory",
    primaryColor: "#2f6f5e",
    secondaryColor: "#1f4d41",
    logoUrl: logo?.url ?? null,
    bannerUrl: "/art/banners/morning-sun.svg",
    setup_completed: true,
    setup_completed_at: "2026-01-12T02:15:00.000Z",
  };
  await upsert("profiles", [{
    id: LANDLORD.id, email: LANDLORD.email, full_name: LANDLORD.name, role: "landlord", phone: LANDLORD.phone,
    avatar_url: LANDLORD.avatar, avatar_bg_color: "#2f6f5e", cover_url: "/art/banners/morning-sun.svg",
    bio: "Second-generation owner of Fernando Gonzales Dormitory, a 12-room dormitory in Barangay Marulas named after my late father. We have housed students of OLFU and workers from the Marulas–Karuhatan industrial belt since 2009.",
    address: PROPERTY_ADDRESS, website: null,
    business_name: PROPERTY_NAME, business_permit_number: "VC-BP-2026-018734", business_permits: [],
    socials: { branding, facebook: "fb.com/fernandogonzalesdorm", notification_preferences: { payments: true, maintenance: true, applications: true, messages: true, community: true } },
    two_factor_enabled: false, has_changed_password: true, is_account_claimed: true, updated_at: iso(new Date()),
  }], "id", "landlord profile");
  await upsert("profiles", Object.values(TENANTS).map((t) => ({
    id: t.id, email: t.email, full_name: t.name, role: "tenant", phone: t.phone, avatar_url: t.avatar, avatar_bg_color: "#2f6f5e",
    bio: t.bio, address: `${PROPERTY_NAME}, Room ${t.unit}, Marulas, Valenzuela City`,
    socials: { emergency_contact_name: t.emergency[0], emergency_contact_phone: t.emergency[1], occupation: t.occupation, employer: t.employer },
    two_factor_enabled: false, has_changed_password: true, is_account_claimed: true, updated_at: iso(new Date()),
  })), "id", "tenant profiles");
  await upsert("profile_private", [
    { profile_id: LANDLORD.id, phone: LANDLORD.phone, address: PROPERTY_ADDRESS },
    ...Object.values(TENANTS).map((t) => ({ profile_id: t.id, phone: t.phone, address: `Room ${t.unit}, ${PROPERTY_NAME}` })),
  ], "profile_id", "profile_private");
  await upsert("user_security_settings", allUserIds.map((id) => ({ profile_id: id, has_changed_password: true, two_factor_enabled: false })), "profile_id", "security settings");
  await upsert("landlord_business_profiles", [{ profile_id: LANDLORD.id, business_name: PROPERTY_NAME, business_permit_number: "VC-BP-2026-018734", business_permits: [] }], "profile_id", "business profile");
  ok("Landlord + 8 tenant profiles");

  // ---- property -----------------------------------------------------------
  step("Property, rooms, floor map, policies, utilities");
  await insert("properties", [{
    id: PROPERTY_ID, landlord_id: LANDLORD.id, name: PROPERTY_NAME, address: PROPERTY_ADDRESS, city: "Valenzuela",
    description: "Three-storey dormitory with 12 rooms (2 beds each), 24/7 CCTV, biometric gate, common kitchen, study hall and laundry area. Five minutes from OLFU Valenzuela and the Marulas industrial zone.",
    type: "dormitory", total_units: 12, total_floors: 3, base_rent_amount: 4500,
    amenities: ["Wi-Fi", "CCTV", "Study Hall", "Common Kitchen", "Laundry Area", "Water Dispenser", "Rooftop Drying Area", "Biometric Gate"],
    house_rules: HOUSE_RULES, images: ["/art/property.svg"], is_featured: true,
    advance_rent_months: 1, security_deposit_months: 1, renewal_window_days: 90,
    renewal_settings: { is_enabled: true, adjustment_type: "percentage", base_rent_adjustment: 5, landlord_memo: "Rates adjust 5% yearly to cover Meralco and Maynilad increases.", new_rules: [] },
    contract_template: {
      contract_mode: "generate",
      answers: { rent: "4500", occupancy_limit: "2", utilities: ["Wi-Fi", "CCTV", "Water Dispenser"], utility_split_method: "metered" },
      customClauses: [
        { id: 0, title: "Curfew", description: "The main gate closes at 11:00 PM. Residents arriving later must notify the caretaker in advance." },
        { id: 1, title: "Visitors", description: "Visitors are received in the ground-floor lounge only and must leave by 9:00 PM." },
        { id: 2, title: "Utilities", description: "Electricity (₱13.50/kWh) and water (₱35/m³) are sub-metered per room and billed with the monthly rent." },
        { id: 3, title: "Notice to Vacate", description: "A 30-day written notice is required before moving out. The security deposit is released after room inspection." },
      ],
      last_updated: "2026-01-12T02:20:00.000Z",
    },
    map_decorations: {
      branding,
      flyer_template: {
        propertyName: PROPERTY_NAME, tagline: "Resident portal for cash & GCash payments, utility readings, and repair requests.",
        address: PROPERTY_ADDRESS, contactPhone: "0917 111 2222", brandColor: "#2f6f5e", cardColor: "#ffffff", cardOpacity: 95,
        bgPreset: "solid_white", customBgImage: null, fontFamily: "modern_sans", letterSpacing: "tight", titleTransform: "uppercase",
        bannerHeading: "ACCESS MADE EASY", portalSubheading: "Resident Portal", showBanner: true, showOffice: true, showSteps: true, showWifi: true,
        officeHeader: "CARETAKER'S OFFICE", officeHours: "Daily: 7:00 AM – 9:00 PM", footerBadge: "Official Resident Notice",
        stepsHeading: "Get Started in 3 Easy Steps", step1Title: "Scan QR", step1Desc: "Open with camera or browser", step2Title: "Create Account", step2Desc: "Sign up & connect to your room", step3Title: "Pay & Request", step3Desc: "Quick pay & submit repair tickets",
        webCardBadge: "FOR PORTAL ACCESS", webCardTitle: "REGISTER / ACCESS PORTAL", webCardSubtitle: "Open in your browser to register or access the portal.",
        apkCardBadge: "FOR APP INSTALLATION", apkCardTitle: "DOWNLOAD MOBILE APP", apkCardSubtitle: "Install the app on your Android device.",
        wifiHeader: "DORM WI-FI", wifiSsid: "FGDorm_Residents", wifiPassword: "Pass: Marulas2026", photoBrightness: 100, photoOpacity: 100, photoSaturation: 100,
        updatedAt: "2026-02-02T03:00:00.000Z",
      },
    },
    // Oldest property on record so public pages (login, invite links) fall back to this brand.
    created_at: "2023-06-01T02:15:00.000Z",
  }], "property");

  await insert("units", UNITS.map((u) => ({
    id: u.id, property_id: PROPERTY_ID, name: `Room ${u.name}`, floor: u.floor, status: u.status, rent_amount: u.rent,
    sqft: u.floor === 1 ? 160 : u.floor === 2 ? 180 : 190, beds: 2, baths: 1, created_at: "2023-06-01T02:16:00.000Z",
  })), "units");
  await insert("property_floor_configs", [
    { id: uid("floor:1"), property_id: PROPERTY_ID, floor_number: 1, floor_key: "floor1", display_name: "Ground Floor", sort_order: 1 },
    { id: uid("floor:2"), property_id: PROPERTY_ID, floor_number: 2, floor_key: "floor2", display_name: "Second Floor", sort_order: 2 },
    { id: uid("floor:3"), property_id: PROPERTY_ID, floor_number: 3, floor_key: "floor3", display_name: "Third Floor (Air-conditioned)", sort_order: 3 },
  ], "floor configs");
  await insert("unit_map_positions", UNITS.map((u, i) => ({
    unit_id: u.id, floor_key: `floor${u.floor}`, x: 60 + (i % 4) * 240, y: 80, w: 200, h: 140,
  })), "map positions");
  await insert("property_environment_policies", [{
    property_id: PROPERTY_ID, environment_mode: "dormitory", max_occupants_per_unit: 2,
    curfew_enabled: true, curfew_time: "23:00:00", visitor_cutoff_enabled: true, visitor_cutoff_time: "21:00:00",
    quiet_hours_start: "22:00:00", quiet_hours_end: "06:00:00", gender_restriction_mode: "none", utility_policy_mode: "tenant_paid",
    payment_profile_defaults: { due_day: DUE_DAY, late_fee: LATE_FEE, allow_partial: false, accepted_methods: ["gcash", "cash"] },
    needs_review: false, reviewed_at: "2026-01-12T02:30:00.000Z", reviewed_by: LANDLORD.id,
  }], "environment policy");
  await insert("utility_configs", [
    { id: uid("ucfg:elec"), landlord_id: LANDLORD.id, property_id: PROPERTY_ID, unit_id: null, utility_type: "electricity", billing_mode: "tenant_paid", rate_per_unit: ELEC_RATE, unit_label: "kwh", is_active: true, effective_from: "2026-01-01", note: "Meralco pass-through rate, sub-metered per room" },
    { id: uid("ucfg:water"), landlord_id: LANDLORD.id, property_id: PROPERTY_ID, unit_id: null, utility_type: "water", billing_mode: "tenant_paid", rate_per_unit: WATER_RATE, unit_label: "cubic_meter", is_active: true, effective_from: "2026-01-01", note: "Maynilad pass-through rate, sub-metered per room" },
  ], "utility configs");
  await insert("landlord_payment_destinations", [{
    id: uid("gcash:dest"), landlord_id: LANDLORD.id, provider: "gcash", account_name: LANDLORD.name, account_number: LANDLORD.gcash, is_enabled: true,
  }], "GCash destination");
  ok("Property + 12 rooms + map + policies + utility rates + GCash");

  // ---- leases -------------------------------------------------------------
  step("Leases");
  const leaseTerms = (rent) => ({ due_day: DUE_DAY, late_fee: LATE_FEE, allow_partial: false, house_rules: HOUSE_RULES, occupancy_limit: 2, utilities: "Electricity ₱13.50/kWh and water ₱35/m³ sub-metered per room", monthly_rent: rent });
  const leaseRow = (t, overrides = {}) => {
    const u = unitByName[t.unit];
    return {
      id: t.leaseId, unit_id: u.id, tenant_id: t.id, landlord_id: LANDLORD.id, status: "active",
      start_date: t.leaseStart, end_date: t.leaseEnd ?? null, term_type: t.leaseEnd ? "fixed" : "open_ended",
      monthly_rent: u.rent, security_deposit: u.rent, terms: leaseTerms(u.rent),
      tenant_signature: t.name, landlord_signature: LANDLORD.name, signing_mode: "in_person",
      signed_at: `${t.leaseStart}T02:00:00.000Z`, tenant_signed_at: `${t.leaseStart}T02:00:00.000Z`, landlord_signed_at: `${t.leaseStart}T02:10:00.000Z`,
      signature_lock_version: 1, created_at: `${t.leaseStart}T01:30:00.000Z`, ...overrides,
    };
  };
  const K = TENANTS.katrina;
  await insert("leases", [
    leaseRow(TENANTS.maria),
    leaseRow(TENANTS.joshua),
    leaseRow(TENANTS.ronald),
    leaseRow(TENANTS.christine),
    leaseRow(TENANTS.angelo),
    leaseRow(TENANTS.mark, { signing_mode: "remote", signed_at: "2026-10-08T11:05:00.000Z", tenant_signed_at: "2026-10-08T10:42:00.000Z", landlord_signed_at: "2026-10-08T11:05:00.000Z", created_at: "2026-10-07T06:00:00.000Z" }),
    leaseRow(TENANTS.daniel, { status: "terminated", end_date: "2026-08-31", term_type: "open_ended" }),
    // Katrina: approved applicant, lease generated, waiting for HER e-signature (digital signing demo)
    leaseRow(K, { status: "pending_tenant_signature", tenant_signature: null, landlord_signature: null, signing_mode: "remote", signed_at: null, tenant_signed_at: null, landlord_signed_at: null, signature_lock_version: 0, created_at: "2026-10-16T07:20:00.000Z" }),
  ], "leases");

  const katrinaToken = jwt.sign({ leaseId: K.leaseId, actorId: K.id, role: "tenant", type: "lease_signing" }, JWT_SECRET, { expiresIn: "30d" });
  await db.from("leases").update({ signing_link_token_hash: sha256(katrinaToken) }).eq("id", K.leaseId);
  const katrinaSigningUrl = `${APP_URL}/signing/tenant/${K.leaseId}?token=${encodeURIComponent(katrinaToken)}`;

  await insert("lease_signing_audit", [
    { lease_id: TENANTS.mark.leaseId, event_type: "signing_link_generated", actor_id: LANDLORD.id, metadata: { signing_mode: "remote", email_sent: true, tenant_email: TENANTS.mark.email, expires_at: "2026-11-06T06:05:00.000Z" }, created_at: "2026-10-07T06:05:00.000Z" },
    { lease_id: TENANTS.mark.leaseId, event_type: "signing_link_accessed", actor_id: TENANTS.mark.id, ip_address: "112.198.76.41", user_agent: "Mozilla/5.0 (Linux; Android 14; SM-A546E) Chrome/130 Mobile", metadata: { signing_mode: "remote" }, created_at: "2026-10-08T10:38:00.000Z" },
    { lease_id: TENANTS.mark.leaseId, event_type: "tenant_signed", actor_id: TENANTS.mark.id, ip_address: "112.198.76.41", user_agent: "Mozilla/5.0 (Linux; Android 14; SM-A546E) Chrome/130 Mobile", metadata: { signing_mode: "remote", status_transition: "pending_tenant_signature -> pending_landlord_signature" }, created_at: "2026-10-08T10:42:00.000Z" },
    { lease_id: TENANTS.mark.leaseId, event_type: "landlord_signed", actor_id: LANDLORD.id, ip_address: "120.28.213.9", user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/130", metadata: { signing_mode: "remote", status_transition: "pending_landlord_signature -> active" }, created_at: "2026-10-08T11:05:00.000Z" },
    { lease_id: TENANTS.mark.leaseId, event_type: "lease_activated", actor_id: LANDLORD.id, metadata: { unit: "Room 301" }, created_at: "2026-10-08T11:05:01.000Z" },
    { lease_id: K.leaseId, event_type: "signing_link_generated", actor_id: LANDLORD.id, metadata: { signing_mode: "remote", email_sent: true, tenant_email: K.email, expires_at: iso(new Date(Date.now() + 30 * 86400_000)) }, created_at: "2026-10-16T07:22:00.000Z" },
    { lease_id: K.leaseId, event_type: "signing_link_accessed", actor_id: K.id, ip_address: "49.145.102.77", user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_6) Safari/605.1", metadata: { signing_mode: "remote" }, created_at: "2026-10-17T13:10:00.000Z" },
  ], "signing audit");
  ok("7 leases (5 active open-ended, 1 fixed-term, 1 terminated) + Katrina's lease pending e-signature");

  // ---- billing history ----------------------------------------------------
  step("Invoices, utility readings, receipts (Jan–Oct 2026)");
  const payments = [], items = [], readings = [], receipts = [], wfEvents = [];
  // Per-tenant meter baselines, so readings look continuous.
  const meters = {
    maria: { e: 4120, w: 212 }, joshua: { e: 3875, w: 188 }, ronald: { e: 2990, w: 240 }, christine: { e: 5310, w: 171 },
    angelo: { e: 1440, w: 96 }, daniel: { e: 6020, w: 305 }, mark: { e: 12, w: 3 },
  };
  const usageFor = (key, m) => {
    const base = { maria: [62, 3.4], joshua: [88, 4.1], ronald: [74, 4.8], christine: [96, 3.2], angelo: [58, 3.0], daniel: [81, 4.4], mark: [40, 2.0] }[key];
    const wobble = ((m * 7 + key.length * 3) % 5) - 2; // deterministic ±2
    return { kwh: base[0] + wobble * 4 + (m >= 4 && m <= 6 ? 18 : 0), cbm: Number((base[1] + wobble * 0.2).toFixed(1)) }; // summer months use more power
  };

  /**
   * Build one monthly invoice.
   * mode: "paid_gcash" | "paid_cash" | "pending" | "under_review" | "awaiting_cash" | "reminder_sent"
   */
  function monthlyInvoice(t, year, month, mode, opts = {}) {
    const u = unitByName[t.unit];
    const cycle = ymd(year, month, 1);
    const pid = uid(`pay:${t.key}:${cycle}`);
    const usage = usageFor(t.key, month);
    const elec = Number((usage.kwh * ELEC_RATE).toFixed(2));
    const water = Number((usage.cbm * WATER_RATE).toFixed(2));
    const subtotal = Number((u.rent + elec + water).toFixed(2));
    const lateFee = opts.lateFee ?? 0;
    const amount = Number((subtotal + lateFee).toFixed(2));
    const due = ymd(year, month, DUE_DAY);
    const periodEnd = ymd(year, month, new Date(year, month, 0).getDate());
    const paid = mode === "paid_gcash" || mode === "paid_cash";
    const paidDay = opts.paidDay ?? (t.key === "maria" ? 2 : t.key === "christine" ? 4 : 5);
    const paidAt = paid ? `${ymd(year, month, paidDay)}T${t.key === "christine" ? "09:15" : "12:40"}:00.000Z` : null;
    const m = meters[t.key];
    const rE = uid(`read:${t.key}:${cycle}:e`), rW = uid(`read:${t.key}:${cycle}:w`);
    readings.push(
      { id: rE, landlord_id: LANDLORD.id, lease_id: t.leaseId, property_id: PROPERTY_ID, unit_id: u.id, utility_type: "electricity", billing_mode: "tenant_paid", billing_period_start: cycle, billing_period_end: periodEnd, previous_reading: m.e, current_reading: m.e + usage.kwh, usage: usage.kwh, billed_rate: ELEC_RATE, computed_charge: elec, entered_at: `${periodEnd}T10:00:00.000Z`, payment_id: pid, note: "Read by caretaker", created_at: `${periodEnd}T10:00:00.000Z` },
      { id: rW, landlord_id: LANDLORD.id, lease_id: t.leaseId, property_id: PROPERTY_ID, unit_id: u.id, utility_type: "water", billing_mode: "tenant_paid", billing_period_start: cycle, billing_period_end: periodEnd, previous_reading: m.w, current_reading: Number((m.w + usage.cbm).toFixed(1)), usage: usage.cbm, billed_rate: WATER_RATE, computed_charge: water, entered_at: `${periodEnd}T10:05:00.000Z`, payment_id: pid, note: "Read by caretaker", created_at: `${periodEnd}T10:05:00.000Z` },
    );
    m.e += usage.kwh; m.w = Number((m.w + usage.cbm).toFixed(1));

    const base = {
      id: pid, lease_id: t.leaseId, tenant_id: t.id, landlord_id: LANDLORD.id, amount, subtotal,
      description: `${MONTH_NAMES[month - 1]} ${year} — Rent & Utilities (Room ${t.unit})`,
      due_date: due, invoice_number: invoiceNo(pid, cycle), billing_cycle: cycle, invoice_period_start: cycle, invoice_period_end: periodEnd,
      allow_partial_payments: false, due_day_snapshot: DUE_DAY, late_fee_amount: lateFee, late_fee_applied_at: lateFee ? `${ymd(year, month, DUE_DAY + 1)}T00:05:00.000Z` : null,
      created_at: `${cycle}T00:05:00.000Z`, updated_at: paidAt ?? `${cycle}T00:05:00.000Z`, metadata: { generated_by: "monthly_cron", room: `Room ${t.unit}` },
    };
    let row;
    if (paid) {
      const method = mode === "paid_gcash" ? "gcash" : "cash";
      row = { ...base, status: "completed", workflow_status: "receipted", method, intent_method: method === "gcash" ? "gcash" : "in_person", amount_tag: "exact", review_action: "confirm_received",
        paid_amount: amount, balance_remaining: 0, paid_at: paidAt, payment_submitted_at: paidAt, landlord_confirmed: true, last_action_at: paidAt, last_action_by: LANDLORD.id,
        reference_number: method === "gcash" ? `${1000 + month * 37 + t.key.length}${String(year).slice(2)}${pad(month)}${pad(paidDay)}` : null,
        receipt_number: receiptNo(pid, paidAt.slice(0, 10)) };
      receipts.push({ id: uid(`rcpt:${pid}`), payment_id: pid, landlord_id: LANDLORD.id, tenant_id: t.id, receipt_number: row.receipt_number, amount, issued_at: paidAt, issued_by: LANDLORD.id, method, amount_breakdown: { rent: u.rent, electricity: elec, water, late_fee: lateFee }, notes: method === "gcash" ? "GCash transfer verified against reference number." : "Cash received at the caretaker's office.", created_at: paidAt });
      wfEvents.push({ payment_id: pid, actor_id: t.id, action: method === "gcash" ? "tenant_payment_submitted_gcash" : "tenant_in_person_intent_submitted", source: "api", before_state: { workflow_status: "pending" }, after_state: { workflow_status: method === "gcash" ? "under_review" : "awaiting_in_person" }, created_at: paidAt },
        { payment_id: pid, actor_id: LANDLORD.id, action: "confirm_received", source: "api", before_state: { workflow_status: method === "gcash" ? "under_review" : "awaiting_in_person" }, after_state: { workflow_status: "receipted", receipt_number: row.receipt_number }, created_at: paidAt });
    } else if (mode === "under_review") {
      const submittedAt = opts.submittedAt;
      row = { ...base, status: "pending", workflow_status: "under_review", intent_method: "gcash", method: "gcash", paid_amount: 0, balance_remaining: amount, payment_submitted_at: submittedAt, reference_number: "1023447788812", payment_note: "Paid via GCash po, Room 102 rent + utilities. Sorry for the delay, late salary release.", payment_proof_path: opts.proof?.path ?? null, payment_proof_url: opts.proof?.url ?? null, last_action_at: submittedAt, last_action_by: t.id, updated_at: submittedAt };
      wfEvents.push({ payment_id: pid, actor_id: t.id, action: "tenant_payment_submitted_gcash", source: "api", before_state: { workflow_status: "pending" }, after_state: { workflow_status: "under_review", reference_number: row.reference_number }, created_at: submittedAt });
    } else if (mode === "awaiting_cash") {
      const at = opts.submittedAt;
      row = { ...base, status: "pending", workflow_status: "awaiting_in_person", intent_method: "in_person", paid_amount: 0, balance_remaining: amount, payment_submitted_at: at, in_person_intent_expires_at: opts.expiresAt, payment_note: "Magbabayad po ako ng cash sa office bukas ng umaga.", last_action_at: at, last_action_by: t.id, updated_at: at };
      wfEvents.push({ payment_id: pid, actor_id: t.id, action: "tenant_in_person_intent_submitted", source: "api", before_state: { workflow_status: "pending" }, after_state: { workflow_status: "awaiting_in_person", expires_at: opts.expiresAt }, created_at: at });
    } else if (mode === "reminder_sent") {
      const at = opts.reminderAt;
      row = { ...base, status: "pending", workflow_status: "reminder_sent", paid_amount: 0, balance_remaining: amount, reminder_sent_at: at, last_action_at: at, last_action_by: LANDLORD.id, updated_at: at };
      wfEvents.push({ payment_id: pid, actor_id: LANDLORD.id, action: "reminder_sent", source: "api", before_state: { workflow_status: "pending" }, after_state: { workflow_status: "reminder_sent" }, created_at: at });
    } else {
      row = { ...base, status: "pending", workflow_status: "pending", paid_amount: 0, balance_remaining: amount };
    }
    payments.push(row);
    items.push(
      { id: uid(`item:${pid}:rent`), payment_id: pid, label: "Base rent", amount: u.rent, category: "rent", sort_order: 0, metadata: {} },
      { id: uid(`item:${pid}:water`), payment_id: pid, label: "Water service", amount: water, category: "water", sort_order: 10, utility_type: "water", billing_mode: "tenant_paid", reading_id: rW, metadata: { included: false, usage: usage.cbm, rate: WATER_RATE } },
      { id: uid(`item:${pid}:elec`), payment_id: pid, label: "Electricity service", amount: elec, category: "electricity", sort_order: 20, utility_type: "electricity", billing_mode: "tenant_paid", reading_id: rE, metadata: { included: false, usage: usage.kwh, rate: ELEC_RATE } },
    );
    if (lateFee) items.push({ id: uid(`item:${pid}:late`), payment_id: pid, label: `Late payment fee (after ${MONTH_NAMES[month - 1]} ${DUE_DAY})`, amount: lateFee, category: "late_fee", sort_order: 30, metadata: {} });
    return row;
  }

  // Maria: Jan–Oct all paid via GCash (model tenant)
  for (let m = 1; m <= 10; m++) monthlyInvoice(TENANTS.maria, 2026, m, "paid_gcash");
  // Joshua: Jan–Sep paid; October overdue with late fee, GCash proof submitted → landlord must review
  for (let m = 1; m <= 9; m++) monthlyInvoice(TENANTS.joshua, 2026, m, m % 3 === 0 ? "paid_cash" : "paid_gcash", { paidDay: 6 });
  const joshuaOct = monthlyInvoice(TENANTS.joshua, 2026, 10, "under_review", { lateFee: LATE_FEE, submittedAt: "2026-10-12T12:41:00.000Z" });
  const gcashProof = await gcashProofFor(joshuaOct.amount);
  joshuaOct.payment_proof_path = gcashProof?.path ?? null; joshuaOct.payment_proof_url = gcashProof?.url ?? null;
  // Ronald: Jan–Sep paid (cash); October unpaid, reminder already sent
  for (let m = 1; m <= 9; m++) monthlyInvoice(TENANTS.ronald, 2026, m, "paid_cash", { paidDay: 5 });
  const ronaldOct = monthlyInvoice(TENANTS.ronald, 2026, 10, "reminder_sent", { lateFee: LATE_FEE, reminderAt: "2026-10-08T01:30:00.000Z" });
  // Christine: Jan–Oct all paid in cash at the office
  for (let m = 1; m <= 10; m++) monthlyInvoice(TENANTS.christine, 2026, m, "paid_cash");
  // Angelo: Feb–Sep paid; October — told the system he will pay cash (awaiting in-person collection)
  for (let m = 2; m <= 9; m++) monthlyInvoice(TENANTS.angelo, 2026, m, m % 2 ? "paid_gcash" : "paid_cash");
  const angeloOct = monthlyInvoice(TENANTS.angelo, 2026, 10, "awaiting_cash", { lateFee: LATE_FEE, submittedAt: hoursAgo(20), expiresAt: iso(new Date(Date.now() + 52 * 3600_000)) });
  // Daniel (moved out Aug 31): Jan–Aug paid
  for (let m = 1; m <= 8; m++) monthlyInvoice(TENANTS.daniel, 2026, m, "paid_gcash");
  // Mark (moved in Oct 10): move-in payments + first invoice for November (upcoming)
  const markUnit = unitByName[TENANTS.mark.unit];
  for (const [kind, label, desc] of [["advance", "Monthly Rent (Advance)", "Advance rent — 1 month (move-in requirement)"], ["deposit", "Security Deposit", "Security deposit — 1 month (refundable)"]]) {
    const pid = uid(`pay:mark:movein:${kind}`);
    const at = "2026-10-08T11:20:00.000Z";
    payments.push({ id: pid, lease_id: TENANTS.mark.leaseId, tenant_id: TENANTS.mark.id, landlord_id: LANDLORD.id, amount: markUnit.rent, subtotal: markUnit.rent, paid_amount: markUnit.rent, balance_remaining: 0,
      status: "completed", workflow_status: "receipted", method: "cash", intent_method: "in_person", amount_tag: "exact", review_action: "confirm_received", landlord_confirmed: true,
      description: desc, due_date: "2026-10-10", paid_at: at, payment_submitted_at: at, invoice_number: invoiceNo(pid, "2026-10-01"), billing_cycle: null, invoice_period_start: "2026-10-10", invoice_period_end: "2026-11-09",
      receipt_number: receiptNo(pid, "2026-10-08"), last_action_at: at, last_action_by: LANDLORD.id, created_at: at, updated_at: at, metadata: { move_in: true, requirement: kind } });
    items.push({ id: uid(`item:${pid}`), payment_id: pid, label, amount: markUnit.rent, category: kind === "advance" ? "rent" : "deposit", sort_order: 0, metadata: {} });
    receipts.push({ id: uid(`rcpt:${pid}`), payment_id: pid, landlord_id: LANDLORD.id, tenant_id: TENANTS.mark.id, receipt_number: receiptNo(pid, "2026-10-08"), amount: markUnit.rent, issued_at: at, issued_by: LANDLORD.id, method: "cash", amount_breakdown: kind === "advance" ? { rent: markUnit.rent } : { security_deposit: markUnit.rent }, notes: `${kind === "advance" ? "Advance rent" : "Security deposit"} paid and confirmed upon application approval.`, created_at: at });
  }
  const markNov = monthlyInvoice(TENANTS.mark, 2026, 11, "pending");
  markNov.created_at = "2026-10-16T00:05:00.000Z"; markNov.updated_at = markNov.created_at;
  markNov.description = "November 2026 — Rent & Utilities (Room 301) · first full month";

  await insert("payments", payments, "payments");
  await insert("utility_readings", readings, "utility readings");
  await insert("payment_items", items, "payment items");
  await insert("payment_receipts", receipts, "receipts");
  await insert("payment_workflow_audit_events", wfEvents, "workflow audit");
  ok(`${payments.length} invoices, ${items.length} line items, ${readings.length} meter readings, ${receipts.length} receipts`);

  // ---- expenses -----------------------------------------------------------
  await insert("expenses", [
    ["maintenance", 3800, "2026-01-18", "Replaced 2 ceiling fans (Rooms 103, 104)"],
    ["utilities", 2650, "2026-01-31", "Common-area electricity (hallway lights, CCTV, gate)"],
    ["taxes", 6200, "2026-01-20", "Business permit renewal — Valenzuela City Hall"],
    ["utilities", 2710, "2026-02-28", "Common-area electricity"],
    ["maintenance", 1500, "2026-03-12", "Septic tank siphoning"],
    ["utilities", 2890, "2026-04-30", "Common-area electricity (summer)"],
    ["maintenance", 12500, "2026-05-22", "Repaint 3rd floor hallway and Room 304"],
    ["other", 1800, "2026-06-05", "Fire extinguisher refill (4 units)"],
    ["utilities", 2740, "2026-07-31", "Common-area electricity"],
    ["maintenance", 4200, "2026-08-14", "CCTV DVR hard-drive replacement"],
    ["utilities", 2690, "2026-09-30", "Common-area electricity"],
    ["maintenance", 950, "2026-10-15", "Faucet supply line + compression fittings (Room 102)"],
  ].map(([category, amount, date_incurred, description], i) => ({ id: uid(`exp:${i}`), landlord_id: LANDLORD.id, property_id: PROPERTY_ID, unit_id: null, category, amount, date_incurred, description, created_at: `${date_incurred}T08:00:00.000Z` })), "expenses");
  ok("12 expense entries for the analytics ledger");

  // ---- maintenance --------------------------------------------------------
  step("Maintenance tickets");
  await insert("maintenance_requests", [
    { id: uid("mr:joshua:faucet"), unit_id: unitByName["102"].id, tenant_id: TENANTS.joshua.id, landlord_id: LANDLORD.id, title: "Leaking lavatory faucet", description: "Tumutulo po yung gripo sa lababo kahit nakasara. Umaabot ng kalahating timba sa loob ng 3 oras. Nag-corrode na ata yung supply line.", status: "in_progress", priority: "high", category: "plumbing", images: [leakPhoto1?.url, leakPhoto2?.url].filter(Boolean), repair_method: "third_party", third_party_name: "Mang Dodong Plumbing Services (Marulas)", photo_requested: true, tenant_repair_status: "personnel_arrived", tenant_provided_photos: [leakPhoto1?.url].filter(Boolean), ai_triage_priority: "high", ai_triage_sentiment: "negative", ai_triage_reason: "Continuous water loss and risk of damage to the vanity; plumbing issue that worsens if deferred.", ai_triage_confidence: 0.91, ai_triage_version: "v2", ai_triaged_at: "2026-10-14T00:15:00.000Z", created_at: "2026-10-13T23:12:00.000Z", updated_at: hoursAgo(5) },
    { id: uid("mr:mark:outlet"), unit_id: unitByName["301"].id, tenant_id: TENANTS.mark.id, landlord_id: LANDLORD.id, title: "Wall outlet sparking when aircon is plugged in", description: "May spark at amoy sunog sa outlet malapit sa aircon. Hindi ko muna ginagamit. Discolored na po yung cover.", status: "open", priority: "urgent", category: "electrical", images: [outletPhoto?.url].filter(Boolean), ai_triage_priority: "urgent", ai_triage_sentiment: "distressed", ai_triage_reason: "Electrical arcing and burning smell indicate a fire hazard; isolate the circuit and dispatch an electrician immediately.", ai_triage_confidence: 0.97, ai_triage_version: "v2", ai_triaged_at: hoursAgo(10), created_at: hoursAgo(11), updated_at: hoursAgo(10) },
    { id: uid("mr:christine:wifi"), unit_id: unitByName["203"].id, tenant_id: TENANTS.christine.id, landlord_id: LANDLORD.id, title: "Weak Wi-Fi signal on the 2nd floor", description: "Isang bar lang po ang Wi-Fi sa Room 203 tuwing gabi. Nahihirapan ako sa online classes ng kapatid ko pag bumibisita.", status: "assigned", priority: "medium", category: "internet", images: [], repair_method: "landlord", ai_triage_priority: "medium", ai_triage_sentiment: "neutral", ai_triage_reason: "Connectivity degradation; not safety-related. Suggest adding a mesh node on the 2nd floor.", ai_triage_confidence: 0.84, ai_triage_version: "v2", ai_triaged_at: daysAgo(3), created_at: daysAgo(3), updated_at: daysAgo(2) },
    { id: uid("mr:maria:lock"), unit_id: unitByName["101"].id, tenant_id: TENANTS.maria.id, landlord_id: LANDLORD.id, title: "Door knob loose / hard to lock", description: "Maluwag na yung door knob at minsan hindi nala-lock mula sa labas.", status: "resolved", priority: "medium", category: "carpentry", images: [], repair_method: "landlord", tenant_repair_status: "done", resolved_at: "2026-09-21T06:30:00.000Z", ai_triage_priority: "medium", ai_triage_sentiment: "neutral", ai_triage_reason: "Security-related hardware fault; replace the lockset.", ai_triage_confidence: 0.88, ai_triage_version: "v2", ai_triaged_at: "2026-09-19T03:00:00.000Z", created_at: "2026-09-19T02:48:00.000Z", updated_at: "2026-09-21T06:30:00.000Z" },
    { id: uid("mr:angelo:fan"), unit_id: unitByName["302"].id, tenant_id: TENANTS.angelo.id, landlord_id: LANDLORD.id, title: "Aircon not cooling, only blowing air", description: "Hindi na lumalamig yung aircon simula kahapon. Umaandar pero hangin lang.", status: "closed", priority: "high", category: "hvac", images: [], repair_method: "third_party", third_party_name: "CoolTech Aircon Cleaning – Karuhatan", tenant_repair_status: "done", resolved_at: "2026-08-03T09:00:00.000Z", created_at: "2026-07-30T13:20:00.000Z", updated_at: "2026-08-03T09:00:00.000Z" },
    { id: uid("mr:ronald:selfrepair"), unit_id: unitByName["202"].id, tenant_id: TENANTS.ronald.id, landlord_id: LANDLORD.id, title: "Request to replace my own shower head", description: "Gusto ko po sanang palitan yung shower head ng handheld type. Ako na po ang bibili at mag-iinstall, pwede po ba?", status: "open", priority: "low", category: "plumbing", images: [], self_repair_requested: true, self_repair_decision: "pending", repair_method: "self_repair", created_at: daysAgo(1), updated_at: daysAgo(1) },
  ], "maintenance");
  ok("6 tickets: urgent electrical (new), plumbing in progress, Wi-Fi assigned, self-repair request, 2 resolved/closed");

  // ---- applications & invites ---------------------------------------------
  step("Applications, invites, prospect payment portal");
  const checklist = (o = {}) => ({ valid_id: false, income_verified: false, background_checked: false, application_completed: false, inspection_done: false, lease_signed: false, payment_received: false, ...o });
  const inviteOnline = { id: uid("invite:online"), landlord_id: LANDLORD.id, property_id: PROPERTY_ID, unit_id: null, mode: "property", public_token: "fgd-apply-online-2026", token_hash: sha256("fgd-apply-online-2026"), status: "active", max_uses: 50, use_count: 3, application_type: "online", required_requirements: ["valid_id", "proof_of_income", "application_form"], payment_terms: { advance_rent_months: 1, security_deposit_months: 1, accepted_methods: ["gcash", "cash"] }, expires_at: iso(new Date(Date.now() + 60 * 86400_000)), last_used_at: daysAgo(2), created_at: "2026-09-01T02:00:00.000Z" };
  const inviteWalkin = { id: uid("invite:walkin103"), landlord_id: LANDLORD.id, property_id: PROPERTY_ID, unit_id: unitByName["103"].id, mode: "unit", public_token: "fgd-room103-walkin-2026", token_hash: sha256("fgd-room103-walkin-2026"), status: "active", max_uses: 1, use_count: 0, application_type: "face_to_face", required_requirements: ["valid_id", "application_form", "move_in_payment"], payment_terms: { advance_rent_months: 1, security_deposit_months: 1, accepted_methods: ["cash"] }, expires_at: iso(new Date(Date.now() + 14 * 86400_000)), created_at: daysAgo(4) };
  const inviteExisting = { id: uid("invite:existing104"), landlord_id: LANDLORD.id, property_id: PROPERTY_ID, unit_id: unitByName["104"].id, mode: "unit", public_token: "fgd-room104-existing-2026", token_hash: sha256("fgd-room104-existing-2026"), status: "active", max_uses: 1, use_count: 0, application_type: "existing_tenant", required_requirements: [], payment_terms: null, expires_at: iso(new Date(Date.now() + 30 * 86400_000)), created_at: daysAgo(6) };
  await insert("tenant_intake_invites", [inviteOnline, inviteWalkin, inviteExisting], "invites");
  await insert("tenant_intake_invite_events", [
    { invite_id: inviteOnline.id, event_type: "created", metadata: { by: LANDLORD.id }, created_at: inviteOnline.created_at },
    { invite_id: inviteOnline.id, event_type: "opened", metadata: {}, created_at: daysAgo(9) },
    { invite_id: inviteOnline.id, event_type: "submitted", metadata: { applicant: "Patricia Anne Cruz" }, created_at: daysAgo(9) },
    { invite_id: inviteOnline.id, event_type: "opened", metadata: {}, created_at: daysAgo(6) },
    { invite_id: inviteOnline.id, event_type: "submitted", metadata: { applicant: "Kevin Torres" }, created_at: daysAgo(6) },
    { invite_id: inviteOnline.id, event_type: "submitted", metadata: { applicant: "Katrina Mae Villanueva" }, created_at: "2026-10-15T05:30:00.000Z" },
    { invite_id: inviteWalkin.id, event_type: "created", metadata: { by: LANDLORD.id }, created_at: inviteWalkin.created_at },
    { invite_id: inviteExisting.id, event_type: "created", metadata: { by: LANDLORD.id, resident: OFFLINE_RESIDENTS["104"] }, created_at: inviteExisting.created_at },
  ], "invite events");

  const kevinPortalToken = "fgd-pay-kevin-portal-2026";
  const APPS = [
    // 1. Fresh walk-in, needs review → demo approve / reject
    { id: uid("app:jerome"), unit_id: unitByName["103"].id, applicant_id: null, landlord_id: LANDLORD.id, created_by: LANDLORD.id, status: "pending", application_source: "walk_in_application", invite_id: null,
      applicant_name: "Jerome Pascual", applicant_email: "jerome.pascual@ireside.ph", applicant_phone: "+639181234511", employment_status: "Line Leader", monthly_income: 19500, employment_info: { occupation: "Line Leader", employer: "Mitsuba Philippines – Marulas", monthly_income: 19500 }, move_in_date: "2026-11-01",
      emergency_contact_name: "Lorna Pascual (Mother)", emergency_contact_phone: "+639181234611", reference_name: "Bernard Mendoza (Room 104, co-worker)", reference_phone: "+639181234612",
      message: "Referred by Bernard of Room 104. Can move in by Nov 1, cash payment for advance and deposit.", documents: [], compliance_checklist: checklist({ application_completed: true, valid_id: true }), requirements_checklist: checklist({ application_completed: true, valid_id: true }), created_at: daysAgo(1, 3), updated_at: daysAgo(1, 3) },
    // 2. Online application under review (income verified)
    { id: uid("app:patricia"), unit_id: unitByName["103"].id, applicant_id: null, landlord_id: LANDLORD.id, created_by: null, status: "reviewing", application_source: "invite_link", invite_id: inviteOnline.id,
      applicant_name: "Patricia Anne Cruz", applicant_email: "patricia.cruz@ireside.ph", applicant_phone: "+639181234512", employment_status: "Student", monthly_income: 10000, employment_info: { occupation: "2nd Year BS Accountancy", employer: "Our Lady of Fatima University", monthly_income: 10000, income_source: "Parental allowance" }, move_in_date: "2026-11-15",
      emergency_contact_name: "Antonio Cruz (Father)", emergency_contact_phone: "+639181234613", reference_name: null, reference_phone: null,
      message: "Looking for a quiet room near OLFU. My father will pay the advance and deposit via GCash.", documents: [], compliance_checklist: checklist({ application_completed: true, valid_id: true, income_verified: true }), requirements_checklist: checklist({ application_completed: true, valid_id: true, income_verified: true }), reviewed_at: daysAgo(7), created_at: daysAgo(9), updated_at: daysAgo(7) },
    // 3. Approved, waiting for move-in payment through the prospect portal
    { id: uid("app:kevin"), unit_id: unitByName["303"].id, applicant_id: null, landlord_id: LANDLORD.id, created_by: null, status: "payment_pending", application_source: "invite_link", invite_id: inviteOnline.id,
      applicant_name: "Kevin Torres", applicant_email: "kevin.torres@ireside.ph", applicant_phone: "+639181234513", employment_status: "Quality Inspector", monthly_income: 22000, employment_info: { occupation: "Quality Inspector", employer: "Toyota Valenzuela Parts Depot", monthly_income: 22000 }, move_in_date: "2026-10-25",
      emergency_contact_name: "Imelda Torres (Mother)", emergency_contact_phone: "+639181234614", reference_name: null, reference_phone: null,
      message: "Need an air-conditioned room; night shift so I sleep in the daytime.", documents: [], compliance_checklist: checklist({ application_completed: true, valid_id: true, income_verified: true, background_checked: true }), requirements_checklist: checklist({ application_completed: true, valid_id: true, income_verified: true, background_checked: true, move_in_payment: false }),
      payment_pending_started_at: daysAgo(2, 6), payment_pending_expires_at: iso(new Date(Date.now() + 3 * 86400_000)), payment_portal_token_hash: sha256(kevinPortalToken), payment_portal_token_expires_at: iso(new Date(Date.now() + 3 * 86400_000)), reviewed_at: daysAgo(2, 6), created_at: daysAgo(6), updated_at: daysAgo(2, 6) },
    // 4. Katrina — approved, lease generated, waiting for signature
    { id: uid("app:katrina"), unit_id: unitByName["201"].id, applicant_id: K.id, landlord_id: LANDLORD.id, created_by: null, status: "approved", application_source: "invite_link", invite_id: inviteOnline.id, lease_id: K.leaseId,
      applicant_name: K.name, applicant_email: K.email, applicant_phone: K.phone, employment_status: "Student", monthly_income: 12000, employment_info: { occupation: K.occupation, employer: K.employer, monthly_income: 12000, income_source: "Parental allowance" }, move_in_date: "2026-11-01",
      emergency_contact_name: K.emergency[0], emergency_contact_phone: K.emergency[1], reference_name: "Maria Angelica Santos (Room 101, cousin)", reference_phone: TENANTS.maria.phone,
      message: "Cousin of Maria in Room 101. Clinical duty starts November so I'd like to move in by Nov 1.", documents: [], compliance_checklist: checklist({ application_completed: true, valid_id: true, income_verified: true, background_checked: true, payment_received: true }), requirements_checklist: checklist({ application_completed: true, valid_id: true, income_verified: true, background_checked: true, payment_received: true, move_in_payment: true }), reviewed_at: "2026-10-16T07:15:00.000Z", created_at: "2026-10-15T05:30:00.000Z", updated_at: "2026-10-16T07:22:00.000Z" },
    // 5. Mark — approved earlier this month (history)
    { id: uid("app:mark"), unit_id: unitByName["301"].id, applicant_id: TENANTS.mark.id, landlord_id: LANDLORD.id, created_by: LANDLORD.id, status: "approved", application_source: "walk_in_application", invite_id: null, lease_id: TENANTS.mark.leaseId,
      applicant_name: TENANTS.mark.name, applicant_email: TENANTS.mark.email, applicant_phone: TENANTS.mark.phone, employment_status: TENANTS.mark.occupation, monthly_income: TENANTS.mark.income, employment_info: { occupation: TENANTS.mark.occupation, employer: TENANTS.mark.employer, monthly_income: TENANTS.mark.income }, move_in_date: "2026-10-10",
      emergency_contact_name: TENANTS.mark.emergency[0], emergency_contact_phone: TENANTS.mark.emergency[1], reference_name: null, reference_phone: null,
      message: "Walked in on Oct 7 after seeing the gate flyer.", documents: [], compliance_checklist: checklist({ application_completed: true, valid_id: true, income_verified: true, background_checked: true, lease_signed: true, payment_received: true, inspection_done: true }), requirements_checklist: checklist({ application_completed: true, valid_id: true, income_verified: true, background_checked: true, lease_signed: true, payment_received: true, move_in_payment: true }), reviewed_at: "2026-10-07T06:00:00.000Z", created_at: "2026-10-07T05:10:00.000Z", updated_at: "2026-10-08T11:05:00.000Z" },
    // 6. Rejected (history)
    { id: uid("app:rejected"), unit_id: unitByName["303"].id, applicant_id: null, landlord_id: LANDLORD.id, created_by: null, status: "rejected", application_source: "invite_link", invite_id: inviteOnline.id,
      applicant_name: "Rico Salazar", applicant_email: "rico.salazar@ireside.ph", applicant_phone: "+639181234514", employment_status: "Freelance", monthly_income: 8000, employment_info: { occupation: "Freelance", employer: "Self-employed", monthly_income: 8000 }, move_in_date: "2026-10-01",
      emergency_contact_name: "—", emergency_contact_phone: "+639181234615", message: "Can I bring my dog?", documents: [], compliance_checklist: checklist({ application_completed: true }), requirements_checklist: checklist({ application_completed: true }), reviewed_at: "2026-09-22T08:00:00.000Z", created_at: "2026-09-20T10:00:00.000Z", updated_at: "2026-09-22T08:00:00.000Z" },
  ];
  await insert("applications", APPS, "applications");
  await insert("application_payment_requests", [
    { id: uid("apr:kevin:advance"), application_id: uid("app:kevin"), landlord_id: LANDLORD.id, requirement_type: "advance_rent", amount: 5500, due_at: iso(new Date(Date.now() + 3 * 86400_000)).slice(0, 10), status: "pending", metadata: { room: "Room 303" }, created_at: daysAgo(2, 6) },
    { id: uid("apr:kevin:deposit"), application_id: uid("app:kevin"), landlord_id: LANDLORD.id, requirement_type: "security_deposit", amount: 5500, due_at: iso(new Date(Date.now() + 3 * 86400_000)).slice(0, 10), status: "pending", metadata: { room: "Room 303" }, created_at: daysAgo(2, 6) },
  ], "application payment requests");
  await insert("application_payment_audit_events", [
    { application_id: uid("app:kevin"), payment_request_id: uid("apr:kevin:advance"), actor_id: LANDLORD.id, actor_role: "landlord", event_type: "request_generated", metadata: { amount: 5500, requirement: "advance_rent" }, created_at: daysAgo(2, 6) },
    { application_id: uid("app:kevin"), payment_request_id: uid("apr:kevin:deposit"), actor_id: LANDLORD.id, actor_role: "landlord", event_type: "request_generated", metadata: { amount: 5500, requirement: "security_deposit" }, created_at: daysAgo(2, 6) },
    { application_id: uid("app:kevin"), actor_role: "prospect", event_type: "portal_opened", metadata: { via: "email_link" }, created_at: daysAgo(1, 12) },
  ], "application payment audit");
  await insert("landlord_inquiry_actions", [
    { inquiry_id: uid("app:jerome"), landlord_id: LANDLORD.id, is_read: false },
    { inquiry_id: uid("app:patricia"), landlord_id: LANDLORD.id, is_read: true },
  ], "inquiry actions");
  ok("6 applications (pending, reviewing, payment-pending, 2 approved, rejected) + 3 invite links");

  // ---- lifecycle requests --------------------------------------------------
  step("Renewal, move-out, unit transfer, reviews");
  await insert("renewal_requests", [{
    id: uid("renewal:christine"), current_lease_id: TENANTS.christine.leaseId, tenant_id: TENANTS.christine.id, landlord_id: LANDLORD.id,
    proposed_start_date: "2026-12-01", proposed_end_date: "2027-11-30", proposed_monthly_rent: 5250, proposed_security_deposit: 5000,
    terms_json: { ...leaseTerms(5250), renewal_note: "5% adjustment per property renewal policy" }, status: "pending", landlord_notes: null, created_at: daysAgo(4), updated_at: daysAgo(4),
  }], "renewal request");
  await insert("move_out_requests", [
    { id: uid("moveout:ronald"), lease_id: TENANTS.ronald.leaseId, tenant_id: TENANTS.ronald.id, landlord_id: LANDLORD.id, reason: "Transferring to our company's Cebu distribution center starting December.", requested_date: "2026-11-30", status: "pending", notes: "Will settle the October balance this week. Requesting inspection on Nov 28 (Saturday).", checklist_completed: false, checklist_data: { keys_returned: false, room_cleaned: false, utilities_settled: false, forwarding_address: "Mandaue City, Cebu" }, deposit_deductions: {}, created_at: daysAgo(3), updated_at: daysAgo(3) },
    { id: uid("moveout:daniel"), lease_id: TENANTS.daniel.leaseId, tenant_id: TENANTS.daniel.id, landlord_id: LANDLORD.id, reason: "Got married; moving to our own place in Meycauayan.", requested_date: "2026-08-31", status: "completed", notes: "Model resident for a year.", approved_at: "2026-08-02T03:00:00.000Z", completed_at: "2026-09-01T08:30:00.000Z", inspection_date: "2026-08-31", inspection_notes: "Room in good condition. Minor wall scuffs; one missing curtain rod bracket.", inspection_photos: [], deposit_deductions: { cleaning: 300, curtain_rod_bracket: 150 }, deposit_refund_amount: 5050, checklist_completed: true, checklist_data: { keys_returned: true, room_cleaned: true, utilities_settled: true, forwarding_address: "Meycauayan, Bulacan" }, created_at: "2026-07-28T10:00:00.000Z", updated_at: "2026-09-01T08:30:00.000Z" },
  ], "move-out requests");
  await insert("unit_transfer_requests", [{
    id: uid("transfer:angelo"), lease_id: TENANTS.angelo.leaseId, tenant_id: TENANTS.angelo.id, landlord_id: LANDLORD.id, property_id: PROPERTY_ID,
    current_unit_id: unitByName["302"].id, requested_unit_id: unitByName["303"].id, reason: "Room 303 faces away from the main road; the traffic noise on my side makes it hard to sleep after night deliveries.", status: "pending", created_at: daysAgo(2), updated_at: daysAgo(2),
  }], "unit transfer");
  await insert("landlord_reviews", [
    { id: uid("review:maria"), lease_id: TENANTS.maria.leaseId, landlord_id: LANDLORD.id, tenant_id: TENANTS.maria.id, rating: 5, comment: "Mabilis sumagot si Sir John sa repairs at malinaw ang billing. Safe ang dorm, may CCTV at biometric gate.", created_at: "2026-06-10T04:00:00.000Z" },
    { id: uid("review:daniel"), lease_id: TENANTS.daniel.leaseId, landlord_id: LANDLORD.id, tenant_id: TENANTS.daniel.id, rating: 4, comment: "One year without issues. Deposit was returned within 2 days of moving out, with an itemized breakdown.", created_at: "2026-09-03T02:00:00.000Z" },
  ], "reviews");
  ok("Renewal (pending), move-out (1 pending, 1 completed), transfer (pending), 2 reviews");

  // ---- amenities ----------------------------------------------------------
  step("Amenities & bookings");
  const AMENITIES = [
    { id: uid("am:study"), name: "Study Hall", type: "Room", icon_name: "BookOpen", capacity: 20, price_per_unit: 0, unit_type: "free", location_details: "Ground floor, beside the lounge", description: "Air-conditioned study hall with 20 seats, whiteboard and fast Wi-Fi. Open 6 AM – 12 MN.", tags: ["Study", "Wi-Fi", "Quiet"] },
    { id: uid("am:laundry"), name: "Laundry Area", type: "Amenity", icon_name: "Droplets", capacity: 4, price_per_unit: 60, unit_type: "hour", location_details: "Back lot, ground floor", description: "Two washing machines and a spin dryer. ₱60 per hour per machine; book a slot to avoid waiting.", tags: ["Laundry"] },
    { id: uid("am:kitchen"), name: "Common Kitchen", type: "Room", icon_name: "Utensils", capacity: 6, price_per_unit: 0, unit_type: "free", location_details: "Ground floor", description: "Two-burner stoves, refrigerator, rice cookers. Clean as you go.", tags: ["Cooking"] },
    { id: uid("am:rooftop"), name: "Rooftop Drying Area", type: "Amenity", icon_name: "Sun", capacity: 10, price_per_unit: 0, unit_type: "free", location_details: "Rooftop", description: "Clotheslines and a covered area. Doubles as the venue for dorm events.", tags: ["Outdoor"] },
  ].map((a) => ({ ...a, property_id: PROPERTY_ID, landlord_id: LANDLORD.id, status: "Active", image_url: "/art/amenity.svg", created_at: "2026-01-15T03:00:00.000Z" }));
  await insert("amenities", AMENITIES, "amenities");
  const nextDay = (n) => iso(new Date(Date.now() + n * 86400_000)).slice(0, 10);
  await insert("amenity_bookings", [
    { id: uid("bk:christine:study"), amenity_id: uid("am:study"), tenant_id: TENANTS.christine.id, landlord_id: LANDLORD.id, booking_date: nextDay(2), start_time: "18:00:00", end_time: "21:00:00", total_price: 0, status: "Pending", notes: "CPA board review group, 4 people", created_at: hoursAgo(6) },
    { id: uid("bk:maria:laundry"), amenity_id: uid("am:laundry"), tenant_id: TENANTS.maria.id, landlord_id: LANDLORD.id, booking_date: nextDay(1), start_time: "07:00:00", end_time: "09:00:00", total_price: 120, status: "Confirmed", notes: null, created_at: daysAgo(1) },
    { id: uid("bk:joshua:rooftop"), amenity_id: uid("am:rooftop"), tenant_id: TENANTS.joshua.id, landlord_id: LANDLORD.id, booking_date: daysAgo(10).slice(0, 10), start_time: "16:00:00", end_time: "19:00:00", total_price: 0, status: "Completed", notes: "Birthday salo-salo", created_at: daysAgo(12) },
  ], "bookings");
  ok("4 amenities, 3 bookings (pending / confirmed / completed)");

  // ---- community ----------------------------------------------------------
  step("Community board");
  const POSTS = [
    { id: uid("post:water"), author_id: LANDLORD.id, author_role: "landlord", type: "announcement", title: "Scheduled water interruption — Tuesday, Oct 21", content: "Maynilad will cut supply in Marulas from 8:00 AM to 12:00 NN on Tuesday for pipe replacement along M. H. del Pilar. Please fill your containers Monday night. The rooftop tank will cover toilets and the kitchen.", is_pinned: true, created_at: daysAgo(2, 1), view_count: 23 },
    { id: uid("post:poll"), author_id: LANDLORD.id, author_role: "landlord", type: "poll", title: "Dorm Christmas party — which Saturday works?", content: "Potluck + exchange gift (₱300 cap) at the rooftop. Vote so we can book the sound system.", metadata: { options: ["December 13 (Sat)", "December 20 (Sat)", "December 21 (Sun)"] }, created_at: daysAgo(5), view_count: 31 },
    { id: uid("post:fan"), author_id: TENANTS.maria.id, author_role: "tenant", type: "discussion", title: "Selling: 16-inch stand fan (Asahi), ₱600", content: "Lumipat ako sa aircon room kaya hindi ko na kailangan. Mint condition, 8 months old. Message me or drop by Room 101.", created_at: daysAgo(4), view_count: 17 },
    { id: uid("post:album"), author_id: LANDLORD.id, author_role: "landlord", type: "photo_album", title: "Marulas Fiesta 2026 — rooftop boodle fight", content: "Salamat sa lahat ng sumali! Photos from last Saturday.", created_at: daysAgo(12), view_count: 42 },
    { id: uid("post:laundry"), author_id: LANDLORD.id, author_role: "landlord", type: "announcement", title: "New laundry schedule starting November", content: "To avoid the Sunday pile-up, laundry slots are now bookable in the app under Amenities (max 2 hours per booking). Walk-ins are still fine if a machine is free.", created_at: daysAgo(8), view_count: 28 },
    { id: uid("post:wifi"), author_id: TENANTS.christine.id, author_role: "tenant", type: "discussion", title: "2nd floor Wi-Fi — anyone else lagging at night?", content: "Around 9 PM the signal drops to one bar in Room 203. I filed a ticket already, just checking if 201/202/204 experience the same.", created_at: daysAgo(3), view_count: 12 },
  ].map((p) => ({ ...p, property_id: PROPERTY_ID, status: "published", is_approved: true, is_moderated: false, is_pinned: p.is_pinned ?? false, updated_at: p.created_at }));
  await insert("community_posts", POSTS, "posts");
  await insert("community_comments", [
    { id: uid("c:1"), post_id: uid("post:fan"), author_id: TENANTS.joshua.id, content: "Interested! Pwede ba makita mamaya after shift, around 7 PM?", created_at: daysAgo(4, 13) },
    { id: uid("c:2"), post_id: uid("post:fan"), author_id: TENANTS.maria.id, parent_comment_id: uid("c:1"), content: "Sure, I'm home by 6. Knock lang.", created_at: daysAgo(4, 14) },
    { id: uid("c:3"), post_id: uid("post:wifi"), author_id: TENANTS.ronald.id, content: "Same sa 202. Okay naman pag umaga.", created_at: daysAgo(3, 10) },
    { id: uid("c:4"), post_id: uid("post:wifi"), author_id: LANDLORD.id, content: "Noted — a mesh node for the 2nd floor arrives Thursday. Will post once installed.", created_at: daysAgo(2, 2) },
    { id: uid("c:5"), post_id: uid("post:water"), author_id: TENANTS.angelo.id, content: "Thanks for the heads-up Sir.", created_at: daysAgo(2, 3) },
    { id: uid("c:6"), post_id: uid("post:poll"), author_id: TENANTS.christine.id, content: "Dec 20 please, may board exam review ako Dec 13.", created_at: daysAgo(4, 20) },
  ], "comments");
  await insert("community_reactions", [
    { post_id: uid("post:water"), user_id: TENANTS.maria.id, reaction_type: "thumbs_up" }, { post_id: uid("post:water"), user_id: TENANTS.joshua.id, reaction_type: "thumbs_up" }, { post_id: uid("post:water"), user_id: TENANTS.ronald.id, reaction_type: "like" },
    { post_id: uid("post:album"), user_id: TENANTS.maria.id, reaction_type: "heart" }, { post_id: uid("post:album"), user_id: TENANTS.christine.id, reaction_type: "celebration" }, { post_id: uid("post:album"), user_id: TENANTS.angelo.id, reaction_type: "clap" }, { post_id: uid("post:album"), user_id: TENANTS.joshua.id, reaction_type: "heart" },
    { post_id: uid("post:fan"), user_id: TENANTS.christine.id, reaction_type: "like" }, { post_id: uid("post:laundry"), user_id: TENANTS.maria.id, reaction_type: "thumbs_up" },
  ], "reactions");
  await insert("community_poll_votes", [
    { poll_id: uid("post:poll"), user_id: TENANTS.maria.id, option_index: 1 }, { poll_id: uid("post:poll"), user_id: TENANTS.joshua.id, option_index: 0 },
    { poll_id: uid("post:poll"), user_id: TENANTS.christine.id, option_index: 1 }, { poll_id: uid("post:poll"), user_id: TENANTS.ronald.id, option_index: 2 }, { poll_id: uid("post:poll"), user_id: TENANTS.angelo.id, option_index: 1 },
  ], "poll votes");
  const album = (await insert("community_albums", [{ id: uid("album:fiesta"), post_id: uid("post:album"), property_id: PROPERTY_ID, cover_photo_url: albumPhoto1?.url ?? null, photo_count: 2 }], "album"))[0];
  if (album) await insert("community_photos", [
    { album_id: album.id, url: albumPhoto1?.url ?? "/art/property.svg", caption: "Boodle fight!", display_order: 0, uploaded_by: LANDLORD.id },
    { album_id: album.id, url: albumPhoto2?.url ?? "/art/property.svg", caption: "Karaoke champion: Room 203", display_order: 1, uploaded_by: LANDLORD.id },
  ], "album photos");
  await insert("saved_posts", [{ user_id: TENANTS.joshua.id, post_id: uid("post:fan") }], "saved posts");
  ok("6 posts (pinned notice, poll with 5 votes, album, discussions) + comments + reactions");

  // ---- messaging ----------------------------------------------------------
  step("Messages");
  const convs = [], parts = [], msgs = [];
  const chat = (t, lines) => {
    const cid = uid(`conv:${t.key}`);
    convs.push({ id: cid, created_at: lines[0][2], updated_at: lines[lines.length - 1][2] });
    parts.push({ conversation_id: cid, user_id: LANDLORD.id }, { conversation_id: cid, user_id: t.id });
    for (const [who, content, at, extra] of lines) msgs.push({ conversation_id: cid, sender_id: who === "L" ? LANDLORD.id : t.id, type: extra?.type ?? "text", content, metadata: extra?.metadata ?? null, created_at: at, read_at: who === "L" ? at : (extra?.unread ? null : at) });
  };
  chat(TENANTS.joshua, [
    ["T", `Sir John, good evening po. Pasensya na late ang October ko, na-delay yung sahod namin sa plant. Nag-GCash na po ako kanina, ${peso(joshuaOct.amount)} kasama na yung late fee.`, "2026-10-12T12:45:00.000Z"],
    ["L", "Noted Joshua, salamat sa update. I'll verify the reference number tonight and send the receipt sa app.", "2026-10-12T13:02:00.000Z"],
    ["T", "Thank you po! Pati po pala yung gripo sa lababo, tumutulo pa rin. Na-upload ko na po yung pictures sa ticket.", "2026-10-14T00:20:00.000Z"],
    ["L", "Mang Dodong will drop by tomorrow 9 AM. Please leave the key with Ate Baby if you're on shift.", "2026-10-14T01:10:00.000Z"],
    ["T", "Sige po, iiwan ko kay Ate Baby. Salamat!", "2026-10-14T01:14:00.000Z", { unread: true }],
  ]);
  chat(TENANTS.maria, [
    ["L", "Hi Maria! Reminder lang, Tuesday 8 AM–12 NN walang tubig (Maynilad). Pinost ko na rin sa board.", daysAgo(2, 1)],
    ["T", "Noted Sir, thank you! Also, my cousin Katrina applied for Room 201 — she'll sign the lease online this week.", daysAgo(2, 2)],
    ["L", "Yes, approved na siya. Sent her the signing link kahapon. Welcome to the dorm, Katrina!", daysAgo(2, 3)],
  ]);
  chat(TENANTS.katrina, [
    ["L", `Hi Katrina, congratulations! Your application for Room 201 is approved. I emailed the lease for e-signature — you can also open it under Lease in the app. Move-in is Nov 1. Advance and deposit (₱5,000 each) can be paid via GCash or cash at the office.`, "2026-10-16T07:30:00.000Z"],
    ["T", "Thank you po Sir John! I opened the link on my phone, will sign it tonight after duty.", "2026-10-17T13:12:00.000Z", { unread: true }],
  ]);
  chat(TENANTS.ronald, [
    ["T", "Sir, nag-file na po ako ng move-out request sa app. Last day ko po Nov 30. Lilipat po ako sa Cebu DC namin.", daysAgo(3, 5)],
    ["L", "Received, Ronald. Sayang, you were one of the first residents here. I'll schedule the inspection on Nov 28. Please settle October muna so the deposit computation is clean.", daysAgo(3, 6)],
    ["T", "Yes po, babayaran ko po this Friday pag sahod.", daysAgo(3, 7)],
  ]);
  chat(TENANTS.christine, [
    ["T", "Good morning Sir! Nag-send po ako ng renewal request, 1 year ulit. Okay lang po ba yung 5% increase, ₱5,250 na po?", daysAgo(4, 2)],
    ["L", "Good morning Christine. Yes, that follows the yearly adjustment. I'll approve it this week and the new contract will show up for signing.", daysAgo(4, 3)],
  ]);
  chat(TENANTS.mark, [
    ["L", "Welcome to Fernando Gonzales Dormitory, Mark! Your lease is active and the November invoice will appear on the 1st. Wi-Fi: FGDorm_Residents / Marulas2026.", "2026-10-08T11:10:00.000Z"],
    ["T", "Thanks Sir! One concern — the outlet near the aircon sparked when I plugged it in. I filed a ticket with a photo. Not using it for now.", hoursAgo(10.5), { unread: true }],
  ]);
  chat(TENANTS.angelo, [
    ["T", "Sir, cash po ako for October, dadaan ako sa office bukas ng umaga mga 8 AM. Pinindot ko na po yung 'pay in person' sa app.", hoursAgo(19.5)],
    ["L", "Okay Angelo, I'll be at the office. Dalhin mo na rin yung ID mo para sa transfer request mo to Room 303.", hoursAgo(18)],
  ]);
  await insert("conversations", convs, "conversations");
  await insert("conversation_participants", parts, "participants");
  await insert("messages", msgs, "messages");
  ok(`${convs.length} landlord↔tenant conversations, ${msgs.length} messages`);

  // ---- notifications ------------------------------------------------------
  step("Notifications");
  const N = [];
  const notify = (user_id, type, title, message, data = {}, created_at = hoursAgo(1), read = false) => N.push({ user_id, type, title, message, data, read, created_at });
  // Landlord inbox
  notify(LANDLORD.id, "maintenance", "URGENT: Electrical hazard reported — Room 301", "Mark Anthony Lim reported a sparking outlet. iRis triage: urgent, fire risk. Dispatch an electrician.", { maintenance_id: uid("mr:mark:outlet"), unit: "Room 301" }, hoursAgo(10));
  notify(LANDLORD.id, "payment", "GCash payment awaiting review — Room 102", `Joshua Miguel Dela Cruz submitted ${peso(joshuaOct.amount)} for October 2026 (ref 1023447788812). Review the proof to issue a receipt.`, { payment_id: joshuaOct.id }, "2026-10-12T12:42:00.000Z");
  notify(LANDLORD.id, "payment", "Angelo Fernandez will pay in person", "October 2026 for Room 302 — cash collection expected at the office within 72 hours.", { payment_id: angeloOct.id }, hoursAgo(20));
  notify(LANDLORD.id, "application", "New walk-in application — Jerome Pascual", "Applying for Room 103, move-in Nov 1. Referred by Room 104.", { application_id: uid("app:jerome") }, daysAgo(1, 3));
  notify(LANDLORD.id, "lease", "Move-out request — Room 202", "Ronald Bautista requested to move out on Nov 30, 2026.", { move_out_id: uid("moveout:ronald"), lease_id: TENANTS.ronald.leaseId }, daysAgo(3, 5));
  notify(LANDLORD.id, "lease_renewal_request", "Renewal request — Room 203", "Christine Joy Reyes requested a 12-month renewal at ₱5,250/month.", { renewal_id: uid("renewal:christine"), lease_id: TENANTS.christine.leaseId }, daysAgo(4, 2));
  notify(LANDLORD.id, "lease", "Unit transfer request — Room 302 → 303", "Angelo Fernandez asked to transfer to Room 303.", { transfer_id: uid("transfer:angelo") }, daysAgo(2));
  notify(LANDLORD.id, "lease", "Signing link opened — Katrina Mae Villanueva", "Katrina opened the e-signature link for Room 201. Waiting for her signature.", { lease_id: K.leaseId }, "2026-10-17T13:10:00.000Z");
  notify(LANDLORD.id, "message", "New message from Mark Anthony Lim", "“…the outlet near the aircon sparked when I plugged it in…”", { conversation_id: uid("conv:mark") }, hoursAgo(10.5));
  notify(LANDLORD.id, "payment", "October collections: 3 of 6 invoices settled", "Paid: Rooms 101, 203, 301 (move-in). Outstanding: Rooms 102 (under review), 202 (reminder sent), 302 (cash pending).", { month: "2026-10" }, daysAgo(1, 0), true);
  // Tenant inboxes
  notify(TENANTS.maria.id, "payment", "Receipt issued — October 2026", "Your GCash payment was confirmed. Receipt available under Payments.", { payment_id: uid("pay:maria:2026-10-01") }, "2026-10-02T13:00:00.000Z", true);
  notify(TENANTS.maria.id, "announcement", "Water interruption on Tuesday, Oct 21", "8:00 AM – 12:00 NN. Fill your containers Monday night.", { post_id: uid("post:water") }, daysAgo(2, 1));
  notify(TENANTS.joshua.id, "payment", "Payment received — pending landlord verification", `Your GCash submission of ${peso(joshuaOct.amount)} is under review.`, { payment_id: joshuaOct.id }, "2026-10-12T12:42:00.000Z", true);
  notify(TENANTS.joshua.id, "maintenance", "Technician assigned to your ticket", "Mang Dodong Plumbing Services will visit Oct 15, 9:00 AM.", { maintenance_id: uid("mr:joshua:faucet") }, "2026-10-14T01:12:00.000Z");
  notify(TENANTS.katrina.id, "lease", "Your lease is ready to sign", "Room 201 · ₱5,000/month · move-in Nov 1, 2026. Review and e-sign the agreement.", { lease_id: K.leaseId }, "2026-10-16T07:22:00.000Z");
  notify(TENANTS.ronald.id, "payment", "Payment reminder — October 2026 is overdue", `₱${ronaldOct.amount.toLocaleString()} was due Oct 5. A ₱200 late fee has been applied.`, { payment_id: ronaldOct.id }, "2026-10-08T01:30:00.000Z");
  notify(TENANTS.ronald.id, "lease", "Move-out request received", "Your request to vacate on Nov 30 is pending landlord review.", { move_out_id: uid("moveout:ronald") }, daysAgo(3, 5), true);
  notify(TENANTS.christine.id, "lease_renewal_available", "Your lease renewal window is open", "Your fixed-term lease ends Nov 30, 2026. You may request a renewal.", { lease_id: TENANTS.christine.leaseId, end_date: "2026-11-30" }, "2026-09-02T00:00:00.000Z", true);
  notify(TENANTS.christine.id, "lease_renewal_request", "Renewal request submitted", "Waiting for landlord approval (proposed ₱5,250/month, Dec 1 2026 – Nov 30 2027).", { renewal_id: uid("renewal:christine") }, daysAgo(4, 2), true);
  notify(TENANTS.mark.id, "lease", "Lease activated — welcome!", "Both parties signed. Your tenancy for Room 301 started Oct 10, 2026.", { lease_id: TENANTS.mark.leaseId }, "2026-10-08T11:05:00.000Z");
  notify(TENANTS.mark.id, "payment", "November invoice available", `₱${markNov.amount.toLocaleString()} due Nov 5, 2026.`, { payment_id: markNov.id }, "2026-10-16T00:05:00.000Z");
  notify(TENANTS.angelo.id, "payment", "Cash payment scheduled", "Please pay at the caretaker's office within 72 hours to keep this intent active.", { payment_id: angeloOct.id }, hoursAgo(20), true);
  notify(TENANTS.angelo.id, "lease", "Unit transfer request received", "Your request to move to Room 303 is pending.", { transfer_id: uid("transfer:angelo") }, daysAgo(2), true);
  await insert("notifications", N, "notifications");
  ok(`${N.length} notifications`);

  // ---- product tours ------------------------------------------------------
  step("Tour states, iRis history");
  const LANDLORD_STEPS = ["welcome","nav_unit_map","unit_map_setup","wizard_lanes","wizard_bulk","wizard_generate","unit_map_visual","nav_properties","properties_portfolio","nav_tenants","tenant_management","nav_finance","finance_hub"];
  await insert("landlord_product_tour_states", [{ landlord_id: LANDLORD.id, status: "completed", current_step_index: LANDLORD_STEPS.length, started_at: "2026-01-12T02:40:00.000Z", completed_at: "2026-01-12T02:52:00.000Z", replay_count: 0, last_event_at: "2026-01-12T02:52:00.000Z", last_route: "/landlord/invoices", metadata: { completed_step_ids: LANDLORD_STEPS, quest_board_hidden: false, show_completed_quests: false, setup: {} } }], "landlord tour");
  await insert("tenant_product_tour_states", Object.values(TENANTS).map((t) => t.key === "mark"
    ? { tenant_id: t.id, status: "not_started", current_step_index: 0, metadata: {} }
    : { tenant_id: t.id, status: "completed", current_step_index: 5, started_at: `${t.leaseStart}T03:00:00.000Z`, completed_at: `${t.leaseStart}T03:06:00.000Z`, last_event_at: `${t.leaseStart}T03:06:00.000Z`, last_route: "/tenant/messages", metadata: { completed_step_ids: ["dashboard_overview","lease_overview","payments_center","maintenance_request","messages_hub"] } }
  ), "tenant tours");
  await insert("iris_chat_messages", [
    { user_id: LANDLORD.id, role: "user", content: "Who hasn't paid for October yet?", created_at: daysAgo(1, 2) },
    { user_id: LANDLORD.id, role: "assistant", content: `Three October invoices are still open:\n\n• Room 102 – Joshua Miguel Dela Cruz: ${peso(joshuaOct.amount)}, GCash proof submitted Oct 12, **awaiting your review**.\n• Room 202 – Ronald Bautista: ${peso(ronaldOct.amount)}, overdue, reminder sent Oct 8.\n• Room 302 – Angelo Fernandez: ${peso(angeloOct.amount)}, said he will pay **cash at the office** (intent expires in ~2 days).\n\nRooms 101, 203 and 301 are fully settled.`, created_at: daysAgo(1, 2) },
    { user_id: LANDLORD.id, role: "user", content: "Draft a polite Filipino reminder for Ronald.", created_at: daysAgo(1, 2) },
    { user_id: LANDLORD.id, role: "assistant", content: `Hi Ronald, good day! Paalala lang po na ang October 2026 invoice ninyo (${peso(ronaldOct.amount)}, kasama ang ₱200 late fee) ay due pa noong Oct 5. Pwede po kayong magbayad via GCash sa app o cash sa office. Salamat po at ingat sa paglipat sa Cebu! — Sir John`, created_at: daysAgo(1, 2) },
    { user_id: TENANTS.maria.id, role: "user", content: "Kailan ang next due ko?", created_at: daysAgo(6) },
    { user_id: TENANTS.maria.id, role: "assistant", content: "Bayad na ang October mo (receipt issued Oct 2). Ang susunod mong invoice ay para sa **November 2026**, lalabas sa Nov 1 at due sa **Nov 5**. Ang base rent mo ay ₱4,500 plus kuryente at tubig base sa metro.", created_at: daysAgo(6) },
  ], "iris history");
  ok("Landlord tour completed, tenant tours completed (Mark: not started), iRis history");

  // ---- verify login -------------------------------------------------------
  step("Verifying logins");
  for (const email of [LANDLORD.email, TENANTS.maria.email, TENANTS.katrina.email]) {
    const r = await authProbe.auth.signInWithPassword({ email, password: PASSWORD });
    if (r.error) { console.error(`\x1b[31m✗ login failed for ${email}: ${r.error.message}\x1b[0m`); process.exit(1); }
    ok(`${email} can sign in`);
  }

  // ---- summary ------------------------------------------------------------
  const summary = {
    app_url: APP_URL,
    password: PASSWORD,
    landlord: { email: LANDLORD.email, id: LANDLORD.id, property_id: PROPERTY_ID },
    tenants: Object.fromEntries(Object.values(TENANTS).map((t) => [t.key, { name: t.name, email: t.email, id: t.id, room: `Room ${t.unit}`, lease_id: t.leaseId }])),
    key_ids: {
      joshua_october_payment: joshuaOct.id, ronald_october_payment: ronaldOct.id, angelo_october_payment: angeloOct.id, mark_november_payment: markNov.id,
      maria_october_payment: uid("pay:maria:2026-10-01"), katrina_lease: K.leaseId, katrina_application: uid("app:katrina"),
      jerome_application: uid("app:jerome"), patricia_application: uid("app:patricia"), kevin_application: uid("app:kevin"),
      renewal_christine: uid("renewal:christine"), moveout_ronald: uid("moveout:ronald"), transfer_angelo: uid("transfer:angelo"),
      ticket_mark_outlet: uid("mr:mark:outlet"), ticket_joshua_faucet: uid("mr:joshua:faucet"),
    },
    links: {
      online_application_invite: `${APP_URL}/apply/fgd-apply-online-2026`,
      walkin_room103_invite: `${APP_URL}/apply/fgd-room103-walkin-2026`,
      existing_resident_room104_invite: `${APP_URL}/apply/fgd-room104-existing-2026`,
      kevin_payment_portal: `${APP_URL}/apply/payments/${kevinPortalToken}`,
      katrina_signing_link: katrinaSigningUrl,
    },
  };
  const outDir = path.join(root, "output");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "defense-demo-ids.json"), JSON.stringify(summary, null, 2));

  console.log("\n\x1b[1m\x1b[32m════════════════════════════════════════════════════════════\x1b[0m");
  console.log("\x1b[1m\x1b[32m  Demo ready — Fernando Gonzales Dormitory\x1b[0m");
  console.log("\x1b[1m\x1b[32m════════════════════════════════════════════════════════════\x1b[0m");
  console.log(`  Landlord : ${LANDLORD.email}`);
  for (const t of Object.values(TENANTS)) console.log(`  Tenant   : ${t.email.padEnd(32)} ${t.name} (Room ${t.unit})`);
  console.log(`  Password : ${PASSWORD}  (all accounts)`);
  console.log(`  Apply    : ${summary.links.online_application_invite}`);
  console.log(`  Portal   : ${summary.links.kevin_payment_portal}`);
  console.log(`  E-sign   : ${katrinaSigningUrl.slice(0, 90)}…`);
  console.log(`  IDs      : output/defense-demo-ids.json\n`);
}

main().catch((err) => { console.error("\x1b[31mUnexpected error:\x1b[0m", err); process.exit(1); });
