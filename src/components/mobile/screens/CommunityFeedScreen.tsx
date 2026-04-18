"use client";

import { useState } from "react";
import {
    Heart, MessageCircle, Share2, Image as ImageIcon,
    Plus, Pin, Megaphone, BookOpen, ChevronDown, GalleryHorizontalEnd
} from "lucide-react";
import { useNavigation } from "../navigation";
import MediaUploadModal from "../modals/MediaUploadModal";
import styles from "./CommunityFeedScreen.module.css";

// ─── Types ─────────────────────────────────────────────────
type PostCategory = "announcement" | "notice" | "update" | "general";

interface Post {
    id: string;
    author: string;
    authorRole: "landlord" | "tenant" | "admin";
    avatar: string;
    category: PostCategory;
    title?: string;
    content: string;
    timestamp: string;
    likes: number;
    comments: number;
    pinned?: boolean;
    hasImage?: boolean;
    liked?: boolean;
}

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_POSTS: Post[] = [
    {
        id: "p1",
        author: "Roberto Santos",
        authorRole: "landlord",
        avatar: "R",
        category: "announcement",
        title: "Water Interruption Notice",
        content: "Please be informed that there will be a scheduled water interruption on April 15, 2026 from 8:00 AM to 5:00 PM due to pipe maintenance works.",
        timestamp: "2 hrs ago",
        likes: 12,
        comments: 4,
        pinned: true,
        liked: false,
    },
    {
        id: "p2",
        author: "Ana Lim",
        authorRole: "tenant",
        avatar: "A",
        category: "general",
        content: "Just wanted to say the new community garden area looks great! Thanks for setting it up. 🌿",
        timestamp: "5 hrs ago",
        likes: 28,
        comments: 6,
        liked: true,
    },
    {
        id: "p3",
        author: "Skyline Holdings",
        authorRole: "landlord",
        avatar: "S",
        category: "notice",
        title: "Monthly Rent Reminder",
        content: "This is a reminder that monthly rent is due on or before the 5th of every month. Late payments will incur a ₱500 penalty. Thank you for understanding.",
        timestamp: "1 day ago",
        likes: 3,
        comments: 1,
        liked: false,
    },
    {
        id: "p4",
        author: "Jose Reyes",
        authorRole: "tenant",
        avatar: "J",
        category: "general",
        content: "Anyone know if the elevator will be fixed soon? It's been down for 3 days now.",
        timestamp: "1 day ago",
        likes: 15,
        comments: 8,
        liked: false,
        hasImage: false,
    },
    {
        id: "p5",
        author: "PrimeCo Rentals",
        authorRole: "landlord",
        avatar: "P",
        category: "update",
        title: "New Amenity: Co-Working Space",
        content: "We're excited to announce that our new co-working space on the 2nd floor is now open! Available Mon–Sat, 8 AM to 9 PM. Reserve your slot via the front desk.",
        timestamp: "3 days ago",
        likes: 47,
        comments: 12,
        liked: false,
        hasImage: true,
    },
];

const CATEGORY_CONFIG: Record<PostCategory, { label: string; className: string; icon: typeof Megaphone }> = {
    announcement: { label: "Announcement", className: "categoryAnnouncement", icon: Megaphone },
    notice:       { label: "Notice",       className: "categoryNotice",       icon: BookOpen },
    update:       { label: "Update",       className: "categoryUpdate",       icon: Pin },
    general:      { label: "General",      className: "categoryGeneral",      icon: MessageCircle },
};

const ROLE_COLOR: Record<string, string> = {
    landlord: "#6d9838",
    tenant: "#3b82f6",
    admin: "#ef4444",
};

// ─── Post Component ─────────────────────────────────────────
function PostCard({ post }: { post: Post }) {
    const [liked, setLiked] = useState(post.liked ?? false);
    const [likeCount, setLikeCount] = useState(post.likes);
    const { label, className, icon: CategoryIcon } = CATEGORY_CONFIG[post.category];

    const handleLike = () => {
        setLiked((prev) => !prev);
        setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    };

    return (
        <div className={`${styles.postCard} ${post.pinned ? styles.postCardPinned : ""}`}>
            {/* Pinned Banner */}
            {post.pinned && (
                <div className={styles.pinnedBanner}>
                    <Pin size={11} />
                    Pinned Post
                </div>
            )}

            {/* Post Header */}
            <div className={styles.postHeader}>
                <div
                    className={styles.avatar}
                    style={{ background: `${ROLE_COLOR[post.authorRole]}22`, color: ROLE_COLOR[post.authorRole] }}
                >
                    {post.avatar}
                </div>
                <div className={styles.authorInfo}>
                    <div className={styles.authorName}>{post.author}</div>
                    <div className={styles.authorMeta}>
                        <span
                            className={styles.authorRole}
                            style={{ color: ROLE_COLOR[post.authorRole] }}
                        >
                            {post.authorRole.charAt(0).toUpperCase() + post.authorRole.slice(1)}
                        </span>
                        <span className={styles.dot}>·</span>
                        <span className={styles.timestamp}>{post.timestamp}</span>
                    </div>
                </div>
                <div className={`${styles.categoryBadge} ${styles[className]}`}>
                    <CategoryIcon size={10} />
                    {label}
                </div>
            </div>

            {/* Post Content */}
            <div className={styles.postBody}>
                {post.title && <div className={styles.postTitle}>{post.title}</div>}
                <div className={styles.postContent}>{post.content}</div>
                {post.hasImage && (
                    <div className={styles.imagePlaceholder}>
                        <ImageIcon size={24} />
                        <span>Photo Attachment</span>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className={styles.postActions}>
                <button
                    className={`${styles.actionBtn} ${liked ? styles.actionBtnLiked : ""}`}
                    onClick={handleLike}
                >
                    <Heart size={16} fill={liked ? "currentColor" : "none"} />
                    <span>{likeCount}</span>
                </button>
                <button className={styles.actionBtn}>
                    <MessageCircle size={16} />
                    <span>{post.comments}</span>
                </button>
                <button className={`${styles.actionBtn} ${styles.actionBtnShare}`}>
                    <Share2 size={16} />
                </button>
            </div>
        </div>
    );
}

// ─── Main Screen ────────────────────────────────────────────
export default function CommunityFeedScreen() {
    const { role, navigate } = useNavigation();
    const [filter, setFilter] = useState<"all" | PostCategory>("all");
    const [isModalOpen, setIsModalOpen] = useState(false);

    const filters: Array<{ key: "all" | PostCategory; label: string }> = [
        { key: "all",          label: "All" },
        { key: "announcement", label: "Announcements" },
        { key: "notice",       label: "Notices" },
        { key: "update",       label: "Updates" },
        { key: "general",      label: "General" },
    ];

    const visiblePosts = MOCK_POSTS.filter(
        (p) => filter === "all" || p.category === filter
    );

    const canPost = role === "landlord" || role === "admin";

    const handlePostSuccess = (postData: any) => {
        console.log("New Post Created:", postData);
        // In a real app, we would refetch the feed here
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <h1 className={styles.headerTitle}>Community</h1>
                    <p className={styles.headerSub}>Building updates & announcements</p>
                </div>
                <div className={styles.headerActions}>
                    <button className={styles.galleryBtn} onClick={() => navigate("photoGallery")}>
                        <GalleryHorizontalEnd size={18} />
                    </button>
                    {canPost && (
                        <button 
                            className={styles.newPostBtn}
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* Filter Pills */}
            <div className={styles.filterRow}>
                {filters.map((f) => (
                    <button
                        key={f.key}
                        className={`${styles.filterPill} ${filter === f.key ? styles.filterPillActive : ""}`}
                        onClick={() => setFilter(f.key)}
                    >
                        {f.label}
                    </button>
                ))}
            </div>

            {/* Feed */}
            <div className={styles.feed}>
                {visiblePosts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}

                {/* Load More */}
                <button className={styles.loadMoreBtn}>
                    <ChevronDown size={16} />
                    Load older posts
                </button>
            </div>

            {/* Upload Modal */}
            <MediaUploadModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handlePostSuccess}
            />
        </div>
    );
}
