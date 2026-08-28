import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const BUCKET_NAME = "property-images";
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

const ensureBucket = async () => {
  const admin = createServiceRoleSupabaseClient();
  const { data: bucket, error } = await admin.storage.getBucket(BUCKET_NAME);
  if (!error && bucket) return;

  const { error: createError } = await admin.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: `${MAX_FILE_SIZE_BYTES}`,
  });
  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw createError;
  }
};

export async function POST(request: NextRequest) {
  try {
    const authContext = await requireAuthenticatedUser(request);
    if (!("userId" in authContext)) return authContext as Response;
    const { userId } = authContext;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No image file provided." }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are permitted." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "Image file size exceeds 8MB limit." }, { status: 400 });
    }

    await ensureBucket();
    const admin = createServiceRoleSupabaseClient();

    const fileExt = file.name.split(".").pop() || "png";
    const fileName = `flyer_bg_${userId}_${Date.now()}.${fileExt}`;
    const filePath = `flyer-backgrounds/${fileName}`;
    const bytes = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(filePath, bytes, {
      contentType: file.type,
      upsert: true,
    });

    if (uploadError) {
      console.error("Failed to upload flyer background image:", uploadError);
      return NextResponse.json({ error: "Failed to upload image to storage." }, { status: 500 });
    }

    const { data: { publicUrl } } = admin.storage.from(BUCKET_NAME).getPublicUrl(filePath);

    return NextResponse.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error("Error in flyer background upload:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
