import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureUserInConversation, getProfilePreviewMap } from "@/lib/messages/engine";
import { redactWithAiOrFallback } from "@/lib/messages/redaction-service";
import type { Json, MessageType } from "@/types/database";

const DEFAULT_FILES_BUCKET = "message-files";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

type MessageBody = {
    content?: string;
    type?: MessageType;
    metadata?: Json | null;
};

const isJsonObject = (value: Json | null | undefined): value is Record<string, Json> =>
    Boolean(value) && typeof value === "object" && !Array.isArray(value);

export async function GET(
    request: Request,
    context: { params: Promise<{ conversationId: string }> }
) {
    const authClient = await createClient();

    const {
        data: { user },
        error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;

    try {
        const supabase = createAdminClient();
        const isMember = await ensureUserInConversation(supabase, conversationId, user.id);
        if (!isMember) {
            return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
        }

        const url = new URL(request.url);
        const limitParam = Number(url.searchParams.get("limit") ?? "100");
        const limit = Number.isFinite(limitParam) ? Math.max(1, Math.min(500, Math.floor(limitParam))) : 100;

        const { data: messages, error: messagesError } = await supabase
            .from("messages")
            .select("id, conversation_id, sender_id, type, content, metadata, read_at, created_at")
            .eq("conversation_id", conversationId)
            .order("created_at", { ascending: true })
            .limit(limit);

        if (messagesError) {
            return NextResponse.json({ error: "Failed to fetch messages." }, { status: 500 });
        }

        const senderIds = Array.from(new Set((messages ?? []).map((message) => message.sender_id)));
        const profileMap = await getProfilePreviewMap(supabase, senderIds);

        const messagesWithSignedUrls = await Promise.all(
            (messages ?? []).map(async (message) => {
                let metadata: Record<string, unknown>;
                
                if (typeof message.metadata === "string") {
                    try {
                        metadata = JSON.parse(message.metadata);
                    } catch {
                        return message;
                    }
                } else if (message.metadata && typeof message.metadata === "object" && !Array.isArray(message.metadata)) {
                    metadata = message.metadata as Record<string, unknown>;
                } else {
                    return message;
                }

                const filePath = typeof metadata.filePath === "string" ? metadata.filePath : null;
                const attachments = Array.isArray(metadata.attachments) ? metadata.attachments : null;

                if (!filePath && !attachments) {
                    return { ...message, metadata: metadata as any };
                }

                const bucket = typeof metadata.bucket === "string" ? metadata.bucket : DEFAULT_FILES_BUCKET;

                // Handle single file
                let updatedMetadata = { ...metadata };
                if (filePath) {
                    const { data: signedUrlData } = await supabase.storage
                        .from(bucket)
                        .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);
                    if (signedUrlData?.signedUrl) {
                        updatedMetadata.fileUrl = signedUrlData.signedUrl;
                    }
                }

                // Handle album attachments
                if (attachments) {
                    const updatedAttachments = await Promise.all(
                        attachments.map(async (att: any) => {
                            if (typeof att.filePath !== "string") return att;
                            const { data: signedUrlData } = await supabase.storage
                                .from(bucket)
                                .createSignedUrl(att.filePath, SIGNED_URL_TTL_SECONDS);
                            if (signedUrlData?.signedUrl) {
                                return { ...att, fileUrl: signedUrlData.signedUrl };
                            }
                            return att;
                        })
                    );
                    updatedMetadata.attachments = updatedAttachments;
                }

                return {
                    ...message,
                    metadata: updatedMetadata as Json,
                };
            })
        );

        const payload = messagesWithSignedUrls.map((message) => {
            const metadata = message.metadata as Record<string, unknown> | null;
            return {
                id: message.id,
                conversationId: message.conversation_id,
                senderId: message.sender_id,
                sender: profileMap.get(message.sender_id) ?? null,
                type: message.type,
                content: message.content,
                metadata: message.metadata,
                readAt: message.read_at,
                createdAt: message.created_at,
                fileUrl: typeof metadata?.fileUrl === "string" ? metadata.fileUrl : undefined,
                fileName: typeof metadata?.fileName === "string" ? metadata.fileName : undefined,
                fileSize: typeof metadata?.fileSize === "number" ? metadata.fileSize : undefined,
                fileMimeType: typeof (metadata?.fileMimeType ?? metadata?.mimeType) === "string" ? (metadata?.fileMimeType ?? metadata?.mimeType) : undefined,
                isAlbum: Boolean(metadata?.isAlbum),
                attachments: Array.isArray(metadata?.attachments) ? metadata.attachments : undefined,
                timestamp: message.created_at,
            };
        });

        return NextResponse.json({ messages: payload });
    } catch (error) {
        console.error("Failed to fetch conversation messages:", error);
        return NextResponse.json({ error: "Failed to fetch messages." }, { status: 500 });
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ conversationId: string }> }
) {
    const authClient = await createClient();

    const {
        data: { user },
        error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId } = await context.params;

    const body = (await request.json()) as MessageBody;
    const content = (body.content ?? "").trim();
    const messageType = body.type ?? "text";

    if (!content && (messageType === "text" || messageType === "system")) {
        return NextResponse.json({ error: "Message content is required for text messages." }, { status: 400 });
    }

    if (!(["text", "system", "image", "file"] as MessageType[]).includes(messageType)) {
        return NextResponse.json({ error: "Invalid message type." }, { status: 400 });
    }

    try {
        const supabase = createAdminClient();
        const isMember = await ensureUserInConversation(supabase, conversationId, user.id);
        if (!isMember) {
            return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
        }

        const baseMetadata = isJsonObject(body.metadata) ? { ...body.metadata } : {};
        let resolvedMetadata: Json | null = body.metadata ?? null;

        if (messageType === "text") {
            const moderation = await redactWithAiOrFallback(content);
            if (moderation.redactionCategory === "profanity") {
                throw new Error("Message blocked due to profanity policy violation.");
            }
            if (moderation.redactionCategory === "phishing") {
                throw new Error("Message blocked due to phishing policy violation.");
            }
            if (moderation.redactionCategory === "spam") {
                throw new Error("Message blocked due to spam policy violation.");
            }
            resolvedMetadata = {
                ...baseMetadata,
                isRedacted: moderation.isSensitive,
                redactedContent: moderation.redactedMessage,
                isConfirmedDisclosed: false,
                isPhishing: moderation.isPhishing,
                redactionCategory: moderation.redactionCategory,
                disclosureAllowed: moderation.disclosureAllowed,
                moderationSource: moderation.source,
            } as Json;
        }

        const { data: inserted, error: insertError } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                type: messageType,
                content,
                metadata: resolvedMetadata,
            })
            .select("id, conversation_id, sender_id, type, content, metadata, read_at, created_at")
            .single();

        if (insertError || !inserted) {
            return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
        }

        return NextResponse.json(
            {
                message: {
                    id: inserted.id,
                    conversationId: inserted.conversation_id,
                    senderId: inserted.sender_id,
                    type: inserted.type,
                    content: inserted.content,
                    metadata: inserted.metadata,
                    readAt: inserted.read_at,
                    createdAt: inserted.created_at,
                    fileUrl: isJsonObject(inserted.metadata) && typeof inserted.metadata.fileUrl === "string" ? inserted.metadata.fileUrl : undefined,
                    fileName: isJsonObject(inserted.metadata) && typeof inserted.metadata.fileName === "string" ? inserted.metadata.fileName : undefined,
                    fileSize: isJsonObject(inserted.metadata) && typeof inserted.metadata.fileSize === "number" ? inserted.metadata.fileSize : undefined,
                    fileMimeType: isJsonObject(inserted.metadata) && typeof (inserted.metadata.fileMimeType ?? inserted.metadata.mimeType) === "string" ? (inserted.metadata.fileMimeType ?? inserted.metadata.mimeType) : undefined,
                    isAlbum: isJsonObject(inserted.metadata) && Boolean(inserted.metadata.isAlbum),
                    attachments: isJsonObject(inserted.metadata) && Array.isArray(inserted.metadata.attachments) ? inserted.metadata.attachments : undefined,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        const message = error instanceof Error ? error.message : "";
        if (message.includes("policy violation")) {
            return NextResponse.json({ error: message }, { status: 422 });
        }
        console.error("Failed to send conversation message:", error);
        return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
    }
}
