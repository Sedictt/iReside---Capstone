'use server'

import { createClient } from '@/lib/supabase/server'
import { getTenantPropertyId } from './queries'
import { revalidatePath } from 'next/cache'
import type {
    CommunityPost,
    CommunityPostStatus,
    CommunityReactionType,
    CommunityReportReason
} from './types'

type PostRowWithRelations = {
    id: string
    property_id: string
    author_id: string
    author_role: 'tenant' | 'landlord'
    type: 'announcement' | 'poll' | 'photo_album' | 'discussion'
    title: string
    content: string | null
    metadata: Record<string, unknown> | null
    is_pinned: boolean | null
    is_moderated: boolean | null
    is_approved: boolean | null
    status: CommunityPostStatus | null
    view_count: number | null
    created_at: string
    updated_at: string
    profiles?: { full_name?: string | null; avatar_url?: string | null } | null
    community_reactions?: Array<{ reaction_type: string; user_id: string }> | null
    community_comments?: Array<{ id: string }> | null
    community_poll_votes?: Array<{ option_index: number; user_id: string }> | null
    community_albums?: { id: string; cover_photo_url: string | null; photo_count: number | null } | null
}

function mapPost(row: PostRowWithRelations, userId: string): CommunityPost {
    const reactions = (row.community_reactions || []).reduce<Record<string, number>>((acc, reaction) => {
        acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1
        return acc
    }, {})

    const pollVotes = row.community_poll_votes || []
    const userVote = pollVotes.find(vote => vote.user_id === userId)?.option_index ?? null

    return {
        id: row.id,
        property_id: row.property_id,
        author_id: row.author_id,
        author_role: row.author_role,
        type: row.type,
        title: row.title,
        content: row.content,
        metadata: row.metadata,
        is_pinned: Boolean(row.is_pinned),
        is_moderated: Boolean(row.is_moderated),
        is_approved: Boolean(row.is_approved),
        status: row.status || 'published',
        view_count: row.view_count || 0,
        created_at: row.created_at,
        updated_at: row.updated_at,
        author_name: row.profiles?.full_name || 'Unknown',
        author_avatar: row.profiles?.avatar_url || null,
        reactions,
        userReactions: (row.community_reactions || [])
            .filter(reaction => reaction.user_id === userId)
            .map(reaction => ({ reaction_type: reaction.reaction_type })),
        commentCount: row.community_comments?.length || 0,
        pollVotes,
        userPollVote: userVote,
        album: row.community_albums
            ? {
                id: row.community_albums.id,
                cover_photo_url: row.community_albums.cover_photo_url,
                photo_count: row.community_albums.photo_count || 0
            }
            : null
    }
}

async function getAuthenticatedUserId(): Promise<string> {
    const supabase = await createClient()
    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('You must be signed in to access the community hub.')
    }

    return user.id
}

export async function getPosts(
    userId: string,
    limit = 20,
    cursor?: string
): Promise<{
    posts: CommunityPost[]
    nextCursor: string | null
}> {
    const supabase = await createClient()

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
            community_comments ( id ),
            community_poll_votes ( option_index, user_id ),
            community_albums ( id, cover_photo_url, photo_count )
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
    const postsData = (hasMore ? data.slice(0, limit) : data) as PostRowWithRelations[]

    const posts = postsData.map(post => mapPost(post, userId))

    const nextCursor = hasMore ? posts[posts.length - 1].created_at : null

    return { posts, nextCursor }
}

export async function getCurrentTenantPosts(limit = 20, cursor?: string) {
    const userId = await getAuthenticatedUserId()
    return getPosts(userId, limit, cursor)
}

export async function getCurrentTenantPendingPosts(limit = 20): Promise<CommunityPost[]> {
    const userId = await getAuthenticatedUserId()
    const propertyId = await getTenantPropertyId(userId)
    if (!propertyId) {
        return []
    }

    const supabase = await createClient()
    const { data, error } = await supabase
        .from('community_posts')
        .select(`
            *,
            profiles!author_id ( full_name, avatar_url ),
            community_reactions ( reaction_type, user_id ),
            community_comments ( id ),
            community_poll_votes ( option_index, user_id ),
            community_albums ( id, cover_photo_url, photo_count )
        `)
        .eq('property_id', propertyId)
        .eq('author_id', userId)
        .eq('is_approved', false)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error || !data) {
        console.error('getCurrentTenantPendingPosts error:', error)
        return []
    }

    return (data as PostRowWithRelations[]).map(post => mapPost(post, userId))
}

export async function createDiscussionPost(input: { title: string; content: string }) {
    const userId = await getAuthenticatedUserId()
    const propertyId = await getTenantPropertyId(userId)
    if (!propertyId) {
        throw new Error('You need an active lease before posting in the community hub.')
    }

    const title = input.title.trim()
    const content = input.content.trim()

    if (!title) {
        throw new Error('Discussion title is required.')
    }

    if (!content) {
        throw new Error('Discussion content is required.')
    }

    const supabase = await createClient()
    const { error } = await supabase.from('community_posts').insert({
        property_id: propertyId,
        author_id: userId,
        author_role: 'tenant',
        type: 'discussion',
        title,
        content,
        is_moderated: true,
        is_approved: false,
        status: 'published'
    })

    if (error) {
        console.error('createDiscussionPost error:', error)
        throw new Error('Unable to submit your discussion post right now.')
    }

    revalidatePath('/tenant/community')
    revalidatePath('/')
}

export async function createPollPost(input: { title: string; content: string; options: string[] }) {
    const userId = await getAuthenticatedUserId()
    const propertyId = await getTenantPropertyId(userId)
    if (!propertyId) {
        throw new Error('You need an active lease before posting in the community hub.')
    }

    const title = input.title.trim()
    const content = input.content.trim()
    const validOptions = input.options.map(o => o.trim()).filter(Boolean)

    if (!title && !content) {
        throw new Error('A title or question is required for the poll.')
    }

    if (validOptions.length < 2) {
        throw new Error('A poll requires at least 2 options.')
    }

    if (validOptions.length > 5) {
        throw new Error('A poll can have at most 5 options.')
    }

    const supabase = await createClient()
    const { error } = await supabase.from('community_posts').insert({
        property_id: propertyId,
        author_id: userId,
        author_role: 'tenant',
        type: 'poll',
        title: title || 'Resident Poll',
        content,
        metadata: { options: validOptions },
        is_moderated: true,
        is_approved: false,
        status: 'published'
    })

    if (error) {
        console.error('createPollPost error:', error)
        throw new Error('Unable to submit your poll right now.')
    }

    revalidatePath('/tenant/community')
    revalidatePath('/')
}

export async function toggleReaction(postId: string, reactionType: CommunityReactionType) {
    const userId = await getAuthenticatedUserId()
    const supabase = await createClient()

    const { data: existing, error: existingError } = await supabase
        .from('community_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .eq('reaction_type', reactionType)
        .maybeSingle()

    if (existingError) {
        console.error('toggleReaction existing query error:', existingError)
        throw new Error('Unable to update reaction right now.')
    }

    if (existing) {
        const { error } = await supabase
            .from('community_reactions')
            .delete()
            .eq('id', existing.id)

        if (error) {
            console.error('toggleReaction delete error:', error)
            throw new Error('Unable to remove reaction right now.')
        }
    } else {
        const { error } = await supabase
            .from('community_reactions')
            .insert({
                post_id: postId,
                user_id: userId,
                reaction_type: reactionType
            })

        if (error) {
            console.error('toggleReaction insert error:', error)
            throw new Error('Unable to add reaction right now.')
        }
    }

    const { data: countsData, error: countsError } = await supabase
        .from('community_reactions')
        .select('reaction_type, user_id')
        .eq('post_id', postId)

    if (countsError) {
        console.error('toggleReaction count error:', countsError)
        throw new Error('Reaction saved, but counts failed to refresh.')
    }

    const reactions = (countsData || []).reduce<Record<string, number>>((acc, reaction) => {
        acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1
        return acc
    }, {})

    const userReactions = (countsData || [])
        .filter(reaction => reaction.user_id === userId)
        .map(reaction => ({ reaction_type: reaction.reaction_type }))

    revalidatePath('/tenant/community')

    return { reactions, userReactions }
}

export async function votePoll(pollId: string, optionIndex: number) {
    const userId = await getAuthenticatedUserId()
    const supabase = await createClient()

    if (!Number.isInteger(optionIndex) || optionIndex < 0) {
        throw new Error('Invalid poll option selected.')
    }

    let voteWriteError: { message?: string } | null = null

    const { error: primaryWriteError } = await supabase
        .from('community_poll_votes')
        .upsert(
            {
                poll_id: pollId,
                user_id: userId,
                option_index: optionIndex
            },
            { onConflict: 'poll_id,user_id' }
        )

    if (primaryWriteError) {
        const primaryMessage = primaryWriteError.message || ''
        const shouldTryLegacyColumn =
            primaryMessage.toLowerCase().includes('poll_id') ||
            primaryMessage.toLowerCase().includes('on conflict')

        if (shouldTryLegacyColumn) {
            const { error: fallbackWriteError } = await (supabase.from('community_poll_votes') as never)
                .upsert(
                    {
                        post_id: pollId,
                        user_id: userId,
                        option_index: optionIndex
                    } as never,
                    { onConflict: 'post_id,user_id' }
                )

            voteWriteError = fallbackWriteError
        } else {
            voteWriteError = primaryWriteError
        }
    }

    if (voteWriteError) {
        console.error('votePoll error:', voteWriteError)
        throw new Error('Unable to record your vote right now.')
    }

    let votesData: Array<{ option_index: number; user_id: string }> | null = null
    const { data: primaryVotes, error: primaryVotesError } = await supabase
        .from('community_poll_votes')
        .select('option_index, user_id')
        .eq('poll_id', pollId)

    if (primaryVotesError) {
        const primaryMessage = primaryVotesError.message || ''
        const shouldTryLegacyColumn =
            primaryMessage.toLowerCase().includes('poll_id') ||
            primaryMessage.toLowerCase().includes('column')

        if (shouldTryLegacyColumn) {
            const { data: fallbackVotes, error: fallbackVotesError } = await (supabase.from('community_poll_votes') as never)
                .select('option_index, user_id')
                .eq('post_id', pollId)

            if (fallbackVotesError) {
                console.error('votePoll fetch error:', fallbackVotesError)
                throw new Error('Vote recorded, but poll results failed to refresh.')
            }

            votesData = (fallbackVotes || []) as Array<{ option_index: number; user_id: string }>
        } else {
            console.error('votePoll fetch error:', primaryVotesError)
            throw new Error('Vote recorded, but poll results failed to refresh.')
        }
    } else {
        votesData = (primaryVotes || []) as Array<{ option_index: number; user_id: string }>
    }

    const votes = (votesData || []).map(vote => {
        const row = vote as { option_index: number; user_id: string }
        return {
            option_index: row.option_index,
            user_id: row.user_id
        }
    })
    revalidatePath('/tenant/community')

    return {
        pollVotes: votes,
        userPollVote: votes.find(vote => vote.user_id === userId)?.option_index ?? null
    }
}

export async function addComment(postId: string, content: string, parentCommentId?: string) {
    const userId = await getAuthenticatedUserId()
    const supabase = await createClient()

    const trimmedContent = content.trim()
    if (!trimmedContent) {
        throw new Error('Comment cannot be empty.')
    }

    const { error } = await supabase.from('community_comments').insert({
        post_id: postId,
        author_id: userId,
        content: trimmedContent,
        parent_comment_id: parentCommentId || null
    })

    if (error) {
        console.error('addComment error:', error)
        throw new Error('Unable to post comment right now.')
    }

    const { count, error: countError } = await supabase
        .from('community_comments')
        .select('id', { count: 'exact', head: true })
        .eq('post_id', postId)

    if (countError) {
        console.error('addComment count error:', countError)
        throw new Error('Comment posted, but count failed to refresh.')
    }

    revalidatePath('/tenant/community')

    return { commentCount: count || 0 }
}

export async function getPostComments(postId: string) {
    await getAuthenticatedUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('community_comments')
        .select(`
            id,
            post_id,
            author_id,
            content,
            parent_comment_id,
            created_at,
            profiles!author_id ( full_name, avatar_url )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('getPostComments error:', error)
        throw new Error('Unable to load comments right now.')
    }

    return (data || []).map((row) => {
        const comment = row as {
            id: string
            post_id: string
            author_id: string
            content: string
            parent_comment_id: string | null
            created_at: string
            profiles?: { full_name?: string | null; avatar_url?: string | null } | null
        }

        return {
            id: comment.id,
            postId: comment.post_id,
            authorId: comment.author_id,
            authorName: comment.profiles?.full_name || 'Unknown',
            authorAvatar: comment.profiles?.avatar_url || null,
            content: comment.content,
            parentCommentId: comment.parent_comment_id,
            createdAt: comment.created_at
        }
    })
}

export async function reportPost(postId: string, reason: CommunityReportReason) {
    const userId = await getAuthenticatedUserId()
    const supabase = await createClient()

    const trimmedReason = reason.trim()
    if (!trimmedReason) {
        throw new Error('A report reason is required.')
    }

    const { error } = await supabase.from('content_reports').insert({
        post_id: postId,
        reporter_id: userId,
        reason: trimmedReason
    })

    if (error) {
        console.error('reportPost error:', error)
        throw new Error('Unable to submit report right now.')
    }

    revalidatePath('/tenant/community')
}
