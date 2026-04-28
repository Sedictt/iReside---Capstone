'use server'

import { createClient } from '@/lib/supabase/server'
import { getCommunityPropertyId } from './queries'
import { revalidatePath } from 'next/cache'
import type {
    CommunityPost,
    CommunityPostStatus,
    CommunityPostType,
    CommunityReactionType,
    CommunityReportReason
} from './types'

type CommunityRole = 'tenant' | 'landlord' | 'admin'

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
    profiles?: { full_name?: string | null; avatar_url?: string | null; avatar_bg_color?: string | null } | null
    community_reactions?: Array<{ reaction_type: string; user_id: string }> | null
    community_comments?: Array<{ id: string }> | null
    community_poll_votes?: Array<{ option_index: number; user_id: string }> | null
    community_albums?: { 
        id: string; 
        cover_photo_url: string | null; 
        photo_count: number | null;
        community_photos?: Array<{ id: string; url: string }> | null
    } | null
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
        author_avatar_bg_color: row.profiles?.avatar_bg_color || null,
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
                photo_count: row.community_albums.photo_count || 0,
                photos: row.community_albums.community_photos || []
            }
            : null
    }
}

async function getAuthenticatedUserId(): Promise<string> {
    const supabase = (await createClient()) as any
    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('You must be signed in to access the community hub.')
    }

    return user.id
}

async function getAuthenticatedCommunityContext(): Promise<{ userId: string; role: CommunityRole }> {
    const supabase = (await createClient()) as any
    const {
        data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('You must be signed in to access the community hub.')
    }

    const metadataRole = user.user_metadata?.role
    let resolvedRole: string | null = typeof metadataRole === 'string' ? metadataRole : null

    // Fallback to profiles.role for accounts where auth metadata hasn't been backfilled yet.
    if (!resolvedRole) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

        resolvedRole = typeof profile?.role === 'string' ? profile.role : null
    }

    const role: CommunityRole = resolvedRole === 'admin' ? 'admin' : resolvedRole === 'landlord' ? 'landlord' : 'tenant'

    return { userId: user.id, role }
}

function isManagementRole(role: CommunityRole): boolean {
    return role === 'landlord' || role === 'admin'
}

function toAuthorRole(role: CommunityRole): 'tenant' | 'landlord' {
    return role === 'tenant' ? 'tenant' : 'landlord'
}

function canCreatePostType(role: CommunityRole, postType: CommunityPostType): boolean {
    if (role === 'tenant') {
        return postType === 'discussion'
    }

    return true
}

async function resolvePropertyIdForPostCreation(userId: string, role: CommunityRole, propertyId?: string): Promise<string | null> {
    const supabase = (await createClient()) as any

    if (propertyId) {
        if (role === 'tenant') {
            return getCommunityPropertyId(userId, role)
        }

        if (role === 'admin') {
            return propertyId
        }

        const { data: ownedProperty, error } = await supabase
            .from('properties')
            .select('id')
            .eq('id', propertyId)
            .eq('landlord_id', userId)
            .maybeSingle()

        if (error || !ownedProperty) {
            return null
        }

        return ownedProperty.id
    }

    return getCommunityPropertyId(userId, role)
}

export async function getPosts(
    userId: string,
    limit = 20,
    cursor?: string,
    role: CommunityRole = 'tenant',
    targetPropertyId?: string
): Promise<{
    posts: CommunityPost[]
    nextCursor: string | null
}> {
    const supabase = (await createClient()) as any

    let managedPropertyIds: string[] | null = null
    if (role === 'landlord') {
        const { data: landlordProperties, error: landlordPropertiesError } = await supabase
            .from('properties')
            .select('id')
            .eq('landlord_id', userId)

        if (landlordPropertiesError) {
            console.error('getPosts landlord properties error:', landlordPropertiesError)
            return { posts: [], nextCursor: null }
        }

        managedPropertyIds = (landlordProperties || []).map((property: { id: string }) => property.id)
        if (!managedPropertyIds || managedPropertyIds.length === 0) {
            return { posts: [], nextCursor: null }
        }

        if (targetPropertyId && !managedPropertyIds.includes(targetPropertyId)) {
            return { posts: [], nextCursor: null }
        }
    }

    const propertyId = role === 'tenant' ? await getCommunityPropertyId(userId, role) : (targetPropertyId || null)
    if (role === 'tenant' && !propertyId) {
        return { posts: [], nextCursor: null }
    }

    let query = supabase
        .from('community_posts')
        .select(`
            *,
            profiles!author_id ( full_name, avatar_url, avatar_bg_color ),
            community_reactions ( reaction_type, user_id ),
            community_comments ( id ),
            community_poll_votes ( option_index, user_id ),
            community_albums ( id, cover_photo_url, photo_count, community_photos ( id, url ) )
        `)
        .eq('is_approved', true)
        .eq('status', 'published')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit + 1)

    if (role === 'tenant') {
        query = query.eq('property_id', propertyId)
    } else if (role === 'landlord') {
        if (targetPropertyId) {
            query = query.eq('property_id', targetPropertyId)
        } else if (managedPropertyIds) {
            query = query.in('property_id', managedPropertyIds)
        }
    }

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

export async function getCurrentTenantPosts(limit = 20, cursor?: string, propertyId?: string) {
    return getCurrentCommunityPosts(limit, cursor, propertyId)
}

export async function getCurrentCommunityPosts(limit = 20, cursor?: string, propertyId?: string) {
    const { userId, role } = await getAuthenticatedCommunityContext()
    return getPosts(userId, limit, cursor, role, propertyId)
}

export async function getCurrentTenantPendingPosts(limit = 20): Promise<CommunityPost[]> {
    return getCurrentCommunityPendingPosts(limit)
}

export async function getCurrentCommunityPendingPosts(limit = 20): Promise<CommunityPost[]> {
    const { userId, role } = await getAuthenticatedCommunityContext()
    const propertyId = await getCommunityPropertyId(userId, role)
    if (!propertyId) {
        return []
    }

    const supabase = (await createClient()) as any
    let query = supabase
        .from('community_posts')
        .select(`
            *,
            profiles!author_id ( full_name, avatar_url, avatar_bg_color ),
            community_reactions ( reaction_type, user_id ),
            community_comments ( id ),
            community_poll_votes ( option_index, user_id ),
            community_albums ( id, cover_photo_url, photo_count, community_photos ( id, url ) )
        `)
        .eq('property_id', propertyId)
        .eq('author_id', userId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (role === 'tenant') {
        query = query.eq('is_approved', false)
    }

    const { data, error } = await query

    if (error || !data) {
        console.error('getCurrentCommunityPendingPosts error:', error)
        return []
    }

    return (data as PostRowWithRelations[]).map(post => mapPost(post, userId))
}

export async function getPendingResidentPostsForModeration(limit = 20, targetPropertyId?: string): Promise<CommunityPost[]> {
    const { userId, role } = await getAuthenticatedCommunityContext()
    if (!isManagementRole(role)) {
        return []
    }

    const supabase = (await createClient()) as any
    let landlordPropertyIds: string[] | null = null
    if (role === 'landlord') {
        const { data: landlordProperties, error: propertiesError } = await supabase
            .from('properties')
            .select('id')
            .eq('landlord_id', userId)

        if (propertiesError) {
            console.error('getPendingResidentPostsForModeration properties error:', propertiesError)
            return []
        }

        landlordPropertyIds = (landlordProperties || []).map((property: { id: string }) => property.id)
        if (!landlordPropertyIds || landlordPropertyIds.length === 0) {
            return []
        }
        if (targetPropertyId && !landlordPropertyIds.includes(targetPropertyId)) {
            return []
        }
    }

    let query = supabase
        .from('community_posts')
        .select(`
            *,
            profiles!author_id ( full_name, avatar_url, avatar_bg_color ),
            community_reactions ( reaction_type, user_id ),
            community_comments ( id ),
            community_poll_votes ( option_index, user_id ),
            community_albums ( id, cover_photo_url, photo_count, community_photos ( id, url ) )
        `)
        .eq('author_role', 'tenant')
        .eq('is_approved', false)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (targetPropertyId) {
        query = query.eq('property_id', targetPropertyId)
    } else if (landlordPropertyIds) {
        query = query.in('property_id', landlordPropertyIds)
    }

    const { data, error } = await query

    if (error || !data) {
        console.error('getPendingResidentPostsForModeration error:', error)
        return []
    }

    return (data as PostRowWithRelations[]).map(post => mapPost(post, userId))
}

export async function createDiscussionPost(input: { title: string; content: string; propertyId?: string }) {
    const { userId, role } = await getAuthenticatedCommunityContext()
    const propertyId = await resolvePropertyIdForPostCreation(userId, role, input.propertyId)
    if (!propertyId) {
        throw new Error(isManagementRole(role) ? 'You need at least one property before posting in the community hub.' : 'You need an active lease before posting in the community hub.')
    }

    const title = input.title.trim()
    const content = input.content.trim()

    if (!title && !content) {
        throw new Error('Discussion post must have either a title or content.')
    }

    const supabase = (await createClient()) as any
    const { error } = await supabase.from('community_posts').insert({
        property_id: propertyId,
        author_id: userId,
        author_role: toAuthorRole(role),
        type: 'discussion',
        title,
        content,
        is_moderated: !isManagementRole(role),
        is_approved: isManagementRole(role),
        status: 'published'
    })

    if (error) {
        console.error('createDiscussionPost error:', error)
        throw new Error('Unable to submit your discussion post right now.')
    }

    revalidatePath('/tenant/community')
    revalidatePath('/landlord/community')
    revalidatePath('/')
}

export async function createPollPost(input: { title: string; content: string; options: string[]; propertyId?: string }) {
    const { userId, role } = await getAuthenticatedCommunityContext()
    if (!canCreatePostType(role, 'poll')) {
        throw new Error('Tenants can only create discussion posts.')
    }

    const propertyId = await resolvePropertyIdForPostCreation(userId, role, input.propertyId)
    if (!propertyId) {
        throw new Error(isManagementRole(role) ? 'You need at least one property before posting in the community hub.' : 'You need an active lease before posting in the community hub.')
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

    const supabase = (await createClient()) as any
    const { error } = await supabase.from('community_posts').insert({
        property_id: propertyId,
        author_id: userId,
        author_role: toAuthorRole(role),
        type: 'poll',
        title,
        content,
        metadata: { options: validOptions },
        is_moderated: !isManagementRole(role),
        is_approved: isManagementRole(role),
        status: 'published'
    })

    if (error) {
        console.error('createPollPost error:', error)
        throw new Error('Unable to submit your poll right now.')
    }

    revalidatePath('/tenant/community')
    revalidatePath('/landlord/community')
    revalidatePath('/')
}

export async function createPhotoAlbumPost(input: { title: string; content: string; propertyId?: string; imageUrls: string[] }) {
    const { userId, role } = await getAuthenticatedCommunityContext()
    const propertyId = await resolvePropertyIdForPostCreation(userId, role, input.propertyId)
    if (!propertyId) {
        throw new Error(isManagementRole(role) ? 'You need at least one property before posting in the community hub.' : 'You need an active lease before posting in the community hub.')
    }

    if (!input.imageUrls || input.imageUrls.length === 0) {
        throw new Error('At least one photo is required for a photo album.')
    }

    const title = input.title.trim()
    const content = input.content.trim()

    const supabase = (await createClient()) as any
    
    // 1. Create the Post
    const { data: post, error: postError } = await supabase.from('community_posts').insert({
        property_id: propertyId,
        author_id: userId,
        author_role: toAuthorRole(role),
        type: 'photo_album',
        title,
        content,
        is_moderated: !isManagementRole(role),
        is_approved: isManagementRole(role),
        status: 'published'
    }).select('id').single()

    if (postError) {
        console.error('createPhotoAlbumPost error (post):', postError)
        throw new Error('Unable to create your photo album right now.')
    }

    // 2. Create the Album
    const { data: album, error: albumError } = await supabase.from('community_albums').insert({
        post_id: post.id,
        property_id: propertyId,
        cover_photo_url: input.imageUrls[0],
        photo_count: input.imageUrls.length
    }).select('id').single()

    if (albumError) {
        console.error('createPhotoAlbumPost error (album):', albumError)
        throw new Error('Post created, but album record failed.')
    }

    // 3. Create the Photos
    const photoInserts = input.imageUrls.map(url => ({
        album_id: album.id,
        url,
        uploaded_by: userId
    }))

    const { error: photoError } = await supabase.from('community_photos').insert(photoInserts)

    if (photoError) {
        console.error('createPhotoAlbumPost error (photos):', photoError)
    }

    revalidatePath('/tenant/community')
    revalidatePath('/landlord/community')
    revalidatePath('/')
}

export async function createAnnouncementPost(input: { title: string; content: string; propertyId?: string }) {
    const { userId, role } = await getAuthenticatedCommunityContext()
    if (!canCreatePostType(role, 'announcement')) {
        throw new Error('Tenants can only create discussion posts.')
    }

    const propertyId = await resolvePropertyIdForPostCreation(userId, role, input.propertyId)
    if (!propertyId) {
        throw new Error('You need at least one property before posting in the community hub.')
    }

    const title = input.title.trim()
    const content = input.content.trim()

    if (!title && !content) {
        throw new Error('Announcement must have some content.')
    }

    const supabase = (await createClient()) as any
    const { error } = await supabase.from('community_posts').insert({
        property_id: propertyId,
        author_id: userId,
        author_role: toAuthorRole(role),
        type: 'announcement',
        title,
        content,
        is_moderated: false,
        is_approved: true,
        status: 'published',
        is_pinned: true
    })

    if (error) {
        console.error('createAnnouncementPost error:', error)
        throw new Error('Unable to publish announcement right now.')
    }

    revalidatePath('/tenant/community')
    revalidatePath('/landlord/community')
    revalidatePath('/')
}

export async function updateOwnPost(postId: string, input: { title?: string; content?: string }) {
    const userId = await getAuthenticatedUserId()
    const updates: Record<string, unknown> = {}

    if (typeof input.title === 'string') {
        const title = input.title.trim()
        if (!title) {
            throw new Error('Post title is required.')
        }
        updates.title = title
    }

    if (typeof input.content === 'string') {
        updates.content = input.content.trim()
    }

    if (Object.keys(updates).length === 0) {
        return
    }

    updates.updated_at = new Date().toISOString()

    const supabase = (await createClient()) as any
    const { error } = await supabase
        .from('community_posts')
        .update(updates)
        .eq('id', postId)
        .eq('author_id', userId)

    if (error) {
        console.error('updateOwnPost error:', error)
        throw new Error('Unable to update this post right now.')
    }

    revalidatePath('/tenant/community')
    revalidatePath('/landlord/community')
}

export async function deleteOwnPost(postId: string) {
    const userId = await getAuthenticatedUserId()
    const supabase = (await createClient()) as any

    const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)
        .eq('author_id', userId)

    if (error) {
        console.error('deleteOwnPost error:', error)
        throw new Error('Unable to delete this post right now.')
    }

    revalidatePath('/tenant/community')
    revalidatePath('/landlord/community')
}

export async function getManagementProperties(): Promise<Array<{ id: string; name: string }>> {
    const { userId, role } = await getAuthenticatedCommunityContext()
    if (!isManagementRole(role)) {
        return []
    }

    const supabase = (await createClient()) as any
    let query = supabase.from('properties').select('id, name')

    if (role === 'landlord') {
        query = query.eq('landlord_id', userId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error || !data) {
        console.error('getManagementProperties error:', error)
        return []
    }

    return data
}

export async function approveResidentPost(postId: string, approved = true) {
    const { userId, role } = await getAuthenticatedCommunityContext()
    if (!isManagementRole(role)) {
        throw new Error('Only landlords and admins can approve resident posts.')
    }

    const supabase = (await createClient()) as any
    const { data: post, error: postError } = await supabase
        .from('community_posts')
        .select('id, property_id, author_role')
        .eq('id', postId)
        .maybeSingle()

    if (postError || !post) {
        console.error('approveResidentPost fetch error:', postError)
        throw new Error('Unable to load this post for approval.')
    }

    if (post.author_role !== 'tenant') {
        throw new Error('Only resident posts can be approved from this action.')
    }

    if (role === 'landlord') {
        const { data: property, error: propertyError } = await supabase
            .from('properties')
            .select('id')
            .eq('id', post.property_id)
            .eq('landlord_id', userId)
            .maybeSingle()

        if (propertyError || !property) {
            throw new Error('You can only approve posts for your own properties.')
        }
    }

    const { error: updateError } = await supabase
        .from('community_posts')
        .update({
            is_approved: approved,
            is_moderated: true,
            updated_at: new Date().toISOString()
        })
        .eq('id', postId)

    if (updateError) {
        console.error('approveResidentPost update error:', updateError)
        throw new Error('Unable to update moderation status right now.')
    }

    revalidatePath('/tenant/community')
    revalidatePath('/landlord/community')
}

export async function toggleReaction(postId: string, reactionType: CommunityReactionType) {
    const userId = await getAuthenticatedUserId()
    const supabase = (await createClient()) as any

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

    const reactions = (countsData || []).reduce((acc: Record<string, number>, reaction: { reaction_type: string }) => {
        acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1
        return acc
    }, {})

    const userReactions = (countsData || [])
        .filter((reaction: { user_id: string }) => reaction.user_id === userId)
        .map((reaction: { reaction_type: string }) => ({ reaction_type: reaction.reaction_type }))

    revalidatePath('/tenant/community')
    revalidatePath('/landlord/community')

    return { reactions, userReactions }
}

export async function votePoll(pollId: string, optionIndex: number) {
    const userId = await getAuthenticatedUserId()
    const supabase = (await createClient()) as any

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
            const { error: fallbackWriteError } = await supabase.from('community_poll_votes')
                .upsert(
                    {
                        post_id: pollId,
                        user_id: userId,
                        option_index: optionIndex
                    },
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
            const { data: fallbackVotes, error: fallbackVotesError } = await supabase.from('community_poll_votes')
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
    revalidatePath('/landlord/community')

    return {
        pollVotes: votes,
        userPollVote: votes.find(vote => vote.user_id === userId)?.option_index ?? null
    }
}

export async function addComment(postId: string, content: string, parentCommentId?: string) {
    const userId = await getAuthenticatedUserId()
    const supabase = (await createClient()) as any

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
    revalidatePath('/landlord/community')

    return { commentCount: count || 0 }
}

export async function getPostComments(postId: string) {
    await getAuthenticatedUserId()
    const supabase = (await createClient()) as any

    const { data, error } = await supabase
        .from('community_comments')
        .select(`
            id,
            post_id,
            author_id,
            content,
            parent_comment_id,
            created_at,
            profiles!author_id ( full_name, avatar_url, avatar_bg_color )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

    if (error) {
        console.error('getPostComments error:', error)
        throw new Error('Unable to load comments right now.')
    }

    return (data || []).map((row: any) => {
        const comment = row as {
            id: string
            post_id: string
            author_id: string
            content: string
            parent_comment_id: string | null
            created_at: string
            profiles?: { full_name?: string | null; avatar_url?: string | null; avatar_bg_color?: string | null } | null
        }

        return {
            id: comment.id,
            postId: comment.post_id,
            authorId: comment.author_id,
            authorName: comment.profiles?.full_name || 'Unknown',
            authorAvatar: comment.profiles?.avatar_url || null,
            authorAvatarBgColor: comment.profiles?.avatar_bg_color || null,
            content: comment.content,
            parentCommentId: comment.parent_comment_id,
            createdAt: comment.created_at
        }
    })
}

export async function reportPost(postId: string, reason: CommunityReportReason) {
    const userId = await getAuthenticatedUserId()
    const supabase = (await createClient()) as any

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
    revalidatePath('/landlord/community')
}
