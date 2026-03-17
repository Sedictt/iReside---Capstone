"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Bot, Send, Sparkles } from "lucide-react";
import { useNavigation } from "../navigation";
import styles from "./IrisChatScreen.module.css";

interface Message {
    id: string;
    text: string;
    sender: "bot" | "user";
    time: string;
}

const INITIAL_MESSAGES: Message[] = [
    {
        id: "1",
        text: "Hello! I'm iRis, your personal iReside assistant. How can I help you manage your property today?",
        sender: "bot",
        time: "10:00 AM",
    }
];

const SUGGESTIONS = [
    "When is my next rent due?",
    "How do I request a repair?",
    "Show my lease agreement",
    "Contact my landlord"
];

export default function IrisChatScreen() {
    const { goBack } = useNavigation();
    const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
    const [inputValue, setInputValue] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = (text: string) => {
        if (!text.trim()) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text,
            sender: "user",
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, newMessage]);
        setInputValue("");
        
        // Simulate bot response
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            const botResponse: Message = {
                id: (Date.now() + 1).toString(),
                text: getMockResponse(text),
                sender: "bot",
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, botResponse]);
        }, 1500);
    };

    const getMockResponse = (input: string): string => {
        const lowerInput = input.toLowerCase();
        if (lowerInput.includes("rent")) return "Your next rent of ₱18,500 is due on April 1, 2026. You can pay it directly through the Payments tab!";
        if (lowerInput.includes("repair") || lowerInput.includes("fix")) return "I can help with that. Would you like me to open the maintenance request form for you?";
        if (lowerInput.includes("lease")) return "Your current lease is active until Dec 31, 2026. You can view the full PDF in the 'View Lease' section.";
        return "I'm not quite sure about that, but Tip: You can ask me about your rent, repairs, or lease details!";
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <header className={styles.header}>
                <button className={styles.backButton} onClick={goBack}>
                    <ArrowLeft size={24} />
                </button>
                <div className={styles.headerInfo}>
                    <div className={styles.botAvatar}>
                        <Bot size={20} />
                    </div>
                    <div className={styles.botDetails}>
                        <span className={styles.botName}>iRis AI</span>
                        <span className={styles.botStatus}>
                            <div className={styles.statusDot} />
                            Always active
                        </span>
                    </div>
                </div>
                <Sparkles size={20} color="#6d9838" style={{ marginRight: 8, opacity: 0.6 }} />
            </header>

            {/* Chat Content */}
            <div className={styles.scrollArea} ref={scrollRef}>
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`${styles.messageRow} ${msg.sender === "bot" ? styles.messageRowBot : styles.messageRowUser}`}
                    >
                        <div className={`${styles.bubble} ${msg.sender === "bot" ? styles.bubbleBot : styles.bubbleUser}`}>
                            {msg.text}
                            <span className={styles.messageTime}>{msg.time}</span>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className={`${styles.messageRow} ${styles.messageRowBot}`}>
                        <div className={`${styles.bubble} ${styles.bubbleBot}`}>
                            <div className={styles.typingContainer}>
                                <div className={styles.typingDot} />
                                <div className={styles.typingDot} />
                                <div className={styles.typingDot} />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Suggestions */}
            {!isTyping && messages.length < 5 && (
                <div className={styles.suggestions}>
                    {SUGGESTIONS.map((s, i) => (
                        <button key={i} className={styles.suggestionChip} onClick={() => handleSend(s)}>
                            {s}
                        </button>
                    ))}
                </div>
            )}

            {/* Input */}
            <footer className={styles.inputArea}>
                <div className={styles.inputWrapper}>
                    <input 
                        className={styles.input}
                        placeholder="Ask iRis something..."
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSend(inputValue)}
                    />
                    <button 
                        className={styles.sendButton}
                        disabled={!inputValue.trim() || isTyping}
                        onClick={() => handleSend(inputValue)}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </footer>
        </div>
    );
}
