import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

interface RouteParams {
    params: Promise<{ token: string }>;
}

const onboardingSchema = z.object({
    password: z.string()
        .min(8, "Password must be at least 8 characters")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
        .regex(/[0-9]/, "Password must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character"),
    fullName: z.string().min(2, "Full name is required"),
    phone: z.string().min(10, "Valid phone number is required"),
    propertyConfig: z.object({
        propertyPhoto: z.string().optional(),
        totalUnits: z.number().default(1),
        totalFloors: z.number().default(1),
        headLimit: z.union([z.number(), z.literal("none")]).default(4),
        utilityBilling: z.enum(["included_in_rent", "separate_metered", "mixed"]).default("included_in_rent"),
        baseRent: z.number().default(0),
        amenities: z.array(z.string()).default([]),
        contractMode: z.enum(["upload", "generate"]).default("generate"),
    }).optional(),
});

export async function GET(request: Request, context: RouteParams) {
    const { token } = await context.params;
    
    if (!token) {
        return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Find application by token
    const { data: application, error } = await adminClient
        .from("landlord_applications")
        .select("*")
        .eq("onboarding_token", token)
        .maybeSingle();

    if (error) {
        console.error("[Onboarding] Error fetching application:", error);
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!application) {
        return NextResponse.json({ error: "Invalid or expired onboarding link" }, { status: 401 });
    }

    // Check if already completed
    if (application.onboarding_completed_at) {
        return NextResponse.json({ 
            error: "Onboarding already completed",
            alreadyCompleted: true 
        }, { status: 400 });
    }

    // Check if token expired
    if (application.onboarding_token_expires_at) {
        const expiresAt = new Date(application.onboarding_token_expires_at);
        if (expiresAt < new Date()) {
            return NextResponse.json({ 
                error: "Onboarding link has expired",
                expired: true 
            }, { status: 401 });
        }
    }

    // Fallback: If email or full name is missing from application, try to get from profile
    let email = application.email;
    let fullName = application.full_name;

    if ((!email || !fullName) && application.profile_id) {
        const { data: profile } = await adminClient
            .from("profiles")
            .select("email, full_name")
            .eq("id", application.profile_id)
            .maybeSingle();
        
        if (profile) {
            email = email || profile.email;
            fullName = fullName || profile.full_name;
        }
    }

    // Return application data for onboarding
    return NextResponse.json({
        email,
        fullName,
        phone: application.phone,
        propertyName: application.business_name,
        propertyAddress: application.business_address,
    });
}

export async function POST(request: Request, context: RouteParams) {
    const { token } = await context.params;
    
    if (!token) {
        return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    try {
        const body = await request.json();
        const parsed = onboardingSchema.parse(body);

        const adminClient = createAdminClient();

        // Find application by token
        const { data: application, error: appError } = await adminClient
            .from("landlord_applications")
            .select("*")
            .eq("onboarding_token", token)
            .maybeSingle();

        if (appError || !application) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        // Check validations
        if (application.onboarding_completed_at) {
            return NextResponse.json({ error: "Onboarding already completed" }, { status: 400 });
        }

        if (application.onboarding_token_expires_at) {
            const expiresAt = new Date(application.onboarding_token_expires_at);
            if (expiresAt < new Date()) {
                return NextResponse.json({ error: "Onboarding link has expired" }, { status: 400 });
            }
        }

        // Fallback: If email or full name is missing from application, try to get from profile
        let email = application.email;
        let fullName = application.full_name;

        if ((!email || !fullName) && application.profile_id) {
            const { data: profile } = await adminClient
                .from("profiles")
                .select("email, full_name")
                .eq("id", application.profile_id)
                .maybeSingle();
            
            if (profile) {
                email = email || profile.email;
                fullName = fullName || profile.full_name;
            }
        }

        if (!email) {
            console.error("[Onboarding] No email found for application:", application.id);
            return NextResponse.json({ error: "No email address associated with this application" }, { status: 400 });
        }

        // Check if user already exists in Auth
        const { data: { users: existingUsers } } = await adminClient.auth.admin.listUsers();
        const existingUser = existingUsers.find(u => u.email === email);
        
        let userId: string;

        if (existingUser) {
            // Update existing user
            const { data: updatedAuth, error: updateAuthError } = await adminClient.auth.admin.updateUserById(
                existingUser.id,
                {
                    password: parsed.password,
                    email_confirm: true,
                    user_metadata: {
                        full_name: parsed.fullName || fullName,
                        role: "landlord",
                    },
                }
            );

            // Double check: manually set confirmed if update didn't handle it
            if (!updateAuthError) {
                await adminClient.auth.admin.updateUserById(existingUser.id, {
                    email_confirm: true,
                });
            }

            if (updateAuthError) {
                console.error("[Onboarding] Failed to update existing auth user:", updateAuthError);
                return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
            }
            
            userId = existingUser.id;
        } else {
            // Create new auth user
            const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
                email,
                password: parsed.password,
                email_confirm: true,
                user_metadata: {
                    full_name: parsed.fullName || fullName,
                    role: "landlord",
                },
            });

            if (authError) {
                console.error("[Onboarding] Failed to create auth user:", authError);
                return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
            }

            if (!authData.user) {
                return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
            }

            userId = authData.user.id;
        }

        // Upsert profile (use upsert to handle cases where profile might already exist)
        const { error: profileError } = await adminClient
            .from("profiles")
            .upsert({
                id: userId,
                full_name: parsed.fullName || fullName!,
                phone: parsed.phone,
                email: email!,
                role: "landlord",
                updated_at: new Date().toISOString(),
            }, { onConflict: "id" });

        if (profileError) {
            console.error("[Onboarding] Failed to create profile:", profileError);
            // Continue anyway - profile might get created by trigger
        }

        // Handle property photo upload if provided
        let coverUrl = null;
        if (parsed.propertyConfig?.propertyPhoto) {
            try {
                const base64Data = parsed.propertyConfig.propertyPhoto.split(',')[1];
                const buffer = Buffer.from(base64Data, 'base64');
                const fileName = `property-photos/${userId}-${Date.now()}.png`;
                
                const { data: uploadData, error: uploadError } = await adminClient
                    .storage
                    .from('landlord-documents')
                    .upload(fileName, buffer, {
                        contentType: 'image/png',
                        upsert: true
                    });

                if (uploadError) throw uploadError;
                
                const { data: { publicUrl } } = adminClient
                    .storage
                    .from('landlord-documents')
                    .getPublicUrl(fileName);
                    
                coverUrl = publicUrl;
            } catch (err) {
                console.error("[Onboarding] Failed to upload property photo:", err);
            }
        }

        // Create/Update property from application data
        const { data: property, error: propertyError } = await adminClient
            .from("properties")
            .upsert({
                landlord_id: userId,
                name: application.business_name!,
                address: application.business_address!,
                total_units: parsed.propertyConfig?.totalUnits ?? 1,
                total_floors: parsed.propertyConfig?.totalFloors ?? 1,
                base_rent_amount: parsed.propertyConfig?.baseRent ?? 0,
                amenities: parsed.propertyConfig?.amenities ?? [],
                cover_url: coverUrl,
                updated_at: new Date().toISOString(),
            }, { onConflict: "landlord_id" })
            .select()
            .single();

        if (propertyError) {
            console.error("[Onboarding] Failed to create property:", propertyError);
        }

        // Apply environment policies
        if (property) {
            await adminClient
                .from("property_environment_policies")
                .upsert({
                    property_id: property.id,
                    environment_mode: property.type || "residential",
                    max_occupants_per_unit: parsed.propertyConfig?.headLimit === "none" ? null : (parsed.propertyConfig?.headLimit ?? 4),
                    utility_policy_mode: parsed.propertyConfig?.utilityBilling ?? "included_in_rent",
                    payment_profile_defaults: {
                        dueDay: 5,
                        allowPartialPayments: false,
                        lateFeeAmount: 0,
                        lateFeeDays: 0,
                    },
                    updated_at: new Date().toISOString(),
                }, { onConflict: "property_id" });

            // 1. Sync Units
            const totalUnits = parsed.propertyConfig?.totalUnits ?? 1;
            const totalFloors = parsed.propertyConfig?.totalFloors ?? 1;
            
            const { data: existingUnits } = await adminClient
                .from("units")
                .select("id")
                .eq("property_id", property.id);
                
            const unitCount = existingUnits?.length ?? 0;
            
            if (totalUnits > unitCount) {
                const unitsToCreate = Array.from({ length: totalUnits - unitCount }, (_, index) => {
                    const unitIndex = unitCount + index + 1;
                    const floorNumber = totalFloors === 1 ? 1 : ((unitIndex - 1) % totalFloors) + 1;
                    return {
                        property_id: property.id,
                        name: `Unit ${unitIndex}`,
                        floor: floorNumber,
                        status: "vacant",
                        rent_amount: parsed.propertyConfig?.baseRent ?? 0,
                        beds: 1,
                        baths: 1,
                    };
                });
                await adminClient.from("units").insert(unitsToCreate);
            }

            // 2. Sync Floor Configs
            const floorConfigs = [];
            floorConfigs.push({ property_id: property.id, floor_number: 0, floor_key: "ground", sort_order: 0 });
            for (let i = 1; i <= totalFloors; i++) {
                floorConfigs.push({ property_id: property.id, floor_number: i, floor_key: `floor${i}`, sort_order: i });
            }
            await adminClient.from("property_floor_configs").upsert(floorConfigs, { onConflict: "property_id,floor_key" });

            // 3. Generate Default Contract Template if requested
            if (parsed.propertyConfig?.contractMode === "generate") {
                const defaultTemplate = {
                    answers: {
                        rent_due_day: 5,
                        security_deposit: 1,
                        advance_rent: 1,
                        late_fee_policy: "Standard 5% after 3 days"
                    },
                    customClauses: [
                        { id: 1, title: "Maintenance", description: "Tenant is responsible for minor repairs under 500 PHP." },
                        { id: 2, title: "Quiet Hours", description: "Property observes quiet hours from 10 PM to 6 AM." }
                    ]
                };
                await adminClient.from("properties").update({ contract_template: defaultTemplate }).eq("id", property.id);
            }
        }

        // Mark onboarding as complete
        await adminClient
            .from("landlord_applications")
            .update({
                profile_id: userId,
                onboarding_completed_at: new Date().toISOString(),
                onboarding_token: null, // Invalidate token
                onboarding_token_expires_at: null,
                status: "approved",
                updated_at: new Date().toISOString(),
            })
            .eq("onboarding_token", token);

        return NextResponse.json({
            success: true,
            message: "Onboarding completed successfully",
            redirectUrl: "/landlord/dashboard",
        });

    } catch (error: any) {
        console.error("[Onboarding] Error:", error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({ 
                error: "Invalid form data", 
                details: error.issues 
            }, { status: 400 });
        }

        return NextResponse.json({ 
            error: error.message || "Failed to complete onboarding" 
        }, { status: 500 });
    }
}