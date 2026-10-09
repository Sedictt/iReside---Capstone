import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type HealthCheck = { status: "pass" | "fail"; latencyMs?: number; message?: string };

/**
 * The public response only says whether the service is up. Configuration
 * details (which env vars are missing, SMTP host, DB latency, row counts) are
 * reconnaissance material and are returned only to callers that present the
 * `HEALTH_CHECK_SECRET` (or `CRON_SECRET`) bearer token.
 */
function isAuthorizedForDetails(authHeader: string | null): boolean {
  const secret = process.env.HEALTH_CHECK_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    // Without a secret, details are only available outside production.
    return process.env.NODE_ENV !== "production";
  }
  const expected = Buffer.from(`Bearer ${secret}`);
  const provided = Buffer.from(authHeader ?? "");
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}

async function checkDatabase(): Promise<HealthCheck> {
  const startTime = Date.now();
  try {
    const adminClient = createServiceRoleSupabaseClient();
    const { error } = await adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true });
    const latencyMs = Date.now() - startTime;
    if (error) {
      return { status: "fail", latencyMs, message: `PostgreSQL connection error: ${error.message}` };
    }
    return { status: "pass", latencyMs, message: "Connected successfully" };
  } catch (err: any) {
    return {
      status: "fail",
      latencyMs: Date.now() - startTime,
      message: err?.message || "Failed to initialize database client",
    };
  }
}

async function checkSmtp(): Promise<HealthCheck> {
  const smtpStart = Date.now();
  const envHost = process.env.SMTP_HOST || "smtp.gmail.com";
  const envUser = process.env.SMTP_USER?.trim();
  const envPass = process.env.SMTP_PASS?.trim();

  if (!envUser || !envPass) {
    return { status: "fail", message: "SMTP_USER or SMTP_PASS environment variable is missing" };
  }

  try {
    const nodemailer = await import("nodemailer");
    const isGmail = envHost.toLowerCase().includes("gmail");
    const port = isGmail ? 465 : 587;
    const transporter = nodemailer.createTransport({
      host: envHost,
      port,
      secure: port === 465,
      auth: {
        user: envUser,
        pass: envPass.replace(/['"\s]/g, ""),
      },
      // Verify the server certificate unless explicitly opted out (same switch as the mail transport).
      tls: { rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false" },
    });
    await transporter.verify();
    return { status: "pass", latencyMs: Date.now() - smtpStart, message: "SMTP connection verified successfully" };
  } catch (smtpErr: any) {
    return {
      status: "fail",
      latencyMs: Date.now() - smtpStart,
      message: smtpErr?.message || "Failed to verify SMTP connection",
    };
  }
}

/**
 * GET /api/health
 * Public liveness check; detailed readiness diagnostics require a bearer secret.
 */
export async function GET(request: Request) {
  const timestamp = new Date().toISOString();
  const detailed = isAuthorizedForDetails(request.headers.get("authorization"));

  const database = await checkDatabase();

  if (!detailed) {
    return NextResponse.json(
      { status: database.status === "pass" ? "healthy" : "unhealthy", timestamp },
      { status: database.status === "pass" ? 200 : 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  const checks: Record<string, HealthCheck> = { database };

  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "JWT_SECRET",
  ];
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  checks.environment = missingEnvVars.length === 0
    ? { status: "pass" }
    : { status: "fail", message: `Missing required environment variables: ${missingEnvVars.join(", ")}` };

  // The SMTP probe opens an outbound connection, so it only runs for authorized callers.
  checks.smtp = await checkSmtp();

  const isHealthy = Object.values(checks).every((check) => check.status === "pass");

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp,
      version: process.env.npm_package_version || "0.1.0",
      nodeEnv: process.env.NODE_ENV || "development",
      checks,
    },
    { status: isHealthy ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
