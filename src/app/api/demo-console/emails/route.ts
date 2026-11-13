import { NextRequest, NextResponse } from "next/server";
import { getAppBaseUrl } from "@/lib/app-url";
import { SAMPLE_EMAILS, renderSampleEmailById } from "@/lib/email/sample-catalog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAllowed() {
    return process.env.NODE_ENV !== "production" || process.env.DEMO_CONSOLE_ENABLED === "true";
}

export async function GET() {
    if (!isAllowed()) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        const emails = await Promise.all(
            SAMPLE_EMAILS.map(async (item) => {
                try {
                    return (
                        (await renderSampleEmailById(item.id)) ?? {
                            id: item.id,
                            category: item.category,
                            title: item.title,
                            recipientRole: item.recipientRole,
                            trigger: item.trigger,
                            subject: item.title,
                            htmlBody: "",
                            textBody: "",
                        }
                    );
                } catch (err: any) {
                    return {
                        id: item.id,
                        category: item.category,
                        title: item.title,
                        recipientRole: item.recipientRole,
                        trigger: item.trigger,
                        subject: `[Render Error] ${item.title}`,
                        htmlBody: `<pre style="padding:16px;font-family:monospace;color:#b91c1c;">${String(err?.message ?? err)}</pre>`,
                        textBody: String(err?.message ?? err),
                    };
                }
            }),
        );

        const smtpConfigured = Boolean(
            process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim(),
        );

        return NextResponse.json({ emails, smtpConfigured });
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message ?? "Failed to render sample emails" },
            { status: 500 },
        );
    }
}

export async function POST(req: NextRequest) {
    if (!isAllowed()) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    try {
        const body = (await req.json()) as { id?: string; to?: string };
        const id = body.id?.trim();
        const to = body.to?.trim();

        if (!id || !to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
            return NextResponse.json(
                { error: "Please provide a valid email template ID and recipient email address." },
                { status: 400 },
            );
        }

        const item = SAMPLE_EMAILS.find((e) => e.id === id);
        if (!item) {
            return NextResponse.json({ error: "Email template not found." }, { status: 404 });
        }

        if (!process.env.SMTP_USER?.trim() || !process.env.SMTP_PASS?.trim()) {
            return NextResponse.json(
                { error: "SMTP_USER / SMTP_PASS are not configured on this server." },
                { status: 400 },
            );
        }

        const baseUrl = getAppBaseUrl();
        await item.render(to, baseUrl);

        return NextResponse.json({
            ok: true,
            message: `Sent "${item.title}" to ${to}`,
        });
    } catch (err: any) {
        return NextResponse.json(
            { error: err?.message ?? "Failed to send sample email." },
            { status: 500 },
        );
    }
}
