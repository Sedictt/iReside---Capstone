import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ensureUserInConversation } from "@/lib/messages/engine";
import type { MessageType } from "@/types/database";

const BUCKET_NAME = "message-files";
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

const ALLOWED_MIME_TYPES = new Set([
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-zip-compressed",
]);

const ALLOWED_IMAGE_PREFIX = "image/";

const sanitizeFileName = (name: string) =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

const isAllowedFileType = (mimeType: string) => {
    if (!mimeType) return false;
    if (mimeType.startsWith(ALLOWED_IMAGE_PREFIX)) return true;
    return ALLOWED_MIME_TYPES.has(mimeType);
};

const ensureBucket = async () => {
    const supabase = createAdminClient();
    const { data: bucket, error: bucketError } = await supabase.storage.getBucket(BUCKET_NAME);

    if (!bucketError && bucket) {
        return;
    }

    const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: `${MAX_FILE_SIZE_BYTES}`,
    });

    if (createError && !createError.message.toLowerCase().includes("already exists")) {
        throw createError;
    }
};

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

    try {
        const supabase = createAdminClient();
        const isMember = await ensureUserInConversation(supabase, conversationId, user.id);

        if (!isMember) {
            return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
        }

        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "File is required." }, { status: 400 });
        }

        if (file.size <= 0) {
            return NextResponse.json({ error: "File is empty." }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: "File is too large. Max size is 20 MB." }, { status: 400 });
        }

        if (!isAllowedFileType(file.type)) {
            return NextResponse.json(
                { error: "Unsupported file type. Allowed: images, PDF, TXT, DOCX, XLSX, PPTX, ZIP." },
                { status: 400 }
            );
        }

        await ensureBucket();

        const timestamp = Date.now();
        const normalizedName = sanitizeFileName(file.name || `attachment-${timestamp}`) || `attachment-${timestamp}`;
        const path = `${conversationId}/${user.id}/${timestamp}-${normalizedName}`;

        const arrayBuffer = await file.arrayBuffer();

        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(path, arrayBuffer, {
                contentType: file.type || "application/octet-stream",
                upsert: false,
            });

        if (uploadError) {
            return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
        }

        const isImage = file.type.startsWith("image/");
        const messageType: MessageType = isImage ? "image" : "file";

        const metadata = {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type || "application/octet-stream",
            filePath: path,
            bucket: BUCKET_NAME,
        };

        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
            .from(BUCKET_NAME)
            .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

        if (signedUrlError || !signedUrlData?.signedUrl) {
            return NextResponse.json({ error: "Failed to create file URL." }, { status: 500 });
        }

        const { data: inserted, error: insertError } = await supabase
            .from("messages")
            .insert({
                conversation_id: conversationId,
                sender_id: user.id,
                type: messageType,
                content: file.name,
                metadata,
            })
            .select("id, conversation_id, sender_id, type, content, metadata, read_at, created_at")
            .single();

        if (insertError || !inserted) {
            return NextResponse.json({ error: "Failed to create file message." }, { status: 500 });
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
                file: {
                    name: file.name,
                    size: file.size,
                    mimeType: file.type || "application/octet-stream",
                    url: signedUrlData.signedUrl,
                    path,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Failed to upload conversation file:", error);
        return NextResponse.json({ error: "Failed to upload file." }, { status: 500 });
    }
}
