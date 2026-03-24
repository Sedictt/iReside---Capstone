import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getTenantPropertyId } from '../queries'

vi.mock('@/lib/supabase/server')

describe('getTenantPropertyId', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns property_id when user has an active lease', async () => {
        const mockSupabase = {
            from: vi.fn().mockImplementation((tableName: string) => {
                const queryBuilder = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn()
                }

                if (tableName === 'leases') {
                    queryBuilder.single.mockResolvedValue({
                        data: { unit_id: 'unit-123' },
                        error: null
                    })
                } else if (tableName === 'units') {
                    queryBuilder.single.mockResolvedValue({
                        data: { property_id: 'prop-456' },
                        error: null
                    })
                }

                return queryBuilder
            })
        }

        const { createClient } = await import('@/lib/supabase/server')
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await getTenantPropertyId('user-123')
        expect(result).toBe('prop-456')
    })

    it('returns null when no active lease exists', async () => {
        const mockSupabase = {
            from: vi.fn().mockImplementation((tableName: string) => {
                const queryBuilder = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn()
                }

                if (tableName === 'leases') {
                    // Simulate no rows found (Supabase returns error when single() finds nothing)
                    queryBuilder.single.mockResolvedValue({
                        data: null,
                        error: { code: 'PGRST116', message: 'Results contain exactly one row' } // typical "no rows" error
                    })
                }

                return queryBuilder
            })
        }

        const { createClient } = await import('@/lib/supabase/server')
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await getTenantPropertyId('user-123')
        expect(result).toBeNull()
    })

    it('returns null when lease query returns an error', async () => {
        const mockSupabase = {
            from: vi.fn().mockImplementation((tableName: string) => {
                const queryBuilder = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn()
                }

                if (tableName === 'leases') {
                    queryBuilder.single.mockResolvedValue({
                        data: null,
                        error: { code: '42000', message: 'Database error' }
                    })
                }

                return queryBuilder
            })
        }

        const { createClient } = await import('@/lib/supabase/server')
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await getTenantPropertyId('user-123')
        expect(result).toBeNull()
    })

    it('returns null when lease exists but unit query fails', async () => {
        const mockSupabase = {
            from: vi.fn().mockImplementation((tableName: string) => {
                const queryBuilder = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn()
                }

                if (tableName === 'leases') {
                    queryBuilder.single.mockResolvedValue({
                        data: { unit_id: 'unit-789' },
                        error: null
                    })
                } else if (tableName === 'units') {
                    queryBuilder.single.mockResolvedValue({
                        data: null,
                        error: { code: 'PGRST116', message: 'No rows found' }
                    })
                }

                return queryBuilder
            })
        }

        const { createClient } = await import('@/lib/supabase/server')
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await getTenantPropertyId('user-123')
        expect(result).toBeNull()
    })

    it('returns null when unit property_id is missing', async () => {
        const mockSupabase = {
            from: vi.fn().mockImplementation((tableName: string) => {
                const queryBuilder = {
                    select: vi.fn().mockReturnThis(),
                    eq: vi.fn().mockReturnThis(),
                    single: vi.fn()
                }

                if (tableName === 'leases') {
                    queryBuilder.single.mockResolvedValue({
                        data: { unit_id: 'unit-999' },
                        error: null
                    })
                } else if (tableName === 'units') {
                    queryBuilder.single.mockResolvedValue({
                        data: { id: 'unit-999', property_id: null } as any, // property_id explicitly null
                        error: null
                    })
                }

                return queryBuilder
            })
        }

        const { createClient } = await import('@/lib/supabase/server')
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await getTenantPropertyId('user-123')
        expect(result).toBeNull()
    })
})
