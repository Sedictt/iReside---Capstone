import { createClient } from '@/lib/supabase/server'
import type { Property, PropertyType } from '@/types/database'

/**
 * Fetch a single property by ID with all its units.
 */
export async function getPropertyById(id: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('properties')
        .select(`
            *,
            units (*),
            profiles!properties_landlord_id_fkey (
                id,
                full_name,
                avatar_url,
                phone,
                email
            )
        `)
        .eq('id', id)
        .single()

    if (error) throw error
    return data
}

/**
 * Fetch all properties owned by a specific landlord.
 */
export async function getLandlordProperties(landlordId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('properties')
        .select(`
            *,
            units (
                id,
                name,
                floor,
                status,
                rent_amount,
                sqft,
                beds,
                baths
            )
        `)
        .eq('landlord_id', landlordId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

