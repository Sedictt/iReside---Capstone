export type CommunityPostType = 'announcement' | 'poll' | 'photo_album' | 'discussion'
export type CommunityPostStatus = 'draft' | 'published' | 'archived'
export type CommunityReactionType = 'like' | 'heart' | 'thumbs_up' | 'clap' | 'celebration'
export type CommunityReportReason = string

export interface CommunityPost {
    id: string
    property_id: string
    author_id: string
    author_role: 'tenant' | 'landlord'
    type: CommunityPostType
    title: string
    content: string | null
    metadata: Record<string, unknown> | null
    is_pinned: boolean
    is_moderated: boolean
    is_approved: boolean
    status: CommunityPostStatus
    view_count: number
    created_at: string
    updated_at: string
    author_name: string
    author_avatar: string | null
    reactions: Record<string, number>
    userReactions: Array<{ reaction_type: string }>
    commentCount: number
    pollVotes: Array<{ option_index: number; user_id: string }>
    userPollVote: number | null
    album: {
        id: string
        cover_photo_url: string | null
        photo_count: number
    } | null
}
