"use client";

import { useState } from "react";
import {
    Megaphone, BookOpen, ChevronDown, GalleryHorizontalEnd, Plus
} from "lucide-react";
import { useNavigation } from "../navigation";
import MediaUploadModal from "../modals/MediaUploadModal";
import styles from "./CommunityFeedScreen.module.css";
import { EmptyState } from "../../shared/EmptyState";

type PostCategory = "announcement" | "notice" | "update" | "general";

interface Post {
    id: string;
    author: string;
    authorRole: "landlord" | "tenant";
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
    hidden?: boolean;
}

const CATEGORIES: Array<{ key: PostCategory | "all"; label: string; icon: typeof Megaphone }> = [
    { key: "all", label: "All Posts", icon: BookOpen },
    { key: "announcement", label: "Announcements", icon: Megaphone },
    { key: "notice", label: "Notices", icon: ChevronDown },
    { key: "update", label: "Updates", icon: GalleryHorizontalEnd },
    { key: "general", label: "General", icon: ChevronDown },
];

interface CommunityFeedScreenProps {
    isSubView?: boolean;
}

export default function CommunityFeedScreen({ isSubView }: CommunityFeedScreenProps = {}) {
    const { navigate } = useNavigation();
    const [activeCategory, setActiveCategory] = useState<PostCategory | "all">("all");
    const [showUploadModal, setShowUploadModal] = useState(false);

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.headerTopRow}>
                    <h1 className={styles.headerTitle}>Community</h1>
                    <button className={styles.addPostBtn} onClick={() => setShowUploadModal(true)}>
                        <Plus size={20} />
                    </button>
                </div>
                <p className={styles.headerSub}>Stay connected with your community.</p>
            </div>

            {/* Category Tabs */}
            <div className={styles.categoryRow}>
                {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    return (
                        <button
                            key={cat.key}
                            className={`${styles.categoryChip} ${activeCategory === cat.key ? styles.activeChip : ""}`}
                            onClick={() => setActiveCategory(cat.key)}
                        >
                            <Icon size={12} />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            <div className={styles.scrollArea}>
                <EmptyState
                    icon={BookOpen}
                    title="No posts yet"
                    description="Community posts, announcements, and updates will appear here."
                />
            </div>

            {showUploadModal && (
                <MediaUploadModal 
                    isOpen={showUploadModal}
                    onClose={() => setShowUploadModal(false)} 
                    onSuccess={() => setShowUploadModal(false)}
                />
            )}
        </div>
    );
}
