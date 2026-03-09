import { createClient } from '@/lib/supabase/server'
import type { Property } from '@/types/database'

/**
 * Fetch all properties with optional filters.
 */
export async function getProperties(filters?: {
    city?: string
    type?: string
    minPrice?: number
    maxPrice?: number
    amenities?: string[]
    featured?: boolean
}) {
    const supabase = await createClient()

    let query = supabase
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
        .order('created_at', { ascending: false })

    if (filters?.city) {
        query = query.eq('city', filters.city)
    }
    if (filters?.type) {
        query = query.eq('type', filters.type)
    }
    if (filters?.featured) {
        query = query.eq('is_featured', true)
    }
    if (filters?.amenities && filters.amenities.length > 0) {
        query = query.contains('amenities', filters.amenities)
    }

    const { data, error } = await query

    if (error) throw error

    // Apply price filter on units
    if (filters?.minPrice || filters?.maxPrice) {
        return data?.filter((property: any) =>
            property.units?.some((unit: any) =>
                (!filters.minPrice || unit.rent_amount >= filters.minPrice) &&
                (!filters.maxPrice || unit.rent_amount <= filters.maxPrice)
            )
        )
    }

    return data
}

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

/**
 * Get saved/bookmarked properties for a user.
 */
export async function getSavedProperties(userId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('saved_properties')
        .select(`
            *,
            property:properties (
                *,
                units (*)
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}
