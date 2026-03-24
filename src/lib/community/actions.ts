'use server'

import { createClient } from '@/lib/supabase/server'
import { getTenantPropertyId } from './queries'
import { Database } from '@/types/database'
import { revalidatePath } from 'next/cache'

export async function getPosts(
    userId: string,
    limit = 20,
    cursor?: string
): Promise<{
    posts: Array<
        Database['public']['Tables']['community_posts']['Row'] & {
            author_name: string
            author_avatar: string | null
            reactions: Record<string, number>
            userReactions: Array<{ reaction_type: string }>
            commentCount: number
        }
    >
    nextCursor: string | null
}> {
    const supabase = createClient<Database>()

    const propertyId = await getTenantPropertyId(userId)
    if (!propertyId) {
        return { posts: [], nextCursor: null }
    }

    let query = supabase
        .from('community_posts')
        .select(`
            *,
            profiles!author_id ( full_name, avatar_url ),
            community_reactions ( reaction_type, user_id ),
            community_comments ( id )
        `)
        .eq('property_id', propertyId)
        .eq('is_approved', true)
        .eq('status', 'published')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit + 1)

    if (cursor) {
        query = query.lt('created_at', cursor)
    }

    const { data, error } = await query

    if (error || !data) {
        console.error('getPosts error:', error)
        return { posts: [], nextCursor: null }
    }

    const hasMore = data.length > limit
    const postsData = hasMore ? data.slice(0, limit) : data

    const posts = postsData.map(post => {
        const postAny = post as any
        const reactions = postAny.community_reactions?.reduce((acc: any, r: any) => {
            acc[r.reaction_type] = (acc[r.reaction_type] || 0) + 1
            return acc
        }, {}) || {}

        const userReactions = postAny.community_reactions?.filter((r: any) => r.user_id === userId) || []

        return {
            ...post,
            author_name: postAny.profiles?.full_name || 'Unknown',
            author_avatar: postAny.profiles?.avatar_url,
            reactions,
            userReactions: userReactions.map((r: any) => ({ reaction_type: r.reaction_type })),
            commentCount: postAny.community_comments?.length || 0
        }
    })

    const nextCursor = hasMore ? posts[posts.length - 1].created_at : null

    return { posts, nextCursor }
}
