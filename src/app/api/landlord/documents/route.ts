import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get("tenantId");
    
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

    // Get all applications for this user (or tenant) to aggregate documents
    let applicationsQuery = supabase
        .from(tenantId ? "applications" : "landlord_applications")
        .select("*");
    
    if (tenantId) {
        applicationsQuery = applicationsQuery.eq("tenant_id", tenantId).eq("landlord_id", user.id);
    } else {
        applicationsQuery = applicationsQuery.eq("profile_id", user.id);
    }

    // Fetch properties to get contract templates
    let propertiesQuery = supabase
        .from("properties")
        .select("id, name, contract_template, base_rent_amount, updated_at")
        .eq("landlord_id", user.id);
    
    // Fetch active/signed leases with signed document URLs
    let leasesQuery = supabase
        .from("leases")
        .select(`
            id,
            status,
            signed_at,
            created_at,
            signed_document_url,
            signed_document_path,
            tenant_id,
            unit:units(id, name, property_id, property:properties(id, name)),
            tenant:profiles!tenant_id(full_name)
        `)
        .eq("landlord_id", user.id);

    if (tenantId) {
        leasesQuery = leasesQuery.eq("tenant_id", tenantId);
    }

    // Parallelize: applications, properties, and leases fetches are independent
    const [applicationsResult, propertiesResult, leasesResult] = await Promise.all([
        applicationsQuery.order("created_at", { ascending: false }),
        propertiesQuery,
        leasesQuery.order("signed_at", { ascending: false }),
    ]);

    const { data: applications, error: appError } = applicationsResult;
    const { data: properties } = propertiesResult;
    const { data: leases } = leasesResult;

    if (appError) {
        console.error("[Documents API] Error fetching applications:", appError);
        return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
    }

    // Combine applications data
    const latestApp = (applications && applications.length > 0) ? applications[0] : null;
    const fallbackDate = latestApp?.created_at || profile.created_at;

    // Aggregate documents from all applications (pick newest non-null)
    const getDocument = (field: string) => {
        if (!applications) return null;
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
            updatedAt: fallbackDate
        },
        {
            id: "permit",
            name: "Business Permit (Paper)",
            description: "Official business permit document",
            url: permitDoc,
            category: "Business",
            updatedAt: fallbackDate
        },
        {
            id: "permit-card",
            name: "Business Permit (Card)",
            description: "Business permit ID card",
            url: permitCardDoc,
            category: "Business",
            updatedAt: fallbackDate
        },
        {
            id: "ownership",
            name: "Proof of Ownership",
            description: "Property title or deed of sale",
            url: ownershipDoc,
            category: "Property",
            updatedAt: fallbackDate
        },
        {
            id: "liveness",
            name: "Liveness Proof",
            description: "Biometric verification snapshot",
            url: livenessDoc,
            category: "Identity",
            updatedAt: fallbackDate
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
            propertyId: p.id,
            templateData: {
                ...(p.contract_template as any || {}),
                base_rent_amount: p.base_rent_amount
            }
        })),
        // Include all leases with any status
        ...(leases || [])
            .map(l => {
                const isComplete = l.status === "active" && l.signed_document_url;
                const unitName = (l.unit as any)?.name;
                const propertyName = (l.unit as any)?.property?.name;
                const tenantName = (l.tenant as any)?.full_name;
                
                let displayName = "Lease Agreement";
                if (tenantName) {
                    displayName = `Lease - ${tenantName}`;
                } else if (propertyName && unitName) {
                    displayName = `Lease - ${propertyName} (${unitName})`;
                } else {
                    displayName = `Lease - ${l.id.slice(0, 8)}`;
                }

                return {
                    id: `lease-${l.id}`,
                    name: displayName,
                    description: isComplete 
                        ? `Fully executed lease agreement • Signed ${l.signed_at ? new Date(l.signed_at).toLocaleDateString() : 'N/A'}`
                        : `Status: ${l.status || 'N/A'}`,
                    url: l.signed_document_url || null,
                    category: "Lease",
                    updatedAt: l.signed_at || l.created_at,
                    tenantId: l.tenant_id,
                    propertyId: (l.unit as any)?.property_id,
                    status: l.status,
                    isComplete
                };
            })
    ].filter(doc => {
        // Include leases even without URLs (may be pending signature)
        if (doc.category === "Lease") return true;
        
        // Only include other docs if URL exists
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
            phone: latestApp?.phone || profile.phone
        },
        verification: latestApp ? {
            status: latestApp.status,
            verificationStatus: latestApp.verification_status,
            verifiedAt: latestApp.updated_at
        } : {
            status: "approved", // Fallback for legacy landlords
            verificationStatus: "verified",
            verifiedAt: profile.created_at
        }
    });
}
