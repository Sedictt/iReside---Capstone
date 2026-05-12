"use client"

import { FormEvent, useEffect, useRef, useState, useTransition } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { AnimatePresence, m as motion } from "framer-motion"
import { MessageCircle } from "lucide-react"
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
    getSavedPostIds,
    reportPost,
    toggleReaction,
    toggleSavePost,
    togglePinPost,
    updateOwnPost,
    deleteOwnPost,
    updateComment,
    deleteComment,
    votePoll
} from "@/lib/community/actions"
import type { CommunityPost, CommunityReactionType } from "@/lib/community/types"
import { useAuth } from "@/hooks/useAuth"
import { useOptionalProperty } from "@/context/PropertyContext"

// New Components
import { CommunityHeader } from "@/components/community/CommunityHeader"
import { CommunityComposer } from "@/components/community/CommunityComposer"
import { CommunityPostCard } from "@/components/community/CommunityPostCard"
import { CommunityRules } from "@/components/community/CommunityRules"
import { CommunityAnnouncement } from "@/components/community/CommunityAnnouncement"
import { CommunityTour } from "@/components/tenant/CommunityTour"

function formatRelative(value: string) {
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

function getAnnouncementConfig(title: string | null | undefined, content: string | null | undefined) {
    const text = `${title || ""} ${content || ""}`.toLowerCase()
    const isUtility = text.includes("water") || text.includes("power") || text.includes("electric") || text.includes("interruption") || text.includes("maintenance") || text.includes("repair") || text.includes("outage")

    if (isUtility) {
        return {
            color: "text-amber-600 dark:text-amber-400",
            bg: "bg-amber-50 dark:bg-amber-950/40",
            cardBorder: "border-amber-500/30",
            cardBg: "bg-amber-50/50 dark:bg-amber-950/20",
            badge: "Utility Alert"
        }
    }

    return {
        color: "text-primary",
        bg: "bg-primary/10",
        cardBorder: "border-primary/20",
        cardBg: "bg-primary/5",
        badge: "Management Notice"
    }
}

export default function TenantCommunityHubPage() {
    const { user, profile, loading } = useAuth()
    const userRole = (user?.user_metadata?.role as string | undefined) || profile?.role || 'tenant'
    const isManagementUser = userRole === 'landlord' || userRole === 'admin'
    const propertyContext = useOptionalProperty()
    const shouldUseNavbarPropertySelector = isManagementUser && propertyContext !== null

    const [showRules, setShowRules] = useState(false)
    const [isAnnouncementCollapsed, setIsAnnouncementCollapsed] = useState(false)
    const [activeTab, setActiveTab] = useState<"live" | "mine" | "saved" | "approvals">("live")
    const [searchQuery, setSearchQuery] = useState("")
    const [posts, setPosts] = useState<CommunityPost[]>([])
    const [savedPostIds, setSavedPostIds] = useState<string[]>([])
    const [openCommentPostId, setOpenCommentPostId] = useState<string | null>(null)
    const [commentsByPost, setCommentsByPost] = useState<Record<string, any[]>>({})
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
    const activePropertyId = shouldUseNavbarPropertySelector ? (contextSelectedPropertyId === "all" ? "" : contextSelectedPropertyId) : selectedPropertyId

    const [isMutatingPost, startPostMutation] = useTransition()
    const [isSubmitting, startSubmit] = useTransition()
    const [uploadingPhotos, setUploadingPhotos] = useState(false)
    const voteRequestSeqRef = useRef<Record<string, number>>({})

    const loadPosts = async (mode: "replace" | "append") => {
        if (!user?.id) return
        setLoadingFeed(true)
        try {
            const targetCursor = mode === "append" ? cursor || undefined : undefined
            const response = await getCurrentTenantPosts(12, targetCursor, activePropertyId || undefined)
            setPosts((current) => mode === "replace" ? response.posts : [...current, ...response.posts])
            setCursor(response.nextCursor)
        } catch (err) {
            setError("Failed to load community feed.")
        } finally {
            setLoadingFeed(false)
        }
    }

    const loadPendingPosts = async () => {
        setLoadingPendingPosts(true)
        try {
            const response = await getCurrentTenantPendingPosts(20)
            setPendingPosts(response)
        } finally {
            setLoadingPendingPosts(false)
        }
    }

    const loadModerationPosts = async () => {
        setLoadingModerationPosts(true)
        try {
            const response = await getPendingResidentPostsForModeration(20, activePropertyId || undefined)
            setModerationPosts(response)
        } finally {
            setLoadingModerationPosts(false)
        }
    }

    useEffect(() => {
        if (loading || !user?.id) return
        void loadPosts("replace")
    }, [loading, user?.id, activePropertyId])

    useEffect(() => {
        if (loading || !user?.id || !isManagementUser || shouldUseNavbarPropertySelector) return
        getManagementProperties().then(setManagementProperties).catch(console.error)
    }, [loading, user?.id, isManagementUser, shouldUseNavbarPropertySelector])

    useEffect(() => {
        if (loading || !user?.id) return
        if (activeTab === "approvals" && isManagementUser) {
            void loadModerationPosts()
        } else if (activeTab === "mine" && !isManagementUser) {
            void loadPendingPosts()
        }
    }, [loading, user?.id, activeTab, isManagementUser, activePropertyId])

    useEffect(() => {
        if (loading || !user?.id) return
        getSavedPostIds().then(setSavedPostIds).catch(console.error)
    }, [loading, user?.id])

    const handleEditPost = async (postId: string, title: string, content: string) => {
        startPostMutation(async () => {
            try {
                await updateOwnPost(postId, { title, content })
                await loadPosts("replace")
            } catch {
                setError("Failed to update post.")
            }
        })
    }

    const handleDeletePost = async (postId: string) => {
        startPostMutation(async () => {
            try {
                await deleteOwnPost(postId)
                setPosts(current => current.filter(p => p.id !== postId))
            } catch {
                setError("Failed to delete post.")
            }
        })
    }

    const handlePinPost = async (postId: string) => {
        startPostMutation(async () => {
            try {
                const result = await togglePinPost(postId)
                setPosts(current => current.map(p => p.id === postId ? { ...p, is_pinned: result.isPinned } : p))
            } catch {
                setError("Failed to update pin status.")
            }
        })
    }

    const handleToggleSave = async (postId: string) => {
        try {
            const { saved } = await toggleSavePost(postId)
            setSavedPostIds(prev => saved ? [...prev, postId] : prev.filter(id => id !== postId))
        } catch {
            setError("Failed to update saved status.")
        }
    }

    const handleEditComment = async (commentId: string, content: string) => {
        startPostMutation(async () => {
            try {
                await updateComment(commentId, content)
                setCommentsByPost(prev => {
                    const updated = { ...prev }
                    for (const postId in updated) {
                        updated[postId] = updated[postId].map(c =>
                            c.id === commentId ? { ...c, content } : c
                        )
                    }
                    return updated
                })
            } catch {
                setError("Failed to update comment.")
            }
        })
    }

    const handleDeleteComment = async (commentId: string) => {
        startPostMutation(async () => {
            try {
                await deleteComment(commentId)
                setCommentsByPost(prev => {
                    const updated = { ...prev }
                    for (const postId in updated) {
                        updated[postId] = updated[postId].filter(c => c.id !== commentId)
                    }
                    return updated
                })
                setPosts(current => current.map(p => ({
                    ...p,
                    commentCount: p.commentCount > 0 ? p.commentCount - 1 : 0
                })))
            } catch {
                setError("Failed to delete comment.")
            }
        })
    }

    const handleComposerSubmit = (data: { title: string, body: string, type: string, pollOptions: string[], photos: File[] }) => {
        startSubmit(async () => {
            try {
                const propId = activePropertyId || undefined
                let imageUrls: string[] = []

                if (data.photos.length > 0) {
                    setUploadingPhotos(true)
                    const formData = new FormData()
                    data.photos.forEach(file => formData.append("files", file))
                    const res = await fetch("/api/community/media", { method: "POST", body: formData })
                    if (!res.ok) throw new Error("Upload failed")
                    const json = await res.json()
                    imageUrls = json.imageUrls
                }

                // If photos are present, it must be a photo album post
                const effectiveType = imageUrls.length > 0 ? "photo_album" : data.type

                if (effectiveType === "photo_album") {
                    await createPhotoAlbumPost({ title: data.title, content: data.body, propertyId: propId, imageUrls })
                } else if (effectiveType === "announcement") {
                    await createAnnouncementPost({ title: data.title, content: data.body, propertyId: propId })
                } else if (effectiveType === "poll") {
                    await createPollPost({ title: data.title, content: data.body, options: data.pollOptions, propertyId: propId })
                } else {
                    await createDiscussionPost({ title: data.title, content: data.body, propertyId: propId })
                }

                await loadPosts("replace")
                if (isManagementUser) loadModerationPosts()
                else loadPendingPosts()
            } catch (err) {
                setError("Failed to create post.")
            } finally {
                setUploadingPhotos(false)
            }
        })
    }

    const handleVote = (post: CommunityPost, optionIndex: number) => {
        const previousVotes = post.pollVotes
        const previousUserVote = post.userPollVote
        const optimisticVotes = [
            ...post.pollVotes.filter(v => v.user_id !== user?.id),
            { option_index: optionIndex, user_id: user?.id! }
        ]

        setPosts(current => current.map(p => p.id === post.id ? { ...p, pollVotes: optimisticVotes, userPollVote: optionIndex } : p))

        const seq = (voteRequestSeqRef.current[post.id] || 0) + 1
        voteRequestSeqRef.current[post.id] = seq

        startPostMutation(async () => {
            try {
                const result = await votePoll(post.id, optionIndex)
                if (voteRequestSeqRef.current[post.id] === seq) {
                    setPosts(current => current.map(p => p.id === post.id ? { ...p, pollVotes: result.pollVotes, userPollVote: result.userPollVote } : p))
                }
            } catch {
                if (voteRequestSeqRef.current[post.id] === seq) {
                    setPosts(current => current.map(p => p.id === post.id ? { ...p, pollVotes: previousVotes, userPollVote: previousUserVote } : p))
                }
            }
        })
    }

    const reactRequestSeqRef = useRef<Record<string, number>>({})

    const handleReact = (post: CommunityPost, type: CommunityReactionType) => {
        const hasReaction = post.userReactions.some(r => r.reaction_type === type)
        const previousReactions = { ...post.reactions }
        const previousUserReactions = [...post.userReactions]

        // Optimistic update
        const newReactions = { ...post.reactions }
        newReactions[type] = Math.max(0, (newReactions[type] || 0) + (hasReaction ? -1 : 1))
        
        const newUserReactions = hasReaction 
            ? post.userReactions.filter(r => r.reaction_type !== type)
            : [...post.userReactions, { reaction_type: type }]

        setPosts(current => current.map(p => p.id === post.id ? { ...p, reactions: newReactions, userReactions: newUserReactions } : p))

        const seq = (reactRequestSeqRef.current[post.id] || 0) + 1
        reactRequestSeqRef.current[post.id] = seq

        startPostMutation(async () => {
            try {
                const result = await toggleReaction(post.id, type)
                if (reactRequestSeqRef.current[post.id] === seq) {
                    setPosts(current => current.map(p => p.id === post.id ? { ...p, reactions: result.reactions, userReactions: result.userReactions } : p))
                }
            } catch {
                if (reactRequestSeqRef.current[post.id] === seq) {
                    setPosts(current => current.map(p => p.id === post.id ? { ...p, reactions: previousReactions, userReactions: previousUserReactions } : p))
                }
            }
        })
    }


    const handleCommentSubmit = async (post: CommunityPost, content: string) => {
        startPostMutation(async () => {
            try {
                const result = await addComment(post.id, content)
                const comments = await getPostComments(post.id)
                setCommentsByPost(prev => ({ ...prev, [post.id]: comments }))
                setPosts(current => current.map(p => p.id === post.id ? { ...p, commentCount: result.commentCount } : p))
            } catch (err) {
                setError("Failed to add comment.")
            }
        })
    }

    const handleToggleComments = async (postId: string) => {
        if (openCommentPostId === postId) {
            setOpenCommentPostId(null)
            return
        }
        setOpenCommentPostId(postId)
        if (!commentsByPost[postId]) {
            setLoadingCommentsPostId(postId)
            try {
                const comments = await getPostComments(postId)
                setCommentsByPost(prev => ({ ...prev, [postId]: comments }))
            } finally {
                setLoadingCommentsPostId(null)
            }
        }
    }

    const handleModerationDecision = (postId: string, approved: boolean) => {
        startPostMutation(async () => {
            try {
                await approveResidentPost(postId, approved)
                await loadPosts("replace")
                await loadModerationPosts()
            } catch {
                setError("Moderation action failed.")
            }
        })
    }

    const [reportModalPostId, setReportModalPostId] = useState<string | null>(null)
    const [reportReason, setReportReason] = useState("")

    const handleReportSubmit = async () => {
        if (!reportModalPostId || !reportReason.trim()) return
        startPostMutation(async () => {
            try {
                await reportPost(reportModalPostId, reportReason)
                setReportModalPostId(null)
                setReportReason("")
            } catch {
                setError("Failed to submit report.")
            }
        })
    }

    const topAnnouncement = posts.find(p => p.type === "announcement")
    const announcementConfig = topAnnouncement ? getAnnouncementConfig(topAnnouncement.title, topAnnouncement.content) : null
    const feedPosts = posts.filter(p => p.type !== "announcement")
    const visiblePosts = feedPosts.filter(p => {
        const matchesSearch = `${p.title} ${p.content} ${p.author_name}`.toLowerCase().includes(searchQuery.toLowerCase())
        if (!matchesSearch) return false
        if (activeTab === "mine") return p.author_id === user?.id
        if (activeTab === "saved") return savedPostIds.includes(p.id)
        if (activeTab === "approvals") return false
        return true
    })

    const userInitial = (profile?.full_name || user?.email || "U").charAt(0).toUpperCase()

    const pathname = usePathname()
    const isTenantRoute = pathname === "/tenant/community"

    return (
        <div className={cn(
            "w-full min-h-full",
            isTenantRoute ? "pb-12" : "mx-auto max-w-7xl px-4 pb-20 pt-8 md:px-8"
        )}>
            <CommunityTour />
            
            <CommunityHeader
                title="Community Hub"
                description="Stay connected with your neighbors, discover events, and join the conversation."
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onToggleRules={() => setShowRules(!showRules)}
                showRules={showRules}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                isManagementUser={isManagementUser}
                managementProperties={managementProperties}
                selectedPropertyId={selectedPropertyId}
                onPropertySelect={setSelectedPropertyId}
                isPropertyDropdownOpen={isPropertyDropdownOpen}
                setIsPropertyDropdownOpen={setIsPropertyDropdownOpen}
                shouldUseNavbarPropertySelector={shouldUseNavbarPropertySelector}
                profile={profile}
                userInitial={userInitial}
                pendingCount={pendingPosts.length}
            />

            <div className="relative mt-8 space-y-8">
                <AnimatePresence>
                    {showRules && <CommunityRules onClose={() => setShowRules(false)} />}
                </AnimatePresence>

                <CommunityAnnouncement 
                    announcement={topAnnouncement}
                    config={announcementConfig}
                    isCollapsed={isAnnouncementCollapsed}
                    onToggle={setIsAnnouncementCollapsed}
                    formatRelative={formatRelative}
                />

                <main className="space-y-8">
                    <CommunityComposer 
                        isManagementUser={isManagementUser}
                        profile={profile}
                        userInitial={userInitial}
                        isSubmitting={isSubmitting}
                        uploadingPhotos={uploadingPhotos}
                        onSubmit={handleComposerSubmit}
                    />

                    {error && (
                        <motion.div 
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm font-bold text-red-600"
                        >
                            {error}
                        </motion.div>
                    )}

                    {(activeTab === "approvals" || (activeTab === "mine" && !isManagementUser)) && (
                        <div className="space-y-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                                {activeTab === "approvals" ? "Moderation Queue" : "Your Pending Posts"}
                            </h3>
                            <div className="grid gap-6 md:grid-cols-2">
                                {(activeTab === "approvals" ? moderationPosts : pendingPosts).map(post => (
                                    <CommunityPostCard 
                                        key={post.id}
                                        post={post}
                                        isPending={true}
                                        isManagementUser={isManagementUser}
                                        onModerationDecision={handleModerationDecision}
                                        isSaved={false}
                                        onToggleSave={() => {}}
                                        onReact={() => {}}
                                        onVote={() => {}}
                                        onReport={() => {}}
                                        onToggleComments={() => {}}
                                        isOpen={false}
                                        comments={[]}
                                        loadingComments={false}
                                        onCommentSubmit={() => {}}
                                        isMutating={isMutatingPost}
                                    />
                                ))}
                            </div>
                            {(activeTab === "approvals" ? moderationPosts : pendingPosts).length === 0 && (
                                <div className="rounded-3xl border border-dashed border-border p-12 text-center text-muted-foreground">
                                    No pending posts to show.
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab !== "approvals" && (
                        <div className="space-y-8">
                            {visiblePosts.map(post => (
                                <CommunityPostCard
                                    key={post.id}
                                    post={post}
                                    isSaved={savedPostIds.includes(post.id)}
                                    onToggleSave={handleToggleSave}
                                    onReact={handleReact}
                                    onVote={handleVote}
                                    onReport={(id) => setReportModalPostId(id)}
                                    onToggleComments={handleToggleComments}
                                    onEditPost={handleEditPost}
                                    onDeletePost={handleDeletePost}
                                    onPinPost={handlePinPost}
                                    isOpen={openCommentPostId === post.id}
                                    comments={commentsByPost[post.id] || []}
                                    loadingComments={loadingCommentsPostId === post.id}
                                    onCommentSubmit={handleCommentSubmit}
                                    onEditComment={handleEditComment}
                                    onDeleteComment={handleDeleteComment}
                                    isMutating={isMutatingPost}
                                    currentUserId={user?.id}
                                    isManagementUser={isManagementUser}
                                />
                            ))}
                            
                            {visiblePosts.length === 0 && !loadingFeed && (
                                <div className="rounded-[2.5rem] border border-dashed border-border bg-muted/20 p-20 text-center">
                                    <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-muted">
                                        <MessageCircle className="size-5" />
                                    </div>
                                    <h3 className="mt-4 text-lg font-bold text-foreground">No posts found</h3>
                                    <p className="mt-2 text-muted-foreground">Try adjusting your search or tab to see more content.</p>
                                </div>
                            )}

                            {cursor && activeTab === "live" && (
                                <div className="flex justify-center pt-8">
                                    <button 
                                        onClick={() => loadPosts("append")}
                                        disabled={loadingFeed}
                                        className="rounded-full border border-border px-10 py-3 text-sm font-bold transition-all hover:bg-muted"
                                    >
                                        {loadingFeed ? "Loading..." : "Load More"}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>

            <AnimatePresence>
                {reportModalPostId && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-2xl"
                        >
                            <h3 className="text-xl font-bold text-foreground">Report Content</h3>
                            <p className="mt-2 text-sm text-muted-foreground">Help us understand what's wrong with this post. Your report is confidential.</p>
                            
                            <textarea
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="Why are you reporting this?..."
                                className="mt-6 min-h-[120px] w-full rounded-2xl border border-border bg-background/50 p-4 text-sm outline-none focus:border-primary/50"
                            />

                            <div className="mt-8 flex gap-3">
                                <button 
                                    onClick={() => setReportModalPostId(null)}
                                    className="flex-1 rounded-xl border border-border py-2.5 text-sm font-bold text-muted-foreground hover:bg-muted"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleReportSubmit}
                                    disabled={!reportReason.trim()}
                                    className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:brightness-110 disabled:opacity-50"
                                >
                                    Submit Report
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}

function Megaphone(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m3 11 18-5v12L3 14v-3z" />
            <path d="M11.6 16.8a3 3 0 1 1-5.8-1.6" />
        </svg>
    )
}

