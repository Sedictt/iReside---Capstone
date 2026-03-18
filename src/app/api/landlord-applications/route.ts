import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Get the authenticated user
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // 2. Parse the multipart form data
        const formData = await request.formData();
        const phone = formData.get("phone") as string;
        const identityDocument = formData.get("identityDocument") as File;
        const ownershipDocument = formData.get("ownershipDocument") as File;
        const livenessDocument = formData.get("livenessDocument") as File;

        if (!phone || !identityDocument || !ownershipDocument || !livenessDocument) {
            return NextResponse.json(
                { error: "Missing required fields or documents" },
                { status: 400 }
            );
        }

        // 3. Upload documents to Supabase Storage
        // We'll use a 'landlord-verification' bucket. 
        // Note: The user should make sure this bucket exists and has correct RLS/Policies.
        // For reliability, we'll use a naming convention: profile_id/timestamp_uuid_filename
        
        const uploadFile = async (file: File, folder: string) => {
            const fileExt = file.name.split(".").pop();
            const fileName = `${folder}/${Date.now()}_${uuidv4()}.${fileExt}`;
            const { data, error } = await supabase.storage
                .from("landlord-verification")
                .upload(fileName, file);

            if (error) throw error;
            return data.path;
        };

        const [idUrl, ownUrl, liveUrl] = await Promise.all([
            uploadFile(identityDocument, `${user.id}/identity`),
            uploadFile(ownershipDocument, `${user.id}/ownership`),
            uploadFile(livenessDocument, `${user.id}/liveness`),
        ]);

        // 4. Create the application record in the database
        const { error: insertError } = await supabase
            .from("landlord_applications")
            .insert({
                profile_id: user.id,
                phone: phone,
                identity_document_url: idUrl,
                ownership_document_url: ownUrl,
                liveness_document_url: liveUrl,
                status: "pending",
            });

        if (insertError) {
            // If uniqueness constraint is hit (e.g., active application already exists)
            if (insertError.code === "23505") {
                return NextResponse.json(
                    { error: "You already have an active application under review." },
                    { status: 409 }
                );
            }
            throw insertError;
        }

        // 5. Update user profile phone number if needed (optional but recommended)
        await supabase
            .from("profiles")
            .update({ phone: phone })
            .eq("id", user.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("[Landlord Application API Error]:", error);
        return NextResponse.json(
            { error: error.message || "An unexpected error occurred during submission." },
            { status: 500 }
        );
    }
}
