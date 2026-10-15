import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/api/auth-guard";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/admin";
import { checkImageUpload, IMAGE_UPLOAD_POLICIES } from "@/lib/validation/schemas/account.schema";

const BUCKET_NAME = "brand-banners";
const UPLOAD_POLICY = IMAGE_UPLOAD_POLICIES.banner;
const MAX_FILE_SIZE_BYTES = UPLOAD_POLICY.maxBytes;

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
    if (authContext.userRole !== "landlord" && authContext.userRole !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Only landlords and administrators can update brand banner assets." },
        { status: 403 }
      );
    }
    const { userId } = authContext;

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || typeof file === "string" || typeof (file as any).arrayBuffer !== "function") {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File is too large. Max size is 10 MB." }, { status: 400 });
    }

    // Validate the real content (magic bytes; SVGs are checked for scripts),
    // not the client-declared MIME type or file name.
    const buffer = Buffer.from(await file.arrayBuffer());
    const check = checkImageUpload(file, new Uint8Array(buffer), UPLOAD_POLICY);
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: 400 });
    }

    const admin = createServiceRoleSupabaseClient();
    await ensureBucket();

    const timestamp = Date.now();
    const filePath = `landlords/${userId}/${timestamp}-banner${check.extension}`;

    const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(filePath, buffer, {
      contentType: check.contentType,
      upsert: true,
    });

    if (uploadError) {
      throw uploadError;
    }

    const { data: publicUrlData } = admin.storage.from(BUCKET_NAME).getPublicUrl(filePath);
    const bannerUrl = publicUrlData.publicUrl;

    // 1. Update properties owned by this landlord with the new bannerUrl
    const { data: properties } = await admin
      .from("properties")
      .select("id, map_decorations")
      .eq("landlord_id", userId);

    if (properties && properties.length > 0) {
      for (const prop of properties) {
        const currentDecorations = (prop.map_decorations as Record<string, unknown>) || {};
        const currentBranding = (currentDecorations.branding as Record<string, unknown>) || {};
        const updatedBranding = {
          ...currentBranding,
          bannerUrl,
        };
        await admin
          .from("properties")
          .update({
            map_decorations: { ...currentDecorations, branding: updatedBranding },
            updated_at: new Date().toISOString(),
          })
          .eq("id", prop.id);
      }
    }

    // 2. Update landlord profile socials.branding.bannerUrl
    const { data: userProfile } = await admin
      .from("profiles")
      .select("socials")
      .eq("id", userId)
      .maybeSingle();

    const existingSocials = (userProfile?.socials as Record<string, unknown>) || {};
    const existingBranding = (existingSocials.branding as Record<string, unknown>) || {};
    const updatedSocials = {
      ...existingSocials,
      branding: {
        ...existingBranding,
        bannerUrl,
      },
    };

    await admin
      .from("profiles")
      .update({
        socials: updatedSocials,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    return NextResponse.json({ bannerUrl });
  } catch (error: any) {
    console.error("[POST /api/branding/banner] Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload banner image" },
      { status: 500 }
    );
  }
}
