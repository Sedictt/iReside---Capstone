import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureUserInConversation, getProfilePreviewMap } from "@/lib/messages/engine";
import type { Json, MessageType } from "@/types/database";
import OpenAI from "openai";

const DEFAULT_FILES_BUCKET = "message-files";
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

async function moderateMessage(text: string): Promise<{ allowed: boolean; reason?: string }> {
    if (!process.env.GROQ_API_KEY) return { allowed: true }; // Fail open if no api key
    
    try {
        const moderationPrompt = `You are an automated chat moderator for a real estate property management app called iReside.
        
Determine if the following message violates communication policies. Violations include:
- Severe profanity
- Hate speech, harassment, or threats
- Spam or explicit content

Message to evaluate: "${text}"

Reply with EXACTLY the word "ALLOW" if the message is acceptable.
Reply with EXACTLY the word "BLOCK" if the message violates policies.
Do not reply with any other text.`;

        const response = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: moderationPrompt }],
            temperature: 0,
            max_tokens: 10,
        });

        const decision = response.choices[0]?.message?.content?.trim().toUpperCase() || "ALLOW";
        
        if (decision.includes("BLOCK")) {
            return { allowed: false, reason: "Message blocked by AI moderation due to policy violation" };
        }
        
        return { allowed: true };
    } catch (error) {
        console.error("AI Moderation failed: ", error);
        return { allowed: true }; // Fail-open to avoid blocking chat if AI is down
    }
}

type MessageBody = {
    content?: string;
    type?: MessageType;
    metadata?: Json | null;
};

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
                const rawMetadata = message.metadata;
                if (!rawMetadata || typeof rawMetadata !== "object") {
                    return message;
                }

                const metadata = rawMetadata as Record<string, unknown>;
                const filePath = typeof metadata.filePath === "string" ? metadata.filePath : null;

                if (!filePath) {
                    return message;
                }

                const bucket = typeof metadata.bucket === "string" ? metadata.bucket : DEFAULT_FILES_BUCKET;
                const { data: signedUrlData, error: signedUrlError } = await supabase.storage
                    .from(bucket)
                    .createSignedUrl(filePath, SIGNED_URL_TTL_SECONDS);

                if (signedUrlError || !signedUrlData?.signedUrl) {
                    return message;
                }

                return {
                    ...message,
                    metadata: {
                        ...metadata,
                        fileUrl: signedUrlData.signedUrl,
                    } as Json,
                };
            })
        );

        const payload = messagesWithSignedUrls.map((message) => ({
            id: message.id,
            conversationId: message.conversation_id,
            senderId: message.sender_id,
            sender: profileMap.get(message.sender_id) ?? null,
            type: message.type,
            content: message.content,
            metadata: message.metadata,
            readAt: message.read_at,
            createdAt: message.created_at,
        }));

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

    if (!content) {
        return NextResponse.json({ error: "Message content is required." }, { status: 400 });
    }

    if (!(["text", "system", "image", "file"] as MessageType[]).includes(messageType)) {
        return NextResponse.json({ error: "Invalid message type." }, { status: 400 });
    }

    if (messageType === "text") {
        const moderation = await moderateMessage(content);
        if (!moderation.allowed) {
            return NextResponse.json({ error: moderation.reason }, { status: 400 });
        }
    }

    try {
        const supabase = createAdminClient();
        const isMember = await ensureUserInConversation(supabase, conversationId, user.id);
        if (!isMember) {
            return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
        }

        const { data: inserted, error: insertError } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                type: messageType,
                content,
                metadata: body.metadata ?? null,
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
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Failed to send conversation message:", error);
        return NextResponse.json({ error: "Failed to send message." }, { status: 500 });
    }
}
