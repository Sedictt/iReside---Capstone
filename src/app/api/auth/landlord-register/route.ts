import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";
import { MAX_FILE_SIZE } from "@/lib/constants";
import { zEmail, zPersonName, zRequiredPhone, zRequiredText } from "@/lib/validation/zod-fields";
import { escapeLikePattern } from "@/lib/validation/schemas/account.schema";

const landlordRegistrationSchema = z.object({
    fullName: zPersonName("Full name"),
    phone: zRequiredPhone(),
    email: zEmail("Email"),
    emailVerified: z.boolean(),
    propertyName: zRequiredText("Property name", 100, 2),
    propertyAddress: zRequiredText("Property address", 250, 10),
});

// Identity / permit / ownership documents: images or PDF only.
const DOCUMENT_EXTENSION_BY_TYPE: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
};

interface UploadedFile {
    name: string;
    type: string;
    data: string; // base64
}

const fileSchema = z.object({
    name: z.string().trim().min(1).max(255, "File name is too long"),
    type: z.string().trim().toLowerCase().refine((type) => type in DOCUMENT_EXTENSION_BY_TYPE, "Documents must be a JPG, PNG, WebP or PDF file"),
    data: z.string().min(1, "File is empty").regex(/^[A-Za-z0-9+/=\s]+$/, "File data is not valid base64"),
}).optional().refine(file => {
    if (!file) return true;
    // Calculate approximate size from base64 (3/4 of length)
    // base64 length is always a multiple of 4.
    const sizeInBytes = (file.data.length * 3) / 4;
    return sizeInBytes <= MAX_FILE_SIZE * 1.1; // 10% margin for base64 overhead/padding
}, "File size exceeds the 5MB limit");

const landlordRegistrationWithFilesSchema = landlordRegistrationSchema.extend({
    idFile: fileSchema,
    permitFile: fileSchema,
    permitCardFile: fileSchema,
    ownershipFile: fileSchema,
});

// Next.js App Router handles body size limits via next.config.js or defaults. 
// The 'config' export is deprecated in Route Handlers.

// This unauthenticated endpoint backs the deprecated self-service landlord
// signup (components/deprecated/LandlordSignup). It trusts a client-supplied
// `emailVerified` flag and creates auth users for arbitrary addresses, so it
// stays disabled unless the operator explicitly opts in.
const isLegacyRegistrationEnabled = () => process.env.ENABLE_LEGACY_LANDLORD_REGISTRATION === "true";

export async function POST(request: Request) {
    if (!isLegacyRegistrationEnabled()) {
        return NextResponse.json(
            { error: "Self-service landlord registration is disabled. Please contact the operator to be onboarded." },
            { status: 410 }
        );
    }

    try {
        const contentType = request.headers.get("content-type") || "";
        
        let parsed: z.infer<typeof landlordRegistrationWithFilesSchema>;
        
        if (contentType.includes("application/json")) {
            const body = await request.json();
            parsed = landlordRegistrationWithFilesSchema.parse(body.data);
        } else if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
            const formData = await request.formData();
            const rawData = formData.get("data");
            if (!rawData) {
                return NextResponse.json({ error: "No data provided" }, { status: 400 });
            }
            parsed = landlordRegistrationWithFilesSchema.parse(JSON.parse(rawData as string));
        } else {
            return NextResponse.json({ 
                error: "Content-Type must be application/json or multipart/form-data" 
            }, { status: 400 });
        }
        
        if (!parsed.emailVerified) {
            return NextResponse.json({ error: "Email must be verified before submission" }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Check if email already has an application
        const { data: existingApp } = await adminClient
            .from("landlord_applications")
            .select("id, status, email")
            .ilike("email", escapeLikePattern(parsed.email))
            .maybeSingle();

        if (existingApp) {
            if (existingApp.status === "pending" || existingApp.status === "reviewing") {
                return NextResponse.json({ 
                    error: "You already have a pending application. Please wait for review." 
                }, { status: 409 });
            }
            if (existingApp.status === "approved") {
                return NextResponse.json({ 
                    error: "Your application was already approved. Please log in." 
                }, { status: 409 });
            }
        }

        // Check for existing auth user
        let userId: string;
        
        // Use listUsers as a way to find by email (Supabase admin SDK)
        const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
        const existingAuthUser = users.find(u => u.email?.toLowerCase() === parsed.email.toLowerCase());

        if (existingAuthUser) {
            // Never mutate an existing account from an unauthenticated request:
            // flipping its role to landlord here let anyone escalate (or hijack)
            // an account just by knowing its email address.
            return NextResponse.json(
                { error: "An account with this email already exists. Please log in or contact the operator." },
                { status: 409 }
            );
        } else {
            // Create auth user with unconfirmed email (will be confirmed later)
            const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
                email: parsed.email.toLowerCase(),
                password: crypto.randomBytes(32).toString('hex'), // Temporary password
                email_confirm: false, // Not confirmed yet
                user_metadata: {
                    full_name: parsed.fullName,
                    phone: parsed.phone,
                    role: 'landlord',
                }
            });

            if (authError) {
                console.error("Failed to create auth user:", authError);
                return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
            }
            
            userId = authData.user.id;
        }

        // Create or update profile record for this landlord
        const { data: profileData, error: profileError } = await adminClient
            .from("profiles")
            .upsert({
                id: userId,
                email: parsed.email.toLowerCase(),
                full_name: parsed.fullName,
                role: 'landlord',
            })
            .select()
            .single();

        if (profileError) {
            console.error("Failed to create profile:", profileError);
            // Only delete if we just created the user
            if (!existingAuthUser) {
                await adminClient.auth.admin.deleteUser(userId);
            }
            return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
        }

        await (adminClient as any)
            .from("profile_private")
            .upsert(
                {
                    profile_id: profileData.id,
                    phone: parsed.phone,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "profile_id" }
            );

        // Helper to upload base64 file to storage (skip if bucket doesn't exist)
        async function uploadFile(file: UploadedFile | undefined, folder: string): Promise<string | null> {
            if (!file) {
                console.log(`[Upload] Skipping ${folder}: no file provided`);
                return null;
            }
            
            try {
                console.log(`[Upload] Starting upload for ${folder} (${file.name}, ${file.type}, ${Math.round(file.data.length * 0.75 / 1024)}KB)`);
                const buffer = Buffer.from(file.data, "base64");
                const ext = DOCUMENT_EXTENSION_BY_TYPE[file.type] ?? "bin";
                const fileName = `${folder}/${crypto.randomUUID()}.${ext}`;
                
                const { data, error } = await adminClient.storage
                    .from("landlord-documents")
                    .upload(fileName, buffer, { contentType: file.type });

                if (error) {
                    console.error(`[Upload] Failed to upload ${folder}:`, error);
                    return null;
                }

                const { data: { publicUrl } } = adminClient.storage
                    .from("landlord-documents")
                    .getPublicUrl(data.path);
                
                console.log(`[Upload] Success for ${folder}: ${publicUrl}`);
                return publicUrl;
            } catch (err) {
                console.error(`[Upload] Critical error for ${folder}:`, err);
                return null;
            }
        }

        // Upload documents (optional - don't fail if storage isn't set up)
        const [idDocUrl, permitDocUrl, permitCardDocUrl, ownershipDocUrl] = await Promise.all([
            uploadFile(parsed.idFile, "identity"),
            uploadFile(parsed.permitFile, "permit"),
            uploadFile(parsed.permitCardFile, "permit-card"),
            uploadFile(parsed.ownershipFile, "ownership"),
        ]);

        // Create the landlord application with the created profile_id
        const { data: application, error: appError } = await adminClient
            .from("landlord_applications")
            .insert({
                profile_id: profileData.id,
                phone: parsed.phone,
                business_name: parsed.propertyName,
                business_address: parsed.propertyAddress,
                identity_document_url: idDocUrl,
                ownership_document_url: ownershipDocUrl,
                business_permit_url: permitDocUrl,
                business_permit_card_url: permitCardDocUrl,
                status: "pending",
                verification_status: "not_verified",
            })
            .select()
            .single();

        if (appError) {
            console.error("Failed to create landlord application:", appError);
            // Clean up: delete profile if application creation fails
            // Only delete auth user if we just created them
            if (!existingAuthUser) {
                await adminClient.auth.admin.deleteUser(userId);
            }
            await adminClient.from("profiles").delete().eq("id", profileData.id);
            return NextResponse.json({ error: "Failed to submit application" }, { status: 500 });
        }

        // Immediately sync business info to the normalized business profile.
        await (adminClient as any)
            .from("landlord_business_profiles")
            .upsert({
                profile_id: profileData.id,
                business_name: parsed.propertyName,
                business_permit_url: permitCardDocUrl || permitDocUrl, // Prioritize card
                business_permits: [permitCardDocUrl || permitDocUrl].filter(Boolean),
                updated_at: new Date().toISOString(),
            }, { onConflict: "profile_id" });

        return NextResponse.json({
            success: true,
            applicationId: application.id,
            userId: userId,
            message: "Application submitted successfully. You will receive an email once an admin reviews your application."
        });

    } catch (error: any) {
        console.error("Landlord registration error:", error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: error.issues[0]?.message || "Invalid form data", 
                details: error.issues 
            }, { status: 400 });
        }

        if (error instanceof SyntaxError) {
            return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
        }

        return NextResponse.json({ 
            error: "Failed to submit application" 
        }, { status: 500 });
    }
}
