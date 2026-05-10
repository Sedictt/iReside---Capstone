import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireUser } from "@/lib/supabase/auth";

const BUCKET_NAME = "profile-covers";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB for covers
const ALLOWED_IMAGE_PREFIX = "image/";

const sanitizeFileName = (name: string) =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

const ensureBucket = async () => {
    const admin = createAdminClient();
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
        const { user } = await requireUser();

        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "File is required." }, { status: 400 });
        }

        if (file.size <= 0) {
            return NextResponse.json({ error: "File is empty." }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: "File is too large. Max size is 10 MB." }, { status: 400 });
        }

        if (!file.type || !file.type.startsWith(ALLOWED_IMAGE_PREFIX)) {
            return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
        }

        const admin = createAdminClient();
        await ensureBucket();

        const timestamp = Date.now();
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
        const safeExt = sanitizeFileName(ext ?? "jpg") || "jpg";
        const path = `${user.id}/${timestamp}-cover.${safeExt}`;
        const bytes = await file.arrayBuffer();

        const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(path, bytes, {
            contentType: file.type,
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
            .eq("id", user.id);

        if (profileError) {
            return NextResponse.json({ error: "Failed to save cover URL." }, { status: 500 });
        }

        return NextResponse.json({ coverUrl: publicUrl }, { status: 200 });
    } catch (error: any) {
        if (error.message === "Unauthorized") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        console.error("Failed to upload cover:", error);
        return NextResponse.json({ error: "Failed to update profile cover." }, { status: 500 });
    }
}
