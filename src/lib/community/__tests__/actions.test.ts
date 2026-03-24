import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getPosts } from '../actions'

vi.mock('@/lib/supabase/server')
vi.mock('@/lib/community/queries', () => ({
    getTenantPropertyId: vi.fn()
}))
vi.mock('next/headers', () => ({
    revalidatePath: vi.fn()
}))

describe('getPosts', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('returns transformed posts with aggregated reactions, comment count, and author info', async () => {
        // Mock getTenantPropertyId to return a property ID
        const { getTenantPropertyId } = await import('@/lib/community/queries')
        vi.mocked(getTenantPropertyId).mockResolvedValue('property-123')

        // Mock data
        const mockResponseData = [
            {
                id: 'post-1',
                property_id: 'property-123',
                author_id: 'user-1',
                author_role: 'tenant',
                type: 'discussion',
                title: 'Test Post',
                content: 'Test content',
                metadata: null,
                is_pinned: false,
                is_moderated: false,
                is_approved: true,
                status: 'published',
                view_count: 10,
                created_at: '2025-03-24T10:00:00Z',
                updated_at: '2025-03-24T10:00:00Z',
                profiles: {
                    full_name: 'John Doe',
                    avatar_url: 'https://example.com/avatar.jpg'
                },
                community_reactions: [
                    { reaction_type: 'like', user_id: 'user-2' },
                    { reaction_type: 'like', user_id: 'user-3' },
                    { reaction_type: 'heart', user_id: 'user-2' }
                ],
                community_comments: [
                    { id: 'comment-1' },
                    { id: 'comment-2' },
                    { id: 'comment-3' }
                ]
            }
        ]

        // Create thenable query builder
        const queryBuilder: any = {}
        queryBuilder.select = vi.fn(() => queryBuilder)
        queryBuilder.eq = vi.fn(() => queryBuilder)
        queryBuilder.order = vi.fn(() => queryBuilder)
        queryBuilder.limit = vi.fn(() => queryBuilder)
        queryBuilder.range = vi.fn(() => queryBuilder)
        queryBuilder.then = (resolve: any, reject?: any) => resolve({ data: mockResponseData, error: null })

        // Mock Supabase client
        const mockSupabase = {
            from: vi.fn().mockReturnValue(queryBuilder)
        }

        const { createClient } = await import('@/lib/supabase/server')
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await getPosts('user-2', 20)

        expect(result).toHaveProperty('posts')
        expect(result).toHaveProperty('nextCursor')
        expect(result.posts).toHaveLength(1)

        const post = result.posts[0]
        expect(post.id).toBe('post-1')
        expect(post.title).toBe('Test Post')
        expect(post.author_name).toBe('John Doe')
        expect(post.author_avatar).toBe('https://example.com/avatar.jpg')
        expect(post.commentCount).toBe(3)
        expect(post.reactions).toEqual({
            like: 2,
            heart: 1
        })
        expect(post.userReactions).toContainEqual({ reaction_type: 'like' })
        expect(post.userReactions).toContainEqual({ reaction_type: 'heart' })
    })

    it('handles pagination correctly', async () => {
        const { getTenantPropertyId } = await import('@/lib/community/queries')
        vi.mocked(getTenantPropertyId).mockResolvedValue('property-123')

        const mockPosts = Array.from({ length: 21 }, (_, i) => ({
            id: `post-${i + 1}`,
            property_id: 'property-123',
            author_id: 'user-1',
            author_role: 'tenant',
            type: 'discussion',
            title: `Post ${i + 1}`,
            content: 'Content',
            metadata: null,
            is_pinned: false,
            is_moderated: false,
            is_approved: true,
            status: 'published',
            view_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            profiles: {
                full_name: 'Author',
                avatar_url: null
            },
            community_reactions: [],
            community_comments: []
        }))

        const queryBuilder: any = {}
        queryBuilder.select = vi.fn(() => queryBuilder)
        queryBuilder.eq = vi.fn(() => queryBuilder)
        queryBuilder.order = vi.fn(() => queryBuilder)
        queryBuilder.limit = vi.fn(() => queryBuilder)
        queryBuilder.lt = vi.fn(() => queryBuilder)
        queryBuilder.then = (resolve: any) => resolve({ data: mockPosts, error: null })

        const mockSupabase = {
            from: vi.fn().mockReturnValue(queryBuilder)
        }

        const { createClient } = await import('@/lib/supabase/server')
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await getPosts('user-2', 20, 'cursor-value')

        expect(queryBuilder.lt).toHaveBeenCalledWith('created_at', 'cursor-value')
        expect(result.posts).toHaveLength(20) // Should return exactly limit items
        expect(result.nextCursor).toBeDefined() // Should have a next cursor because there's one more
        expect(typeof result.nextCursor).toBe('string') // Cursor should be a date string
    })

    it('returns empty posts array when getTenantPropertyId returns null', async () => {
        const { getTenantPropertyId } = await import('@/lib/community/queries')
        vi.mocked(getTenantPropertyId).mockResolvedValue(null)

        const result = await getPosts('user-2')

        expect(result.posts).toEqual([])
        expect(result.nextCursor).toBeNull()
    })

    it('returns empty posts array when Supabase query fails', async () => {
        const { getTenantPropertyId } = await import('@/lib/community/queries')
        vi.mocked(getTenantPropertyId).mockResolvedValue('property-123')

        const queryBuilder: any = {}
        queryBuilder.select = vi.fn(() => queryBuilder)
        queryBuilder.eq = vi.fn(() => queryBuilder)
        queryBuilder.order = vi.fn(() => queryBuilder)
        queryBuilder.limit = vi.fn(() => queryBuilder)
        queryBuilder.range = vi.fn(() => queryBuilder)
        queryBuilder.then = (resolve: any) => resolve({ data: null, error: { message: 'Query failed' } })

        const mockSupabase = {
            from: vi.fn().mockReturnValue(queryBuilder)
        }

        const { createClient } = await import('@/lib/supabase/server')
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await getPosts('user-2')

        expect(result.posts).toEqual([])
        expect(result.nextCursor).toBeNull()
    })

    it('orders posts by is_pinned DESC and created_at DESC', async () => {
        const { getTenantPropertyId } = await import('@/lib/community/queries')
        vi.mocked(getTenantPropertyId).mockResolvedValue('property-123')

        const queryBuilder: any = {}
        queryBuilder.select = vi.fn(() => queryBuilder)
        queryBuilder.eq = vi.fn(() => queryBuilder)
        queryBuilder.order = vi.fn(() => queryBuilder)
        queryBuilder.limit = vi.fn(() => queryBuilder)
        queryBuilder.range = vi.fn(() => queryBuilder)
        queryBuilder.then = (resolve: any) => resolve({ data: [], error: null })

        const mockSupabase = {
            from: vi.fn().mockReturnValue(queryBuilder)
        }

        const { createClient } = await import('@/lib/supabase/server')
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        await getPosts('user-2')

        // Check that the query was made with proper ordering
        expect(queryBuilder.order).toHaveBeenCalledWith('is_pinned', { ascending: false })
        expect(queryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('filters by property_id, is_approved=true, and status=published', async () => {
        const { getTenantPropertyId } = await import('@/lib/community/queries')
        vi.mocked(getTenantPropertyId).mockResolvedValue('property-123')

        const queryBuilder: any = {}
        queryBuilder.select = vi.fn(() => queryBuilder)
        queryBuilder.eq = vi.fn(() => queryBuilder)
        queryBuilder.order = vi.fn(() => queryBuilder)
        queryBuilder.limit = vi.fn(() => queryBuilder)
        queryBuilder.range = vi.fn(() => queryBuilder)
        queryBuilder.then = (resolve: any) => resolve({ data: [], error: null })

        const mockSupabase = {
            from: vi.fn().mockReturnValue(queryBuilder)
        }

        const { createClient } = await import('@/lib/supabase/server')
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        await getPosts('user-2')

        // Verify eq was called for each filter
        expect(queryBuilder.eq).toHaveBeenCalledWith('property_id', 'property-123')
        expect(queryBuilder.eq).toHaveBeenCalledWith('is_approved', true)
        expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'published')
    })
})
