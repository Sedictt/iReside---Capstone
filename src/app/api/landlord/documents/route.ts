import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch the landlord application associated with this profile
    const { data: rawApplication, error } = await supabase
        .from("landlord_applications")
        .select("*")
        .eq("profile_id", user.id)
        .maybeSingle();

    const application = rawApplication as any;

    if (error) {
        console.error("[Documents API] Error fetching application:", error);
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }

    if (!application) {
        return NextResponse.json({ error: "No documents found for this account" }, { status: 404 });
    }

    return NextResponse.json({
        documents: [
            {
                id: "identity",
                name: "Government ID",
                description: "Primary identity verification document",
                url: application.identity_document_url,
                type: "Identity",
                updatedAt: application.created_at
            },
            {
                id: "permit",
                name: "Business Permit (Paper)",
                description: "Official business permit document",
                url: application.business_permit_url,
                type: "Business",
                updatedAt: application.created_at
            },
            {
                id: "permit-card",
                name: "Business Permit (Card)",
                description: "Official business permit ID card",
                url: application.business_permit_card_url,
                type: "Business",
                updatedAt: application.created_at
            },
            {
                id: "ownership",
                name: "Proof of Ownership",
                description: "Property title or deed document",
                url: application.ownership_document_url,
                type: "Property",
                updatedAt: application.created_at
            },
            {
                id: "liveness",
                name: "Liveness Proof",
                description: "Verification selfie or video",
                url: (application as any).liveness_document_url,
                type: "Identity",
                updatedAt: application.created_at
            }
        ].filter(doc => doc.url !== null),
        verification: {
            status: application.status,
            verificationStatus: application.verification_status,
            verifiedAt: application.updated_at
        }
    });
}
