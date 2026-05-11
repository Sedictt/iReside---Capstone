"use client"

import { useState } from "react"
import Image from "next/image"
import { m as motion, AnimatePresence } from "framer-motion"
import { 
    MessageCircle, 
    ThumbsUp, 
    Share2, 
    MoreHorizontal, 
    Bookmark, 
    Flag, 
    Send, 
    User,
    Check,
    XCircle,
    Pin
} from "lucide-react"
import type { CommunityPost, CommunityReactionType } from "@/lib/community/types"
import { CommunityPhotoLightbox } from "./CommunityPhotoLightbox"

interface CommunityPostCardProps {
    post: CommunityPost
    isSaved: boolean
    onToggleSave: (id: string) => void
    onReact: (post: CommunityPost, type: CommunityReactionType) => void
    onVote: (post: CommunityPost, optionIndex: number) => void
    onReport: (id: string) => void
    onToggleComments: (id: string) => void
    isOpen: boolean
    comments: any[]
    loadingComments: boolean
    onCommentSubmit: (post: CommunityPost, content: string) => void
    isMutating: boolean
    currentUserId?: string
    isManagementUser?: boolean
    onModerationDecision?: (id: string, approved: boolean) => void
    isPending?: boolean
}

const formatRelative = (value: string) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Just now"
    const diffMs = Date.now() - date.getTime()
    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const getPollOptions = (metadata: unknown): string[] => {
    const meta = metadata as { options?: unknown; poll_options?: unknown } | null
    const raw = meta?.options || meta?.poll_options
    if (!Array.isArray(raw)) return []
    return raw.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
}

export function CommunityPostCard({
    post,
    isSaved,
    onToggleSave,
    onReact,
    onVote,
    onReport,
    onToggleComments,
    isOpen,
    comments,
    loadingComments,
    onCommentSubmit,
    isMutating,
    currentUserId,
    isManagementUser,
    onModerationDecision,
    isPending
}: CommunityPostCardProps) {
    const [commentContent, setCommentContent] = useState("")
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!commentContent.trim()) return
        onCommentSubmit(post, commentContent)
        setCommentContent("")
    }

    return (
        <motion.article 
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col gap-6 rounded-[2.5rem] border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md dark:border-white/5 dark:bg-[#151515] md:p-8 ${isPending ? 'opacity-75 grayscale-[0.5]' : ''}`}
        >
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div
                        className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border shadow-inner dark:border-white/10 relative"
                        style={{ backgroundColor: post.author_avatar_bg_color || '#f3f4f6' }}
                    >
                        {post.author_avatar ? (
                            <Image src={post.author_avatar} alt={post.author_name} fill className="object-cover" />
                        ) : (
                            <span className="font-bold text-foreground/60">{post.author_name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-[15px] font-bold text-foreground dark:text-white">
                                {post.author_name}
                            </h4>
                            {post.author_role === 'landlord' && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                                    Management
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {formatRelative(post.created_at)}
                        </p>
                    </div>
                </div>
                {!isPending && (
                    <button className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted dark:hover:bg-white/5">
                        <MoreHorizontal className="size-4" />
                    </button>
                )}
            </header>

            <div className="space-y-4">
                {post.title && (
                    <h3 className="text-lg font-bold tracking-tight text-foreground dark:text-white">
                        {post.title}
                    </h3>
                )}
                
                {post.content && (
                    <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-muted-foreground dark:text-white/70">
                        {post.content}
                    </p>
                )}

                {/* Photo Album Rendering */}
                {post.type === 'photo_album' && post.album?.photos && post.album.photos.length > 0 && (
                    <PhotoGrid 
                        photos={post.album.photos} 
                        onPhotoClick={(idx) => setLightboxIndex(idx)}
                    />
                )}

                {/* Poll Rendering */}
                {post.type === 'poll' && (
                    <div className="space-y-3 pt-2">
                        {getPollOptions(post.metadata).map((option, idx) => {
                            const normalizedUserVote = Number.isInteger(post.userPollVote) ? post.userPollVote : null
                            const hasVoted = normalizedUserVote !== null
                            const optionVotes = post.pollVotes.filter((v: any) => v.option_index === idx).length
                            const selected = normalizedUserVote === idx
                            const total = Math.max(post.pollVotes.length, 1)
                            const pct = hasVoted ? Math.round((optionVotes / total) * 100) : 0

                            return (
                                <button 
                                    key={option} 
                                    onClick={() => onVote(post, idx)} 
                                    disabled={isMutating}
                                    className={`group relative w-full overflow-hidden rounded-2xl border p-4 text-left transition-all ${
                                        selected 
                                        ? 'border-primary/50 bg-primary/5 shadow-sm' 
                                        : 'border-border bg-background/50 hover:border-primary/30'
                                    }`}
                                >
                                    {hasVoted && (
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            className={`absolute inset-y-0 left-0 ${selected ? 'bg-primary/10' : 'bg-muted/50'}`} 
                                        />
                                    )}
                                    <div className="relative z-10 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`flex size-5 items-center justify-center rounded-full border transition-colors ${selected ? 'border-primary bg-primary text-white' : 'border-border bg-white dark:bg-black'}`}>
                                                {selected && <Check className="size-3 stroke-[4]" />}
                                            </div>
                                            <span className={`text-sm font-bold ${selected ? 'text-primary' : 'text-foreground dark:text-white'}`}>
                                                {option}
                                            </span>
                                        </div>
                                        {hasVoted && (
                                            <span className={`text-xs font-bold ${selected ? 'text-primary' : 'text-muted-foreground'}`}>
                                                {pct}%
                                            </span>
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {isPending ? (
                <div className="flex items-center justify-between rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20">
                    <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            <Pin className="size-4" />
                        </div>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Awaiting Moderation</span>
                    </div>
                    {isManagementUser && onModerationDecision && (
                        <div className="flex gap-2">
                            <button 
                                onClick={() => onModerationDecision(post.id, true)}
                                className="flex h-9 items-center gap-2 rounded-xl bg-emerald-500 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:brightness-110"
                            >
                                <Check className="size-4" /> Approve
                            </button>
                            <button 
                                onClick={() => onModerationDecision(post.id, false)}
                                className="flex h-9 items-center gap-2 rounded-xl bg-red-500 px-4 text-xs font-bold text-white shadow-lg shadow-red-500/20 hover:brightness-110"
                            >
                                <XCircle className="size-4" /> Reject
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <footer className="flex items-center gap-6 border-t border-border pt-4 dark:border-white/5">
                    <InteractionButton 
                        icon={ThumbsUp} 
                        label={`${post.reactions?.thumbs_up || post.userReactions.length || 0} Kudos`} 
                        active={post.userReactions.length > 0} 
                        onClick={() => onReact(post, "thumbs_up")} 
                        disabled={isMutating}
                    />
                    <InteractionButton 
                        icon={MessageCircle} 
                        label={`${post.commentCount || 0} Comments`} 
                        active={isOpen} 
                        onClick={() => onToggleComments(post.id)} 
                    />
                    <div className="flex-1" />
                    <InteractionButton 
                        icon={Bookmark} 
                        label={isSaved ? "Saved" : "Save"} 
                        active={isSaved} 
                        onClick={() => onToggleSave(post.id)} 
                    />
                    <InteractionButton 
                        icon={Flag} 
                        label="Report" 
                        active={false} 
                        onClick={() => onReport(post.id)} 
                        danger 
                    />
                </footer>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="space-y-6 pt-6 border-t border-border dark:border-white/5 mt-2">
                            {loadingComments ? (
                                <div className="space-y-4 py-2">
                                    {[1, 2].map(i => (
                                        <div key={`comment-skeleton-${i}`} className="flex gap-4 animate-pulse">
                                            <div className="size-9 rounded-full bg-muted dark:bg-white/5" />
                                            <div className="flex-1 space-y-2">
                                                <div className="h-3 w-24 rounded bg-muted dark:bg-white/5" />
                                                <div className="h-10 rounded-2xl bg-muted/50 dark:bg-white/5" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : comments.length > 0 ? (
                                <div className="space-y-5">
                                    {comments.map((comment: { id: string; authorAvatarBgColor?: string | null; authorAvatar?: string | null; authorName: string; createdAt: string; content: string }) => (
                                        <div key={comment.id} className="flex gap-4 group text-white">
                                            <div 
                                                className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border dark:border-white/5 relative"
                                                style={{ backgroundColor: comment.authorAvatarBgColor || '#f3f4f6' }}
                                            >
                                                {comment.authorAvatar ? (
                                                    <Image src={comment.authorAvatar} alt={comment.authorName} fill className="object-cover" />
                                                ) : (
                                                    <span className="text-[10px] font-bold text-foreground/50">{comment.authorName.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="rounded-2xl rounded-tl-sm bg-muted/40 px-4 py-3 dark:bg-white/5">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[13px] font-bold text-foreground dark:text-white">{comment.authorName}</span>
                                                        <span className="text-[10px] text-muted-foreground">{formatRelative(comment.createdAt)}</span>
                                                    </div>
                                                    <p className="text-[14px] leading-relaxed text-muted-foreground dark:text-white/70">{comment.content}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center">
                                    <p className="text-sm text-muted-foreground">No comments yet. Start the conversation!</p>
                                </div>
                            )}

                            <form onSubmit={handleCommentSubmit} className="flex gap-4 items-start pt-2">
                                <div 
                                    className="size-9 shrink-0 rounded-full border border-border overflow-hidden dark:border-white/5"
                                    style={{ backgroundColor: '#f3f4f6' }}
                                >
                                    <User className="h-full w-full p-2 text-muted-foreground" />
                                </div>
                                <div className="relative flex-1">
                                    <textarea
                                        value={commentContent}
                                        onChange={(e) => setCommentContent(e.target.value)}
                                        placeholder="Write a comment..."
                                        className="w-full rounded-2xl border border-border bg-background/50 px-4 py-2.5 pr-12 text-sm outline-none transition-all focus:border-primary/50 dark:border-white/10 dark:bg-white/5"
                                        rows={1}
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!commentContent.trim() || isMutating}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:scale-110 disabled:opacity-30 transition-all"
                                    >
                                        <Send className="size-5" />
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {lightboxIndex !== null && post.album?.photos && (
                    <CommunityPhotoLightbox 
                        photos={post.album.photos}
                        initialIndex={lightboxIndex}
                        onClose={() => setLightboxIndex(null)}
                    />
                )}
            </AnimatePresence>
        </motion.article>
    )
}

function PhotoGrid({ photos, onPhotoClick }: { photos: { id: string; url: string }[], onPhotoClick: (idx: number) => void }) {
    if (photos.length === 1) {
        return (
            <div
                className="overflow-hidden rounded-2xl border border-border dark:border-white/10 cursor-pointer group"
                onClick={() => onPhotoClick(0)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPhotoClick(0); }}}
                tabIndex={0}
                role="button"
            >
                <Image src={photos[0].url} alt="Post" fill className="object-cover transition-transform duration-500 group-hover:scale-105" style={{ maxHeight: '500px' }} />
            </div>
        )
    }

    return (
        <div className={`grid gap-2 rounded-2xl overflow-hidden border border-border dark:border-white/10 ${photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'}`}>
            {photos.slice(0, 4).map((photo, i) => (
                <div
                    key={photo.id}
                    className={`relative overflow-hidden bg-muted dark:bg-[#1a1a1a] cursor-pointer group ${photos.length === 3 && i === 0 ? 'row-span-2' : 'aspect-square'}`}
                    onClick={() => onPhotoClick(i)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPhotoClick(i); }}}
                    tabIndex={0}
                    role="button"
                >
                    <Image src={photo.url} alt={`Photo ${i}`} fill className="object-cover transition-transform hover:scale-110 duration-500" />
                    {photos.length > 4 && i === 3 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm group-hover:bg-black/40 transition-colors">
                            <span className="text-xl font-bold text-white">+{photos.length - 4}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}

function InteractionButton({ icon: Icon, label, active, onClick, danger, disabled }: { icon: React.ElementType, label: string, active: boolean, onClick: () => void, danger?: boolean, disabled?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`group flex items-center gap-2 rounded-full px-3 py-1.5 transition-all active:scale-95 disabled:opacity-50 ${
                active 
                ? (danger ? 'bg-red-500/10 text-red-500' : 'bg-primary/10 text-primary') 
                : 'text-muted-foreground hover:bg-muted dark:hover:bg-white/5'
            }`}
        >
            <Icon className={`size-4 transition-transform group-hover:scale-110 ${active && !danger ? 'fill-current' : ''}`} />
            <span className="text-xs font-bold">{label}</span>
        </button>
    )
}
