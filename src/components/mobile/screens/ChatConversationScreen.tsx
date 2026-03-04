"use client";

import { useState, useRef, useEffect } from "react";
import {
    ArrowLeft,
    MoreVertical,
    Send,
    Paperclip,
} from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./ChatConversationScreen.module.css";

// ─── Mock Messages ─────────────────────────────────────────
interface Message {
    id: string;
    text: string;
    sender: "me" | "them" | "system";
    time: string;
}

const MOCK_MESSAGES: Record<string, Message[]> = {
    conv1: [
        { id: "m1", text: "Hi Mr. Santos! I wanted to ask about the lease renewal terms.", sender: "me", time: "2:15 PM" },
        { id: "m2", text: "Hello Jane! Of course. The renewal offer includes a 5% rent adjustment and extends for another 12 months.", sender: "them", time: "2:18 PM" },
        { id: "m3", text: "That sounds reasonable. Are there any changes to the terms?", sender: "me", time: "2:22 PM" },
        { id: "m4", text: "No major changes. I've added a clause about building amenity access. I'll send the document shortly.", sender: "them", time: "2:25 PM" },
        { id: "m5", text: "The lease renewal is ready for review.", sender: "them", time: "2:30 PM" },
        { id: "s1", text: "Mr. Santos shared a document: Lease_Renewal_2026.pdf", sender: "system", time: "2:30 PM" },
    ],
    conv2: [
        { id: "m1", text: "Hi, I submitted a maintenance request for a leaking pipe in the kitchen.", sender: "me", time: "10:00 AM" },
        { id: "m2", text: "We received your request (#MTN-2451). Let me assign a technician.", sender: "them", time: "10:15 AM" },
        { id: "m3", text: "Thank you! When can I expect someone?", sender: "me", time: "10:20 AM" },
        { id: "m4", text: "Your plumbing request has been scheduled for tomorrow.", sender: "them", time: "11:30 AM" },
        { id: "s1", text: "Maintenance ticket #MTN-2451 updated: Scheduled for March 5", sender: "system", time: "11:30 AM" },
    ],
    conv3: [
        { id: "m1", text: "Important: Building inspection notice", sender: "them", time: "9:00 AM" },
        { id: "m2", text: "The annual building inspection will be conducted on March 15, 2026. Please ensure your unit is accessible between 9 AM - 5 PM.", sender: "them", time: "9:00 AM" },
        { id: "m3", text: "Noted, thank you for the heads up.", sender: "me", time: "9:30 AM" },
        { id: "m4", text: "Reminder: Building inspection on March 15.", sender: "them", time: "Mar 1" },
    ],
};

// ─── Component ─────────────────────────────────────────────
export default function ChatConversationScreen() {
    const { goBack, screenParams } = useNavigation();
    const [inputText, setInputText] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const conversationId = screenParams.conversationId as string;
    const conversationName = (screenParams.conversationName as string) || "Chat";

    // Load messages
    useEffect(() => {
        setMessages(MOCK_MESSAGES[conversationId] || []);
    }, [conversationId]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = () => {
        if (!inputText.trim()) return;
        const newMsg: Message = {
            id: `new-${Date.now()}`,
            text: inputText.trim(),
            sender: "me",
            time: new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            }),
        };
        setMessages((prev) => [...prev, newMsg]);
        setInputText("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className={styles.container}>
            {/* Top Bar */}
            <div className={styles.topBar}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft />
                </button>
                <div className={styles.contactInfo}>
                    <p className={styles.contactName}>{conversationName}</p>
                    <p className={styles.contactStatus}>Online</p>
                </div>
                <button className={styles.moreButton}>
                    <MoreVertical />
                </button>
            </div>

            {/* Messages */}
            <div className={styles.messagesArea}>
                <div className={styles.dateDivider}>
                    <span className={styles.dateDividerText}>Today</span>
                </div>

                {messages.map((msg) => {
                    if (msg.sender === "system") {
                        return (
                            <div key={msg.id} className={styles.systemMessage}>
                                <div className={styles.systemBubble}>{msg.text}</div>
                            </div>
                        );
                    }

                    return (
                        <div
                            key={msg.id}
                            className={`${styles.messageRow} ${msg.sender === "me"
                                    ? styles.messageSent
                                    : styles.messageReceived
                                }`}
                        >
                            <div
                                className={`${styles.bubble} ${msg.sender === "me"
                                        ? styles.bubbleSent
                                        : styles.bubbleReceived
                                    }`}
                            >
                                {msg.text}
                            </div>
                            <span className={styles.messageTime}>{msg.time}</span>
                        </div>
                    );
                })}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={styles.inputArea}>
                <div className={styles.inputWrapper}>
                    <textarea
                        className={styles.textInput}
                        placeholder="Type a message..."
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                    />
                    <button className={styles.attachButton}>
                        <Paperclip />
                    </button>
                </div>
                <button
                    className={styles.sendButton}
                    onClick={handleSend}
                    disabled={!inputText.trim()}
                >
                    <Send />
                </button>
            </div>
        </div>
    );
}
