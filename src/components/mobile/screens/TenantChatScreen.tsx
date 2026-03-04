"use client";

import { useState } from "react";
import {
    Search,
    Edit3,
    ChevronRight,
    Bot,
    Building2,
    Wrench,
    Shield,
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./TenantChatScreen.module.css";

// ─── Mock Conversations ────────────────────────────────────
interface Conversation {
    id: string;
    name: string;
    lastMessage: string;
    time: string;
    unread: number;
    online: boolean;
    type: "landlord" | "maintenance" | "system";
}

const CONVERSATIONS: Conversation[] = [
    {
        id: "conv1",
        name: "Mr. Santos (Landlord)",
        lastMessage: "The lease renewal is ready for review.",
        time: "2:30 PM",
        unread: 2,
        online: true,
        type: "landlord",
    },
    {
        id: "conv2",
        name: "Maintenance Team",
        lastMessage: "Your plumbing request has been scheduled for tomorrow.",
        time: "Yesterday",
        unread: 0,
        online: false,
        type: "maintenance",
    },
    {
        id: "conv3",
        name: "Property Management",
        lastMessage: "Reminder: Building inspection on March 15.",
        time: "Mar 1",
        unread: 1,
        online: false,
        type: "system",
    },
];

// ─── Component ─────────────────────────────────────────────
export default function TenantChatScreen() {
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
            case "landlord":
                return <Building2 />;
            case "maintenance":
                return <Wrench />;
            case "system":
                return <Shield />;
        }
    };

    const getAvatarClass = (type: Conversation["type"]) => {
        switch (type) {
            case "landlord":
                return styles.avatarLandlord;
            case "maintenance":
                return styles.avatarMaintenance;
            case "system":
                return styles.avatarSystem;
        }
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>Messages</h1>
                <div className={styles.headerActions}>
                    <button className={styles.headerButton}>
                        <Edit3 />
                    </button>
                </div>
            </div>

            {/* iRis AI Banner */}
            <div
                className={styles.irisBanner}
                onClick={() => navigate("irisChat")}
            >
                <div className={styles.irisAvatar}>
                    <Bot />
                </div>
                <div className={styles.irisText}>
                    <p className={styles.irisName}>iRis AI Assistant</p>
                    <p className={styles.irisSub}>Ask anything about your rental</p>
                </div>
                <div className={styles.irisArrow}>
                    <ChevronRight />
                </div>
            </div>

            {/* Search */}
            <div className={styles.searchBar}>
                <Search />
                <input
                    className={styles.searchInput}
                    type="text"
                    placeholder="Search messages..."
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
