import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { checkImageUpload, IMAGE_UPLOAD_POLICIES } from "@/lib/validation/schemas/account.schema";

const BUCKET_NAME = "profile-covers";
const UPLOAD_POLICY = IMAGE_UPLOAD_POLICIES.cover;
const MAX_FILE_SIZE_BYTES = UPLOAD_POLICY.maxBytes; // 10MB for covers

const ensureBucket = async () => {
    const admin = createServiceRoleSupabaseClient();
    const { data: bucket, error } = await admin.storage.getBucket(BUCKET_NAME);

    if (!error && bucket) {
        return;
    }

    const { error: createError } = await admin.storage.createBucket(BUCKET_NAME, {
        public: true,
        fileSizeLimit: `${MAX_FILE_SIZE_BYTES}`,
    });

    if (createError && !createError.message.toLowerCase().includes("already exists")) {
        throw createError;
    }
};

export async function POST(request: Request) {
    try {
        const authContext = await requireAuthenticatedUser(request);
        if (!("userId" in authContext)) return authContext as Response;
        const { userId } = authContext;

        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "File is required." }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: "File is too large. Max size is 10 MB." }, { status: 400 });
        }

        // Validate the real content (magic bytes), not the client-declared MIME type.
        const bytes = await file.arrayBuffer();
        const check = checkImageUpload(file, new Uint8Array(bytes), UPLOAD_POLICY);
        if (!check.ok) {
            return NextResponse.json({ error: check.error }, { status: 400 });
        }

        const admin = createServiceRoleSupabaseClient();
        await ensureBucket();

        const timestamp = Date.now();
        const path = `${userId}/${timestamp}-cover${check.extension}`;

        const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(path, bytes, {
            contentType: check.contentType,
            upsert: true,
        });

        if (uploadError) {
            return NextResponse.json({ error: "Failed to upload cover image." }, { status: 500 });
        }

        const {
            data: { publicUrl },
        } = admin.storage.from(BUCKET_NAME).getPublicUrl(path);

        const { error: profileError } = await admin
            .from("profiles")
            .update({ cover_url: publicUrl })
            .eq("id", userId);

        if (profileError) {
            return NextResponse.json({ error: "Failed to save cover URL." }, { status: 500 });
        }

        return NextResponse.json({ coverUrl: publicUrl }, { status: 200 });
    } catch (error: any) {
        console.error("Failed to upload cover:", error);
        return NextResponse.json({ error: "Failed to update profile cover." }, { status: 500 });
    }
}

