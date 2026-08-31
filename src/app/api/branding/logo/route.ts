import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

const BUCKET_NAME = "brand-logos";
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
    const cleanName = sanitizeFileName(file.name || "logo.png");
    const filePath = `landlords/${userId}/${timestamp}-${cleanName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(filePath, buffer, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = admin.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    const logoUrl = publicUrlData.publicUrl;

    return NextResponse.json({ logoUrl });
  } catch (error: any) {
    console.error("[POST /api/branding/logo] Upload error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to upload logo image" },
      { status: 500 }
    );
  }
}
