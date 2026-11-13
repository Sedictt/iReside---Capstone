import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOrCreateDirectConversation } from "@/lib/billing/workflow";
import { generateApplicationStatusToken } from "@/lib/jwt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CORS_HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

const DEMO_PASSWORD = "Defense2026!";
const STARTER_PASSWORD = "LandlordDemo2026!";
const PROPERTY_NAME = "Fernando Gonzales Dormitory";

type RecommendedAccount = {
    email: string;
    password: string;
    role: "landlord" | "tenant";
    name: string;
};

const ACCOUNTS = {
    john: {
        email: "john.gonzales@ireside.ph",
        password: DEMO_PASSWORD,
        role: "landlord" as const,
        name: "John Peter Gonzales",
    },
    starter: {
        email: "practice.landlord1@ireside.ph",
        password: STARTER_PASSWORD,
        role: "landlord" as const,
        name: "Practice Landlord 1",
    },
    maria: {
        email: "maria.santos@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant" as const,
        name: "Maria Angelica Santos",
    },
    joshua: {
        email: "joshua.delacruz@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant" as const,
        name: "Joshua Miguel Dela Cruz",
    },
    katrina: {
        email: "katrina.villanueva@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant" as const,
        name: "Katrina Mae Villanueva",
    },
    ronald: {
        email: "ronald.bautista@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant" as const,
        name: "Ronald Bautista",
    },
    christine: {
        email: "christine.reyes@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant" as const,
        name: "Christine Joy Reyes",
    },
    mark: {
        email: "mark.lim@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant" as const,
        name: "Mark Anthony Lim",
    },
    angelo: {
        email: "angelo.fernandez@ireside.ph",
        password: DEMO_PASSWORD,
        role: "tenant" as const,
        name: "Angelo Fernandez",
    },
} satisfies Record<string, RecommendedAccount>;

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

/** Deterministic UUID v4-shaped generator matching scripts/seed-defense-demo.mjs */
function uid(name: string): string {
    const h = crypto.createHash("sha256").update(`fgd-demo:${name}`).digest("hex");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${((parseInt(h[16], 16) & 0x3) | 0x8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

function sha256(value: string): string {
    return crypto.createHash("sha256").update(value).digest("hex");
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

function runNodeScript(
    scriptName: string,
    args: string[] = [],
): Promise<{ code: number | null; output: string; seconds: number }> {
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
            }),
        );
        child.on("close", (code) =>
            resolve({
                code,
                output: output.replace(/\u001b\[[0-9;]*m/g, ""),
                seconds: Math.round((Date.now() - startedAt) / 1000),
            }),
        );
    });
}

async function performServerSwitch(email: string | null, password?: string) {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();

    if (!email) {
        return { user: null, role: "public" as const, isStarter: false };
    }

    const isStarter = email.toLowerCase().startsWith("practice.landlord");
    const resolvedPassword = password || (isStarter ? STARTER_PASSWORD : DEMO_PASSWORD);
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: resolvedPassword,
    });

    if (error) {
        throw new Error(`Login failed for ${email}: ${error.message}`);
    }

    const signedInUser = data.user;
    const role = (signedInUser?.user_metadata?.role as string) || "tenant";

    return {
        user: signedInUser
            ? {
                  id: signedInUser.id,
                  email: signedInUser.email,
                  fullName: signedInUser.user_metadata?.full_name || signedInUser.email,
                  role,
              }
            : null,
        role,
        isStarter,
    };
}

function applyAuthCookies(
    res: NextResponse,
    switched: { user: any; role: string; isStarter: boolean } | null,
) {
    if (!switched) return res;
    res.cookies.delete("ireside_2fa_pending");
    res.cookies.delete("ireside_2fa_verified");

    if (switched.user) {
        res.cookies.set("x-user-role", switched.role, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 3600,
        });
        if (switched.role === "landlord" && !switched.isStarter) {
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

async function buildActionResponse(
    payload: {
        ok: boolean;
        action: string;
        message: string;
        recommendedAccount?: RecommendedAccount;
        recommendedRoute?: string;
        [key: string]: unknown;
    },
    autoSwitchEmail?: string | null,
    autoSwitchPassword?: string,
    status = 200,
) {
    let switched: { user: any; role: string; isStarter: boolean } | null = null;
    if (payload.ok && autoSwitchEmail) {
        try {
            switched = await performServerSwitch(autoSwitchEmail, autoSwitchPassword);
        } catch (err) {
            return NextResponse.json(
                {
                    ...payload,
                    ok: false,
                    error: err instanceof Error ? err.message : "Auto-switch failed",
                },
                { status: 400, headers: CORS_HEADERS },
            );
        }
    }

    const res = NextResponse.json(
        {
            ...payload,
            ...(switched ? { switchedUser: switched.user } : {}),
        },
        { status, headers: CORS_HEADERS },
    );
    return applyAuthCookies(res, switched);
}

async function ensureDemoConversation(
    admin: ReturnType<typeof getAdminClient>,
    tenantId: string,
    landlordId: string,
): Promise<string> {
    return getOrCreateDirectConversation(admin as any, tenantId, landlordId);
}

async function insertChatSystemCard(
    admin: ReturnType<typeof getAdminClient>,
    params: {
        conversationId: string;
        senderId: string;
        content: string;
        metadata: Record<string, unknown>;
    },
) {
    const now = new Date().toISOString();
    const { error: msgError } = await admin.from("messages").insert({
        conversation_id: params.conversationId,
        sender_id: params.senderId,
        type: "system",
        content: params.content,
        metadata: {
            ...params.metadata,
            conversationId: params.conversationId,
        },
        created_at: now,
    });
    if (msgError) throw msgError;

    await admin.from("conversations").update({ updated_at: now }).eq("id", params.conversationId);
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
            { headers: CORS_HEADERS },
        );
    } catch (error) {
        return NextResponse.json(
            { ok: false, error: error instanceof Error ? error.message : "Failed to inspect state" },
            { status: 500, headers: CORS_HEADERS },
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
        const autoSwitchEmail = body.autoSwitchEmail ? String(body.autoSwitchEmail).trim() : null;
        const autoSwitchPassword = body.autoSwitchPassword ? String(body.autoSwitchPassword) : undefined;
        const demoIds = readDemoIds();

        const landlordId = demoIds?.landlord?.id || uid("landlord");
        const propertyId = demoIds?.landlord?.property_id || uid("property");

        // 1. Switch Account (or Sign Out)
        if (action === "switch-account") {
            const email = body.email ? String(body.email).trim() : null;
            const password = body.password ? String(body.password) : undefined;
            try {
                const switched = await performServerSwitch(email, password);
                const roleRoute =
                    switched.role === "landlord"
                        ? switched.isStarter
                            ? "/setup"
                            : "/landlord/dashboard"
                        : switched.user
                          ? "/tenant/dashboard"
                          : "/login";
                const res = NextResponse.json(
                    {
                        ok: true,
                        action,
                        message: switched.user
                            ? `Switched session to ${switched.user.fullName} (${switched.user.role}).`
                            : "Signed out of demo session.",
                        user: switched.user,
                        recommendedRoute: roleRoute,
                    },
                    { headers: CORS_HEADERS },
                );
                return applyAuthCookies(res, switched);
            } catch (err) {
                return NextResponse.json(
                    {
                        ok: false,
                        action,
                        error: err instanceof Error ? err.message : "Switch account failed",
                    },
                    { status: 400, headers: CORS_HEADERS },
                );
            }
        }

        // 2. Quick <1s Reset of Katrina's Lease Signing State
        if (action === "quick-reset-katrina") {
            const admin = getAdminClient();
            const leaseId = demoIds?.key_ids?.katrina_lease || uid("lease:katrina");
            const katrinaId = demoIds?.tenants?.katrina?.id || uid("tenant:katrina");
            const jwtSecret = process.env.JWT_SECRET?.trim() || "iReside-dev-fallback-secret-2024";
            const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

            const token = jwt.sign(
                { leaseId, actorId: katrinaId, role: "tenant", type: "lease_signing" },
                jwtSecret,
                { expiresIn: "30d" },
            );
            const tokenHash = sha256(token);
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
                return NextResponse.json({ ok: false, action, error: error.message }, { status: 500, headers: CORS_HEADERS });
            }

            if (demoIds) {
                demoIds.links = demoIds.links || {};
                demoIds.links.katrina_signing_link = signingLink;
                const p = path.join(process.cwd(), "output", "defense-demo-ids.json");
                fs.writeFileSync(p, JSON.stringify(demoIds, null, 2));
            }

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Katrina's lease reset to Pending Tenant Signature with a fresh 30-day signing link!",
                    signingLink,
                    recommendedAccount: ACCOUNTS.katrina,
                    recommendedRoute: signingLink,
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 2b. Seed Katrina's Lease into Pending Landlord Countersignature (<1s)
        if (action === "seed-katrina-countersign") {
            const admin = getAdminClient();
            const katrinaLeaseId = demoIds?.key_ids?.katrina_lease || uid("lease:201:katrina");
            const now = new Date().toISOString();
            const sampleSig =
                "data:image/svg+xml;utf8," +
                encodeURIComponent(
                    `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="80" viewBox="0 0 240 80"><path d="M20 55 Q 50 15, 80 50 T 150 45 Q 180 35, 215 52" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/></svg>`,
                );

            const { error: leaseErr } = await admin
                .from("leases")
                .update({
                    status: "pending_landlord_signature",
                    tenant_signed_at: now,
                    tenant_signature: sampleSig,
                    landlord_signed_at: null,
                    landlord_signature: null,
                    signed_at: null,
                    signed_document_url: null,
                })
                .eq("id", katrinaLeaseId);

            if (leaseErr) {
                throw new Error(`Failed to set Katrina's lease to pending_landlord_signature: ${leaseErr.message}`);
            }

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Katrina's lease is now signed by tenant and ready for Landlord Countersign!",
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: `/landlord/leases?id=${katrinaLeaseId}`,
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 3. Quick <1s Reset of Joshua's GCash Bills (Oct Under Review + Nov Pending Pay Now)
        if (action === "quick-reset-joshua-bill") {
            const admin = getAdminClient();
            const octId = demoIds?.key_ids?.joshua_october_payment || uid("pay:joshua:2026-10-01");
            const novId = demoIds?.key_ids?.joshua_november_payment || uid("pay:joshua:2026-11-01");

            await admin.from("payment_receipts").delete().in("payment_id", [octId, novId]);

            await admin
                .from("payments")
                .update({
                    status: "pending",
                    workflow_status: "under_review",
                    paid_at: null,
                    method: "gcash",
                    intent_method: "gcash",
                    reference_number: "901844271055",
                    review_action: null,
                    rejection_reason: null,
                    landlord_confirmed: false,
                })
                .eq("id", octId);

            await admin
                .from("payments")
                .update({
                    status: "pending",
                    workflow_status: "pending",
                    paid_at: null,
                    method: null,
                    intent_method: null,
                    reference_number: null,
                    payment_proof_url: null,
                    review_action: null,
                    rejection_reason: null,
                    landlord_confirmed: false,
                })
                .eq("id", novId);

            const isLandlordView =
                autoSwitchEmail === ACCOUNTS.john.email ||
                body?.as === "landlord" ||
                body?.view === "landlord";

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message:
                        "Joshua's bills reset! Nov 2026 is ready for 'Pay Now' (Tenant) & Oct 2026 is ready for 'To Verify' (Landlord).",
                    recommendedAccount: isLandlordView ? ACCOUNTS.john : ACCOUNTS.joshua,
                    recommendedRoute: isLandlordView
                        ? `/landlord/invoices?id=${octId}&status=waiting`
                        : `/tenant/payments/${novId}/checkout`,
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 4. Reset Starter Landlord Account (Unclaimed or Ready for 5-Stage Setup)
        if (action === "reset-starter-landlord" || action === "prepare-starter-onboarding") {
            const res = await runNodeScript("reset-starter-account.mjs");
            if (res.code !== 0) {
                return NextResponse.json(
                    { ok: false, action, error: res.output || "Failed resetting starter account" },
                    { status: 500, headers: CORS_HEADERS },
                );
            }

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

            const isPrepare = action === "prepare-starter-onboarding";
            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: isPrepare
                        ? "Starter Landlord claimed and ready for 5-stage onboarding at /setup."
                        : "Starter Landlord reset to unclaimed claim-account flow.",
                    email: ACCOUNTS.starter.email,
                    password: ACCOUNTS.starter.password,
                    mode: isPrepare ? "claimed-ready-for-setup" : "unclaimed-claim-flow",
                    seconds: res.seconds,
                    output: res.output,
                    recommendedAccount: ACCOUNTS.starter,
                    recommendedRoute: isPrepare ? "/setup" : "/login",
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 5. Provision Brand-New Claimable Landlord Account
        if (action === "create-fresh-landlord") {
            const res = await runNodeScript("create-starter-claimable-account.mjs");
            const emailMatch = res.output.match(/Email:\s+([^\s]+)/);
            const passMatch = res.output.match(/Temporary Pass:\s+([^\s]+)/);
            const email = emailMatch ? emailMatch[1] : "practice.landlord2@ireside.ph";
            const password = passMatch ? passMatch[1] : STARTER_PASSWORD;
            return NextResponse.json(
                {
                    ok: res.code === 0,
                    action,
                    message:
                        res.code === 0
                            ? `Created fresh claimable landlord account (${email}).`
                            : "Failed creating fresh landlord account.",
                    email,
                    password,
                    seconds: res.seconds,
                    output: res.output,
                    recommendedAccount: { email, password, role: "landlord", name: "New Landlord" },
                    recommendedRoute: "/login",
                },
                { status: res.code === 0 ? 200 : 500, headers: CORS_HEADERS },
            );
        }

        // 6. Reset Mark Lim's First-Time Tenant Tour / Onboarding State
        if (action === "reset-tenant-tour") {
            const admin = getAdminClient();
            const markId = demoIds?.tenants?.mark?.id || uid("tenant:mark");

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

            await admin
                .from("tenant_product_tour_states")
                .update({
                    status: "not_started",
                    current_step: 0,
                    completed_at: null,
                    skipped_at: null,
                })
                .eq("tenant_id", markId);

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    email: ACCOUNTS.mark.email,
                    password: ACCOUNTS.mark.password,
                    message: "Mark Lim (Room 301) reset to first-time login state! Open Tenant Dashboard to show the Guided Tour.",
                    recommendedAccount: ACCOUNTS.mark,
                    recommendedRoute: "/tenant/dashboard",
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 6b. Toggle Tenant Guided Tour ON / OFF (Mark Lim, Room 301)
        if (action === "toggle-tenant-tour") {
            const admin = getAdminClient();
            const mode = body?.mode === "off" ? "off" : "on";
            const markId = demoIds?.tenants?.mark?.id || uid("tenant:mark");
            const now = new Date().toISOString();

            const tourStatus = mode === "off" ? "completed" : "not_started";
            await admin
                .from("profiles")
                .update({
                    socials: {
                        product_tour: {
                            status: tourStatus,
                            current_step: 0,
                            eligible: mode === "on",
                        },
                    },
                })
                .eq("id", markId);

            await admin
                .from("tenant_product_tour_states")
                .update({
                    status: tourStatus,
                    current_step: 0,
                    completed_at: mode === "off" ? now : null,
                    skipped_at: null,
                })
                .eq("tenant_id", markId);

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    mode,
                    message:
                        mode === "on"
                            ? "Tenant Guided Tour turned ON for Mark Lim (Room 301)."
                            : "Tenant Guided Tour turned OFF (marked completed) for Mark Lim.",
                    recommendedAccount: ACCOUNTS.mark,
                    recommendedRoute: "/tenant/dashboard",
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 6c. Toggle Landlord Guided Onboarding & Tour ON / OFF / RESET
        if (action === "toggle-landlord-onboarding") {
            const admin = getAdminClient();
            const mode: "on" | "off" | "reset" =
                body?.mode === "off" ? "off" : body?.mode === "reset" ? "reset" : "on";
            const now = new Date().toISOString();

            if (mode === "reset") {
                const res = await runNodeScript("reset-starter-account.mjs");
                if (res.code !== 0) {
                    return NextResponse.json(
                        { ok: false, action, error: "Failed to reset starter landlord onboarding", output: res.output },
                        { status: 500, headers: CORS_HEADERS },
                    );
                }

                return buildActionResponse(
                    {
                        ok: true,
                        action,
                        mode,
                        clearOnboardingLocalStorage: true,
                        message: "Full 5-Stage Landlord Onboarding reset for Practice Landlord 1 (/setup).",
                        recommendedAccount: ACCOUNTS.starter,
                        recommendedRoute: "/setup",
                    },
                    autoSwitchEmail,
                    autoSwitchPassword,
                );
            }

            const targetEmail =
                typeof body?.email === "string" && body.email.trim()
                    ? body.email.trim()
                    : ACCOUNTS.john.email;
            const { data: profile } = await admin
                .from("profiles")
                .select("id")
                .eq("email", targetEmail)
                .maybeSingle();

            const targetLandlordId = profile?.id || landlordId;

            if (mode === "on") {
                await admin
                    .from("landlord_product_tour_states")
                    .upsert(
                        {
                            landlord_id: targetLandlordId,
                            status: "not_started",
                            current_step_index: 0,
                            started_at: null,
                            completed_at: null,
                            skipped_at: null,
                            skip_suppressed_until: null,
                            metadata: {},
                            updated_at: now,
                        },
                        { onConflict: "landlord_id" },
                    );

                return buildActionResponse(
                    {
                        ok: true,
                        action,
                        mode,
                        clearOnboardingLocalStorage: true,
                        message: `Landlord Guided Tour turned ON for ${targetEmail}. Open Dashboard to see the guided prompt.`,
                        recommendedAccount: ACCOUNTS.john,
                        recommendedRoute: "/landlord/dashboard",
                    },
                    autoSwitchEmail,
                    autoSwitchPassword,
                );
            }

            // mode === "off"
            await admin
                .from("landlord_product_tour_states")
                .upsert(
                    {
                        landlord_id: targetLandlordId,
                        status: "completed",
                        current_step_index: 12,
                        completed_at: now,
                        skipped_at: null,
                        skip_suppressed_until: null,
                        updated_at: now,
                    },
                    { onConflict: "landlord_id" },
                );

            await admin
                .from("profiles")
                .update({ is_setup_completed: true })
                .eq("id", targetLandlordId);

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    mode,
                    setOnboardingCompleted: true,
                    message: `Landlord Guided Tour turned OFF for ${targetEmail}. Dashboard will open cleanly without tour prompts.`,
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: "/landlord/dashboard",
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 7. Delete / Purge Specific Account
        if (action === "delete-user") {
            const targetEmail = String(body.email || "").trim();
            if (!targetEmail) {
                return NextResponse.json({ ok: false, action, error: "Email required" }, { status: 400, headers: CORS_HEADERS });
            }
            const admin = getAdminClient();
            await admin.from("applications").delete().ilike("applicant_email", targetEmail);

            const res = await runNodeScript("delete-user.mjs", [targetEmail]);
            return NextResponse.json(
                {
                    ok: res.code === 0,
                    action,
                    message: `Cleaned applications and user records for ${targetEmail}`,
                    output: res.output,
                },
                { status: res.code === 0 ? 200 : 500, headers: CORS_HEADERS },
            );
        }

        // 8. Seed Fresh Real-Time Notifications
        if (action === "seed-notifications") {
            const admin = getAdminClient();
            const joshuaId = demoIds?.tenants?.joshua?.id || uid("tenant:joshua");
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

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Fresh unread notifications pushed to Landlord (John) and Tenant (Joshua)!",
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: "/landlord/dashboard",
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 9. Full Database Reset (seed-defense-demo.mjs)
        if (action === "full-reset") {
            const res = await runNodeScript("seed-defense-demo.mjs");
            const refreshedIds = readDemoIds();
            return NextResponse.json(
                {
                    ok: res.code === 0,
                    action,
                    message:
                        res.code === 0
                            ? `Full defense database reset completed in ${res.seconds}s.`
                            : "Full reset failed.",
                    seconds: res.seconds,
                    output: res.output,
                    demoIds: refreshedIds,
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: "/landlord/dashboard",
                },
                { status: res.code === 0 ? 200 : 500, headers: CORS_HEADERS },
            );
        }

        // ====================================================================
        // Situational Case Seed Generators (<1-2s, idempotent, on-the-spot)
        // ====================================================================

        // 10. Chat Card: Payment Proof Submitted (John <-> Joshua, Unit 102)
        if (action === "seed-chat-payment-submitted") {
            const admin = getAdminClient();
            const joshuaId = demoIds?.tenants?.joshua?.id || uid("tenant:joshua");
            const octId = demoIds?.key_ids?.joshua_october_payment || uid("pay:joshua:2026-10-01");
            const now = new Date().toISOString();

            await admin.from("payment_receipts").delete().eq("payment_id", octId);
            const { data: octPayment, error: payErr } = await admin
                .from("payments")
                .update({
                    status: "pending",
                    workflow_status: "under_review",
                    method: "gcash",
                    intent_method: "gcash",
                    reference_number: "1023447788812",
                    paid_at: null,
                    review_action: null,
                    rejection_reason: null,
                    landlord_confirmed: false,
                    last_action_at: now,
                    last_action_by: joshuaId,
                })
                .eq("id", octId)
                .select("id, invoice_number, amount")
                .single();

            if (payErr) throw payErr;

            const conversationId = await ensureDemoConversation(admin, joshuaId, landlordId);
            await insertChatSystemCard(admin, {
                conversationId,
                senderId: joshuaId,
                content: `Payment proof submitted for invoice ${octPayment.invoice_number}. Status is now Under Review.`,
                metadata: {
                    event: "payment_submitted",
                    systemType: "payment_submitted",
                    workflowStatus: "under_review",
                    actorName: "Tenant",
                    paymentId: octPayment.id,
                    invoiceNumber: octPayment.invoice_number,
                },
            });

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Fresh GCash 'Payment Submitted' card posted in John ↔ Joshua (Unit 102) chat & bill set to Under Review.",
                    paymentId: octPayment.id,
                    conversationId,
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: `/landlord/messages?conversation=${conversationId}`,
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 11. Chat Card: Rent Reminder with Pay Now (John <-> Ronald, Unit 202)
        if (action === "seed-chat-reminder-card") {
            const admin = getAdminClient();
            const ronaldId = demoIds?.tenants?.ronald?.id || uid("tenant:ronald");
            const ronaldOctId = demoIds?.key_ids?.ronald_october_payment || uid("pay:ronald:2026-10-01");
            const now = new Date().toISOString();

            const { data: ronaldPay, error: payErr } = await admin
                .from("payments")
                .update({
                    status: "pending",
                    workflow_status: "reminder_sent",
                    reminder_sent_at: now,
                    paid_at: null,
                    paid_amount: 0,
                    landlord_confirmed: false,
                    last_action_at: now,
                    last_action_by: landlordId,
                })
                .eq("id", ronaldOctId)
                .select("id, invoice_number")
                .single();

            if (payErr) throw payErr;

            const conversationId = await ensureDemoConversation(admin, ronaldId, landlordId);
            await insertChatSystemCard(admin, {
                conversationId,
                senderId: landlordId,
                content: "A payment reminder has been sent for this invoice. You can settle it quickly using the button below.",
                metadata: {
                    event: "reminder_sent",
                    systemType: "reminder_sent",
                    actionLabel: "Pay Now",
                    payNowPath: `/tenant/payments/${ronaldPay.id}/checkout`,
                    actorName: "Landlord",
                    paymentId: ronaldPay.id,
                    invoiceNumber: ronaldPay.invoice_number,
                },
            });

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Fresh 'Rent Reminder' card with Pay Now button posted in John ↔ Ronald (Unit 202) chat.",
                    paymentId: ronaldPay.id,
                    conversationId,
                    recommendedAccount: ACCOUNTS.ronald,
                    recommendedRoute: `/tenant/messages?conversation=${conversationId}`,
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 12. Chat Card: Cash Payment Intent (John <-> Angelo, Unit 302)
        if (action === "seed-chat-cash-intent") {
            const admin = getAdminClient();
            const angeloId = demoIds?.tenants?.angelo?.id || uid("tenant:angelo");
            const angeloOctId = demoIds?.key_ids?.angelo_october_payment || uid("pay:angelo:2026-10-01");
            const now = new Date().toISOString();
            const expiresAt = new Date(Date.now() + 52 * 3600_000).toISOString();

            await admin.from("payment_receipts").delete().eq("payment_id", angeloOctId);
            const { data: angeloPay, error: payErr } = await admin
                .from("payments")
                .update({
                    status: "pending",
                    workflow_status: "awaiting_in_person",
                    intent_method: "in_person",
                    method: "cash",
                    paid_at: null,
                    paid_amount: 0,
                    payment_submitted_at: now,
                    in_person_intent_expires_at: expiresAt,
                    review_action: null,
                    rejection_reason: null,
                    landlord_confirmed: false,
                    last_action_at: now,
                    last_action_by: angeloId,
                })
                .eq("id", angeloOctId)
                .select("id, invoice_number")
                .single();

            if (payErr) throw payErr;

            const conversationId = await ensureDemoConversation(admin, angeloId, landlordId);
            await insertChatSystemCard(admin, {
                conversationId,
                senderId: angeloId,
                content:
                    "A face-to-face cash payment has been initiated. The landlord can now verify and confirm the receipt of funds using the interface below.",
                metadata: {
                    event: "awaiting_in_person",
                    systemType: "awaiting_in_person",
                    workflowStatus: "awaiting_in_person",
                    expiresAt,
                    landlordTransactionPath: `/landlord/invoices?invoiceId=${angeloPay.id}`,
                    actorName: "Tenant",
                    paymentId: angeloPay.id,
                    invoiceNumber: angeloPay.invoice_number,
                },
            });

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Fresh 'Awaiting In-Person Cash' card posted in John ↔ Angelo (Unit 302) chat.",
                    paymentId: angeloPay.id,
                    conversationId,
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: `/landlord/messages?conversation=${conversationId}`,
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 13. Chat Card: Official Receipt / Invoice Card (John <-> Maria, Unit 101)
        if (action === "seed-chat-invoice-receipt") {
            const admin = getAdminClient();
            const mariaId = demoIds?.tenants?.maria?.id || uid("tenant:maria");
            const mariaOctId = demoIds?.key_ids?.maria_october_payment || uid("pay:maria:2026-10-01");

            const { data: mariaPay, error: payErr } = await admin
                .from("payments")
                .select("id, invoice_number, amount, paid_at")
                .eq("id", mariaOctId)
                .single();

            if (payErr) throw payErr;

            const amountNum = Number(mariaPay.amount || 0);
            const formattedPeso = `₱${amountNum.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            const paidDate = new Date(mariaPay.paid_at || Date.now()).toLocaleDateString("en-PH", {
                month: "short",
                day: "numeric",
                year: "numeric",
                timeZone: "Asia/Manila",
            });

            const conversationId = await ensureDemoConversation(admin, mariaId, landlordId);
            await insertChatSystemCard(admin, {
                conversationId,
                senderId: landlordId,
                content: `Invoice for October 2026 Rent & Utilities (${formattedPeso}) has been attached.`,
                metadata: {
                    systemType: "invoice",
                    invoiceId: mariaPay.id,
                    paymentId: mariaPay.id,
                    invoiceNumber: mariaPay.invoice_number,
                    amount: amountNum.toLocaleString("en-PH"),
                    description: "October 2026 Rent & Utilities",
                    status: "Paid",
                    date: paidDate,
                    unit: "Room 101",
                    tenantName: ACCOUNTS.maria.name,
                    landlordName: ACCOUNTS.john.name,
                    propertyName: PROPERTY_NAME,
                    actionLabel: "View Receipt",
                    payNowPath: `/tenant/payments/${mariaPay.id}/checkout`,
                    actorName: "Landlord",
                },
            });

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Fresh Official Receipt card posted in John ↔ Maria (Unit 101) chat.",
                    paymentId: mariaPay.id,
                    conversationId,
                    recommendedAccount: ACCOUNTS.maria,
                    recommendedRoute: `/tenant/messages?conversation=${conversationId}`,
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 14. Chat Card: Payment Rejected / Issue Resolver (John <-> Joshua, Unit 102)
        if (action === "seed-chat-payment-rejected") {
            const admin = getAdminClient();
            const joshuaId = demoIds?.tenants?.joshua?.id || uid("tenant:joshua");
            const octId = demoIds?.key_ids?.joshua_october_payment || uid("pay:joshua:2026-10-01");
            const now = new Date().toISOString();
            const rejectionReason =
                "GCash reference number could not be verified — please re-submit a clearer screenshot.";

            await admin.from("payment_receipts").delete().eq("payment_id", octId);
            const { data: octPayment, error: payErr } = await admin
                .from("payments")
                .update({
                    status: "pending",
                    workflow_status: "rejected",
                    review_action: "reject",
                    rejection_reason: rejectionReason,
                    paid_at: null,
                    paid_amount: 0,
                    landlord_confirmed: false,
                    last_action_at: now,
                    last_action_by: landlordId,
                })
                .eq("id", octId)
                .select("id, invoice_number")
                .single();

            if (payErr) throw payErr;

            const conversationId = await ensureDemoConversation(admin, joshuaId, landlordId);
            await insertChatSystemCard(admin, {
                conversationId,
                senderId: landlordId,
                content: `The payment request has been rejected. Reason: ${rejectionReason}`,
                metadata: {
                    event: "landlord_review",
                    systemType: "landlord_review",
                    workflowStatus: "rejected",
                    reviewAction: "reject",
                    amountTag: "exact",
                    paymentId: octPayment.id,
                    invoiceNumber: octPayment.invoice_number,
                    rejectionReason,
                    issueType: null,
                    actorName: "Landlord",
                },
            });

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Joshua's Oct payment set to Rejected & rejection card posted in chat for live re-submission demo.",
                    paymentId: octPayment.id,
                    conversationId,
                    recommendedAccount: ACCOUNTS.joshua,
                    recommendedRoute: `/tenant/messages?conversation=${conversationId}`,
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 15. Competing Applicants + Active Invite Tokens (Units 103 & 303)
        if (action === "seed-competing-applicants") {
            const admin = getAdminClient();
            const unit103Id = uid("unit:103");
            const unit303Id = uid("unit:303");
            const inviteOnlineId = uid("invite:online");
            const jeromeId = demoIds?.key_ids?.jerome_application || uid("app:jerome");
            const patriciaId = demoIds?.key_ids?.patricia_application || uid("app:patricia");
            const kevinId = demoIds?.key_ids?.kevin_application || uid("app:kevin");
            const future60d = new Date(Date.now() + 60 * 86400_000).toISOString();
            const future3d = new Date(Date.now() + 3 * 86400_000).toISOString();

            await admin.from("units").update({ status: "vacant" }).in("id", [unit103Id, unit303Id]);

            await admin
                .from("tenant_intake_invites")
                .update({ status: "active", expires_at: future60d, max_uses: 50 })
                .eq("id", inviteOnlineId);

            await admin.from("applications").update({ status: "pending", reviewed_at: null }).eq("id", jeromeId);
            await admin.from("applications").update({ status: "reviewing" }).eq("id", patriciaId);
            await admin
                .from("applications")
                .update({
                    status: "payment_pending",
                    payment_pending_expires_at: future3d,
                    payment_portal_token_hash: sha256("fgd-pay-kevin-portal-2026"),
                    payment_portal_token_expires_at: future3d,
                })
                .eq("id", kevinId);

            await admin
                .from("application_payment_requests")
                .update({ status: "pending", due_at: future3d.slice(0, 10) })
                .eq("application_id", kevinId);

            const isPublicRoute =
                body?.as === "public" ||
                (typeof body?.targetRoute === "string" && body.targetRoute.startsWith("/apply/"));

            const targetRoute =
                isPublicRoute && typeof body?.targetRoute === "string" && body.targetRoute.trim()
                    ? body.targetRoute.trim()
                    : `/landlord/applications?id=${jeromeId}`;

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: isPublicRoute
                        ? "Public application & payment tokens active and current session cleared for visitor demonstration."
                        : "Competing applicants (Jerome pending, Patricia reviewing on 103; Kevin payment_pending on 303) & invite tokens restored.",
                    recommendedAccount: isPublicRoute ? undefined : ACCOUNTS.john,
                    recommendedRoute: targetRoute,
                },
                isPublicRoute ? undefined : autoSwitchEmail,
                isPublicRoute ? undefined : autoSwitchPassword,
            );
        }

        // 15b. Public Application Status Tracker (Kevin, payment_pending)
        if (action === "prepare-application-tracker") {
            const admin = getAdminClient();
            const kevinId = demoIds?.key_ids?.kevin_application || uid("app:kevin");
            const future3d = new Date(Date.now() + 3 * 86400_000).toISOString();

            await admin
                .from("applications")
                .update({
                    status: "payment_pending",
                    payment_pending_expires_at: future3d,
                })
                .eq("id", kevinId);

            await admin
                .from("application_payment_requests")
                .update({ status: "pending", due_at: future3d.slice(0, 10) })
                .eq("application_id", kevinId);

            const token = generateApplicationStatusToken(kevinId);
            const trackerRoute = `/apply/status?token=${encodeURIComponent(token)}`;

            return buildActionResponse({
                ok: true,
                action,
                message: "Generated a 30-day Application Status Tracker link for Kevin (payment_pending on Room 303).",
                recommendedRoute: trackerRoute,
            });
        }

        // 16. Urgent Maintenance + AI Triage (Mark Lim, Unit 301)
        if (action === "seed-urgent-maintenance") {
            const admin = getAdminClient();
            const ticketId = demoIds?.key_ids?.ticket_mark_outlet || uid("mr:mark:outlet");
            const now = new Date().toISOString();

            const { error } = await admin
                .from("maintenance_requests")
                .update({
                    status: "open",
                    priority: "urgent",
                    category: "electrical",
                    repair_method: null,
                    resolved_at: null,
                    ai_triage_priority: "urgent",
                    ai_triage_sentiment: "distressed",
                    ai_triage_reason:
                        "Electrical arcing and burning smell indicate a fire hazard; isolate the circuit and dispatch an electrician immediately.",
                    ai_triage_confidence: 0.97,
                    ai_triage_version: "v2",
                    ai_triaged_at: now,
                    updated_at: now,
                })
                .eq("id", ticketId);

            if (error) throw error;

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Mark Lim's Urgent Electrical ticket (Unit 301) with AI Triage restored to Open.",
                    ticketId,
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: `/landlord/maintenance?id=${ticketId}`,
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 17. Self-Repair Request Ticket (Ronald Bautista, Unit 202)
        if (action === "seed-self-repair-ticket") {
            const admin = getAdminClient();
            const ticketId = uid("mr:ronald:selfrepair");
            const now = new Date().toISOString();

            const { error } = await admin
                .from("maintenance_requests")
                .update({
                    status: "open",
                    priority: "low",
                    category: "plumbing",
                    self_repair_requested: true,
                    self_repair_decision: "pending",
                    repair_method: "self_repair",
                    resolved_at: null,
                    updated_at: now,
                })
                .eq("id", ticketId);

            if (error) throw error;

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Ronald Bautista's Self-Repair request (Unit 202) restored to Pending decision.",
                    ticketId,
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: `/landlord/maintenance?id=${ticketId}`,
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 18. Lease Renewal (Christine, 203) & Unit Transfer (Angelo, 302 -> 303)
        if (action === "seed-renewal-and-transfer") {
            const admin = getAdminClient();
            const renewalId = demoIds?.key_ids?.renewal_christine || uid("renewal:christine");
            const transferId = demoIds?.key_ids?.transfer_angelo || uid("transfer:angelo");
            const unit303Id = uid("unit:303");
            const now = new Date().toISOString();

            await admin.from("units").update({ status: "vacant" }).eq("id", unit303Id);

            const { error: renErr } = await admin
                .from("renewal_requests")
                .update({
                    status: "pending",
                    landlord_notes: null,
                    updated_at: now,
                })
                .eq("id", renewalId);
            if (renErr) throw renErr;

            const { error: trErr } = await admin
                .from("unit_transfer_requests")
                .update({
                    status: "pending",
                    updated_at: now,
                })
                .eq("id", transferId);
            if (trErr) throw trErr;

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Christine's Renewal (Unit 203) & Angelo's Unit Transfer (302 → 303) restored to Pending.",
                    renewalId,
                    transferId,
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: "/landlord/tenants?tab=renewals",
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 19. Move-Out Request Pending (Ronald Bautista, Unit 202)
        if (action === "seed-move-out-pending") {
            const admin = getAdminClient();
            const moveoutId = demoIds?.key_ids?.moveout_ronald || uid("moveout:ronald");
            const now = new Date().toISOString();

            const { error } = await admin
                .from("move_out_requests")
                .update({
                    status: "pending",
                    checklist_completed: false,
                    checklist_data: {
                        keys_returned: false,
                        room_cleaned: false,
                        utilities_settled: false,
                        forwarding_address: "Mandaue City, Cebu",
                    },
                    deposit_deductions: {},
                    approved_at: null,
                    completed_at: null,
                    updated_at: now,
                })
                .eq("id", moveoutId);

            if (error) throw error;

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Ronald Bautista's Move-Out request (Unit 202) restored to Pending Inspection.",
                    moveoutId,
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: `/landlord/move-out?id=${moveoutId}`,
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 20. Utility Submeter Billing Cycle Ready (Clean Nov+ ad-hoc readings, keep Oct baseline)
        if (action === "seed-utility-cycle-ready") {
            const admin = getAdminClient();
            const { error } = await admin
                .from("utility_readings")
                .delete()
                .eq("property_id", propertyId)
                .gte("billing_period_start", "2026-11-01");

            if (error) throw error;

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "November 2026 utility billing cycle cleaned and ready for live meter entry.",
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: "/landlord/utility-billing",
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 21. Office Cash Payment Collection (Angelo Fernandez, Room 302)
        if (action === "seed-cash-collection") {
            const admin = getAdminClient();
            const angeloPaymentId = demoIds?.key_ids?.angelo_october_payment || uid("pay:angelo:2026-10-01");
            const angeloId = demoIds?.tenants?.angelo?.id || uid("tenant:angelo");

            await admin
                .from("payments")
                .update({
                    status: "pending",
                    workflow_status: "pending",
                    intent_method: "cash",
                    paid_at: null,
                    landlord_confirmed: false,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", angeloPaymentId);

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Angelo's pending cash intent active. Opening Record Payment modal.",
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: `/landlord/dashboard?action=collect-payment&tenant=${angeloId}`,
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 22. Overdue Ledger & Late Penalties (Ronald Bautista, Room 202)
        if (action === "seed-overdue-ledger") {
            const admin = getAdminClient();
            const ronaldPaymentId = demoIds?.key_ids?.ronald_october_payment || uid("pay:ronald:2026-10-01");

            await admin
                .from("payments")
                .update({
                    status: "overdue",
                    workflow_status: "late",
                    paid_at: null,
                    landlord_confirmed: false,
                    updated_at: new Date().toISOString(),
                })
                .eq("id", ronaldPaymentId);

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Ronald's October bill marked overdue with late fee. Opening Overdue Ledger.",
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: "/landlord/invoices?status=late",
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 23. Financial Analytics & iRis AI Reporting
        if (action === "seed-analytics-iris") {
            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Switched to Landlord session. Opening Financial Analytics & Export.",
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: "/landlord/analytics?export=true",
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 24. Interactive 3-Floor Unit Map
        if (action === "seed-unit-map") {
            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Switched to Landlord session. Opening 3-Floor Interactive Unit Map.",
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: "/landlord/unit-map",
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 25. Community Board, Polls & Study Hall Approvals
        if (action === "seed-community-approvals") {
            const admin = getAdminClient();
            const reservationId = demoIds?.key_ids?.christine_reservation || uid("res:christine:studyhall");
            try {
                await admin
                    .from("amenity_reservations")
                    .update({ status: "pending", updated_at: new Date().toISOString() })
                    .eq("id", reservationId);
            } catch {}

            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Christine's Study Hall reservation pending. Opening Community Moderation queue.",
                    recommendedAccount: ACCOUNTS.john,
                    recommendedRoute: "/landlord/community?tab=approvals",
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        // 26. Responsive Mobile App Shell
        if (action === "seed-mobile-shell") {
            return buildActionResponse(
                {
                    ok: true,
                    action,
                    message: "Switched to Maria Santos (Room 101). Opening Mobile App Shell.",
                    recommendedAccount: ACCOUNTS.maria,
                    recommendedRoute: "/mobile/tenant/home",
                },
                autoSwitchEmail,
                autoSwitchPassword,
            );
        }

        return NextResponse.json({ ok: false, action, error: `Unknown action: ${action}` }, { status: 400, headers: CORS_HEADERS });
    } catch (error) {
        const message =
            error instanceof Error
                ? error.message
                : typeof error === "object" && error !== null && "message" in error
                  ? String((error as { message?: unknown }).message)
                  : "Action failed";
        return NextResponse.json(
            { ok: false, error: message },
            { status: 500, headers: CORS_HEADERS },
        );
    }
}
