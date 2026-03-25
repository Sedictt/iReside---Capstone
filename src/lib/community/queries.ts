import { createClient } from '@/lib/supabase/server'

export async function getTenantPropertyId(userId: string): Promise<string | null> {
    const supabase = await createClient()

    const { data: lease, error } = await supabase
        .from('leases')
        .select('unit_id')
        .eq('tenant_id', userId)
        .eq('status', 'active')
        .single()

    if (error || !lease) {
        return null
    }

    const { data: unit } = await supabase
        .from('units')
        .select('property_id')
        .eq('id', lease.unit_id)
        .single()

    return unit?.property_id || null
}

export async function getLandlordPropertyId(userId: string): Promise<string | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('properties')
        .select('id')
        .eq('landlord_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (error || !data) {
        return null
    }

    return data.id || null
}

export async function getCommunityPropertyId(userId: string, role: 'tenant' | 'landlord' | 'admin'): Promise<string | null> {
    if (role === 'landlord') {
        return getLandlordPropertyId(userId)
    }

    if (role === 'admin') {
        return null
    }

    return getTenantPropertyId(userId)
}
