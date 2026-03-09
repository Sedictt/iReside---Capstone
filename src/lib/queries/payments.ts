import { createClient } from '@/lib/supabase/server'

/**
 * Fetch all payments for a tenant.
 */
export async function getTenantPayments(tenantId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('payments')
        .select(`
            *,
            items:payment_items (*),
            lease:leases (
                id,
                unit:units (
                    id,
                    name,
                    property:properties (id, name)
                )
            )
        `)
        .eq('tenant_id', tenantId)
        .order('due_date', { ascending: false })

    if (error) throw error
    return data
}

/**
 * Fetch all payments for a landlord.
 */
export async function getLandlordPayments(landlordId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('payments')
        .select(`
            *,
            items:payment_items (*),
            tenant:profiles!payments_tenant_id_fkey (
                id,
                full_name,
                avatar_url,
                email
            ),
            lease:leases (
                id,
                unit:units (
                    id,
                    name,
                    property:properties (id, name)
                )
            )
        `)
        .eq('landlord_id', landlordId)
        .order('due_date', { ascending: false })

    if (error) throw error
    return data
}

/**
 * Get pending payment for a tenant (next due).
 */
export async function getPendingPayment(tenantId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('payments')
        .select(`
            *,
            items:payment_items (*),
            lease:leases (
                id,
                unit:units (
                    id,
                    name,
                    property:properties (id, name)
                )
            )
        `)
        .eq('tenant_id', tenantId)
        .eq('status', 'pending')
        .order('due_date', { ascending: true })
        .limit(1)
        .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
}

/**
 * Fetch a single payment by ID with full details.
 */
export async function getPaymentById(paymentId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('payments')
        .select(`
            *,
            items:payment_items (*),
            tenant:profiles!payments_tenant_id_fkey (*),
            landlord:profiles!payments_landlord_id_fkey (*),
            lease:leases (
                *,
                unit:units (
                    *,
                    property:properties (*)
                )
            )
        `)
        .eq('id', paymentId)
        .single()

    if (error) throw error
    return data
}

/**
 * Get payment statistics for a landlord dashboard.
 */
export async function getPaymentStats(landlordId: string) {
    const supabase = await createClient()

    const { data: payments, error } = await supabase
        .from('payments')
        .select('amount, status, due_date, paid_at')
        .eq('landlord_id', landlordId)

    if (error) throw error

    const now = new Date()
    const thisMonth = now.toISOString().slice(0, 7) // YYYY-MM

    const stats = {
        totalCollected: 0,
        totalPending: 0,
        thisMonthCollected: 0,
        overdueCount: 0,
    }

    payments?.forEach((p: { amount: number; status: string; due_date: string; paid_at: string | null }) => {
        if (p.status === 'completed') {
            stats.totalCollected += Number(p.amount)
            if (p.paid_at?.startsWith(thisMonth)) {
                stats.thisMonthCollected += Number(p.amount)
            }
        } else if (p.status === 'pending') {
            stats.totalPending += Number(p.amount)
            if (new Date(p.due_date) < now) {
                stats.overdueCount++
            }
        }
    })

    return stats
}
