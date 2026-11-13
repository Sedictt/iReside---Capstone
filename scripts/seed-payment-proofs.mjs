import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const STORAGE_PUBLIC = `${SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public`;
const PHOTO_DIR = path.join(
  path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, "$1")),
  "defense-demo-photos"
);

function peso(amount) {
  return `PHP ${Number(amount || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

async function makeBankReceiptPng({ tenantName, amount, referenceNumber, paidAt, description }) {
  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const dateLabel = paidAt
    ? new Date(paidAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })
    : "Verified Transfer";
  const lines = [
    `Amount          ${peso(amount)}`,
    `From            ${tenantName}`,
    `To              John Peter Gonzales`,
    `Bank            BDO Unibank (InstaPay)`,
    `Ref No.         ${referenceNumber || "IP26000001"}`,
    `Date            ${dateLabel}`,
    "",
    description ? `Note: ${description.slice(0, 48)}` : "",
  ].filter(Boolean);

  const body = lines
    .map(
      (l, i) =>
        `<text x="70" y="${460 + i * 62}" font-family="Segoe UI, Arial" font-size="32" fill="#1f2937">${esc(l)}</text>`
    )
    .join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1100">
    <rect width="100%" height="100%" fill="#f8fafc"/>
    <rect x="0" y="0" width="900" height="270" fill="#0f5132"/>
    <circle cx="760" cy="130" r="200" fill="#ffffff" fill-opacity="0.10"/>
    <text x="70" y="135" font-family="Segoe UI, Arial" font-size="52" font-weight="700" fill="#ffffff">InstaPay Transfer</text>
    <text x="70" y="205" font-family="Segoe UI, Arial" font-size="30" fill="#d1fae5">Bank Transfer Receipt — Completed</text>
    ${body}
    <text x="70" y="1030" font-family="Segoe UI, Arial" font-size="24" fill="#6b7280">iReside payment proof artifact</text>
  </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function run() {
  const gcashSamplePath = path.join(PHOTO_DIR, "gcash-receipt-sample.png");
  const gcashBuffer = fs.existsSync(gcashSamplePath)
    ? await sharp(gcashSamplePath)
        .rotate()
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .png()
        .toBuffer()
    : null;

  const { data: payments, error } = await db
    .from("payments")
    .select("id, invoice_number, tenant_id, method, amount, reference_number, paid_at, payment_submitted_at, description, payment_proof_url")
    .in("method", ["gcash", "bank_transfer"])
    .is("payment_proof_url", null);

  if (error) {
    console.error("Failed to fetch payments:", error.message);
    process.exit(1);
  }

  if (!payments || payments.length === 0) {
    console.log("All gcash and bank_transfer payments already have payment_proof_url.");
    return;
  }

  const tenantIds = [...new Set(payments.map((p) => p.tenant_id).filter(Boolean))];
  const { data: profiles } = await db
    .from("profiles")
    .select("id, full_name")
    .in("id", tenantIds);
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name || "Tenant"]));

  // Upload shared GCash sample once if available, and also generate per-bank receipts.
  let sharedGcashPath = "demo/gcash-receipt-sample.png";
  let sharedGcashUrl = null;
  if (gcashBuffer) {
    const up = await db.storage
      .from("payment-proofs")
      .upload(sharedGcashPath, gcashBuffer, { contentType: "image/png", upsert: true });
    if (up.error) {
      console.error("Failed to upload shared GCash sample:", up.error.message);
      process.exit(1);
    }
    sharedGcashUrl = `${STORAGE_PUBLIC}/payment-proofs/${sharedGcashPath}`;
  }

  let updatedCount = 0;
  const batchSize = 10;

  for (let i = 0; i < payments.length; i += batchSize) {
    const batch = payments.slice(i, i + batchSize);
    await Promise.all(
      batch.map(async (p) => {
        let proofPath = sharedGcashPath;
        let proofUrl = sharedGcashUrl;

        if (p.method === "bank_transfer" || !proofUrl) {
          const tenantName = nameById.get(p.tenant_id) || "Tenant";
          const png = await makeBankReceiptPng({
            tenantName,
            amount: p.amount,
            referenceNumber: p.reference_number,
            paidAt: p.paid_at || p.payment_submitted_at,
            description: p.description,
          });
          proofPath = `${p.tenant_id}/demo/${p.invoice_number || p.id}.png`;
          const up = await db.storage
            .from("payment-proofs")
            .upload(proofPath, png, { contentType: "image/png", upsert: true });
          if (up.error) {
            console.warn(`Skipped ${p.invoice_number || p.id}: ${up.error.message}`);
            return;
          }
          proofUrl = `${STORAGE_PUBLIC}/payment-proofs/${proofPath}`;
        }

        const { error: updErr } = await db
          .from("payments")
          .update({
            payment_proof_path: proofPath,
            payment_proof_url: proofUrl,
          })
          .eq("id", p.id);

        if (updErr) {
          console.warn(`Update failed for ${p.invoice_number || p.id}: ${updErr.message}`);
          return;
        }
        updatedCount += 1;
      })
    );
  }

  console.log(`Seeded payment_proof_url on ${updatedCount} of ${payments.length} digital payments.`);
  console.log(`Unique tenants updated: ${tenantIds.length}`);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
