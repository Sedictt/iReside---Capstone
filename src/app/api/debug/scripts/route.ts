import { NextRequest, NextResponse } from "next/server";
import { spawn } from "node:child_process";
import { SCRIPT_REGISTRY, DebugScriptDefinition } from "@/lib/debug/scripts-registry";

export async function GET() {
  return NextResponse.json({
    scripts: Object.values(SCRIPT_REGISTRY),
    environment: process.env.NODE_ENV,
    isDevelopment: process.env.NODE_ENV !== "production",
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { scriptId, params = {} } = body;

    const def = SCRIPT_REGISTRY[scriptId];
    if (!def) {
      return NextResponse.json({ error: `Unknown script identifier: ${scriptId}` }, { status: 400 });
    }

    // Build arguments
    const args: string[] = [];
    if (def.defaultArgs) {
      args.push(...def.defaultArgs);
    } else if (def.file) {
      args.push(def.file);
    }

    if (def.inputs && def.inputs.length > 0) {
      for (const input of def.inputs) {
        const val = params[input.id]?.trim();
        if (input.required && !val) {
          return NextResponse.json({ error: `Field '${input.label}' is required.` }, { status: 400 });
        }
        if (val) {
          args.push(val);
        }
      }
    }

    const commandExecutable = def.runner === "node" ? "node" : "npx";
    const startTime = Date.now();
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        const sendEvent = (data: Record<string, unknown>) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        };

        sendEvent({
          type: "start",
          scriptId: def.id,
          name: def.name,
          command: `${commandExecutable} ${args.join(" ")}`,
          timestamp: new Date().toISOString(),
        });

        const child = spawn(commandExecutable, args, {
          cwd: process.cwd(),
          shell: true,
          env: {
            ...process.env,
            FORCE_COLOR: "1",
            NODE_ENV: process.env.NODE_ENV || "development",
          },
        });

        child.stdout?.on("data", (chunk: Buffer) => {
          sendEvent({
            type: "stdout",
            text: chunk.toString("utf-8"),
          });
        });

        child.stderr?.on("data", (chunk: Buffer) => {
          sendEvent({
            type: "stderr",
            text: chunk.toString("utf-8"),
          });
        });

        child.on("close", (code: number | null) => {
          const duration = Date.now() - startTime;
          sendEvent({
            type: "exit",
            code: code ?? 0,
            duration,
          });
          controller.close();
        });

        child.on("error", (err: Error) => {
          sendEvent({
            type: "error",
            error: err.message,
          });
          controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
