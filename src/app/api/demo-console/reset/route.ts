import { NextResponse } from "next/server";
import { spawn } from "node:child_process";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * POST /api/demo-console/reset
 * Runs scripts/seed-defense-demo.mjs so the presenter can reset the demo from the console.
 * Only available locally: requires DEMO_CONSOLE_ENABLED=true and a non-production server.
 */
export async function POST() {
    if (process.env.DEMO_CONSOLE_ENABLED !== "true" || process.env.NODE_ENV === "production") {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const script = path.join(process.cwd(), "scripts", "seed-defense-demo.mjs");
    const startedAt = Date.now();

    const result = await new Promise<{ code: number | null; output: string }>((resolve) => {
        const child = spawn(process.execPath, [script], { cwd: process.cwd(), env: process.env });
        let output = "";
        const append = (chunk: Buffer) => {
            output += chunk.toString("utf8");
            if (output.length > 20_000) output = output.slice(-20_000);
        };
        child.stdout.on("data", append);
        child.stderr.on("data", append);
        child.on("error", (error) => resolve({ code: -1, output: `${output}\n${error.message}` }));
        child.on("close", (code) => resolve({ code, output }));
    });

    // Strip ANSI colour codes so the log reads cleanly in the console.
    const clean = result.output.replace(/\u001b\[[0-9;]*m/g, "");

    return NextResponse.json(
        { ok: result.code === 0, code: result.code, seconds: Math.round((Date.now() - startedAt) / 1000), output: clean },
        { status: result.code === 0 ? 200 : 500 },
    );
}
