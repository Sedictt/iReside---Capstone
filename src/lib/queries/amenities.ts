import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type AmenityInsert = Database['public']['Tables']['amenities']['Insert']

export async function getAmenities(landlordId: string, supabase?: SupabaseClient<Database>) {
    const client = supabase ?? createClient()
    const { data, error } = await client
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

export async function getAmenityBookings(landlordId: string, supabase?: SupabaseClient<Database>) {
    const client = supabase ?? createClient()
    const { data, error } = await client
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

export async function updateBookingStatus(bookingId: string, status: string, supabase?: SupabaseClient<Database>) {
    const client = supabase ?? createClient()
    const { data, error } = await client
        .from('amenity_bookings')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', bookingId)
        .select()

    if (error) throw error
    return data && data.length > 0 ? data[0] : null
}

export async function upsertAmenity(amenity: AmenityInsert, supabase?: SupabaseClient<Database>) {
    const client = supabase ?? createClient()
    const { error } = await client
        .from('amenities')
        .upsert({
            ...amenity,
            updated_at: new Date().toISOString()
        })

    if (error) throw error
    return true
}

export async function deleteAmenity(id: string, supabase?: SupabaseClient<Database>) {
    const client = supabase ?? createClient()
    const { error } = await client
        .from('amenities')
        .delete()
        .eq('id', id)

    if (error) throw error
}

// Tenant-facing queries (used by server-side API routes)
export async function getTenantAmenities(tenantId: string, supabase?: SupabaseClient<Database>) {
    const client = supabase ?? createClient()
    
    // Get tenant's active lease with unit/property info
    const { data: leases, error: leaseError } = await client
        .from('leases')
        .select(`
            unit:units (
                property_id
            )
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'active')

    if (leaseError) throw leaseError
    if (!leases || leases.length === 0) return []

    const propertyIds = leases
        .map(l => (l.unit as unknown as { property_id: string })?.property_id)
        .filter(Boolean)

    if (propertyIds.length === 0) return []

    const { data, error } = await client
        .from('amenities')
        .select('*, property:properties(name)')
        .in('property_id', propertyIds)
        .ilike('status', 'Active')
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function getTenantBookings(tenantId: string, supabase?: SupabaseClient<Database>) {
    const client = supabase ?? createClient()
    const { data, error } = await client
        .from('amenity_bookings')
        .select(`
            *,
            amenity:amenities(id, name, type, icon_name, image_url, price_per_unit, unit_type, capacity)
        `)
        .eq('tenant_id', tenantId)
        .order('booking_date', { ascending: false })

    if (error) throw error
    return data
}

export async function createAmenityBooking(booking: {
    amenity_id: string
    tenant_id: string
    booking_date: string
    start_time: string
    end_time: string
    notes?: string
}, supabase?: SupabaseClient<Database>) {
    const client = supabase ?? createClient()
    
    // Get amenity details
    const { data: amenity, error: amenityError } = await client
        .from('amenities')
        .select('landlord_id, price_per_unit')
        .eq('id', booking.amenity_id)
        .single()

    if (amenityError || !amenity) throw new Error('Amenity not found')

    // Calculate total price
    const startHour = parseInt(booking.start_time.split(':')[0])
    const endHour = parseInt(booking.end_time.split(':')[0])
    const hours = endHour - startHour
    const total_price = (amenity.price_per_unit || 0) * hours

    const { data, error } = await client
        .from('amenity_bookings')
        .insert({
            amenity_id: booking.amenity_id,
            tenant_id: booking.tenant_id,
            landlord_id: amenity.landlord_id,
            booking_date: booking.booking_date,
            start_time: booking.start_time,
            end_time: booking.end_time,
            total_price,
            status: 'pending',
            notes: booking.notes || null,
        })
        .select(`
            *,
            amenity:amenities(id, name, type, icon_name, image_url, price_per_unit, unit_type, capacity)
        `)
        .single()

    if (error) throw error
    return data
}
