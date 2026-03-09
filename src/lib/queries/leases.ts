import { createClient } from '@/lib/supabase/server'

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
