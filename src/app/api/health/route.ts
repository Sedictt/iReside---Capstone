import { NextResponse } from "next/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * GET /api/health
 * Public health check & deployment validation endpoint.
 * Evaluates API readiness, database connectivity, and required environment configurations.
 */
export async function GET() {
  const timestamp = new Date().toISOString();
  const checks: Record<string, { status: "pass" | "fail"; latencyMs?: number; message?: string; debug?: any }> = {};

  // 1. Environment Variables Check
  const requiredEnvVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ];

  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);
  if (missingEnvVars.length === 0) {
    checks.environment = { status: "pass" };
  } else {
    checks.environment = {
      status: "fail",
      message: `Missing required environment variables: ${missingEnvVars.join(", ")}`,
    };
  }

  // 2. Database Connectivity Check
  const startTime = Date.now();
  try {
    const adminClient = createServiceRoleSupabaseClient();
    const { count, error } = await adminClient
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const latencyMs = Date.now() - startTime;

    if (error) {
      checks.database = {
        status: "fail",
        latencyMs,
        message: `PostgreSQL connection error: ${error.message}`,
      };
    } else {
      checks.database = {
        status: "pass",
        latencyMs,
        message: `Connected successfully (${count ?? 0} profiles indexed)`,
      };
    }
  } catch (err: any) {
    checks.database = {
      status: "fail",
      latencyMs: Date.now() - startTime,
      message: err?.message || "Failed to initialize database client",
    };
  }

  // 3. SMTP Connectivity Check
  const smtpStart = Date.now();
  const envHost = process.env.SMTP_HOST;
  const envUser = process.env.SMTP_USER;
  const envPass = process.env.SMTP_PASS;
  const activeUser = envUser || "ireside.official.mail@gmail.com";
  const activePass = envPass || "qzbh dxhc vazj krpt";

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.createTransport({
      host: envHost || "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: activeUser.trim(),
        pass: activePass.replace(/\s+/g, ""),
      },
      tls: { rejectUnauthorized: false },
    });
    await transporter.verify();
    checks.smtp = {
      status: "pass",
      latencyMs: Date.now() - smtpStart,
      message: "SMTP verified with smtp.gmail.com:465",
    };
  } catch (smtpErr: any) {
    checks.smtp = {
      status: "fail",
      latencyMs: Date.now() - smtpStart,
      message: smtpErr?.message || "Failed to verify SMTP",
      debug: {
        fromEnvUser: !!envUser,
        user: activeUser.slice(0, 7) + "...",
        fromEnvPass: !!envPass,
        passLength: activePass.length,
        passCleanedLength: activePass.replace(/\s+/g, "").length,
        passSample: activePass.slice(0, 2) + "..." + activePass.slice(-2),
      }
    };
  }

  const isHealthy = Object.values(checks).every((c) => c.status === "pass");

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp,
      version: process.env.npm_package_version || "0.1.0",
      nodeEnv: process.env.NODE_ENV || "development",
      checks,
    },
    { status: isHealthy ? 200 : 503 }
  );
}
