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
