import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "business-permits";
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB for documents/photos
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
    const authClient = await createClient();
    const {
        data: { user },
        error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
        return NextResponse.json({ error: "File is too large. Max size is 15 MB." }, { status: 400 });
    }

    if (!file.type || !file.type.startsWith(ALLOWED_IMAGE_PREFIX)) {
        return NextResponse.json({ error: "Only image uploads are allowed for permit cards." }, { status: 400 });
    }

    try {
        const admin = createAdminClient();
        await ensureBucket();

        const timestamp = Date.now();
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
        const safeExt = sanitizeFileName(ext ?? "jpg") || "jpg";
        const path = `${user.id}/${timestamp}-permit.${safeExt}`;
        const bytes = await file.arrayBuffer();

        const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(path, bytes, {
            contentType: file.type,
            upsert: true,
        });

        if (uploadError) {
            console.error("Storage Error:", uploadError);
            return NextResponse.json({ error: "Failed to upload permit photo." }, { status: 500 });
        }

        const {
            data: { publicUrl },
        } = admin.storage.from(BUCKET_NAME).getPublicUrl(path);

        const { error: profileError } = await admin
            .from("profiles")
            .update({ business_permit_url: publicUrl })
            .eq("id", user.id);

        if (profileError) {
            console.error("DB Error:", profileError);
            return NextResponse.json({ error: "Failed to save permit URL to profile." }, { status: 500 });
        }

        return NextResponse.json({ permitUrl: publicUrl }, { status: 200 });
    } catch (error) {
        console.error("Failed to upload permit:", error);
        return NextResponse.json({ error: "An unexpected error occurred during upload." }, { status: 500 });
    }
}
