import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ReportBody = {
    conversationId?: string | null;
    category?: string;
    details?: string;
    exactMessage?: string;
    reportedMessageId?: string;
};

const MAX_DETAILS_LENGTH = 3000;
const MAX_EXACT_MESSAGE_LENGTH = 2000;
const MAX_SCREENSHOT_COUNT = 4;
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const REPORT_EVIDENCE_BUCKET = "message-report-evidence";
const ALLOWED_SCREENSHOT_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

type ReportScreenshotMetadata = {
    bucket: string;
    path: string;
    fileName: string;
    mimeType: string;
    size: number;
};

type MessageLookupRow = {
    id: string;
    conversation_id: string;
    sender_id: string;
    type: string;
    content: string;
    created_at: string;
};

const sanitizeFileName = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, "_");

export async function POST(
    request: Request,
    context: { params: Promise<{ targetUserId: string }> }
) {
    const supabase = await createClient();

    const {
        data: { user },
        error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { targetUserId } = await context.params;

    if (!targetUserId || targetUserId === user.id) {
        return NextResponse.json({ error: "Invalid target user." }, { status: 400 });
    }

    const contentType = request.headers.get("content-type") ?? "";
    const isMultipart = contentType.includes("multipart/form-data");

    let body: ReportBody | null = null;
    let screenshots: File[] = [];

    if (isMultipart) {
        const formData = await request.formData().catch(() => null);
        if (!formData) {
            return NextResponse.json({ error: "Invalid report payload." }, { status: 400 });
        }
        body = {
            conversationId: typeof formData.get("conversationId") === "string" ? (formData.get("conversationId") as string) : null,
            category: typeof formData.get("category") === "string" ? (formData.get("category") as string) : "",
            details: typeof formData.get("details") === "string" ? (formData.get("details") as string) : "",
            exactMessage: typeof formData.get("exactMessage") === "string" ? (formData.get("exactMessage") as string) : "",
            reportedMessageId: typeof formData.get("reportedMessageId") === "string" ? (formData.get("reportedMessageId") as string) : "",
        };
        screenshots = formData.getAll("screenshots").filter((value): value is File => value instanceof File);
    } else {
        body = (await request.json().catch(() => null)) as ReportBody | null;
    }

    const conversationId = (body?.conversationId ?? "").trim();
    const category = (body?.category ?? "").trim();
    const details = (body?.details ?? "").trim();
    const exactMessage = (body?.exactMessage ?? "").trim();
    const reportedMessageId = (body?.reportedMessageId ?? "").trim();

    if (!category) {
        return NextResponse.json({ error: "Report category is required." }, { status: 400 });
    }

    if (details.length > MAX_DETAILS_LENGTH) {
        return NextResponse.json({ error: "Report details are too long." }, { status: 400 });
    }

    if (category === "profanity" && exactMessage.length < 3 && !reportedMessageId) {
        return NextResponse.json({ error: "Please provide the exact offending message or select a specific message for profanity reports." }, { status: 400 });
    }

    if (exactMessage.length > MAX_EXACT_MESSAGE_LENGTH) {
        return NextResponse.json({ error: "Exact reported message is too long." }, { status: 400 });
    }

    if (screenshots.length > MAX_SCREENSHOT_COUNT) {
        return NextResponse.json({ error: `You can attach up to ${MAX_SCREENSHOT_COUNT} screenshots.` }, { status: 400 });
    }

    if (!details && !exactMessage && screenshots.length === 0 && !reportedMessageId) {
        return NextResponse.json({ error: "Please provide details, exact message, specific message ID, or at least one screenshot." }, { status: 400 });
    }

    try {
        let resolvedConversationId = conversationId || null;
        let reportedMessageSnapshot: Record<string, string> | null = null;

        if (reportedMessageId) {
            const adminClient = createAdminClient();
            const { data: messageRow, error: messageLookupError } = await adminClient
                .from("messages")
                .select("id, conversation_id, sender_id, type, content, created_at")
                .eq("id", reportedMessageId)
                .maybeSingle();

            if (messageLookupError || !messageRow) {
                return NextResponse.json({ error: "Selected message was not found." }, { status: 400 });
            }

            const typedMessage = messageRow as MessageLookupRow;
            if (typedMessage.sender_id !== targetUserId) {
                return NextResponse.json({ error: "Selected message does not belong to the reported user." }, { status: 400 });
            }

            if (resolvedConversationId && typedMessage.conversation_id !== resolvedConversationId) {
                return NextResponse.json({ error: "Selected message does not belong to this conversation." }, { status: 400 });
            }

            const { data: membership, error: membershipError } = await adminClient
                .from("conversation_participants")
                .select("conversation_id")
                .eq("conversation_id", typedMessage.conversation_id)
                .eq("user_id", user.id)
                .maybeSingle();

            if (membershipError || !membership) {
                return NextResponse.json({ error: "You do not have access to this message." }, { status: 403 });
            }

            resolvedConversationId = typedMessage.conversation_id;
            reportedMessageSnapshot = {
                id: typedMessage.id,
                conversationId: typedMessage.conversation_id,
                senderId: typedMessage.sender_id,
                type: typedMessage.type,
                content: typedMessage.content,
                createdAt: typedMessage.created_at,
            };
        }

        const uploadedScreenshots: ReportScreenshotMetadata[] = [];
        if (screenshots.length > 0) {
            const adminClient = createAdminClient();
            const { data: existingBucket } = await adminClient.storage.getBucket(REPORT_EVIDENCE_BUCKET);
            if (!existingBucket) {
                await adminClient.storage.createBucket(REPORT_EVIDENCE_BUCKET, {
                    public: false,
                    fileSizeLimit: `${MAX_SCREENSHOT_BYTES}`,
                    allowedMimeTypes: Array.from(ALLOWED_SCREENSHOT_TYPES),
                });
            }

            for (const screenshot of screenshots) {
                if (!ALLOWED_SCREENSHOT_TYPES.has(screenshot.type)) {
                    return NextResponse.json({ error: "Only PNG, JPG, WEBP, or GIF screenshots are allowed." }, { status: 400 });
                }
                if (screenshot.size > MAX_SCREENSHOT_BYTES) {
                    return NextResponse.json({ error: "Each screenshot must be 5MB or smaller." }, { status: 400 });
                }

                const safeName = sanitizeFileName(screenshot.name || "screenshot.png");
                const filePath = `reports/${user.id}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
                const arrayBuffer = await screenshot.arrayBuffer();
                const fileBytes = new Uint8Array(arrayBuffer);

                const { error: uploadError } = await adminClient.storage
                    .from(REPORT_EVIDENCE_BUCKET)
                    .upload(filePath, fileBytes, {
                        upsert: false,
                        contentType: screenshot.type || "application/octet-stream",
                    });

                if (uploadError) {
                    return NextResponse.json({ error: "Failed to upload screenshot evidence." }, { status: 500 });
                }

                uploadedScreenshots.push({
                    bucket: REPORT_EVIDENCE_BUCKET,
                    path: filePath,
                    fileName: screenshot.name || safeName,
                    mimeType: screenshot.type || "application/octet-stream",
                    size: screenshot.size,
                });
            }
        }

        const { data, error } = await supabase
            .from("message_user_reports")
            .insert({
                reporter_user_id: user.id,
                target_user_id: targetUserId,
                conversation_id: resolvedConversationId,
                category,
                details,
                metadata: {
                    source: "messages_quick_action_wizard",
                    exactMessage: exactMessage || null,
                    reportedMessageId: reportedMessageId || null,
                    reportedMessage: reportedMessageSnapshot,
                    screenshots: uploadedScreenshots,
                },
            })
            .select("id, status, created_at")
            .single();

        if (error) {
            console.error("Failed to submit message user report:", error);
            return NextResponse.json({ error: "Failed to submit report." }, { status: 500 });
        }

        return NextResponse.json({
            report: {
                id: data.id,
                status: data.status,
                createdAt: data.created_at,
                evidenceCount: screenshots.length,
            },
        });
    } catch (error) {
        console.error("Failed to submit message user report:", error);
        return NextResponse.json({ error: "Failed to submit report." }, { status: 500 });
    }
}
