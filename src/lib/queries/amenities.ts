import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'


type AmenityInsert = Database['public']['Tables']['amenities']['Insert']

export async function getAmenities(landlordId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('amenities')
        .select(`
            *,
            property:properties(name)
        `)
        .eq('landlord_id', landlordId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function getAmenityBookings(landlordId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('amenity_bookings')
        .select(`
            *,
            amenity:amenities(name, type, icon_name, property_id),
            tenant:profiles!tenant_id(full_name, email, avatar_url)
        `)
        .eq('landlord_id', landlordId)
        .order('booking_date', { ascending: false })

    if (error) throw error
    return data
}

export async function updateBookingStatus(bookingId: string, status: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('amenity_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function upsertAmenity(amenity: AmenityInsert) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('amenities')
        .upsert({
            ...amenity,
            updated_at: new Date().toISOString()
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
        .select()
        .single()

    if (error) throw error
    return data
}

export async function deleteAmenity(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('amenities')
        .delete()
        .eq('id', id)

    if (error) throw error
}

