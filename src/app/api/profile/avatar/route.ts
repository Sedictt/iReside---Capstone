import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "profile-avatars";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_PREFIX = "image/";

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
    try {
        const authContext = await requireAuthenticatedUser(request);
        if (!("userId" in authContext)) return authContext as Response;
        const { userId } = authContext;

        const formData = await request.formData();
        const file = formData.get("file");

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "File is required." }, { status: 400 });
        }

        if (file.size <= 0) {
            return NextResponse.json({ error: "File is empty." }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ error: "File is too large. Max size is 5 MB." }, { status: 400 });
        }

        if (!file.type || !file.type.startsWith(ALLOWED_IMAGE_PREFIX)) {
            return NextResponse.json({ error: "Only image uploads are allowed." }, { status: 400 });
        }

        const admin = createServiceRoleSupabaseClient();
        await ensureBucket();

        const timestamp = Date.now();
        const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
        const safeExt = sanitizeFileName(ext ?? "jpg") || "jpg";
        const path = `${userId}/${timestamp}-avatar.${safeExt}`;
        const bytes = await file.arrayBuffer();

        const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(path, bytes, {
            contentType: file.type,
            upsert: true,
        });

        if (uploadError) {
            return NextResponse.json({ error: "Failed to upload profile image." }, { status: 500 });
        }

        const {
            data: { publicUrl },
        } = admin.storage.from(BUCKET_NAME).getPublicUrl(path);

        const { error: profileError } = await admin
            .from("profiles")
            .update({ avatar_url: publicUrl })
            .eq("id", userId);

        if (profileError) {
            return NextResponse.json({ error: "Failed to save avatar URL." }, { status: 500 });
        }

        return NextResponse.json({ avatarUrl: publicUrl }, { status: 200 });
    } catch (error) {
        console.error("Failed to upload avatar:", error);
        return NextResponse.json({ error: "Failed to update profile avatar." }, { status: 500 });
    }
}

/**
 * PATCH /api/profile/avatar
 * Update avatar_url and/or avatar_bg_color for the authenticated user
 */
export async function PATCH(request: Request) {
    try {
        const authContext = await requireAuthenticatedUser(request);
        if (!("userId" in authContext)) return authContext as Response;
        const { userId } = authContext;

        const body = await request.json().catch(() => ({}));
        const { avatar_url, avatar_bg_color } = body;

        const updates: Record<string, any> = {
            updated_at: new Date().toISOString(),
        };

        if (avatar_url !== undefined) {
            updates.avatar_url = typeof avatar_url === "string" ? avatar_url.trim() : null;
        }

        if (avatar_bg_color !== undefined) {
            updates.avatar_bg_color = avatar_bg_color;
        }

        const admin = createServiceRoleSupabaseClient();
        const { error: profileError } = await (admin as any)
            .from("profiles")
            .update(updates)
            .eq("id", userId);

        if (profileError) {
            console.error("[api/profile/avatar PATCH] Error:", profileError);
            return NextResponse.json({ error: "Failed to update profile appearance." }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            avatarUrl: updates.avatar_url,
            avatarBgColor: updates.avatar_bg_color,
        }, { status: 200 });
    } catch (error: any) {
        console.error("[api/profile/avatar PATCH] Unhandled error:", error);
        return NextResponse.json({ error: error?.message || "Failed to update profile appearance." }, { status: 500 });
    }
}

