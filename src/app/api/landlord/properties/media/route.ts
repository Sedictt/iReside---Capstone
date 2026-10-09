import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { inspectImageUpload, propertyIdSchema, type InspectedImage } from "@/lib/validation/schemas/properties.schema";

const BUCKET_NAME = "property-images";
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;
const MAX_FILES = 12;

const sanitizeFileName = (name: string) =>
    name
        .toLowerCase()
        .replace(/[^a-z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

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
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId, supabase } = authContext;


    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return NextResponse.json({ error: "Upload must be sent as form data." }, { status: 400 });
    }
    const propertyId = formData.get("propertyId");

    if (typeof propertyId !== "string" || propertyId.trim().length === 0) {
        return NextResponse.json({ error: "Property id is required." }, { status: 400 });
    }
    if (!propertyIdSchema.safeParse(propertyId).success) {
        return NextResponse.json({ error: "Property ID is invalid." }, { status: 400 });
    }

    const { data: property, error: propertyError } = await supabase
        .from("properties")
        .select("id")
        .eq("id", propertyId)
        .eq("landlord_id", userId)
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

    // Type, extension, size and actual file content (magic bytes) are all checked server-side.
    const inspected: Array<Extract<InspectedImage, { ok: true }>> = [];
    for (const file of files) {
        const result = await inspectImageUpload(file, { maxBytes: MAX_FILE_SIZE_BYTES, label: `"${file.name || "Image"}"` });
        if (!result.ok) {
            return NextResponse.json({ error: result.error }, { status: 400 });
        }
        inspected.push(result);
    }

    try {
        const admin = createServiceRoleSupabaseClient();
        await ensureBucket();

        const timestamp = Date.now();
        const imageUrls: string[] = [];

        for (let index = 0; index < files.length; index += 1) {
            const file = files[index];
            const { bytes, contentType, extension } = inspected[index];
            const safeBase = (sanitizeFileName(file.name.replace(/\.[^.]+$/, "")) || `image-${index + 1}`).slice(0, 80);
            const path = `${userId}/${propertyId}/${timestamp}-${index + 1}-${safeBase}.${extension}`;

            const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(path, bytes, {
                contentType,
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
