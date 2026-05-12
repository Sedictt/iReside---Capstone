"use client"

import { useState, useRef, useEffect } from "react"
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
    Pin,
    Pencil,
    Trash2,
    Heart,
    X
} from "lucide-react"
import type { CommunityPost, CommunityReactionType } from "@/lib/community/types"
import { CommunityPhotoLightbox } from "./CommunityPhotoLightbox"

interface CommentData {
    id: string
    authorId?: string
    authorAvatarBgColor?: string | null
    authorAvatar?: string | null
    authorName: string
    createdAt: string
    content: string
}

interface CommunityPostCardProps {
    post: CommunityPost
    isSaved: boolean
    onToggleSave: (id: string) => void
    onReact: (post: CommunityPost, type: CommunityReactionType) => void
    onVote: (post: CommunityPost, optionIndex: number) => void
    onReport: (id: string) => void
    onToggleComments: (id: string) => void
    onEditPost?: (id: string, title: string, content: string) => void
    onDeletePost?: (id: string) => void
    onPinPost?: (id: string) => void
    isOpen: boolean
    comments: CommentData[]
    loadingComments: boolean
    onCommentSubmit: (post: CommunityPost, content: string) => void
    onEditComment?: (commentId: string, content: string) => void
    onDeleteComment?: (commentId: string) => void
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
    onEditPost,
    onDeletePost,
    onPinPost,
    isOpen,
    comments,
    loadingComments,
    onCommentSubmit,
    onEditComment,
    onDeleteComment,
    isMutating,
    currentUserId,
    isManagementUser,
    onModerationDecision,
    isPending
}: CommunityPostCardProps) {
    const [commentContent, setCommentContent] = useState("")
    const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
    const [kebabOpen, setKebabOpen] = useState(false)
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
    const [editingCommentContent, setEditingCommentContent] = useState("")
    const [isEditingPost, setIsEditingPost] = useState(false)
    const [editPostTitle, setEditPostTitle] = useState(post.title)
    const [editPostContent, setEditPostContent] = useState(post.content || "")
    const [isExpanded, setIsExpanded] = useState(false)
    const kebabRef = useRef<HTMLDivElement>(null)
    const commentInputRef = useRef<HTMLTextAreaElement>(null)

    const isAuthor = currentUserId === post.author_id

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (kebabRef.current && !kebabRef.current.contains(e.target as Node)) {
                setKebabOpen(false)
            }
        }
        if (kebabOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [kebabOpen])

    useEffect(() => {
        if (isOpen && commentInputRef.current) {
            commentInputRef.current.focus()
        }
    }, [isOpen])

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!commentContent.trim()) return
        onCommentSubmit(post, commentContent)
        setCommentContent("")
    }

    const handleShare = async () => {
        const url = `${window.location.origin}/tenant/community?post=${post.id}`
        await navigator.clipboard.writeText(url)
        setKebabOpen(false)
    }

    const handleEditPost = () => {
        if (onEditPost) {
            onEditPost(post.id, editPostTitle, editPostContent)
        }
        setIsEditingPost(false)
        setKebabOpen(false)
    }

    const handleDeletePost = () => {
        if (onDeletePost && confirm("Are you sure you want to delete this post?")) {
            onDeletePost(post.id)
        }
        setKebabOpen(false)
    }

    const handlePinPost = () => {
        if (onPinPost) {
            onPinPost(post.id)
        }
        setKebabOpen(false)
    }

    const handleEditComment = (comment: CommentData) => {
        setEditingCommentId(comment.id)
        setEditingCommentContent(comment.content)
    }

    const handleSaveCommentEdit = () => {
        if (onEditComment && editingCommentId) {
            onEditComment(editingCommentId, editingCommentContent)
        }
        setEditingCommentId(null)
        setEditingCommentContent("")
    }

    const handleCancelCommentEdit = () => {
        setEditingCommentId(null)
        setEditingCommentContent("")
    }

    const handleDeleteComment = (commentId: string) => {
        if (onDeleteComment && confirm("Delete this comment?")) {
            onDeleteComment(commentId)
        }
    }

    const handleToggleReaction = () => {
        onReact(post, "thumbs_up")
    }

    const handleToggleSave = () => {
        onToggleSave(post.id)
        setKebabOpen(false)
    }

    const menuItems = [
        ...(isAuthor ? [
            { icon: Pencil, label: "Edit Post", onClick: () => { setIsEditingPost(true); setKebabOpen(false) }, danger: false },
            { icon: Trash2, label: "Delete Post", onClick: handleDeletePost, danger: true },
        ] : []),
        ...(isManagementUser ? [
            { icon: Pin, label: post.is_pinned ? "Unpin Post" : "Pin Post", onClick: handlePinPost, danger: false },
        ] : []),
        { icon: Bookmark, label: isSaved ? "Unsave Post" : "Save Post", onClick: handleToggleSave, danger: false },
        { icon: Share2, label: "Copy Link", onClick: handleShare, danger: false },
        { icon: Flag, label: "Report", onClick: () => { onReport(post.id); setKebabOpen(false) }, danger: false },
    ]

    const thumbsUpCount = post.reactions?.thumbs_up || 0
    const hasReacted = post.userReactions.some(r => r.reaction_type === "thumbs_up")

    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex flex-col gap-5 rounded-3xl border border-border/50 bg-card shadow-sm transition-all hover:shadow-md dark:border-white/10 dark:bg-[#151515] ${isPending ? 'opacity-75' : ''}`}
        >
            <header className="flex items-start justify-between gap-4 px-5 pt-5 md:px-6 md:pt-6">
                <div className="flex items-center gap-3">
                    <div
                        className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/50 shadow-sm dark:border-white/20"
                        style={{ backgroundColor: post.author_avatar_bg_color || '#f3f4f6' }}
                    >
                        {post.author_avatar ? (
                            <Image src={post.author_avatar} alt={post.author_name} fill className="object-cover" />
                        ) : (
                            <span className="text-sm font-bold text-foreground/60">{post.author_name.charAt(0).toUpperCase()}</span>
                        )}
                    </div>
                    <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-foreground dark:text-white truncate">
                                {post.author_name}
                            </span>
                            {post.author_role === 'landlord' && (
                                <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                                    Management
                                </span>
                            )}
                            {post.is_pinned && (
                                <Pin className="shrink-0 size-3 text-primary fill-primary" />
                            )}
                        </div>
                        <span className="text-xs text-muted-foreground/60">
                            {formatRelative(post.created_at)}
                        </span>
                    </div>
                </div>

                {!isPending && (
                    <div className="relative" ref={kebabRef}>
                        <button
                            onClick={(e) => { e.stopPropagation(); setKebabOpen(!kebabOpen) }}
                            className="flex size-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 dark:hover:bg-white/10 transition-colors"
                            aria-label="Post options"
                        >
                            <MoreHorizontal className="size-[18px]" />
                        </button>

                        <AnimatePresence>
                            {kebabOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute right-0 top-full z-50 mt-1.5 w-44 overflow-hidden rounded-2xl border border-border bg-popover shadow-lg dark:border-white/10 dark:bg-[#1a1a1a]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-1">
                                        {menuItems.map((item, i) => (
                                            <button
                                                key={i}
                                                onClick={item.onClick}
                                                className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                                                    item.danger
                                                        ? 'text-red-500 hover:bg-red-500/10'
                                                        : 'text-foreground dark:text-white hover:bg-muted/50 dark:hover:bg-white/10'
                                                }`}
                                            >
                                                <item.icon className="size-4" />
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </header>

            {isEditingPost ? (
                <div className="space-y-3 px-5 pb-5 md:px-6" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="text"
                        value={editPostTitle}
                        onChange={(e) => setEditPostTitle(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm font-semibold outline-none transition-all focus:border-primary/50 dark:border-white/10 dark:bg-white/5 dark:text-white"
                        placeholder="Post title..."
                    />
                    <textarea
                        value={editPostContent}
                        onChange={(e) => setEditPostContent(e.target.value)}
                        className="w-full rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary/50 dark:border-white/10 dark:bg-white/5 dark:text-white min-h-[80px] resize-none"
                        placeholder="Post content..."
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleEditPost}
                            disabled={isMutating}
                            className="flex-1 rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={() => { setIsEditingPost(false); setEditPostTitle(post.title); setEditPostContent(post.content || "") }}
                            className="flex-1 rounded-xl border border-border py-2 text-sm font-semibold hover:bg-muted/50 disabled:opacity-50 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div className="px-5 md:px-6 space-y-2">
                        {post.title && (
                            <h3 className="text-base font-semibold text-foreground dark:text-white leading-snug">
                                {post.title}
                            </h3>
                        )}

                        {post.content && (
                            <div>
                                <p className={`text-sm leading-relaxed text-muted-foreground/80 dark:text-white/60 ${isExpanded ? '' : 'line-clamp-3'}`}>
                                    {post.content}
                                </p>
                                {post.content.length > 280 && (
                                    <button
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="mt-1 text-xs font-semibold text-primary hover:underline"
                                    >
                                        {isExpanded ? 'Show less' : 'Read more'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {post.type === 'photo_album' && post.album?.photos && post.album.photos.length > 0 && (
                        <div className="px-5 md:px-6">
                            <PhotoGrid
                                photos={post.album.photos}
                                onPhotoClick={(idx) => setLightboxIndex(idx)}
                            />
                        </div>
                    )}

                    {post.type === 'poll' && (
                        <div className="px-5 md:px-6 space-y-2">
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
                                        className={`group relative w-full overflow-hidden rounded-xl border p-3.5 text-left transition-all ${
                                            selected
                                                ? 'border-primary/50 bg-primary/5'
                                                : 'border-border/50 hover:border-primary/30'
                                        }`}
                                    >
                                        {hasVoted && (
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${pct}%` }}
                                                className={`absolute inset-y-0 left-0 ${selected ? 'bg-primary/10' : 'bg-muted/30'}`}
                                            />
                                        )}
                                        <div className="relative z-10 flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className={`flex size-5 items-center justify-center rounded-full border transition-colors ${selected ? 'border-primary bg-primary text-white' : 'border-border bg-white/80 dark:bg-black/40'}`}>
                                                    {selected && <Check className="size-3 stroke-[3]" />}
                                                </div>
                                                <span className={`text-sm font-medium ${selected ? 'text-primary' : 'text-foreground dark:text-white'}`}>
                                                    {option}
                                                </span>
                                            </div>
                                            {hasVoted && (
                                                <span className={`text-xs font-semibold ${selected ? 'text-primary' : 'text-muted-foreground/60'}`}>
                                                    {pct}%
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </>
            )}

            {isPending ? (
                <div className="mx-5 mb-5 flex items-center justify-between rounded-2xl bg-amber-500/10 p-4 border border-amber-500/20 md:mx-6">
                    <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-full bg-amber-500/20">
                            <Pin className="size-4 text-amber-500" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">Awaiting Moderation</span>
                    </div>
                    {isManagementUser && onModerationDecision && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => onModerationDecision(post.id, true)}
                                className="flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-xs font-semibold text-white hover:brightness-110 transition-all"
                            >
                                <Check className="size-3.5" /> Approve
                            </button>
                            <button
                                onClick={() => onModerationDecision(post.id, false)}
                                className="flex h-8 items-center gap-1.5 rounded-lg bg-red-500 px-3 text-xs font-semibold text-white hover:brightness-110 transition-all"
                            >
                                <XCircle className="size-3.5" /> Reject
                            </button>
                        </div>
                    )}
                </div>
            ) : !isEditingPost && (
                <footer className="flex items-center gap-1 px-4 pb-3 pt-2 md:px-5 border-t border-border/30 dark:border-white/5">
                    <button
                        onClick={handleToggleReaction}
                        disabled={isMutating}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 ${
                            hasReacted
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted/50 dark:hover:bg-white/10'
                        }`}
                    >
                        <ThumbsUp className={`size-4 ${hasReacted ? 'fill-current' : ''}`} />
                        <span className="text-xs font-semibold">{thumbsUpCount > 0 ? thumbsUpCount : 'Like'}</span>
                    </button>

                    <button
                        onClick={() => onToggleComments(post.id)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all active:scale-95 ${
                            isOpen
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted/50 dark:hover:bg-white/10'
                        }`}
                    >
                        <MessageCircle className="size-4" />
                        <span className="text-xs font-semibold">{post.commentCount || 0}</span>
                    </button>

                    <button
                        onClick={() => onToggleSave(post.id)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-all active:scale-95 disabled:opacity-50 ${
                            isSaved
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-muted/50 dark:hover:bg-white/10'
                        }`}
                    >
                        <Bookmark className={`size-4 ${isSaved ? 'fill-current' : ''}`} />
                        <span className="text-xs font-semibold">{isSaved ? 'Saved' : 'Save'}</span>
                    </button>

                    <div className="flex-1" />

                    <button
                        onClick={handleShare}
                        className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/50 dark:hover:bg-white/10 active:scale-95"
                        title="Copy link"
                    >
                        <Share2 className="size-4" />
                    </button>
                </footer>
            )}

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-border/30 dark:border-white/5"
                    >
                        <div className="space-y-4 p-5 md:p-6 bg-muted/20">
                            {loadingComments ? (
                                <div className="space-y-3">
                                    {[1, 2].map(i => (
                                        <div key={i} className="flex gap-3 animate-pulse">
                                            <div className="size-8 rounded-full bg-muted" />
                                            <div className="flex-1 space-y-1.5">
                                                <div className="h-3 w-20 rounded bg-muted" />
                                                <div className="h-10 rounded-xl bg-muted/50" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : comments.length > 0 ? (
                                <div className="space-y-3">
                                    {comments.map((comment) => (
                                        <motion.div
                                            key={comment.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="flex gap-3 group"
                                        >
                                            <div
                                                className="relative flex size-8 shrink-0 items-center justify-center rounded-full border border-border/50 dark:border-white/10"
                                                style={{ backgroundColor: comment.authorAvatarBgColor || '#f3f4f6' }}
                                            >
                                                {comment.authorAvatar ? (
                                                    <Image src={comment.authorAvatar} alt={comment.authorName} fill className="object-cover" />
                                                ) : (
                                                    <span className="text-[10px] font-bold text-foreground/50">{comment.authorName.charAt(0).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                {editingCommentId === comment.id ? (
                                                    <div className="space-y-2">
                                                        <textarea
                                                            value={editingCommentContent}
                                                            onChange={(e) => setEditingCommentContent(e.target.value)}
                                                            className="w-full rounded-xl border border-border bg-background/80 px-3 py-2 text-sm outline-none transition-all focus:border-primary/50 dark:border-white/10 dark:bg-white/5 min-h-[60px] resize-none"
                                                            autoFocus
                                                        />
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={handleSaveCommentEdit}
                                                                disabled={isMutating}
                                                                className="rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                                                            >
                                                                Save
                                                            </button>
                                                            <button
                                                                onClick={handleCancelCommentEdit}
                                                                className="rounded-lg border border-border px-3 py-1 text-xs font-semibold hover:bg-muted/50"
                                                            >
                                                                Cancel
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="rounded-2xl rounded-tl-sm bg-background/80 px-3.5 py-2.5 dark:bg-white/5">
                                                        <div className="flex items-center justify-between gap-2 mb-1">
                                                            <span className="text-xs font-semibold text-foreground dark:text-white">{comment.authorName}</span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-[10px] text-muted-foreground/60">{formatRelative(comment.createdAt)}</span>
                                                                {currentUserId === comment.authorId && onEditComment && onDeleteComment && (
                                                                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                        <button
                                                                            onClick={() => handleEditComment(comment)}
                                                                            className="p-1 text-muted-foreground/60 hover:text-primary rounded hover:bg-primary/10"
                                                                            title="Edit"
                                                                        >
                                                                            <Pencil className="size-3" />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteComment(comment.id)}
                                                                            className="p-1 text-muted-foreground/60 hover:text-red-500 rounded hover:bg-red-500/10"
                                                                            title="Delete"
                                                                        >
                                                                            <Trash2 className="size-3" />
                                                                        </button>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className="text-sm leading-relaxed text-muted-foreground/80 dark:text-white/60">{comment.content}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-6 text-center">
                                    <p className="text-sm text-muted-foreground/60">No comments yet. Start the conversation!</p>
                                </div>
                            )}

                            <form onSubmit={handleCommentSubmit} className="flex gap-2.5 items-start pt-2">
                                <div
                                    className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border/50 dark:border-white/10 bg-background"
                                >
                                    <User className="size-4 text-muted-foreground/50" />
                                </div>
                                <div className="relative flex-1">
                                    <textarea
                                        ref={commentInputRef}
                                        value={commentContent}
                                        onChange={(e) => {
                                            setCommentContent(e.target.value)
                                            e.target.style.height = 'auto'
                                            e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault()
                                                handleCommentSubmit(e as any)
                                            }
                                        }}
                                        placeholder="Write a comment..."
                                        className="w-full rounded-xl border border-border/50 bg-background/80 px-3.5 py-2.5 pr-10 text-sm outline-none transition-all focus:border-primary/50 focus:bg-background dark:border-white/10 dark:bg-white/5 min-h-[44px] max-h-[120px] resize-none"
                                        rows={1}
                                    />
                                    <button
                                        type="submit"
                                        disabled={!commentContent.trim() || isMutating}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-primary hover:scale-110 disabled:opacity-30 transition-all p-1"
                                    >
                                        <Send className="size-4" />
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
                className="relative overflow-hidden rounded-2xl cursor-pointer group min-h-[300px] md:min-h-[400px]"
                onClick={() => onPhotoClick(0)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPhotoClick(0); }}}
                tabIndex={0}
                role="button"
            >
                <Image src={photos[0].url} alt="Post" fill className="object-cover transition-transform duration-500 group-hover:scale-[1.02]" />
            </div>
        )
    }

    return (
        <div className={`grid gap-1.5 rounded-2xl overflow-hidden ${photos.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'}`}>
            {photos.slice(0, 4).map((photo, i) => (
                <div
                    key={photo.id}
                    className={`relative overflow-hidden bg-muted cursor-pointer group aspect-square ${photos.length === 3 && i === 0 ? 'row-span-2' : ''}`}
                    onClick={() => onPhotoClick(i)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPhotoClick(i); }}}
                    tabIndex={0}
                    role="button"
                >
                    <Image src={photo.url} alt={`Photo ${i}`} fill className="object-cover transition-transform hover:scale-[1.03] duration-500" />
                    {photos.length > 4 && i === 3 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 group-hover:bg-black/40 transition-colors">
                            <span className="text-lg font-bold text-white">+{photos.length - 4}</span>
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}