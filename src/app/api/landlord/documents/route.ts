import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch profile and application
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

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

    // Fetch properties to get contract templates
    const { data: rawProperties } = await supabase
        .from("properties")
        .select("id, name, contract_template, base_rent_amount, created_at")
        .eq("landlord_id", user.id);
    
    const properties = rawProperties as any[];

    // Fetch active/signed leases
    const { data: leases } = await supabase
        .from("leases")
        .select(`
            id,
            status,
            signed_at,
            created_at,
            unit:units(name, property:properties(name))
        `)
        .eq("landlord_id", user.id);

    const registrationDocs = [
        {
            id: "identity",
            name: "Government ID",
            description: "Primary identity verification document",
            url: application.identity_document_url,
            category: "Identity",
            updatedAt: application.created_at
        },
        {
            id: "permit",
            name: "Business Permit (Paper)",
            description: "Official business permit document",
            url: application.business_permit_url,
            category: "Business",
            updatedAt: application.created_at
        },
        {
            id: "permit-card",
            name: "Business Permit (Card)",
            description: "Official business permit ID card",
            url: application.business_permit_card_url,
            category: "Business",
            updatedAt: application.created_at
        },
        {
            id: "ownership",
            name: "Proof of Ownership",
            description: "Property title or deed document",
            url: application.ownership_document_url,
            category: "Property",
            updatedAt: application.created_at
        },
        {
            id: "liveness",
            name: "Liveness Proof",
            description: "Verification selfie or video",
            url: (application as any).liveness_document_url,
            category: "Identity",
            updatedAt: application.created_at
        }
    ].filter(doc => doc.url !== null);

    const contractDocs = [
        ...(properties || []).map(p => ({
            id: `template-${p.id}`,
            name: `Contract Template - ${p.name}`,
            description: "Standard lease agreement for this property",
            url: "#", 
            isTemplate: true,
            templateData: {
                ...p.contract_template as any,
                base_rent_amount: p.base_rent_amount
            },
            category: "Lease",
            updatedAt: p.created_at
        })),
        ...(leases || []).map(l => ({
            id: `lease-${l.id}`,
            name: `Lease Agreement - ${(l.unit as any)?.property?.name} (${(l.unit as any)?.name})`,
            description: `Status: ${l.status.toUpperCase()}`,
            url: "#", 
            isLease: true,
            category: "Lease",
            updatedAt: l.signed_at || l.created_at
        }))
    ];

    return NextResponse.json({
        documents: [...registrationDocs, ...contractDocs],
        profile,
        verification: {
            status: application.status,
            verificationStatus: application.verification_status,
            verifiedAt: application.updated_at
        }
    });
}
