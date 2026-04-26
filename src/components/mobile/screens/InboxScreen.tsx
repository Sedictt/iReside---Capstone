"use client";

import { useState, useEffect } from "react";
import { MessageSquare, Users, Edit3 } from "lucide-react";
import { useNavigation } from "../navigation";
import TenantChatScreen from "./TenantChatScreen";
import LandlordChatScreen from "./LandlordChatScreen";
import CommunityFeedScreen from "./CommunityFeedScreen";
import styles from "./InboxScreen.module.css";

type InboxTab = "messages" | "community";

export default function InboxScreen() {
    const { role, screenParams } = useNavigation();
    const [activeTab, setActiveTab] = useState<InboxTab>("messages");

    useEffect(() => {
        if (screenParams.tab && ["messages", "community"].includes(screenParams.tab as string)) {
            setActiveTab(screenParams.tab as InboxTab);
        }
    }, [screenParams.tab]);

    // Unread counts (mock)
    const messageUnread = role === "landlord" ? 1 : 2;
    const communityUnread = 1;

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.headerTitle}>Inbox</h1>
                <button className={styles.headerButton}>
                    <Edit3 size={16} />
                </button>
            </div>

            {/* Segment Control */}
            <div className={styles.segmentContainer}>
                <div className={styles.segmentTrack}>
                    <button
                        className={`${styles.segmentButton} ${activeTab === "messages" ? styles.segmentButtonActive : ""}`}
                        onClick={() => setActiveTab("messages")}
                    >
                        <MessageSquare size={14} />
                        Messages
                        {messageUnread > 0 && (
                            <span className={styles.segmentBadge}>{messageUnread}</span>
                        )}
                    </button>
                    <button
                        className={`${styles.segmentButton} ${activeTab === "community" ? styles.segmentButtonActive : ""}`}
                        onClick={() => setActiveTab("community")}
                    >
                        <Users size={14} />
                        Community
                        {communityUnread > 0 && (
                            <span className={styles.segmentBadge}>{communityUnread}</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Content — render the appropriate sub-screen */}
            <div className={styles.content} key={activeTab}>
                {activeTab === "messages" ? (
                    role === "landlord" ? (
                        <LandlordChatScreen isSubView />
                    ) : (
                        <TenantChatScreen isSubView />
                    )
                ) : (
                    <CommunityFeedScreen isSubView />
                )}
            </div>
        </div>
    );
}
