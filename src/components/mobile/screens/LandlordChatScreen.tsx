"use client";

import { useState } from "react";
import {
    Search,
    Edit3,
    ChevronRight,
    User,
    Wrench,
    Shield,
    Briefcase,
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./TenantChatScreen.module.css"; // Reuse tenant chat styles

// ─── Mock Conversations ────────────────────────────────────
interface Conversation {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    unread: number;
    online: boolean;
    type: "tenant" | "service" | "system";
}

const CONVERSATIONS: Conversation[] = [
    {
        id: "conv1",
        name: "Juan Dela Cruz (Tenant)",
        lastMessage: "I've sent the payment for March.",
        time: "10:15 AM",
        unread: 1,
        online: true,
        type: "tenant",
    },
    {
        id: "conv2",
        name: "Maria Santos (Tenant)",
        lastMessage: "Is the AC repair still scheduled today?",
        time: "9:30 AM",
        unread: 0,
        online: false,
        type: "tenant",
    },
    {
        id: "conv3",
        name: "Robert P. (Technician)",
        lastMessage: "Unit 102 repair is complete.",
        time: "Yesterday",
        unread: 0,
        online: true,
        type: "service",
    },
];

// ─── Component ─────────────────────────────────────────────
export default function LandlordChatScreen({ isSubView = false }: { isSubView?: boolean }) {
    const { navigate } = useNavigation();
    const [searchQuery, setSearchQuery] = useState("");

    const filteredConversations = searchQuery.trim()
        ? CONVERSATIONS.filter(
            (c) =>
                c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : CONVERSATIONS;

    const getAvatarIcon = (type: Conversation["type"]) => {
        switch (type) {
            case "tenant":
                return <User />;
            case "service":
                return <Briefcase />;
            case "system":
                return <Shield />;
        }
    };

    const getAvatarClass = (type: Conversation["type"]) => {
        switch (type) {
            case "tenant":
                return styles.avatarLandlord; // Reuse colors
            case "service":
                return styles.avatarMaintenance;
            case "system":
                return styles.avatarSystem;
        }
    };

    return (
        <div className={styles.container}>
            {/* Header — hidden when used as sub-view inside InboxScreen */}
            {!isSubView && (
                <div className={styles.header}>
                    <h1 className={styles.headerTitle}>Landlord Inbox</h1>
                    <div className={styles.headerActions}>
                        <button className={styles.headerButton}>
                            <Edit3 />
                        </button>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className={styles.searchBar}>
                <Search />
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search tenants or services..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Conversations */}
            <div className={styles.conversationList}>
                {filteredConversations.map((conv) => (
                    <div
                        key={conv.id}
                        className={`${styles.conversationItem} ${conv.unread > 0 ? styles.convUnread : ""
                            }`}
                        onClick={() =>
                            navigate("chatConversation", {
                                conversationId: conv.id,
                                conversationName: conv.name,
                            })
                        }
                    >
                        <div className={`${styles.avatar} ${getAvatarClass(conv.type)}`}>
                            {getAvatarIcon(conv.type)}
                            {conv.online && <div className={styles.onlineDot} />}
                        </div>

                        <div className={styles.convContent}>
                            <div className={styles.convTop}>
                                <span className={styles.convName}>{conv.name}</span>
                                <span className={styles.convTime}>{conv.time}</span>
                            </div>
                            <div className={styles.convBottom}>
                                <span className={styles.convMessage}>{conv.lastMessage}</span>
                                {conv.unread > 0 && (
                                    <span className={styles.unreadBadge}>{conv.unread}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
