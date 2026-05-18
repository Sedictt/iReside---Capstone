import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "community-images";
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 4;
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
        // Check if bucket has restrictive MIME types that don't include webp
        // @ts-expect-error - allowedMimeTypes may not be in type definition but exists at runtime
        const allowedMimeTypes = bucket.allowedMimeTypes;
        if (allowedMimeTypes && allowedMimeTypes.length > 0) {
            const hasWebp = allowedMimeTypes.some(
                (type: string) => type === "image/webp" || type === "image/*"
            );
            if (!hasWebp) {
                // Bucket exists but doesn't allow webp - try to update it
                const { error: updateError } = await admin.storage.updateBucket(BUCKET_NAME, {
                    // @ts-expect-error - allowedMimeTypes may not be in type definition
                    allowedMimeTypes: [...allowedMimeTypes, "image/webp"],
                });
                if (updateError) {
                    console.error("Failed to update bucket MIME types:", updateError);
                }
            }
        }
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
            return NextResponse.json(
                { error: "Only image uploads are allowed. Please use JPEG, PNG, GIF, or WebP." },
                { status: 400 }
            );
        }
    }

    try {
        const admin = createAdminClient();
        await ensureBucket();

        const timestamp = Date.now();
        const imageUrls: string[] = [];

        for (let index = 0; index < files.length; index += 1) {
            const file = files[index];
            const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
            const safeExt = sanitizeFileName(ext ?? "jpg") || "jpg";
            const safeBase = sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || `image-${index + 1}`;
            const path = `${user.id}/${timestamp}-${index + 1}-${safeBase}.${safeExt}`;
            const bytes = await file.arrayBuffer();

            const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(path, bytes, {
                contentType: file.type,
                upsert: false,
            });

            if (uploadError) {
                const errorMessage = uploadError.message.toLowerCase();
                const isMimeTypeIssue =
                    errorMessage.includes("mime") ||
                    errorMessage.includes("type") ||
                    errorMessage.includes("invalid") ||
                    errorMessage.includes("not allowed");

                const userMessage = isMimeTypeIssue
                    ? `Image type "${file.type}" is not supported. Please try converting to JPEG or PNG.`
                    : "Failed to upload one or more images.";

                console.error("Supabase upload error:", uploadError);
                return NextResponse.json(
                    { error: userMessage, details: uploadError.message },
                    { status: 500 }
                );
            }

            const {
                data: { publicUrl },
            } = admin.storage.from(BUCKET_NAME).getPublicUrl(path);

            imageUrls.push(publicUrl);
        }

        return NextResponse.json({ imageUrls }, { status: 200 });
    } catch (error) {
        console.error("Failed to upload community images:", error);
        return NextResponse.json({ error: "Failed to upload media." }, { status: 500 });
    }
}
