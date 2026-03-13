import { createClient } from '@/lib/supabase/server'
import type { Property, Lease, Unit, MaintenanceRequest } from '@/types/database'

/**
 * Retrieves relevant context for the iRis AI assistant based on the tenant's information
 */
export async function getTenantContext(tenantId: string) {
    const supabase = await createClient()

    // Get tenant profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', tenantId)
        .single()

    // Get active lease with unit and property details
    const { data: leases } = await supabase
        .from('leases')
        .select(`
            *,
            unit:units (
                *,
                property:properties (*)
            )
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)

    const activeLease = leases?.[0] as any
    const unit = activeLease?.unit as Unit & { property: Property }
    const property = unit?.property

    // Get recent maintenance requests
    const { data: maintenanceRequests } = await supabase
        .from('maintenance_requests')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5)

    // Get recent payments
    const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(5)

    return {
        profile,
        lease: activeLease,
        unit,
        property,
        maintenanceRequests: maintenanceRequests || [],
        payments: payments || [],
    }
}

/**
 * Formats the context into a system prompt for the AI
 */
export function formatContextForAI(context: Awaited<ReturnType<typeof getTenantContext>>) {
    const { profile, lease, unit, property, maintenanceRequests, payments } = context

    let contextText = `You are iRis, an AI concierge assistant for ${property?.name || 'the building'}. You help tenants with questions about their lease, building amenities, maintenance requests, and general property information.\n\n`

    // Tenant information
    if (profile) {
        contextText += `TENANT INFORMATION:\n`
        contextText += `- Name: ${profile.full_name}\n`
        contextText += `- Email: ${profile.email}\n`
        if (profile.phone) contextText += `- Phone: ${profile.phone}\n`
        contextText += `\n`
    }

    // Property information
    if (property) {
        contextText += `BUILDING INFORMATION:\n`
        contextText += `- Name: ${property.name}\n`
        contextText += `- Address: ${property.address}, ${property.city}\n`
        contextText += `- Type: ${property.type}\n`
        if (property.description) contextText += `- Description: ${property.description}\n`
        
        if (property.amenities && property.amenities.length > 0) {
            contextText += `- Amenities: ${property.amenities.join(', ')}\n`
        }
        
        if (property.house_rules && property.house_rules.length > 0) {
            contextText += `- House Rules: ${property.house_rules.join('; ')}\n`
        }
        contextText += `\n`
    }

    // Unit information
    if (unit) {
        contextText += `UNIT INFORMATION:\n`
        contextText += `- Unit: ${unit.name}\n`
        contextText += `- Floor: ${unit.floor}\n`
        contextText += `- Bedrooms: ${unit.beds}\n`
        contextText += `- Bathrooms: ${unit.baths}\n`
        if (unit.sqft) contextText += `- Square Feet: ${unit.sqft}\n`
        contextText += `\n`
    }

    // Lease information
    if (lease) {
        contextText += `LEASE INFORMATION:\n`
        contextText += `- Status: ${lease.status}\n`
        contextText += `- Start Date: ${new Date(lease.start_date).toLocaleDateString()}\n`
        contextText += `- End Date: ${new Date(lease.end_date).toLocaleDateString()}\n`
        contextText += `- Monthly Rent: ₱${Number(lease.monthly_rent).toLocaleString()}\n`
        contextText += `- Security Deposit: ₱${Number(lease.security_deposit).toLocaleString()}\n`
        if (lease.terms) {
            contextText += `- Additional Terms: ${JSON.stringify(lease.terms)}\n`
        }
        contextText += `\n`
    }

    // Recent maintenance requests
    if (maintenanceRequests.length > 0) {
        contextText += `RECENT MAINTENANCE REQUESTS:\n`
        maintenanceRequests.forEach((req, idx) => {
            contextText += `${idx + 1}. ${req.title} - Status: ${req.status} (${req.priority} priority)\n`
        })
        contextText += `\n`
    }

    // Payment information
    if (payments.length > 0) {
        const lastPayment = payments[0]
        contextText += `RECENT PAYMENT:\n`
        contextText += `- Amount: ₱${Number(lastPayment.amount).toLocaleString()}\n`
        contextText += `- Status: ${lastPayment.status}\n`
        contextText += `- Date: ${new Date(lastPayment.created_at).toLocaleDateString()}\n`
        contextText += `\n`
    }

    contextText += `INSTRUCTIONS:\n`
    contextText += `- Be friendly, helpful, and professional\n`
    contextText += `- Answer questions about the building, lease, amenities, and services\n`
    contextText += `- If asked about WiFi, provide network details if available in amenities\n`
    contextText += `- For maintenance issues, acknowledge and suggest submitting a maintenance request\n`
    contextText += `- For payment questions, refer to the recent payment information\n`
    contextText += `- If you don't have specific information, politely say so and suggest contacting the landlord\n`
    contextText += `- Keep responses concise and helpful\n`

    return contextText
}

