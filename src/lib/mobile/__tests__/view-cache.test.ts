import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
    fetchJsonDeduped,
    hasViewCache,
    invalidateViewCache,
    patchViewCache,
    readViewCache,
    setViewCacheOwner,
    writeViewCache,
} from '../view-cache'

describe('mobile view-cache', () => {
    beforeEach(() => {
        setViewCacheOwner(null)
        invalidateViewCache()
        vi.restoreAllMocks()
    })

    it('is inert until an owner is set and clears all entries when the owner changes', () => {
        writeViewCache('tenant-dashboard', { ok: true })
        expect(hasViewCache('tenant-dashboard')).toBe(false)
        expect(readViewCache('tenant-dashboard')).toBeUndefined()

        setViewCacheOwner('user-a')
        writeViewCache('tenant-dashboard', { user: 'a' })
        expect(hasViewCache('tenant-dashboard')).toBe(true)
        expect(readViewCache('tenant-dashboard')).toEqual({ user: 'a' })

        // Same owner is a no-op
        setViewCacheOwner('user-a')
        expect(readViewCache('tenant-dashboard')).toEqual({ user: 'a' })

        // Switching accounts wipes previous user's snapshots
        setViewCacheOwner('user-b')
        expect(hasViewCache('tenant-dashboard')).toBe(false)
        expect(readViewCache('tenant-dashboard')).toBeUndefined()
    })

    it('merges partial patches and invalidates by prefix', () => {
        setViewCacheOwner('user-1')
        writeViewCache('landlord-leases:all', { leases: [1], renewals: [2] })
        patchViewCache<{ leases: number[]; renewals: number[] }>('landlord-leases:all', { renewals: [3] })
        expect(readViewCache('landlord-leases:all')).toEqual({ leases: [1], renewals: [3] })

        writeViewCache('landlord-leases:prop-1', { leases: [], renewals: [] })
        writeViewCache('landlord-tickets:all', [])
        invalidateViewCache('landlord-leases:')

        expect(hasViewCache('landlord-leases:all')).toBe(false)
        expect(hasViewCache('landlord-leases:prop-1')).toBe(false)
        expect(hasViewCache('landlord-tickets:all')).toBe(true)
    })

    it('dedupes concurrent in-flight GETs but fetches fresh after settlement', async () => {
        let resolveFetch!: (value: Response) => void
        const fetchMock = vi.fn().mockImplementation(
            () =>
                new Promise<Response>((resolve) => {
                    resolveFetch = resolve
                })
        )
        vi.stubGlobal('fetch', fetchMock)

        const p1 = fetchJsonDeduped<{ count: number }>('/api/tenant/dashboard')
        const p2 = fetchJsonDeduped<{ count: number }>('/api/tenant/dashboard')
        expect(fetchMock).toHaveBeenCalledTimes(1)

        resolveFetch(
            new Response(JSON.stringify({ count: 1 }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        )
        await expect(Promise.all([p1, p2])).resolves.toEqual([{ count: 1 }, { count: 1 }])

        // Next call after settlement hits the network again
        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ count: 2 }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        )
        await expect(fetchJsonDeduped<{ count: number }>('/api/tenant/dashboard')).resolves.toEqual({ count: 2 })
        expect(fetchMock).toHaveBeenCalledTimes(2)
    })

    it('rejects with the Response on non-OK status and clears in-flight entry', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(new Response('Forbidden', { status: 403 }))
        vi.stubGlobal('fetch', fetchMock)

        await expect(fetchJsonDeduped('/api/landlord/invoices')).rejects.toBeInstanceOf(Response)

        fetchMock.mockResolvedValueOnce(
            new Response(JSON.stringify({ invoices: [] }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        )
        await expect(fetchJsonDeduped('/api/landlord/invoices')).resolves.toEqual({ invoices: [] })
    })
})
