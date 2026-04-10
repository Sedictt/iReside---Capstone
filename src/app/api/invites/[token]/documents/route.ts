import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
    TENANT_INVITE_REQUIREMENT_KEYS,
    getInviteAvailability,
    hashInviteToken,
    type TenantInviteRequirementKey,
} from "@/lib/tenant-intake-invites";

const BUCKET_NAME = "tenant-invite-documents";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 5;
const ALLOWED_IMAGE_PREFIX = "image/";

type InviteRecord = {
    id: string;
    application_type: "online" | "face_to_face";
    status: "active" | "revoked" | "expired" | "consumed";
    max_uses: number;
    use_count: number;
    expires_at: string | null;
    token_hash: string;
    required_requirements: TenantInviteRequirementKey[] | null;
};

const sanitizeFileName = (name: string) =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

async function loadInviteRecord(token: string) {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient
        .from("tenant_intake_invites")
        .select("id, application_type, status, max_uses, use_count, expires_at, token_hash, required_requirements")
        .eq("public_token", token)
        .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    const invite = data as InviteRecord;
    if (invite.token_hash !== hashInviteToken(token)) return null;
    return invite;
}

async function ensureBucket() {
    const admin = createAdminClient();
    const { data: bucket, error } = await admin.storage.getBucket(BUCKET_NAME);
    if (!error && bucket) return;

    const { error: createError } = await admin.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: `${MAX_FILE_SIZE_BYTES}`,
    });

    if (createError && !createError.message.toLowerCase().includes("already exists")) {
        throw createError;
    }
}

export async function POST(
    request: Request,
    context: { params: Promise<{ token: string }> }
) {
    const { token } = await context.params;

    try {
        const invite = await loadInviteRecord(token);
        if (!invite) {
            return NextResponse.json({ error: "Invite not found." }, { status: 404 });
        }

        const availability = getInviteAvailability({
            status: invite.status,
            expiresAt: invite.expires_at,
            useCount: invite.use_count,
            maxUses: invite.max_uses,
        });
        if (!availability.active) {
            return NextResponse.json({ error: "Invite is no longer available." }, { status: 410 });
        }

        if (invite.application_type !== "online") {
            return NextResponse.json({ error: "This invite does not accept document uploads." }, { status: 400 });
        }

        const formData = await request.formData();
        const requirementKey = formData.get("requirementKey");
        const key = typeof requirementKey === "string" ? requirementKey : "";
        const allowedKeys = Array.isArray(invite.required_requirements)
            ? invite.required_requirements.filter((item): item is TenantInviteRequirementKey =>
                typeof item === "string" && TENANT_INVITE_REQUIREMENT_KEYS.includes(item as TenantInviteRequirementKey)
            )
            : [];

        if (!key || !allowedKeys.includes(key as TenantInviteRequirementKey)) {
            return NextResponse.json({ error: "Invalid requirement key." }, { status: 400 });
        }

        const files = formData.getAll("files").filter((item): item is File => item instanceof File);
        if (files.length === 0) {
            return NextResponse.json({ error: "At least one image is required." }, { status: 400 });
        }
        if (files.length > MAX_FILES) {
            return NextResponse.json({ error: `Too many files. Max allowed is ${MAX_FILES}.` }, { status: 400 });
        }

        for (const file of files) {
            if (file.size <= 0) {
                return NextResponse.json({ error: "One of the files is empty." }, { status: 400 });
            }
            if (file.size > MAX_FILE_SIZE_BYTES) {
                return NextResponse.json({ error: "One of the files exceeds the size limit." }, { status: 400 });
            }
            if (!file.type || !file.type.startsWith(ALLOWED_IMAGE_PREFIX)) {
                return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
            }
        }

        const admin = createAdminClient();
        await ensureBucket();

        const timestamp = Date.now();
        const documents: Array<{ requirementKey: string; url: string; fileName: string }> = [];

        for (let index = 0; index < files.length; index += 1) {
            const file = files[index];
            const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
            const safeExt = sanitizeFileName(ext ?? "jpg") || "jpg";
            const safeBase = sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || `document-${index + 1}`;
            const path = `${invite.id}/${key}/${timestamp}-${index + 1}-${safeBase}.${safeExt}`;
            const bytes = await file.arrayBuffer();

            const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(path, bytes, {
                contentType: file.type,
                upsert: false,
            });

            if (uploadError) {
                return NextResponse.json({ error: "Failed to upload one or more documents." }, { status: 500 });
            }

            const {
                data: { publicUrl },
            } = admin.storage.from(BUCKET_NAME).getPublicUrl(path);

            documents.push({
                requirementKey: key,
                url: publicUrl,
                fileName: file.name,
            });
        }

        return NextResponse.json({ documents }, { status: 200 });
    } catch (error) {
        console.error("Failed to upload invite documents:", error);
        return NextResponse.json({ error: "Failed to upload documents." }, { status: 500 });
    }
}
