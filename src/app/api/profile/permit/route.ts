import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { checkImageUpload, IMAGE_UPLOAD_POLICIES } from "@/lib/validation/schemas/account.schema";

const BUCKET_NAME = "business-permits";
const UPLOAD_POLICY = IMAGE_UPLOAD_POLICIES.permit;
const MAX_FILE_SIZE_BYTES = UPLOAD_POLICY.maxBytes; // 15MB for documents/photos

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
    const { userId } = authContext;


    let formData: FormData;
    try {
        formData = await request.formData();
    } catch {
        return NextResponse.json({ error: "Request must be multipart form data with a file." }, { status: 400 });
    }
    const file = formData.get("file");

    if (!(file instanceof File)) {
        return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json({ error: "File is too large. Max size is 15 MB." }, { status: 400 });
    }

    try {
        // Permit cards are photos: validate the real content, not the declared MIME type.
        const bytes = await file.arrayBuffer();
        const check = checkImageUpload(file, new Uint8Array(bytes), UPLOAD_POLICY);
        if (!check.ok) {
            return NextResponse.json({ error: check.error }, { status: 400 });
        }

        const admin = createServiceRoleSupabaseClient();
        await ensureBucket();

        const timestamp = Date.now();
        const path = `${userId}/${timestamp}-permit${check.extension}`;

        const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(path, bytes, {
            contentType: check.contentType,
            upsert: true,
        });

        if (uploadError) {
            console.error("Storage Error:", uploadError);
            return NextResponse.json({ error: "Failed to upload permit photo." }, { status: 500 });
        }

        const {
            data: { publicUrl },
        } = admin.storage.from(BUCKET_NAME).getPublicUrl(path);

        const { data: existingBusinessProfile } = await (admin as any)
            .from("landlord_business_profiles")
            .select("business_name, business_permit_number, business_permits")
            .eq("profile_id", userId)
            .maybeSingle();

        const { error: profileError } = await (admin as any)
            .from("landlord_business_profiles")
            .upsert(
                {
                    profile_id: userId,
                    business_name: existingBusinessProfile?.business_name ?? null,
                    business_permit_number: existingBusinessProfile?.business_permit_number ?? null,
                    business_permit_url: publicUrl,
                    business_permits: existingBusinessProfile?.business_permits ?? [],
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "profile_id" }
            );


        if (profileError) {
            console.error("DB Error:", profileError);
            return NextResponse.json({ error: "Failed to save permit URL to business profile." }, { status: 500 });
        }

        return NextResponse.json({ permitUrl: publicUrl }, { status: 200 });
    } catch (error) {
        console.error("Failed to upload permit:", error);
        return NextResponse.json({ error: "An unexpected error occurred during upload." }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;

    try {
        const admin = createServiceRoleSupabaseClient();

        const { error: profileError } = await (admin as any)
            .from("landlord_business_profiles")
            .update({
                business_permit_url: null,
                updated_at: new Date().toISOString(),
            })
            .eq("profile_id", userId);

        if (profileError) {
            console.error("DB Error:", profileError);
            return NextResponse.json({ error: "Failed to remove permit document." }, { status: 500 });
        }

        try {
            await admin.from("profiles").update({ business_permit_url: null }).eq("id", userId);
        } catch {
            // Optional column fallback
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Failed to delete permit:", error);
        return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
    }
}
