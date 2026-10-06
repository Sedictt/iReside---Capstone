'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Megaphone,
    MessageCircle,
    Heart,
    Pin,
    Plus,
    Search,
    RefreshCw,
    X,
    Send,
    Building2,
    Calendar,
    Clock,
    Sparkles,
    AlertCircle,
    CheckCircle2,
    ThumbsUp,
    Shield,
    Users
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useProperty } from '@/context/PropertyContext';
import { PullToRefresh } from '@/components/mobile/shared/PullToRefresh';
import { MobilePropertySelector } from '@/components/mobile/shared/MobilePropertySelector';
import {
    getCurrentCommunityPosts,
    createAnnouncementPost,
    createDiscussionPost,
    toggleReaction,
    addComment,
    getPostComments
} from '@/lib/community/actions';
import { triggerHaptic } from '@/lib/haptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { CommunityPost } from '@/lib/community/types';

export function MobileCommunityView() {
    const router = useRouter();
    const { profile } = useAuth();
    const { selectedPropertyId } = useProperty();
    const role = (profile?.role as 'tenant' | 'landlord') || 'tenant';
    const isLandlord = role === 'landlord';

    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'announcements' | 'discussions'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Composer State
    const [isComposerOpen, setIsComposerOpen] = useState(false);
    const [postTitle, setPostTitle] = useState('');
    const [postContent, setPostContent] = useState('');
    const [postType, setPostType] = useState<'announcement' | 'discussion'>(isLandlord ? 'announcement' : 'discussion');
    const [submittingPost, setSubmittingPost] = useState(false);

    // Comments Drawer State
    const [activeCommentPost, setActiveCommentPost] = useState<CommunityPost | null>(null);
    const [commentsList, setCommentsList] = useState<any[]>([]);
    const [commentText, setCommentText] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [submittingComment, setSubmittingComment] = useState(false);

    const fetchFeed = useCallback(async () => {
        try {
            setLoading(true);
            const propId = isLandlord && selectedPropertyId && selectedPropertyId !== 'all' 
                ? selectedPropertyId 
                : undefined;

            const res = await getCurrentCommunityPosts(30, undefined, propId);
            setPosts(res?.posts || []);
        } catch (err) {
            console.error('Error fetching community feed:', err);
            // Non-critical toast: graceful fallback
        } finally {
            setLoading(false);
        }
    }, [isLandlord, selectedPropertyId]);

    useEffect(() => {
        fetchFeed();
    }, [fetchFeed]);

    const formatTimeAgo = (dateStr?: string) => {
        if (!dateStr) return 'Just now';
        const d = new Date(dateStr);
        const diffMs = Date.now() - d.getTime();
        const mins = Math.floor(diffMs / (1000 * 60));
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    // Filter posts
    const filteredPosts = useMemo(() => {
        let list = posts;

        if (activeTab === 'announcements') {
            list = list.filter(p => p.type === 'announcement');
        } else if (activeTab === 'discussions') {
            list = list.filter(p => p.type === 'discussion');
        }

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p => {
                const titleMatch = (p.title || '').toLowerCase().includes(q);
                const contentMatch = (p.content || '').toLowerCase().includes(q);
                const authorMatch = (p.author_name || '').toLowerCase().includes(q);
                return titleMatch || contentMatch || authorMatch;
            });
        }

        return list;
    }, [posts, activeTab, searchQuery]);

    // Handle Reaction Toggle
    const handleToggleReaction = async (post: CommunityPost) => {
        triggerHaptic('light');
        const prevPosts = [...posts];

        // Optimistic update
        setPosts(prev => prev.map(p => {
            if (p.id !== post.id) return p;
            const isLiked = (p.userReactions || []).some(r => r.reaction_type === 'like');
            const currentCount = p.reactions?.['like'] || 0;
            return {
                ...p,
                userReactions: isLiked 
                    ? (p.userReactions || []).filter(r => r.reaction_type !== 'like')
                    : [...(p.userReactions || []), { reaction_type: 'like' }],
                reactions: {
                    ...p.reactions,
                    like: isLiked ? Math.max(0, currentCount - 1) : currentCount + 1
                }
            };
        }));

        try {
            await toggleReaction(post.id, 'like');
        } catch (err) {
            console.error('Reaction toggle error:', err);
            setPosts(prevPosts); // rollback
        }
    };

    // Handle Submit Post
    const handleCreatePost = async () => {
        if (!postTitle.trim() || !postContent.trim()) {
            toast.error('Please enter a title and description.');
            return;
        }

        setSubmittingPost(true);
        triggerHaptic('medium');

        try {
            const propId = isLandlord && selectedPropertyId && selectedPropertyId !== 'all' 
                ? selectedPropertyId 
                : undefined;

            if (postType === 'announcement' && isLandlord) {
                await createAnnouncementPost({
                    title: postTitle.trim(),
                    content: postContent.trim(),
                    propertyId: propId
                });
            } else {
                await createDiscussionPost({
                    title: postTitle.trim(),
                    content: postContent.trim(),
                    propertyId: propId
                });
            }

            toast.success('Post published to community board!');
            setIsComposerOpen(false);
            setPostTitle('');
            setPostContent('');
            fetchFeed();
        } catch (err: any) {
            console.error('Create post error:', err);
            toast.error(err.message || 'Failed to publish post');
        } finally {
            setSubmittingPost(false);
        }
    };

    // Open Comments Drawer
    const openCommentsDrawer = async (post: CommunityPost) => {
        triggerHaptic('light');
        setActiveCommentPost(post);
        setLoadingComments(true);
        try {
            const res = await getPostComments(post.id);
            setCommentsList(res || []);
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setLoadingComments(false);
        }
    };

    // Submit Comment
    const handleAddComment = async () => {
        if (!activeCommentPost || !commentText.trim()) return;
        setSubmittingComment(true);
        triggerHaptic('medium');

        try {
            await addComment(activeCommentPost.id, commentText.trim());
            const updated = await getPostComments(activeCommentPost.id);
            setCommentsList(updated || []);
            setCommentText('');
            setPosts(prev => prev.map(p => {
                if (p.id === activeCommentPost.id) {
                    return { ...p, commentCount: (p.commentCount || 0) + 1 };
                }
                return p;
            }));
            toast.success('Reply posted');
        } catch (err: any) {
            toast.error(err.message || 'Failed to post reply');
        } finally {
            setSubmittingComment(false);
        }
    };

    return (
        <PullToRefresh onRefresh={fetchFeed}>
            <div className="flex flex-col gap-3.5 p-4 pb-24">
                {/* Top Scope / Refresh Row */}
                <div className="flex items-center justify-between gap-2">
                    {isLandlord ? (
                        <MobilePropertySelector className="flex-1" />
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                            <Megaphone className="size-4 text-primary" />
                            <span>Resident Noticeboard</span>
                        </div>
                    )}
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            fetchFeed();
                        }}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-white/10 bg-card text-muted-foreground hover:text-foreground active:scale-95 transition-all shadow-2xs"
                        aria-label="Refresh feed"
                    >
                        <RefreshCw className={cn("size-4", loading && "animate-spin text-primary")} />
                    </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search notices, announcements, or topics..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* Filter Navigation Tabs */}
                <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('all');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeTab === 'all'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        All ({posts.length})
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('announcements');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeTab === 'announcements'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Official Notices
                    </button>
                    <button
                        onClick={() => {
                            triggerHaptic('light');
                            setActiveTab('discussions');
                        }}
                        className={cn(
                            "flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all text-center",
                            activeTab === 'discussions'
                                ? "bg-white dark:bg-card text-foreground shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Discussions
                    </button>
                </div>

                {/* Posts Feed */}
                <div className="space-y-3.5">
                    {filteredPosts.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl bg-card border border-slate-200 dark:border-white/10 flex flex-col items-center gap-2.5">
                            <Megaphone className="size-10 text-muted-foreground/40 stroke-1" />
                            <h4 className="text-sm font-bold text-foreground">No Community Posts</h4>
                            <p className="text-xs text-muted-foreground max-w-xs">
                                {searchQuery ? 'No posts match your search query.' : 'Be the first to post an update or announcement.'}
                            </p>
                        </div>
                    ) : (
                        filteredPosts.map((post) => {
                            const isAnnouncement = post.type === 'announcement';
                            const isPinned = post.is_pinned;
                            const likeCount = post.reactions?.['like'] || 0;
                            const isLiked = (post.userReactions || []).some(r => r.reaction_type === 'like');

                            return (
                                <div
                                    key={post.id}
                                    className={cn(
                                        "rounded-2xl p-4 bg-card border shadow-xs transition-all flex flex-col gap-3 relative",
                                        isAnnouncement
                                            ? "border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card"
                                            : "border-slate-200 dark:border-white/10"
                                    )}
                                >
                                    {/* Author & Header Row */}
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                            <div 
                                                className="size-10 rounded-full flex items-center justify-center font-bold text-xs shrink-0 border border-slate-200 dark:border-white/10"
                                                style={{ backgroundColor: post.author_avatar_bg_color || '#e2e8f0' }}
                                            >
                                                <span className="text-slate-800">
                                                    {(post.author_name || 'A').split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()}
                                                </span>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="text-xs font-black text-foreground">
                                                        {post.author_name || 'Community Member'}
                                                    </h3>
                                                    <span className={cn(
                                                        "px-1.5 py-0.2 rounded text-[9px] font-bold uppercase",
                                                        post.author_role === 'landlord'
                                                            ? "bg-primary/15 text-primary"
                                                            : "bg-slate-100 dark:bg-white/10 text-muted-foreground"
                                                    )}>
                                                        {post.author_role === 'landlord' ? 'Management' : 'Resident'}
                                                    </span>
                                                </div>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatTimeAgo(post.created_at)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1">
                                            {isPinned && (
                                                <span className="p-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold flex items-center gap-0.5">
                                                    <Pin className="size-3 fill-amber-500" />
                                                    Pinned
                                                </span>
                                            )}
                                            {isAnnouncement && !isPinned && (
                                                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[9px] font-black uppercase tracking-wider">
                                                    Advisory
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Post Body */}
                                    <div>
                                        <h4 className="text-sm font-black text-foreground leading-snug">
                                            {post.title}
                                        </h4>
                                        {post.content && (
                                            <p className="text-xs text-muted-foreground mt-1.5 whitespace-pre-line leading-relaxed">
                                                {post.content}
                                            </p>
                                        )}
                                    </div>

                                    {/* Action Bar (Like & Comments) */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-white/5">
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => handleToggleReaction(post)}
                                                className={cn(
                                                    "flex items-center gap-1.5 text-xs font-bold active:scale-90 transition-all",
                                                    isLiked ? "text-primary" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                <ThumbsUp className={cn("size-3.5", isLiked && "fill-primary")} />
                                                <span>{likeCount}</span>
                                            </button>

                                            <button
                                                onClick={() => openCommentsDrawer(post)}
                                                className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-90 transition-all"
                                            >
                                                <MessageCircle className="size-3.5" />
                                                <span>{post.commentCount || 0}</span>
                                            </button>
                                        </div>

                                        <button
                                            onClick={() => openCommentsDrawer(post)}
                                            className="text-[11px] font-bold text-primary active:scale-95 transition-all"
                                        >
                                            View Comments
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Floating Add Post Button */}
                <div className="fixed bottom-18 right-4 z-40">
                    <button
                        onClick={() => {
                            triggerHaptic('medium');
                            setIsComposerOpen(true);
                        }}
                        className="size-13 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center justify-center active:scale-90 transition-all"
                        aria-label="Create new post"
                    >
                        <Plus className="size-6 stroke-[2.5]" />
                    </button>
                </div>

                {/* CREATE POST BOTTOM DRAWER */}
                {isComposerOpen && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                        <div className="w-full sm:max-w-md max-h-[85vh] bg-background rounded-t-3xl sm:rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col gap-4 overflow-y-auto animate-in slide-in-from-bottom duration-200">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-black text-foreground">
                                    {isLandlord ? 'Post Announcement or Notice' : 'New Community Discussion'}
                                </h3>
                                <button
                                    onClick={() => setIsComposerOpen(false)}
                                    className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Category Selector */}
                            {isLandlord && (
                                <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => setPostType('announcement')}
                                        className={cn(
                                            "flex-1 py-1.5 rounded-lg font-bold transition-all text-center",
                                            postType === 'announcement' ? "bg-white dark:bg-card text-foreground shadow-xs" : "text-muted-foreground"
                                        )}
                                    >
                                        Official Advisory
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPostType('discussion')}
                                        className={cn(
                                            "flex-1 py-1.5 rounded-lg font-bold transition-all text-center",
                                            postType === 'discussion' ? "bg-white dark:bg-card text-foreground shadow-xs" : "text-muted-foreground"
                                        )}
                                    >
                                        Resident Discussion
                                    </button>
                                </div>
                            )}

                            {/* Title & Body Inputs */}
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs font-bold text-muted-foreground block mb-1">
                                        Title / Subject
                                    </label>
                                    <input
                                        type="text"
                                        value={postTitle}
                                        onChange={(e) => setPostTitle(e.target.value)}
                                        placeholder="e.g., Scheduled Water Interruption or Lost Keys"
                                        className="w-full p-3 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-muted-foreground block mb-1">
                                        Details & Information
                                    </label>
                                    <textarea
                                        value={postContent}
                                        onChange={(e) => setPostContent(e.target.value)}
                                        rows={4}
                                        placeholder="Share full information with residents..."
                                        className="w-full p-3 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    onClick={() => setIsComposerOpen(false)}
                                    className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-white/10 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-98 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={submittingPost}
                                    onClick={handleCreatePost}
                                    className="flex-1 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs"
                                >
                                    {submittingPost ? <RefreshCw className="size-4 animate-spin" /> : 'Publish to Board'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* COMMENTS DRAWER */}
                {activeCommentPost && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
                        <div className="w-full sm:max-w-md max-h-[85vh] bg-background rounded-t-3xl sm:rounded-2xl p-5 border border-slate-200 dark:border-white/10 shadow-xl flex flex-col gap-3 overflow-hidden animate-in slide-in-from-bottom duration-200">
                            {/* Drawer Header */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-white/5">
                                <div>
                                    <h3 className="text-sm font-black text-foreground truncate max-w-[260px]">
                                        {activeCommentPost.title}
                                    </h3>
                                    <span className="text-[10px] text-muted-foreground">
                                        {commentsList.length} replies
                                    </span>
                                </div>
                                <button
                                    onClick={() => setActiveCommentPost(null)}
                                    className="p-1 rounded-full text-muted-foreground hover:text-foreground"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>

                            {/* Comment Threads List */}
                            <div className="flex-1 overflow-y-auto space-y-2.5 py-1 min-h-[160px] max-h-[40vh]">
                                {loadingComments ? (
                                    <div className="p-6 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                        <RefreshCw className="size-4 animate-spin text-primary" />
                                        <span>Loading conversation...</span>
                                    </div>
                                ) : commentsList.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-muted-foreground">
                                        No replies yet. Be the first to start the discussion!
                                    </div>
                                ) : (
                                    commentsList.map((comm) => (
                                        <div key={comm.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 text-xs space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-foreground">
                                                    {comm.author?.name || 'Resident'}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">
                                                    {formatTimeAgo(comm.createdAt)}
                                                </span>
                                            </div>
                                            <p className="text-muted-foreground leading-relaxed">
                                                {comm.content}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Reply Input */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/5">
                                <input
                                    type="text"
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    placeholder="Write a comment..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleAddComment();
                                    }}
                                    className="flex-1 p-2.5 rounded-xl bg-card border border-slate-200 dark:border-white/10 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                                <button
                                    disabled={submittingComment || !commentText.trim()}
                                    onClick={handleAddComment}
                                    className="p-2.5 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 active:scale-95 transition-all"
                                    aria-label="Send reply"
                                >
                                    <Send className="size-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </PullToRefresh>
    );
}
