import { createClient } from '@/lib/supabase/server'
import { RenewalStatus } from '@/types/database'

/**
 * Fetch all leases for a tenant.
 */
export async function getTenantLeases(tenantId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('leases')
        .select(`
            *,
            unit:units (
                *,
                property:properties (*)
            ),
            landlord:profiles!leases_landlord_id_fkey (
                id,
                full_name,
                avatar_url,
                email,
                phone
            )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

/**
 * Fetch all leases for a landlord.
 */
export async function getLandlordLeases(landlordId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('leases')
        .select(`
            *,
            unit:units (
                *,
                property:properties (*)
            ),
            tenant:profiles!leases_tenant_id_fkey (
                id,
                full_name,
                avatar_url,
                email,
                phone
            )
        `)
        .eq('landlord_id', landlordId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

/**
 * Fetch a single lease by ID with all related data.
 */
export async function getLeaseById(leaseId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('leases')
        .select(`
            *,
            unit:units (
                *,
                property:properties (*)
            ),
            tenant:profiles!leases_tenant_id_fkey (*),
            landlord:profiles!leases_landlord_id_fkey (*)
        `)
        .eq('id', leaseId)
        .single()

    if (error) throw error
    return data
}

/**
 * Get the active lease for a specific tenant.
 */
export async function getActiveLease(tenantId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('leases')
        .select(`
            *,
            unit:units (
                *,
                property:properties (*)
            ),
            landlord:profiles!leases_landlord_id_fkey (
                id,
                full_name,
                avatar_url,
                email,
                phone
            )
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')
        .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows
    return data
}

/**
 * Fetch renewal requests for a tenant.
 */
export async function getTenantRenewalRequests(tenantId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('renewal_requests')
        .select(`
            *,
            current_lease:leases!renewal_requests_current_lease_id_fkey (
                id, start_date, end_date, monthly_rent
            ),
            new_lease:leases!renewal_requests_new_lease_id_fkey (*)
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

/**
 * Fetch renewal requests for a landlord.
 */
export async function getLandlordRenewalRequests(landlordId: string, status?: RenewalStatus) {
    const supabase = await createClient()

    let query = supabase
        .from('renewal_requests')
        .select(`
            *,
            current_lease:leases!renewal_requests_current_lease_id_fkey (
                *,
                unit:units!inner (*),
                tenant:profiles!leases_tenant_id_fkey (*)
            )
        `)
        .eq('landlord_id', landlordId)

    if (status) {
        query = query.eq('status', status)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data
}

/**
 * Get a single renewal request by ID.
 */
export async function getRenewalRequestById(requestId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('renewal_requests')
        .select(`
            *,
            current_lease:leases!renewal_requests_current_lease_id_fkey (*),
            new_lease:leases!renewal_requests_new_lease_id_fkey (*)
        `)
        .eq('id', requestId)
        .single()

    if (error) throw error
    return data
}
