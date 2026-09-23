"use client";

import { useState, useRef, useEffect } from "react";
import Image from 'next/image';
import { ArrowUp, ArrowLeft, Wifi, Copy, ShieldCheck, Check, Phone, Mail, Building2, CreditCard, Search, Folder, MoreVertical, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { fetchIrisHistory, getCachedIrisHistory, setCachedIrisHistory, type IrisHistoryMessage } from "@/lib/iris/client";
import type { IrisCardData } from "@/lib/services/iris";
import { ChatMessageMarkdown } from "@/components/ui/ChatMessageMarkdown";
import { isPreseededPhone, isPreseededEmail } from "@/lib/validation/brand-setup";

interface Message {
    id: string;
    role: "user" | "iris";
    content: string;
    timestamp: Date;
    hasDataCard?: boolean;
    card?: IrisCardData | null;
}

interface TenantIrisChatProps {
    onBack?: () => void;
}

const getFirstName = (fullName?: string | null) => {
    if (!fullName) return null;
    return fullName.trim().split(/\s+/)[0] ?? null;
};

const getUserInitials = (fullName?: string | null) => {
    if (!fullName) return "You";

    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "You";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase() || "You";
};

const buildWelcomeMessage = (firstName?: string | null) => {
    const nameSegment = firstName ? `, ${firstName}` : "";
    return `Welcome back${nameSegment}! 👋 I am your virtual property assistant. How can I help you settle in or manage your apartment today?`;
};

export function TenantIrisChat({ onBack }: TenantIrisChatProps = {}) {
    const INITIAL_CHAT_SKELETON_COUNT = 6;
    const { profile, user } = useAuth();

    const firstName = getFirstName(profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email ?? null);
    const userInitials = getUserInitials(profile?.full_name ?? user?.user_metadata?.full_name ?? null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [isChatInitializing, setIsChatInitializing] = useState(true);
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const copyToClipboard = async (text: string, key: string) => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(text);
            setCopiedKey(key);
            setTimeout(() => setCopiedKey(null), 2000);
        } catch {
            // Clipboard API fallback or suppressed error
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    useEffect(() => {
        let isCancelled = false;

        const loadHistory = async () => {
            if (!user?.id) {
                setMessages([
                    {
                        id: "1",
                        role: "iris",
                        content: buildWelcomeMessage(firstName),
                        timestamp: new Date(),
                    },
                ]);
                setIsChatInitializing(false);
                return;
            }

            const cached = getCachedIrisHistory(user.id);
            if (cached && cached.length > 0) {
                setMessages(
                    cached.map((msg) => ({
                        id: msg.id,
                        role: msg.role === "assistant" ? "iris" : "user",
                        content: msg.content,
                        timestamp: new Date(msg.created_at),
                        card: (msg.metadata as any)?.card ?? null,
                        hasDataCard: Boolean((msg.metadata as any)?.card || (msg.metadata as any)?.hasDataCard),
                    }))
                );
                setIsChatInitializing(false);
                return;
            }

            setIsChatInitializing(true);
            const { data } = await fetchIrisHistory(100, { userId: user.id, useCache: true });
            if (isCancelled) return;

            if (data.length > 0) {
                setMessages(
                    data.map((msg) => ({
                        id: msg.id,
                        role: msg.role === "assistant" ? "iris" : "user",
                        content: msg.content,
                        timestamp: new Date(msg.created_at),
                        card: (msg.metadata as any)?.card ?? null,
                        hasDataCard: Boolean((msg.metadata as any)?.card || (msg.metadata as any)?.hasDataCard),
                    }))
                );
                setIsChatInitializing(false);
                return;
            }

            setMessages([
                {
                    id: "1",
                    role: "iris",
                    content: buildWelcomeMessage(firstName),
                    timestamp: new Date(),
                },
            ]);
            setIsChatInitializing(false);
        };

        loadHistory();

        return () => {
            isCancelled = true;
        };
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id || messages.length === 0) {
            return;
        }

        const normalizedMessages: IrisHistoryMessage[] = messages.map((msg) => ({
            id: msg.id,
            role: msg.role === "iris" ? "assistant" : "user",
            content: msg.content,
            metadata: msg.card ? { card: msg.card, hasDataCard: msg.hasDataCard } : null,
            created_at: msg.timestamp.toISOString(),
        }));

        setCachedIrisHistory(user.id, normalizedMessages);
    }, [messages, user?.id]);

    useEffect(() => {
        setMessages((prev) => {
            const [first, ...rest] = prev;
            if (!first || first.role !== "iris" || !first.content.toLowerCase().includes("welcome back")) {
                return prev;
            }

            return [
                {
                    ...first,
                    content: buildWelcomeMessage(firstName),
                },
                ...rest,
            ];
        });
    }, [firstName]);

    const handleSend = async (overrideText?: string) => {
        if (isChatInitializing) return;
        const textToSend = (overrideText ?? input).trim();
        if (!textToSend) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: "user",
            content: textToSend,
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        try {
            // Call the iRis API
            const response = await fetch('/api/iris/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: textToSend,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get response from iRis');
            }

            const data = await response.json();

            const irisMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "iris",
                content: data.response,
                timestamp: new Date(),
                hasDataCard: data.hasDataCard || false,
                card: data.card ?? null,
            };

            setMessages(prev => [...prev, irisMsg]);
        } catch (error) {
            console.error('Error calling iRis API:', error);

            // Show error message to user
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: "iris",
                content: "I apologize, but I'm having trouble connecting right now. Please try again in a moment.",
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative" data-tour-id="tour-messages-chat">
            {/* Header */}
            <div className="h-20 border-b border-border/40 px-6 flex items-center justify-between shrink-0 bg-surface-1/80 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button
                            type="button"
                            onClick={onBack}
                            className="flex sm:hidden items-center justify-center p-2 rounded-xl neumorphic-extruded transition-all active:scale-95 text-high hover:text-primary"
                            title="Back to List"
                        >
                            <ArrowLeft className="size-4" />
                        </button>
                    )}
                    <div className="relative">
                        <div className="relative size-10 rounded-full bg-white overflow-hidden border border-border flex items-center justify-center">
                            <Image src="/logos/favicon.png" alt="iRis" fill sizes="40px" className="object-cover" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 size-3.5 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
                            <div className="size-2 rounded-full bg-primary animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-black text-foreground text-base">iRis Assistant</h3>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-black text-primary tracking-widest bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded">AI Concierge</span>
                            <span className="text-[10px] text-muted-foreground font-medium">Always Available</span>
                        </div>
                    </div>
                </div>

                {/* Dummy Tools to match layout & guide tour step 5 */}
                <div className="flex items-center gap-2" data-tour-id="tour-messages-tools">
                    <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors opacity-50 cursor-not-allowed" title="Search not available for iRis">
                        <Search className="size-4" />
                    </button>
                    <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors opacity-50 cursor-not-allowed" title="Files not available for iRis">
                        <Folder className="size-4" />
                    </button>
                    <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors opacity-50 cursor-not-allowed" title="Settings">
                        <MoreVertical className="size-4" />
                    </button>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 flex flex-col items-center bg-background/60">
                <div className="w-full max-w-4xl space-y-6 flex flex-col">
                    <div className="text-center py-6 flex flex-col items-center gap-3">
                        <div className="relative size-20 rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white/60 shadow-[0_18px_35px_-24px_rgba(15,23,42,0.45)]">
                            <Image src="/logos/favicon.png" alt="iRis" fill sizes="80px" className="object-cover" />
                        </div>
                        <span className="text-xs font-black text-muted-foreground uppercase tracking-widest bg-card px-4 py-1.5 rounded-full border border-border shadow-sm">
                            Conversation with iRis • Private & Secured
                        </span>
                        <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium max-w-md text-center">
                            <AlertCircle className="size-3.5 text-muted-foreground/70 shrink-0" />
                            <span>iRis is an AI assistant and can make mistakes. Always verify critical lease and payment details.</span>
                        </div>
                    </div>

                    {isChatInitializing ? (
                        <div className="space-y-4" aria-live="polite" aria-busy="true">
                            {Array.from({ length: INITIAL_CHAT_SKELETON_COUNT }).map((_, index) => {
                                const isRight = index % 3 === 2;

                                return (
                                    <div key={`skeleton-${index}`} className={cn("flex w-full gap-4", isRight ? "justify-end" : "justify-start")}>
                                        {!isRight && <div className="size-8 rounded-full bg-zinc-300/80 animate-pulse" />}
                                        <div
                                            className={cn(
                                                "animate-pulse rounded-2xl",
                                                isRight
                                                    ? "h-16 w-40 bg-primary/25 rounded-br-sm"
                                                    : "h-20 w-64 bg-card border border-border rounded-bl-sm"
                                            )}
                                        />
                                        {isRight && <div className="size-8 rounded-full bg-zinc-200 animate-pulse" />}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <>
                            {messages.map((msg) => (
                                <div key={msg.id} className={cn("flex w-full gap-4", msg.role === "user" ? "justify-end" : "justify-start")}>
                                    {msg.role === "iris" && (
                                        <div className="shrink-0 mt-auto">
                                            <div className="size-8 rounded-full bg-white overflow-hidden flex items-center justify-center border border-border">
                                                <Image src="/logos/favicon.png" alt="iRis" width={28} height={28} className="object-cover" />
                                            </div>
                                        </div>
                                    )}

                                    <div className={cn("flex flex-col gap-1.5 max-w-[80%] md:max-w-[70%]", msg.role === "user" ? "items-end" : "items-start")}>
                                        <div className={cn(
                                            "px-5 py-3.5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed",
                                            msg.role === "user"
                                                ? "bg-primary text-primary-foreground rounded-br-sm font-medium shadow-[0_10px_24px_-16px_rgba(109,152,56,0.55)]"
                                                : "bg-card text-foreground rounded-bl-sm border border-border"
                                        )}>
                                            <ChatMessageMarkdown content={msg.content} isUser={msg.role === "user"} />
                                        </div>

                                        {/* Wi-Fi Card */}
                                        {((msg.card?.type === "wifi") || (msg.hasDataCard && !msg.card)) && (
                                            <div className="w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-1 relative group">
                                                <div className="p-3.5 border-b border-border flex justify-between items-center relative z-10">
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-wider mb-0.5">Network Name (SSID)</p>
                                                        <p className="text-primary font-mono font-medium text-sm md:text-base select-all truncate">
                                                            {msg.card?.type === "wifi" ? msg.card.ssid : "TheLofts_Guest"}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(msg.card?.type === "wifi" ? msg.card.ssid : "TheLofts_Guest", `ssid-${msg.id}`)}
                                                        className="p-2 text-muted-foreground hover:text-primary transition rounded-lg hover:bg-primary/10"
                                                        title="Copy Network Name"
                                                    >
                                                        {copiedKey === `ssid-${msg.id}` ? <Check className="size-4.5 text-emerald-500" /> : <Wifi className="size-4.5" />}
                                                    </button>
                                                </div>
                                                <div className="p-3.5 flex justify-between items-center relative z-10 hover:bg-muted/40 transition-colors">
                                                    <div className="flex-1 min-w-0 pr-2">
                                                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-wider mb-0.5">Password</p>
                                                        <p className="text-primary font-mono font-medium text-sm md:text-base select-all truncate">
                                                            {msg.card?.type === "wifi" ? msg.card.password : "WelcomeHome2024"}
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(msg.card?.type === "wifi" ? msg.card.password : "WelcomeHome2024", `pass-${msg.id}`)}
                                                        className="p-2 text-muted-foreground hover:text-primary transition rounded-lg hover:bg-primary/10"
                                                        title="Copy Password"
                                                    >
                                                        {copiedKey === `pass-${msg.id}` ? <Check className="size-4.5 text-emerald-500" /> : <Copy className="size-4.5" />}
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {/* Landlord Contact Card */}
                                        {msg.card?.type === "landlord" && (
                                            <div className="w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-1 relative">
                                                <div className="p-3.5 border-b border-border flex items-center gap-2.5">
                                                    <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                        <Building2 className="size-4" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">Landlord & Property Management</p>
                                                        <p className="font-bold text-foreground text-sm truncate">{msg.card.name}</p>
                                                        {msg.card.businessName && (
                                                            <p className="text-xs text-muted-foreground truncate">{msg.card.businessName}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="divide-y divide-border text-xs">
                                                    {msg.card.phone && !isPreseededPhone(msg.card.phone) && (
                                                        <div className="p-3 flex items-center justify-between hover:bg-muted/40 transition-colors">
                                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                                <Phone className="size-3.5 text-muted-foreground shrink-0" />
                                                                <a href={`tel:${msg.card.phone}`} className="text-foreground font-mono hover:text-primary hover:underline truncate">
                                                                    {msg.card.phone}
                                                                </a>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(msg.card?.type === "landlord" && msg.card.phone ? msg.card.phone : "", `phone-${msg.id}`)}
                                                                className="p-1.5 text-muted-foreground hover:text-primary transition rounded-md hover:bg-primary/10"
                                                                title="Copy Phone"
                                                            >
                                                                {copiedKey === `phone-${msg.id}` ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {msg.card.email && !isPreseededEmail(msg.card.email) && (
                                                        <div className="p-3 flex items-center justify-between hover:bg-muted/40 transition-colors">
                                                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                                                <Mail className="size-3.5 text-muted-foreground shrink-0" />
                                                                <a href={`mailto:${msg.card.email}`} className="text-foreground hover:text-primary hover:underline truncate">
                                                                    {msg.card.email}
                                                                </a>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(msg.card?.type === "landlord" && msg.card.email ? msg.card.email : "", `email-${msg.id}`)}
                                                                className="p-1.5 text-muted-foreground hover:text-primary transition rounded-md hover:bg-primary/10"
                                                                title="Copy Email"
                                                            >
                                                                {copiedKey === `email-${msg.id}` ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                                                            </button>
                                                        </div>
                                                    )}
                                                    {(!msg.card.phone || isPreseededPhone(msg.card.phone)) && (!msg.card.email || isPreseededEmail(msg.card.email)) && (
                                                        <div className="p-3 text-muted-foreground text-xs italic">
                                                            Direct contact details are not published yet. Please send a message via the Inquiries tab.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Rent Status Card */}
                                        {msg.card?.type === "rent" && (
                                            <div className="w-full bg-card border border-border rounded-xl overflow-hidden shadow-sm mt-1">
                                                <div className="p-3.5 border-b border-border flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard className="size-4 text-primary" />
                                                        <span className="text-xs font-bold text-foreground">Rent & Lease Summary</span>
                                                    </div>
                                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                        {msg.card.status}
                                                    </span>
                                                </div>
                                                <div className="p-3.5 grid grid-cols-2 gap-3 text-xs">
                                                    <div>
                                                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-wider mb-0.5">Monthly Rent</p>
                                                        <p className="text-sm font-bold text-foreground">₱{msg.card.monthlyRent.toLocaleString()}</p>
                                                    </div>
                                                    {msg.card.dueDate && (
                                                        <div>
                                                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-wider mb-0.5">Schedule</p>
                                                            <p className="text-xs font-medium text-foreground">{msg.card.dueDate}</p>
                                                        </div>
                                                    )}
                                                    {msg.card.securityDeposit !== undefined && (
                                                        <div>
                                                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-wider mb-0.5">Deposit</p>
                                                            <p className="text-xs font-medium text-muted-foreground">₱{msg.card.securityDeposit.toLocaleString()}</p>
                                                        </div>
                                                    )}
                                                    {msg.card.lastPaymentDate && (
                                                        <div>
                                                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-wider mb-0.5">Last Payment</p>
                                                            <p className="text-xs font-medium text-muted-foreground">{msg.card.lastPaymentDate}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <span className={cn("text-[10px] font-medium text-muted-foreground px-1", msg.role === "user" ? "text-right" : "text-left")}>
                                            {msg.role === "user" ? "Seen" : msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {msg.role === "user" && (
                                        <div className="shrink-0 mt-auto">
                                            <div className="size-8 rounded-full bg-card flex items-center justify-center font-black text-xs text-muted-foreground border border-border">
                                                {userInitials}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </>
                    )}

                    {isTyping && !isChatInitializing && (
                        <div className="flex w-full gap-4 justify-start">
                            <div className="shrink-0 mt-auto">
                        <div className="size-8 rounded-full bg-white overflow-hidden flex items-center justify-center border border-border">
                            <Image src="/logos/favicon.png" alt="iRis" width={28} height={28} className="object-cover" />
                        </div>
                            </div>
                            <div className="px-5 py-4 rounded-2xl rounded-bl-sm bg-card border border-border flex items-center gap-1.5">
                                <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="size-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="size-1.5 rounded-full bg-primary animate-bounce"></span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="shrink-0 p-6 bg-card/80 backdrop-blur-xl border-t border-border z-10 w-full flex justify-center" data-tour-id="tour-messages-input">
                <div className="max-w-4xl w-full flex flex-col gap-3 relative">
                    {/* Feature Suggester */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {["WiFi Password", "Landlord Contact", "Rent Status", "Amenity Hours", "Maintenance"].map((feature) => (
                            <button
                                key={feature}
                                type="button"
                                className="whitespace-nowrap px-4 py-1.5 rounded-full text-[11px] font-black bg-background text-muted-foreground border border-border hover:border-primary hover:text-primary hover:bg-primary/5 transition-all active:scale-95"
                                onClick={() => {
                                    handleSend(feature);
                                }}
                            >
                                {feature}
                            </button>
                        ))}
                    </div>

                    <div className="relative group">
                        <div className="absolute -inset-[1px] bg-gradient-to-r from-primary/30 to-blue-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
                        <div className="relative flex items-end gap-2 bg-background/90 border border-border rounded-2xl p-2 focus-within:border-primary/50 transition-colors backdrop-blur-md">
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSend();
                                    }
                                }}
                                placeholder="Message iRis Assistant..."
                                disabled={isChatInitializing}
                                className="flex-1 bg-transparent border-none outline-none resize-none pt-2.5 px-3 min-h-[44px] max-h-[120px] text-sm text-foreground placeholder:text-muted-foreground custom-scrollbar"
                                rows={1}
                            />
                            <button
                                onClick={() => handleSend()}
                                disabled={!input.trim() || isChatInitializing}
                                className="size-10 shrink-0 flex items-center justify-center rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:hover:bg-primary"
                            >
                                <ArrowUp className="size-5" />
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-3 text-center mt-1">
                        <div className="flex items-center gap-1.5">
                            <AlertCircle className="size-3 text-muted-foreground/70 shrink-0" />
                            <p className="text-[10px] text-muted-foreground font-medium">
                                iRis can make mistakes. Verify important property and lease details.
                            </p>
                        </div>
                        <span className="hidden sm:inline text-muted-foreground/30 text-[10px]">•</span>
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="size-3 text-emerald-500/70 shrink-0" />
                            <p className="text-[10px] text-muted-foreground font-medium">
                                Conversations are monitored by AI specifically for building administration.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .no-scrollbar {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
}



