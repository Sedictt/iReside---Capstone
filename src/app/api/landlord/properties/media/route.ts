import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "property-images";
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 12;
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
    const propertyId = formData.get("propertyId");

    if (typeof propertyId !== "string" || propertyId.trim().length === 0) {
        return NextResponse.json({ error: "Property id is required." }, { status: 400 });
    }

    const { data: property, error: propertyError } = await authClient
        .from("properties")
        .select("id")
        .eq("id", propertyId)
        .eq("landlord_id", user.id)
        .maybeSingle();

    if (propertyError || !property) {
        return NextResponse.json({ error: "Property not found or access denied." }, { status: 403 });
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
            return NextResponse.json({ error: "One of the files exceeds the 8 MB size limit." }, { status: 400 });
        }

        if (!file.type || !file.type.startsWith(ALLOWED_IMAGE_PREFIX)) {
            return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
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
            const path = `${user.id}/${propertyId}/${timestamp}-${index + 1}-${safeBase}.${safeExt}`;
            const bytes = await file.arrayBuffer();

            const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(path, bytes, {
                contentType: file.type,
                upsert: false,
            });

            if (uploadError) {
                return NextResponse.json({ error: "Failed to upload one or more images." }, { status: 500 });
            }

            const {
                data: { publicUrl },
            } = admin.storage.from(BUCKET_NAME).getPublicUrl(path);

            imageUrls.push(publicUrl);
        }

        return NextResponse.json({ imageUrls }, { status: 200 });
    } catch (error) {
        console.error("Failed to upload property images:", error);
        return NextResponse.json({ error: "Failed to upload property media." }, { status: 500 });
    }
}
