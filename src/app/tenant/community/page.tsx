"use client"

import { FormEvent, useEffect, useRef, useState, useTransition, ComponentType } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    addComment,
    approveResidentPost,
    createAnnouncementPost,
    createDiscussionPost,
    createPhotoAlbumPost,
    createPollPost,
    getPendingResidentPostsForModeration,
    getCurrentTenantPendingPosts,
    getCurrentTenantPosts,
    getPostComments,
    getManagementProperties,
    reportPost,
    toggleReaction,
    votePoll
} from "@/lib/community/actions"
import type { CommunityPost, CommunityReactionType } from "@/lib/community/types"
import { useAuth } from "@/hooks/useAuth"
import { useOptionalProperty } from "@/context/PropertyContext"
import {
    Bell,
    Bookmark,
    Flag,
    Heart,
    MessageCircle,
    Megaphone,
    PartyPopper,
    ThumbsUp,
    Clapperboard,
    MoreHorizontal,
    Search,
    ImageIcon,
    Pin,
    X,
    Send,
    Check,
    XCircle,
    ChevronDown,
    Building2
} from "lucide-react"
import { CommunityTour } from "@/components/tenant/CommunityTour";

const REACTIONS: Array<{ key: CommunityReactionType; label: string; icon: ComponentType<{ className?: string }> }> = [
    { key: "like", label: "Like", icon: ThumbsUp },
    { key: "heart", label: "Heart", icon: Heart },
    { key: "thumbs_up", label: "Thumbs Up", icon: ThumbsUp },
    { key: "clap", label: "Clap", icon: Clapperboard },
    { key: "celebration", label: "Celebrate", icon: PartyPopper }
]

const REPORT_REASON_PRESETS = [
    "Spam",
    "Harassment",
    "False information",
    "Off-topic",
    "Inappropriate content"
]

function formatRelative(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
        return "Just now"
    }

    const diffMs = Date.now() - date.getTime()
    const minutes = Math.floor(diffMs / 60000)
    if (minutes < 1) return "Just now"
    if (minutes < 60) return `${minutes}m ago`

    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`

    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

function getPollOptions(metadata: CommunityPost["metadata"]): string[] {
    const meta = metadata as { options?: unknown; poll_options?: unknown } | null
    const raw = meta?.options || meta?.poll_options
    if (!Array.isArray(raw)) {
        return []
    }

    return raw.filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
}

function getAnnouncementConfig(title: string | null | undefined, content: string | null | undefined) {
    const text = `${title || ""} ${content || ""}`.toLowerCase()
    
    // Keywords that trigger the UTILITY ALERT (Orange) style
    const isUtility = text.includes("water") || 
                     text.includes("power") || 
                     text.includes("electric") || 
                     text.includes("interruption") || 
                     text.includes("maintenance") || 
                     text.includes("repair") ||
                     text.includes("outage")

    if (isUtility) {
        return {
            color: "text-orange-500",
            bg: "bg-orange-500/10",
            border: "border-orange-500/20",
            cardBg: "bg-gradient-to-br from-orange-500/[0.08] to-orange-500/[0.02]",
            cardBorder: "border-orange-500/10",
            badge: "UTILITY ALERT",
            iconColor: "text-orange-500/40"
        }
    }

    return {
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/10",
        cardBg: "bg-gradient-to-br from-emerald-500/[0.06] to-emerald-500/[0.01]",
        cardBorder: "border-emerald-500/10",
        badge: "MANAGEMENT NOTICE",
        iconColor: "text-emerald-500/40"
    }
}

export default function TenantCommunityHubPage() {
    const { user, profile, loading } = useAuth()
    const userRole = (user?.user_metadata?.role as string | undefined) || profile?.role || 'tenant'
    const isManagementUser = userRole === 'landlord' || userRole === 'admin'
    const propertyContext = useOptionalProperty()
    const shouldUseNavbarPropertySelector = isManagementUser && propertyContext !== null
    const communityHubLabel = "Community Hub"

    const [showRules, setShowRules] = useState(false)
    const [isAnnouncementCollapsed, setIsAnnouncementCollapsed] = useState(false)
    const [activeTab, setActiveTab] = useState<"live" | "mine" | "saved" | "approvals">("live")
    const [searchQuery, setSearchQuery] = useState("")
    const [posts, setPosts] = useState<CommunityPost[]>([])
    const [savedPostIds, setSavedPostIds] = useState<string[]>([])
    const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null)
    const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({})
    const [commentsByPost, setCommentsByPost] = useState<Record<string, Array<{
        id: string
        postId: string
        authorId: string
        authorName: string
        authorAvatar: string | null
        authorAvatarBgColor: string | null
        content: string
        parentCommentId: string | null
        createdAt: string
    }>>>({})
    const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<string | null>(null)
    const [cursor, setCursor] = useState<string | null>(null)
    const [loadingFeed, setLoadingFeed] = useState(false)
    const [pendingPosts, setPendingPosts] = useState<CommunityPost[]>([])
    const [moderationPosts, setModerationPosts] = useState<CommunityPost[]>([])
    const [loadingPendingPosts, setLoadingPendingPosts] = useState(false)
    const [loadingModerationPosts, setLoadingModerationPosts] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const [managementProperties, setManagementProperties] = useState<Array<{ id: string; name: string }>>([])
    const [selectedPropertyId, setSelectedPropertyId] = useState<string>("")
    const [isPropertyDropdownOpen, setIsPropertyDropdownOpen] = useState(false)
    const contextSelectedPropertyId = propertyContext?.selectedPropertyId ?? "all"
    const activePropertyId =
        shouldUseNavbarPropertySelector
            ? (contextSelectedPropertyId === "all" ? "" : contextSelectedPropertyId)
            : selectedPropertyId

    const [discussionTitle, setDiscussionTitle] = useState("")
    const [discussionBody, setDiscussionBody] = useState("")
    const [composerType, setComposerType] = useState<"discussion" | "poll" | "announcement">("discussion")
    const [pollOptions, setPollOptions] = useState<string[]>(["", ""])
    const [reportModalPostId, setReportModalPostId] = useState<string | null>(null)
    const [reportReason, setReportReason] = useState("")

    const [selectedPhotos, setSelectedPhotos] = useState<File[]>([])
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadingPhotos, setUploadingPhotos] = useState(false)

    const [isSubmittingDiscussion, startSubmitDiscussion] = useTransition()
    const [isMutatingPost, startPostMutation] = useTransition()
    const voteRequestSeqRef = useRef<Record<string, number>>({})

    const loadPosts = async (mode: "replace" | "append") => {
        if (!user?.id) return

        setLoadingFeed(true)
        setError(null)

        try {
            const targetCursor = mode === "append" ? cursor || undefined : undefined
            const propId = activePropertyId || undefined
            const response = await getCurrentTenantPosts(12, targetCursor, propId)

            setPosts((current) => {
                if (mode === "replace") return response.posts
                return [...current, ...response.posts]
            })
            setCursor(response.nextCursor)
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load community posts.")
        } finally {
            setLoadingFeed(false)
        }
    }

    const loadPendingPosts = async () => {
        if (!user?.id) return

        setLoadingPendingPosts(true)
        try {
            const response = await getCurrentTenantPendingPosts(20)
            setPendingPosts(response)
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load pending posts.")
        } finally {
            setLoadingPendingPosts(false)
        }
    }

    const loadModerationPosts = async () => {
        if (!user?.id || !isManagementUser) return

        setLoadingModerationPosts(true)
        try {
            const propId = activePropertyId || undefined
            const response = await getPendingResidentPostsForModeration(20, propId)
            setModerationPosts(response)
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : "Failed to load moderation queue.")
        } finally {
            setLoadingModerationPosts(false)
        }
    }

    useEffect(() => {
        if (loading || !user?.id) return
        void loadPosts("replace")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, user?.id, activePropertyId])

    useEffect(() => {
        if (loading || !user?.id || !isManagementUser || shouldUseNavbarPropertySelector) return
        
        async function fetchProps() {
            try {
                const props = await getManagementProperties()
                setManagementProperties(props)
                if (props.length > 0) {
                    setSelectedPropertyId(curr => curr || props[0].id)
                }
            } catch (err) {
                console.error("Failed to load management properties:", err)
            }
        }
        void fetchProps()
    }, [loading, user?.id, isManagementUser, shouldUseNavbarPropertySelector])

    useEffect(() => {
        if (loading || !user?.id) return

        if (activeTab === "approvals" && isManagementUser) {
            void loadModerationPosts()
            return
        }

        if (activeTab === "mine" && !isManagementUser) {
            void loadPendingPosts()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loading, user?.id, activeTab, isManagementUser, activePropertyId])

    const handleDiscussionSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (!discussionBody.trim() && !discussionTitle.trim() && selectedPhotos.length === 0) return

        startSubmitDiscussion(async () => {
            try {
                const propId = activePropertyId || undefined
                
                if (selectedPhotos.length > 0) {
                    setUploadingPhotos(true)
                    const formData = new FormData()
                    selectedPhotos.forEach(file => formData.append("files", file))
                    
                    const uploadRes = await fetch("/api/community/media", {
                        method: "POST",
                        body: formData
                    })

                    if (!uploadRes.ok) {
                        const errorData = await uploadRes.json()
                        throw new Error(errorData.error || "Failed to upload photos.")
                    }

                    const { imageUrls } = await uploadRes.json()

                    await createPhotoAlbumPost({ title: discussionTitle || "Photo Share", content: discussionBody, propertyId: propId, imageUrls })
                } else if (composerType === "announcement") {
                    await createAnnouncementPost({ title: discussionTitle || "Community Announcement", content: discussionBody, propertyId: propId })
                } else if (composerType === "poll") {
                    await createPollPost({
                        title: discussionTitle || "Resident Poll",
                        content: discussionBody,
                        options: pollOptions,
                        propertyId: propId
                    })
                } else {
                    await createDiscussionPost({ title: discussionTitle || "Community Post", content: discussionBody, propertyId: propId })
                }

                setDiscussionTitle("")
                setDiscussionBody("")
                setPollOptions(["", ""])
                setSelectedPhotos([])
                await loadPosts("replace")
                if (isManagementUser) {
                    await loadModerationPosts()
                } else {
                    await loadPendingPosts()
                }
            } catch (submitError) {
                setError(submitError instanceof Error ? submitError.message : "Failed to submit post.")
            } finally {
                setUploadingPhotos(false)
            }
        })
    }

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
            setSelectedPhotos(prev => [...prev, ...newFiles].slice(0, 4)) // Max 4
        }
    }
    
    const removePhoto = (index: number) => {
        setSelectedPhotos(prev => prev.filter((_, i) => i !== index))
    }


    const handleModerationDecision = (postId: string, approved: boolean) => {
        startPostMutation(async () => {
            try {
                await approveResidentPost(postId, approved)
                await loadPosts("replace")
                await loadModerationPosts()
            } catch (moderationError) {
                setError(moderationError instanceof Error ? moderationError.message : "Unable to update moderation status.")
            }
        })
    }

    const updatePost = (postId: string, update: Partial<CommunityPost>) => {
        setPosts(current => current.map(post => (post.id === postId ? { ...post, ...update } : post)))
    }

    const handleReact = (post: CommunityPost, reactionType: CommunityReactionType) => {
        startPostMutation(async () => {
            try {
                const result = await toggleReaction(post.id, reactionType)
                updatePost(post.id, { reactions: result.reactions, userReactions: result.userReactions })
            } catch {
                // ignore
            }
        })
    }

    const handleVote = (post: CommunityPost, optionIndex: number) => {
        if (!user?.id) {
            setError("You must be signed in to vote.")
            return
        }

        const currentUserId = user.id
        const previousPollVotes = post.pollVotes
        const previousUserPollVote = Number.isInteger(post.userPollVote) ? post.userPollVote : null
        const optimisticVotes = [
            ...post.pollVotes.filter((vote) => vote.user_id !== currentUserId),
            { option_index: optionIndex, user_id: currentUserId }
        ]

        updatePost(post.id, { pollVotes: optimisticVotes, userPollVote: optionIndex })

        const nextSequence = (voteRequestSeqRef.current[post.id] || 0) + 1
        voteRequestSeqRef.current[post.id] = nextSequence

        startPostMutation(async () => {
            try {
                const result = await votePoll(post.id, optionIndex)
                if (voteRequestSeqRef.current[post.id] !== nextSequence) {
                    return
                }

                updatePost(post.id, { pollVotes: result.pollVotes, userPollVote: result.userPollVote })
            } catch (voteError) {
                if (voteRequestSeqRef.current[post.id] !== nextSequence) {
                    return
                }

                updatePost(post.id, { pollVotes: previousPollVotes, userPollVote: previousUserPollVote })
                setError(voteError instanceof Error ? voteError.message : "Unable to record your vote.")
            }
        })
    }

    const handleToggleSaved = (postId: string) => {
        setSavedPostIds((current) =>
            current.includes(postId) ? current.filter((id) => id !== postId) : [...current, postId]
        )
    }

    const handleCommentSubmit = (post: CommunityPost) => {
        const draft = commentDrafts[post.id] || ""
        if (!draft.trim()) return

        startPostMutation(async () => {
            try {
                const result = await addComment(post.id, draft)
                updatePost(post.id, { commentCount: result.commentCount })
                setCommentDrafts((current) => ({ ...current, [post.id]: "" }))
                const comments = await getPostComments(post.id)
                setCommentsByPost((current) => ({ ...current, [post.id]: comments }))
            } catch (commentError) {
                setError(commentError instanceof Error ? commentError.message : "Unable to add comment.")
            }
        })
    }

    const handleToggleComments = (postId: string) => {
        const isCurrentlyOpen = openCommentPostId === postId
        if (isCurrentlyOpen) {
            setOpenCommentPostId(null)
            return
        }

        setOpenCommentPostId(postId)

        if (commentsByPost[postId]) {
            return
        }

        setLoadingCommentsPostId(postId)
        void getPostComments(postId)
            .then((comments) => {
                setCommentsByPost((current) => ({ ...current, [postId]: comments }))
            })
            .catch((loadError) => {
                setError(loadError instanceof Error ? loadError.message : "Unable to load comments.")
            })
            .finally(() => {
                setLoadingCommentsPostId((current) => (current === postId ? null : current))
            })
    }

    const handleReportPost = (postId: string) => {
        setReportModalPostId(postId)
        setReportReason("")
    }

    const closeReportModal = () => {
        if (isMutatingPost) return
        setReportModalPostId(null)
        setReportReason("")
    }

    const handleSubmitReport = () => {
        const postId = reportModalPostId
        if (!postId) return

        const reason = reportReason.trim()
        if (!reason) {
            setError("Please provide a reason for the report.")
            return
        }

        startPostMutation(async () => {
            try {
                await reportPost(postId, reason)
                setReportModalPostId(null)
                setReportReason("")
            } catch (reportError) {
                setError(reportError instanceof Error ? reportError.message : "Unable to report this post.")
            }
        })
    }

    const handleLoadMore = () => {
        if (!cursor || loadingFeed) return
        void loadPosts("append")
    }

    const userInitial = (profile?.full_name || user?.email || "U").charAt(0).toUpperCase()
    const primaryReaction = REACTIONS.find((reaction) => reaction.key === "thumbs_up") || REACTIONS[0]
    const PrimaryReactionIcon = primaryReaction.icon
    const reportTargetPost = reportModalPostId ? posts.find((post) => post.id === reportModalPostId) || null : null
    const topAnnouncement = posts.find((post) => post.type === "announcement")
    const feedPosts = posts.filter((post) => post.type !== "announcement")
    const filteredBySearch = feedPosts.filter((post) => {
        const haystack = `${post.title || ""} ${post.content || ""} ${post.author_name || ""}`.toLowerCase()
        return haystack.includes(searchQuery.trim().toLowerCase())
    })
    const visiblePosts = filteredBySearch.filter((post) => {
        if (activeTab === "mine") return post.author_id === user?.id
        if (activeTab === "saved") return savedPostIds.includes(post.id)
        if (activeTab === "approvals") return false
        return true
    })
    const announcementConfig = topAnnouncement ? getAnnouncementConfig(topAnnouncement.title, topAnnouncement.content) : null
    const containerTopPadding = topAnnouncement
        ? isAnnouncementCollapsed
            ? "1.5rem"
            : "8.5rem"
        : "1.5rem"

    return (
        <>
            <AnimatePresence>
                {topAnnouncement && isAnnouncementCollapsed && (
                    <motion.button
                        key="collapsed-icon"
                        initial={{ opacity: 0, x: 50, scale: 0.8 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 50, scale: 0.8 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        type="button"
                        onClick={() => setIsAnnouncementCollapsed(false)}
                        className="fixed right-3 top-1/2 z-[95] flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-border bg-background/90 text-muted-foreground shadow-lg backdrop-blur-xl transition-colors hover:bg-muted hover:text-foreground dark:border-white/15 dark:bg-[#121212]/90 dark:text-white/80 dark:hover:bg-[#171717] dark:hover:text-white md:right-5"
                        aria-label="Expand announcement"
                        title="Expand announcement"
                    >
                        <Megaphone className="w-5 h-5" />
                    </motion.button>
                )}

                {topAnnouncement && announcementConfig && !isAnnouncementCollapsed && (
                    <motion.div 
                        key="expanded-banner"
                        initial={{ opacity: 0, y: -50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -50 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="fixed inset-x-0 top-0 z-[90] px-3 pt-2 md:px-8 md:pt-3"
                        data-tour-id="tour-community-announcements"
                    >
                        <div className="max-w-[1600px] mx-auto">
                            <div className={`${announcementConfig.cardBg} ${announcementConfig.cardBorder} overflow-hidden rounded-2xl border shadow-lg backdrop-blur-xl md:rounded-3xl dark:shadow-2xl`}>
                                <div className="px-4 py-3 md:px-6 md:py-4 flex items-start gap-3 md:gap-4">
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border ${announcementConfig.bg} ${announcementConfig.color} dark:border-white/10`}>
                                        <Megaphone className="w-5 h-5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className={`text-[10px] font-bold ${announcementConfig.color} ${announcementConfig.bg} px-2.5 py-1 rounded-full tracking-widest uppercase border ${announcementConfig.border}`}>
                                                {announcementConfig.badge}
                                            </span>
                                            <Pin className={`w-4 h-4 ${announcementConfig.iconColor}`} />
                                            <span className="text-xs text-muted-foreground/80 dark:text-white/35">{formatRelative(topAnnouncement.created_at)}</span>
                                        </div>

                                        <h2 className="truncate text-sm font-semibold leading-tight text-foreground dark:text-white md:text-base">
                                            {topAnnouncement.title || "Community Announcement"}
                                        </h2>
                                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground dark:text-white/60 md:line-clamp-none">
                                            {topAnnouncement.content}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsAnnouncementCollapsed(true)}
                                        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border border-border bg-background/70 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                                        aria-label="Close announcement"
                                        title="Close announcement"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        <div className="w-full font-sans pb-12 px-4 md:px-8 max-w-[1600px] mx-auto min-h-screen" style={{ paddingTop: containerTopPadding }}>
            <CommunityTour />
            {/* Top Navigation Header */}
            <header className="group relative mb-12 overflow-hidden rounded-3xl border border-border shadow-sm dark:border-white/10 dark:shadow-2xl">
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-sky-500/10 to-emerald-500/10 opacity-70 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-teal-500/10 dark:opacity-50" />
                    <div className="absolute inset-0 bg-card/92 backdrop-blur-xl dark:bg-[#0a0a0a]/80" />
                </div>
                <div className="relative z-10 grid gap-8 p-8 md:p-12 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.9fr)] xl:items-start">
                    <div className="flex min-w-0 flex-col gap-5">
                        <div className="flex flex-col gap-4">
                            <h1 className="text-3xl font-display font-medium text-foreground md:text-5xl dark:text-white">
                                {communityHubLabel}
                            </h1>
                            <p className="max-w-2xl text-base font-light text-muted-foreground md:text-lg dark:text-white/60">Stay connected with your neighbors, discover events, and join the conversation.</p>
                        </div>

                        {isManagementUser && managementProperties.length > 0 && !shouldUseNavbarPropertySelector && (
                            <div className="relative z-50 w-full max-w-sm">
                                <button 
                                    type="button"
                                    onClick={() => setIsPropertyDropdownOpen(!isPropertyDropdownOpen)}
                                    className="group flex min-w-[200px] w-full cursor-pointer items-center justify-between gap-2 rounded-xl border border-border bg-background/85 px-4 py-2.5 text-sm text-foreground shadow-sm backdrop-blur-xl transition-colors hover:bg-muted dark:border-white/10 dark:bg-[#1a1a1a]/80 dark:text-white dark:shadow-lg dark:hover:bg-[#222]"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Building2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                                        <span className="font-medium truncate">
                                            {managementProperties.find(p => p.id === selectedPropertyId)?.name || 'Select Property'}
                                        </span>
                                    </div>
                                    <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform dark:text-white/40 ${isPropertyDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>
                                
                                <AnimatePresence>
                                    {isPropertyDropdownOpen && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-40" 
                                                onClick={() => setIsPropertyDropdownOpen(false)} 
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                                                transition={{ duration: 0.15, ease: "easeOut" }}
                                                className="absolute left-0 top-full z-50 mt-2 w-[280px] overflow-hidden rounded-xl border border-border bg-popover/95 shadow-[0_10px_40px_-10px_rgba(15,23,42,0.35)] ring-1 ring-border/60 backdrop-blur-xl dark:border-white/10 dark:bg-[#1a1a1a]/95 dark:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.7)] dark:ring-white/5"
                                            >
                                                <div className="max-h-[300px] overflow-y-auto p-1.5 scrollbar-hide">
                                                    {managementProperties.length > 1 ? (
                                                        managementProperties.map(p => (
                                                            <button
                                                                key={p.id}
                                                                onClick={() => {
                                                                    setSelectedPropertyId(p.id)
                                                                    setIsPropertyDropdownOpen(false)
                                                                }}
                                                                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 flex items-center justify-between group/item ${
                                                                    selectedPropertyId === p.id 
                                                                    ? 'bg-emerald-500/10 text-emerald-700 font-medium dark:text-emerald-400' 
                                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white'
                                                                }`}
                                                            >
                                                                <span className="truncate pr-2">{p.name || `Property ${p.id.substring(0,6)}`}</span>
                                                                {selectedPropertyId === p.id && <Check className="w-4 h-4 shrink-0" />}
                                                            </button>
                                                        ))
                                                    ) : (
                                                        <div className="px-3 py-2.5 text-center text-xs text-muted-foreground dark:text-white/40">
                                                            Only 1 property managed
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex w-full flex-col gap-4 xl:items-end">
                        <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center xl:max-w-[520px]">
                            <div className="relative flex-1 group">
                            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-foreground dark:text-white/40 dark:group-focus-within:text-white/80" />
                            <input
                                type="text"
                                placeholder="Search discussions..."
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="w-full rounded-full border border-border bg-background/75 py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:ring-1 focus:ring-primary/20 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:ring-white/30"
                            />
                        </div>
                            <div className="flex items-center justify-end gap-3 sm:w-auto">
                                <button 
                                    onClick={() => setShowRules(!showRules)}
                                    className={`rounded-full border p-3 backdrop-blur-md transition-all ${showRules ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_15px_rgba(var(--primary-rgb),0.25)]' : 'border-transparent bg-background/75 text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground dark:bg-white/5 dark:text-white/60 dark:hover:border-white/10 dark:hover:bg-white/10 dark:hover:text-white'}`} 
                                    title="View Community Rules"
                                    data-tour-id="tour-community-rules"
                                >
                                    <Flag className="w-5 h-5" />
                                </button>
                                <button className="relative rounded-full border border-transparent bg-background/75 p-3 text-muted-foreground backdrop-blur-md transition-all hover:border-border hover:bg-muted hover:text-foreground dark:bg-white/5 dark:text-white/60 dark:hover:border-white/10 dark:hover:bg-white/10 dark:hover:text-white">
                                    <Bell className="w-5 h-5" />
                                    <span className="absolute right-2.5 top-2 h-2 w-2 animate-pulse rounded-full bg-emerald-500 ring-2 ring-background dark:bg-emerald-400 dark:ring-[#121212]"></span>
                                </button>
                                <div 
                                    className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border text-foreground shadow-sm dark:border-white/20 dark:text-white dark:shadow-lg"
                                    style={{ backgroundColor: profile?.avatar_bg_color || undefined }}
                                >
                                    {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : userInitial}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* HORIZONTAL NAVIGATION PILLS */}
            <div 
                className="flex items-center gap-3 overflow-x-auto pb-4 mb-2 scrollbar-hide px-1 relative z-10"
                data-tour-id="tour-community-tabs"
            >
                <button
                    onClick={() => setActiveTab("live")}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${activeTab === "live" ? "border border-border bg-card text-foreground shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white dark:hover:shadow-lg"}`}
                >
                    <Megaphone className="w-[18px] h-[18px]" />
                    Live Feed
                </button>
                <button
                    onClick={() => setActiveTab("mine")}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${activeTab === "mine" ? "border border-border bg-card text-foreground shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white dark:hover:shadow-lg"}`}
                >
                    <MessageCircle className="w-[18px] h-[18px]" />
                    My Posts
                </button>
                {isManagementUser && (
                    <button
                        onClick={() => setActiveTab("approvals")}
                        className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${activeTab === "approvals" ? "border border-border bg-card text-foreground shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white dark:hover:shadow-lg"}`}
                    >
                        <Check className="w-[18px] h-[18px]" />
                        Approvals
                    </button>
                )}
                <button
                    onClick={() => setActiveTab("saved")}
                    className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-6 py-3 text-sm font-semibold transition-all duration-300 ${activeTab === "saved" ? "border border-border bg-card text-foreground shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-white dark:shadow-[0_0_15px_rgba(255,255,255,0.05)]" : "border border-transparent text-muted-foreground hover:bg-muted hover:text-foreground dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white dark:hover:shadow-lg"}`}
                >
                    <Bookmark className="w-[18px] h-[18px]" />
                    Saved Posts
                </button>
            </div>

            <div className="w-full space-y-8 relative">
                
                {/* COMMUNITY RULES OVERLAY */}
                {showRules && (
                    <div className="absolute inset-x-0 top-0 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="overflow-hidden rounded-3xl border border-primary/20 bg-card/95 shadow-[0_20px_50px_rgba(15,23,42,0.18)] backdrop-blur-2xl dark:bg-[#121212]/95 dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                            <div className="flex items-center justify-between border-b border-border p-6 dark:border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-primary/20 text-primary">
                                        <Flag className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-lg font-display font-medium text-foreground dark:text-white">Community Rules</h3>
                                </div>
                                <button onClick={() => setShowRules(false)} className="text-muted-foreground transition-colors hover:text-foreground dark:text-white/40 dark:hover:text-white">
                                    <MoreHorizontal className="w-5 h-5 rotate-90" />
                                </button>
                            </div>
                            <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">1</div>
                                    <p className="text-sm font-medium text-foreground/90 dark:text-white/80">Post Approval</p>
                                    <p className="text-xs font-light leading-relaxed text-muted-foreground dark:text-white/40">All discussion posts require management approval before appearing.</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">2</div>
                                    <p className="text-sm font-medium text-foreground/90 dark:text-white/80">Respect Others</p>
                                    <p className="text-xs font-light leading-relaxed text-muted-foreground dark:text-white/40">Be respectful, polite, and neighborly. Toxicity will not be tolerated.</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">3</div>
                                    <p className="text-sm font-medium text-foreground/90 dark:text-white/80">No Spam</p>
                                    <p className="text-xs font-light leading-relaxed text-muted-foreground dark:text-white/40">No spam, repetitive posts, or unrelated commercial promos.</p>
                                </div>
                            </div>
                            <div className="flex justify-center bg-muted/35 p-4 dark:bg-white/5">
                                <button onClick={() => setShowRules(false)} className="text-[10px] font-bold uppercase tracking-widest text-primary transition-colors hover:text-foreground dark:hover:text-white">Got it, thanks!</button>
                            </div>
                        </div>
                    </div>
                )}
                

                {/* CENTER FEED */}
                <main className="flex-1 min-w-0 w-full space-y-8">
                    {/* Create Post Input */}
                    <section 
                        className="group relative mb-8 overflow-hidden rounded-3xl border border-border bg-card shadow-sm dark:border-white/10 dark:bg-[#151515] dark:shadow-2xl"
                        data-tour-id="tour-community-create-post"
                    >
                        <form onSubmit={handleDiscussionSubmit} className="relative z-10">
                            <div className="p-6">
                                {isManagementUser && (
                                    <div className="mb-5 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setComposerType("discussion")}
                                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${composerType === "discussion" ? "border-border bg-muted text-foreground dark:border-white/25 dark:bg-white/15 dark:text-white" : "border-border bg-background/70 text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:text-white"}`}
                                        >
                                            Discussion
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setComposerType("poll")}
                                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${composerType === "poll" ? "border-border bg-muted text-foreground dark:border-white/25 dark:bg-white/15 dark:text-white" : "border-border bg-background/70 text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:text-white"}`}
                                        >
                                            Poll
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setComposerType("announcement")}
                                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${composerType === "announcement" ? "border-border bg-muted text-foreground dark:border-white/25 dark:bg-white/15 dark:text-white" : "border-border bg-background/70 text-muted-foreground hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/60 dark:hover:text-white"}`}
                                        >
                                            Announcement
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <div 
                                        className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border text-foreground shadow-inner dark:border-white/10 dark:text-white"
                                        style={{ backgroundColor: profile?.avatar_bg_color || undefined }}
                                    >
                                        {profile?.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" /> : userInitial}
                                    </div>
                                    <div className="flex-1">
                                        {(composerType !== "discussion" || discussionTitle.length > 0) && (
                                            <input
                                                type="text"
                                                placeholder={composerType === "announcement" ? "Announcement title" : composerType === "poll" ? "Poll title" : "Title (optional)"}
                                                value={discussionTitle}
                                                onChange={(e) => setDiscussionTitle(e.target.value)}
                                                className="w-full border-none bg-transparent px-6 pb-1 pt-3 text-[17px] font-medium text-foreground outline-none placeholder:text-muted-foreground focus:ring-0 dark:text-white dark:placeholder:text-white/20"
                                            />
                                        )}
                                        <textarea
                                            value={discussionBody}
                                            onChange={(event) => setDiscussionBody(event.target.value)}
                                            placeholder={composerType === "announcement" ? "Share an important property update..." : composerType === "poll" ? "Ask a poll question..." : "What's on your mind, neighbor?..."}
                                            className={`block h-auto min-h-[48px] w-full resize-none overflow-hidden rounded-3xl border border-border bg-background/75 px-6 py-3 text-[15px] text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-primary/20 focus:bg-background dark:border-white/5 dark:bg-white/5 dark:text-white dark:placeholder:text-white/20 dark:focus:border-white/10 dark:focus:bg-white/10 ${discussionTitle.length > 0 ? 'mt-2' : ''}`}
                                            required
                                        />

                                        {composerType === "poll" && (
                                            <div className="mt-3 space-y-2">
                                                {pollOptions.map((option, index) => (
                                                    <input
                                                        key={index}
                                                        type="text"
                                                        value={option}
                                                        onChange={(event) => {
                                                            const next = [...pollOptions]
                                                            next[index] = event.target.value
                                                            setPollOptions(next)
                                                        }}
                                                        placeholder={`Option ${index + 1}`}
                                                        className="w-full rounded-xl border border-border bg-background/75 px-4 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary/25 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/30 dark:focus:border-white/30"
                                                    />
                                                ))}
                                                <div className="flex gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setPollOptions((current) => (current.length < 5 ? [...current, ""] : current))}
                                                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground dark:border-white/15 dark:text-white/75 dark:hover:text-white"
                                                    >
                                                        Add Option
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPollOptions((current) => (current.length > 2 ? current.slice(0, -1) : current))}
                                                        className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground dark:border-white/15 dark:text-white/60 dark:hover:text-white"
                                                    >
                                                        Remove Option
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col gap-4 border-t border-border p-4 dark:border-white/5">
                                {selectedPhotos.length > 0 && (
                                    <div className="flex gap-2 overflow-x-auto px-2 pb-2">
                                        {selectedPhotos.map((photo, index) => (
                                            <div key={index} className="group relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-border dark:border-white/10">
                                                <img src={URL.createObjectURL(photo)} alt={`Selected ${index + 1}`} className="w-full h-full object-cover" />
                                                <button type="button" onClick={() => removePhoto(index)} className="absolute top-1 right-1 bg-black/60 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 md:gap-4 px-2">
                                        <input 
                                            type="file" 
                                            ref={fileInputRef} 
                                            className="hidden" 
                                            accept="image/*" 
                                            multiple 
                                            onChange={handlePhotoSelect} 
                                        />
                                        <button 
                                            type="button" 
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={selectedPhotos.length >= 4}
                                            className="group/btn flex items-center gap-2 rounded-xl px-3 py-2 text-muted-foreground transition-all hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 dark:text-white/40 dark:hover:bg-white/5 dark:hover:text-white"
                                        >
                                            <ImageIcon className="w-4 h-5 group-hover/btn:text-purple-400 transition-colors" />
                                            <span className="text-xs font-medium">Photo</span>
                                        </button>
                                    </div>
                                        <button type="submit" disabled={isSubmittingDiscussion || uploadingPhotos || (!discussionBody.trim() && !discussionTitle.trim() && selectedPhotos.length === 0)} className="rounded-full bg-primary px-8 py-2.5 text-sm font-bold tracking-wide text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-30">
                                        {uploadingPhotos ? "Uploading..." : isSubmittingDiscussion ? "Posting..." : composerType === "announcement" ? "Publish" : composerType === "poll" ? "Create Poll" : "Post"}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </section>

                    {/* Feed Loading & Error States */}
                    {error && (
                        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-700 backdrop-blur-md dark:text-red-300">{error}</div>
                    )}
                    {loadingFeed && posts.length === 0 && (
                        <div className="p-16 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary dark:border-white/20 dark:border-t-white" />
                            <p className="text-sm font-medium text-muted-foreground dark:text-white/50">Loading community feed...</p>
                        </div>
                    )}

                    {/* Posts List */}
                    <div className="space-y-6">
                        {activeTab === "mine" && !isManagementUser && (
                            <section className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_45%)]" />
                                <div className="relative p-6 md:p-8">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200/90 font-bold">Moderation Queue</p>
                                            <h3 className="text-xl md:text-2xl font-display text-white mt-1">Pending Review</h3>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-full border border-amber-200/25 bg-amber-300/10 text-amber-100 text-xs font-semibold">
                                            {pendingPosts.length} {pendingPosts.length === 1 ? "post" : "posts"} waiting
                                        </div>
                                    </div>

                                    {loadingPendingPosts ? (
                                        <div className="grid gap-3 md:grid-cols-2 animate-pulse">
                                            {[1, 2].map((item) => (
                                                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                                                    <div className="h-4 w-1/2 rounded bg-white/10" />
                                                    <div className="h-3 w-full rounded bg-white/10" />
                                                    <div className="h-3 w-3/4 rounded bg-white/10" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : pendingPosts.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-emerald-300/20 bg-emerald-400/5 p-6 text-center">
                                            <p className="text-emerald-100 font-medium">No pending posts right now.</p>
                                            <p className="text-emerald-200/60 text-sm mt-1">Once you submit a new post, it will appear here until approved.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {pendingPosts.map((pendingPost) => (
                                                <div key={pendingPost.id} className="rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] transition-colors p-4">
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <p className="text-white/90 font-semibold truncate">{pendingPost.title || "Untitled post"}</p>
                                                        <span className="shrink-0 rounded-full border border-amber-200/25 bg-amber-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-100">Pending</span>
                                                    </div>
                                                    {pendingPost.content && (
                                                        <p className="text-sm text-white/60 line-clamp-2">{pendingPost.content}</p>
                                                    )}
                                                    <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                                                        <span className="capitalize">{pendingPost.type.replace("_", " ")}</span>
                                                        <span>{formatRelative(pendingPost.created_at)}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {activeTab === "approvals" && isManagementUser && (
                            <section className="relative overflow-hidden rounded-3xl border border-amber-300/20 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                                <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_right,rgba(251,191,36,0.18),transparent_45%)]" />
                                <div className="relative p-6 md:p-8">
                                    <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                                        <div>
                                            <p className="text-[11px] uppercase tracking-[0.22em] text-amber-200/90 font-bold">Moderation Queue</p>
                                            <h3 className="text-xl md:text-2xl font-display text-white mt-1">Resident Posts Awaiting Review</h3>
                                        </div>
                                        <div className="px-3 py-1.5 rounded-full border border-amber-200/25 bg-amber-300/10 text-amber-100 text-xs font-semibold">
                                            {moderationPosts.length} {moderationPosts.length === 1 ? "post" : "posts"} waiting
                                        </div>
                                    </div>

                                    {loadingModerationPosts ? (
                                        <div className="grid gap-3 md:grid-cols-2 animate-pulse">
                                            {[1, 2].map((item) => (
                                                <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-2">
                                                    <div className="h-4 w-1/2 rounded bg-white/10" />
                                                    <div className="h-3 w-full rounded bg-white/10" />
                                                    <div className="h-3 w-3/4 rounded bg-white/10" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : moderationPosts.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-emerald-300/20 bg-emerald-400/5 p-6 text-center">
                                            <p className="text-emerald-100 font-medium">No pending posts right now.</p>
                                            <p className="text-emerald-200/60 text-sm mt-1">Resident submissions will appear here for approval.</p>
                                        </div>
                                    ) : (
                                        <div className="grid gap-3 md:grid-cols-2">
                                            {moderationPosts.map((pendingPost) => (
                                                <div key={pendingPost.id} className="rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.06] transition-colors p-4">
                                                    <div className="flex items-center justify-between gap-2 mb-2">
                                                        <p className="text-white/90 font-semibold truncate">{pendingPost.title || "Untitled post"}</p>
                                                        <span className="shrink-0 rounded-full border border-amber-200/25 bg-amber-300/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-100">Pending</span>
                                                    </div>
                                                    {pendingPost.content && (
                                                        <p className="text-sm text-white/60 line-clamp-2">{pendingPost.content}</p>
                                                    )}
                                                    <div className="mt-3 flex items-center justify-between text-xs text-white/45">
                                                        <span className="capitalize">{pendingPost.type.replace("_", " ")}</span>
                                                        <span>{formatRelative(pendingPost.created_at)}</span>
                                                    </div>
                                                    <div className="mt-3 flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleModerationDecision(pendingPost.id, true)}
                                                            disabled={isMutatingPost}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-300/30 text-emerald-100 text-xs font-semibold hover:bg-emerald-500/30 disabled:opacity-50"
                                                        >
                                                            <Check className="w-3.5 h-3.5" />
                                                            Approve
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleModerationDecision(pendingPost.id, false)}
                                                            disabled={isMutatingPost}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-300/30 text-red-100 text-xs font-semibold hover:bg-red-500/30 disabled:opacity-50"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        {visiblePosts.length === 0 && !loadingFeed && (
                            <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-sm dark:border-white/10 dark:bg-white/5">
                                <p className="font-medium text-foreground dark:text-white/70">No posts found.</p>
                                <p className="mt-2 text-sm text-muted-foreground dark:text-white/40">Try another tab or refine your search query.</p>
                            </div>
                        )}

                        {visiblePosts.map(post => {
                            const isSaved = savedPostIds.includes(post.id)

                            return (
                                <article key={post.id} className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm transition-colors hover:bg-muted/20 dark:border-white/5 dark:bg-[#151515] dark:shadow-xl dark:hover:bg-[#1a1a1a] md:p-8">
                                    <header className="flex items-center justify-between">
                                        <div className="flex items-center gap-3 md:gap-4">
                                            <div 
                                                className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-full border border-border shadow-inner dark:border-white/10 md:h-[46px] md:w-[46px]"
                                                style={{ backgroundColor: post.author_avatar_bg_color || '#e8eedd' }}
                                            >
                                                {post.author_avatar ? (
                                                    <img src={post.author_avatar || undefined} alt={post.author_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="font-bold text-black/60 text-[15px]">{post.author_name.substring(0, 2).toUpperCase()}</span>
                                                )}
                                            </div>
                                            <div className="flex flex-col">
                                                <p className="text-[15px] font-semibold text-foreground dark:text-white/90">
                                                    {post.author_name} 
                                                </p>
                                                <p className="text-[13px] text-muted-foreground dark:text-white/40">{formatRelative(post.created_at)} • {post.author_role === 'landlord' ? 'Management' : 'Tenant'}</p>
                                            </div>
                                        </div>
                                    </header>

                                    {post.type === 'photo_album' && post.album && post.album.photos && post.album.photos.length > 0 ? (
                                        <div className="mt-3 mb-2">
                                            {post.album.photos.length === 1 && (
                                                <div className="relative w-full rounded-2xl overflow-hidden bg-[#1a1a1a] aspect-[4/3] sm:aspect-[16/9] border border-white/10 group cursor-pointer shadow-xl">
                                                    <img src={post.album.photos[0].url} alt={post.title || 'Photo'} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                                </div>
                                            )}

                                            {post.album.photos.length === 2 && (
                                                <div className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black/30">
                                                    {post.album.photos.map(photo => (
                                                        <div key={photo.id} className="relative aspect-[4/5] sm:aspect-square group cursor-pointer overflow-hidden bg-[#1a1a1a]">
                                                            <img src={photo.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" alt="Album photo" />
                                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {post.album.photos.length === 3 && (
                                                <div className="grid grid-cols-2 grid-rows-2 gap-1 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black/30 h-[300px] sm:h-[400px]">
                                                    <div className="relative row-span-2 group cursor-pointer overflow-hidden bg-[#1a1a1a]">
                                                        <img src={post.album.photos[0].url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" alt="Album photo 1" />
                                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                                                    </div>
                                                    <div className="relative group cursor-pointer overflow-hidden bg-[#1a1a1a]">
                                                        <img src={post.album.photos[1].url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" alt="Album photo 2" />
                                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                                                    </div>
                                                    <div className="relative group cursor-pointer overflow-hidden bg-[#1a1a1a]">
                                                        <img src={post.album.photos[2].url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" alt="Album photo 3" />
                                                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                                                    </div>
                                                </div>
                                            )}

                                            {post.album.photos.length >= 4 && (
                                                <div className="grid grid-cols-2 grid-rows-2 gap-1 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-black/30 aspect-square sm:aspect-[4/3]">
                                                    {post.album.photos.slice(0, 4).map((photo, i) => (
                                                        <div key={photo.id} className="relative group cursor-pointer overflow-hidden bg-[#1a1a1a]">
                                                            <img src={photo.url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" alt={`Album photo ${i + 1}`} />
                                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                                                            {post.album!.photos.length > 4 && i === 3 && (
                                                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm group-hover:bg-black/50 transition-colors duration-500">
                                                                    <span className="text-white text-3xl font-light tracking-wider shadow-sm">+{post.album!.photos.length - 4}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ) : post.album ? (
                                        <div className="relative w-full rounded-2xl overflow-hidden mt-3 mb-2 bg-[#1a1a1a] aspect-[4/3] sm:aspect-[16/9] border border-white/10 group cursor-pointer shadow-xl">
                                            <img src={post.album.cover_photo_url || undefined} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000 ease-out" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        </div>
                                    ) : null}

                                    <div className="space-y-2 mt-2">
                                        {post.title && <h3 className="font-display text-[17px] font-medium leading-tight text-foreground dark:text-white/90">{post.title}</h3>}
                                        {post.content && <p className="whitespace-pre-wrap text-[16px] font-light leading-relaxed text-muted-foreground dark:text-white/70">{post.content}</p>}
                                    </div>

                                    {post.type === 'poll' && (
                                        <div className="mt-2 space-y-3">
                                            {getPollOptions(post.metadata).map((option, idx) => {
                                                const normalizedUserVote = Number.isInteger(post.userPollVote) ? post.userPollVote : null
                                                const hasVoted = normalizedUserVote !== null
                                                const optionVotes = post.pollVotes.filter((v: { option_index: number }) => v.option_index === idx).length
                                                const selected = normalizedUserVote === idx
                                                const total = Math.max(post.pollVotes.length, 1)
                                                const pct = hasVoted ? Math.round((optionVotes / total) * 100) : 0

                                                return (
                                                    <button 
                                                        key={idx} 
                                                        onClick={() => handleVote(post, idx)} 
                                                        className={`relative w-full text-left py-3 px-4 rounded-xl border overflow-hidden transition-all duration-300 group ${selected ? 'border-primary/50 shadow-[0_0_15px_rgba(109,152,56,0.15)] bg-primary/10' : 'border-white/10 bg-[#121212] hover:border-white/20'} cursor-pointer`}
                                                    >
                                                        {hasVoted && (
                                                            <div className={`absolute left-0 top-0 bottom-0 ${selected ? 'bg-primary/20' : 'bg-white/5'} transition-all duration-1000 ease-out`} style={{width: `${pct}%`}}></div>
                                                        )}
                                                        <div className="relative z-10 flex justify-between items-center text-[14px]">
                                                            <span className={`font-medium tracking-wide flex items-center gap-3 ${selected ? 'text-primary' : 'text-white/80 group-hover:text-white'}`}>
                                                                <div className={`w-[18px] h-[18px] rounded-full border flex items-center justify-center shrink-0 transition-colors ${selected ? 'border-primary' : 'border-white/30 group-hover:border-white/50'}`}>
                                                                    {selected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                                                                </div>
                                                                {option}
                                                            </span>
                                                            {hasVoted && (
                                                                <span className={`font-bold ${selected ? 'text-primary' : 'text-white/40'}`}>{pct}%</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                )
                                            })}
                                            <div className="pt-1 text-[13px] font-medium text-muted-foreground dark:text-white/40">
                                                {post.pollVotes.length} {post.pollVotes.length === 1 ? 'vote' : 'votes'}
                                            </div>
                                        </div>
                                    )}

                                    <footer className="mt-4 flex items-center gap-6 border-t border-border pt-5 dark:border-white/5">
                                        <button
                                            onClick={() => handleToggleComments(post.id)}
                                            className="group flex items-center gap-2 border-none bg-transparent text-[14px] font-semibold text-muted-foreground transition-colors hover:bg-transparent hover:text-foreground dark:text-white/50 dark:hover:text-white"
                                        >
                                            <MessageCircle className="w-[18px] h-[18px] group-hover:text-white transition-colors" /> 
                                            {post.commentCount || 0} Comments
                                        </button>
                                        <button 
                                            onClick={() => handleReact(post, primaryReaction.key)}
                                            disabled={isMutatingPost}
                                            className={`group flex items-center gap-2 border-none bg-transparent text-[14px] font-semibold transition-colors hover:bg-transparent ${post.userReactions.length > 0 ? 'text-primary' : 'text-muted-foreground hover:text-foreground dark:text-white/50 dark:hover:text-white'}`}
                                        >
                                            <PrimaryReactionIcon className={`w-[18px] h-[18px] ${post.userReactions.length > 0 ? 'fill-primary text-primary' : 'group-hover:-translate-y-0.5 transition-transform'}`} /> 
                                            {post.reactions?.thumbs_up || post.userReactions.length || 0} Kudos
                                        </button>
                                        <button
                                            onClick={() => handleToggleSaved(post.id)}
                                            className={`flex items-center gap-2 border-none bg-transparent text-[14px] font-semibold transition-colors hover:bg-transparent ${isSaved ? 'text-primary' : 'text-muted-foreground hover:text-foreground dark:text-white/50 dark:hover:text-white'}`}
                                        >
                                            <Bookmark className={`w-[18px] h-[18px] ${isSaved ? 'fill-primary text-primary' : ''}`} />
                                            {isSaved ? 'Saved' : 'Save'}
                                        </button>
                                        <button
                                            onClick={() => handleReportPost(post.id)}
                                            disabled={isMutatingPost}
                                            className="flex items-center gap-2 border-none bg-transparent text-[14px] font-semibold text-muted-foreground transition-colors hover:bg-transparent hover:text-red-600 dark:text-white/50 dark:hover:text-red-300"
                                        >
                                            <Flag className="w-[18px] h-[18px]" />
                                            Report
                                        </button>
                                    </footer>

                                    <AnimatePresence>
                                        {openCommentPostId === post.id && (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                exit={{ opacity: 0, height: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="overflow-hidden"
                                            >
                                                <div className="mt-4 space-y-6 border-t border-border pt-6 dark:border-white/5">
                                                    {loadingCommentsPostId === post.id ? (
                                                        <div className="space-y-4 animate-pulse">
                                                            {[1, 2].map(i => (
                                                                <div key={i} className="flex gap-4">
                                                                    <div className="h-9 w-9 shrink-0 rounded-full bg-muted dark:bg-white/10" />
                                                                    <div className="flex-1 space-y-2 py-1">
                                                                        <div className="h-3 w-24 rounded bg-muted dark:bg-white/10" />
                                                                        <div className="h-14 w-full rounded-2xl rounded-tl-sm bg-muted/70 dark:bg-white/5" />
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (commentsByPost[post.id] || []).length > 0 ? (
                                                        <div className="space-y-5">
                                                            {(commentsByPost[post.id] || []).map((comment, idx) => (
                                                                <motion.div 
                                                                    initial={{ opacity: 0, y: 10 }}
                                                                    animate={{ opacity: 1, y: 0 }}
                                                                    transition={{ delay: Math.min(idx * 0.05, 0.3) }}
                                                                    key={comment.id} 
                                                                    className="flex gap-3 md:gap-4 group/comment"
                                                                >
                                                                    <div 
                                                                        className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border shadow-inner dark:border-white/5 md:h-10 md:w-10"
                                                                        style={{ backgroundColor: comment.authorAvatarBgColor || undefined }}
                                                                    >
                                                                        {comment.authorAvatar ? (
                                                                            <img src={comment.authorAvatar} alt={comment.authorName} className="w-full h-full object-cover" />
                                                                        ) : (
                                                                            <span className="text-[11px] font-bold text-muted-foreground dark:text-white/50">{comment.authorName.substring(0, 2).toUpperCase()}</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="inline-block min-w-[50%] max-w-full rounded-2xl rounded-tl-sm border border-border bg-muted/35 px-4 py-3 shadow-sm transition-colors hover:bg-muted/45 dark:border-white/[0.05] dark:bg-white/[0.04] dark:hover:bg-white/[0.06]">
                                                                            <div className="flex items-baseline justify-between gap-4 mb-1">
                                                                                <p className="truncate text-[14px] font-medium text-foreground dark:text-white/90">{comment.authorName}</p>
                                                                                <p className="shrink-0 text-[11px] text-muted-foreground dark:text-white/40">{formatRelative(comment.createdAt)}</p>
                                                                            </div>
                                                                            <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-muted-foreground dark:text-white/70">{comment.content}</p>
                                                                        </div>
                                                                        <div className="flex items-center gap-4 mt-1.5 ml-2 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                                                                            <button className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground dark:text-white/40 dark:hover:text-white">Reply</button>
                                                                            <button className="text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground dark:text-white/40 dark:hover:text-white">Like</button>
                                                                        </div>
                                                                    </div>
                                                                </motion.div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border bg-muted/20 py-8 text-center dark:border-white/5 dark:bg-white/[0.02]">
                                                            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted dark:bg-white/5">
                                                                <MessageCircle className="h-5 w-5 text-muted-foreground/70 dark:text-white/20" />
                                                            </div>
                                                            <p className="text-sm font-medium text-muted-foreground dark:text-white/60">No comments yet</p>
                                                            <p className="mt-1 text-xs text-muted-foreground/80 dark:text-white/30">Start the conversation!</p>
                                                        </div>
                                                    )}

                                                    <div className="flex gap-3 md:gap-4 items-start pt-2">
                                                        <div 
                                                            className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full border border-border shadow-inner dark:border-white/5 md:h-10 md:w-10"
                                                            style={{ backgroundColor: profile?.avatar_bg_color || undefined }}
                                                        >
                                                            {profile?.avatar_url ? (
                                                                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-[11px] font-bold text-muted-foreground dark:text-white/50">{userInitial}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex-1 relative group/input">
                                                            <textarea
                                                                value={commentDrafts[post.id] || ""}
                                                                onChange={(event) => {
                                                                    const target = event.target;
                                                                    target.style.height = '52px';
                                                                    target.style.height = `${Math.min(target.scrollHeight, 150)}px`;
                                                                    setCommentDrafts((current) => ({
                                                                        ...current,
                                                                        [post.id]: target.value
                                                                    }));
                                                                }}
                                                                placeholder="Write a comment..."
                                                                className="min-h-[52px] w-full resize-none rounded-3xl border border-border bg-background/75 px-5 py-3.5 pr-14 text-[14px] text-foreground outline-none shadow-inner transition-all placeholder:text-muted-foreground focus:border-primary/50 focus:bg-background focus:ring-1 focus:ring-primary/20 group-hover/input:border-primary/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-white/30 dark:focus:bg-white/[0.05] dark:group-hover/input:border-white/20"
                                                                rows={1}
                                                                style={!(commentDrafts[post.id] || "") ? { height: '52px' } : undefined}
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    handleCommentSubmit(post);
                                                                }}
                                                                disabled={isMutatingPost || !(commentDrafts[post.id] || "").trim()}
                                                                className="absolute right-2 bottom-2 p-2.5 bg-primary text-white rounded-full hover:brightness-110 disabled:opacity-0 disabled:scale-90 transition-all duration-300 outline-none flex items-center justify-center shadow-lg shadow-primary/20"
                                                                title="Post comment"
                                                            >
                                                                <Send className="w-4 h-4 -ml-0.5 mt-px" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </article>
                            )
                        })}

                        {cursor && activeTab === "live" && (
                            <div className="flex justify-center pt-2">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loadingFeed}
                                    className="rounded-full border border-border px-6 py-2.5 text-foreground transition-all hover:bg-muted disabled:opacity-50 dark:border-white/15 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                                >
                                    {loadingFeed ? "Loading..." : "Load More Posts"}
                                </button>
                            </div>
                        )}
                    </div>
                </main>

            </div>
        </div>

        <AnimatePresence>
            {reportModalPostId && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[120]"
                >
                    <button
                        type="button"
                        className="absolute inset-0 bg-slate-950/55 backdrop-blur-md dark:bg-black/70"
                        onClick={closeReportModal}
                        aria-label="Close report modal"
                    />

                    <div className="absolute inset-0 p-4 md:p-8 flex items-center justify-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 20, scale: 0.96 }}
                            transition={{ type: "spring", damping: 24, stiffness: 280 }}
                            className="w-full max-w-xl overflow-hidden rounded-3xl border border-border bg-card/95 shadow-[0_30px_80px_rgba(15,23,42,0.2)] backdrop-blur-2xl dark:border-white/15 dark:bg-[#121212]/95 dark:shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
                        >
                            <div className="relative border-b border-border px-6 pb-4 pt-6 dark:border-white/10 md:px-8 md:pt-8">
                                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-orange-500/5 to-transparent pointer-events-none" />
                                <div className="relative flex items-start justify-between gap-4">
                                    <div className="space-y-2">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/10 border border-red-400/20 text-red-200 text-[11px] tracking-widest uppercase font-bold">
                                            <Flag className="w-3.5 h-3.5" />
                                            Report Post
                                        </div>
                                        <h3 className="text-xl font-display text-foreground dark:text-white md:text-2xl">Help keep this community safe</h3>
                                        <p className="max-w-md text-sm text-muted-foreground dark:text-white/55">Your report is confidential and reviewed by management.</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={closeReportModal}
                                        disabled={isMutatingPost}
                                        className="h-9 w-9 rounded-full border border-border bg-background/75 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 dark:border-white/15 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                                        aria-label="Close"
                                    >
                                        <X className="w-4 h-4 mx-auto" />
                                    </button>
                                </div>
                            </div>

                            <div className="px-6 md:px-8 py-6 space-y-5">
                                {reportTargetPost && (
                                    <div className="rounded-2xl border border-border bg-muted/35 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03]">
                                        <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-muted-foreground dark:text-white/35">Reported Post</p>
                                        <p className="line-clamp-1 text-sm font-medium text-foreground dark:text-white/85">{reportTargetPost.title || "Untitled post"}</p>
                                        {reportTargetPost.content && (
                                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground dark:text-white/50">{reportTargetPost.content}</p>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-foreground dark:text-white/80">Select a reason</p>
                                    <div className="flex flex-wrap gap-2">
                                        {REPORT_REASON_PRESETS.map((preset) => {
                                            const isActive = reportReason.trim().toLowerCase() === preset.toLowerCase()
                                            return (
                                                <button
                                                    key={preset}
                                                    type="button"
                                                    onClick={() => setReportReason(preset)}
                                                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${isActive ? "border-red-300/30 bg-red-500/15 text-red-700 shadow-[0_0_0_3px_rgba(239,68,68,0.08)] dark:text-red-100" : "border-border bg-background/75 text-muted-foreground hover:bg-muted hover:text-foreground dark:border-white/10 dark:bg-white/5 dark:text-white/65 dark:hover:bg-white/10 dark:hover:text-white"}`}
                                                >
                                                    {preset}
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="report-reason" className="text-sm font-semibold text-foreground dark:text-white/80">Details</label>
                                    <textarea
                                        id="report-reason"
                                        value={reportReason}
                                        onChange={(event) => setReportReason(event.target.value)}
                                        placeholder="Tell us what happened..."
                                        className="min-h-[120px] w-full resize-y rounded-2xl border border-border bg-background/75 px-4 py-3 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-red-300/40 focus:ring-2 focus:ring-red-500/20 dark:border-white/10 dark:bg-white/[0.03] dark:text-white dark:placeholder:text-white/30"
                                        maxLength={240}
                                    />
                                    <p className="text-right text-[11px] text-muted-foreground dark:text-white/35">{reportReason.length}/240</p>
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 border-t border-border bg-muted/30 px-6 py-4 dark:border-white/10 dark:bg-white/[0.02] md:px-8">
                                <button
                                    type="button"
                                    onClick={closeReportModal}
                                    disabled={isMutatingPost}
                                    className="rounded-xl border border-border px-4 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50 dark:border-white/15 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmitReport}
                                    disabled={isMutatingPost || !reportReason.trim()}
                                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-semibold hover:brightness-110 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isMutatingPost ? "Sending..." : "Submit Report"}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
        </>
    )
}

