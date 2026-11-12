import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

function isAllowed() {
    return process.env.NODE_ENV !== "production" || process.env.DEMO_CONSOLE_ENABLED === "true";
}

function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createSupabaseAdmin(url, key, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}

function readDemoIds(): Record<string, any> | null {
    try {
        const p = path.join(process.cwd(), "output", "defense-demo-ids.json");
        if (fs.existsSync(p)) {
            return JSON.parse(fs.readFileSync(p, "utf8"));
        }
    } catch {
        // ignore
    }
    return null;
}

function runNodeScript(scriptName: string, args: string[] = []): Promise<{ code: number | null; output: string; seconds: number }> {
    const scriptPath = path.join(process.cwd(), "scripts", scriptName);
    const startedAt = Date.now();
    return new Promise((resolve) => {
        const child = spawn(process.execPath, [scriptPath, ...args], {
            cwd: process.cwd(),
            env: process.env,
        });
        let output = "";
        const append = (chunk: Buffer) => {
            output += chunk.toString("utf8");
            if (output.length > 24_000) output = output.slice(-24_000);
        };
        child.stdout.on("data", append);
        child.stderr.on("data", append);
        child.on("error", (err) =>
            resolve({
                code: -1,
                output: `${output}\n${err.message}`,
                seconds: Math.round((Date.now() - startedAt) / 1000),
            })
        );
        child.on("close", (code) =>
            resolve({
                code,
                output: output.replace(/\u001b\[[0-9;]*m/g, ""),
                seconds: Math.round((Date.now() - startedAt) / 1000),
            })
        );
    });
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET() {
    if (!isAllowed()) {
        return NextResponse.json({ error: "Not found" }, { status: 404, headers: CORS_HEADERS });
    }

    try {
        const supabase = await createServerSupabaseClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        const demoIds = readDemoIds();

        return NextResponse.json(
            {
                ok: true,
                currentUser: user
                    ? {
                          id: user.id,
                          email: user.email,
                          fullName: user.user_metadata?.full_name || user.email,
                          role: user.user_metadata?.role || "tenant",
                      }
                    : null,
                demoIds,
            },
            { headers: CORS_HEADERS }
        );
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : "Failed to inspect state" },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}

export async function POST(request: NextRequest) {
    if (!isAllowed()) {
        return NextResponse.json({ error: "Not found" }, { status: 404, headers: CORS_HEADERS });
    }

    try {
        const body = await request.json();
        const action = String(body.action || "");

        // 1. Switch Account (or Sign Out)
        if (action === "switch-account") {
            const email = body.email ? String(body.email).trim() : null;
            const password = body.password ? String(body.password) : "Defense2026!";
            const supabase = await createServerSupabaseClient();

            await supabase.auth.signOut();

            let signedInUser: any = null;
            let role = "public";

            if (email) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    return NextResponse.json(
                        { ok: false, error: `Login failed for ${email}: ${error.message}` },
                        { status: 400, headers: CORS_HEADERS }
                    );
                }
                signedInUser = data.user;
                role = signedInUser?.user_metadata?.role || "tenant";
            }

            const res = NextResponse.json(
                {
                    ok: true,
                    user: signedInUser
                        ? {
                              id: signedInUser.id,
                              email: signedInUser.email,
                              fullName: signedInUser.user_metadata?.full_name || signedInUser.email,
                              role,
                          }
                        : null,
                },
                { headers: CORS_HEADERS }
            );

            // Sync helper cookies so middleware routes cleanly without stale role/2FA state
            res.cookies.delete("ireside_2fa_pending");
            res.cookies.delete("ireside_2fa_verified");

            if (signedInUser) {
                res.cookies.set("x-user-role", role, {
                    path: "/",
                    httpOnly: true,
                    sameSite: "lax",
                    maxAge: 3600,
                });
                const isStarter = email?.toLowerCase().startsWith("practice.landlord");
                if (role === "landlord" && !isStarter) {
                    res.cookies.set("ireside_setup_completed", "true", {
                        path: "/",
                        sameSite: "lax",
                        maxAge: 86400,
                    });
                } else {
                    res.cookies.delete("ireside_setup_completed");
                }
            } else {
                res.cookies.delete("x-user-role");
                res.cookies.delete("ireside_setup_completed");
            }

            return res;
        }

        // 2. Quick <1s Reset of Katrina's Lease Signing State
        if (action === "quick-reset-katrina") {
            const admin = getAdminClient();
            const demoIds = readDemoIds();
            const leaseId = demoIds?.key_ids?.katrina_lease || "ea37b3e5-e81c-4df9-b0fe-747e4f55cca8";
            const katrinaId = demoIds?.tenants?.katrina?.id || "90a4cdf1-e569-49fe-8441-3c233741b6d6";
            const jwtSecret = process.env.JWT_SECRET?.trim() || "iReside-dev-fallback-secret-2024";
            const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

            const token = jwt.sign(
                { leaseId, actorId: katrinaId, role: "tenant", type: "lease_signing" },
                jwtSecret,
                { expiresIn: "30d" }
            );
            const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
            const signingLink = `${appUrl}/signing/tenant/${leaseId}?token=${encodeURIComponent(token)}`;

            const { error } = await admin
                .from("leases")
                .update({
                    status: "pending_tenant_signature",
                    tenant_signature: null,
                    landlord_signature: null,
                    signed_at: null,
                    tenant_signed_at: null,
                    landlord_signed_at: null,
                    signature_lock_version: 0,
                    signing_link_token_hash: tokenHash,
                })
                .eq("id", leaseId);

            if (error) {
                return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
            }

            // Update defense-demo-ids.json so all tools stay in sync
            if (demoIds) {
                demoIds.links = demoIds.links || {};
                demoIds.links.katrina_signing_link = signingLink;
                const p = path.join(process.cwd(), "output", "defense-demo-ids.json");
                fs.writeFileSync(p, JSON.stringify(demoIds, null, 2));
            }

            return NextResponse.json(
                {
                    ok: true,
                    message: "Katrina's lease reset to Pending Tenant Signature with a fresh 30-day signing link!",
                    signingLink,
                },
                { headers: CORS_HEADERS }
            );
        }

        // 3. Quick <1s Reset of Joshua's GCash Bills (Oct Under Review + Nov Pending Pay Now)
        if (action === "quick-reset-joshua-bill") {
            const admin = getAdminClient();
            const demoIds = readDemoIds();
            const octId = demoIds?.key_ids?.joshua_october_payment || "137467d5-5ebf-4a4e-97dc-c0c3907e25df";
            const novId = demoIds?.key_ids?.joshua_november_payment || "1e89d3f0-a19b-447a-bd18-b08982a8d7f3";

            await admin.from("payment_receipts").delete().in("payment_id", [octId, novId]);

            await admin
                .from("payments")
                .update({
                    status: "pending",
                    workflow_status: "under_review",
                    paid_at: null,
                    method: "gcash",
                    reference_number: "901844271055",
                    landlord_note: null,
                })
                .eq("id", octId);

            await admin
                .from("payments")
                .update({
                    status: "pending",
                    workflow_status: "pending",
                    paid_at: null,
                    method: null,
                    reference_number: null,
                    payment_proof_url: null,
                    tenant_submitted_at: null,
                    landlord_note: null,
                })
                .eq("id", novId);

            return NextResponse.json(
                {
                    ok: true,
                    message: "Joshua's bills reset! Nov 2026 is ready for 'Pay Now' (Tenant) & Oct 2026 is ready for 'To Verify' (Landlord).",
                },
                { headers: CORS_HEADERS }
            );
        }

        // 4. Reset Starter Landlord Account (Unclaimed or Ready for 5-Stage Setup)
        if (action === "reset-starter-landlord" || action === "prepare-starter-onboarding") {
            const res = await runNodeScript("reset-starter-account.mjs");
            if (res.code !== 0) {
                return NextResponse.json(
                    { ok: false, error: res.output || "Failed resetting starter account" },
                    { status: 500, headers: CORS_HEADERS }
                );
            }

            // If prepare-starter-onboarding, mark is_account_claimed = true so we can jump straight into /setup & Step 1-5 without waiting for Gmail OTP
            if (action === "prepare-starter-onboarding") {
                const admin = getAdminClient();
                const starterId = "0262272e-33fc-4ec2-98c5-fad3a0900801";
                await admin.auth.admin.updateUserById(starterId, {
                    user_metadata: {
                        email_verified: true,
                        full_name: "Practice Landlord 1",
                        phone: "0917-111-2222",
                        role: "landlord",
                        is_account_claimed: true,
                        is_setup_completed: false,
                    },
                });
                await admin
                    .from("profiles")
                    .update({
                        is_account_claimed: true,
                        has_changed_password: true,
                        business_name: null,
                    })
                    .eq("id", starterId);
            }

            return NextResponse.json(
                {
                    ok: true,
                    email: "practice.landlord1@ireside.ph",
                    password: "LandlordDemo2026!",
                    mode: action === "prepare-starter-onboarding" ? "claimed-ready-for-setup" : "unclaimed-claim-flow",
                    seconds: res.seconds,
                    output: res.output,
                },
                { headers: CORS_HEADERS }
            );
        }

        // 5. Provision Brand-New Claimable Landlord Account
        if (action === "create-fresh-landlord") {
            const res = await runNodeScript("create-starter-claimable-account.mjs");
            const emailMatch = res.output.match(/Email:\s+([^\s]+)/);
            const passMatch = res.output.match(/Temporary Pass:\s+([^\s]+)/);
            return NextResponse.json(
                {
                    ok: res.code === 0,
                    email: emailMatch ? emailMatch[1] : "practice.landlord2@ireside.ph",
                    password: passMatch ? passMatch[1] : "LandlordDemo2026!",
                    seconds: res.seconds,
                    output: res.output,
                },
                { status: res.code === 0 ? 200 : 500, headers: CORS_HEADERS }
            );
        }

        // 6. Reset Mark Lim's First-Time Tenant Tour / Onboarding State
        if (action === "reset-tenant-tour") {
            const admin = getAdminClient();
            const demoIds = readDemoIds();
            const markId = demoIds?.tenants?.mark?.id || "b358c347-28e1-418d-9c21-60c8d96f8e6a";

            await admin
                .from("profiles")
                .update({
                    socials: {
                        product_tour: {
                            status: "not_started",
                            current_step: 0,
                            eligible: true,
                        },
                    },
                })
                .eq("id", markId);

            return NextResponse.json(
                {
                    ok: true,
                    email: "mark.lim@ireside.ph",
                    password: "Defense2026!",
                    message: "Mark Lim (Room 301) reset to first-time login state! Switch to Mark to show the Tenant Guided Tour.",
                },
                { headers: CORS_HEADERS }
            );
        }

        // 7. Delete / Purge Specific Account (e.g., Marco Reyes or test email)
        if (action === "delete-user") {
            const targetEmail = String(body.email || "").trim();
            if (!targetEmail) {
                return NextResponse.json({ ok: false, error: "Email required" }, { status: 400, headers: CORS_HEADERS });
            }
            // Also delete any pending applications by that email so Marco Reyes can re-apply cleanly
            const admin = getAdminClient();
            await admin.from("applications").delete().ilike("applicant_email", targetEmail);

            const res = await runNodeScript("delete-user.mjs", [targetEmail]);
            return NextResponse.json(
                {
                    ok: res.code === 0,
                    message: `Cleaned applications and user records for ${targetEmail}`,
                    output: res.output,
                },
                { status: res.code === 0 ? 200 : 500, headers: CORS_HEADERS }
            );
        }

        // 8. Seed Fresh Real-Time Notifications
        if (action === "seed-notifications") {
            const admin = getAdminClient();
            const demoIds = readDemoIds();
            const landlordId = demoIds?.landlord?.id || "07c52c81-ede3-45ef-89e6-dfb1dc473053";
            const joshuaId = demoIds?.tenants?.joshua?.id || "fe35e512-9abd-422b-9b10-b18b317ca1a8";
            const now = new Date().toISOString();

            await admin.from("notifications").insert([
                {
                    user_id: landlordId,
                    type: "payment",
                    title: "GCash Receipt Uploaded — Room 102",
                    message: "Joshua Miguel Dela Cruz uploaded a GCash receipt (₱5,530.50) awaiting your verification.",
                    read: false,
                    created_at: now,
                },
                {
                    user_id: landlordId,
                    type: "maintenance",
                    title: "Urgent Electrical Ticket — Room 301",
                    message: "iRis Smart Triage flagged Mark Lim's sparking wall outlet as Urgent Fire Hazard.",
                    read: false,
                    created_at: now,
                },
                {
                    user_id: joshuaId,
                    type: "payment",
                    title: "November 2026 Bill Ready (₱5,709.50)",
                    message: "Your itemized rent, electricity (135 kWh), and water (6 m³) bill for Room 102 is ready.",
                    read: false,
                    created_at: now,
                },
            ]);

            return NextResponse.json(
                {
                    ok: true,
                    message: "Fresh unread notifications pushed to Landlord (John) and Tenant (Joshua)!",
                },
                { headers: CORS_HEADERS }
            );
        }

        // 9. Full Database Reset (seed-defense-demo.mjs)
        if (action === "full-reset") {
            const res = await runNodeScript("seed-defense-demo.mjs");
            const demoIds = readDemoIds();
            return NextResponse.json(
                {
                    ok: res.code === 0,
                    seconds: res.seconds,
                    output: res.output,
                    demoIds,
                },
                { status: res.code === 0 ? 200 : 500, headers: CORS_HEADERS }
            );
        }

        return NextResponse.json({ ok: false, error: `Unknown action: ${action}` }, { status: 400, headers: CORS_HEADERS });
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : "Action failed" },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}
