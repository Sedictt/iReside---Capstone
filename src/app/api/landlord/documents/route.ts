import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get all applications for this user to aggregate documents
    const { data: applications, error: appError } = await supabase
        .from("landlord_applications")
        .select("*")
        .eq("profile_id", user.id)
        .order("created_at", { ascending: false });

    if (appError) {
        console.error("[Documents API] Error fetching applications:", appError);
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }

    if (!applications || applications.length === 0) {
        return NextResponse.json({ error: "No documents found for this account" }, { status: 404 });
    }

    // Use the latest application for status info
    const latestApp = applications[0];

    // Fetch properties to get contract templates
    const { data: properties } = await supabase
        .from("properties")
        .select("id, name, contract_template, base_rent_amount, updated_at")
        .eq("landlord_id", user.id);

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

    // Aggregate documents from all applications (pick newest non-null)
    const getDocument = (field: string) => {
        for (const app of applications) {
            if ((app as any)[field]) return (app as any)[field];
        }
        return null;
    };

    const identityDoc = getDocument("identity_document_url");
    const permitDoc = getDocument("business_permit_url") || (profile as any)?.business_permit_url;
    const permitCardDoc = getDocument("business_permit_card_url");
    const ownershipDoc = getDocument("ownership_document_url");
    const livenessDoc = getDocument("liveness_document_url");

    const documents = [
        {
            id: "identity",
            name: "Government ID",
            description: "Primary identity verification document",
            url: identityDoc,
            category: "Identity",
            updatedAt: latestApp.created_at
        },
        {
            id: "permit",
            name: "Business Permit (Paper)",
            description: "Official business permit document",
            url: permitDoc,
            category: "Business",
            updatedAt: latestApp.created_at
        },
        {
            id: "permit-card",
            name: "Business Permit (Card)",
            description: "Business permit ID card",
            url: permitCardDoc,
            category: "Business",
            updatedAt: latestApp.created_at
        },
        {
            id: "ownership",
            name: "Proof of Ownership",
            description: "Property title or deed of sale",
            url: ownershipDoc,
            category: "Property",
            updatedAt: latestApp.created_at
        },
        {
            id: "liveness",
            name: "Liveness Proof",
            description: "Biometric verification snapshot",
            url: livenessDoc,
            category: "Identity",
            updatedAt: latestApp.created_at
        },
        // Include property contract templates
        ...(properties || []).map(p => ({
            id: `template-${p.id}`,
            name: `Contract Template - ${p.name}`,
            description: "Standard lease agreement for this property",
            url: "#",
            category: "Lease",
            updatedAt: p.updated_at,
            isTemplate: true,
            templateData: {
                ...(p.contract_template as any || {}),
                base_rent_amount: p.base_rent_amount
            }
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
    ].filter(doc => {
        // Only include if URL exists and is not a duplicate for permit
        if (!doc.url) return false;
        
        // Skip redundant permit card if same as paper permit
        if (doc.id === "permit-card" && doc.url === permitDoc) {
            return false;
        }
        return true;
    });

    return NextResponse.json({
        documents,
        profile: {
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
            avatar_bg_color: (profile as any).avatar_bg_color,
            phone: latestApp.phone || profile.phone
        },
        verification: {
            status: latestApp.status,
            verificationStatus: latestApp.verification_status,
            verifiedAt: latestApp.updated_at
        }
    });
}
