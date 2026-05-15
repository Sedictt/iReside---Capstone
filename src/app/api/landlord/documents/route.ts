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


    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }


    let applicationsQuery = supabase
        .from(tenantId ? "applications" : "landlord_applications")
        .select("*");
    
    if (tenantId) {
        applicationsQuery = (applicationsQuery as any).eq("applicant_id", tenantId).eq("landlord_id", user.id);
    } else {
        applicationsQuery = (applicationsQuery as any).eq("profile_id", user.id);
    }


    let propertiesQuery = supabase
        .from("properties")
        .select("id, name, contract_template, base_rent_amount, updated_at")
        .eq("landlord_id", user.id);
    

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


    const latestApp = (applications && applications.length > 0) ? applications[0] : null;
    const fallbackDate = latestApp?.created_at || profile.created_at;

    const getDocument = (field: string) => {
        if (!applications) return null;
        for (const application of applications) {
            if ((application as any)[field]) return (application as any)[field];
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

        ...(properties || []).map(property => ({
            id: `template-${property.id}`,
            name: `Contract Template - ${property.name}`,
            description: "Standard lease agreement for this property",
            url: "#",
            category: "Lease",
            updatedAt: property.updated_at,
            isTemplate: true,
            propertyId: property.id,
            templateData: {
                ...(property.contract_template as any || {}),
                base_rent_amount: property.base_rent_amount
            }
        })),

        ...(leases || [])
            .map(lease => {
                const isComplete = lease.status === "active" && lease.signed_document_url;
                const unitName = (lease.unit as any)?.name;
                const propertyName = (lease.unit as any)?.property?.name;
                const tenantName = (lease.tenant as any)?.full_name;
                
                let displayName = "Lease Agreement";
                if (tenantName) {
                    displayName = `Lease - ${tenantName}`;
                } else if (propertyName && unitName) {
                    displayName = `Lease - ${propertyName} (${unitName})`;
                } else {
                    displayName = `Lease - ${lease.id.slice(0, 8)}`;
                }

                return {
                    id: `lease-${lease.id}`,
                    name: displayName,
                    description: isComplete 
                        ? `Fully executed lease agreement • Signed ${lease.signed_at ? new Date(lease.signed_at).toLocaleDateString() : 'N/A'}`
                        : `Status: ${lease.status || 'N/A'}`,
                    url: lease.signed_document_url || null,
                    category: "Lease",
                    updatedAt: lease.signed_at || lease.created_at,
                    tenantId: lease.tenant_id,
                    propertyId: (lease.unit as any)?.property_id,
                    status: lease.status,
                    isComplete
                };
            })
    ].filter(doc => {

        if (doc.category === "Lease") return true;
        

        if (!doc.url) return false;
        

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
            phone: (latestApp as any)?.phone || (latestApp as any)?.applicant_phone || profile.phone
        },
        verification: latestApp ? {
            status: latestApp.status,
            verificationStatus: (latestApp as any).verification_status || latestApp.status,
            verifiedAt: latestApp.updated_at
        } : {
            status: "approved", // Fallback for legacy landlords
            verificationStatus: "verified",
            verifiedAt: profile.created_at
        }
    });
}
